// =====================================================================
//  Engine papan match-3: swap, deteksi match, makanan spesial,
//  penghalang, gravitasi, kaskade, hint, shuffle, undo.
// =====================================================================

const W = 8, N = W * W;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let TILE_UID = 0;

function shuffleArr(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Board {
  constructor(el, fxEl, cb) {
    this.el = el;        // container petak
    this.fx = fxEl;      // layer efek (partikel, beam)
    this.cb = cb;        // callback ke game
    this.grid = new Array(N).fill(null);
    this.colors = 5;
    this.busy = true;
    this.locked = false;
    this.selected = null;
    this.combo = 0;
    this.itemMode = null;
    this.bias = null;      // cheat INDOMIE: tipe yang lebih sering muncul
    this.biasLeft = 0;
    this._hintTimer = null;
    this._bindInput();
  }

  // ---------- Pembuatan papan ----------
  setup(colors, start = {}) {
    this.colors = colors;
    this.el.querySelectorAll(".tile").forEach(e => e.remove());
    this.grid.fill(null);
    for (let tries = 0; tries < 50; tries++) {
      this._fillNoMatch();
      for (const [block, n] of Object.entries(start)) this._placeBlockersData(block, n);
      if (this.findMove()) break;
    }
    for (let i = 0; i < N; i++) {
      const t = this.grid[i];
      this._makeEl(t);
      const r = Math.floor(i / W), c = i % W;
      t.el.style.transition = "none";
      t.el.style.transform = `translate(${c * 100}%, ${(r - W) * 100}%)`;
    }
    this.el.offsetWidth;
    this.grid.forEach((t, i) => {
      t.el.style.transition = `transform .45s cubic-bezier(.3,1.4,.6,1) ${(W - Math.floor(i / W)) * 0.03 + (i % W) * 0.01}s`;
      this._place(t, i);
    });
    setTimeout(() => this.grid.forEach(t => t && t.el && (t.el.style.transition = "")), 900);
    this.busy = false;
    this.locked = false;
    this.selected = null;
    this._armHint();
  }

  _newTile(type, special = null) { return { id: ++TILE_UID, kind: "n", type, special, el: null }; }
  _newBlocker(block) { return { id: ++TILE_UID, kind: "b", block, hp: BLOCKS[block].hp, el: null }; }

  _randType() {
    if (this.biasLeft > 0 && this.bias !== null && Math.random() < 0.45) return this.bias;
    return Math.floor(Math.random() * this.colors);
  }

  _fillNoMatch() {
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / W), c = i % W;
      let t;
      do { t = Math.floor(Math.random() * this.colors); } while (
        (c >= 2 && this.grid[i - 1].type === t && this.grid[i - 2].type === t) ||
        (r >= 2 && this.grid[i - W].type === t && this.grid[i - 2 * W].type === t)
      );
      this.grid[i] = this._newTile(t);
    }
  }

  _placeBlockersData(block, n) {
    const cands = shuffleArr(this._indices((t, i) => t.kind === "n" && !t.special && Math.floor(i / W) >= 2));
    cands.slice(0, n).forEach(i => (this.grid[i] = this._newBlocker(block)));
  }

  _indices(pred) {
    const out = [];
    this.grid.forEach((t, i) => t && pred(t, i) && out.push(i));
    return out;
  }

  // ---------- DOM ----------
  _makeEl(t) {
    const el = document.createElement("div");
    t.el = el;
    this._style(t);
    this.el.appendChild(el);
  }

  _style(t) {
    const el = t.el;
    el.className = "tile";
    if (t.kind === "b") {
      el.classList.add("blk", "blk-" + t.block);
      el.innerHTML = `<span>${BLOCKS[t.block].emoji}</span>${t.hp > 1 ? `<i class="hp">${t.hp}</i>` : ""}`;
    } else {
      el.classList.add(t.special === "color" ? "tx" : "t" + t.type);
      if (t.special) el.classList.add("sp-" + t.special);
      el.innerHTML = `<span>${t.special === "color" ? "🍲" : TILES[t.type].emoji}</span>`;
    }
  }

  _place(t, i) {
    const r = Math.floor(i / W), c = i % W;
    t.el.style.transform = `translate(${c * 100}%, ${r * 100}%)`;
  }

  _center(i) {
    const r = Math.floor(i / W), c = i % W;
    return { x: (c + 0.5) * 12.5, y: (r + 0.5) * 12.5 };
  }

  // ---------- Input (drag / klik, mouse & sentuh) ----------
  _idxAt(e) {
    const rect = this.el.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * W);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * W);
    if (c < 0 || c >= W || r < 0 || r >= W) return -1;
    return r * W + c;
  }

  _adjacent(a, b) {
    const ra = Math.floor(a / W), ca = a % W, rb = Math.floor(b / W), cb = b % W;
    return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
  }

  _select(i) {
    if (this.selected !== null && this.grid[this.selected]) this.grid[this.selected].el.classList.remove("selected");
    this.selected = i;
    if (i !== null && this.grid[i]) this.grid[i].el.classList.add("selected");
  }

  _bindInput() {
    const el = this.el;
    el.addEventListener("pointerdown", e => {
      this.cb.onInteract && this.cb.onInteract();
      if (this.busy || this.locked) return;
      const idx = this._idxAt(e);
      if (idx < 0) return;
      if (this.itemMode) { this.cb.onItemTarget(idx); return; }
      this._drag = { idx, x: e.clientX, y: e.clientY, moved: false };
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
    });
    el.addEventListener("pointermove", e => {
      const d = this._drag;
      if (!d || d.moved) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      const th = (this.el.clientWidth / W) * 0.35;
      if (Math.abs(dx) < th && Math.abs(dy) < th) return;
      d.moved = true;
      const r = Math.floor(d.idx / W), c = d.idx % W;
      let t = -1;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && c < W - 1) t = d.idx + 1;
        else if (dx < 0 && c > 0) t = d.idx - 1;
      } else {
        if (dy > 0 && r < W - 1) t = d.idx + W;
        else if (dy < 0 && r > 0) t = d.idx - W;
      }
      this._select(null);
      if (t >= 0) this.trySwap(d.idx, t);
    });
    el.addEventListener("pointerup", () => {
      const d = this._drag;
      this._drag = null;
      if (!d || d.moved || this.busy || this.locked) return;
      if (this.selected === null) this._select(d.idx);
      else if (this.selected === d.idx) this._select(null);
      else if (this._adjacent(this.selected, d.idx)) {
        const s = this.selected;
        this._select(null);
        this.trySwap(s, d.idx);
      } else this._select(d.idx);
    });
    el.addEventListener("pointercancel", () => (this._drag = null));
  }

  // ---------- Swap ----------
  _swap(a, b) {
    const t = this.grid[a];
    this.grid[a] = this.grid[b];
    this.grid[b] = t;
    this._place(this.grid[a], a);
    this._place(this.grid[b], b);
  }

  async trySwap(a, b) {
    const ta = this.grid[a], tb = this.grid[b];
    if (this.busy || this.locked || !ta || !tb || ta.kind !== "n" || tb.kind !== "n") {
      if (ta && tb && (ta.kind === "b" || tb.kind === "b")) this.cb.sfx("bad");
      return;
    }
    this.busy = true;
    this._clearHint();
    this.cb.beforeMove && this.cb.beforeMove();
    this._swap(a, b);
    this.cb.sfx("swap");
    await sleep(170);

    let ok = false;
    if (ta.special === "color" || tb.special === "color" || (ta.special && tb.special)) {
      ok = true;
      this.cb.onMoveUsed();
      this.combo = 1;
      this.cb.onCombo(1);
      await this._specialSwap(b, a); // ta sekarang di b, tb di a
      await this._gravity();
      await this._cascade(null, 1);
    } else if (this._findRuns().length) {
      ok = true;
      this.cb.onMoveUsed();
      await this._cascade([a, b], 0);
    } else {
      this.cb.sfx("bad");
      ta.el.classList.add("shake");
      tb.el.classList.add("shake");
      this._swap(a, b);
      await sleep(220);
      ta.el.classList.remove("shake");
      tb.el.classList.remove("shake");
    }
    if (ok) {
      await this._settle();
      if (this.cb.afterMove) await this.cb.afterMove();
    }
    this.busy = false;
    this._armHint();
  }

  async _specialSwap(p1, p2) {
    const t1 = this.grid[p1], t2 = this.grid[p2];
    const s1 = t1.special, s2 = t2.special;
    this.cb.sfx("special");
    if (s1 === "color" && s2 === "color") {
      t1.special = t2.special = null;
      this._flashBoard();
      await this.destroy([...Array(N).keys()], { fromSpecial: true });
      return;
    }
    if (s1 === "color" || s2 === "color") {
      const [cp, op] = s1 === "color" ? [p1, p2] : [p2, p1];
      const other = this.grid[op];
      const T = other.type, sp = other.special;
      const targets = this._indices(t => t.kind === "n" && t.type === T);
      if (sp) {
        for (const i of targets) {
          const t = this.grid[i];
          if (!t.special) { t.special = sp === "bomb" ? "bomb" : Math.random() < 0.5 ? "h" : "v"; this._style(t); }
        }
        await sleep(350);
      }
      this.grid[cp].special = null;
      this._flashBoard();
      await this.destroy([cp, ...targets], { fromSpecial: true });
      return;
    }
    // dua spesial (garis/bom) digabung
    const r = Math.floor(p1 / W), c = p1 % W;
    let cells = [];
    if (s1 === "bomb" && s2 === "bomb") {
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) cells.push(this._at(r + dr, c + dc));
    } else if (s1 === "bomb" || s2 === "bomb") {
      for (let d = -1; d <= 1; d++) for (let k = 0; k < W; k++) { cells.push(this._at(r + d, k)); cells.push(this._at(k, c + d)); }
    } else {
      for (let k = 0; k < W; k++) { cells.push(this._at(r, k)); cells.push(this._at(k, c)); }
    }
    t1.special = t2.special = null;
    this._beam(p1, "h"); this._beam(p1, "v");
    await this.destroy([p1, p2, ...cells.filter(x => x >= 0)], { fromSpecial: true });
  }

  _at(r, c) { return r < 0 || r >= W || c < 0 || c >= W ? -1 : r * W + c; }

  // ---------- Deteksi match ----------
  _same(a, b) {
    const x = this.grid[a], y = this.grid[b];
    return x && y && x.kind === "n" && y.kind === "n" && x.type >= 0 && x.type === y.type;
  }

  _findRuns() {
    const runs = [];
    for (let r = 0; r < W; r++) {
      let c = 0;
      while (c < W) {
        let e = c + 1;
        while (e < W && this._same(r * W + c, r * W + e)) e++;
        if (e - c >= 3) runs.push({ dir: "h", cells: [...Array(e - c).keys()].map(k => r * W + c + k) });
        c = e;
      }
    }
    for (let c = 0; c < W; c++) {
      let r = 0;
      while (r < W) {
        let e = r + 1;
        while (e < W && this._same(r * W + c, e * W + c)) e++;
        if (e - r >= 3) runs.push({ dir: "v", cells: [...Array(e - r).keys()].map(k => (r + k) * W + c) });
        r = e;
      }
    }
    return runs;
  }

  _hasRunAt(i) {
    const t = this.grid[i];
    if (!t || t.kind !== "n" || t.type < 0) return false;
    const r = Math.floor(i / W), c = i % W;
    let n = 1;
    for (let x = c - 1; x >= 0 && this._same(i, r * W + x); x--) n++;
    for (let x = c + 1; x < W && this._same(i, r * W + x); x++) n++;
    if (n >= 3) return true;
    n = 1;
    for (let y = r - 1; y >= 0 && this._same(i, y * W + c); y--) n++;
    for (let y = r + 1; y < W && this._same(i, y * W + c); y++) n++;
    return n >= 3;
  }

  findMove() {
    for (let i = 0; i < N; i++) {
      for (const j of [i + 1, i + W]) {
        if (j >= N || (j === i + 1 && i % W === W - 1)) continue;
        const a = this.grid[i], b = this.grid[j];
        if (!a || !b || a.kind !== "n" || b.kind !== "n") continue;
        if (a.special === "color" || b.special === "color" || (a.special && b.special)) return [i, j];
        this.grid[i] = b; this.grid[j] = a;
        const ok = this._hasRunAt(i) || this._hasRunAt(j);
        this.grid[i] = a; this.grid[j] = b;
        if (ok) return [i, j];
      }
    }
    return null;
  }

  // ---------- Kaskade ----------
  async _cascade(pref, combo) {
    for (;;) {
      const runs = this._findRuns();
      if (!runs.length) break;
      combo++;
      this.combo = combo;
      this.cb.onCombo(combo);
      await this._clearRuns(runs, pref);
      pref = null;
      await this._gravity();
    }
    if (this.biasLeft > 0) this.biasLeft--;
  }

  async _clearRuns(runs, pref) {
    const inH = new Map(), inV = new Map(), all = new Set();
    runs.forEach(run => run.cells.forEach(i => { all.add(i); (run.dir === "h" ? inH : inV).set(i, run); }));
    const create = new Map();
    const pick = run => (pref && pref.find(p => run.cells.includes(p))) ?? run.cells[Math.floor(run.cells.length / 2)];
    for (const run of runs) if (run.cells.length >= 5) create.set(pick(run), "color");
    for (const [i, hr] of inH) {
      const vr = inV.get(i);
      if (vr && ![...hr.cells, ...vr.cells].some(x => create.has(x))) create.set(i, "bomb");
    }
    for (const run of runs) if (run.cells.length === 4 && !run.cells.some(x => create.has(x))) create.set(pick(run), run.dir);
    for (const [i] of [...create]) if (this.grid[i].special) create.delete(i);

    this.cb.onMatch && this.cb.onMatch(runs, this.combo);
    await this.destroy([...all].filter(i => !create.has(i)));
    for (const [i, sp] of create) {
      const t = this.grid[i];
      if (!t || t.kind !== "n") continue;
      this.cb.onTileCleared(t, i);
      t.special = sp;
      if (sp === "color") t.type = -1;
      this._style(t);
      t.el.classList.add("born");
      this.cb.onSpecialMade(sp, i);
    }
  }

  // ---------- Penghancuran ----------
  async destroy(cells, opts = {}) {
    const queue = [...cells];
    const done = new Set(), hitBlk = new Set(), cleared = [];
    let fired = 0;
    while (queue.length) {
      const i = queue.shift();
      if (i < 0 || done.has(i)) continue;
      const t = this.grid[i];
      if (!t) continue;
      done.add(i);
      if (t.kind === "b") {
        if (!hitBlk.has(i)) { hitBlk.add(i); this._hitBlocker(i); }
        continue;
      }
      if (t.special) {
        fired++;
        const area = this._area(i, t);
        queue.push(...area);
        this.cb.onSpecialFired(t.special, i);
        if (t.special === "h" || t.special === "v") this._beam(i, t.special);
        else if (t.special === "bomb") this._blast(i);
        else this._flashBoard();
      }
      this._removeTile(i, opts.silent);
      cleared.push(i);
    }
    if (!opts.noAdj) {
      for (const i of cleared) for (const n of this._neighbors(i)) {
        const t = this.grid[n];
        if (t && t.kind === "b" && !hitBlk.has(n)) { hitBlk.add(n); this._hitBlocker(n); }
      }
    }
    if (cleared.length || hitBlk.size) await sleep(fired ? 340 : 230);
  }

  _area(i, t) {
    const r = Math.floor(i / W), c = i % W, out = [];
    if (t.special === "h") for (let k = 0; k < W; k++) out.push(r * W + k);
    else if (t.special === "v") for (let k = 0; k < W; k++) out.push(k * W + c);
    else if (t.special === "bomb") {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) out.push(this._at(r + dr, c + dc));
    } else if (t.special === "color") {
      const count = {};
      this.grid.forEach(x => x && x.kind === "n" && x.type >= 0 && (count[x.type] = (count[x.type] || 0) + 1));
      const T = +Object.keys(count).sort((a, b) => count[b] - count[a])[0];
      this.grid.forEach((x, k) => x && x.kind === "n" && x.type === T && out.push(k));
    }
    return out;
  }

  _neighbors(i) {
    const r = Math.floor(i / W), c = i % W;
    return [this._at(r - 1, c), this._at(r + 1, c), this._at(r, c - 1), this._at(r, c + 1)].filter(x => x >= 0);
  }

  _removeTile(i, silent) {
    const t = this.grid[i];
    this.grid[i] = null;
    if (!silent) this.cb.onTileCleared(t, i);
    this._particles(i, t.kind === "n" && t.type >= 0 ? TILES[t.type].color : "#fff");
    t.el.classList.add("pop");
    setTimeout(() => t.el.remove(), 280);
  }

  _hitBlocker(i) {
    const t = this.grid[i];
    t.hp--;
    this.cb.onBlockerHit(t, t.hp <= 0, i);
    if (t.hp <= 0) {
      this.grid[i] = null;
      this._particles(i, "#bcaaa4");
      t.el.classList.add("pop");
      setTimeout(() => t.el.remove(), 280);
    } else {
      this._style(t);
      t.el.classList.add("crack");
    }
  }

  // ---------- Gravitasi & isi ulang ----------
  async _gravity() {
    let moved = false;
    const fresh = [];
    for (let c = 0; c < W; c++) {
      let write = W - 1;
      for (let r = W - 1; r >= 0; r--) {
        const i = r * W + c, t = this.grid[i];
        if (t) {
          if (r !== write) {
            this.grid[write * W + c] = t;
            this.grid[i] = null;
            this._place(t, write * W + c);
            moved = true;
          }
          write--;
        }
      }
      for (let r = write; r >= 0; r--) {
        const t = this._newTile(this._randType());
        this.grid[r * W + c] = t;
        this._makeEl(t);
        t.el.style.transition = "none";
        t.el.style.transform = `translate(${c * 100}%, ${(r - write - 1) * 100}%)`;
        fresh.push([t, r * W + c]);
      }
    }
    if (fresh.length) {
      this.el.offsetWidth; // reflow agar animasi jatuh terlihat
      fresh.forEach(([t, i]) => { t.el.style.transition = ""; this._place(t, i); });
    }
    if (moved || fresh.length) await sleep(270);
  }

  async _settle() {
    if (!this.findMove()) {
      this.cb.onShuffle && this.cb.onShuffle();
      await this.shuffle();
    }
  }

  async shuffle() {
    const idxs = this._indices(t => t.kind === "n");
    const tiles = idxs.map(i => this.grid[i]);
    let good = false;
    for (let tries = 0; tries < 200 && !good; tries++) {
      shuffleArr(tiles);
      idxs.forEach((i, k) => (this.grid[i] = tiles[k]));
      good = !this._findRuns().length && !!this.findMove();
    }
    for (let tries = 0; tries < 200 && !good; tries++) {
      tiles.forEach(t => { if (!t.special) { t.type = Math.floor(Math.random() * this.colors); this._style(t); } });
      good = !this._findRuns().length && !!this.findMove();
    }
    this.el.classList.add("shuffling");
    idxs.forEach(i => this._place(this.grid[i], i));
    this.cb.sfx("shuffle");
    await sleep(420);
    this.el.classList.remove("shuffling");
  }

  // ---------- Aksi dari game (boss, event, item) ----------
  async run(fn) {
    const was = this.busy;
    this.busy = true;
    this._clearHint();
    await fn();
    await this._settle();
    this.busy = was;
    if (!was) this._armHint();
  }

  async spawnBlockers(block, n) {
    const cands = shuffleArr(this._indices(t => t.kind === "n" && !t.special)).slice(0, n);
    for (const i of cands) {
      const old = this.grid[i];
      old.el.remove();
      const b = this._newBlocker(block);
      this.grid[i] = b;
      this._makeEl(b);
      this._place(b, i);
      b.el.classList.add("spawn");
    }
    this.cb.sfx("crack");
    await sleep(400);
  }

  async steal(n) {
    const cands = shuffleArr(this._indices(t => t.kind === "n" && !t.special)).slice(0, n);
    cands.forEach(i => this.grid[i].el.classList.add("stolen"));
    await sleep(450);
    await this.destroy(cands, { silent: true, noAdj: true });
    await this._gravity();
    await this._cascade(null, 0);
  }

  async makeSpecials(n) {
    const cands = shuffleArr(this._indices(t => t.kind === "n" && !t.special)).slice(0, n);
    for (const i of cands) {
      const t = this.grid[i];
      t.special = ["h", "v", "bomb"][Math.floor(Math.random() * 3)];
      this._style(t);
      t.el.classList.add("born");
    }
    this.cb.sfx("born");
    await sleep(350);
  }

  async hammer(i) {
    this.combo = 1;
    await this.destroy([i]);
    await this._gravity();
    await this._cascade(null, 0);
  }

  setColorBomb(i) {
    const t = this.grid[i];
    if (!t || t.kind !== "n") return false;
    t.special = "color";
    t.type = -1;
    this._style(t);
    t.el.classList.add("born");
    this.cb.sfx("born");
    return true;
  }

  // Sisa langkah jadi ledakan bonus ("KIRIMAN CAIR!")
  async bonusBlast(n, onEach) {
    for (let k = 0; k < n; k++) {
      const cands = this._indices(t => t.kind === "n" && !t.special);
      if (!cands.length) break;
      const i = cands[Math.floor(Math.random() * cands.length)];
      const t = this.grid[i];
      t.special = Math.random() < 0.5 ? "h" : "v";
      this._style(t);
      t.el.classList.add("born");
      this.cb.sfx("born");
      onEach && onEach();
      await sleep(110);
    }
    this.combo = 1;
    const sp = this._indices(t => t.kind === "n" && t.special);
    await this.destroy(sp);
    await this._gravity();
    await this._cascade(null, 1);
  }

  // ---------- Undo ----------
  snapshot() {
    return this.grid.map(t => t && { kind: t.kind, type: t.type, special: t.special, block: t.block, hp: t.hp });
  }

  restore(snap) {
    this.el.querySelectorAll(".tile").forEach(e => e.remove());
    this.grid = snap.map((s, i) => {
      const t = s.kind === "b" ? { ...this._newBlocker(s.block), hp: s.hp } : this._newTile(s.type, s.special);
      this._makeEl(t);
      t.el.style.transition = "none";
      this._place(t, i);
      return t;
    });
    this.el.offsetWidth;
    this.grid.forEach(t => (t.el.style.transition = ""));
  }

  // ---------- Hint ----------
  _armHint() {
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => {
      if (this.busy || this.locked) return;
      const m = this.findMove();
      if (m) m.forEach(i => this.grid[i].el.classList.add("hint"));
    }, 6000);
  }

  _clearHint() {
    clearTimeout(this._hintTimer);
    this.el.querySelectorAll(".hint").forEach(e => e.classList.remove("hint"));
  }

  // ---------- Efek visual ----------
  _particles(i, color) {
    const { x, y } = this._center(i);
    for (let k = 0; k < 6; k++) {
      const p = document.createElement("i");
      p.className = "particle";
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40;
      p.style.left = x + "%";
      p.style.top = y + "%";
      p.style.background = color;
      p.style.setProperty("--dx", Math.cos(a) * d + "px");
      p.style.setProperty("--dy", Math.sin(a) * d + "px");
      this.fx.appendChild(p);
      setTimeout(() => p.remove(), 600);
    }
  }

  _beam(i, dir) {
    const r = Math.floor(i / W), c = i % W;
    const b = document.createElement("div");
    b.className = "beam beam-" + dir;
    if (dir === "h") b.style.top = r * 12.5 + "%";
    else b.style.left = c * 12.5 + "%";
    this.fx.appendChild(b);
    setTimeout(() => b.remove(), 500);
  }

  _blast(i) {
    const { x, y } = this._center(i);
    const b = document.createElement("div");
    b.className = "blast";
    b.style.left = x + "%";
    b.style.top = y + "%";
    this.fx.appendChild(b);
    setTimeout(() => b.remove(), 600);
    this.cb.onShake && this.cb.onShake();
  }

  _flashBoard() {
    const f = document.createElement("div");
    f.className = "rainbow-flash";
    this.fx.appendChild(f);
    setTimeout(() => f.remove(), 700);
  }
}
