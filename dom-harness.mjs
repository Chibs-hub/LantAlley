/* A DOM small enough to read, for tests that actually render.
 *
 * Most of this suite asserts against the *source text* of app.js. That is how
 * `challenge is not defined` shipped green: the string the test looked for was
 * still in the file, while the question it belonged to rendered a running clock
 * and no buttons. Reading source cannot catch a crash.
 *
 * So: a fake document, driven the way a player drives it. Only what app.js
 * touches is implemented - element creation, ids, classes, text, a tag-soup
 * innerHTML parser (app.js writes markup as strings and then looks up ids
 * inside it), events with bubbling, and a clock the test advances by hand so a
 * six-second dialogue delay costs nothing.
 *
 * Not a browser. Layout, CSS and real timing are out of scope, and the browser
 * walkthrough still covers those.
 */
const VOID_TAGS = new Set(["img", "br", "hr", "input", "meta", "link", "source"]);

class ClassList {
  constructor(node) { this.node = node; }
  get _list() { return this.node.className.split(/\s+/).filter(Boolean); }
  _write(list) { this.node.className = list.join(" "); }
  add(...names) {
    const list = this._list;
    for (const name of names) if (!list.includes(name)) list.push(name);
    this._write(list);
  }
  remove(...names) { this._write(this._list.filter((n) => !names.includes(n))); }
  contains(name) { return this._list.includes(name); }
  toggle(name, force) {
    const has = this.contains(name);
    const want = force === undefined ? !has : !!force;
    if (want) this.add(name); else this.remove(name);
    return want;
  }
}

// Custom properties matter here: the stage sets its art through --scene-image.
function makeStyle() {
  const style = {
    setProperty(name, value) { style[name] = String(value); },
    removeProperty(name) { delete style[name]; },
    getPropertyValue(name) { return name in style ? style[name] : ""; },
  };
  return style;
}

class FakeEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = init.bubbles !== false;
    this.target = null;
    this.currentTarget = null;
    this.defaultPrevented = false;
    this._stopped = false;
    this._stoppedImmediate = false;
  }
  preventDefault() { this.defaultPrevented = true; }
  stopPropagation() { this._stopped = true; }
  stopImmediatePropagation() { this._stopped = true; this._stoppedImmediate = true; }
}

class FakeElement {
  constructor(doc, tag) {
    this.ownerDocument = doc;
    this.tagName = String(tag).toUpperCase();
    this.childNodes = [];
    this.parentNode = null;
    this.attributes = Object.create(null);
    this.className = "";
    this.classList = new ClassList(this);
    this.style = makeStyle();
    this.dataset = {};
    this.hidden = false;
    this.disabled = false;
    this.type = "";
    this.src = "";
    this.value = "";
    this._text = "";
    this._html = "";
    this._listeners = Object.create(null);
    this.focused = false;
  }

  get id() { return this.attributes.id || ""; }
  set id(value) { this.attributes.id = value; }

  get children() { return this.childNodes.filter((n) => n instanceof FakeElement); }

  get textContent() {
    if (!this.childNodes.length) return this._text;
    return this.childNodes.map((n) => n.textContent).join("");
  }
  set textContent(value) {
    this.childNodes = [];
    this._html = "";
    this._text = value === null || value === undefined ? "" : String(value);
  }

  get innerHTML() { return this._html; }
  set innerHTML(markup) {
    this._html = String(markup);
    this.childNodes = [];
    this._text = "";
    parseInto(this.ownerDocument, this, this._html);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === "class") this.className = String(value);
    if (name === "hidden") this.hidden = true;
    if (name === "disabled") this.disabled = true;
    // A range input written as markup carries its starting position in the
    // attribute; without this the schedule reads as empty and every arrival
    // time comes out NaN.
    if (name === "value") this.value = String(value);
    // The room's drop zones are matched by `zone.dataset.key`, and markup
    // written as a string is where those keys come from. Without this mirror
    // every placement scores as the wrong verb.
    if (name.indexOf("data-") === 0) {
      this.dataset[name.slice(5).replace(/-([a-z])/g, (m, c) => c.toUpperCase())] = String(value);
    }
  }
  getAttribute(name) {
    if (name === "class") return this.className;
    return name in this.attributes ? this.attributes[name] : null;
  }
  removeAttribute(name) { delete this.attributes[name]; }
  hasAttribute(name) { return name in this.attributes || (name === "class" && !!this.className); }

  appendChild(node) {
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
  removeChild(node) {
    const at = this.childNodes.indexOf(node);
    if (at >= 0) this.childNodes.splice(at, 1);
    node.parentNode = null;
    return node;
  }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  insertAdjacentHTML(where, markup) {
    const holder = this.ownerDocument.createElement("div");
    parseInto(this.ownerDocument, holder, String(markup));
    const nodes = holder.childNodes.slice();
    if (where === "afterbegin") {
      for (let i = nodes.length - 1; i >= 0; i -= 1) this.insertBefore(nodes[i], this.childNodes[0]);
    } else {
      for (const node of nodes) this.appendChild(node);
    }
  }
  get firstChild() { return this.childNodes[0] || null; }
  contains(node) {
    let cur = node;
    while (cur) { if (cur === this) return true; cur = cur.parentNode; }
    return false;
  }
  insertBefore(node, ref) {
    // Unlike appendChild, this never detached `node` from wherever it was
    // already parented first. Moving a node that already lives elsewhere in
    // the tree - which is exactly what app.js does to shuttle the shared
    // avatar slot between the scene and the dialogue shell - left a second,
    // stale reference to it sitting in its old parent's childNodes, so the
    // same element appeared to exist twice.
    if (node.parentNode) node.parentNode.removeChild(node);
    const at = this.childNodes.indexOf(ref);
    if (at < 0) return this.appendChild(node);
    node.parentNode = this;
    this.childNodes.splice(at, 0, node);
    return node;
  }

  matches(selector) { return String(selector).split(",").some((part) => matchesOne(this, part.trim())); }
  closest(selector) {
    let node = this;
    while (node) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) {
    const out = [];
    walk(this, (node) => { if (node.matches(selector)) out.push(node); });
    return out;
  }

  addEventListener(type, fn) {
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  }
  removeEventListener(type, fn) {
    const list = this._listeners[type];
    if (list) this._listeners[type] = list.filter((f) => f !== fn);
  }
  dispatchEvent(event) {
    if (!event.target) event.target = this;
    let node = this;
    while (node) {
      event.currentTarget = node;
      const list = (node._listeners && node._listeners[event.type]) || [];
      for (const fn of list.slice()) {
        fn.call(node, event);
        if (event._stoppedImmediate) return !event.defaultPrevented;
      }
      if (!event.bubbles || event._stopped) break;
      node = node.parentNode;
    }
    return !event.defaultPrevented;
  }

  click() { this.dispatchEvent(new FakeEvent("click", { bubbles: true })); }
  focus() { this.focused = true; }
  blur() { this.focused = false; }
  // Enough for the few reads app.js makes; nothing here does layout.
  getBoundingClientRect() { return { top: 0, left: 0, width: 320, height: 40, bottom: 40, right: 320 }; }
  scrollIntoView() {}
}

class FakeTextNode {
  constructor(data) { this.data = String(data); this.parentNode = null; }
  get textContent() { return this.data; }
  matches() { return false; }
}

function walk(node, visit) {
  for (const child of node.childNodes) {
    if (!(child instanceof FakeElement)) continue;
    visit(child);
    walk(child, visit);
  }
}

function matchesOne(node, selector) {
  if (!selector) return false;
  const m = selector.match(/^([a-zA-Z][\w-]*)?((?:[.#][\w-]+)*)(?:\[([\w-]+)(?:="?([^\]"]*)"?)?\])?$/);
  if (!m) return false;
  const tag = m[1];
  const rest = m[2];
  const attr = m[3];
  const attrValue = m[4];
  if (tag && node.tagName !== tag.toUpperCase()) return false;
  const parts = rest ? rest.match(/[.#][\w-]+/g) || [] : [];
  for (const part of parts) {
    if (part[0] === "#" && node.id !== part.slice(1)) return false;
    if (part[0] === "." && !node.classList.contains(part.slice(1))) return false;
  }
  if (attr) {
    if (!node.hasAttribute(attr)) return false;
    if (attrValue !== undefined && attrValue !== "" && node.getAttribute(attr) !== attrValue) return false;
  }
  return true;
}

// Tag soup, deliberately. app.js writes small, well-formed fragments; anything
// it cannot parse should fail loudly in a test rather than be guessed at.
function parseInto(doc, root, markup) {
  const stack = [root];
  const token = /<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g;
  let match;
  while ((match = token.exec(markup))) {
    const closeTag = match[1];
    const openTag = match[2];
    const attrText = match[3];
    const selfClose = match[4];
    const text = match[5];
    const top = stack[stack.length - 1];
    if (text !== undefined) {
      if (text.length) top.appendChild(doc.createTextNode(text));
      continue;
    }
    if (closeTag) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const el = doc.createElement(openTag);
    const attrRe = /([\w-]+)(?:="([^"]*)")?/g;
    let a;
    while ((a = attrRe.exec(attrText || ""))) {
      el.setAttribute(a[1], a[2] === undefined ? "" : a[2]);
    }
    top.appendChild(el);
    if (!selfClose && !VOID_TAGS.has(openTag.toLowerCase())) stack.push(el);
  }
}

class FakeDocument {
  constructor() {
    this.documentElement = new FakeElement(this, "html");
    this.body = new FakeElement(this, "body");
    this.documentElement.appendChild(this.body);
    this._listeners = Object.create(null);
    this.readyState = "complete";
  }
  createElement(tag) { return new FakeElement(this, tag); }
  createTextNode(data) { return new FakeTextNode(data); }
  getElementById(id) {
    let found = null;
    walk(this.documentElement, (node) => { if (!found && node.id === id) found = node; });
    return found;
  }
  querySelector(selector) { return this.documentElement.querySelector(selector); }
  querySelectorAll(selector) { return this.documentElement.querySelectorAll(selector); }
  addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); }
  removeEventListener() {}
  dispatchEvent(event) {
    for (const fn of (this._listeners[event.type] || []).slice()) fn.call(this, event);
    return true;
  }
}

// A clock the test drives. Real waits would make a walkthrough take minutes and
// then fail on a slow machine for reasons that have nothing to do with the game.
class FakeClock {
  constructor() { this.now = 0; this.timers = []; this.nextId = 1; }
  setTimeout(fn, delay) {
    const id = this.nextId++;
    this.timers.push({ id, at: this.now + (delay || 0), fn, every: null });
    return id;
  }
  setInterval(fn, delay) {
    const id = this.nextId++;
    this.timers.push({ id, at: this.now + (delay || 0), fn, every: delay || 1 });
    return id;
  }
  clear(id) { this.timers = this.timers.filter((t) => t.id !== id); }
  advance(ms) {
    const until = this.now + ms;
    let guard = 0;
    for (;;) {
      const due = this.timers.filter((t) => t.at <= until).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      if (++guard > 20000) throw new Error("timer storm: a callback keeps rescheduling");
      this.now = due.at;
      if (due.every) due.at = this.now + due.every;
      else this.timers = this.timers.filter((t) => t !== due);
      due.fn();
    }
    this.now = until;
  }
}

class FakeStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

export { FakeElement, FakeEvent, FakeDocument, FakeClock, FakeStorage, parseInto, walk };
