import re
from html.parser import HTMLParser
VOID = {"area","base","br","col","embed","hr","img","input","link","meta","source","track","wbr"}
class Node:
    def __init__(self, tag, attrs):
        self.tag, self.attrs, self.children, self.parent = tag, list(attrs), [], None
    def cls(self): return dict(self.attrs).get("class", "") or ""
    def set_attr(self, k, v):
        self.attrs = [(a, b) for a, b in self.attrs if a != k] + [(k, v)]
class Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root", []); self.stack = [self.root]; self.skip = 0
    def add(self, n):
        n.parent = self.stack[-1]; self.stack[-1].children.append(n)
    def handle_starttag(self, tag, attrs):
        if tag in ("script","style","noscript"): self.skip += 1; return
        if self.skip: return
        n = Node(tag, attrs); self.add(n)
        if tag not in VOID: self.stack.append(n)
    def handle_startendtag(self, tag, attrs):
        if self.skip or tag in ("script","style"): return
        self.add(Node(tag, attrs))
    def handle_endtag(self, tag):
        if tag in ("script","style","noscript"): self.skip = max(0, self.skip-1); return
        if self.skip: return
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag: del self.stack[i:]; break
    def handle_data(self, data):
        if self.skip: return
        self.stack[-1].children.append(data)
def parse_body(html):
    body = html[html.find("<body"):html.rfind("</body>")]
    body = body[body.find(">")+1:]
    b = Builder(); b.feed(body); return b.root
def text_of(n):
    if isinstance(n, str): return n
    return "".join(text_of(c) for c in n.children)
def norm(s): return re.sub(r"\s+"," ",s).strip()
def walk(n):
    yield n
    for c in n.children:
        if not isinstance(c, str): yield from walk(c)
def find_text(root, needle):
    """Smallest element whose normalised text contains needle."""
    best = None
    for n in walk(root):
        if n.tag == "root": continue
        if needle in norm(text_of(n)):
            if best is None or len(norm(text_of(n))) < len(norm(text_of(best))): best = n
    return best
def outline(n, depth=0, max_depth=4, out=None):
    out = [] if out is None else out
    if isinstance(n, str):
        t = norm(n)
        if t: out.append("  "*depth + "'" + t[:60] + "'")
        return out
    c = n.cls()
    out.append("  "*depth + f"<{n.tag}> " + (c[:70] + ("..." if len(c) > 70 else "")) + ("  ["+norm(text_of(n))[:50]+"]" if len(n.children) <= 2 and norm(text_of(n)) else ""))
    if depth < max_depth:
        for ch in n.children: outline(ch, depth+1, max_depth, out)
    return out
