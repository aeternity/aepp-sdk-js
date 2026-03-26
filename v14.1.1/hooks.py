import subprocess
import re
import urllib.request

def pre_build(**kwargs):
  subprocess.run(['./docs/build-assets.sh'], check=True)

def replacer(match):
  filename = f"{match.group('filename')}.{match.group('extension')}"
  url = f"https://raw.githubusercontent.com/{match.group('user')}/{match.group('commit')}/{filename}"
  code = urllib.request.urlopen(url).read().decode('utf-8')
  extension = 'js' if match.group('extension') == 'vue' else match.group('extension')
  return '\n'.join(
    [f'``` {extension} title="{filename}"'] +
    code.split('\n')[int(match.group('begin')) - 1:int(match.group('end'))] +
    ['```', f'View at [GitHub]({match.group(0)})']
  )

def page_markdown(markdown, **kwargs):
  return re.sub(
    re.compile(
      r'^https://github.com/(?P<user>[\w/\-]+)/blob/(?P<commit>[0-9a-f]+)/(?P<filename>[\w\d\-/\.]+)\.(?P<extension>\w+)#L(?P<begin>\d+)-L(?P<end>\d+)$',
      re.MULTILINE,
    ),
    replacer,
    markdown,
  )
