'use strict';

/* ============================================================
   声音系统彻底修复 + 局内永久升级卡牌 (+) + 战后结算 + 玩法指南
   (audio-and-upgrades.js)
   ============================================================ */
(() => {
  /* ================= 1. 声音系统彻底修复（清晰可听、首次交互自动解锁） ================= */
  const VOL_KEY = 'ink_tentacles_vol_v1';
  let masterVol = 0.75;
  try {
    const savedVol = parseFloat(localStorage.getItem(VOL_KEY));
    if (!Number.isNaN(savedVol)) masterVol = Math.max(0, Math.min(1, savedVol));
  } catch (e) {}

  let masterGain = null;

  function ensureAudioReady() {
    const AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    if (!Audio.ctx) {
      try {
        Audio.ctx = new AC();
        masterGain = Audio.ctx.createGain();
        masterGain.gain.value = Audio.muted ? 0 : masterVol;
        masterGain.connect(Audio.ctx.destination);
      } catch (e) {
        return null;
      }
    }
    if (!masterGain && Audio.ctx) {
      masterGain = Audio.ctx.createGain();
      masterGain.gain.value = Audio.muted ? 0 : masterVol;
      masterGain.connect(Audio.ctx.destination);
    }
    return Audio.ctx;
  }

  function withAudio(fn) {
    if (Audio.muted || masterVol <= 0.001) return;
    const ctx = ensureAudioReady();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        try { fn(ctx); } catch (e) {}
      }).catch(() => {});
    } else {
      try { fn(ctx); } catch (e) {}
    }
  }

  // 在浏览器首次点击或按键时立即解锁 AudioContext
  if (typeof window !== 'undefined' && window.addEventListener) {
    const unlock = () => {
      const ctx = ensureAudioReady();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  function playTone(ctx, f1, f2, dur, type = 'triangle', vol = 0.28, delay = 0) {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, f1), t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(g);
    g.connect(masterGain || ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  function playNoise(ctx, dur = 0.08, vol = 0.16, freq = 1400, delay = 0) {
    const sr = ctx.sampleRate || 44100;
    const len = Math.max(1, Math.floor(sr * dur));
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = freq;
    const g = ctx.createGain();
    const t = ctx.currentTime + delay;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(masterGain || ctx.destination);
    src.start(t);
  }

  Object.assign(Audio, {
    setVolume(v) {
      masterVol = Math.max(0, Math.min(1, v));
      try { localStorage.setItem(VOL_KEY, String(masterVol)); } catch (e) {}
      if (masterGain && Audio.ctx) masterGain.gain.value = Audio.muted ? 0 : masterVol;
    },
    getVolume() { return masterVol; },
    beep(f1, f2, d, type, v) {
      withAudio(ctx => playTone(ctx, f1, f2, d || 0.12, type || 'triangle', Math.max(0.22, (v || 0.1) * 2.4)));
    },
    card() {
      withAudio(ctx => {
        playNoise(ctx, 0.065, 0.22, 1800, 0);
        playTone(ctx, 460, 760, 0.09, 'triangle', 0.22, 0.01);
      });
    },
    hit() {
      withAudio(ctx => {
        playTone(ctx, 180, 52, 0.16, 'sawtooth', 0.34, 0);
        playNoise(ctx, 0.09, 0.24, 650, 0);
      });
    },
    block() {
      withAudio(ctx => {
        playTone(ctx, 520, 880, 0.11, 'triangle', 0.24, 0);
        playTone(ctx, 780, 1040, 0.09, 'sine', 0.16, 0.04);
      });
    },
    coin() {
      withAudio(ctx => {
        playTone(ctx, 1180, 1560, 0.09, 'sine', 0.24, 0);
        playTone(ctx, 1560, 2090, 0.13, 'sine', 0.22, 0.06);
      });
    },
    eat() {
      withAudio(ctx => {
        playTone(ctx, 160, 420, 0.11, 'sawtooth', 0.26, 0);
        playTone(ctx, 320, 95, 0.16, 'sawtooth', 0.28, 0.08);
      });
    },
    heal() {
      withAudio(ctx => {
        playTone(ctx, 523, 659, 0.14, 'sine', 0.24, 0);
        playTone(ctx, 659, 880, 0.18, 'sine', 0.24, 0.08);
      });
    },
    skill() {
      withAudio(ctx => {
        playTone(ctx, 587, 880, 0.12, 'triangle', 0.24, 0);
        playTone(ctx, 880, 1318, 0.16, 'sine', 0.24, 0.07);
      });
    },
    turn() {
      withAudio(ctx => playTone(ctx, 360, 540, 0.12, 'sine', 0.18, 0));
    },
    win() {
      withAudio(ctx => {
        [523, 659, 784, 1046].forEach((f, i) => playTone(ctx, f, f * 1.02, 0.18, 'triangle', 0.26, i * 0.08));
      });
    },
    lose() {
      withAudio(ctx => {
        [330, 293, 247, 196].forEach((f, i) => playTone(ctx, f, f * 0.96, 0.24, 'sine', 0.25, i * 0.12));
      });
    },
    toggle() {
      this.muted = !this.muted;
      ensureAudioReady();
      if (masterGain) masterGain.gain.value = this.muted ? 0 : masterVol;
      const btn = document.getElementById('btn-mute');
      if (btn) btn.textContent = this.muted ? '🔇' : '🔊';
      if (!this.muted) this.card();
    }
  });

  /* ================= 2. 局内永久升级卡牌系统（+ 强化） ================= */
  // 记录在 Game.s.upgradedIndices（数组/Set，兼容存档）：升级牌在战斗内自动享受伤害+3、护甲+3、且高费(>=2)有提示
  function ensureUpgradeState(s) {
    if (!s) return;
    if (!Array.isArray(s.upgradedDeck)) s.upgradedDeck = [];
    if (!s.runStats) s.runStats = { cardsPlayed: 0, totalDamage: 0, fightsWon: 0, upgraded: 0 };
  }

  const _newRun = Game.newRun.bind(Game);
  Game.newRun = function (charKey, options) {
    _newRun(charKey, options);
    ensureUpgradeState(this.s);
  };

  const _startFight = Game.startFight.bind(Game);
  Game.startFight = function (foeKey) {
    ensureUpgradeState(this.s);
    _startFight(foeKey);
    // 将牌库中已升级的下标对应到本场战斗的 token
    const s = this.s;
    const upSet = new Set(s.upgradedDeck || []);
    const allTokens = [...s.drawPile, ...s.hand, ...s.discard];
    // 按 deck 顺序标记（initPoolFight 生成的 token 编号从 ~1 开始与 deck 一一对应）
    allTokens.forEach(tok => {
      const num = parseInt(String(tok).replace('~', ''), 10);
      if (!Number.isNaN(num) && upSet.has(num - 1)) {
        if (s.evoBonus) s.evoBonus.set(tok, (s.evoBonus.get(tok) || 0) + 3);
        if (CARDS[tok]) CARDS[tok].upgraded = true;
      }
    });
  };

  // 统计本局打牌数与伤害
  const _hit = Game.hit.bind(Game);
  Game.hit = function (n, pierce) {
    const before = this.s.e.hp;
    _hit(n, pierce);
    const dealt = Math.max(0, before - this.s.e.hp);
    ensureUpgradeState(this.s);
    this.s.runStats.totalDamage += dealt;
  };

  const _playCard = Game.playCard.bind(Game);
  Game.playCard = async function (handIdx) {
    const before = this.s?.playedCount || 0;
    await _playCard(handIdx);
    if (this.s && (this.s.playedCount || 0) > before) {
      ensureUpgradeState(this.s);
      this.s.runStats.cardsPlayed++;
    }
  };

  const _reward = Game.reward.bind(Game);
  Game.reward = function (isBoss) {
    ensureUpgradeState(this.s);
    this.s.runStats.fightsWon++;
    Audio.coin();
    _reward(isBoss);
  };

  // 卡牌渲染：已永久升级的牌显示金色 `+` 标记
  const _cardEl = UI.cardEl.bind(UI);
  UI.cardEl = function (id, opts) {
    const el = _cardEl(id, opts);
    const c = CARDS[id];
    if (c && c.upgraded) {
      const nm = el.querySelector('.nm');
      if (nm && !nm.textContent.includes('★')) nm.textContent += ' ★+';
      el.style.borderColor = '#fef08a';
    }
    return el;
  };

  // 珊瑚休息站增加「🔨 锻造升级 1 张牌（攻防永久 +3）」
  function openUpgradeCardSheet(onDone) {
    const s = Game.s;
    ensureUpgradeState(s);
    const upSet = new Set(s.upgradedDeck);
    UI.sheet(`
      <h2>🔨 珊瑚锻造：选择 1 张牌永久强化</h2>
      <p class="lead">强化后的卡牌（★+）在本局每场战斗中基础伤害与护甲永久 +3</p>
      <div class="picks" id="up-picks"></div>
      <button class="btn ghost" onclick="UI.closeSheet();Game.finishNode()">返回航路</button>`);
    const box = document.getElementById('up-picks');
    let avail = 0;
    s.deck.forEach((id, idx) => {
      if (upSet.has(idx)) return;
      avail++;
      const el = UI.cardEl(id, { fixed: true });
      el.onclick = () => {
        s.upgradedDeck.push(idx);
        s.runStats.upgraded++;
        Audio.skill();
        UI.closeSheet();
        UI.top();
        onDone();
      };
      box.appendChild(el);
    });
    if (!avail) box.innerHTML = '<p class="lead">牌库中所有卡牌均已强化！</p>';
  }

  const _rest = Game.rest.bind(Game);
  Game.rest = function () {
    _rest();
    const row = document.querySelector('#sheet .row');
    if (row && !document.getElementById('rest-upgrade')) {
      const btn = document.createElement('button');
      btn.id = 'rest-upgrade';
      btn.className = 'btn gold';
      btn.textContent = '🔨 强化 1 张牌（+3 攻防）';
      btn.onclick = () => openUpgradeCardSheet(() => Game.finishNode());
      row.prepend(btn);
    }
  };

  /* ================= 3. 战后完整结算面板（通关 / 战败） ================= */
  Game.gameOver = function (win) {
    const s = this.s;
    ensureUpgradeState(s);
    if (win) Audio.win(); else Audio.lose();
    try { localStorage.removeItem('ink_tentacles_save_v1'); } catch (e) {}

    const aff = Game.affinity();
    const topArchs = Object.keys(aff).sort((a, b) => aff[b] - aff[a]).slice(0, 3)
      .map(k => `${ARCH[k]?.n || k}(${aff[k]})`).join(' · ') || '均衡流';
    const rs = s.runStats;
    const relicStr = s.relics.map(r => `${RELICS[r]?.i || ''} ${RELICS[r]?.n || r}`).join('、') || '无';

    UI.sheet(`
      <h2 style="color:${win ? '#fef08a' : '#ff8b7b'}">${win ? '🏆 通关！深海霸主' : '💀 墨水耗尽 · 航程止步'}</h2>
      <p class="lead">${win ? `${s.ch.n} 征服了无光海沟，击败大王酸浆鱿！` : `止步于第 ${s.act} 幕 · 再接再厉`}</p>
      <div class="help">
        <b>本局航程报告：</b><br>
        • <b>击败对手</b>：${rs.fightsWon} 场 · <b>总出牌数</b>：${rs.cardsPlayed} 张 · <b>累计伤害</b>：${rs.totalDamage}<br>
        • <b>核心流派</b>：${topArchs} · <b>最终牌库</b>：${s.deck.length} 张（含 ${rs.upgraded} 张强化牌）<br>
        • <b>携带遗物（${s.relics.length}）</b>：${relicStr}
      </div>
      <button class="btn" onclick="UI.closeSheet();UI.title()">${win ? '换个角色再来一局' : '重新挑战'}</button>`);
  };

  /* ================= 4. 设置面板新增音量滑块 + 测试音效 + 新手速查 ================= */
  const _openSettings = UI.openSettings.bind(UI);
  UI.openSettings = function () {
    _openSettings();
    const sheet = document.getElementById('sheet');
    if (!sheet) return;
    const lead = sheet.querySelector('.lead');
    if (lead && !document.getElementById('vol-box')) {
      const box = document.createElement('div');
      box.id = 'vol-box';
      box.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:10px;margin:10px 0;flex-wrap:wrap';
      box.innerHTML = `
        <span style="font-size:13px;font-weight:800">🔊 音量：<b id="vol-pct">${Math.round(masterVol * 100)}%</b></span>
        <input id="vol-slider" type="range" min="0" max="100" value="${Math.round(masterVol * 100)}" style="width:160px;accent-color:#5eead4">
        <button class="btn sm ghost" id="btn-test-sfx">▶ 测试音效</button>`;
      lead.after(box);
      const sl = document.getElementById('vol-slider');
      const pct = document.getElementById('vol-pct');
      if (sl) sl.oninput = e => {
        const v = Number(e.target.value) / 100;
        Audio.setVolume(v);
        if (pct) pct.textContent = Math.round(v * 100) + '%';
      };
      const testBtn = document.getElementById('btn-test-sfx');
      if (testBtn) testBtn.onclick = () => {
        if (Audio.muted) Audio.toggle();
        Audio.win();
      };
    }
  };

  UI.openGuide = function () {
    if (Game.uiChoice) return;
    this.sheet(`
      <h2>📘 深海牌局 · 快速指南</h2>
      <p class="lead">36 大流派 · 360 种真实海洋生物 · 逐层深潜 Roguelike</p>
      <div class="help">
        <b>1. 战斗操作：</b>点击手牌、<b>向上拖拽出牌</b>，或按键盘 <b>1–9/0</b> 均可出牌；按 <b>E / Space</b> 结束回合。<br>
        <b>2. 激活圆环：</b>手牌顶部圆环亮起代表本牌附加条件已满足（如水深达标、破招命中、连段就绪）。<br>
        <b>3. 逐层深潜航路：</b>每幕 7 层从上往下推进。精英战（💀）必掉遗物，问号（❓）触发 10 种随机奇遇，休息站（🪸）可回血、加血上限、删牌或<b>永久强化卡牌（★+）</b>。<br>
        <b>4. 流派构筑：</b>选牌会自动向你牌库里最多的主/副流派倾斜，放心大胆组合跨流派连招（如占星+洄游、狂潮+拾遗、酸蚀+破甲）。
      </div>
      <button class="btn" onclick="UI.closeSheet()">明白了，开始下潜</button>`);
  };

  // 顶栏加入「📘 指南」按钮
  const topbar = document.querySelector('.topbar');
  if (topbar && !document.getElementById('btn-guide')) {
    const gBtn = document.createElement('button');
    gBtn.id = 'btn-guide';
    gBtn.className = 'btn ghost sm';
    gBtn.textContent = '📘 指南';
    gBtn.onclick = () => UI.openGuide();
    topbar.appendChild(gBtn);
  }

  /* ================= 5. 自动优先加载 img/art/<card_id>.jpg 博物手绘卡图 ================= */
  const _cardElForArt = UI.cardEl.bind(UI);
  UI.cardEl = function (id, opts) {
    const el = _cardElForArt(id, opts);
    const c = CARDS[id];
    if (!c || c.nonCollectible) return el;
    const artBox = el.querySelector('.art');
    const fb = el.querySelector('.fb');
    if (!artBox) return el;
    const customSrc = `img/art/${c.id}.jpg`;
    const legacySrc = c.img ? `img/${c.img}.jpg` : null;
    let img = artBox.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = c.n || '';
      artBox.prepend(img);
    }
    img.hidden = false;
    if (fb) fb.style.display = 'none';
    img.onerror = function () {
      if (legacySrc && !this.dataset.triedLegacy) {
        this.dataset.triedLegacy = '1';
        this.src = legacySrc;
      } else {
        this.hidden = true;
        if (fb) fb.style.display = 'flex';
      }
    };
    img.src = customSrc;
    return el;
  };
})();
