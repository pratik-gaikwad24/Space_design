"""
Optional maintenance tool (NOT needed to run or deploy the site).

Generates the six animated service illustrations (inline SVG) for services.html
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
GLASS = "#A9C3D6"
GLASS_DARK = "#8FB0C8"
LIT = "#F5D58A"
GREY_1 = "#E3E7EA"
GREY_2 = "#C9CFD4"
WHITE = "#FFFFFF"
PAPER = "#F7F8F9"
CRANE = "#D9A441"
GREEN = "#6F9A7B"
GREEN_DARK = "#557D61"


def svg(name, body, defs=""):
    return (f'<svg class="svc-art svc-art--{name}" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" '
            f'aria-hidden="true" focusable="false"><defs>{defs}</defs>{body}</svg>')


def sky(pid, top="#CFDDE8", bottom="#F3F6F8"):
    return (f'<linearGradient id="{pid}" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>')


def clouds():
    return (f'<g class="art-drift" fill="{WHITE}"><ellipse cx="170" cy="190" rx="72" ry="22"/><ellipse cx="216" cy="174" rx="46" ry="27"/></g>'
            f'<g class="art-drift art-drift--slow" fill="{WHITE}" opacity=".8"><ellipse cx="560" cy="330" rx="60" ry="18"/><ellipse cx="594" cy="316" rx="36" ry="20"/></g>')


def ground(y=860):
    return f'<rect y="{y}" width="800" height="{1000 - y}" fill="{GREY_1}"/><rect y="{y - 4}" width="800" height="6" fill="{GREY_2}"/>'


def crane(mast_x, top_y, base_y, jib_from, jib_to, hook_x, hook_len, cls="art-crane"):
    """Tower crane: lattice mast, jib, counterweight, and a hook that travels along the jib."""
    zig = " ".join(f"L{mast_x + (14 if i % 2 else 0)} {y}" for i, y in enumerate(range(top_y + 20, base_y, 28)))
    jzig = " ".join(f"L{x} {top_y + (14 if i % 2 else 0)}" for i, x in enumerate(range(jib_from + 20, jib_to, 24)))
    return (f'<g class="{cls}">'
            f'<rect x="{mast_x}" y="{top_y}" width="14" height="{base_y - top_y}" fill="none" stroke="{CRANE}" stroke-width="4"/>'
            f'<path d="M{mast_x} {top_y + 20} {zig}" fill="none" stroke="{CRANE}" stroke-width="2.5"/>'
            f'<rect x="{jib_from}" y="{top_y}" width="{jib_to - jib_from}" height="14" fill="none" stroke="{CRANE}" stroke-width="4"/>'
            f'<path d="M{jib_from} {top_y} {jzig}" fill="none" stroke="{CRANE}" stroke-width="2.5"/>'
            f'<path d="M{mast_x - 4} {top_y} L{mast_x + 7} {top_y - 46} L{mast_x + 18} {top_y}" fill="none" stroke="{CRANE}" stroke-width="4"/>'
            f'<rect x="{mast_x - 8}" y="{top_y + 14}" width="30" height="24" fill="{CRANE}"/>'
            f'<rect x="{jib_to - 56}" y="{top_y + 14}" width="44" height="30" fill="#8E99A3"/>'
            f'<g class="art-hook"><rect x="{hook_x - 10}" y="{top_y + 10}" width="20" height="10" fill="{INK}"/>'
            f'<line x1="{hook_x}" y1="{top_y + 20}" x2="{hook_x}" y2="{top_y + hook_len}" stroke="{INK}" stroke-width="2"/>'
            f'<rect x="{hook_x - 34}" y="{top_y + hook_len}" width="68" height="22" fill="{BLUE}"/></g>'
            f'</g>')


# ---------------------------------------------------------------------------
# 1. Redevelopment: the old low-rise fades, a new tower rises, PMC checks tick off
# ---------------------------------------------------------------------------
def art_redevelopment():
    old_wins = "".join(f'<rect x="{x}" y="{y}" width="30" height="24" fill="#8E99A3"/>'
                       for y in (712, 752) for x in (102, 146, 202, 246))
    floors = []
    for i in range(11):
        y = 860 - 50 * (i + 1)
        wins = "".join(f'<rect x="{x}" y="{y + 10}" width="36" height="30" fill="{GLASS}"/>' for x in (397, 447, 497, 547))
        floors.append(f'<g class="art-rise ad-{8 + i}"><rect x="380" y="{y}" width="220" height="50" fill="{WHITE}"/>'
                      f'<rect x="380" y="{y + 46}" width="220" height="4" fill="{INK}" opacity=".12"/>{wins}'
                      f'<rect x="590" y="{y + 8}" width="14" height="38" fill="{BLUE}" opacity=".85"/></g>')
    lobby = (f'<g class="art-rise ad-7"><rect x="380" y="810" width="220" height="50" fill="{WHITE}"/>'
             f'<rect x="398" y="820" width="184" height="40" fill="{GLASS_DARK}"/><rect x="472" y="826" width="36" height="34" fill="{INK}"/></g>')
    crown = (f'<g class="art-rise ad-20"><rect x="370" y="296" width="240" height="14" fill="{INK}"/>'
             f'<rect x="450" y="266" width="80" height="30" fill="{BLUE}"/></g>')
    ticks = "".join(
        f'<circle cx="94" cy="{cy}" r="13" fill="{WHITE}" stroke="{BLUE}" stroke-width="3"/>'
        f'<path class="art-draw ad-{d}" pathLength="1" d="M87 {cy} l5 6 l10 -12" fill="none" stroke="{BLUE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
        f'<rect x="120" y="{cy - 6}" width="{w}" height="12" rx="6" fill="{GREY_1}"/>'
        for cy, d, w in ((466, 12, 140), (512, 17, 118), (558, 22, 132)))
    card = (f'<g class="art-float"><g class="art-rise ad-3"><g transform="translate(0 -96)">'
            f'<rect x="68" y="394" width="230" height="200" rx="8" fill="#15191D" opacity=".08"/>'
            f'<rect x="60" y="386" width="230" height="200" rx="8" fill="{WHITE}"/>'
            f'<path d="M60 394 a8 8 0 0 1 8 -8 h214 a8 8 0 0 1 8 8 v34 h-230 z" fill="{BLUE}"/>'
            f'<text class="art-text" x="80" y="414" fill="{WHITE}" font-size="17" font-weight="700" letter-spacing="2">PMC</text>'
            f'{ticks}</g></g></g>')
    body = (f'<rect width="800" height="1000" fill="url(#rd-sky)"/>'
            f'<circle cx="620" cy="160" r="64" fill="{WHITE}" opacity=".75"/>{clouds()}{ground()}'
            f'<g class="art-dim"><rect x="70" y="680" width="230" height="14" fill="#A9B2BA"/>'
            f'<rect x="80" y="694" width="210" height="166" fill="#C3CAD0"/>{old_wins}'
            f'<rect x="166" y="800" width="38" height="60" fill="#8E99A3"/></g>'
            f'<path class="art-draw ad-6" pathLength="1" d="M190 668 C 200 560, 270 520, 350 520" fill="none" stroke="{BLUE}" stroke-width="4" stroke-linecap="round"/>'
            f'<path class="art-pop ad-14" d="M340 506 L362 520 L340 534 Z" fill="{BLUE}"/>'
            f'{lobby}{"".join(floors)}{crown}'
            f'<g class="art-fade ad-2">{crane(650, 230, 860, 410, 770, 560, 24)}</g>{card}')
    return svg("redevelopment", body, sky("rd-sky"))


# ---------------------------------------------------------------------------
# 2. Self-redevelopment: the society builds for itself; members gather, homes light up
# ---------------------------------------------------------------------------
def art_self_redevelopment():
    lit = {(0, 1): 9, (1, 0): 11, (1, 2): 12, (2, 1): 14, (3, 0): 15, (3, 2): 17,
           (4, 1): 18, (5, 0): 20, (6, 2): 21, (7, 1): 23, (8, 0): 24, (8, 2): 26}
    wins = []
    for r in range(10):
        for c, x in enumerate((312, 378, 444)):
            y = 778 - r * 46
            if (r, c) in lit:
                wins.append(f'<rect class="art-light ad-{lit[(r, c)]}" x="{x}" y="{y}" width="44" height="30" fill="{GLASS}"/>')
            else:
                wins.append(f'<rect x="{x}" y="{y}" width="44" height="30" fill="{GLASS}"/>')
    tower = (f'<g class="art-grow ad-2"><rect x="290" y="340" width="220" height="520" fill="{WHITE}"/>'
             f'<rect x="490" y="340" width="20" height="520" fill="{GREY_1}"/>{"".join(wins)}'
             f'<rect x="380" y="818" width="40" height="42" fill="{INK}"/><rect x="280" y="328" width="240" height="14" fill="{INK}"/></g>')
    flag = (f'<g class="art-pop ad-8"><line x1="400" y1="328" x2="400" y2="262" stroke="{INK}" stroke-width="4"/>'
            f'<path class="art-wave" d="M402 264 h46 l-10 13 l10 13 h-46 z" fill="{BLUE}"/></g>')
    badge = (f'<g class="art-pop ad-4"><circle cx="640" cy="230" r="82" fill="{WHITE}" opacity=".6"/>'
             f'<circle cx="640" cy="230" r="72" fill="{WHITE}"/>'
             f'<path d="M604 246 L640 212 L676 246 M615 238 V270 H665 V238" fill="none" stroke="{INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>'
             f'<rect x="632" y="248" width="16" height="22" fill="{BLUE}"/></g>'
             f'<path class="art-draw art-draw--slow ad-6" pathLength="1" d="M640 158 a72 72 0 1 1 0 144 a72 72 0 1 1 0 -144" fill="none" stroke="{BLUE}" stroke-width="8" stroke-linecap="round"/>')
    people = []
    for i, (x, col) in enumerate(((100, BLUE), (160, INK), (220, GLASS_DARK), (580, CRANE), (640, BLUE), (700, INK))):
        people.append(f'<g class="art-pop ad-{10 + i * 2}"><circle cx="{x}" cy="792" r="13" fill="{INK}"/>'
                      f'<rect x="{x - 16}" y="810" width="32" height="50" rx="14" fill="{col}"/></g>')
    hands = (f'<path class="art-draw ad-24" pathLength="1" d="M116 830 Q130 846 144 830 Q190 846 204 830" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
             f'<path class="art-draw ad-25" pathLength="1" d="M596 830 Q610 846 624 830 Q670 846 684 830" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
    body = (f'<rect width="800" height="1000" fill="url(#sr-sky)"/>{clouds()}{ground()}'
            f'{tower}{flag}{badge}{"".join(people)}{hands}')
    return svg("self-redevelopment", body, sky("sr-sky", "#D6E2EA", "#F5F7F9"))


# ---------------------------------------------------------------------------
# 3. Development: a mixed-use district rises — towers, shopfronts, street life
# ---------------------------------------------------------------------------
def art_development():
    def tower(x, w, top, fill, delay, cols, glass=GLASS):
        rows = []
        for y in range(top + 24, 780, 34):
            for c in range(cols):
                gx = x + 16 + c * ((w - 32 - 16) / max(cols - 1, 1)) if cols > 1 else x + w / 2 - 8
                rows.append(f'<rect x="{gx:.0f}" y="{y}" width="16" height="20" fill="{glass}"/>')
        return (f'<g class="art-grow ad-{delay}"><rect x="{x}" y="{top}" width="{w}" height="{800 - top}" fill="{fill}"/>'
                f'<rect x="{x + w - 12}" y="{top}" width="12" height="{800 - top}" fill="{INK}" opacity=".06"/>{"".join(rows)}'
                f'<rect x="{x - 6}" y="{top - 10}" width="{w + 12}" height="10" fill="{INK}"/></g>')
    shops = "".join(
        f'<rect x="{x}" y="826" width="96" height="54" fill="{GLASS_DARK}"/>'
        f'<rect x="{x - 6}" y="808" width="108" height="18" fill="url(#dv-stripe)"/>'
        for x in (82, 202, 322, 442, 562))
    podium = (f'<g class="art-rise ad-1"><rect x="60" y="800" width="680" height="80" fill="{WHITE}"/>{shops}'
              f'<rect x="60" y="796" width="680" height="6" fill="{INK}" opacity=".7"/></g>')
    trees = "".join(f'<g class="art-pop ad-{16 + i}"><rect x="{x - 3}" y="868" width="6" height="22" fill="{GREEN_DARK}"/>'
                    f'<circle cx="{x}" cy="858" r="18" fill="{GREEN}"/></g>' for i, x in enumerate((40, 300, 520, 770)))
    dashes = "".join(f'<rect x="{x}" y="938" width="40" height="5" fill="{WHITE}"/>' for x in range(20, 800, 90))
    car = (f'<g class="art-drive"><rect x="0" y="906" width="92" height="26" rx="8" fill="{BLUE}"/>'
           f'<path d="M18 906 l12 -18 h34 l12 18 z" fill="{BLUE_DARK}"/><circle cx="22" cy="934" r="9" fill="{INK}"/><circle cx="70" cy="934" r="9" fill="{INK}"/></g>')
    beacon = f'<circle class="art-blink" cx="476" cy="168" r="6" fill="#D9534F"/>'
    defs = (sky("dv-sky", "#CCDBE7", "#F2F5F8") +
            f'<pattern id="dv-stripe" width="24" height="18" patternUnits="userSpaceOnUse"><rect width="12" height="18" fill="{BLUE}"/><rect x="12" width="12" height="18" fill="{WHITE}"/></pattern>')
    body = (f'<rect width="800" height="1000" fill="url(#dv-sky)"/><circle cx="660" cy="150" r="58" fill="{WHITE}" opacity=".75"/>{clouds()}'
            f'<rect y="880" width="800" height="120" fill="{GREY_2}"/><rect y="880" width="800" height="12" fill="{GREY_1}"/>{dashes}'
            f'{tower(78, 150, 520, WHITE, 3, 3)}{tower(246, 172, 300, PAPER, 5, 4, "#9DBBD0")}'
            f'{tower(436, 140, 440, WHITE, 7, 3)}{tower(594, 150, 600, PAPER, 9, 3)}'
            f'<g class="art-pop ad-13">{crane(372, 180, 290, 250, 486, 300, 70)}{beacon}</g>'
            f'{podium}{trees}{car}')
    return svg("development", body, defs)


# ---------------------------------------------------------------------------
# 4. Architecture: an elevation drawn line by line on a drafting sheet
# ---------------------------------------------------------------------------
def art_architecture():
    lines = [
        "M110 820 H690",                         # ground line
        "M220 820 V320", "M580 820 V300",         # building edges
        "M196 322 L604 282",                      # sloped roof canopy
    ]
    for y in range(372, 820, 56):                 # floor slabs
        lines.append(f"M220 {y} H580")
    lines += ["M340 320 V820", "M460 308 V820"]   # structural fins
    draw = "".join(f'<path class="art-draw ad-{2 + i}" pathLength="1" d="{d}"/>' for i, d in enumerate(lines))
    glass = "".join(f'<rect x="{x}" y="{y + 8}" width="{w}" height="40" fill="{GLASS}"/>'
                    for y in range(372, 764, 56) for x, w in ((232, 96), (352, 96), (472, 96)))
    balconies = "".join(f'<path d="M580 {y + 40} h34 v8 h-34" fill="none" stroke="{BLUE_DARK}" stroke-width="2"/>' for y in range(372, 764, 112))
    dims = (f'<g class="art-fade ad-20" stroke="{BLUE}" stroke-width="2" fill="none">'
            f'<path d="M168 320 V820 M158 320 h20 M158 820 h20"/><path d="M220 868 H580 M220 858 v20 M580 858 v20"/></g>'
            f'<g class="art-fade ad-21 art-text" fill="{BLUE_DARK}" font-size="18" letter-spacing="1">'
            f'<text x="364" y="896">18.00 m</text><text x="150" y="590" transform="rotate(-90 150 590)">36.00 m</text></g>')
    title = (f'<g class="art-rise ad-22"><rect x="520" y="900" width="230" height="70" fill="{WHITE}" stroke="{BLUE_DARK}" stroke-width="2"/>'
             f'<path d="M520 930 H750" stroke="{BLUE_DARK}" stroke-width="1.5"/>'
             f'<text class="art-text" x="534" y="922" fill="{BLUE_DARK}" font-size="15" font-weight="700" letter-spacing="2">FRONT ELEVATION</text>'
             f'<text class="art-text" x="534" y="956" fill="{BLUE}" font-size="14" letter-spacing="1">SCALE 1:100</text></g>')
    square = (f'<g class="art-float art-float--slow"><path d="M70 960 L70 860 L170 960 Z" fill="{BLUE}" opacity=".14" stroke="{BLUE}" stroke-width="2"/>'
              f'<path d="M86 944 L86 900 L130 944 Z" fill="{PAPER}" stroke="{BLUE}" stroke-width="1.5"/></g>')
    pencil = (f'<g class="art-pencil"><g transform="translate(196 322) rotate(28)">'
              f'<polygon points="0,0 -9,-24 9,-24" fill="#E9C79A"/><polygon points="0,0 -3.5,-9 3.5,-9" fill="{INK}"/>'
              f'<rect x="-9" y="-150" width="18" height="126" fill="{CRANE}"/><rect x="-9" y="-150" width="6" height="126" fill="#C28E2E"/>'
              f'<rect x="-9" y="-172" width="18" height="22" fill="#C46A5A"/></g></g>')
    compass = (f'<g class="art-spin ad-4"><circle cx="104" cy="120" r="44" fill="{WHITE}" stroke="{BLUE}" stroke-width="2"/>'
               f'<path d="M104 84 L116 120 L104 156 L92 120 Z" fill="{BLUE_DARK}"/><path d="M104 84 L116 120 L92 120 Z" fill="{BLUE}"/>'
               f'<text class="art-text" x="98" y="72" fill="{BLUE_DARK}" font-size="16" font-weight="700">N</text></g>')
    defs = (f'<pattern id="ar-grid" width="40" height="40" patternUnits="userSpaceOnUse">'
            f'<path d="M40 0 H0 V40" fill="none" stroke="{BLUE}" stroke-opacity=".12" stroke-width="1"/></pattern>')
    body = (f'<rect width="800" height="1000" fill="{PAPER}"/><rect width="800" height="1000" fill="url(#ar-grid)"/>'
            f'<g class="art-fade art-fade--soft ad-14">{glass}</g>'
            f'<g fill="none" stroke="{BLUE_DARK}" stroke-width="3" stroke-linecap="round">{draw}</g>'
            f'<g class="art-fade ad-17">{balconies}</g>{dims}{title}{square}{compass}{pencil}')
    return svg("architecture", body, defs)


# ---------------------------------------------------------------------------
# 5. Planning: a housing layout — roads, plots by land use, open space, legend
# ---------------------------------------------------------------------------
def art_planning():
    RES, COM, AMN, OPEN = "#F1DFB8", "#E7BFB2", "#C7D6E6", "#C3DCC2"
    plots = [  # x, y, w, h, colour
        (40, 40, 140, 170, RES), (196, 40, 144, 170, RES), (40, 226, 140, 174, RES), (196, 226, 144, 174, RES),
        (440, 40, 320, 200, COM), (440, 256, 150, 144, AMN), (606, 256, 154, 144, RES),
        (440, 490, 150, 210, RES), (606, 490, 154, 210, RES),
        (40, 780, 180, 180, AMN), (236, 780, 104, 180, RES),
    ]
    plot_svg = "".join(f'<rect class="art-pop ad-{6 + i}" x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{c}" stroke="{WHITE}" stroke-width="4"/>'
                       for i, (x, y, w, h, c) in enumerate(plots))
    open_space = f'<rect class="art-pop ad-17" x="40" y="490" width="300" height="210" rx="8" fill="{OPEN}" stroke="{WHITE}" stroke-width="4"/>'
    trees = "".join(f'<circle class="art-pop ad-{18 + i % 6}" cx="{x}" cy="{y}" r="{r}" fill="{GREEN}"/>'
                    for i, (x, y, r) in enumerate(((90, 540, 22), (150, 600, 28), (240, 530, 20), (290, 640, 24), (200, 660, 18), (90, 650, 20))))
    path = f'<path class="art-draw ad-20" pathLength="1" d="M70 560 C 140 520, 200 690, 310 600" fill="none" stroke="{WHITE}" stroke-width="6" stroke-linecap="round"/>'
    roads = (f'<rect class="art-grow-x ad-1" x="0" y="412" width="800" height="66" fill="#D5DAD5"/>'
             f'<rect class="art-grow-x ad-2" x="0" y="712" width="800" height="56" fill="#D5DAD5"/>'
             f'<rect class="art-grow ad-3" x="352" y="0" width="76" height="1000" fill="#D5DAD5"/>'
             f'<g class="art-fade ad-5" fill="{WHITE}">'
             + "".join(f'<rect x="{x}" y="443" width="28" height="4"/>' for x in range(10, 800, 60))
             + "".join(f'<rect x="388" y="{y}" width="4" height="28"/>' for y in range(10, 1000, 60)) + '</g>')
    highlight = f'<rect class="art-fade ad-24" x="606" y="490" width="154" height="210" rx="8" fill="none" stroke="{BLUE}" stroke-width="4"/>' \
                f'<rect class="art-ants" x="606" y="490" width="154" height="210" rx="8" fill="none" stroke="{BLUE}" stroke-width="4" stroke-dasharray="14 10"/>'
    legend_items = (("Residential", RES), ("Commercial", COM), ("Amenity", AMN), ("Open space", OPEN))
    legend = (f'<g class="art-rise ad-22"><rect x="452" y="792" width="306" height="168" rx="10" fill="#15191D" opacity=".08"/>'
              f'<rect x="444" y="784" width="306" height="168" rx="10" fill="{WHITE}"/>'
              f'<text class="art-text" x="466" y="818" fill="{INK}" font-size="15" font-weight="700" letter-spacing="2">LAND USE</text>'
              + "".join(f'<rect x="466" y="{836 + i * 28}" width="22" height="18" rx="3" fill="{c}"/>'
                        f'<text class="art-text" x="500" y="{850 + i * 28}" fill="{INK}" font-size="16">{t}</text>'
                        for i, (t, c) in enumerate(legend_items)) + '</g>')
    north = (f'<g class="art-spin ad-12"><circle cx="700" cy="118" r="38" fill="{WHITE}" opacity=".9"/>'
             f'<path d="M700 88 L712 128 L700 120 L688 128 Z" fill="{BLUE_DARK}"/>'
             f'<text class="art-text" x="694" y="146" fill="{BLUE_DARK}" font-size="15" font-weight="700">N</text></g>')
    body = (f'<rect width="800" height="1000" fill="#E9EEE8"/>{roads}{open_space}{plot_svg}{path}{trees}{highlight}{legend}{north}')
    return svg("planning", body)


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
    "redevelopment": art_redevelopment,
    "self-redevelopment": art_self_redevelopment,
    "development": art_development,
    "architecture": art_architecture,
    "planning": art_planning,
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
    delays = "\n".join(f".js .svc-media--art .ad-{n} {{ animation-delay: {n * 100}ms; }}" for n in range(1, 31))
    return CSS_HEAD + "\n/* Entrance delays: .ad-N waits N × 100 ms */\n" + delays + "\n" + KEYFRAMES


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
