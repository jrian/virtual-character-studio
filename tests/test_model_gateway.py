import json
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch
from model_gateway import ModelGateway, ModelError, base_url
from studio_server import Studio, Problem


class GatewayTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.gateway = ModelGateway(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def config(self, **extra):
        return dict(baseUrl='https://provider.example/v1', textModel='my-model', visionModel='', enabled=True, apiKey='test-private-key', **extra)

    def test_secret_storage_public_redaction_and_domain_change(self):
        c = self.config()
        result = self.gateway.save(c)
        self.assertTrue(result['configured'])
        self.assertNotIn('test-private-key', json.dumps(result))
        self.assertEqual(self.gateway.path.stat().st_mode & 0o777, 0o600)
        c['apiKey'] = ''
        self.gateway.save(c)
        self.assertEqual(self.gateway.config()['apiKey'], 'test-private-key')
        c['baseUrl'] = 'https://different.example/v1'
        with self.assertRaises(ModelError):
            self.gateway.save(c)
        self.gateway.save({'clear': True})
        self.assertFalse(self.gateway.public()['configured'])

    def test_address_validation(self):
        self.assertEqual(base_url('http://localhost:11434/v1/'), 'http://localhost:11434/v1')
        for u in ['http://remote.example/v1', 'https://user:secret@provider.example', 'https://provider.example?key=x', 'https://provider.example/v1/chat/completions']:
            with self.assertRaises(ModelError):
                base_url(u)

    def test_local_fake_provider_connection_and_generation(self):
        seen = []
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                seen.append((self.path, self.headers.get('Authorization'), body))
                content = 'OK' if body['messages'][0]['content'] == '请只回复 OK。' else json.dumps({'features': {'eyes': '杏眼'}, 'sections': [['人物概览', '测试角色']], 'observations': {}})
                data = json.dumps({'choices': [{'message': {'content': content}}]}).encode()
                self.send_response(200)
                self.end_headers()
                self.wfile.write(data)
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            c = self.config();c['baseUrl'] = 'http://127.0.0.1:' + str(server.server_port) + '/v1'
            self.gateway.save(c)
            self.assertTrue(self.gateway.test()['ok'])
            studio = Studio(self.tmp.name)
            job = studio.create_job({'kind': 'design', 'requestId': 'model-test-123', 'conditions': {'studio': {}}}, launch=False)
            studio.run(job['id'])
            final = studio.job(job['id'])
            self.assertEqual(final['status'], 'done')
            self.assertEqual(final['providerName'], '已接入模型')
            self.assertNotIn('test-private-key', json.dumps(final))
            self.assertEqual(len(seen), 2)
            self.assertEqual(seen[0][0], '/v1/chat/completions')
            self.assertEqual(seen[0][1], 'Bearer test-private-key')
            self.assertEqual(seen[1][2]['model'], 'my-model')
            with self.assertRaises(Problem):
                studio.create_job({'kind': 'preview', 'requestId': 'no-image-model', 'conditions': {'studio': {}}}, launch=False)
        finally:
            server.shutdown();server.server_close()

    def test_vision_requires_explicit_model_and_uses_role_label(self):
        self.gateway.save(self.config())
        with self.assertRaises(ModelError):
            self.gateway.generate('test', [{'role': 'person', 'name': 'reference', 'url': 'https://image.example/a.png'}], self.tmp.name)
        c = self.config();c['visionModel'] = 'vision-id';self.gateway.save(c)
        with patch.object(self.gateway, 'chat', return_value='ok') as chat:
            self.gateway.generate('test', [{'role': 'outfit', 'name': 'coat', 'url': 'https://image.example/a.png'}], self.tmp.name)
            self.assertEqual(chat.call_args[0][0], 'vision-id')
            self.assertIn('outfit', chat.call_args[0][1][1]['text'])


if __name__ == '__main__':
    unittest.main()
