# Points a package's `@lsw-abpvue/*` development dependencies at tarballs in a directory,
# so a package created by `abpv create-lib` can be installed before anything is on npm.
# Used by check-create-lib.sh; it edits the package.json in the working directory.
import glob
import json
import os
import sys

work = sys.argv[1]

with open('package.json') as file:
    manifest = json.load(file)

for name in list(manifest.get('devDependencies', {})):
    if not name.startswith('@lsw-abpvue/'):
        continue

    matches = glob.glob(os.path.join(work, f"lsw-abpvue-{name.split('/')[1]}-*.tgz"))
    if not matches:
        raise SystemExit(f'No tarball for {name} in {work}.')

    manifest['devDependencies'][name] = f'file:{matches[0]}'

with open('package.json', 'w') as file:
    json.dump(manifest, file, indent=2)
    file.write('\n')
