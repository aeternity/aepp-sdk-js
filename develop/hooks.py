import os.path
import subprocess

def pre_build(**kwargs):
  if not os.path.exists('node_modules'):
    subprocess.run(['npm', 'install'], check=True)
  subprocess.run(['npm', 'run', 'docs:examples'], check=True)
  # subprocess.run(['npm', 'run', 'docs:api'], check=True)
