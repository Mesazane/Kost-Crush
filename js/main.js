// =====================================================================
//  KOST CRUSH — alur game, UI, progres, toko, misi, grup WA, ending
// =====================================================================

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = n => Math.round(n).toLocaleString("id-ID");
const rand = a => a[Math.floor(Math.random() * a.length)];
const SAVE_KEY = "kostcrush_save_v1";

let S;          // data simpanan
let G = null;   // sesi permainan aktif
let board;

// =====================================================================
//  SIMPANAN
// =====================================================================
function dateStr(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function defaultSave() {
  return {
    name: "", seenPrologue: false,
    coins: 150, xp: 0, plvl: 1,
    levels: {}, unlocked: 1,
    choices: {}, choiceCoins: {}, bonus: {},
    inv: { sandal: 1, goyang: 1, esteh: 1, ricecooker: 0 },
    skins: ["standar"], skin: "standar",
    titles: ["Mahasiswa Semester 13"], title: "Mahasiswa Semester 13",
    ach: {}, endings: [],
    stats: { matches: 0, maxCombo: 0, bombs: 0, lines: 0, colors: 0, specials: 0, tiles: 0,
      tile0: 0, tile1: 0, tile2: 0, tile3: 0, tile4: 0, tile5: 0, wins: 0, losses: 0,
      bought: 0, cheats: 0, chats: 0, items: 0, blockers: 0, combo4: 0, score: 0 },
    daily: { date: "", quests: [], prog: {}, claimed: [] },
    streak: { last: "", count: 0 },
    secretFound: false, catClicks: 0,
    best: { endless: 0, deadline: 0 },
    chat: [], chatUnread: 0,
    settings: { music: true, sfx: true, voice: true },
    pendingLvUp: [],
  };
}

function loadSave() {
  const def = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    S = Object.assign(def, raw ? JSON.parse(raw) : {});
    S.stats = Object.assign(defaultSave().stats, S.stats);
    S.settings = Object.assign(defaultSave().settings, S.settings);
    S.inv = Object.assign(defaultSave().inv, S.inv);
  } catch (_) { S = def; }
}

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (_) {}
}

const T = s => String(s).replaceAll("{NAME}", S.name || "Budi");

function stat(key, n = 1) {
  S.stats[key] = (S.stats[key] || 0) + n;
  S.daily.prog[key] = (S.daily.prog[key] || 0) + n;
}

function addCoins(n, sfx = true) {
  S.coins += n;
  if (sfx && n > 0) AudioFX.play("coin");
  updateTopbar();
}

// ---------- XP & level pemain (affinity) ----------
const xpNeed = l => 120 + (l - 1) * 90;

function addXP(n) {
  S.xp += n;
  while (S.xp >= xpNeed(S.plvl)) {
    S.xp -= xpNeed(S.plvl);
    S.plvl++;
    const r = PLVL_REWARDS[S.plvl];
    if (r) {
      if (r.coins) S.coins += r.coins;
      if (r.skin && !S.skins.includes(r.skin)) S.skins.push(r.skin);
      if (r.title && !S.titles.includes(r.title)) S.titles.push(r.title);
      if (r.item) S.inv[r.item] += r.n;
    }
    S.pendingLvUp.push(S.plvl);
  }
}

// ---------- Pilihan cerita -> meter ----------
function meters() {
  let rep = 0, aka = 0;
  for (const [k, idx] of Object.entries(S.choices)) {
    const o = CHOICES[k].options[idx];
    rep += o.rep; aka += o.aka;
  }
  return { rep, aka };
}

function endingKey() {
  if (S.levels[13]) return "juragan";
  const { rep, aka } = meters();
  if (aka >= 3 && aka >= rep) return "wisuda";
  if (rep >= 2) return "seleb";
  if (aka >= 2) return "wisuda";
  return "cilok";
}

// =====================================================================
//  UI DASAR: layar, toast, callout, modal
// =====================================================================
function show(id) {
  $$(".screen").forEach(s => s.classList.toggle("active", s.id === id));
}

function toast(html, ms = 2600) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = html;
  $("#toasts").appendChild(t);
  setTimeout(() => t.classList.add("out"), ms);
  setTimeout(() => t.remove(), ms + 400);
}

function callout(text, cls = "") {
  const c = document.createElement("div");
  c.className = "callout " + cls;
  c.textContent = text;
  $("#callouts").appendChild(c);
  setTimeout(() => c.remove(), 1500);
}

function openModal(html, cls = "") {
  const m = $("#modal");
  $("#modal-box").className = "modal-box " + cls;
  $("#modal-box").innerHTML = html;
  m.classList.remove("hidden");
  return $("#modal-box");
}

function closeModal() { $("#modal").classList.add("hidden"); }

// modal dengan tombol -> Promise berisi index tombol
function ask(title, body, buttons, cls = "") {
  return new Promise(res => {
    const box = openModal(`<h2>${title}</h2><div class="m-body">${body}</div>
      <div class="m-actions">${buttons.map((b, i) => `<button class="btn ${b.cls || ""}" data-i="${i}" ${b.disabled ? "disabled" : ""}>${b.label}</button>`).join("")}</div>`, cls);
    box.querySelectorAll("[data-i]").forEach(btn => btn.onclick = () => {
      AudioFX.play("click");
      closeModal();
      res(+btn.dataset.i);
    });
  });
}

// =====================================================================
//  DIALOG CERITA (visual novel mini)
// =====================================================================
function playDialog(lines) {
  return new Promise(res => {
    if (!lines || !lines.length) return res();
    const box = $("#dialog");
    box.classList.remove("hidden");
    let k = 0, typing = null, full = "";
    const txt = $("#dlg-text");

    const finish = () => { clearInterval(typing); typing = null; txt.textContent = full; };
    const end = () => { finish(); box.classList.add("hidden"); box.onclick = null; $("#dlg-skip").onclick = null; res(); };
    const next = () => {
      if (k >= lines.length) return end();
      const [who, text] = lines[k++];
      const ch = CHARS[who];
      $("#dlg-ava").textContent = ch.emoji;
      $("#dlg-name").textContent = T(ch.name);
      $("#dlg-name").style.background = ch.color;
      $("#dlg-ava").style.borderColor = ch.color;
      box.dataset.side = who === "budi" ? "right" : "left";
      $("#dlg-ava").classList.remove("speaking"); void $("#dlg-ava").offsetWidth; $("#dlg-ava").classList.add("speaking");
      full = T(text);
      let i = 0;
      txt.textContent = "";
      clearInterval(typing);
      typing = setInterval(() => {
        i += 2;
        txt.textContent = full.slice(0, i);
        if (i % 4 === 0) AudioFX.play("type");
        if (i >= full.length) finish();
      }, 22);
      if (who === "kucing") AudioFX.play("meow");
    };
    box.onclick = e => {
      if (e.target.closest("#dlg-skip")) return;
      if (typing) finish(); else next();
    };
    $("#dlg-skip").onclick = e => { e.stopPropagation(); end(); };
    next();
  });
}

function doChoice(key) {
  const c = CHOICES[key];
  return new Promise(res => {
    const box = openModal(`<div class="choice-head"><span class="ava-big">${CHARS[c.who].emoji}</span><h2>${T(c.q)}</h2></div>
      <p class="muted">Pilihanmu memengaruhi bonus level berikutnya & <b>ending cerita</b>.</p>
      <div class="choice-list">${c.options.map((o, i) => `<button class="btn choice" data-i="${i}">${o.text}</button>`).join("")}</div>`, "choice-modal");
    box.querySelectorAll("[data-i]").forEach(b => b.onclick = async () => {
      AudioFX.play("click");
      const i = +b.dataset.i, o = c.options[i];
      closeModal();
      S.choices[key] = i;
      S.bonus[c.next] = o.bonus || {};
      if (o.coins && !S.choiceCoins[key]) { S.choiceCoins[key] = true; addCoins(o.coins); }
      persist();
      await playDialog(o.reply);
      res(i);
    });
  });
}

// =====================================================================
//  PETA DUNIA (area terkunci + kabut + rahasia)
// =====================================================================
function updateTopbar() {
  if (!S) return;
  $("#tb-name").textContent = S.name || "Budi";
  $("#tb-title").textContent = S.title;
  $("#tb-lvl").textContent = S.plvl;
  $("#tb-xp").style.width = Math.min(100, (S.xp / xpNeed(S.plvl)) * 100) + "%";
  $("#tb-coins").textContent = "🪙 " + fmt(S.coins);
  $("#tb-streak").textContent = "🔥 " + S.streak.count + " hari";
  const claimable = S.daily.quests.filter(q => (S.daily.prog[q.key] || 0) >= q.target && !S.daily.claimed.includes(q.id)).length;
  setBadge("quest", claimable);
  setBadge("chat", S.chatUnread);
  $("#g-chat-badge") && ($("#g-chat-badge").textContent = S.chatUnread || "", $("#g-chat-badge").hidden = !S.chatUnread);
}

function setBadge(key, n) {
  const b = document.querySelector(`[data-open="${key}"] .badge`);
  if (b) { b.textContent = n; b.hidden = !n; }
}

function nodeHTML(l) {
  const rec = S.levels[l.id];
  const state = rec ? "done" : l.id === S.unlocked || l.id === 13 ? "current" : "locked";
  const icon = l.boss ? CHARS[l.boss.key].emoji : l.id === 13 ? "📦" : l.id;
  const stars = [1, 2, 3].map(s => `<i class="${rec && rec.stars >= s ? "on" : ""}">★</i>`).join("");
  return `<button class="node ${state} ${l.boss ? "boss" : ""}" data-level="${l.id}" ${state === "locked" ? "disabled" : ""}>
      <span class="n-ico">${state === "locked" ? "🔒" : icon}</span>
      <span class="n-stars">${stars}</span>
      <span class="n-name">${l.name.replace("BOSS: ", "").replace("FINAL BOSS: ", "")}</span>
    </button>`;
}

function renderMap() {
  const m = $("#map");
  let html = "";
  AREAS.forEach((a, ai) => {
    const lv = LEVELS.filter(l => l.area === ai);
    const locked = lv[0].id > S.unlocked;
    const got = lv.reduce((s, l) => s + (S.levels[l.id]?.stars || 0), 0);
    html += `<section class="area area-${ai} ${locked ? "fog" : ""}">
      <header><span class="a-emo">${a.emoji}</span><div><h3>${a.name}</h3><p>${a.desc}</p></div><span class="a-stars">★ ${got}/9</span></header>
      <div class="path">${lv.map(nodeHTML).join("")}</div>
      ${ai === 0 ? `<button class="map-cat" id="map-cat" title="???">🐈</button>` : ""}
      ${locked ? `<div class="fog-layer"><span>🌫️</span><b>Area belum dijelajahi</b><small>Selesaikan level ${lv[0].id - 1} untuk membuka kabut</small></div>` : ""}
    </section>`;
  });
  if (S.secretFound) {
    html += `<section class="area area-secret"><header><span class="a-emo">📦</span><div><h3>Gudang Rahasia Kost</h3><p>Terkunci sejak 1998. Bau cilok anget.</p></div></header>
      <div class="path">${nodeHTML(SECRET_LEVEL)}</div></section>`;
  } else {
    html += `<section class="area area-secret fog"><header><span class="a-emo">❓</span><div><h3>???</h3><p>Konon ada gudang terkunci di kost ini...</p></div></header>
      <div class="path"></div><div class="fog-layer"><span>🌫️</span><b>Lokasi tersembunyi</b><small>Kucing tetangga sering terlihat mondar-mandir di Kamar Kost...</small></div></section>`;
  }
  m.innerHTML = html;
  m.querySelectorAll(".node:not([disabled])").forEach(n => n.onclick = () => {
    AudioFX.play("click");
    const id = +n.dataset.level;
    levelInfo(id === 13 ? SECRET_LEVEL : LEVELS.find(l => l.id === id));
  });
  const cat = $("#map-cat");
  if (cat) cat.onclick = e => { e.stopPropagation(); catClick(cat); };
  const cur = m.querySelector(".node.current");
  if (cur) setTimeout(() => cur.scrollIntoView({ block: "center", behavior: "smooth" }), 100);
}

function catClick(cat) {
  AudioFX.play("meow");
  S.catClicks++;
  const lines = ["Meong?", "Meong!", "Meong meong!!", "...meong (ikut aku)"];
  cat.classList.remove("jump"); void cat.offsetWidth; cat.classList.add("jump");
  if (S.secretFound) { toast("🐈 Meong. (Gudangnya sudah ketemu, manusia.)"); return; }
  if (S.catClicks < 5) { toast("🐈 " + lines[S.catClicks - 1]); persist(); return; }
  S.secretFound = true;
  persist();
  AudioFX.play("unlock");
  toast("📦 <b>GUDANG RAHASIA DITEMUKAN!</b> Kucing menuntunmu ke balik lemari...", 4000);
  checkAch();
  renderMap();
  setTimeout(() => $(".area-secret")?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
}

function goalsText(L) {
  const g = L.goals, out = [];
  if (g.score) out.push(`🎯 Capai skor <b>${fmt(g.score)}</b>`);
  if (g.collect) for (const [t, n] of Object.entries(g.collect)) out.push(`${TILES[t].emoji} Kumpulkan <b>${n}</b> ${TILES[t].name}`);
  if (g.blockers) out.push(`🧾 Hancurkan <b>semua penghalang</b>`);
  if (L.boss) out.push(`${CHARS[L.boss.key].emoji} Kalahkan <b>${CHARS[L.boss.key].name}</b> (HP ${L.boss.hp})`);
  return out;
}

async function levelInfo(L) {
  const rec = S.levels[L.id];
  const bonus = S.bonus[L.id];
  const bonusTxt = bonus && Object.keys(bonus).length
    ? `<div class="bonus-box">🎁 Bonus pilihanmu: ${bonus.moves ? `+${bonus.moves} langkah ` : ""}${bonus.bossHp ? `HP bos ${Math.round(bonus.bossHp * 100)}% ` : ""}${bonus.specials ? `${bonus.specials} makanan spesial di awal` : ""}</div>` : "";
  const i = await ask(`${L.boss ? "⚔️ " : ""}Level ${L.id}: ${L.name}`,
    `<ul class="goal-list">${goalsText(L).map(g => `<li>${g}</li>`).join("")}</ul>
     <p>👣 Langkah: <b>${L.moves}</b> &nbsp; 🍽️ Jenis makanan: <b>${L.colors}</b></p>
     ${rec ? `<p>Rekor: <b>${fmt(rec.best)}</b> ${"★".repeat(rec.stars)}</p>` : ""}${bonusTxt}`,
    [{ label: "Batal" }, { label: rec ? "⚔️ Tantang Ulang" : "▶ Main!", cls: "primary" }]);
  if (i === 1) startLevel(L);
}

async function startLevel(L, skipIntro = false) {
  if (!skipIntro && L.intro) {
    AudioFX.music(L.boss ? "boss" : "map");
    await playDialog(DIALOG[L.intro]);
  }
  beginGame("story", L);
}

async function gotoMap() {
  stopTimer();
  if (G) G.ended = true;
  board.locked = true;
  show("scr-map");
  renderMap();
  updateTopbar();
  AudioFX.music("map");
  while (S.pendingLvUp.length) {
    const lv = S.pendingLvUp.shift();
    persist();
    AudioFX.play("unlock");
    const r = PLVL_REWARDS[lv];
    await ask(`⬆️ NAIK LEVEL! Lv ${lv}`, `<div class="center big-emo">🎉</div><p class="center">Kamu makin senior di kost ini.</p>
      ${r ? `<div class="bonus-box">🎁 Hadiah: <b>${r.text}</b></div>` : `<p class="center muted">Hadiah berikutnya di level ${Object.keys(PLVL_REWARDS).find(k => +k > lv) || "—"}</p>`}`,
      [{ label: "Mantap!", cls: "primary" }]);
  }
  updateTopbar();
}

// =====================================================================
//  SESI PERMAINAN
// =====================================================================
const FREE_LEVEL = {
  endless:  { id: 0, name: "Mode Bebas", area: -1, colors: 6, goals: {}, stars: [3000, 6000, 10000], moves: Infinity },
  deadline: { id: 0, name: "Mode Deadline", area: -1, colors: 6, goals: {}, stars: [2000, 4000, 6000], moves: Infinity },
};

const TIPS = [
  "Geser 🍲 Rice Cooker ke 🌶️ Garis Pedas: semua makanan sejenis jadi pedas!",
  "Gabungkan dua makanan spesial untuk ledakan super.",
  "Undo (Ctrl+Z Kehidupan) gratis 1x per level.",
  "Mati lampu? Arahkan kursor/jari untuk menyenter papan.",
  "Bos menyerang tiap beberapa langkah. Lihat hitungan di bawah HP-nya.",
  "Konon ada kode rahasia di game ini... jelajahi kost dengan teliti.",
  "Sisa langkah saat menang berubah jadi bonus 'KIRIMAN CAIR!'.",
  "Login tiap hari = bonus absen makin besar.",
  "Penghalang hancur kalau ada match di sebelahnya.",
];

function beginGame(mode, L) {
  stopTimer();
  const bonus = (mode === "story" && S.bonus[L.id]) || {};
  G = {
    mode, L, moves: mode === "story" ? L.moves + (bonus.moves || 0) : Infinity,
    score: 0, collect: {}, boss: null, dark: 0, undoUsed: false, snap: null,
    first: false, ended: false, maxCombo: 0, time: mode === "deadline" ? 120 : 0, timer: null,
    talkCd: 0, hurtCd: 0, eventCd: 3, lastWarn: false,
  };
  if (L.goals.collect) for (const [t, n] of Object.entries(L.goals.collect)) G.collect[t] = n;
  if (L.boss) {
    G.boss = { ...L.boss, max: L.boss.hp, hp: Math.round(L.boss.hp * (1 + (bonus.bossHp || 0))), turn: L.boss.every, enraged: false };
  }
  show("scr-game");
  $("#g-area").textContent = L.area >= 0 ? AREAS[L.area].emoji + " " + AREAS[L.area].name : L.id === 13 ? "📦 Gudang Rahasia" : "🎮 Mode Lain";
  $("#g-name").textContent = L.name;
  $("#g-moves-label").textContent = mode === "deadline" ? "WAKTU" : "LANGKAH";
  $("#g-tip").innerHTML = "💡 " + rand(TIPS);
  board.bias = null; board.biasLeft = 0; board.itemMode = null;
  $("#board-wrap").classList.remove("targeting");
  board.setup(L.colors, L.start || {});
  setDark(false);
  renderBossPanel();
  renderItems();
  renderGoals();
  updateHUD();
  AudioFX.music(L.music || (mode === "story" ? "game" : "game"));
  if (bonus.specials) setTimeout(() => board.run(() => board.makeSpecials(bonus.specials)), 1000);
  if (mode === "deadline") {
    G.timer = setInterval(() => {
      if (G.ended) return;
      G.time--;
      updateHUD();
      if (G.time <= 10 && G.time > 0) AudioFX.play("click");
      if (G.time <= 0) { stopTimer(); endFreeMode(); }
    }, 1000);
  }
}

function stopTimer() { if (G && G.timer) { clearInterval(G.timer); G.timer = null; } }

function blockersLeft() { return board.grid.filter(t => t && t.kind === "b").length; }

function goalsMet() {
  const g = G.L.goals;
  if (g.score && G.score < g.score) return false;
  if (g.collect && Object.values(G.collect).some(v => v > 0)) return false;
  if (g.blockers && blockersLeft() > 0) return false;
  if (G.boss && G.boss.hp > 0) return false;
  return true;
}

// ---------- HUD ----------
let hudQueued = false;
function hudDirty() {
  if (hudQueued) return;
  hudQueued = true;
  requestAnimationFrame(() => { hudQueued = false; updateHUD(); });
}

function renderGoals() {
  const g = G.L.goals, out = [];
  if (G.mode === "endless") out.push(`<div class="goal"><span class="g-emo">♾️</span><b>Cetak skor setinggi mungkin!</b></div>`);
  if (G.mode === "deadline") out.push(`<div class="goal"><span class="g-emo">⏰</span><b>Skor maksimal dalam 2 menit!</b></div>`);
  if (g.score) out.push(`<div class="goal" data-goal="score"><span class="g-emo">🎯</span><b></b></div>`);
  if (g.collect) for (const t of Object.keys(g.collect)) out.push(`<div class="goal" data-goal="t${t}"><span class="g-emo">${TILES[t].emoji}</span><b></b></div>`);
  if (g.blockers) out.push(`<div class="goal" data-goal="blk"><span class="g-emo">🧾</span><b></b></div>`);
  if (G.boss) out.push(`<div class="goal" data-goal="boss"><span class="g-emo">${CHARS[G.boss.key].emoji}</span><b></b></div>`);
  $("#g-goals").innerHTML = out.join("");
}

function updateHUD() {
  if (!G) return;
  const L = G.L;
  const mv = $("#g-moves");
  if (G.mode === "deadline") mv.textContent = Math.floor(G.time / 60) + ":" + String(G.time % 60).padStart(2, "0");
  else mv.textContent = G.moves === Infinity ? "∞" : G.moves;
  mv.classList.toggle("low", (G.mode === "story" && G.moves <= 5) || (G.mode === "deadline" && G.time <= 15));
  $("#g-score").textContent = fmt(G.score);
  const max = L.stars[2];
  $("#g-starfill").style.width = Math.min(100, (G.score / max) * 100) + "%";
  $$(".starbar .st").forEach((s, i) => {
    s.style.left = (L.stars[i] / max) * 100 + "%";
    s.classList.toggle("on", G.score >= L.stars[i]);
  });
  const set = (k, txt, done) => {
    const e = document.querySelector(`[data-goal="${k}"]`);
    if (e) { e.querySelector("b").textContent = txt; e.classList.toggle("done", done); }
  };
  if (L.goals.score) set("score", `${fmt(G.score)} / ${fmt(L.goals.score)}`, G.score >= L.goals.score);
  for (const [t, n] of Object.entries(G.collect)) set("t" + t, n > 0 ? `sisa ${n}` : "✔ beres", n <= 0);
  if (L.goals.blockers) { const b = blockersLeft(); set("blk", b > 0 ? `sisa ${b}` : "✔ beres", b <= 0); }
  if (G.boss) {
    const b = G.boss;
    set("boss", b.hp > 0 ? `HP ${b.hp}` : "✔ K.O.", b.hp <= 0);
    $("#boss-hp").style.width = (b.hp / b.max) * 100 + "%";
    $("#boss-hp-txt").textContent = `${b.hp} / ${b.max}`;
    $("#boss-turn").textContent = b.hp > 0 ? `⚡ Jurus berikutnya dalam ${b.turn} langkah${b.enraged ? " (MARAH!)" : ""}` : "💀 K.O.";
    $("#boss-panel").classList.toggle("enraged", b.enraged);
  }
  $("#btn-undo").disabled = !G.snap || G.undoUsed || G.ended;
  $("#btn-undo").textContent = G.undoUsed ? "↩️ Undo (habis)" : "↩️ Undo 1x";
  renderItems();
}

function renderBossPanel() {
  const p = $("#boss-panel");
  if (!G.boss) { p.classList.add("hidden"); return; }
  const ch = CHARS[G.boss.key];
  p.classList.remove("hidden");
  $("#boss-ava").textContent = ch.emoji;
  $("#boss-name").textContent = ch.name;
  $("#boss-bubble").classList.remove("show");
}

function bossSay(text, ms = 2400) {
  const b = $("#boss-bubble");
  b.textContent = T(text);
  b.classList.add("show");
  clearTimeout(bossSay._t);
  bossSay._t = setTimeout(() => b.classList.remove("show"), ms);
}

function damageBoss(n) {
  const b = G.boss;
  if (!b || b.hp <= 0) return;
  b.hp = Math.max(0, b.hp - n);
  const ava = $("#boss-ava");
  ava.classList.remove("hurt"); void ava.offsetWidth; ava.classList.add("hurt");
  if (Date.now() > G.hurtCd && Math.random() < 0.15) {
    G.hurtCd = Date.now() + 4000;
    bossSay(rand(b.hurt), 1500);
  }
  if (b.enrage && !b.enraged && b.hp <= b.max / 2) { b.enraged = true; b.every = 2; b.turn = Math.min(b.turn, 2); G.enrageMsg = true; }
}

function setDark(on) {
  $("#board-wrap").classList.toggle("dark", on);
}

function renderItems() {
  const bar = $("#item-bar");
  if (!bar || !G) return;
  bar.innerHTML = Object.entries(ITEMS).map(([k, it]) => {
    const n = S.inv[k] || 0;
    const dis = G.ended || (k === "esteh" && G.mode !== "story");
    return `<button class="item ${board.itemMode === k ? "active" : ""}" data-item="${k}" ${dis ? "disabled" : ""} title="${it.name}: ${it.desc}">
      <span>${it.emoji}</span><i>${n}</i><small>${it.name}</small></button>`;
  }).join("");
  bar.querySelectorAll("[data-item]").forEach(b => b.onclick = () => useItem(b.dataset.item));
}

// ---------- Callback papan ----------
const COMBO_CALL = { 2: ["DOUBLE KILL!", "Double kill"], 3: ["TRIPLE KILL!", "Triple kill"], 4: ["MANIAC!", "Maniac"],
  5: ["SAVAGE!!", "Savage"], 6: ["GOD MODE: ANAK SULTAN!!!", "God mode"] };

function popAt(i, html, cls) {
  const r = Math.floor(i / 8), c = i % 8;
  const e = document.createElement("div");
  e.className = cls;
  e.innerHTML = html;
  e.style.left = (c + 0.5) * 12.5 + "%";
  e.style.top = (r + 0.5) * 12.5 + "%";
  $("#board-fx").appendChild(e);
  setTimeout(() => e.remove(), cls === "talk" ? 1800 : 900);
}

let flyCount = 0;
function flyTo(i, type) {
  const goal = document.querySelector(`[data-goal="t${type}"] .g-emo`);
  if (!goal || flyCount > 10) return;
  flyCount++;
  const br = $("#board").getBoundingClientRect(), gr = goal.getBoundingClientRect();
  const x = br.left + ((i % 8) + 0.5) * br.width / 8, y = br.top + (Math.floor(i / 8) + 0.5) * br.height / 8;
  const f = document.createElement("div");
  f.className = "fly";
  f.textContent = TILES[type].emoji;
  f.style.left = x + "px";
  f.style.top = y + "px";
  document.body.appendChild(f);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    f.style.transform = `translate(${gr.left + gr.width / 2 - x}px, ${gr.top + gr.height / 2 - y}px) scale(.6)`;
    f.style.opacity = ".4";
  }));
  setTimeout(() => {
    f.remove(); flyCount--;
    const g = goal.parentElement;
    g.classList.remove("bump"); void g.offsetWidth; g.classList.add("bump");
  }, 620);
}

const boardCallbacks = {
  sfx: n => AudioFX.play(n),
  onInteract: () => AudioFX.unlock(),
  beforeMove() {
    if (!G.undoUsed) G.snap = { grid: board.snapshot(), moves: G.moves, score: G.score, collect: { ...G.collect }, boss: G.boss && { ...G.boss }, dark: G.dark };
  },
  onMoveUsed() {
    if (G.mode === "story") G.moves--;
    hudDirty();
  },
  onCombo(n) {
    AudioFX.play("pop", n);
    stat("matches");
    if (n > G.maxCombo) G.maxCombo = n;
    if (n > S.stats.maxCombo) S.stats.maxCombo = n;
    if (n === 4) stat("combo4");
    if (!G.first) { G.first = true; callout("FIRST BLOOD!", "red"); AudioFX.say("First blood"); }
    else if (n >= 2) {
      const [txt, voice] = COMBO_CALL[Math.min(n, 6)];
      callout(txt, n >= 5 ? "gold big" : n >= 3 ? "gold" : "");
      AudioFX.say(voice);
    }
  },
  onMatch(runs, combo) {
    const run = runs[0];
    const mid = run.cells[Math.floor(run.cells.length / 2)];
    const pts = runs.reduce((s, r) => s + r.cells.length, 0) * 20 * Math.max(1, combo);
    popAt(mid, "+" + pts, "score-pop");
    const t = board.grid[mid];
    if (t && t.type >= 0 && Date.now() > G.talkCd && Math.random() < 0.3) {
      G.talkCd = Date.now() + 2500;
      popAt(mid, TILES[t.type].emoji + " " + rand(TILES[t.type].lines), "talk");
    }
  },
  onTileCleared(t, i) {
    if (t.kind !== "n") return;
    G.score += 20 * Math.max(1, board.combo);
    stat("tiles");
    if (t.type >= 0) {
      stat("tile" + t.type);
      if (G.collect[t.type] > 0) { G.collect[t.type]--; flyTo(i, t.type); }
    }
    damageBoss(1);
    hudDirty();
  },
  onBlockerHit(t, destroyed) {
    G.score += 40;
    AudioFX.play(destroyed ? "crack" : "hit");
    if (destroyed) stat("blockers");
    damageBoss(2);
    hudDirty();
  },
  onSpecialMade(sp) {
    stat("specials");
    if (sp === "bomb") stat("bombs");
    else if (sp === "color") { stat("colors"); callout("RICE COOKER AJAIB!", "gold"); AudioFX.say("Unstoppable"); }
    else stat("lines");
    G.score += 60;
    AudioFX.play("born");
  },
  onSpecialFired(sp) {
    AudioFX.play(sp === "bomb" ? "boom" : "special");
    if (sp === "color") AudioFX.play("boom");
  },
  onShake() {
    const w = $("#board-wrap");
    w.classList.remove("shake-hard"); void w.offsetWidth; w.classList.add("shake-hard");
  },
  onShuffle() { toast("🌀 Nggak ada langkah! Meja digoyang..."); },
  onItemTarget: idx => useItemOn(idx),
  afterMove,
};

// ---------- Setelah setiap langkah ----------
async function afterMove() {
  if (!G || G.ended) return;
  if (G.mode === "story" && goalsMet()) return winLevel();

  if (G.dark > 0) { G.dark--; if (!G.dark) setDark(false); }

  if (G.enrageMsg) {
    G.enrageMsg = false;
    callout("FASE 2: BOS MARAH!", "red big");
    bossSay("CUKUP! Sekarang aku SERIUS!", 2200);
    AudioFX.play("boss");
    await sleep(900);
  }

  if (G.boss && G.boss.hp > 0) {
    G.boss.turn--;
    if (G.boss.turn <= 0) {
      await bossAct();
      G.boss.turn = G.boss.every;
    }
    updateHUD();
  }

  G.eventCd--;
  const eventOk = G.mode !== "deadline" && (G.L.id >= 2 || G.mode === "endless") && G.eventCd <= 0 && (G.mode !== "story" || G.moves > 2);
  if (eventOk && Math.random() < 0.09) { G.eventCd = 5; await randomEvent(); }

  if (G.mode === "story" && goalsMet()) return winLevel();
  if (G.mode === "story" && G.moves <= 0) return loseLevel();
  if (G.mode === "story" && G.moves === 3) callout("Langkah tinggal 3!", "red");
  updateHUD();
  persistSoon();
}

let persistTimer = null;
function persistSoon() { clearTimeout(persistTimer); persistTimer = setTimeout(persist, 1500); }

async function bossAct() {
  const b = G.boss;
  const a = rand(b.actions);
  const ava = $("#boss-ava");
  bossSay(a.say, 2600);
  ava.classList.add("attack");
  AudioFX.play("boss");
  await sleep(650);
  switch (a.do) {
    case "spawn": await board.spawnBlockers(a.block, a.n); break;
    case "steal": await board.steal(a.n); break;
    case "moves": G.moves = Math.max(1, G.moves - a.n); callout(`-${a.n} LANGKAH!`, "red"); break;
    case "dark": setDark(true); G.dark = a.n; break;
    case "shuffle": await board.shuffle(); break;
    case "heal": b.hp = Math.min(b.max, b.hp + a.n); callout(`BOS +${a.n} HP!`, "red"); break;
  }
  if (!board.findMove()) await board.shuffle();
  ava.classList.remove("attack");
  hudDirty();
}

const WA_SPAM = [
  ["ibukost", "Info: air mati jam 10-12. Yang belum bayar kost, airnya mati selamanya."],
  ["joko", "ada yg liat sandal gue? yg kiri doang"],
  ["siti", "Reminder: deadline tugas 3 jam lagi 🙂"],
  ["satpam", "Motor plat AB yang parkir depan gerbang, tolong dipindah. Prosedur."],
  ["kucing", "meong (foto: kucing tidur di jok motormu)"],
  ["joko", "@{NAME} bro pinjem charger"],
];

function eventBanner(ev) {
  return new Promise(res => {
    const b = $("#event-banner");
    b.innerHTML = `<span>${ev.emoji}</span><div><b>${ev.title}</b><small>${ev.desc}</small></div>`;
    b.classList.remove("hidden");
    b.classList.remove("in"); void b.offsetWidth; b.classList.add("in");
    AudioFX.play("event");
    setTimeout(() => { b.classList.add("hidden"); res(); }, 1700);
  });
}

async function randomEvent() {
  const ev = rand(EVENTS);
  await eventBanner(ev);
  switch (ev.key) {
    case "dark": setDark(true); G.dark = 3; break;
    case "cat": AudioFX.play("meow"); await board.steal(4); break;
    case "money":
      if (G.mode === "story") G.moves += 3; else G.score += 500;
      addCoins(25);
      break;
    case "treat": await board.makeSpecials(2); break;
    case "leak": await board.spawnBlockers("ember", 2); break;
    case "wa": { const [w, t] = rand(WA_SPAM); chatPush(w, t); break; }
  }
  if (!board.findMove()) await board.shuffle();
  hudDirty();
}

// ---------- Menang / kalah ----------
async function fatality() {
  const b = G.boss, ch = CHARS[b.key];
  AudioFX.stopMusic();
  AudioFX.play("boom");
  const ov = $("#fatality");
  ov.innerHTML = `<div class="fat-bg"></div><div class="fat-boss">${ch.emoji}</div>
    <h1 class="fat-text">${"FATALITY".split("").map((c, i) => `<span style="animation-delay:${i * 0.07}s">${c}</span>`).join("")}</h1>
    <p class="fat-sub">${T(b.fatal)}</p><small class="fat-hint">klik untuk lanjut</small>`;
  ov.classList.remove("hidden");
  document.body.classList.remove("shake-hard"); void document.body.offsetWidth; document.body.classList.add("shake-hard");
  setTimeout(() => AudioFX.say("Fatality", "en-US", 0.2, 0.7), 300);
  setTimeout(() => AudioFX.play("boom"), 700);
  setTimeout(() => AudioFX.play("boom"), 1300);
  await sleep(1600);
  await new Promise(res => {
    const t = setTimeout(done, 3500);
    function done() { clearTimeout(t); ov.onclick = null; res(); }
    ov.onclick = done;
  });
  ov.classList.add("hidden");
  document.body.classList.remove("shake-hard");
}

async function winLevel() {
  if (G.ended) return;
  G.ended = true;
  board.locked = true;
  const L = G.L;
  if (G.boss) await fatality();
  else { callout("MISI SELESAI!", "gold big"); AudioFX.say("Excellent"); await sleep(1000); }

  if (G.moves > 0) {
    callout("KIRIMAN CAIR!!", "gold big");
    AudioFX.say("Bonus");
    await sleep(500);
    const n = Math.min(G.moves, 15);
    await board.bonusBlast(n, () => { G.moves--; G.score += 60; hudDirty(); });
    G.score += G.moves * 60;
    G.moves = 0;
    updateHUD();
    await sleep(400);
  }

  const stars = Math.max(1, L.stars.filter(s => G.score >= s).length);
  const prev = S.levels[L.id];
  const first = !prev;
  const coins = 25 + stars * 15 + (first ? 50 : 0) + Math.floor(G.score / 500);
  const xp = Math.floor(G.score / 40) + 20;
  S.levels[L.id] = { stars: Math.max(stars, prev?.stars || 0), best: Math.max(G.score, prev?.best || 0) };
  if (L.id <= 12) S.unlocked = Math.max(S.unlocked, L.id + 1);
  S.coins += coins;
  stat("wins");
  stat("score", G.score);
  addXP(xp);
  AudioFX.stopMusic();
  AudioFX.play("win");
  if (L.boss) chatPush("joko", rand([`GILA ${S.name.toUpperCase()} NGALAHIN ${CHARS[L.boss.key].name.toUpperCase()} 🔥🔥`, "FATALITY!! gue liat dari jendela bro 😱"]));
  else if (Math.random() < 0.5) chatPush(...rand([["joko", "anjay menang lagi 🔥"], ["siti", "Selamat! Jangan lupa skripsi."], ["satpam", "Mantap, Mas. Sesuai prosedur."], ["joko", `${stars} bintang? ${stars === 3 ? "SUHU 🙇" : "lumayan lah"}`]]));
  persist();
  checkAch();

  const box = openModal(`<h2 class="center">🎉 LEVEL BERES!</h2>
    <div class="win-stars">${[1, 2, 3].map(s => `<span class="ws" data-s="${s}">★</span>`).join("")}</div>
    <div class="win-score">${fmt(G.score)}</div>
    ${!prev || G.score > prev.best ? `<p class="center new-best">🏅 REKOR BARU!</p>` : ""}
    <div class="win-rewards"><span>🪙 +${coins}</span><span>✨ +${xp} XP</span>${first ? `<span>🆕 Pertama kali!</span>` : ""}</div>
    <div class="m-actions"><button class="btn primary" id="win-next">Lanjut ▶</button></div>`, "win-modal");
  for (let s = 1; s <= stars; s++) {
    await sleep(380);
    box.querySelector(`.ws[data-s="${s}"]`).classList.add("on");
    AudioFX.play("star", s);
  }
  await new Promise(res => (box.querySelector("#win-next").onclick = () => { AudioFX.play("click"); closeModal(); res(); }));

  if (L.outro) { AudioFX.music("map"); await playDialog(DIALOG[L.outro]); }
  if (L.choice) await doChoice(L.choice);
  if (L.id === 12 || (L.id === 13 && S.levels[12])) await showEnding();
  else if (L.id === 13) toast("📦 Kalahkan Sidang Skripsi untuk membuka <b>ENDING RAHASIA</b>!", 4500);
  gotoMap();
}

const LOSE_QUOTES = [
  "Stok habis. Kamu terpaksa makan angin. Rasanya... angin.",
  "Kamu pingsan karena lapar. Joko memotretmu untuk status WA.",
  "Kamu kalah. Kucing tetangga tertawa (dalam bahasa kucing).",
  "Gagal. Tapi tenang, gagal itu biasa. Kamu sudah sangat terbiasa.",
];

async function loseLevel() {
  G.ended = true;
  board.locked = true;
  AudioFX.stopMusic();
  AudioFX.play("lose");
  stat("losses");
  chatPush("joko", rand(["wkwkwk kalah 🤣", "gpp bro, gue juga sering kalah. dalam hidup.", "F 🫡"]));
  persist();
  checkAch();
  const taunt = G.boss ? `<div class="bonus-box">${CHARS[G.boss.key].emoji} <i>"${rand(["Hahaha! Coba lagi tahun depan!", "Lemah! Kembali ke semester 1!", "Sudah kuduga."])}"</i></div>` : "";
  const i = await ask("😭 GAGAL!", `<p class="center">${rand(LOSE_QUOTES)}</p>${taunt}`,
    [{ label: "🗺️ Peta" }, { label: "⚔️ Tantang Ulang", cls: "danger" }, { label: "🧋 +5 Langkah (🪙60)", cls: "primary", disabled: S.coins < 60 }]);
  if (i === 2) {
    S.coins -= 60;
    updateTopbar();
    G.moves += 5;
    G.ended = false;
    board.locked = false;
    callout("BELUM MENYERAH!", "gold");
    AudioFX.music(G.L.music || "game");
    updateHUD();
  } else if (i === 1) {
    callout("REVENGE MODE!", "red big");
    AudioFX.say("Round two");
    beginGame("story", G.L);
  } else gotoMap();
}

// ---------- Mode bebas / deadline ----------
async function endFreeMode() {
  if (G.ended) return;
  while (board.busy) await sleep(100);
  G.ended = true;
  board.locked = true;
  stopTimer();
  AudioFX.stopMusic();
  AudioFX.play("win");
  const key = G.mode;
  const prev = S.best[key];
  S.best[key] = Math.max(prev, G.score);
  const coins = Math.floor(G.score / 120);
  S.coins += coins;
  stat("score", G.score);
  if (G.score >= 2000) stat("wins");
  addXP(Math.floor(G.score / 60));
  persist();
  checkAch();
  const i = await ask(key === "deadline" ? "⏰ WAKTU HABIS!" : "♾️ SELESAI!",
    `<div class="win-score">${fmt(G.score)}</div>${G.score > prev ? `<p class="center new-best">🏅 REKOR BARU!</p>` : `<p class="center muted">Rekor: ${fmt(prev)}</p>`}
     <div class="win-rewards"><span>🪙 +${coins}</span><span>🔥 Combo maks ${G.maxCombo}x</span></div>`,
    [{ label: "🗺️ Peta" }, { label: "🔁 Main Lagi", cls: "primary" }]);
  if (i === 1) beginGame(key, FREE_LEVEL[key]);
  else gotoMap();
}

// ---------- Item ----------
async function useItem(k) {
  if (!G || G.ended || board.busy) return;
  AudioFX.play("click");
  if (!S.inv[k]) { toast(`${ITEMS[k].emoji} Habis! Beli di 🏪 Warung Bu Tejo.`); return; }
  const it = ITEMS[k];
  if (it.target) {
    board.itemMode = board.itemMode === k ? null : k;
    $("#board-wrap").classList.toggle("targeting", !!board.itemMode);
    if (board.itemMode) toast(`${it.emoji} Pilih petak untuk ${it.name}. (Esc untuk batal)`);
    renderItems();
    return;
  }
  S.inv[k]--;
  stat("items");
  if (k === "goyang") { callout("GOYANG MEJA!", "gold"); await board.run(() => board.shuffle()); }
  if (k === "esteh") { G.moves += 3; callout("+3 LANGKAH! SEGERRR", "gold"); AudioFX.play("coin"); }
  persist();
  updateHUD();
}

async function useItemOn(idx) {
  const k = board.itemMode;
  board.itemMode = null;
  $("#board-wrap").classList.remove("targeting");
  const t = board.grid[idx];
  if (!t || !S.inv[k]) { renderItems(); return; }
  if (k === "ricecooker" && t.kind !== "n") { toast("Rice Cooker cuma bisa ditaruh di makanan!"); renderItems(); return; }
  S.inv[k]--;
  stat("items");
  persist();
  if (k === "sandal") {
    callout("PLAK! 🩴", "red");
    AudioFX.play("hit");
    await board.run(() => board.hammer(idx));
  } else if (k === "ricecooker") board.setColorBomb(idx);
  updateHUD();
  if (G.mode === "story" && goalsMet()) winLevel();
}

// ---------- Undo ----------
function undo() {
  if (!G || !G.snap || G.undoUsed || board.busy || G.ended) return;
  const s = G.snap;
  board.restore(s.grid);
  G.moves = s.moves; G.score = s.score; G.collect = s.collect; G.dark = s.dark;
  if (s.boss) G.boss = s.boss;
  setDark(G.dark > 0);
  G.undoUsed = true;
  callout("CTRL+Z KEHIDUPAN!", "gold");
  AudioFX.play("shuffle");
  updateHUD();
}

// =====================================================================
//  ACHIEVEMENT, MISI HARIAN, STREAK
// =====================================================================
function checkAch() {
  for (const a of ACH) {
    if (S.ach[a.id] || !a.cond(S)) continue;
    S.ach[a.id] = dateStr();
    S.coins += a.reward;
    if (a.title && !S.titles.includes(a.title)) S.titles.push(a.title);
    AudioFX.play("unlock");
    toast(`<span class="ach-ico">${a.emoji}</span><div><b>Prestasi: ${a.name}</b><small>${a.desc}${a.reward ? ` +🪙${a.reward}` : ""}${a.title ? ` · Gelar baru: "${a.title}"` : ""}</small></div>`, 4000);
    if (Math.random() < 0.6) chatPush(...rand([["joko", `wih achievement "${a.name}" 😳 traktir dong`], ["siti", `Selamat atas "${a.name}". Aku sudah dapat itu tahun lalu.`]]));
  }
  persist();
  updateTopbar();
}

function seededPick(seedStr, arr, n) {
  let h = 0;
  for (const ch of seedStr) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = [...arr], out = [];
  while (out.length < n && pool.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    out.push(pool.splice(h % pool.length, 1)[0]);
  }
  return out;
}

function ensureDaily() {
  const t = dateStr();
  if (S.daily.date === t) return;
  S.daily = { date: t, quests: seededPick(t, QUEST_POOL, 3), prog: {}, claimed: [] };
  persist();
}

async function dailyLogin() {
  const t = dateStr();
  if (S.streak.last === t) return;
  const y = dateStr(new Date(Date.now() - 864e5));
  S.streak.count = S.streak.last === y ? S.streak.count + 1 : 1;
  S.streak.last = t;
  const day = ((S.streak.count - 1) % 7) + 1;
  const reward = day === 7 ? 300 : day * 25;
  S.coins += reward;
  if (day === 7) S.inv.ricecooker++;
  persist();
  updateTopbar();
  AudioFX.play("coin");
  const cal = [1, 2, 3, 4, 5, 6, 7].map(d => `<div class="day ${d < day ? "past" : d === day ? "today" : ""}"><small>Hari ${d}</small><b>${d === 7 ? "🎁" : "🪙"}</b><span>${d === 7 ? "300+🍲" : d * 25}</span></div>`).join("");
  await ask("📅 Bonus Absen Harian!", `<p class="center">Kamu login <b>${S.streak.count} hari</b> berturut-turut. Pak Satpam bangga.</p>
    <div class="calendar">${cal}</div><p class="center">Hari ini: <b>+🪙${reward}</b>${day === 7 ? " + 1 Rice Cooker Ajaib!" : ""}</p>
    <p class="center muted">Bolos sehari = streak kembali ke hari 1. Seperti absen kuliah.</p>`, [{ label: "Ambil!", cls: "primary" }]);
  checkAch();
}

// =====================================================================
//  MENU: Warung, Misi, Prestasi, Peringkat, Profil, Mode, Pengaturan
// =====================================================================
const MENUS = {
  shop() {
    let tab = "items";
    const greet = rand(["Mau beli apa, Mas? Ngutang boleh... bercanda.", "Sandal jepit ready, buat nimpuk tikus!", "Es teh jumbo, gula 5 sendok. Mantap."]);
    const render = () => {
      const items = Object.entries(ITEMS).map(([k, it]) => `<div class="shop-row">
          <span class="s-emo">${it.emoji}</span><div><b>${it.name}</b><small>${it.desc}</small><small>Punya: <b>${S.inv[k]}</b></small></div>
          <div class="s-btns"><button class="btn primary" data-buy="${k}" ${S.coins < it.price ? "disabled" : ""}>🪙${it.price}</button>
          <button class="btn small" data-sell="${k}" ${S.inv[k] ? "" : "disabled"}>Jual 🪙${Math.floor(it.price / 2)}</button></div></div>`).join("");
      const skins = Object.entries(SKINS).map(([k, sk]) => {
        const own = S.skins.includes(k);
        return `<div class="shop-row skin-prev-${k}"><span class="s-emo">${sk.emoji}</span><div><b>${sk.name}</b><small>${sk.desc}</small></div>
          <div class="s-btns">${own ? (S.skin === k ? `<button class="btn" disabled>✔ Dipakai</button>` : `<button class="btn" data-equip="${k}">Pakai</button>`)
            : `<button class="btn primary" data-skin="${k}" ${S.coins < sk.price ? "disabled" : ""}>🪙${sk.price}</button>`}</div></div>`;
      }).join("");
      const box = openModal(`<h2>🏪 Warung Bu Tejo</h2><p class="npc-say">👩‍🍳 "${greet}"</p>
        <div class="coins-line">Koinmu: <b>🪙 ${fmt(S.coins)}</b></div>
        <div class="tabs"><button class="tab ${tab === "items" ? "on" : ""}" data-tab="items">🧰 Barang</button><button class="tab ${tab === "skins" ? "on" : ""}" data-tab="skins">🎨 Skin Kost</button></div>
        <div class="shop-list">${tab === "items" ? items : skins}</div>
        <div class="m-actions"><button class="btn" data-close>Tutup</button></div>`, "wide");
      box.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { tab = b.dataset.tab; AudioFX.play("click"); render(); });
      box.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => {
        const k = b.dataset.buy; S.coins -= ITEMS[k].price; S.inv[k]++; stat("bought"); AudioFX.play("coin"); persist(); checkAch(); render();
      });
      box.querySelectorAll("[data-sell]").forEach(b => b.onclick = () => {
        const k = b.dataset.sell; S.inv[k]--; S.coins += Math.floor(ITEMS[k].price / 2); AudioFX.play("coin"); persist(); render();
      });
      box.querySelectorAll("[data-skin]").forEach(b => b.onclick = () => {
        const k = b.dataset.skin; S.coins -= SKINS[k].price; S.skins.push(k); S.skin = k; applySkin(); stat("bought"); AudioFX.play("unlock");
        chatPush("joko", `wih ${S.name} pake skin ${SKINS[k].name} ${SKINS[k].emoji} sombong amat`); persist(); checkAch(); render();
      });
      box.querySelectorAll("[data-equip]").forEach(b => b.onclick = () => { S.skin = b.dataset.equip; applySkin(); persist(); AudioFX.play("click"); render(); });
      box.querySelector("[data-close]").onclick = () => { closeModal(); updateTopbar(); if (G && !G.ended) renderItems(); };
      updateTopbar();
    };
    render();
  },

  quest() {
    ensureDaily();
    const render = () => {
      const qs = S.daily.quests.map(q => {
        const p = Math.min(q.target, S.daily.prog[q.key] || 0), done = p >= q.target, claimed = S.daily.claimed.includes(q.id);
        return `<div class="quest ${claimed ? "claimed" : done ? "ready" : ""}"><div><b>${q.text}</b>
          <div class="pbar"><i style="width:${(p / q.target) * 100}%"></i></div><small>${fmt(p)} / ${fmt(q.target)}</small></div>
          <button class="btn ${done && !claimed ? "primary" : ""}" data-claim="${q.id}" ${done && !claimed ? "" : "disabled"}>${claimed ? "✔" : "🪙60"}</button></div>`;
      }).join("");
      const all = S.daily.claimed.length === 3;
      const box = openModal(`<h2>📋 Misi Harian</h2><p class="muted">Reset setiap tengah malam. Seperti harapan.</p>${qs}
        <div class="bonus-box">${all ? "🎉 Semua misi beres! Bonus +100 sudah diambil." : "Selesaikan ketiganya: bonus <b>+🪙100</b>"}</div>
        <p class="muted center">🔥 Streak login: <b>${S.streak.count} hari</b></p>
        <div class="m-actions"><button class="btn" data-close>Tutup</button></div>`);
      box.querySelectorAll("[data-claim]").forEach(b => b.onclick = () => {
        S.daily.claimed.push(b.dataset.claim);
        S.coins += 60; addXP(30);
        if (S.daily.claimed.length === 3) { S.coins += 100; toast("🎉 Semua misi harian beres! +🪙100"); }
        AudioFX.play("coin"); persist(); checkAch(); render();
      });
      box.querySelector("[data-close]").onclick = () => { closeModal(); gotoMap(); };
      updateTopbar();
    };
    render();
  },

  ach() {
    const got = ACH.filter(a => S.ach[a.id]).length;
    const box = openModal(`<h2>🏅 Prestasi (${got}/${ACH.length})</h2>
      <div class="ach-grid">${ACH.map(a => `<div class="ach ${S.ach[a.id] ? "on" : ""}"><span>${S.ach[a.id] ? a.emoji : "🔒"}</span><b>${a.name}</b><small>${a.desc}</small>${a.title ? `<em>Gelar: ${a.title}</em>` : ""}</div>`).join("")}</div>
      <div class="m-actions"><button class="btn" data-close>Tutup</button></div>`, "wide");
    box.querySelector("[data-close]").onclick = closeModal;
  },

  board() {
    const mine = Object.values(S.levels).reduce((s, l) => s + l.best, 0) + S.best.endless + S.best.deadline;
    const rows = [...NPC_BOARD.map(n => ({ ...n })), { name: S.name, emoji: "🧑‍🎓", title: S.title, score: mine, me: true }]
      .sort((a, b) => b.score - a.score);
    const rank = rows.findIndex(r => r.me) + 1;
    const above = rows[rank - 2];
    const box = openModal(`<h2>🏆 Peringkat Kost Mawar</h2>
      <div class="lb">${rows.map((r, i) => `<div class="lb-row ${r.me ? "me" : ""}"><span class="rk">${["🥇", "🥈", "🥉"][i] || i + 1}</span><span class="lb-ava">${r.emoji}</span>
        <div><b>${r.name}</b><small>${r.title}</small></div><span class="lb-score">${fmt(r.score)}</span></div>`).join("")}</div>
      <div class="bonus-box">${rank === 1 ? "👑 Kamu #1! Siti mulai belajar main game diam-diam." : `${above.emoji} <b>${above.name}</b>: <i>"${above.roast}"</i>`}</div>
      <p class="muted center">Skor = total rekor semua level + Mode Bebas + Mode Deadline.</p>
      <div class="m-actions"><button class="btn" data-share>😎 Pamer ke Grup WA</button><button class="btn primary" data-close>Tutup</button></div>`);
    box.querySelector("[data-close]").onclick = closeModal;
    box.querySelector("[data-share]").onclick = () => { closeModal(); sendChat("Pamer skor 😎"); openChat(); };
  },

  profile() {
    const { rep, aka } = meters();
    const st = S.stats;
    const bar = (v, max = 5) => `<div class="meter"><i style="width:${Math.max(0, Math.min(100, ((v + 3) / (max + 3)) * 100))}%"></i></div>`;
    const box = openModal(`<h2>🧑‍🎓 Profil Mahasiswa</h2>
      <div class="prof-head"><span class="ava-big">🧑‍🎓</span><div>
        <input id="prof-name" maxlength="14" value="${S.name}"><small>Lv ${S.plvl} · ${fmt(S.xp)}/${fmt(xpNeed(S.plvl))} XP</small></div></div>
      <label>Gelar untuk dipamerkan:</label>
      <select id="prof-title">${S.titles.map(t => `<option ${t === S.title ? "selected" : ""}>${t}</option>`).join("")}</select>
      <label>Skin kost:</label>
      <select id="prof-skin">${S.skins.map(k => `<option value="${k}" ${k === S.skin ? "selected" : ""}>${SKINS[k].emoji} ${SKINS[k].name}</option>`).join("")}</select>
      <h3>📊 Statistik</h3>
      <div class="stats">
        <div>🍽️ Makanan dihancurkan<b>${fmt(st.tiles)}</b></div><div>🔥 Combo terbesar<b>${st.maxCombo}x</b></div>
        <div>💥 Bom Kompor<b>${st.bombs}</b></div><div>🌶️ Garis Pedas<b>${st.lines}</b></div>
        <div>🍲 Rice Cooker<b>${st.colors}</b></div><div>🏆 Menang / 😭 Kalah<b>${st.wins} / ${st.losses}</b></div>
      </div>
      <h3>🧭 Arah Hidupmu <small class="muted">(dari pilihan cerita)</small></h3>
      <div class="meters"><span>🤝 Reputasi Sosial</span>${bar(rep)}<span>📚 Nilai Akademik</span>${bar(aka)}</div>
      <h3>🎬 Koleksi Ending (${S.endings.length}/4)</h3>
      <div class="endings">${Object.entries(ENDINGS).map(([k, e]) => `<div class="${S.endings.includes(k) ? "on" : ""}">${S.endings.includes(k) ? e.emoji + " " + e.name.replace("ENDING: ", "").replace("ENDING RAHASIA: ", "") : "❓ ???"}</div>`).join("")}</div>
      <div class="m-actions"><button class="btn primary" data-close>Simpan</button></div>`, "wide");
    box.querySelector("#prof-skin").onchange = e => { S.skin = e.target.value; applySkin(); };
    box.querySelector("[data-close]").onclick = () => {
      S.name = box.querySelector("#prof-name").value.trim() || S.name;
      S.title = box.querySelector("#prof-title").value;
      persist(); closeModal(); updateTopbar();
    };
  },

  async modes() {
    const i = await ask("🎮 Mode Lain", `<div class="mode-list">
      <div class="mode-card"><b>♾️ Mode Bebas</b><small>Tanpa batas langkah. Kejadian acak tetap ada. Rekor: ${fmt(S.best.endless)}</small></div>
      <div class="mode-card"><b>⏰ Mode Deadline</b><small>2 menit, skor sebanyak-banyaknya. Kayak ngerjain tugas H-1. Rekor: ${fmt(S.best.deadline)}</small></div>
      <div class="mode-card"><b>📜 Tonton Ulang Prolog</b><small>Lupa kenapa kamu di sini?</small></div></div>`,
      [{ label: "♾️ Bebas", cls: "primary" }, { label: "⏰ Deadline", cls: "primary" }, { label: "📜 Prolog" }, { label: "Tutup" }]);
    if (i === 0) beginGame("endless", FREE_LEVEL.endless);
    if (i === 1) beginGame("deadline", FREE_LEVEL.deadline);
    if (i === 2) await playDialog(DIALOG.prologue);
  },

  settings() {
    const st = S.settings;
    const box = openModal(`<h2>⚙️ Pengaturan</h2>
      <label class="tog"><input type="checkbox" id="set-music" ${st.music ? "checked" : ""}> 🎵 Musik (BGM)</label>
      <label class="tog"><input type="checkbox" id="set-sfx" ${st.sfx ? "checked" : ""}> 🔊 Efek suara</label>
      <label class="tog"><input type="checkbox" id="set-voice" ${st.voice ? "checked" : ""}> 📢 Teriakan combo (DOUBLE KILL!, FATALITY!)</label>
      <h3>🕹️ Kode Rahasia</h3><div class="row"><input id="set-cheat" placeholder="Masukkan kode..." maxlength="12"><button class="btn" id="set-cheat-go">Pakai</button></div>
      <p class="muted">Kode bisa ditemukan di suatu tempat di kost...</p>
      <h3>⚠️ Bahaya</h3><button class="btn danger" id="set-reset">Hapus semua progres</button>
      <div class="m-actions"><button class="btn primary" data-close>Tutup</button></div>`);
    ["music", "sfx", "voice"].forEach(k => box.querySelector("#set-" + k).onchange = e => {
      st[k] = e.target.checked; AudioFX.set(k, st[k]); persist();
    });
    box.querySelector("#set-cheat-go").onclick = () => applyCheat(box.querySelector("#set-cheat").value.trim().toUpperCase());
    box.querySelector("#set-reset").onclick = async () => {
      closeModal();
      const i = await ask("Yakin?", "Semua progres, koin, dan prestasi akan hilang. Seperti file skripsi yang lupa di-save.", [{ label: "Batal" }, { label: "Hapus", cls: "danger" }]);
      if (i === 1) { localStorage.removeItem(SAVE_KEY); location.reload(); }
    };
    box.querySelector("[data-close]").onclick = closeModal;
  },
};

// ---------- Ending ----------
async function showEnding() {
  const k = endingKey(), e = ENDINGS[k];
  const isNew = !S.endings.includes(k);
  if (isNew) S.endings.push(k);
  persist();
  checkAch();
  AudioFX.music("ending");
  const { rep, aka } = meters();
  await ask(`${e.emoji} ${e.name}`, `<div class="ending-text">${T(e.text)}</div>
    <p class="muted center">Reputasi: ${rep} · Akademik: ${aka}</p>
    <div class="endings">${Object.entries(ENDINGS).map(([kk, ee]) => `<div class="${S.endings.includes(kk) ? "on" : ""}">${S.endings.includes(kk) ? ee.emoji + " " + ee.name.replace(/ENDING( RAHASIA)?: /, "") : "❓ ???"}</div>`).join("")}</div>
    <p class="center">${S.endings.length < 4 ? "🔁 Ada ending lain! Ulangi level 2, 5, 8, atau 10 dan buat <b>pilihan berbeda</b>, lalu taklukkan sidang lagi." : "🏆 Semua ending terbuka! Kamu Penjelajah Multiverse sejati."}</p>
    <p class="center muted">— TAMAT (untuk sekarang) —</p>`, [{ label: "Kembali ke Kost 🏠", cls: "primary" }], "ending-modal");
}

// ---------- Kode rahasia ----------
function applyCheat(code) {
  const inGame = G && !G.ended && $("#scr-game").classList.contains("active");
  let ok = true;
  if (code === "SKS") {
    if (inGame && G.mode === "story") { G.moves += 10; callout("SISTEM KEBUT SEMALAM! +10", "gold big"); updateHUD(); }
    else { toast("🕹️ SKS hanya bisa dipakai saat bermain level cerita."); ok = false; }
  } else if (code === "SULTAN") {
    addCoins(1000);
    toast("🕹️ <b>MODE SULTAN!</b> +🪙1000. Rizky Anak Sultan merasa tersaingi.");
  } else if (code === "HUJANMIE") {
    if (inGame) { board.bias = 0; board.biasLeft = 6; callout("HUJAN MIE! 🍜🍜🍜", "gold big"); }
    else { toast("🕹️ HUJANMIE hanya bisa dipakai saat bermain."); ok = false; }
  } else { toast("❌ Kode salah. Coba lagi, hacker kost."); return; }
  if (ok) { AudioFX.play("unlock"); stat("cheats"); checkAch(); persist(); }
}

// =====================================================================
//  GRUP WA KOST MAWAR
// =====================================================================
function chatPush(who, text) {
  S.chat.push({ who, text: T(text), t: Date.now() });
  if (S.chat.length > 80) S.chat.splice(0, S.chat.length - 80);
  if (!$("#chat-panel").classList.contains("open")) S.chatUnread++;
  AudioFX.play("chat");
  renderChat();
  updateTopbar();
}

function renderChat() {
  const list = $("#chat-list");
  list.innerHTML = S.chat.map(m => {
    const me = m.who === "me";
    const ch = me ? { name: S.name, emoji: "🧑‍🎓", color: "#1e88e5" } : CHARS[m.who];
    const time = new Date(m.t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    return `<div class="msg ${me ? "me" : ""}">${me ? "" : `<span class="m-ava">${ch.emoji}</span>`}<div class="bubble">
      ${me ? "" : `<b style="color:${ch.color}">${T(ch.name)}</b>`}<p>${m.text}</p><small>${time}</small></div></div>`;
  }).join("") || `<p class="muted center">Grup sepi. Seperti dompet.</p>`;
  list.scrollTop = list.scrollHeight;
}

function openChat() {
  $("#chat-panel").classList.add("open");
  S.chatUnread = 0;
  renderChat();
  updateTopbar();
  persist();
}

function sendChat(text) {
  let msg = text;
  if (text === "Pamer skor 😎") {
    const total = Object.values(S.levels).reduce((s, l) => s + l.best, 0);
    msg = `Pamer dikit 😎 Lv ${S.plvl}, gelar "${S.title}", total skor ${fmt(total)}, ⭐${Object.values(S.levels).reduce((s, l) => s + l.stars, 0)}`;
  }
  S.chat.push({ who: "me", text: msg, t: Date.now() });
  stat("chats");
  renderChat();
  AudioFX.play("chat");
  const replies = CHAT_REPLIES[text];
  setTimeout(() => {
    const [w, t] = rand(replies);
    chatPush(w, t);
    if ($("#chat-panel").classList.contains("open")) S.chatUnread = 0;
    updateTopbar();
  }, 900 + Math.random() * 700);
  checkAch();
  persist();
}

// =====================================================================
//  SKIN & BOOT
// =====================================================================
function applySkin() {
  document.body.className = document.body.className.replace(/skin-\S+/g, "").trim() + " skin-" + S.skin;
}

function bindUI() {
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal" && $("#modal-box").querySelector("[data-close]")) closeModal(); });
  $$("[data-open]").forEach(b => b.onclick = () => {
    AudioFX.unlock();
    AudioFX.play("click");
    const k = b.dataset.open;
    if (k === "chat") openChat(); else MENUS[k]();
  });
  $("#chip-profile").onclick = () => { AudioFX.play("click"); MENUS.profile(); };
  $("#btn-undo").onclick = undo;
  $("#btn-chat-game").onclick = () => openChat();
  $("#btn-exit").onclick = async () => {
    if (!G) return;
    if (G.mode !== "story") return endFreeMode();
    if (G.ended) return gotoMap();
    const i = await ask("🏳️ Menyerah?", "Langkahmu hangus. Joko pasti ngetawain di grup.", [{ label: "Lanjut main", cls: "primary" }, { label: "Menyerah", cls: "danger" }]);
    if (i === 1) { chatPush("joko", "kabur ya bro? 🤣🤣"); gotoMap(); }
  };
  $("#btn-sound").onclick = () => {
    S.settings.music = !S.settings.music;
    AudioFX.set("music", S.settings.music);
    $("#btn-sound").textContent = S.settings.music ? "🎵 Musik" : "🔇 Musik";
    persist();
  };
  $("#chat-close").onclick = () => $("#chat-panel").classList.remove("open");
  $("#chat-quick").innerHTML = Object.keys(CHAT_REPLIES).map(k => `<button class="btn small" data-say="${k}">${k}</button>`).join("");
  $$("#chat-quick [data-say]").forEach(b => b.onclick = () => sendChat(b.dataset.say));

  // Senter saat mati lampu
  const wrap = $("#board-wrap");
  wrap.addEventListener("pointermove", e => {
    const r = wrap.getBoundingClientRect();
    wrap.style.setProperty("--mx", e.clientX - r.left + "px");
    wrap.style.setProperty("--my", e.clientY - r.top + "px");
  });

  // Kode rahasia lewat keyboard
  let buf = "";
  document.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT") return;
    if (e.key === "Escape" && board.itemMode) { board.itemMode = null; $("#board-wrap").classList.remove("targeting"); renderItems(); }
    if (e.key.length === 1) {
      buf = (buf + e.key.toUpperCase()).slice(-10);
      for (const code of ["SKS", "SULTAN", "HUJANMIE"]) if (buf.endsWith(code)) { applyCheat(code); buf = ""; }
    }
  });

  $("#btn-start").onclick = async () => {
    AudioFX.unlock();
    AudioFX.play("click");
    S.name = $("#inp-name").value.trim() || S.name || "Budi";
    persist();
    if (!S.seenPrologue) {
      AudioFX.music("map");
      await playDialog(DIALOG.prologue);
      S.seenPrologue = true;
      chatPush("joko", "selamat datang di grup Kost Mawar 🌹 @{NAME}");
      chatPush("ibukost", "Peraturan grup: 1) Bayar kost tepat waktu. 2) Lihat peraturan 1.");
      persist();
    }
    ensureDaily();
    await gotoMap();
    await dailyLogin();
  };
}

document.addEventListener("DOMContentLoaded", () => {
  loadSave();
  applySkin();
  for (const k of ["music", "sfx", "voice"]) AudioFX.set(k, S.settings[k]);
  board = new Board($("#board"), $("#board-fx"), boardCallbacks);
  board.locked = true;
  bindUI();
  if (S.name) {
    $("#inp-name").value = S.name;
    $("#btn-start").textContent = "▶ LANJUTKAN";
  }
  $("#btn-sound").textContent = S.settings.music ? "🎵 Musik" : "🔇 Musik";
  document.addEventListener("pointerdown", () => AudioFX.unlock(), { once: true });
});
