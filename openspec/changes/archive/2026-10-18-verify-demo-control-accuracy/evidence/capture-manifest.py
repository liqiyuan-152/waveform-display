"""Run from the repository root before each verification batch; never overwrite an old manifest."""
import datetime
import hashlib
import json
import subprocess
import sys
from pathlib import Path

root = Path.cwd()
destination = Path(__file__).parent / sys.argv[1]
if destination.exists():
    raise SystemExit('Refusing to overwrite an existing evidence manifest')

def command(*args):
    return subprocess.check_output(args, cwd=root, text=True).strip()

paths = sorted({
    *root.joinpath('src').rglob('*.ts'),
    *root.joinpath('demo/src').rglob('*.ts'),
    *root.joinpath('demo/src').rglob('*.vue'),
    *root.joinpath('demo/src').rglob('*.css'),
    *root.joinpath('demo/src').rglob('*.json'),
    *root.joinpath('tests').rglob('*.ts'),
    root / 'package.json', root / 'pnpm-lock.yaml',
})
manifest = {
    'capturedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'head': command('git', 'rev-parse', 'HEAD'),
    'status': command('git', 'status', '--short'),
    'node': command('node', '--version'),
    'pnpm': command('pnpm', '--version'),
    'sourceSha256': {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest() for path in paths},
    'trackedDiff': command('git', 'diff', '--', 'src', 'demo', 'tests', 'package.json', 'pnpm-lock.yaml'),
    'command': ' '.join(sys.argv[2:]),
    'scope': 'Current source fingerprint only; browser conditions and case IDs are in browser-batch1.json. Not historical proof.',
}
destination.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(destination)
