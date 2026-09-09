"""Inventory template actions; this is a coverage checklist, not evidence of execution."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]
rows = []
for path in sorted((root / 'frontend/src/app').rglob('*.html')):
    for match in re.finditer(r'<(button|a|input|select|textarea)\b[^>]*>', path.read_text(), re.S):
        tag = match.group(0)
        attrs = re.findall(r'(?:\(click\)|\(ngSubmit\)|\[?routerLink\]?|id|aria-label|formControlName)="([^"]*)"', tag)
        line = path.read_text()[:match.start()].count('\n') + 1
        rows.append((str(path.relative_to(root)), line, match[1], '; '.join(attrs).replace('|', '\\|')))
out = root / 'docs/testing/ui-action-inventory.md'
out.parent.mkdir(parents=True, exist_ok=True)
text = '# E-Bank UI action inventory\n\nGenerated from templates. Route smoke tests do not establish action coverage. Each unchecked row requires a behavior assertion and test reference. Conditional controls require browser exploration.\n\n'
text += '| ID | Source | Control | Binding or identifier | Behavior tested |\n|---|---|---|---|---|\n'
for i, (path, line, tag, binding) in enumerate(rows, 1):
    text += f'| UI-{i:03} | `{path}:{line}` | {tag} | {binding} | [ ] |\n'
out.write_text(text)
print(f'Inventoried {len(rows)} controls in {out}')
