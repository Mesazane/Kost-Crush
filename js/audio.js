// =====================================================================
//  Audio: BGM chiptune + SFX disintesis WebAudio (tanpa file eksternal)
//  + "teriakan" callout memakai Speech Synthesis browser.
// =====================================================================

const AudioFX = (() => {
  let ctx = null, master, musicG, sfxG, noiseBuf;
  let timer = null, track = null, trackName = null, wanted = null, step = 0, nextTime = 0;
  const st = { music: true, sfx: true, voice: true };

  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function unlock() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) { return; }
      master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
      musicG = ctx.createGain(); musicG.gain.value = 0.2; musicG.connect(master);
      sfxG = ctx.createGain(); sfxG.gain.value = 0.55; sfxG.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    if (wanted && trackName !== wanted) music(wanted);
  }

  function tone(f, d, o = {}) {
    if (!ctx) return;
    const { type = "square", vol = 0.3, slide = null, t = 0, at = null, dest = sfxG, attack = 0.005 } = o;
    const t0 = at ?? ctx.currentTime + t;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    osc.connect(g); g.connect(dest);
    osc.start(t0); osc.stop(t0 + d + 0.05);
  }

  function noise(d, o = {}) {
    if (!ctx) return;
    const { vol = 0.3, freq = 1200, sweep = null, t = 0, at = null, dest = sfxG, type = "lowpass" } = o;
    const t0 = at ?? ctx.currentTime + t;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t0 + d);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t0); s.stop(t0 + d + 0.05);
  }

  const SFX = {
    click:   () => tone(880, 0.06, { vol: 0.1 }),
    swap:    () => tone(520, 0.1, { type: "triangle", vol: 0.25, slide: 800 }),
    bad:     () => { tone(220, 0.15, { type: "sawtooth", vol: 0.15, slide: 140 }); tone(200, 0.2, { type: "sawtooth", vol: 0.12, slide: 110, t: 0.12 }); },
    pop:     (c = 1) => { const f = 440 * Math.pow(1.122, Math.min(c, 12)); tone(f, 0.13, { type: "triangle", vol: 0.3 }); tone(f * 1.5, 0.1, { type: "sine", vol: 0.15, t: 0.04 }); },
    special: () => { noise(0.35, { vol: 0.22, freq: 400, sweep: 6000, type: "bandpass" }); tone(300, 0.3, { type: "sawtooth", vol: 0.1, slide: 1200 }); },
    boom:    () => { noise(0.6, { vol: 0.5, freq: 1500, sweep: 80 }); tone(140, 0.5, { type: "sine", vol: 0.5, slide: 35 }); },
    hit:     () => { tone(160, 0.12, { vol: 0.22, slide: 80 }); noise(0.08, { vol: 0.2, freq: 3000 }); },
    crack:   () => { noise(0.12, { vol: 0.3, freq: 4000, type: "highpass" }); tone(900, 0.05, { vol: 0.08 }); },
    coin:    () => { tone(988, 0.08, { vol: 0.13 }); tone(1319, 0.25, { vol: 0.13, t: 0.08 }); },
    win:     () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, { vol: 0.16, t: i * 0.12 })); tone(1047, 0.7, { type: "triangle", vol: 0.22, t: 0.5 }); },
    lose:    () => { [392, 370, 349].forEach((f, i) => tone(f, 0.3, { type: "sawtooth", vol: 0.14, t: i * 0.32 })); tone(330, 0.9, { type: "sawtooth", vol: 0.14, t: 0.96, slide: 260 }); },
    boss:    () => { tone(110, 0.45, { type: "sawtooth", vol: 0.22, slide: 70 }); tone(116, 0.45, { type: "sawtooth", vol: 0.18, slide: 73 }); noise(0.3, { vol: 0.15, freq: 600 }); },
    event:   () => [784, 988, 1175].forEach((f, i) => tone(f, 0.22, { type: "sine", vol: 0.22, t: i * 0.08 })),
    chat:    () => { tone(1200, 0.05, { type: "sine", vol: 0.15 }); tone(1600, 0.08, { type: "sine", vol: 0.15, t: 0.07 }); },
    shuffle: () => { for (let i = 0; i < 7; i++) tone(300 + Math.random() * 500, 0.06, { vol: 0.07, t: i * 0.04 }); },
    star:    (n = 1) => { tone(660 * Math.pow(1.26, n), 0.35, { type: "triangle", vol: 0.25 }); tone(1320 * Math.pow(1.26, n), 0.2, { type: "sine", vol: 0.1, t: 0.05 }); },
    born:    () => tone(700, 0.2, { type: "sine", vol: 0.2, slide: 1400 }),
    meow:    () => { tone(650, 0.18, { type: "sawtooth", vol: 0.07, slide: 900 }); tone(900, 0.3, { type: "sawtooth", vol: 0.07, slide: 500, t: 0.17 }); },
    type:    () => tone(1400 + Math.random() * 300, 0.02, { vol: 0.03 }),
    unlock:  () => [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.3, { type: "triangle", vol: 0.18, t: i * 0.07 })),
  };

  function play(name, arg) {
    if (!ctx || !st.sfx || !SFX[name]) return;
    try { SFX[name](arg); } catch (_) {}
  }

  // ---------- BGM ----------
  // 4 bar x 16 langkah. bass: 1=root, 2=oktaf. stab: akor. drum: k kick, s snare, h hihat, t "tak" kendang
  const R = null;
  const TRACKS = {
    map: {
      bpm: 100, leadType: "square",
      chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]],
      bass: [1, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0, 2, 0],
      stab: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      drum: ["k", R, "h", R, "t", R, "h", "k", "k", R, "h", R, "t", R, "h", R],
      lead: [
        [72, R, 76, R, 79, R, 76, R, 74, R, 72, R, 74, 76, R, R],
        [69, R, 72, R, 76, R, 74, 72, R, R, 69, R, 72, R, R, R],
        [65, R, 69, R, 72, R, 74, R, 72, R, 69, R, 67, R, 65, R],
        [67, R, 71, R, 74, R, 77, 76, 74, R, 71, R, 67, R, R, R],
      ],
    },
    game: {
      bpm: 126, leadType: "square",
      chords: [[65, 69, 72], [62, 65, 69], [58, 62, 65], [60, 64, 67]],
      bass: [1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 1],
      stab: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
      drum: ["k", R, "h", R, "s", R, "h", R, "k", "k", "h", R, "s", R, "h", "h"],
      lead: [
        [77, R, 77, 79, 81, R, 79, R, 77, R, 74, R, 72, R, 74, R],
        [74, R, 77, R, 81, R, 79, 77, 74, R, R, R, 69, R, 72, R],
        [70, R, 74, R, 77, R, 79, R, 77, R, 74, R, 70, R, 72, R],
        [72, 74, 76, R, 79, R, 76, R, 84, R, 79, R, 76, R, R, R],
      ],
    },
    boss: {
      bpm: 148, leadType: "sawtooth",
      chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
      bass: [1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 2],
      stab: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
      drum: ["k", "h", "s", "h", "k", "k", "s", "h", "k", "h", "s", "h", "k", "s", "s", "s"],
      lead: [
        [69, R, 72, R, 76, R, 75, 76, R, R, 72, R, 69, R, 68, R],
        [65, R, 69, R, 72, R, 74, 72, R, R, 69, R, 65, R, R, R],
        [67, R, 71, R, 74, R, 77, 76, 74, R, 71, R, 74, R, 76, R],
        [76, R, 75, R, 76, R, 80, R, 83, R, 80, R, 76, R, 71, R],
      ],
    },
    ending: {
      bpm: 84, leadType: "triangle",
      chords: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
      bass: [1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
      stab: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      drum: ["k", R, R, R, "t", R, R, R, "k", R, "k", R, "t", R, R, R],
      lead: [
        [76, R, R, 79, R, R, 84, R, R, R, 83, R, 79, R, R, R],
        [74, R, R, 71, R, R, 74, R, 79, R, R, R, R, R, R, R],
        [72, R, R, 76, R, R, 81, R, R, R, 79, R, 76, R, R, R],
        [77, R, 76, R, 74, R, 72, R, 74, R, R, R, R, R, R, R],
      ],
    },
  };

  function playStep(s, t) {
    const spb = 60 / track.bpm / 4;
    const bar = Math.floor(s / 16), i = s % 16, ch = track.chords[bar];
    if (track.bass[i]) tone(midi(ch[0] - 24 + (track.bass[i] === 2 ? 12 : 0)), spb * 1.7, { type: "triangle", vol: 0.55, at: t, dest: musicG });
    if (track.stab[i]) ch.forEach(n => tone(midi(n), spb * 0.9, { type: "square", vol: 0.045, at: t, dest: musicG }));
    const n = track.lead[bar][i];
    if (n) tone(midi(n), spb * 1.7, { type: track.leadType, vol: track.leadType === "sawtooth" ? 0.07 : 0.1, at: t, dest: musicG });
    const d = track.drum[i];
    if (d === "k") tone(150, 0.18, { type: "sine", vol: 0.7, slide: 40, at: t, dest: musicG });
    else if (d === "s") noise(0.14, { vol: 0.35, freq: 2500, type: "bandpass", at: t, dest: musicG });
    else if (d === "h") noise(0.04, { vol: 0.18, freq: 7000, type: "highpass", at: t, dest: musicG });
    else if (d === "t") tone(420, 0.08, { type: "sine", vol: 0.4, slide: 300, at: t, dest: musicG });
  }

  function sched() {
    if (!track) return;
    const spb = 60 / track.bpm / 4;
    while (nextTime < ctx.currentTime + 0.12) {
      playStep(step, nextTime);
      nextTime += spb;
      step = (step + 1) % 64;
    }
  }

  function music(name) {
    wanted = name;
    if (!ctx || !st.music) return;
    if (trackName === name && timer) return;
    stopMusic(true);
    track = TRACKS[name];
    trackName = name;
    step = 0;
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(sched, 25);
  }

  function stopMusic(keepWanted) {
    clearInterval(timer);
    timer = null;
    track = null;
    trackName = null;
    if (!keepWanted) wanted = null;
  }

  // ---------- Suara callout ----------
  function say(text, lang = "en-US", pitch = 0.7, rate = 1) {
    if (!st.voice || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.pitch = pitch; u.rate = rate; u.volume = 0.9;
      speechSynthesis.speak(u);
    } catch (_) {}
  }

  function set(key, val) {
    st[key] = val;
    if (key === "music") {
      if (val) { const w = wanted; trackName = null; if (w) music(w); }
      else stopMusic(true);
    }
  }

  return { unlock, play, music, stopMusic, say, set, st };
})();
