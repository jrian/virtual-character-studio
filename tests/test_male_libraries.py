import copy
import tempfile
import unittest
import studio_server as server

class MaleLibraryTests(unittest.TestCase):
    def test_canonical_license_prevents_client_override_and_model_image_access(self):
        face=server.MALE_LIBRARY['portraits'][0]
        outfit=next(x for x in server.MALE_LIBRARY['outfits'] if x['aiImageAllowed'] is False)
        raw={'name':'Test','age':'30','gender':'男性','traits':['理性'],'reference':face,'outfit':copy.deepcopy(outfit),'studio':{'sources':{'person':'gallery','outfit':'gallery'}}}
        raw['outfit']['aiImageAllowed']=True
        c=server.snapshot(raw)
        self.assertFalse(c['outfit']['aiImageAllowed'])
        with tempfile.TemporaryDirectory() as tmp:
            refs=server.Studio(tmp).references(c)
        self.assertEqual([r['role'] for r in refs],['person'])
        small = next(x for x in server.MALE_LIBRARY['outfits'] if x['aiImageAllowed'])
        allowed = server.snapshot({**raw, 'outfit': small})
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual([r['role'] for r in server.Studio(tmp).references(allowed)], ['person', 'outfit'])
        prompt=server.make_prompt('design',c,refs)
        self.assertNotIn(outfit['originImage'],prompt)
        self.assertIn(outfit['keywords'],prompt)
        raw['outfit']['originImage']='https://raw.githubusercontent.com/untrusted/repo/main/file.png'
        with self.assertRaises(server.Problem):
            server.snapshot(raw)

    def test_unknown_github_images_are_not_added_to_allowlist(self):
        with self.assertRaises(server.Problem):
            server.snapshot({'reference':{'id':'unknown','full':'https://raw.githubusercontent.com/untrusted/repo/main/file.png'}})
