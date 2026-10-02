# Points an application's or library's ABP Vue dependencies at local tarballs.
# Used by the downstream installation checks before a candidate is on npm.
import glob
import json
import os
import sys

work = sys.argv[1]

with open('package.json') as file:
    manifest = json.load(file)

for group in ('dependencies', 'devDependencies'):
    for name in list(manifest.get(group, {})):
        if not name.startswith('@lsw-abpvue/'):
            continue

        matches = glob.glob(os.path.join(work, f"lsw-abpvue-{name.split('/')[1]}-[0-9]*.tgz"))
        if len(matches) != 1:
            raise SystemExit(f'Expected one tarball for {name} in {work}; found {len(matches)}.')

        manifest[group][name] = f'file:{matches[0]}'

with open('package.json', 'w') as file:
    json.dump(manifest, file, indent=2)
    file.write('\n')
