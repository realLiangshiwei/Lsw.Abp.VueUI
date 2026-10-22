import argparse
import os
from pathlib import Path
import shutil
import subprocess


parser = argparse.ArgumentParser(description='Run the BookStore test backend.')
parser.add_argument('action', choices=['database', 'migrate', 'host'])
args = parser.parse_args()
if args.action == 'database':
    exists = subprocess.run(
        ['docker', 'container', 'inspect', 'abpvue-mongo'],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    ).returncode == 0
    command = ['docker', 'start', 'abpvue-mongo'] if exists else [
        'docker', 'run', '-d', '--name', 'abpvue-mongo',
        '-p', '127.0.0.1:27017:27017', '-v', 'abpvue_mongo_data:/data/db', 'mongo:8',
    ]
    os.execvp('docker', command)
system_dotnet = '/usr/local/share/dotnet/dotnet'
dotnet = os.environ.get('ABP_DOTNET') or (system_dotnet if Path(system_dotnet).is_file() else shutil.which('dotnet'))
if not dotnet:
    parser.error('Install the .NET SDK or set ABP_DOTNET explicitly.')
source = Path(__file__).resolve().parent / 'BookStore/src'
project = source / ('BookStore.DbMigrator' if args.action == 'migrate' else 'BookStore.HttpApi.Host')
command = [dotnet, 'run', '--no-launch-profile']
if args.action == 'host':
    command += ['--', '--urls', os.environ.get('ABP_BACKEND_URL', 'https://localhost:44384')]
os.chdir(project)
environment = {**os.environ, 'DOTNET_ROOT': str(Path(dotnet).parent)}
environment.setdefault('ASPNETCORE_ENVIRONMENT', 'Development')
os.execve(dotnet, command, environment)
