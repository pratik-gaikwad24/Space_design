"""
Optional maintenance tool (NOT needed to run or deploy the site).

Generates the animated service illustration(s) (inline SVG) for services.html
and their animation stylesheet css/services-art.css.

Usage (from the project root):
    python tools/build-service-art.py

Each illustration is written between marker comments in services.html:
    <!-- ART:<name> --> ... <!-- /ART:<name> -->

Animations are pure CSS (no inline styles or scripts, so the strict CSP holds).
They start when main.js adds .is-in to the figure, and are skipped for
visitors who prefer reduced motion (accessibility.css).
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

INK = "#2B3036"
BLUE = "#3F7196"
BLUE_DARK = "#2C5576"
LIT = "#F5D58A"
WHITE = "#FFFFFF"
GREEN = "#6F9A7B"
GREEN_DARK = "#557D61"


def svg(name, body, defs=""):
    return (f'<svg class="svc-art svc-art--{name}" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" '
            f'aria-hidden="true" focusable="false"><defs>{defs}</defs>{body}</svg>')


# ---------------------------------------------------------------------------
# 6. Interior design: a calm living room — daylight, a swinging pendant, a swaying plant
# ---------------------------------------------------------------------------
def art_interior():
    planks = "".join(f'<line x1="{400 + (x - 400) * 0.7:.0f}" y1="700" x2="{x}" y2="1000"/>' for x in range(40, 800, 120))
    defs = ('<linearGradient id="in-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CDB9A2"/><stop offset="1" stop-color="#A88E73"/></linearGradient>'
            '<linearGradient id="in-view" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C3D4E1"/><stop offset="1" stop-color="#EAF0F4"/></linearGradient>'
            '<linearGradient id="in-beam" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>'
            '<radialGradient id="in-glow"><stop offset="0" stop-color="#F5D58A" stop-opacity=".9"/><stop offset="1" stop-color="#F5D58A" stop-opacity="0"/></radialGradient>')
    room = (f'<rect width="800" height="1000" fill="#F2F0EC"/>'
            f'<polygon points="0,0 800,0 680,160 120,160" fill="{WHITE}"/>'
            f'<polygon points="0,0 120,160 120,700 0,1000" fill="#E4E1DC"/>'
            f'<polygon points="680,160 800,0 800,1000 680,700" fill="url(#in-view)"/>'
            f'<g stroke="{INK}" stroke-width="6"><line x1="720" y1="107" x2="720" y2="800"/><line x1="760" y1="53" x2="760" y2="900"/></g>'
            f'<polygon points="0,1000 120,700 680,700 800,1000" fill="url(#in-floor)"/>'
            f'<g stroke="{INK}" stroke-opacity=".08" stroke-width="2">{planks}</g>')
    beam = f'<polygon class="art-shimmer" points="680,700 800,1000 420,1000 540,700" fill="url(#in-beam)"/>'
    art = (f'<g class="art-fade ad-4"><rect x="196" y="250" width="172" height="150" fill="{WHITE}" stroke="{INK}" stroke-width="6"/>'
           f'<circle cx="256" cy="318" r="34" fill="{BLUE}"/><rect x="298" y="282" width="52" height="80" fill="#E9E4DD"/>'
           f'<path d="M214 384 H350" stroke="{INK}" stroke-width="3"/>'
           f'<rect x="432" y="272" width="112" height="112" fill="{WHITE}" stroke="{INK}" stroke-width="6"/>'
           f'<path d="M446 370 L486 300 L530 370 Z" fill="#C9A27E"/><circle cx="512" cy="300" r="12" fill="{LIT}"/></g>')
    rug = f'<polygon class="art-fade ad-6" points="226,724 574,724 650,868 150,868" fill="#E9E4DD"/>'
    sofa = (f'<g class="art-rise ad-7"><rect x="206" y="560" width="388" height="84" rx="18" fill="{BLUE}"/>'
            f'<rect x="188" y="628" width="424" height="62" rx="14" fill="#36658A"/>'
            f'<rect x="170" y="600" width="44" height="96" rx="14" fill="{BLUE_DARK}"/><rect x="586" y="600" width="44" height="96" rx="14" fill="{BLUE_DARK}"/>'
            f'<rect x="250" y="588" width="96" height="46" rx="12" fill="#E9E4DD"/><rect x="454" y="588" width="96" height="46" rx="12" fill="#D9A441" opacity=".85"/>'
            f'<rect x="200" y="690" width="10" height="20" fill="{INK}"/><rect x="590" y="690" width="10" height="20" fill="{INK}"/></g>')
    table = (f'<g class="art-rise ad-9"><ellipse cx="400" cy="776" rx="130" ry="26" fill="#15191D" opacity=".12"/>'
             f'<rect x="300" y="742" width="200" height="16" rx="8" fill="#C9A27E"/>'
             f'<rect x="318" y="758" width="10" height="34" fill="{INK}"/><rect x="472" y="758" width="10" height="34" fill="{INK}"/>'
             f'<rect x="340" y="722" width="48" height="20" rx="4" fill="{WHITE}"/><circle cx="440" cy="732" r="10" fill="{GREEN}"/></g>')
    plant = (f'<g class="art-rise ad-10"><rect x="628" y="626" width="58" height="74" rx="6" fill="#D9DEE2"/>'
             f'<g class="art-sway" fill="{GREEN}"><ellipse cx="657" cy="560" rx="22" ry="62"/><ellipse cx="628" cy="584" rx="16" ry="46" fill="{GREEN_DARK}"/>'
             f'<ellipse cx="688" cy="582" rx="16" ry="46" fill="{GREEN_DARK}"/></g></g>')
    lamp = (f'<g class="art-lamp"><line x1="400" y1="60" x2="400" y2="420" stroke="{INK}" stroke-width="3"/>'
            f'<circle class="art-glow" cx="400" cy="470" r="90" fill="url(#in-glow)"/>'
            f'<path d="M352 470 L370 420 H430 L448 470 Z" fill="{INK}"/><ellipse cx="400" cy="472" rx="18" ry="7" fill="{LIT}"/></g>')
    shelf = (f'<g class="art-fade ad-12"><polygon points="20,420 104,384 104,396 20,436" fill="#C9A27E"/>'
             f'<rect x="40" y="380" width="14" height="40" fill="{BLUE}"/><rect x="58" y="372" width="12" height="44" fill="{INK}"/><circle cx="86" cy="384" r="10" fill="{GREEN}"/></g>')
    body = room + beam + art + shelf + rug + sofa + table + plant + lamp
    return svg("interior", body, defs)


ARTS = {
    "interior": art_interior,
}

CSS_HEAD = """/* =====================================================================
   SPACE DESIGN — Animated service illustrations (services.html)
   Generated by tools/build-service-art.py — edit there, then re-run.
   Animations wait (paused) until main.js adds .is-in to the figure, so
   each scene plays as it scrolls into view. Without JS nothing is hidden;
   with reduced motion accessibility.css jumps straight to the end state.
   ===================================================================== */
.svc-media--art { aspect-ratio: 4 / 5; background: #F3F6F8; }
.svc-art { display: block; width: 100%; height: 100%; }
.art-text { font-family: var(--font-sans); }
.js [data-reveal="image"] .svc-art { transform: scale(1.06); transition: transform 2200ms var(--ease-out); }
.js [data-reveal="image"].is-in .svc-art { transform: scale(1); }
@media (max-width: 900px) {
  .svc-media--art { max-height: none; width: 100%; max-width: 460px; margin-inline: auto; }
}

/* Entrances (once) */
.js .svc-media--art .art-rise   { animation: art-rise 800ms cubic-bezier(.2,.7,.2,1) both paused; }
.js .svc-media--art .art-grow   { transform-box: fill-box; transform-origin: 50% 100%; animation: art-grow-y 1100ms cubic-bezier(.2,.7,.2,1) both paused; }
.js .svc-media--art .art-grow-x { transform-box: fill-box; transform-origin: 50% 50%; animation: art-grow-x 900ms cubic-bezier(.4,0,.2,1) both paused; }
.js .svc-media--art .art-pop    { transform-box: fill-box; transform-origin: 50% 100%; animation: art-pop 650ms cubic-bezier(.3,1.4,.5,1) both paused; }
.js .svc-art--planning .art-pop { transform-origin: 50% 50%; }
.js .svc-media--art .art-fade   { animation: art-fade 900ms ease both paused; }
.js .svc-media--art .art-fade--soft { animation-name: art-fade-soft; }
.js .svc-media--art .art-draw   { stroke-dasharray: 1; animation: art-draw 900ms cubic-bezier(.4,0,.2,1) both paused; }
.js .svc-media--art .art-draw--slow { animation-duration: 1600ms; }
.js .svc-media--art .art-dim    { animation: art-dim 1200ms ease 300ms both paused; }
.js .svc-media--art .art-light  { animation: art-light 500ms ease both paused; }
.js .svc-media--art .art-spin   { transform-box: fill-box; transform-origin: 50% 50%; animation: art-spin 1200ms cubic-bezier(.2,.7,.2,1) both paused; }
.js .svc-media--art .art-pencil { animation: art-pencil 1400ms cubic-bezier(.4,0,.2,1) 500ms both paused; }

/* Ambient (loop) */
.js .svc-media--art .art-drift  { animation: art-drift 14s ease-in-out infinite alternate paused; }
.js .svc-media--art .art-drift--slow { animation-duration: 20s; animation-direction: alternate-reverse; }
.js .svc-media--art .art-hook   { animation: art-hook 7s ease-in-out 2.4s infinite paused; }
.js .svc-media--art .art-float  { animation: art-float 5s ease-in-out 2.6s infinite paused; }
.js .svc-media--art .art-float--slow { animation-duration: 7s; animation-delay: 1s; }
.js .svc-media--art .art-wave   { transform-box: fill-box; transform-origin: 0 50%; animation: art-wave 2.4s ease-in-out infinite paused; }
.js .svc-media--art .art-blink  { animation: art-blink 1.6s ease-in-out infinite paused; }
.js .svc-media--art .art-drive  { animation: art-drive 9s linear 1.5s infinite paused; }
.js .svc-media--art .art-ants   { animation: art-ants 1.2s linear 2.6s infinite paused; }
.js .svc-media--art .art-shimmer { animation: art-shimmer 6s ease-in-out infinite paused; }
.js .svc-media--art .art-sway   { transform-box: fill-box; transform-origin: 50% 100%; animation: art-sway 5s ease-in-out infinite paused; }
.js .svc-media--art .art-lamp   { transform-box: fill-box; transform-origin: 50% 0; animation: art-sway 6s ease-in-out infinite paused; }
.js .svc-media--art .art-glow   { animation: art-shimmer 3.5s ease-in-out infinite paused; }
.js .svc-media--art.is-in * { animation-play-state: running; }
@media (prefers-reduced-motion: reduce) {
  .js .svc-media--art * { animation-delay: 0ms !important; }
  .js .svc-media--art .art-drive { animation: none !important; }
}
"""

KEYFRAMES = """
@keyframes art-rise    { from { opacity: 0; transform: translateY(36px); } to { opacity: 1; transform: none; } }
@keyframes art-grow-y  { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes art-grow-x  { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes art-pop     { 0% { opacity: 0; transform: scale(0); } 70% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes art-fade    { from { opacity: 0; } to { opacity: 1; } }
@keyframes art-fade-soft { from { opacity: 0; } to { opacity: .7; } }
@keyframes art-draw    { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes art-dim     { to { opacity: .4; } }
@keyframes art-light   { from { fill: #A9C3D6; } to { fill: #F5D58A; } }
@keyframes art-spin    { from { opacity: 0; transform: rotate(-200deg) scale(.6); } to { opacity: 1; transform: none; } }
@keyframes art-pencil  { from { transform: translate(0, 0); } to { transform: translate(408px, -40px); } }
@keyframes art-drift   { from { transform: translateX(-36px); } to { transform: translateX(36px); } }
@keyframes art-hook    { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-96px); } }
@keyframes art-float   { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes art-wave    { 0%, 100% { transform: skewY(0); } 50% { transform: skewY(-9deg); } }
@keyframes art-blink   { 0%, 100% { opacity: 1; } 50% { opacity: .15; } }
@keyframes art-drive   { from { transform: translateX(-140px); } to { transform: translateX(940px); } }
@keyframes art-ants    { to { stroke-dashoffset: -48; } }
@keyframes art-shimmer { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes art-sway    { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
"""


def build_css():
    """Stylesheet with only the rules and keyframes the generated illustrations use."""
    markup = "".join(fn() for fn in ARTS.values())
    used = {c for group in re.findall(r'class="([^"]+)"', markup) for c in group.split()}
    delays = sorted({int(c[3:]) for c in used if re.fullmatch(r"ad-\d+", c)})
    lines = []
    for line in CSS_HEAD.split("\n"):
        names = re.findall(r"\.(art-[a-z-]+)", line)
        if names and not all(n in used for n in names):
            continue
        lines.append(line)
    head = "\n".join(lines)
    anims = set(re.findall(r"animation(?:-name)?:\s*(art-[a-z-]+)", head))
    frames = "\n".join(l for l in KEYFRAMES.split("\n") if not l.startswith("@keyframes") or l.split()[1] in anims)
    delay_css = "\n".join(f".js .svc-media--art .ad-{n} {{ animation-delay: {n * 100}ms; }}" for n in delays)
    return head + "\n/* Entrance delays: .ad-N waits N x 100 ms */\n" + delay_css + "\n" + frames


def main():
    page = ROOT / "services.html"
    html = page.read_text(encoding="utf-8")
    for name, fn in ARTS.items():
        pattern = re.compile(r"(<!-- ART:%s -->)(.*?)(<!-- /ART:%s -->)" % (name, name), re.S)
        if not pattern.search(html):
            raise SystemExit(f"marker ART:{name} not found in services.html")
        html = pattern.sub(lambda m: m.group(1) + fn() + m.group(3), html)
    with open(page, "w", encoding="utf-8", newline="") as f:
        f.write(html)
    with open(ROOT / "css" / "services-art.css", "w", encoding="utf-8", newline="") as f:
        f.write(build_css())
    print("updated services.html and css/services-art.css")


if __name__ == "__main__":
    main()
