import os.path
import subprocess

def pre_build(**kwargs):
  if not os.path.exists('node_modules'):
    subprocess.run(['npm', 'install', '--ignore-scripts'], check=True)
  subprocess.run(['npm', 'run', 'build:api'], check=True)
  subprocess.run(['npm', 'run', 'docs:examples'], check=True)
  subprocess.run(['npm', 'run', 'docs:api'], check=True)
