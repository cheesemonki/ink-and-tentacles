'use strict';

/* ============================================================
   方案 C 实体手账「上拉折页」摘要引擎 + 24 个统一墨水铜版画图标系统
   (card-drawer-and-icons.js)
   优先加载 img/icons/<key>.png，未生成前自动回退为同风格深褐墨水单色 SVG
   ============================================================ */
(() => {
  /* ================= 1. 24 个精简统一核心图标（墨水铜版画风 SVG 回退 + PNG 自动升级） ================= */
  const SVG_PATHS = {
    hp:       '<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" fill="#e56b5b" stroke="#231d17" stroke-width="2"/>',
    gold:     '<circle cx="12" cy="12" r="8" fill="#f5cc4d" stroke="#231d17" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="#231d17" stroke-width="1.5"/>',
    energy:   '<path d="M13 3L6 13h5l-1 8 8-11h-5l0-7Z" fill="#f5cc4d" stroke="#231d17" stroke-width="2" stroke-linejoin="round"/>',
    deck:     '<rect x="5" y="4" width="11" height="15" fill="#fbf5e6" stroke="#231d17" stroke-width="2"/><path d="M9 7h10v14H9" fill="none" stroke="#231d17" stroke-width="2"/>',
    codex:    '<path d="M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4V5Zm16 0h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7V5Z" fill="#fbf5e6" stroke="#231d17" stroke-width="2"/>',
    log:      '<rect x="5" y="4" width="14" height="16" fill="#fbf5e6" stroke="#231d17" stroke-width="2"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#231d17" stroke-width="1.8"/>',
    guide:    '<circle cx="12" cy="12" r="9" fill="#fbf5e6" stroke="#231d17" stroke-width="2"/><path d="M12 10v6M12 7h.01" stroke="#231d17" stroke-width="2.2" stroke-linecap="round"/>',
    settings: '<circle cx="12" cy="12" r="3.5" fill="none" stroke="#231d17" stroke-width="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="#231d17" stroke-width="2"/>',
    sound:    '<path d="M4 9h4l5-4v14l-5-4H4V9Z" fill="#fbf5e6" stroke="#231d17" stroke-width="2"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="#231d17" stroke-width="1.8"/>',
    mute:     '<path d="M4 9h4l5-4v14l-5-4H4V9Z" fill="#e7d8ba" stroke="#231d17" stroke-width="2"/><path d="M16 9l5 6M21 9l-5 6" stroke="#231d17" stroke-width="2"/>',
    atk:      '<path d="M4 20L19 5M14 5h5v5M7 13l4 4" fill="none" stroke="#231d17" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    blk:      '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" fill="#6cb4d6" stroke="#231d17" stroke-width="2"/>',
    psn:      '<path d="M9 3h6M10 3v4l-4 7a4 4 0 0 0 3.5 6h5A4 4 0 0 0 18 14l-4-7V3" fill="#86efac" stroke="#231d17" stroke-width="2"/>',
    draw:     '<path d="M5 19l4-1 10-10-3-3L6 15l-1 4Z" fill="#fbf5e6" stroke="#231d17" stroke-width="2"/>',
    buff:     '<polygon points="12,3 14.8,9 21,9.5 16.2,13.8 17.6,20 12,16.8 6.4,20 7.8,13.8 3,9.5 9.2,9" fill="#5ec4a8" stroke="#231d17" stroke-width="1.8"/>',
    debuff:   '<polygon points="12,3 21,19 3,19" fill="#e56b5b" stroke="#231d17" stroke-width="2"/><path d="M12 9v5M12 16.5h.01" stroke="#231d17" stroke-width="2"/>',
    tide:     '<path d="M15 4a8 8 0 1 0 5 14A7 7 0 0 1 15 4Z" fill="#f5cc4d" stroke="#231d17" stroke-width="2"/>',
    skill:    '<circle cx="12" cy="12" r="8" fill="#5ec4a8" stroke="#231d17" stroke-width="2"/><path d="M8 12h8M12 8v8" stroke="#231d17" stroke-width="2"/>',
    node_fight: '<path d="M5 19L19 5M5 5l14 14" stroke="#231d17" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="#e56b5b" stroke="#231d17" stroke-width="1.8"/>',
    node_elite: '<circle cx="12" cy="10" r="6" fill="#fbf5e6" stroke="#231d17" stroke-width="2"/><circle cx="9.8" cy="9.5" r="1.3" fill="#231d17"/><circle cx="14.2" cy="9.5" r="1.3" fill="#231d17"/><path d="M9 16v3M12 16v3M15 16v3" stroke="#231d17" stroke-width="2"/>',
    node_boss:  '<path d="M3 18h18l-2-10-4 4-3-6-3 6-4-4-2 10Z" fill="#e56b5b" stroke="#231d17" stroke-width="2" stroke-linejoin="round"/>',
    node_event: '<circle cx="12" cy="12" r="9" fill="#c4a3e8" stroke="#231d17" stroke-width="2"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.8.8c0 1.6-2.3 2-2.3 3.7M12 17h.01" fill="none" stroke="#231d17" stroke-width="2.2" stroke-linecap="round"/>',
    node_shop:  '<path d="M4 9h16v10H4V9ZM3 9l2-4h14l2 4" fill="#e8a76b" stroke="#231d17" stroke-width="2"/><path d="M9 19v-5h6v5" fill="#fbf5e6" stroke="#231d17" stroke-width="1.8"/>',
    node_rest:  '<path d="M12 4c3 3.5 5 6.2 5 9.2a5 5 0 0 1-10 0C7 10.2 9 7.5 12 4Z" fill="#5ec4a8" stroke="#231d17" stroke-width="2"/><path d="M5 20h14" stroke="#231d17" stroke-width="2"/>',
    node_chest: '<rect x="4" y="7" width="16" height="12" fill="#f5cc4d" stroke="#231d17" stroke-width="2"/><path d="M4 12h16M10 12v3h4v-3" fill="#fbf5e6" stroke="#231d17" stroke-width="2"/>',
    pile_draw:    '<rect x="5" y="4" width="14" height="16" fill="#fbf5e6" stroke="#231d17" stroke-width="2"/><path d="M12 8v8M9 13l3 3 3-3" fill="none" stroke="#231d17" stroke-width="2"/>',
    pile_discard: '<rect x="5" y="4" width="14" height="16" fill="#e7d8ba" stroke="#231d17" stroke-width="2"/><path d="M9 10h6M9 14h4" stroke="#231d17" stroke-width="2"/>',
    pile_sealed:  '<circle cx="12" cy="12" r="7" fill="#e56b5b" stroke="#231d17" stroke-width="2"/><path d="M9 12h6" stroke="#fbf5e6" stroke-width="2"/>'
  };

  function iconHtml(key, size = '') {
    const svg = `<svg viewBox="0 0 24 24" aria-hidden="true">${SVG_PATHS[key] || SVG_PATHS.buff}</svg>`;
    const cls = size ? `ink-ico ${size}` : 'ink-ico';
    return `<span class="${cls}" data-ico="${key}"><img src="img/icons/${key}.png" alt="" onerror="this.remove();this.nextElementSibling.style.display='block'"><span style="display:none;width:100%;height:100%">${svg}</span></span>`;
  }
  UI.icon = iconHtml;

  /* ================= 2. 全部 360 张卡自动精简「1 行核心摘要」规则 ================= */
  const SPECIAL_KW = [
    '吞噬', '饵料', '潜航', '回声', '置顶', '封存', '临险', '留牌', '伏藏', '喷口',
    '回收', '满势', '收割', '下潜', '上浮', '水深', '寄宿', '孵化', '破招', '失衡',
    '连段', '流血', '演化', '护壁礁', '刺珊瑚礁', '生机礁', '崩礁', '搅流', '残骸',
    '磁极', '悬赏', '腐蚀', '预言', '涨潮', '退潮', '发光', '虫群', '成长', '冻结',
    '麻痹', '易伤', '荆棘', '剧毒'
  ];

  function buildMiniSummary(card) {
    const d = card.d || '';
    const parts = [];
    const multiHit = d.match(/连续造成\s*(\d+)\s*次\s*(\d+)\s*伤害/);
    const dmg = d.match(/造成\s*(\d+)\s*点?(?:穿透)?伤害/);
    const blk = d.match(/获得\s*(\d+)\s*护甲/);
    const heal = d.match(/恢复\s*(\d+)\s*点?生命/);
    const draw = d.match(/抽\s*(\d+)\s*张/);
    const en = d.match(/获得\s*(\d+)\s*点?洋流/);

    if (multiHit) parts.push(`攻 ${multiHit[2]}×${multiHit[1]}`);
    else if (dmg) parts.push(`攻 ${dmg[1]}`);
    if (blk) parts.push(`甲 ${blk[1]}`);
    if (heal) parts.push(`回 ${heal[1]}`);
    if (draw) parts.push(`抽 ${draw[1]}`);
    if (en) parts.push(`费 +${en[1]}`);

    for (const kw of SPECIAL_KW) {
      if (d.includes(kw) && parts.length < 3) {
        parts.push(kw);
      }
    }
    if (!parts.length) return d.slice(0, 14) + (d.length > 14 ? '…' : '');
    return parts.slice(0, 3).join(' · ');
  }

  /* ================= 3. 升级 UI.cardEl 为方案 C（上拉折页 + 外沿角标） ================= */
  const RAR_LABEL = { c: '', u: '精良', r: '稀有', l: '传说' };
  const _prevCardEl = UI.cardEl.bind(UI);
  UI.cardEl = function (id, opts) {
    const el = _prevCardEl(id, opts);
    const c = CARDS[id];
    if (!c) return el;

    // 把 .art 和 .panel 收入 .card-clip，让外沿费用块和外部快捷键可以优雅溢出
    const art = el.querySelector('.art');
    const panel = el.querySelector('.panel');
    if (art && panel && !el.querySelector('.card-clip')) {
      const clip = document.createElement('div');
      clip.className = 'card-clip';
      el.prepend(clip);
      clip.appendChild(art);
      clip.appendChild(panel);
    }

    // 注入右上外沿稀有度小标
    if (!el.querySelector('.rar-tag')) {
      const rt = document.createElement('span');
      rt.className = 'rar-tag';
      rt.textContent = RAR_LABEL[c.r] || '';
      el.appendChild(rt);
    }

    // 注入流派小标与 1 行精简摘要
    if (panel) {
      const nm = panel.querySelector('.nm');
      const archName = ARCH[c.a]?.n || '';
      if (nm && archName && !nm.querySelector('.arch-mini')) {
        nm.innerHTML = `<span>${nm.textContent}</span><span class="arch-mini">${archName}</span>`;
      }
      if (!panel.querySelector('.mini-summary')) {
        const mini = document.createElement('div');
        mini.className = 'mini-summary';
        mini.textContent = buildMiniSummary(c);
        const txt = panel.querySelector('.txt');
        if (txt) panel.insertBefore(mini, txt);
        else panel.appendChild(mini);
      }
    }
    return el;
  };

  /* ================= 4. 全面替换顶栏、地图、战斗意图与牌堆为统一墨水图标 ================= */
  function replaceTopbarChrome() {
    const deckBtn = document.querySelector('button[onclick="UI.openDeck()"]');
    if (deckBtn) deckBtn.innerHTML = `${iconHtml('deck')} 牌库 <span id="ui-deckn">${Game.s?.deck?.length || 10}</span>`;
    const codexBtn = document.querySelector('button[onclick="UI.openCodex()"]');
    if (codexBtn) codexBtn.innerHTML = `${iconHtml('codex')} 图鉴`;
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) muteBtn.innerHTML = iconHtml(Audio.muted ? 'mute' : 'sound');
    const logBtn = document.getElementById('btn-log');
    if (logBtn) logBtn.innerHTML = `${iconHtml('log')} 战报`;
    const setBtn = document.getElementById('btn-settings');
    if (setBtn) setBtn.innerHTML = iconHtml('settings');
    const gBtn = document.getElementById('btn-guide');
    if (gBtn) gBtn.innerHTML = `${iconHtml('guide')} 指南`;

    const drawBtn = document.getElementById('btn-pile-draw');
    if (drawBtn) drawBtn.innerHTML = `${iconHtml('pile_draw')} 抽牌 <b id="ui-draw">${Game.s?.drawPile?.length || 0}</b>`;
    const disBtn = document.getElementById('btn-pile-discard');
    if (disBtn) disBtn.innerHTML = `${iconHtml('pile_discard')} 弃牌 <b id="ui-discard">${Game.s?.discard?.length || 0}</b>`;
    const sealBtn = document.getElementById('btn-pile-sealed');
    if (sealBtn) sealBtn.innerHTML = `${iconHtml('pile_sealed')} 封存 <b id="ui-sealed">${Game.s?.sealed?.size || 0}</b>`;
  }

  const _prevTop = UI.top.bind(UI);
  UI.top = function () {
    _prevTop();
    const s = Game.s;
    if (!s) return;
    document.getElementById('ui-char').innerHTML = `${iconHtml('skill')} <b>${s.ch.n}</b>`;
    document.getElementById('ui-hp').innerHTML = `${iconHtml('hp')} <b>${s.hp}/${s.maxHp}</b>`;
    document.getElementById('ui-gold').innerHTML = `${iconHtml('gold')} <b>${s.gold}</b>`;
    document.getElementById('ui-act').innerHTML = `${iconHtml('tide')} <b>${ACT_NAME[s.act]}</b>`;
  };

  const _prevToggle = Audio.toggle.bind(Audio);
  Audio.toggle = function () {
    _prevToggle();
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) muteBtn.innerHTML = iconHtml(this.muted ? 'mute' : 'sound');
  };

  const _prevMap = UI.map.bind(UI);
  UI.map = function () {
    _prevMap();
    const s = Game.s;
    if (!s || !s.mapRows) return;
    const kindKey = {
      fight: 'node_fight', elite: 'node_elite', boss: 'node_boss',
      event: 'node_event', shop: 'node_shop', rest: 'node_rest', chest: 'node_chest'
    };
    const legend = document.querySelector('.dive-map-legend');
    if (legend) {
      legend.innerHTML = `
        <span>${iconHtml('node_fight')} 普通怪</span>
        <span>${iconHtml('node_elite')} 精英（掉遗物）</span>
        <span>${iconHtml('node_event')} 随机奇遇</span>
        <span>${iconHtml('node_shop')} 商店</span>
        <span>${iconHtml('node_rest')} 休息站</span>
        <span>${iconHtml('node_chest')} 宝箱</span>
        <span>${iconHtml('node_boss')} 深渊 Boss</span>`;
    }
    document.querySelectorAll('#dive-rows .dnode').forEach(el => {
      const k = el.dataset.kind;
      const icoEl = el.querySelector('.ico');
      if (icoEl && kindKey[k]) icoEl.innerHTML = iconHtml(kindKey[k], k === 'boss' ? 'xl' : 'lg');
    });
  };

  const _prevBattle = UI.battle.bind(UI);
  UI.battle = function () {
    _prevBattle();
    const s = Game.s;
    if (!s) return;
    const enEl = document.getElementById('ui-energy');
    if (enEl) enEl.innerHTML = `${iconHtml('energy')} 洋流 <b>${s.energy} / ${s.maxEnergy}</b>`;
    const skIco = document.querySelector('#skill-btn > span');
    if (skIco) skIco.innerHTML = iconHtml('skill', 'lg');
  };

  replaceTopbarChrome();
})();
