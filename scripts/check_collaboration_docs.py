#!/usr/bin/env python3
"""Comprueba skills, estructura del loop y enlaces Markdown locales sin red."""
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md', 'docs/STATUS.md',
    'docs/ARCHITECTURE.md', 'docs/DATA.md', 'loop/README.md', 'loop/PROMPT.md',
    'loop/templates/task.md', 'loop/templates/handoff.md', '.github/pull_request_template.md',
    '.github/ISSUE_TEMPLATE/task.md', '.github/ISSUE_TEMPLATE/bug.md',
]


def check(root):
    errors = [f'Falta {name}' for name in REQUIRED if not (root / name).is_file()]
    skills = sorted((root / '.agents/skills').glob('*/SKILL.md'))
    if len(skills) != 3:
        errors.append('Se esperan las tres skills del proyecto')
    for skill in skills:
        text = skill.read_text(encoding='utf-8')
        front = re.match(r'\A---\n(.*?)\n---\n', text, re.S)
        if not front:
            errors.append(f'{skill.relative_to(root)}: falta frontmatter')
            continue
        fields = dict(re.findall(r'^(name|description):\s*(.+)$', front.group(1), re.M))
        if fields.get('name') != skill.parent.name or not fields.get('description'):
            errors.append(f'{skill.relative_to(root)}: name/description inválidos')
    files = [root / 'README.md']
    for name in ['docs', 'loop', '.agents', '.github']:
        files.extend((root / name).rglob('*.md'))
    files += [root / 'AGENTS.md', root / 'CONTRIBUTING.md']
    for path in files:
        if not path.is_file():
            continue
        text = re.sub(r'^```[^\n]*\n.*?^```\s*$', '', path.read_text(encoding='utf-8'), flags=re.M | re.S)
        for target in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)', text):
            target = target.strip().split(' "', 1)[0].strip('<>')
            parts = urlsplit(target)
            if parts.scheme or parts.netloc or not parts.path:
                continue
            local = (path.parent / unquote(parts.path)).resolve()
            if not local.exists():
                errors.append(f'{path.relative_to(root)}: enlace local roto: {target}')
    tasks = sorted((root / 'loop/tasks').glob('*.md'))
    allowed = {'ready', 'active', 'review', 'done', 'blocked'}
    for task in tasks:
        if task.name == 'README.md':
            continue
        status = re.search(r'^- Estado: `([^`]+)`', task.read_text(encoding='utf-8'), re.M)
        if not status or status.group(1) not in allowed:
            errors.append(f'{task.relative_to(root)}: estado de tarea inválido')
    if errors:
        print('\n'.join('ERROR: ' + error for error in errors), file=sys.stderr)
        return 1
    print(f'OK: {len(skills)} skills, {len(tasks)-1} tareas y enlaces locales de {len(files)} documentos.')
    return 0


if __name__ == '__main__':
    sys.exit(check(ROOT))
