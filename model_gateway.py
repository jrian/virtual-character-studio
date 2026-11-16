"""Small OpenAI-compatible text/vision gateway. Secrets remain on the local server."""
import base64
import json
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request


class ModelError(Exception):
    pass


def base_url(value):
    u = urllib.parse.urlsplit(str(value).strip().rstrip('/'))
    local = u.hostname in ('localhost', '127.0.0.1', '::1')
    if (not u.hostname or u.username or u.password or u.query or u.fragment or
            (u.scheme != 'https' and not (local and u.scheme == 'http'))):
        raise ModelError('接口地址须为 HTTPS；本机 localhost／127.0.0.1 可使用 HTTP。不要在地址里填写密钥。')
    if u.path.endswith('/chat/completions'):
        raise ModelError('请填写 Base URL，不要包含末尾 /chat/completions。')
    return urllib.parse.urlunsplit((u.scheme, u.netloc, u.path.rstrip('/'), '', ''))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class ModelGateway:
    def __init__(self, directory):
        self.path = Path(directory) / 'ai-config.json'

    def config(self):
        return json.loads(self.path.read_text()) if self.path.exists() else {}

    def public(self):
        c = self.config()
        return {**{k: c.get(k, '') for k in ('baseUrl', 'textModel', 'visionModel')},
                'enabled': c.get('enabled') is True, 'hasKey': bool(c.get('apiKey')), 'configured': self.ready(c)}

    @staticmethod
    def ready(c):
        return bool(c.get('baseUrl') and c.get('textModel') and (c.get('apiKey') or urllib.parse.urlsplit(c['baseUrl']).hostname in ('localhost', '127.0.0.1', '::1')))

    def save(self, body):
        old = self.config()
        if body.get('clear') is True:
            self.path.unlink(missing_ok=True)
            return self.public()
        url = base_url(body.get('baseUrl', ''))
        key = body.get('apiKey', '')
        if not isinstance(key, str) or len(key) > 4096 or '\n' in key or '\r' in key:
            raise ModelError('API Key 格式不正确。')
        same_host = urllib.parse.urlsplit(old.get('baseUrl', '')).netloc == urllib.parse.urlsplit(url).netloc
        key = key.strip() or (old.get('apiKey', '') if same_host else '')
        c = {'enabled': body.get('enabled') is True, 'baseUrl': url, 'apiKey': key}
        for field in ('textModel', 'visionModel'):
            value = body.get(field, '')
            if not isinstance(value, str) or len(value) > 200 or '\n' in value:
                raise ModelError('模型名称格式不正确。')
            c[field] = value.strip()
        if not self.ready(c):
            raise ModelError('请填写文字模型名称和 API Key；更换服务域名后需重新填写密钥。本机无鉴权服务可留空密钥。')
        tmp = self.path.with_suffix('.tmp')
        tmp.write_text(json.dumps(c, ensure_ascii=False))
        tmp.chmod(0o600)
        tmp.replace(self.path)
        return self.public()

    def chat(self, model, content):
        c = self.config()
        if not self.ready(c):
            raise ModelError('请先保存 AI 模型接入配置。')
        data = json.dumps({'model': model, 'messages': [{'role': 'user', 'content': content}], 'stream': False}).encode()
        headers = {'Content-Type': 'application/json'}
        if c.get('apiKey'):
            headers['Authorization'] = 'Bearer ' + c['apiKey']
        req = urllib.request.Request(c['baseUrl'] + '/chat/completions', data=data, headers=headers, method='POST')
        try:
            # Deliberately no retries and no cross-host redirects with credentials.
            with urllib.request.build_opener(NoRedirect()).open(req, timeout=90) as response:
                raw = response.read(2 * 1024 * 1024 + 1)
            if len(raw) > 2 * 1024 * 1024:
                raise ModelError('模型响应过大，请缩短要求后重试。')
            value = json.loads(raw)
            text = value['choices'][0]['message']['content']
            if not isinstance(text, str) or not text.strip():
                raise ValueError()
            return text
        except urllib.error.HTTPError as exc:
            messages = {401: '密钥无效或已失效', 403: '账号或模型没有调用权限', 404: '接口地址或模型名称不正确', 429: '请求受限或额度不足'}
            raise ModelError('模型服务返回 HTTP %s：%s。' % (exc.code, messages.get(exc.code, '服务请求失败，请检查服务控制台'))) from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise ModelError('无法连接模型服务或请求超时。未自动重发，请检查地址和网络。') from None
        except (ValueError, KeyError, IndexError, TypeError):
            raise ModelError('服务未返回有效的 Chat Completions 文字内容，请确认接口兼容。') from None

    def test(self):
        c = self.config()
        self.chat(c.get('textModel', ''), '请只回复 OK。')
        return {'ok': True, 'message': '文字模型调用成功。识图需配置支持图片输入的模型并单独验证。'}

    def generate(self, prompt, refs, media_directory):
        c = self.config()
        if refs and not c.get('visionModel'):
            raise ModelError('本次有参考图，请配置识图模型，或将人物／服装来源改为仅文字并移除风格图和身份参考。')
        content = [{'type': 'text', 'text': prompt}]
        for ref in refs:
            content.append({'type': 'text', 'text': '以下图片用途：' + ref['role'] + '；' + ref['name']})
            url = ref['url']
            if ref.get('id'):
                files = list(Path(media_directory).glob(ref['id'] + '.*'))
                if len(files) != 1:
                    raise ModelError('参考图片缺失，请重新上传。')
                mime = {'.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp'}[files[0].suffix]
                url = 'data:' + mime + ';base64,' + base64.b64encode(files[0].read_bytes()).decode()
            content.append({'type': 'image_url', 'image_url': {'url': url}})
        return self.chat(c.get('visionModel') if refs else c.get('textModel'), content if refs else prompt)
