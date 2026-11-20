'use strict';

/* ============================================================
   《墨水与触手 · 深海牌局》成品级前端交互与氛围引擎 (ui-polish.js)
   ============================================================ */
(() => {
  const SAVE_KEY = 'ink_tentacles_save_v1';
  const STATS_KEY = 'ink_tentacles_stats_v1';
  const PREFS_KEY = 'ink_tentacles_prefs_v1';

  const ARCH_ICONS = {
    devour: '🦈', shell: '🐚', venom: '☠️', current: '🌊', swarm: '🦐', mimic: '🐙',
    ink: '🖋️', lumen: '✨', cryo: '❄️', symbio: '🪸', tide: '🌙', volt: '⚡',
    echo: '📡', breakwater: '🔨', dive: '🤿', migrate: '🧭', molt: '🦀', stress: '❤️‍🔥',
    hide: '👁️', flank: '⚔️', vent: '🌋', net: '🕸️', filter: '🐋', pursuit: '🎯',
    pressure: '🌊', parasite: '🪱', counter: '🛡️', frenzy: '🩸', mutate: '🧬', bastion: '🏰',
    vortex: '🌀', salvage: '⚓', magnet: '🧲', bounty: '🪙', corrode: '🧪', omen: '🔮'
  };

  const STATUS_TIPS = {
    '🛡': '护甲：抵挡受到的伤害，回合开始时通常清零。',
    '🌵': '荆棘：每次被敌人攻击时反伤等同层数。',
    '☠': '剧毒：回合结束时受到等同层数伤害并减 1 层。',
    '⚡': '麻痹：敌人攻击伤害 -25%，回合结束减 1 层。',
    '💢': '易伤：受到的伤害 +25%/层，回合结束减 1 层。',
    '❄': '冻结：敌人每次攻击额外减少 2×层数 伤害，回合结束减 1 层。',
    '🐛': '虫群：回合结束对敌人造成等同层数伤害后减 1 层。',
    '✨': '发光：本轮首次直接卡牌伤害每层额外 +1。',
    '🌱': '成长：下回合起每回合开始自动获得等同层数的护甲。',
    '🌊 涨潮': '涨潮：本轮首次直接卡牌伤害 +2；下回合自动切换为退潮。',
    '🌊 退潮': '退潮：本轮首张护甲牌额外 +2 护甲；下回合自动切换为涨潮。',
    '🌊 水深': '水深：水压流派深度标尺（0–5），≥4 层时回合末受压迫伤害。',
    '🪱 寄宿': '寄宿：持久附着印记（上限 5），用于吸血、窃甲或孵化引爆。',
    '⚖ 失衡': '失衡：敌人下次攻击 -35%，下次受到直接攻击 +35%。',
    '🩸 流血': '流血：敌人每次受直接卡牌伤害额外承受等量伤害，回合末减半。',
    '🧪 腐蚀': '腐蚀：持久减益（上限 8），每层使敌人攻击 -1、叠甲 -1。',
    '🔥 连段': '连段：本回合已打出的卡牌数，用于触发狂潮连段加成。',
    '🧲': '磁极：上一张出牌的费用奇偶，交替奇偶或费用递增触发磁感共振。',
    '🪸': '礁体：驻场生态结构，每回合开始自动触发被动效果。',
    '回声': '回声：回合末自动造成等同层数的伤害并清空，也可提前消耗。'
  };

  /* ================= 1. 偏好设置与战绩存档 ================= */
  const Prefs = (() => {
    let data = { reducedFx: false, hotkeys: true };
    try { Object.assign(data, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) {}
    const save = () => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(data)); } catch (e) {} };
    const apply = () => { document.body.classList.toggle('reduced-fx', Boolean(data.reducedFx)); };
    apply();
    return {
      get: k => data[k],
      toggle(k) { data[k] = !data[k]; save(); apply(); if (Game.s?.inBattle) UI.battle(); },
      apply
    };
  })();

  const Stats = (() => {
    let data = { runs: 0, wins: 0, kills: 0, bestAct: 1 };
    try { Object.assign(data, JSON.parse(localStorage.getItem(STATS_KEY) || '{}')); } catch (e) {}
    const save = () => { try { localStorage.setItem(STATS_KEY, JSON.stringify(data)); } catch (e) {} };
    return {
      data: () => ({ ...data }),
      recordRun() { data.runs++; save(); },
      recordKill(act) { data.kills++; data.bestAct = Math.max(data.bestAct, act || 1); save(); },
      recordWin() { data.wins++; data.bestAct = 3; save(); }
    };
  })();

  const RunSave = {
    write() {
      const s = Game.s;
      if (!s || s.inBattle || s.hp <= 0) return;
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          charKey: s.ch.key, hp: s.hp, maxHp: s.maxHp, gold: s.gold,
          act: s.act, idx: s.idx, nodes: s.nodes, deck: s.deck, relics: s.relics
        }));
      } catch (e) {}
    },
    read() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw);
        return d && CHARS[d.charKey] && Array.isArray(d.deck) ? d : null;
      } catch (e) { return null; }
    },
    clear() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} },
    resume() {
      const d = this.read();
      if (!d) return;
      Game.newRun(d.charKey);
      Object.assign(Game.s, {
        hp: d.hp, maxHp: d.maxHp, gold: d.gold, act: d.act,
        idx: d.idx, nodes: d.nodes, deck: d.deck, relics: d.relics
      });
      document.body.dataset.act = String(d.act || 1);
      UI.map(); UI.show('scr-map'); UI.top();
    }
  };

  /* ================= 2. 动态深海 Canvas 氛围层 ================= */
  function initOceanCanvas() {
    if (typeof document === 'undefined' || !document.body || !document.createElement) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'ocean-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;

    const vignette = document.createElement('div');
    vignette.id = 'damage-vignette';
    document.body.appendChild(vignette);

    const banner = document.createElement('div');
    banner.id = 'turn-banner';
    document.body.appendChild(banner);

    const particles = [];
    const COUNT = 44;
    function resize() {
      canvas.width = window.innerWidth || 1280;
      canvas.height = window.innerHeight || 800;
    }
    resize();
    window.addEventListener && window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1 + Math.random() * 2.4,
        vy: -(0.14 + Math.random() * 0.36),
        vx: (Math.random() - 0.5) * 0.18,
        a: 0.18 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2
      });
    }

    let t = 0;
    function frame() {
      if (!Prefs.get('reducedFx')) {
        t += 0.012;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const act = Number(document.body.dataset.act || 1);
        const hue = act === 3 ? '210,165,255' : act === 2 ? '120,195,255' : '110,240,210';

        // 柔和顶部水下光束
        const grad = ctx.createRadialGradient(
          canvas.width * (0.5 + Math.sin(t * 0.35) * 0.06), -60, 20,
          canvas.width * 0.5, 0, canvas.height * 0.72
        );
        grad.addColorStop(0, `rgba(${hue},0.10)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const p of particles) {
          p.y += p.vy;
          p.x += p.vx + Math.sin(t + p.phase) * 0.12;
          if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
          const pulse = p.a * (0.65 + 0.35 * Math.sin(t * 2 + p.phase));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${hue},${pulse.toFixed(3)})`;
          ctx.fill();
        }
      }
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(frame);
    }
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(frame);
  }

  /* ================= 3. 飘字、横幅与音效扩展 ================= */
  Object.assign(Audio, {
    block() { this.beep(320, 560, 0.09, 'triangle', 0.07); },
    debuff() { this.beep(260, 140, 0.14, 'sawtooth', 0.06); },
    turn() { this.beep(380, 520, 0.11, 'sine', 0.05); }
  });

  function spawnFloat(targetId, text, cls = 'dmg') {
    if (typeof document === 'undefined' || !document.body) return;
    const anchor = document.getElementById(targetId);
    if (!anchor || !anchor.getBoundingClientRect) return;
    const r = anchor.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'float-num ' + cls;
    el.textContent = text;
    const jitterX = (Math.random() - 0.5) * 34;
    const jitterY = (Math.random() - 0.5) * 14;
    el.style.left = (r.left + r.width / 2 + jitterX) + 'px';
    el.style.top = (r.top + r.height * 0.32 + jitterY) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove && el.remove(), 980);
  }

  function flashPortrait(id, cls) {
    const el = document.getElementById(id);
    if (!el || !el.classList) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 360);
  }

  function flashDamageVignette() {
    const v = document.getElementById('damage-vignette');
    if (!v) return;
    v.classList.add('flash');
    setTimeout(() => v.classList.remove('flash'), 240);
  }

  let bannerTimer = null;
  function showBanner(text) {
    const el = document.getElementById('turn-banner');
    if (!el || Prefs.get('reducedFx')) return;
    el.textContent = text;
    el.classList.add('show');
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => el.classList.remove('show'), 950);
  }

  /* ================= 4. 战斗日志历史抽屉 ================= */
  const LogHistory = {
    items: [],
    open: false,
    clear() { this.items = []; this.render(); },
    push(text) {
      const turn = Game.s?.turnNo || 0;
      this.items.push({ turn, text });
      if (this.items.length > 80) this.items.shift();
      this.render();
    },
    toggle() {
      this.open = !this.open;
      const d = document.getElementById('log-drawer');
      if (d) d.classList.toggle('open', this.open);
      this.render();
    },
    render() {
      const body = document.getElementById('log-drawer-body');
      if (!body) return;
      body.innerHTML = this.items.slice(-40).reverse().map(x =>
        `<div class="ld-item"><span class="ld-t">T${x.turn}</span>${x.text}</div>`
      ).join('') || '<div class="ld-item">暂无战斗记录</div>';
    }
  };

  function mountExtraChrome() {
    if (typeof document === 'undefined' || !document.body) return;
    // 战报抽屉
    const drawer = document.createElement('div');
    drawer.id = 'log-drawer';
    drawer.innerHTML = `
      <div class="ld-head">
        <span>📜 战斗日志</span>
        <button class="btn ghost sm" id="btn-close-log">收起</button>
      </div>
      <div class="ld-body" id="log-drawer-body"></div>`;
    document.body.appendChild(drawer);
    const closeBtn = document.getElementById('btn-close-log');
    if (closeBtn) closeBtn.onclick = () => LogHistory.toggle();

    // 顶栏加入「📜 战报」「⚙️ 设置」按钮
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      const logBtn = document.createElement('button');
      logBtn.className = 'btn ghost sm';
      logBtn.id = 'btn-log';
      logBtn.textContent = '📜 战报';
      logBtn.onclick = () => LogHistory.toggle();

      const setBtn = document.createElement('button');
      setBtn.className = 'btn ghost sm';
      setBtn.id = 'btn-settings';
      setBtn.textContent = '⚙️';
      setBtn.title = '游戏设置与快捷键';
      setBtn.onclick = () => UI.openSettings();

      topbar.appendChild(logBtn);
      topbar.appendChild(setBtn);
    }

    // 把底栏抽/弃牌堆改为可点击按钮组，并加快捷键提示条
    const piles = document.querySelector('.piles');
    if (piles) {
      piles.className = 'pile-btns';
      piles.innerHTML = `
        <button class="pile-btn" id="btn-pile-draw">📚 抽牌堆 <b id="ui-draw">0</b></button>
        <button class="pile-btn" id="btn-pile-discard">♻️ 弃牌堆 <b id="ui-discard">0</b></button>
        <button class="pile-btn" id="btn-pile-sealed" style="display:none">🔒 封存 <b id="ui-sealed">0</b></button>`;
      document.getElementById('btn-pile-draw').onclick = () => UI.openPile('draw');
      document.getElementById('btn-pile-discard').onclick = () => UI.openPile('discard');
      document.getElementById('btn-pile-sealed').onclick = () => UI.openPile('sealed');
    }

    const battleScr = document.getElementById('scr-battle');
    if (battleScr) {
      const kbd = document.createElement('div');
      kbd.className = 'kbd-hint';
      kbd.innerHTML = '快捷键：<kbd>1-9</kbd> 出牌 · <kbd>E</kbd>/<kbd>Space</kbd> 结束回合 · <kbd>S</kbd> 技能 · <kbd>D</kbd> 牌库 · <kbd>Esc</kbd> 关闭弹窗';
      battleScr.appendChild(kbd);
    }
  }

  /* ================= 5. 包装战斗反馈、意图预测与存档 ================= */
  const _uiLog = UI.log.bind(UI);
  UI.log = function (t) {
    _uiLog(t);
    LogHistory.push(t);
  };

  const _hit = Game.hit.bind(Game);
  Game.hit = function (n, pierce) {
    const beforeHp = this.s.e.hp, beforeBlk = this.s.e.block;
    _hit(n, pierce);
    const hpLost = beforeHp - this.s.e.hp;
    const blkLost = beforeBlk - this.s.e.block;
    if (hpLost > 0) {
      spawnFloat('e-art', `-${hpLost}`, hpLost >= 15 ? 'crit' : 'dmg');
      flashPortrait('e-art', 'flash-white');
    } else if (blkLost > 0) {
      spawnFloat('e-art', `🛡-${blkLost}`, 'blk');
    }
  };

  const _block = Game.block.bind(Game);
  Game.block = function (n) {
    const before = this.s.p.block;
    _block(n);
    const gain = this.s.p.block - before;
    if (gain > 0) {
      Audio.block();
      spawnFloat('p-art', `+${gain} 🛡`, 'blk');
      flashPortrait('p-art', 'shield-glow');
    }
  };

  const _heal = Game.heal.bind(Game);
  Game.heal = function (n) {
    const before = this.s.hp;
    _heal(n);
    const gain = this.s.hp - before;
    if (gain > 0) spawnFloat('p-art', `+${gain} ❤️`, 'heal');
  };

  const _hurtPlayer = Game.hurtPlayer.bind(Game);
  Game.hurtPlayer = function (base) {
    const beforeHp = this.s.hp, beforeBlk = this.s.p.block;
    _hurtPlayer(base);
    const hpLost = beforeHp - this.s.hp;
    const blkLost = beforeBlk - this.s.p.block;
    if (hpLost > 0) {
      spawnFloat('p-art', `-${hpLost}`, 'dmg');
      flashPortrait('p-art', 'flash-white');
      flashDamageVignette();
    } else if (blkLost > 0) {
      spawnFloat('p-art', `格挡 -${blkLost}`, 'blk');
    }
  };

  const _newRun = Game.newRun.bind(Game);
  Game.newRun = function (charKey) {
    Stats.recordRun();
    _newRun(charKey);
    document.body.dataset.act = '1';
    RunSave.write();
  };

  const _startFight = Game.startFight.bind(Game);
  Game.startFight = function (foeKey) {
    LogHistory.clear();
    _startFight(foeKey);
    showBanner(`遭遇：${Game.s.e.def.n}`);
  };

  const _startTurn = Game.startTurn.bind(Game);
  Game.startTurn = async function () {
    await _startTurn();
    if (Game.s?.inBattle) {
      Audio.turn();
      if (Game.s.turnNo > 1) showBanner(`第 ${Game.s.turnNo} 回合 · 你的行动`);
    }
  };

  const _advance = Game.advance.bind(Game);
  Game.advance = function (wasBoss) {
    _advance(wasBoss);
    document.body.dataset.act = String(Game.s?.act || 1);
    RunSave.write();
  };

  const _reward = Game.reward.bind(Game);
  Game.reward = function (isBoss) {
    Stats.recordKill(Game.s?.act || 1);
    _reward(isBoss);
  };

  const _gameOver = Game.gameOver.bind(Game);
  Game.gameOver = function (win) {
    if (win) Stats.recordWin();
    RunSave.clear();
    _gameOver(win);
  };

  /* ================= 6. 卡牌精美无图卡背 + 实时意图预测 + 扇形手牌 ================= */
  function predictEnemyDamage(base) {
    const s = Game.s;
    if (!s) return base;
    if (s.negateNextEnemyAtk) return 0;
    let adjBase = Math.max(0, base - (s.e.corrode || 0));
    let mult = 1;
    if (s.e.shock > 0) mult -= 0.25;
    if (s.fog) mult -= s.fog / 100;
    if (s.paralyze) mult *= 0.5;
    if (s.frozenHalf) mult *= 0.7;
    if (s.e.imbalance) mult *= 0.65;
    let d = Math.round(adjBase * Math.max(0.15, mult));
    if (s.e.freeze > 0) d = Math.max(0, d - 2 * s.e.freeze);
    return d;
  }

  const _cardEl = UI.cardEl.bind(UI);
  UI.cardEl = function (id, opts) {
    const el = _cardEl(id, opts);
    const c = CARDS[id];
    const fb = el.querySelector('.fb');
    if (fb && c) {
      const arch = ARCH[c.a] || { n: '深海', c: '#5eead4' };
      const ico = ARCH_ICONS[c.a] || '🐚';
      fb.classList.add('styled-fb');
      fb.style.setProperty('--arch-color', arch.c);
      fb.style.setProperty('--arch-glow', arch.c + '44');
      fb.style.setProperty('--arch-bg', arch.c + '22');
      fb.innerHTML = `
        <div class="fb-ico">${ico}</div>
        <div class="fb-arch">${arch.n}</div>
        <div class="fb-sp">${c.species || c.n}</div>`;
    }
    return el;
  };

  const _title = UI.title.bind(UI);
  UI.title = function () {
    document.body.dataset.act = '1';
    _title();
    const hero = document.querySelector('#scr-title');
    if (!hero) return;

    // 战绩条
    let strip = document.getElementById('stats-strip');
    if (!strip) {
      strip = document.createElement('div');
      strip.id = 'stats-strip';
      strip.className = 'stats-strip';
      const cta = hero.querySelector('.cta');
      if (cta) hero.insertBefore(strip, cta);
    }
    const st = Stats.data();
    strip.innerHTML = `
      <span>🏆 通关 <b>${st.wins}</b></span>
      <span>⚔️ 击败对手 <b>${st.kills}</b></span>
      <span>🌊 最高抵达 <b>第 ${st.bestAct} 幕</b></span>
      <span>🧭 出航 <b>${st.runs}</b> 次</span>`;

    // 继续上次航程按钮
    const cta = hero.querySelector('.cta');
    const oldResume = document.getElementById('btn-resume-run');
    if (oldResume) oldResume.remove();
    const saved = RunSave.read();
    if (saved && cta) {
      const btn = document.createElement('button');
      btn.id = 'btn-resume-run';
      btn.className = 'btn gold';
      btn.textContent = `▶ 继续航程（${CHARS[saved.charKey].n} · 第 ${saved.act} 幕）`;
      btn.onclick = () => RunSave.resume();
      cta.prepend(btn);
    }
  };

  const _map = UI.map.bind(UI);
  UI.map = function () {
    _map();
    const s = Game.s;
    if (!s) return;
    document.body.dataset.act = String(s.act || 1);
    const mapbox = document.getElementById('scr-map');
    let meter = document.getElementById('depth-meter');
    if (!meter && mapbox) {
      meter = document.createElement('div');
      meter.id = 'depth-meter';
      meter.className = 'depth-meter';
      const track = document.getElementById('map-track');
      if (track) mapbox.insertBefore(meter, track);
    }
    if (meter) {
      const acts = [
        [1, '🌊 第 1 幕 · 浅海珊瑚礁 (200m)'],
        [2, '⚓ 第 2 幕 · 幽暗沉船区 (1200m)'],
        [3, '🕳️ 第 3 幕 · 无光海沟 (8000m)']
      ];
      meter.innerHTML = acts.map(([num, label]) =>
        `<div class="depth-step ${s.act === num ? 'active' : s.act > num ? 'passed' : ''}">${label}</div>`
      ).join('');
    }
    const nodes = document.querySelectorAll('#map-track .node');
    s.nodes.forEach((n, i) => {
      if (nodes[i]) nodes[i].dataset.kind = n.k;
    });
  };

  const _battle = UI.battle.bind(UI);
  UI.battle = function () {
    _battle();
    const s = Game.s, e = s.e;
    if (!s || !e) return;

    // 能量晶球低能量状态
    const enEl = document.getElementById('ui-energy');
    if (enEl) enEl.classList.toggle('low', s.energy <= 0);

    // 封存堆计数按钮
    const sealBtn = document.getElementById('btn-pile-sealed');
    const sealNum = document.getElementById('ui-sealed');
    if (sealBtn && sealNum) {
      const sz = s.sealed ? s.sealed.size : 0;
      sealBtn.style.display = sz > 0 ? 'inline-flex' : 'none';
      sealNum.textContent = sz;
    }

    // 升级敌人意图：显示精确类型图标 + 实时削弱后预估伤害
    const intentEl = document.getElementById('e-intent');
    const it = e.def.it[e.i % e.def.it.length];
    if (intentEl && it) {
      intentEl.className = 'intent intent-' + it.k;
      const fmtDmg = v => {
        const eff = predictEnemyDamage(v);
        return eff !== v
          ? `<span class="dmg-old">${v}</span><span class="dmg-cut">${eff}</span>`
          : `<b>${v}</b>`;
      };
      if (s.skipEnemy) {
        intentEl.innerHTML = '❄️ 已冻结：本回合无法行动';
      } else if (it.k === 'atk') {
        intentEl.innerHTML = `⚔️ ${it.t} · 预计伤害 ${fmtDmg(it.v)}`;
      } else if (it.k === 'blk') {
        const blk = Math.max(0, it.v - (e.corrode || 0));
        intentEl.innerHTML = `🛡️ ${it.t} · 护甲 +<b>${blk}</b>`;
      } else if (it.k === 'mix') {
        const blk = Math.max(0, it.b - (e.corrode || 0));
        intentEl.innerHTML = `⚔️🛡️ ${it.t} · ${fmtDmg(it.a)} 伤 / +${blk} 甲`;
      } else if (it.k === 'psn') {
        intentEl.innerHTML = `☠️ ${it.t} · 施加剧毒 +<b>${it.v}</b>`;
      } else if (it.k === 'heal') {
        intentEl.innerHTML = `💚 ${it.t} · 回复生命 +<b>${it.v}</b>`;
      }
    }

    // 状态标签附带悬停说明
    document.querySelectorAll('#p-status .st, #e-status .st').forEach(badge => {
      const txt = badge.textContent || '';
      for (const [k, tip] of Object.entries(STATUS_TIPS)) {
        if (txt.includes(k)) { badge.title = tip; break; }
      }
    });

    // 扇形手牌排布 + 快捷键数字角标
    const hand = document.getElementById('hand');
    const cards = hand ? Array.from(hand.querySelectorAll('.card')) : [];
    const n = cards.length;
    if (hand) hand.classList.toggle('fan-layout', n >= 4);
    cards.forEach((el, idx) => {
      const mid = (n - 1) / 2;
      const offset = idx - mid;
      const maxRot = Math.min(10, n * 1.4);
      const rot = n > 1 ? (offset / Math.max(1, mid)) * maxRot : 0;
      const y = Math.abs(offset) * Math.abs(offset) * (n >= 7 ? 2.4 : 3.2);
      el.style.setProperty('--fan-rot', rot.toFixed(2) + 'deg');
      el.style.setProperty('--fan-y', y.toFixed(1) + 'px');
      if (Prefs.get('hotkeys') && idx < 10) {
        const hk = document.createElement('span');
        hk.className = 'hotkey';
        hk.textContent = idx === 9 ? '0' : String(idx + 1);
        el.appendChild(hk);
      }
    });
  };

  /* ================= 7. 抽/弃/封存堆查看弹窗 & 设置弹窗 ================= */
  UI.openPile = function (kind) {
    if (Game.uiChoice || !Game.s) return;
    const s = Game.s;
    let ids = [];
    let title = '';
    let lead = '';
    if (kind === 'draw') {
      ids = [...s.drawPile].reverse();
      title = `📚 抽牌堆（${ids.length} 张）`;
      lead = s.omenKnownTop && ids[0] === s.omenKnownTop
        ? `🔮 已知牌顶：${CARDS[ids[0]].n}（其余按牌库概览展示）`
        : '以下为抽牌堆中剩余卡牌（按费用排序展示，避免剧透牌序）';
      if (!(s.omenKnownTop && ids[0] === s.omenKnownTop)) {
        ids.sort((a, b) => CARDS[a].c - CARDS[b].c);
      }
    } else if (kind === 'discard') {
      ids = [...s.discard].reverse();
      title = `♻️ 弃牌堆（${ids.length} 张）`;
      lead = '抽牌堆耗尽时将重新洗回抽牌堆';
    } else {
      ids = Array.from(s.sealed || []);
      title = `🔒 本场封存（${ids.length} 张）`;
      lead = '本场战斗移出循环的卡牌，战后自动恢复';
    }
    this.sheet(`
      <h2>${title}</h2>
      <p class="lead">${lead}</p>
      <div class="picks" id="pile-view"></div>
      <button class="btn ghost" onclick="UI.closeSheet()">关闭</button>`);
    const box = document.getElementById('pile-view');
    if (!ids.length) {
      box.innerHTML = '<p class="lead">当前为空</p>';
    } else {
      ids.forEach(id => box.appendChild(this.cardEl(id, { fixed: true })));
    }
  };

  UI.openSettings = function () {
    if (Game.uiChoice) return;
    this.sheet(`
      <h2>⚙️ 游戏设置</h2>
      <p class="lead">所有偏好与航程进度自动保存于本地浏览器</p>
      <div class="row" style="margin:14px 0">
        <button class="btn ${Prefs.get('reducedFx') ? 'ghost' : ''}" id="opt-fx">
          ✨ 动态深海粒子与横幅：${Prefs.get('reducedFx') ? '关' : '开'}
        </button>
        <button class="btn ${Prefs.get('hotkeys') ? '' : 'ghost'}" id="opt-hk">
          ⌨️ 手牌快捷键角标：${Prefs.get('hotkeys') ? '开' : '关'}
        </button>
        <button class="btn ${Audio.muted ? 'ghost' : ''}" id="opt-audio">
          🔊 游戏音效：${Audio.muted ? '静音' : '开启'}
        </button>
      </div>
      <div class="help">
        <b>快捷键说明：</b><br>
        • <b>1 – 9 / 0</b>：打出对应位置手牌<br>
        • <b>E</b> 或 <b>Space</b>：结束当前回合<br>
        • <b>S</b>：释放角色主动技能<br>
        • <b>D</b>：查看当前牌库<br>
        • <b>Esc</b>：关闭弹窗或收起战报
      </div>
      <div class="row">
        <button class="btn ghost" id="opt-clear-save">🗑️ 清除本地存档</button>
        <button class="btn" onclick="UI.closeSheet()">完成</button>
      </div>`);
    document.getElementById('opt-fx').onclick = () => { Prefs.toggle('reducedFx'); UI.openSettings(); };
    document.getElementById('opt-hk').onclick = () => { Prefs.toggle('hotkeys'); UI.openSettings(); };
    document.getElementById('opt-audio').onclick = () => { Audio.toggle(); UI.openSettings(); };
    document.getElementById('opt-clear-save').onclick = () => { RunSave.clear(); UI.openSettings(); };
  };

  /* ================= 8. 360 张卡专业图鉴（搜索 + 费用 + 流派 + 稀有度） ================= */
  const collectibleIds = () => Object.keys(CARDS).filter(id => !id.startsWith('~') && !CARDS[id].nonCollectible);
  UI.openCodex = function () {
    if (Game.uiChoice) return;
    this._cxArch = 'all'; this._cxRar = 'all'; this._cxCost = 'all'; this._cxQ = '';
    const n = collectibleIds().length;
    this.sheet(`
      <h2>📖 卡牌图鉴 <span style="font-size:12.5px;color:#8fbfae;font-weight:600" id="cx-count">共 ${n} 张</span></h2>
      <p class="lead">支持按物种名、拉丁学名、关键词实时检索 · 悬停查看关键词说明</p>
      <div class="codex-search-row">
        <input class="codex-input" id="cx-search" placeholder="搜索物种名 / 学名 / 关键词（如：水深、寄宿、流血）…">
      </div>
      <div class="filters" id="cx-cost"></div>
      <div class="filters" id="cx-rar"></div>
      <div class="filters" id="cx-arch"></div>
      <div class="picks" id="cx-list"></div>
      <button class="btn ghost" onclick="UI.closeSheet()">关闭</button>`);
    const inp = document.getElementById('cx-search');
    if (inp) inp.oninput = e => { this._cxQ = (e.target.value || '').trim().toLowerCase(); this._renderCodex(); };
    this._renderCodex();
  };

  UI._renderCodex = function () {
    const aBox = document.getElementById('cx-arch');
    const rBox = document.getElementById('cx-rar');
    const cBox = document.getElementById('cx-cost');
    const archs = [['all', '全部流派']].concat(Object.keys(ARCH).map(k => [k, ARCH[k].n]));
    const rars = [['all', '全部稀有度'], ['c', '普通'], ['u', '精良'], ['r', '稀有'], ['l', '传说']];
    const costs = [['all', '全部费用'], ['0', '0 费'], ['1', '1 费'], ['2', '2 费'], ['3', '3 费']];

    cBox.innerHTML = costs.map(([k, n]) => `<div class="chip ${this._cxCost === k ? 'on' : ''}" data-c="${k}">${n}</div>`).join('');
    rBox.innerHTML = rars.map(([k, n]) => `<div class="chip ${this._cxRar === k ? 'on' : ''}" data-r="${k}">${n}</div>`).join('');
    aBox.innerHTML = archs.map(([k, n]) => `<div class="chip ${this._cxArch === k ? 'on' : ''}" data-a="${k}">${n}</div>`).join('');

    cBox.querySelectorAll('.chip').forEach(el => el.onclick = () => { this._cxCost = el.dataset.c; this._renderCodex(); });
    rBox.querySelectorAll('.chip').forEach(el => el.onclick = () => { this._cxRar = el.dataset.r; this._renderCodex(); });
    aBox.querySelectorAll('.chip').forEach(el => el.onclick = () => { this._cxArch = el.dataset.a; this._renderCodex(); });

    const q = this._cxQ || '';
    const filtered = collectibleIds().filter(id => {
      const c = CARDS[id];
      if (this._cxArch !== 'all' && c.a !== this._cxArch) return false;
      if (this._cxRar !== 'all' && c.r !== this._cxRar) return false;
      if (this._cxCost !== 'all' && String(c.c) !== this._cxCost) return false;
      if (q) {
        const hay = `${c.n} ${c.species || ''} ${c.d} ${ARCH[c.a]?.n || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const cnt = document.getElementById('cx-count');
    if (cnt) cnt.textContent = `显示 ${filtered.length} / ${collectibleIds().length} 张`;
    const list = document.getElementById('cx-list');
    list.innerHTML = '';
    if (!filtered.length) {
      list.innerHTML = '<p class="lead">没有符合筛选条件的卡牌</p>';
    } else {
      filtered.forEach(id => list.appendChild(this.cardEl(id, { fixed: true })));
    }
  };

  /* ================= 9. 键盘快捷键 ================= */
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const maskOn = document.getElementById('mask')?.classList.contains('on');
      if (e.key === 'Escape') {
        if (maskOn && !Game.uiChoice) UI.closeSheet();
        else if (LogHistory.open) LogHistory.toggle();
        return;
      }
      if (maskOn || Game.uiChoice || !Game.s?.inBattle) return;
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        if (idx < Game.s.hand.length) Game.playCard(idx);
      } else if (e.key === '0') {
        if (Game.s.hand.length >= 10) Game.playCard(9);
      } else if (e.key === 'e' || e.key === 'E' || e.code === 'Space') {
        e.preventDefault();
        Game.endTurn();
      } else if (e.key === 's' || e.key === 'S') {
        Game.useSkill();
      } else if (e.key === 'd' || e.key === 'D') {
        UI.openDeck();
      }
    });
  }

  /* ================= 10. 初始化启动 ================= */
  initOceanCanvas();
  mountExtraChrome();
  UI.title();
})();
