"""
Optional maintenance tool (NOT needed to run or deploy the site).

Copies the shared header / footer / script partials from /partials into every
public HTML page between marker comments, so edits to a phone number or a nav
link are made once and applied everywhere.

Usage (from the project root):
    python tools/sync-partials.py

Markers inside each page:
    <!-- PARTIAL:header -->  ...  <!-- /PARTIAL:header -->
    <!-- PARTIAL:footer -->  ...  <!-- /PARTIAL:footer -->
    <!-- PARTIAL:scripts --> ...  <!-- /PARTIAL:scripts -->

The current page is read from <body data-page="...">, which sets
aria-current="page" on the matching navigation links.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
PARTIALS = {name: (ROOT / "partials" / f"{name}.html").read_text(encoding="utf-8")
            for name in ("header", "footer", "scripts")}
PAGES = ["index", "about", "services", "portfolio", "portfolio-detail", "contact",
         "privacy-policy", "terms", "cookie-policy", "refund-policy", "accessibility", "404"]
NAV_KEYS = ["home", "about", "services", "portfolio", "contact"]


def render(template: str, page_key: str, root: str) -> str:
    out = template.replace("{{root}}", root)
    for key in NAV_KEYS:
        out = out.replace("{{current:%s}}" % key, ' aria-current="page"' if key == page_key else "")
    return out.strip("\n")


def sync(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    m = re.search(r'<body[^>]*data-page="([^"]+)"', html)
    page_key = m.group(1) if m else ""
    page_key = {"project": "portfolio"}.get(page_key, page_key)
    root = "/" if path.stem == "404" else ""   # 404 may be served from any path
    changed = html
    for name, tpl in PARTIALS.items():
        pattern = re.compile(r"(<!-- PARTIAL:%s -->)(.*?)(<!-- /PARTIAL:%s -->)" % (name, name), re.S)
        changed = pattern.sub(lambda mm: f"{mm.group(1)}\n{render(tpl, page_key, root)}\n{mm.group(3)}", changed)
    if changed != html:
        path.write_text(changed, encoding="utf-8")
        return True
    return False


if __name__ == "__main__":
    for page in PAGES:
        p = ROOT / f"{page}.html"
        if p.exists():
            print(("updated  " if sync(p) else "unchanged") + f"  {p.name}")
