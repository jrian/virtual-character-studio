import base64
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from unittest.mock import patch

import studio_server as server

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9sAAAAASUVORK5CYII=')


class FakeClient:
    def __init__(self, result=None, status='done'):
        self.result = result if result is not None else {'items': [{'text': json.dumps({'features': {'eyes': '杏眼'}, 'observations': {}, 'uncertain': ''})}]}
        self.status = status
        self.sends = 0
        self.confirms = 0

    def send(self, **kwargs):
        self.sends += 1
        self.last = kwargs
        return 'fake-thread'

    def poll(self, *args, **kwargs):
        return self.status

    def get_result(self, *args):
        return self.result

    def confirm(self, *args):
        self.confirms += 1

    def upload_file(self, path):
        return 'https://assets.lovart.ai/test.png'

    def download_artifacts(self, result, output_dir):
        path = Path(output_dir) / 'fake.png'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(PNG)
        return [{'local_path': str(path)}]


class ServerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.client = FakeClient()
        self.studio = server.Studio(self.tmp.name, client_factory=lambda: self.client)
        self.studio.data['projectId'] = 'fake-project'
        self.c = {'name': '林知遥', 'age': '25', 'traits': ['温柔'], 'studio': {}}

    def tearDown(self):
        self.tmp.cleanup()

    def create(self, kind='design', request='request-12345'):
        return self.studio.create_job({'kind': kind, 'requestId': request, 'conditions': self.c}, launch=False)

    def test_upload_limits_and_missing_media(self):
        asset = self.studio.upload(PNG, '../../私人.png')
        self.assertEqual(asset['name'], '私人.png')
        self.assertNotIn('file', asset)
        self.assertEqual(self.studio.asset(asset['id'])['kind'], 'upload')
        for data in (b'<svg onload="alert(1)">', b'', b'x' * (server.MAX_IMAGE + 1)):
            with self.assertRaises(server.Problem):
                self.studio.upload(data, 'bad.png')
        with self.assertRaises(server.Problem):
            self.studio.asset('a' * 32)

    def test_duplicate_requests_and_concurrency_never_resubmit(self):
        job = self.create()
        self.assertEqual(self.create()['id'], job['id'])
        with self.assertRaises(server.Problem) as error:
            self.create(request='second-request')
        self.assertEqual(error.exception.status, 409)
        self.assertEqual(self.client.sends, 0)

    def test_extraction_is_structured_and_no_media_required(self):
        asset = self.studio.upload(PNG, '人物.png')
        self.c['studio'] = {'sources': {'person': 'upload'}, 'uploads': {'person': asset}}
        job = self.create('extract')
        self.studio.run(job['id'])
        out = self.studio.job(job['id'])
        self.assertEqual(out['status'], 'done')
        self.assertEqual(out['result']['features']['eyes'], '杏眼')
        self.assertIn('不调用图片', self.client.last['prompt'])
        self.assertEqual(len(self.client.last['attachments']), 1)

    def test_no_image_and_rejected_references_are_failures(self):
        for result in ({'items': [{'text': 'cannot generate'}]}, {'failures': [{'reason': 'rejected'}], 'items': []}):
            self.client.result = result
            job = self.create('preview', 'request-' + str(len(self.studio.data['jobs'])))
            self.studio.run(job['id'])
            self.assertEqual(self.studio.job(job['id'])['status'], 'failed')
            self.assertNotIn('result', self.studio.job(job['id']))

    def test_timeout_and_confirmation_resume_without_a_new_generation(self):
        self.client.status = 'timeout'
        job = self.create('preview')
        self.studio.run(job['id'])
        self.assertEqual(self.studio.job(job['id'])['status'], 'timeout')
        self.client.status = 'pending_confirmation'
        self.client.result = {'pending_confirmation': {'description': 'review credits'}}
        self.studio.run(job['id'], 'poll')
        self.assertEqual(self.studio.job(job['id'])['status'], 'pending_confirmation')
        self.assertEqual(self.client.confirms, 0)
        self.client.status = 'done'
        self.client.result = {'items': [{'artifacts': [{'type': 'image', 'content': 'https://assets.lovart.ai/a.png'}]}]}
        self.studio.run(job['id'], 'confirm')
        final = self.studio.job(job['id'])
        self.assertEqual(final['status'], 'done')
        self.assertEqual(self.client.sends, 1)
        self.assertEqual(self.client.confirms, 1)
        self.assertEqual(self.studio.asset(final['result']['preview']['id'])['kind'], 'preview')

    def test_malformed_text_does_not_become_a_character(self):
        self.client.result = {'items': [{'text': 'not JSON <script>alert(1)</script>'}]}
        job = self.create()
        self.studio.run(job['id'])
        self.assertEqual(self.studio.job(job['id'])['status'], 'invalid')
        self.assertIn('not JSON', self.studio.job(job['id'])['result']['rawText'])

    def test_restart_preserves_remote_ids_and_does_not_send(self):
        job = self.create()
        self.studio.update(job['id'], status='running', threadId='existing-thread')
        restored = server.Studio(self.tmp.name, client_factory=lambda: self.client)
        self.assertEqual(restored.job(job['id'])['status'], 'interrupted')
        self.assertEqual(self.client.sends, 0)

    def test_snapshot_filters_credentials_and_rejects_unbound_urls(self):
        data = server.snapshot({**self.c, 'apiKey': 'private', 'studio': {'secretKey': 'private'}})
        self.assertNotIn('private', json.dumps(data))
        with self.assertRaises(server.Problem):
            server.snapshot({**self.c, 'reference': {'full': 'http://localhost/private'}})

    def test_local_http_boundaries(self):
        httpd = server.ThreadingHTTPServer(('127.0.0.1', 0), server.handler_for(self.studio))
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        origin = 'http://127.0.0.1:' + str(httpd.server_port)
        try:
            health = json.load(urllib.request.urlopen(origin + '/api/health'))
            self.assertNotIn('secret', json.dumps(health))
            for host, origin_header in [('evil.test', origin), ('127.0.0.1:' + str(httpd.server_port), 'https://evil.test')]:
                req = urllib.request.Request(origin + '/api/uploads', data=PNG, headers={'Host': host, 'Origin': origin_header, 'X-Studio-Request': '1'})
                with self.assertRaises(urllib.error.HTTPError) as error:
                    urllib.request.urlopen(req)
                self.assertEqual(error.exception.code, 403)
            req = urllib.request.Request(origin + '/api/uploads', data=PNG, headers={'Origin': origin, 'X-Studio-Request': '1'})
            asset = json.load(urllib.request.urlopen(req))
            self.assertEqual(urllib.request.urlopen(origin + asset['url']).read(), PNG)
        finally:
            httpd.shutdown()
            httpd.server_close()


if __name__ == '__main__':
    unittest.main()
