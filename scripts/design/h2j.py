"""Turns a Stitch design into a React component with data bindings.
Bindings are applied to the parsed tree before emission:
  text   {{expr}}  -> {expr} in JSX
  attr   value "{{expr}}" -> name={expr}
  loop   a node whose .loop=(list, var, key) renders list.map((var) => <template/>)
  comp   a tag with a capital letter is a React component, emitted unchanged
Every expression is written against the `data` prop."""
import re, sys, json, copy
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tree import Node, parse_body, text_of, norm, walk, find_text

ATTR = {"class":"className","for":"htmlFor","tabindex":"tabIndex","stroke-width":"strokeWidth","stroke-linecap":"strokeLinecap",
        "stroke-linejoin":"strokeLinejoin","fill-rule":"fillRule","clip-rule":"clipRule","stroke-dasharray":"strokeDasharray",
        "stroke-dashoffset":"strokeDashoffset","font-size":"fontSize","readonly":"readOnly","maxlength":"maxLength",
        "autocomplete":"autoComplete","inputmode":"inputMode","colspan":"colSpan","rowspan":"rowSpan"}
BOOL = {"required","checked","disabled","hidden","selected","readonly","autofocus","multiple","novalidate"}
VOID = {"area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr"}

def esc(s):
    """Text for JSX. react/no-unescaped-entities refuses a bare quote, apostrophe, > or }."""
    return (s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("{","&#123;").replace("}","&#125;")
             .replace("'","&apos;").replace('"',"&quot;"))

def text_jsx(s):
    s = re.sub(r"\s+", " ", s)
    out = []
    for p in re.split(r"(\{\{.*?\}\})", s):
        out.append("{" + p[2:-2] + "}" if p.startswith("{{") and p.endswith("}}") else esc(p))
    return "".join(out)

def clone(n, parent=None):
    if isinstance(n, str): return n
    c = Node(n.tag, n.attrs); c.parent = parent
    if hasattr(n, "loop"): c.loop = n.loop
    c.children = [clone(ch, c) for ch in n.children]
    return c

def text_nodes(n):
    for i, c in enumerate(n.children):
        if isinstance(c, str): yield n, i, c
        else: yield from text_nodes(c)

def bind(scope, old, expr, expect=None):
    hits = 0
    for parent, i, s in list(text_nodes(scope)):
        if old in s:
            parent.children[i] = s.replace(old, "{{" + expr + "}}"); hits += 1
    if expect is not None and hits != expect:
        raise SystemExit(f"bind '{old}': expected {expect} hits, got {hits}")
    if hits == 0: raise SystemExit(f"bind '{old}': not found")
    return hits

def smallest(scope, needle):
    best = None
    for n in walk(scope):
        if isinstance(n, str) or n.tag == "root": continue
        t = norm(text_of(n))
        if needle in t and (best is None or len(t) < len(norm(text_of(best)))): best = n
    if best is None: raise SystemExit(f"element with '{needle}' not found")
    return best

def climb(n, tag):
    p = n
    while p is not None and p.tag != tag: p = p.parent
    if p is None: raise SystemExit(f"no <{tag}> above element")
    return p

def remove(n):
    p = n.parent; p.children = [c for c in p.children if c is not n]

def set_attr(n, k, v):
    n.attrs = [(a, b) for a, b in n.attrs if a != k] + [(k, v)]

def attr_get(n, k):
    return dict(n.attrs).get(k)

def lowest_common(root, needles):
    best = None
    for n in walk(root):
        if isinstance(n, str) or n.tag == "root": continue
        t = norm(text_of(n))
        if all(x in t for x in needles) and (best is None or len(t) < len(norm(text_of(best)))): best = n
    return best

def make_loop(parent, rows, lst, var, key):
    first, last = parent.children.index(rows[0]), parent.children.index(rows[-1])
    tmpl = clone(rows[0], None)
    loop = Node("__loop__", []); loop.loop = (lst, var, key); loop.children = [tmpl]
    tmpl.parent = loop; loop.parent = parent
    parent.children[first:last + 1] = [loop]
    return tmpl

def build(html):
    root = parse_body(html)

    # ---- claims removed, not replaced by product features (see docs/design-decisions.md) ----
    for needle in ["US E-SIGN & EU eIDAS", "Cryptographically sealed contract record", "IP rights assign unconditionally"]:
        remove(smallest(root, needle))
    bind(root, "Standard Lumen Studio Terms v4.2 Applied", "data.proposal.termsLabel", 1)
    bind(root, "Integrity Hash", "Terms fingerprint (SHA-256)", None) if False else None
    for parent, i, s in list(text_nodes(root)):
        if s.strip() == "Integrity Hash": parent.children[i] = "Terms fingerprint (SHA-256)"
        if s.strip() == "Document Integrity Verified": parent.children[i] = "Terms fingerprint recorded"
    bind(root, "SHA256: 4f8b91c...89240de78", "`SHA-256: ${data.proposal.digestShort}`", 1)

    # ---- project header and identity ----
    bind(root, "Lumen Studio LLC", "data.project.studioName")
    bind(root, "Lumen Studio", "data.project.studioName")
    bind(root, "Sofia Marin", "data.viewer.name")
    bind(root, "Alex Morgan (Lead Director)", "data.studio.contactName", 1)
    bind(root, "alex@lumenstudio.co", "data.studio.contactEmail", 1)
    bind(root, "CAD-2026-089", "data.project.reference")
    bind(root, "VERSION 4.2", "`VERSION ${data.proposal.version}`", 1)
    bind(root, "14 November 2026", "data.proposal.issuedLong", 1)
    bind(root, "Brand identity and website", "data.project.title")
    bind(root, "Cadence Inc. / Lumen Coffee Co.", "data.project.clientName", 1)
    bind(root, "Stage 1 of 6: Proposal", "data.stageText", 1)

    # ---- contract summary ----
    bind(root, "$6,000.00", "data.money.total", 1)
    bind(root, "$6,000", "data.money.total", 1)
    bind(root, "$1,800.00 USD", "data.money.m1", 1)
    bind(root, "18 Nov 2026", "data.window.start")
    bind(root, "20 Dec 2026", "data.window.end")
    bind(root, "18 Nov – 20 Dec", "data.window.range", 1)
    bind(root, "32 Calendar Days", "`${data.window.days} Calendar Days`")
    bind(root, "~92", "`~${data.totalHours}`", 1)
    bind(root, "2 included per item", "data.proposal.revisionSummary", 1)
    bind(root, "2 formal revision rounds", "data.proposal.revisionRounds", 1)

    # ---- navigation and actions that now have targets ----
    for label, href in [("Sign Document", "data.links.sign"), ("Review Stages", "data.links.preWork"), ("Financials & Receipts", "data.links.payments")]:
        a = climb(smallest(root, label), "a")
        set_attr(a, "href", "{" + href + "}"); a.attrs = [(k, v) for k, v in a.attrs if k != "data-todo"]
    a = climb(smallest(root, "Proposal & Scope"), "a")
    set_attr(a, "href", "{data.links.review}"); a.attrs = [(k, v) for k, v in a.attrs if k != "data-todo"]
    for label, href in [("Approve & sign", "data.links.sign")]:
        b = climb(smallest(root, label), "button")
        b.tag = "a"; set_attr(b, "href", "{" + href + "}")
        b.attrs = [(k, v) for k, v in b.attrs if k not in ("data-todo", "type")]
    b = climb(smallest(root, "Download PDF Copy"), "button")
    b.tag = "a"; set_attr(b, "href", "{data.links.print}"); b.attrs = [(k, v) for k, v in b.attrs if k not in ("data-todo", "type")]
    b = climb(smallest(root, "Add General Note"), "button")
    cls = attr_get(b, "class") or ""
    comp = Node("NoteButton", [("label", "Add General Note"), ("kind", "general"), ("projectId", "{data.project.id}"),
                              ("proposalId", "{data.proposal.id}"), ("className", cls)])
    comp.children = [clone(c, comp) for c in b.children]
    comp.parent = b.parent; b.parent.children = [comp if c is b else c for c in b.parent.children]
    b = climb(smallest(root, "Request changes"), "button")
    cls = attr_get(b, "class") or ""
    comp = Node("NoteButton", [("label", "Request changes"), ("kind", "change"), ("projectId", "{data.project.id}"),
                              ("proposalId", "{data.proposal.id}"), ("className", cls)])
    comp.children = [clone(c, comp) for c in b.children]
    comp.parent = b.parent; b.parent.children = [comp if c is b else c for c in b.parent.children]
    ov = smallest(root, "Section Note")
    while ov is not None and "fixed" not in (attr_get(ov, "class") or ""): ov = ov.parent
    assert ov is not None, "section note overlay not found"
    remove(ov)  # the note dialog is one component, rendered once by the page
    vc = climb(smallest(root, "View Clauses"), "button")
    vc.tag = "Link"; set_attr(vc, "href", "/terms"); vc.attrs = [("className" if k == "class" else k, v) for k, v in vc.attrs if k not in ("type", "data-todo")]

    # ---- section comments ----
    for n in list(walk(root)):
        if isinstance(n, str) or n.tag != "button": continue
        if norm(text_of(n)).endswith("Comment") and n.parent is not None:
            comp = Node("NoteButton", [("label", "Comment"), ("kind", "section"), ("projectId", "{data.project.id}"),
                                      ("proposalId", "{data.proposal.id}"), ("sectionRef", "{SECTION_REF}"), ("className", attr_get(n, "class") or "")])
            comp.children = [clone(c, comp) for c in n.children]
            comp.parent = n.parent; n.parent.children = [comp if c is n else c for c in n.parent.children]

    # ---- deliverables: the three repeated D-blocks ----
    cont = lowest_common(root, ["D-01", "D-03"])
    rows = [c for c in cont.children if not isinstance(c, str) and "D-0" in norm(text_of(c))]
    assert len(rows) == 3, f"deliverable rows: {len(rows)}"
    tmpl = make_loop(cont, rows, "data.proposal.deliverables", "d", "d.code")
    for n in list(walk(tmpl)):
        if not isinstance(n, str) and n.tag == "button" and norm(text_of(n)).endswith("Comment"):
            comp = Node("NoteButton", [("label", "Comment"), ("kind", "section"), ("projectId", "{data.project.id}"),
                                      ("proposalId", "{data.proposal.id}"), ("sectionRef", "{d.code}"), ("className", attr_get(n, "class") or "")])
            comp.children = [clone(c, comp) for c in n.children]
            comp.parent = n.parent; n.parent.children = [comp if c is n else c for c in n.parent.children]
    bind(tmpl, "D-01", "d.code", 1)
    bind(tmpl, "Core Brand Identity & Design Tokens", "d.title", 1)
    bind(tmpl, "Comprehensive visual identity framework, vector icon libraries, typography hierarchies, and dynamic tokens.", "d.description", 1)
    bind(tmpl, "32 billable hrs", "(d.hours ? `${d.hours} billable hrs` : 'Fixed fee')", 1)
    bind(tmpl, "Includes 2 consolidated review cycles", "d.reviewNote", 1)
    bind(tmpl, "24 Nov 2026", "d.targetDate", 1)
    grid = [n for n in walk(tmpl) if not isinstance(n, str) and "md:grid-cols-3" in (attr_get(n, "class") or "") and "gap-space-sm" in (attr_get(n, "class") or "")]
    assert len(grid) == 1, f"item grid: {len(grid)}"
    cards = [c for c in grid[0].children if not isinstance(c, str)]
    item_tmpl = make_loop(grid[0], cards, "d.items", "item", "item.title")
    def not_icon(parent):
        return "material-symbols-outlined" not in (attr_get(parent, "class") or "")
    texts = [s for p, _, s in text_nodes(item_tmpl) if s.strip() and not_icon(p)]
    assert len(texts) >= 2, f"item texts: {texts}"
    # first text is the item title, the next is its description
    done = {"title": False, "description": False}
    for parent, i, s in list(text_nodes(item_tmpl)):
        if not s.strip() or not not_icon(parent): continue
        if not done["title"]:
            parent.children[i] = "{{item.title}}"; done["title"] = True
        elif not done["description"]:
            parent.children[i] = "{{item.description}}"; done["description"] = True

    # ---- payment milestones: the three M-rows ----
    mcont = lowest_common(root, ["Brand Strategy", "Production Deployment"])
    mrows = [c for c in mcont.children if not isinstance(c, str) and any(t in norm(text_of(c)) for t in ["Brand Strategy", "Storefront UX", "Production Deployment"])]
    assert len(mrows) == 3, f"milestone rows: {len(mrows)}"
    mt = make_loop(mcont, mrows, "data.milestones", "m", "m.code")
    bind(mt, "M1", "m.code", 1)
    bind(mt, "Brand Strategy & Discovery", "m.title", 1)
    chip = smallest(mt, "Waiting on you")
    set_attr(chip, "class", "{m.statusClass}"); bind(mt, "Waiting on you", "m.statusLabel", 1)
    bind(mt, "$1,800 USD", "m.amountText", 1)
    bind(mt, "20 Nov 2026", "m.dueLabel", 1)
    bind(mt, "Before start", "m.terms", 1)
    bind(mt, "30.0%", "`${m.percent}%`", 1)
    for n in walk(root):
        if not isinstance(n, str) and n.tag == "NoteButton": n.attrs.append(("viewerName", "{data.viewer.name}"))
    return root

def emit(n, depth, extra_attrs=None):
    ind = "  " * depth
    if isinstance(n, str):
        if not norm(n) and "{{" not in n: return ""
        return ind + text_jsx(n) + "\n"
    if n.tag == "__loop__":
        lst, var, key = n.loop
        body = emit(n.children[0], depth + 2, [f"key={{{key}}}"])
        return f"{ind}{{{lst}.map(({var}) => (\n{body}{ind}))}}\n"
    if n.tag == "root":
        return "".join(emit(c, depth) for c in n.children)
    attrs = []
    if n.tag[0].isupper():
        for k, v in n.attrs:
            if k == "className": v = map_classes(v)
            attrs.append(f'{k}={{{v[1:-1]}}}' if v.startswith("{") and v.endswith("}") else f'{k}="{v}"')
        if not n.children:
            return f"{ind}<{n.tag} {' '.join(attrs)} />\n"
        inner = "".join(emit(c, depth + 1) for c in n.children)
        return f"{ind}<{n.tag} {' '.join(attrs)}>\n{inner}{ind}</{n.tag}>\n"
    cls_static = None
    for k, v in n.attrs:
        lk = k.lower()
        if lk.startswith("data-") or lk.startswith("on") or lk in ("xmlns", "shell-type", "xmlns:xlink", "style"): continue
        if lk == "class":
            v = map_classes(v)
            if v.startswith("{") and v.endswith("}") and "{" not in v[1:-1]:
                attrs.append(f"className={{{v[1:-1]}}}")
            else: attrs.append(f'className="{v}"')
            continue
        key = ATTR.get(lk, k)
        if v.startswith("{") and v.endswith("}"):
            attrs.append(f"{key}={{{v[1:-1]}}}"); continue
        if lk in BOOL and v == "": attrs.append(key); continue
        if lk == "src" and n.tag == "img": continue
        attrs.append(f'{key}="{v.replace(chr(34), "&quot;")}"')
    if extra_attrs: attrs += extra_attrs
    if n.tag == "img":
        alt = dict(n.attrs).get("alt", "")
        if "logo" in alt.lower(): return f"{ind}<BrandLogo />\n"
        return f'{ind}<ImagePlaceholder label="{alt.replace(chr(34), "")}" />\n'
    if n.tag == "span" and "material-symbols-outlined" in (dict(n.attrs).get("class") or ""):
        name = norm(text_of(n))
        return f'{ind}<Ico name="ICON:{name}" />\n'
    open_tag = f"<{n.tag}" + ("" if not attrs else " " + " ".join(attrs))
    if n.tag in VOID: return f"{ind}{open_tag} />\n"
    inner = "".join(emit(c, depth + 1) for c in n.children)
    if not inner.strip(): return f"{ind}{open_tag}></{n.tag}>\n"
    return f"{ind}{open_tag}>\n{inner}{ind}</{n.tag}>\n"

FONT_FAMILY_NAMES = {"font-body-sm","font-body-sm-medium","font-body-lg","font-body-lg-medium","font-headline-xl","font-headline-lg",
    "font-headline-md","font-headline-sm","font-label-md","font-label-sm","font-headline-lg-mobile","font-headline-xl-mobile"}
def map_classes(cls):
    """Design token names to ours: the page background is canvas; family names are dropped (Inter everywhere)."""
    out = []
    for t in cls.split():
        if t in FONT_FAMILY_NAMES: continue
        if t == "bg-surface": t = "bg-canvas"
        elif t.startswith("bg-surface/"): t = "bg-canvas/" + t.split("/", 1)[1]
        out.append(t)
    return " ".join(out)

def resolve_icons(code, icon_map):
    missing = set()
    def sub(m):
        name = m.group(1)
        key = icon_map.get(name)
        if key is None: missing.add(name); key = "help"
        return f'name="{key}"'
    code = re.sub(r'name="ICON:([^"]*)"', sub, code)
    return code, missing

def load_icon_map(path):
    m = {}
    for line in open(path, encoding="utf-8"):
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) == 4 and cells[0].startswith("`") and cells[2].startswith("`"):
            m[cells[0].strip("`")] = cells[2].strip("`")
    return m

def main(src, out, component, icon_map_path):
    html = open(src, encoding="utf-8").read()
    root = build(html)
    body = emit(root, 3)
    body = body.replace("sectionRef={SECTION_REF}", "sectionRef=\"SECTION\"")
    for ref in ["Deliverable scope", "Payment milestones", "Working assumptions", "Explicit exclusions", "Revision policy"]:
        body = body.replace('sectionRef="SECTION"', f'sectionRef="{ref}"', 1)
    assert 'sectionRef="SECTION"' not in body, "section comment count mismatch"
    code, missing = resolve_icons(body, load_icon_map(icon_map_path))
    if missing: raise SystemExit(f"icons without a mapping: {sorted(missing)}")
    todos = len(re.findall(r"<button\b", code))
    header = f'''/* Generated from a Stitch design by scripts/design/h2j.py. Bindings are written against the `data` prop.
 * Edit the generator or the data, then regenerate. Hand edits are overwritten. */
import Link from "next/link";
import {{ Ico }} from "@/components/ui/icon";
import {{ BrandLogo, ImagePlaceholder }} from "@/components/ui/brand";
import {{ NoteButton }} from "@/components/features/proposal/note-dialog";
import type {{ ProposalReviewData }} from "@/components/features/proposal/review-types";

export function {component}({{ data }}: {{ data: ProposalReviewData }}) {{
  return (
    <>
'''
    footer = "    </>\n  );\n}\n"
    open(out, "w", encoding="utf-8").write(header + code + footer)
    print(json.dumps({"out": out, "lines": (header + code + footer).count("\n"), "unbound_todos": todos}))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
