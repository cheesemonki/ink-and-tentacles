'use strict';

/* ============================================================
   拖拽出牌引擎 + 《杀戮尖塔》式自上而下深潜分支地图与奇遇事件
   (map-and-drag.js)
   ============================================================ */
(() => {
  /* ================= 1. 拖拽出牌系统（支持鼠标与触控） ================= */
  let dragState = null;

  function ensureDragDom() {
    if (typeof document === 'undefined' || !document.body) return;
    if (!document.getElementById('drag-arrow-svg')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'drag-arrow-svg';
      svg.innerHTML = `
        <defs>
          <marker id="drag-arrowhead" markerWidth="10" markerHeight="10" refX="7" refY="3.5" orient="auto">
            <polygon points="0 0, 9 3.5, 0 7" fill="#5eead4"></polygon>
          </marker>
          <marker id="drag-arrowhead-ready" markerWidth="10" markerHeight="10" refX="7" refY="3.5" orient="auto">
            <polygon points="0 0, 9 3.5, 0 7" fill="#fef08a"></polygon>
          </marker>
        </defs>
        <path id="drag-arrow-path" fill="none" stroke="#5eead4" stroke-width="4" stroke-dasharray="9 6" stroke-linecap="round" marker-end="url(#drag-arrowhead)" style="display:none"></path>`;
      document.body.appendChild(svg);
    }
    const arena = document.querySelector('.arena');
    if (arena && !document.getElementById('drop-hint')) {
      const hint = document.createElement('div');
      hint.id = 'drop-hint';
      arena.appendChild(hint);
    }
  }

  function clearDragVisuals() {
    if (!dragState) return;
    if (dragState.ghost && dragState.ghost.remove) dragState.ghost.remove();
    if (dragState.originEl && dragState.originEl.classList) dragState.originEl.classList.remove('dragging-origin');
    const path = document.getElementById('drag-arrow-path');
    if (path) path.style.display = 'none';
    const arena = document.querySelector('.arena');
    if (arena) arena.classList.remove('drop-zone-active', 'drop-zone-ready');
    const hint = document.getElementById('drop-hint');
    if (hint) hint.classList.remove('show');
    const eArt = document.getElementById('e-art');
    const pArt = document.getElementById('p-art');
    if (eArt) eArt.classList.remove('target-lock');
    if (pArt) pArt.classList.remove('ally-lock');
    dragState = null;
  }

  function isOffensiveCard(card) {
    return /伤害|剧毒|麻痹|易伤|冻结|寄宿|流血|腐蚀|破招|失衡/.test(card?.d || '');
  }

  function updateDrag(clientX, clientY) {
    if (!dragState) return;
    const dx = clientX - dragState.startX;
    const dy = clientY - dragState.startY;
    if (!dragState.active) {
      if (Math.hypot(dx, dy) < 9) return;
      dragState.active = true;
      UI.hideKW();
      const ghost = dragState.originEl.cloneNode(true);
      ghost.classList.remove('dragging-origin');
      ghost.classList.add('drag-ghost');
      ghost.style.width = dragState.rect.width + 'px';
      ghost.style.height = dragState.rect.height + 'px';
      document.body.appendChild(ghost);
      dragState.ghost = ghost;
      dragState.originEl.classList.add('dragging-origin');
      const arena = document.querySelector('.arena');
      if (arena) arena.classList.add('drop-zone-active');
    }

    dragState.ghost.style.left = clientX + 'px';
    dragState.ghost.style.top = clientY + 'px';

    // 判定是否拖入释放区（高于手牌区顶部或位于战斗舞台内）
    const handRect = document.getElementById('hand')?.getBoundingClientRect();
    const dropLineY = handRect ? handRect.top - 16 : window.innerHeight * 0.62;
    const ready = clientY < dropLineY;
    dragState.ready = ready;
    dragState.ghost.classList.toggle('ready', ready);

    const arena = document.querySelector('.arena');
    if (arena) arena.classList.toggle('drop-zone-ready', ready);

    const hint = document.getElementById('drop-hint');
    if (hint) {
      hint.textContent = ready ? `✨ 松手打出：${dragState.card.n}` : `↑ 向上拖入深海战场以打出`;
      hint.classList.toggle('show', dragState.active);
    }

    const offensive = isOffensiveCard(dragState.card);
    const eArt = document.getElementById('e-art');
    const pArt = document.getElementById('p-art');
    if (eArt) eArt.classList.toggle('target-lock', ready && offensive);
    if (pArt) pArt.classList.toggle('ally-lock', ready && !offensive);

    // 绘制贝塞尔瞄准弧线
    const path = document.getElementById('drag-arrow-path');
    if (path) {
      const sx = dragState.rect.left + dragState.rect.width / 2;
      const sy = dragState.rect.top + dragState.rect.height * 0.35;
      const cx = (sx + clientX) / 2;
      const cy = Math.min(sy, clientY) - 90;
      path.setAttribute('d', `M ${sx} ${sy} Q ${cx} ${cy} ${clientX} ${clientY}`);
      path.setAttribute('stroke', ready ? '#fef08a' : '#5eead4');
      path.setAttribute('marker-end', ready ? 'url(#drag-arrowhead-ready)' : 'url(#drag-arrowhead)');
      path.style.display = 'block';
    }
  }

  function finishDrag(clientX, clientY, cancelled = false) {
    if (!dragState) return;
    const st = dragState;
    clearDragVisuals();
    if (cancelled) return;
    if (!st.active) {
      // 未拖动，视为普通点击出牌
      Game.playCard(st.handIdx);
      return;
    }
    if (st.ready) {
      Game.playCard(st.handIdx);
    }
  }

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('pointermove', e => {
      if (dragState) updateDrag(e.clientX, e.clientY);
    });
    window.addEventListener('pointerup', e => {
      if (dragState) finishDrag(e.clientX, e.clientY, false);
    });
    window.addEventListener('pointercancel', () => {
      if (dragState) finishDrag(0, 0, true);
    });
    window.addEventListener('contextmenu', e => {
      if (dragState && dragState.active) { e.preventDefault(); finishDrag(0, 0, true); }
    });
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && dragState) finishDrag(0, 0, true);
    });
  }

  // 挂钩 UI.battle 为每张可打出的手牌绑定拖拽 + 点击
  const _prevBattle = UI.battle.bind(UI);
  UI.battle = function () {
    _prevBattle();
    ensureDragDom();
    const s = Game.s;
    if (!s || !s.inBattle) return;
    const handEls = document.querySelectorAll('#hand .card');
    handEls.forEach((el, i) => {
      const id = s.hand[i];
      if (!id) return;
      const card = CARDS[id];
      const { cost } = Game.handCardState(card, id);
      if (s.energy < cost) return;
      el.onclick = null;
      el.style.touchAction = 'none';
      el.addEventListener('dragstart', e => e.preventDefault());
      el.addEventListener('pointerdown', e => {
        if (e.button && e.button !== 0) return;
        if (!Game.s?.inBattle || Game.s.resolving || Game.turnStarting || Game.uiChoice) return;
        dragState = {
          handIdx: i, id, card, originEl: el,
          startX: e.clientX, startY: e.clientY,
          rect: el.getBoundingClientRect(),
          active: false, ready: false, ghost: null
        };
      });
    });

    // 更新快捷键提示条，加入拖拽提示
    const kbd = document.querySelector('.kbd-hint');
    if (kbd) {
      kbd.innerHTML = '操作：<b>点击或向上拖拽出牌</b> · <kbd>1-9</kbd> 出牌 · <kbd>E</kbd>/<kbd>Space</kbd> 结束回合 · <kbd>S</kbd> 技能 · <kbd>D</kbd> 牌库';
    }
  };

  /* ================= 2. 10 个原创深海奇遇事件（❓） ================= */
  const EVENTS = [
    {
      id: 'whalefall',
      ico: '🐋',
      title: '巨鲸陨落 · 深海绿洲',
      desc: '一具巨大的鲸骸沉降在海沟斜坡上，四周聚集了无数发光生物与罕见珍宝。',
      choices: [
        {
          t: '🍖 汲取鲸脂精华',
          d: '最大生命 +8，恢复 15 生命（需支付 15 金币）',
          can: s => s.gold >= 15,
          run: () => { Game.s.gold -= 15; Game.s.maxHp += 8; Game.heal(15); return '你饱餐一顿，最大生命 +8，恢复 15 生命！'; }
        },
        {
          t: '🦴 深入鲸骨搜寻遗物',
          d: '随机获得 1 件遗物，但被骨刺划伤（失去 10 生命）',
          can: s => s.hp > 10,
          run: () => {
            Game.s.hp = Math.max(1, Game.s.hp - 10);
            const r = grantRandomRelic();
            return r ? `忍痛取出了遗物 ${RELICS[r].i} ${RELICS[r].n}！` : '遗物已集齐，改为获得了 45 金币！';
          }
        },
        {
          t: '🪙 沿外围搜刮漂流贝币',
          d: '安全离开，获得 25 金币',
          can: () => true,
          run: () => { Game.s.gold += 25; return '安稳收获 25 金币。'; }
        }
      ]
    },
    {
      id: 'ventshrine',
      ico: '🌋',
      title: '热液喷口神龛',
      desc: '滚烫的黑烟囱旁矗立着一块古老的玄武岩祭坛，矿脉中闪耀着奇异的光泽。',
      choices: [
        {
          t: '✨ 投币祈求罕见生物',
          d: '支付 20 金币，随机获得 1 张稀有或传说级卡牌',
          can: s => s.gold >= 20,
          run: () => {
            Game.s.gold -= 20;
            const id = pickRareOrLegend();
            Game.s.deck.push(id);
            return `获得强力卡牌【${CARDS[id].n}】！`;
          }
        },
        {
          t: '🔥 热泉提纯牌库',
          d: '从牌库中永久移除 1 张不需要的卡牌',
          can: s => s.deck.length > 5,
          custom: () => openRemoveCardSheet('🌋 热泉提纯：选择要移除的牌', () => Game.finishNode())
        },
        {
          t: '♨️ 在暖流中休整',
          d: '恢复 14 点生命',
          can: () => true,
          run: () => { Game.heal(14); return '热泉暖流抚平了伤痕，恢复 14 点生命。'; }
        }
      ]
    },
    {
      id: 'shipwreck',
      ico: '🏴‍☠️',
      title: '锈蚀沉船宝箱',
      desc: '一艘百年木船斜插在沙丘中，船长室里半掩着一只沉重的铁箍箱。',
      choices: [
        {
          t: '💥 强行撬开铁箱',
          d: '获得 48 金币，但触发锈铁机关失去 8 生命',
          can: s => s.hp > 8,
          run: () => { Game.s.hp = Math.max(1, Game.s.hp - 8); Game.s.gold += 48; return '撬开铁箱拿到 48 金币，手臂被划伤失去 8 生命。'; }
        },
        {
          t: '🔍 谨慎翻找甲板',
          d: '获得 1 张随机卡牌与 15 金币',
          can: () => true,
          run: () => { const id = Game.pickWeighted(); Game.s.deck.push(id); Game.s.gold += 15; return `找到【${CARDS[id].n}】与 15 金币！`; }
        },
        {
          t: '🚪 不冒风险直接下潜',
          d: '无事发生',
          can: () => true,
          run: () => '你绕开了摇摇欲坠的残骸。'
        }
      ]
    },
    {
      id: 'glowjellies',
      ico: '🎐',
      title: '迷途的发光水母群',
      desc: '成百上千只半透明水母被暗流冲散，正围绕着你的触手发出求助的微光。',
      choices: [
        {
          t: '🫧 护送水母回到暖流',
          d: '恢复 12 生命，获得 18 金币',
          can: () => true,
          run: () => { Game.heal(12); Game.s.gold += 18; return '水母群温柔地治愈了你（+12 生命），并留下一堆发光珍珠（+18 金币）。'; }
        },
        {
          t: '🌟 结识发光/占星伙伴',
          d: '从 3 张随机生物牌中选择 1 张加入牌库',
          can: () => true,
          custom: () => openFreeDraftSheet('🎐 发光伙伴：选 1 张加入牌库', () => Game.finishNode())
        }
      ]
    },
    {
      id: 'altar',
      ico: '🗿',
      title: '古老头足石碑',
      desc: '深海沟壁上刻着远古大王乌贼的浮雕，石碑凹槽似乎渴望着某种献祭。',
      choices: [
        {
          t: '🩸 滴入墨血换取圣物',
          d: '失去 12 生命，随机获得 1 件遗物',
          can: s => s.hp > 12,
          run: () => {
            Game.s.hp = Math.max(1, Game.s.hp - 12);
            const r = grantRandomRelic();
            return r ? `石碑裂开，赐予你 ${RELICS[r].i} ${RELICS[r].n}！` : '石碑化作 50 金币融入你的行囊！';
          }
        },
        {
          t: '🎴 献祭 1 张卡牌换取赏金',
          d: '永久移除 1 张卡牌，获得 30 金币',
          can: s => s.deck.length > 5,
          custom: () => openRemoveCardSheet('🗿 石碑献祭：选择要移除的牌（+30 金币）', () => { Game.s.gold += 30; Game.finishNode(); })
        },
        {
          t: '🙏 鞠躬致意后离开',
          d: '获得 4 点最大生命',
          can: () => true,
          run: () => { Game.s.maxHp += 4; Game.heal(4); return '石碑微微发亮，最大生命 +4！'; }
        }
      ]
    },
    {
      id: 'divingbell',
      ico: '🔔',
      title: '废弃铜制潜水钟',
      desc: '一座完好无损的旧时代潜水钟悬在礁石间，里面还留着探险家的日志与装备。',
      choices: [
        {
          t: '👑 解锁传说标本箱',
          d: '支付 25 金币，随机获得 1 张传说卡牌',
          can: s => s.gold >= 25,
          run: () => {
            Game.s.gold -= 25;
            const id = pickRarity('l');
            Game.s.deck.push(id);
            return `获得传说卡牌【${CARDS[id].n}】！`;
          }
        },
        {
          t: '🪙 拆解黄铜零件',
          d: '获得 35 金币',
          can: () => true,
          run: () => { Game.s.gold += 35; return '拆下不少值钱的黄铜齿轮，获得 35 金币！'; }
        },
        {
          t: '💤 在气室中短暂休眠',
          d: '恢复 18 生命',
          can: () => true,
          run: () => { Game.heal(18); return '精神焕发，恢复 18 生命！'; }
        }
      ]
    },
    {
      id: 'whirlpool',
      ico: '🌀',
      title: '深海涡流赌局',
      desc: '一股高速旋转的暖冷交汇涡流卷着闪光宝箱呼啸而过，跳进去生死难料。',
      choices: [
        {
          t: '🎲 纵身跃入涡流中心',
          d: '55% 获得随机遗物 + 25 金币；45% 失去 12 生命但仍得 20 金币',
          can: s => s.hp > 12,
          run: () => {
            if (Math.random() < 0.55) {
              Game.s.gold += 25;
              const r = grantRandomRelic();
              return r ? `大获全胜！得到 ${RELICS[r].i} ${RELICS[r].n} 与 25 金币！` : '大获全胜！得到 65 金币！';
            }
            Game.s.hp = Math.max(1, Game.s.hp - 12);
            Game.s.gold += 20;
            return '被暗流狠狠甩出（-12 生命），不过顺手抓住了 20 金币。';
          }
        },
        {
          t: '🌊 借边缘洋流挑选 1 张牌',
          d: '免费从 3 张卡牌中挑选 1 张',
          can: () => true,
          custom: () => openFreeDraftSheet('🌀 涡流拾牌：选 1 张加入牌库', () => Game.finishNode())
        }
      ]
    },
    {
      id: 'mirrorcoral',
      ico: '🪞',
      title: '镜面珊瑚档案馆',
      desc: '一片如水晶般光滑的珊瑚壁映出你的牌库倒影，仿佛可以将某张王牌一分为二。',
      choices: [
        {
          t: '👯 复制牌库中 1 张已有卡牌',
          d: '任选牌库里 1 张牌，获得它的完全复制品',
          can: s => s.deck.length > 0,
          custom: () => openDuplicateCardSheet('🪞 镜面珊瑚：选择要复制的卡牌', () => Game.finishNode())
        },
        {
          t: '💪 吸收珊瑚钙质',
          d: '最大生命 +7，恢复 7 生命',
          can: () => true,
          run: () => { Game.s.maxHp += 7; Game.heal(7); return '甲壳更加坚韧，最大生命 +7！'; }
        }
      ]
    },
    {
      id: 'blackmarket',
      ico: '🦑',
      title: '无光暗市商贩',
      desc: '一只披着海藻斗篷的盲眼章鱼悄声展开包袱：“只要价钱合适，什么都能谈。”',
      choices: [
        {
          t: '🎁 买下神秘遗物袋',
          d: '支付 35 金币，随机获得 1 件遗物',
          can: s => s.gold >= 35,
          run: () => {
            Game.s.gold -= 35;
            const r = grantRandomRelic();
            return r ? `成交！获得了 ${RELICS[r].i} ${RELICS[r].n}！` : '商贩没货了，退还并多赔了你 15 金币！';
          }
        },
        {
          t: '🗑️ 雇它销毁 1 张废牌',
          d: '支付 15 金币，从牌库永久移除 1 张卡牌',
          can: s => s.gold >= 15 && s.deck.length > 5,
          custom: () => openRemoveCardSheet('🦑 暗市销毁：选择要移除的牌（-15 金币）', () => { Game.s.gold -= 15; Game.finishNode(); })
        },
        {
          t: '👋 礼貌谢绝',
          d: '离开暗市',
          can: () => true,
          run: () => '盲眼商贩收起包袱消失在黑暗中。'
        }
      ]
    },
    {
      id: 'echowall',
      ico: '📡',
      title: '海沟回声壁',
      desc: '幽深的岩壁回荡着远方鲸群的低吟，声波让你的牌库产生了奇妙共鸣。',
      choices: [
        {
          t: '🎵 倾听回声精简牌组',
          d: '移除 1 张卡牌，并恢复 10 生命',
          can: s => s.deck.length > 5,
          custom: () => openRemoveCardSheet('📡 回声壁：移除 1 张牌并恢复 10 生命', () => { Game.heal(10); Game.finishNode(); })
        },
        {
          t: '📣 向深渊呼喊引来强者',
          d: '随机获得 1 张稀有卡牌与 12 金币',
          can: () => true,
          run: () => { const id = pickRarity('r'); Game.s.deck.push(id); Game.s.gold += 12; return `深渊回应了你！获得【${CARDS[id].n}】与 12 金币！`; }
        }
      ]
    }
  ];

  function grantRandomRelic() {
    const avail = Object.keys(RELICS).filter(k => !Game.hasRelic(k));
    if (!avail.length) { Game.s.gold += 45; return null; }
    const r = avail[(Math.random() * avail.length) | 0];
    Game.s.relics.push(r);
    UI.top();
    return r;
  }

  function pickRarity(r) {
    const pool = Object.keys(CARDS).filter(id => !id.startsWith('~') && !CARDS[id].nonCollectible && CARDS[id].r === r);
    return pool[(Math.random() * pool.length) | 0] || Game.pickWeighted();
  }

  function pickRareOrLegend() {
    return pickRarity(Math.random() < 0.25 ? 'l' : 'r');
  }

  function openRemoveCardSheet(title, onDone) {
    const s = Game.s;
    UI.sheet(`
      <h2>${title}</h2>
      <p class="lead">点击任意一张牌将其永久移出牌库</p>
      <div class="picks" id="rm-picks"></div>
      <button class="btn ghost" onclick="UI.closeSheet();Game.finishNode()">算了，返回航路</button>`);
    const box = document.getElementById('rm-picks');
    s.deck.forEach((id, idx) => {
      const el = UI.cardEl(id, { fixed: true });
      el.onclick = () => {
        s.deck.splice(idx, 1);
        if (Array.isArray(s.upgradedDeck)) {
          s.upgradedDeck = s.upgradedDeck
            .filter(index => index !== idx)
            .map(index => index > idx ? index - 1 : index);
        }
        Audio.card();
        UI.closeSheet();
        UI.top();
        onDone();
      };
      box.appendChild(el);
    });
  }

  function openDuplicateCardSheet(title, onDone) {
    const s = Game.s;
    UI.sheet(`
      <h2>${title}</h2>
      <p class="lead">点击任意一张牌获得它的复制品</p>
      <div class="picks" id="dup-picks"></div>
      <button class="btn ghost" onclick="UI.closeSheet();Game.finishNode()">算了，返回航路</button>`);
    const box = document.getElementById('dup-picks');
    s.deck.forEach(id => {
      const el = UI.cardEl(id, { fixed: true });
      el.onclick = () => {
        s.deck.push(id);
        Audio.card();
        UI.closeSheet();
        UI.top();
        onDone();
      };
      box.appendChild(el);
    });
  }

  function openFreeDraftSheet(title, onDone) {
    const picks = Game.draftPicks(3);
    UI.sheet(`
      <h2>${title}</h2>
      <p class="lead">选择 1 张加入牌库</p>
      <div class="picks" id="ev-draft"></div>
      <button class="btn ghost" onclick="UI.closeSheet();Game.finishNode()">跳过</button>`);
    const box = document.getElementById('ev-draft');
    picks.forEach(id => {
      const el = UI.cardEl(id);
      el.onclick = () => {
        Game.s.deck.push(id);
        Audio.card();
        UI.closeSheet();
        UI.top();
        onDone();
      };
      box.appendChild(el);
    });
  }

  /* ================= 3. 《杀戮尖塔》式自上而下深潜分支地图生成器 ================= */
  const ACT_DEPTHS = {
    1: ['50m', '90m', '140m', '190m', '240m', '280m', '320m'],
    2: ['500m', '750m', '1000m', '1250m', '1500m', '1750m', '2000m'],
    3: ['3200m', '4100m', '5000m', '5900m', '6800m', '7500m', '8000m']
  };

  function generateDiveMap(act) {
    const normals = Object.keys(FOES).filter(k => FOES[k].act === act && !FOES[k].elite && !FOES[k].boss);
    const eliteKey = Object.keys(FOES).find(k => FOES[k].act === act && FOES[k].elite);
    const bossKey = Object.keys(FOES).find(k => FOES[k].act === act && FOES[k].boss);
    const pickNormal = () => normals[(Math.random() * normals.length) | 0];

    const makeNode = (r, c, kind) => {
      const id = `r${r}c${c}`;
      if (kind === 'fight') {
        const f = pickNormal();
        return { id, r, c, k: 'fight', i: '⚔️', l: '遭遇战', sub: FOES[f].n, foe: f, next: [] };
      }
      if (kind === 'elite') {
        return { id, r, c, k: 'elite', i: '💀', l: '精英头足', sub: FOES[eliteKey].n, foe: eliteKey, next: [] };
      }
      if (kind === 'event') {
        return { id, r, c, k: 'event', i: '❓', l: '深海奇遇', sub: '未知事件', next: [] };
      }
      if (kind === 'shop') {
        return { id, r, c, k: 'shop', i: '🐚', l: '沉船商店', sub: '买牌/删牌', next: [] };
      }
      if (kind === 'rest') {
        return { id, r, c, k: 'rest', i: '🪸', l: '珊瑚休息', sub: '恢复/强化', next: [] };
      }
      if (kind === 'chest') {
        return { id, r, c, k: 'chest', i: '💎', l: '沉船宝箱', sub: '遗物/金币', next: [] };
      }
      return { id, r, c, k: 'boss', i: '👑', l: FOES[bossKey].n, sub: '本幕深渊领主', foe: bossKey, next: [] };
    };

    // 7 层结构：Row 0(3普通) -> Row 1(3混) -> Row 2(3混含精英/宝箱) -> Row 3(3混含商店/奇遇) -> Row 4(3混含精英/奇遇) -> Row 5(2整备) -> Row 6(1 Boss)
    const rowBlueprints = [
      ['fight', 'fight', 'fight'],
      shuffle(['fight', 'event', 'event']),
      shuffle(['elite', 'fight', 'chest']),
      shuffle(['shop', 'event', 'fight']),
      shuffle(['elite', 'event', 'rest']),
      shuffle(['rest', 'shop']),
      ['boss']
    ];

    const rows = rowBlueprints.map((kinds, r) => kinds.map((k, c) => makeNode(r, c, k)));

    // 建立无交叉、全连通的分叉/汇合连接（自上而下）
    for (let r = 0; r < rows.length - 1; r++) {
      const cur = rows[r], nxt = rows[r + 1];
      if (nxt.length === 1) {
        cur.forEach(n => n.next.push(nxt[0].id));
        continue;
      }
      const incoming = new Set();
      cur.forEach((node, i) => {
        // 按比例映射到下一层最近位置，并随机分叉到相邻位置（不交叉）
        const mapped = Math.round(i * (nxt.length - 1) / Math.max(1, cur.length - 1));
        node.next.push(nxt[mapped].id);
        incoming.add(nxt[mapped].id);
        if (Math.random() < 0.55) {
          const alt = mapped + (Math.random() < 0.5 ? -1 : 1);
          if (alt >= 0 && alt < nxt.length && !node.next.includes(nxt[alt].id)) {
            node.next.push(nxt[alt].id);
            incoming.add(nxt[alt].id);
          }
        }
      });
      // 确保下一层每个节点都至少有一条来自上层的路径
      nxt.forEach((target, j) => {
        if (!incoming.has(target.id)) {
          const parentIdx = Math.min(cur.length - 1, Math.round(j * (cur.length - 1) / Math.max(1, nxt.length - 1)));
          cur[parentIdx].next.push(target.id);
        }
      });
    }
    return rows;
  }

  /* ================= 4. 覆盖 Game 地图、事件、宝箱、精英奖励、增强商店与休息站 ================= */
  Game.buildMap = function (act) {
    const s = this.s;
    s.act = act;
    s.idx = 0;
    s.mapRows = generateDiveMap(act);
    s.curRow = 0;
    s.visitedIds = [];
    s.lastNodeId = null;
    s.activeNode = null;
    s.usedEvents = s.usedEvents || [];
    UI.map();
  };

  Game.availableNodeIds = function () {
    const s = this.s;
    if (!s || !s.mapRows) return new Set();
    if (s.curRow === 0) return new Set(s.mapRows[0].map(n => n.id));
    const prevRow = s.mapRows[s.curRow - 1] || [];
    const last = prevRow.find(n => n.id === s.lastNodeId);
    return new Set(last ? last.next : []);
  };

  Game.enterDiveNode = function (node) {
    const s = this.s;
    if (!this.availableNodeIds().has(node.id)) return;
    Audio.card();
    s.activeNode = node;
    s.lastNodeId = node.id;
    if (!s.visitedIds.includes(node.id)) s.visitedIds.push(node.id);

    if (node.k === 'fight' || node.k === 'elite' || node.k === 'boss') {
      this.startFight(node.foe);
    } else if (node.k === 'rest') {
      this.rest();
    } else if (node.k === 'shop') {
      this.shop();
    } else if (node.k === 'chest') {
      this.openChest();
    } else if (node.k === 'event') {
      this.openEvent();
    }
  };

  Game.finishNode = function (wasBoss = false) {
    UI.closeSheet();
    const s = this.s;
    s.activeNode = null;
    if (wasBoss) {
      this.buildMap(s.act + 1);
    } else {
      s.curRow = Math.min((s.mapRows?.length || 1) - 1, (s.curRow || 0) + 1);
      UI.map();
    }
    document.body.dataset.act = String(s.act || 1);
    UI.show('scr-map');
    UI.top();
    Game.saveRun();
  };

  Game.advance = function (wasBoss) {
    this.finishNode(wasBoss);
  };

  // 精英与 Boss 均掉落遗物！
  Game.reward = function (isBoss) {
    const s = this.s;
    const isElite = Boolean(s.e.def.elite);
    const gold = isBoss ? 50 : isElite ? 34 : 22;
    s.gold += gold;
    let relicMsg = '';
    if (isBoss || isElite) {
      const r = grantRandomRelic();
      if (r) {
        relicMsg = `<div class="notice">🎁 获得${isBoss ? ' Boss ' : '精英'}遗物：${RELICS[r].i} ${RELICS[r].n}（${RELICS[r].d}）</div>`;
      }
    }
    const picks = this.draftPicks(3);
    UI.sheet(`
      <h2>🎉 击败了 ${s.e.def.n}</h2>
      <p class="lead">获得 <b style="color:#fef08a">${gold}</b> 金币 · 选 1 张卡牌加入牌库</p>
      ${relicMsg}
      <div class="picks" id="picks"></div>
      <button class="btn ghost" onclick="Game.advance(${isBoss})">跳过，继续下潜 ↓</button>`);
    const box = document.getElementById('picks');
    picks.forEach(id => {
      const el = UI.cardEl(id);
      el.onclick = () => { s.deck.push(id); Audio.card(); Game.advance(isBoss); };
      box.appendChild(el);
    });
  };

  Game.openChest = function () {
    const s = this.s;
    const gold = 28 + ((Math.random() * 18) | 0);
    s.gold += gold;
    const r = grantRandomRelic();
    UI.sheet(`
      <h2>💎 沉船宝箱</h2>
      <p class="lead">在海沙中挖出了一只保存完好的深海宝箱！</p>
      <div class="notice">🪙 获得 ${gold} 金币${r ? ` · 🎁 获得遗物 ${RELICS[r].i} ${RELICS[r].n}（${RELICS[r].d}）` : ''}</div>
      <div class="row" style="margin-top:16px">
        <button class="btn" onclick="Game.finishNode()">收下宝物，继续下潜 ↓</button>
      </div>`);
    UI.top();
  };

  Game.openEvent = function () {
    const s = this.s;
    let pool = EVENTS.filter(ev => !(s.usedEvents || []).includes(ev.id));
    if (!pool.length) { s.usedEvents = []; pool = EVENTS; }
    const ev = pool[(Math.random() * pool.length) | 0];
    s.usedEvents = (s.usedEvents || []).concat(ev.id);

    UI.sheet(`
      <h2>${ev.ico} ${ev.title}</h2>
      <p class="lead">${ev.desc}</p>
      <div class="event-choices" id="ev-choices"></div>`);
    const box = document.getElementById('ev-choices');
    ev.choices.forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'event-choice';
      const ok = ch.can(s);
      if (!ok) btn.disabled = true;
      btn.innerHTML = `<div class="ec-title">${ch.t}</div><div class="ec-desc">${ch.d}</div>`;
      btn.onclick = () => {
        if (!ch.can(s)) return;
        Audio.card();
        if (ch.custom) { ch.custom(); return; }
        const msg = ch.run();
        UI.top();
        UI.sheet(`
          <h2>${ev.ico} ${ev.title}</h2>
          <p class="lead">${msg}</p>
          <button class="btn" onclick="Game.finishNode()">继续下潜 ↓</button>`);
      };
      box.appendChild(btn);
    });
  };

  // 增强珊瑚休息站：回血 / 最大生命 / 精简 1 张牌
  Game.rest = function () {
    const s = this.s;
    UI.sheet(`
      <h2>🪸 珊瑚休息站</h2>
      <p class="lead">在温暖宁静的珊瑚丛中休整准备继续下潜</p>
      <div class="row">
        <button class="btn" onclick="Game.heal(22);Game.finishNode()">❤️ 恢复 22 点生命</button>
        <button class="btn pink" onclick="Game.s.maxHp+=6;Game.heal(6);Game.finishNode()">💪 最大生命 +6</button>
        <button class="btn lav" id="rest-rm" ${s.deck.length <= 5 ? 'disabled' : ''}>🗑️ 精简 1 张牌</button>
      </div>`);
    const rmBtn = document.getElementById('rest-rm');
    if (rmBtn && s.deck.length > 5) {
      rmBtn.onclick = () => openRemoveCardSheet('🪸 珊瑚精简：选择 1 张牌移出牌库', () => Game.finishNode());
    }
  };

  // 增强沉船商店：3 张卡 + 1 件遗物 + 删牌服务（35 金币）
  Game.shop = function () {
    const s = this.s;
    const items = this.draftPicks(4);
    const availRelics = Object.keys(RELICS).filter(k => !this.hasRelic(k));
    const shopRelic = availRelics.length ? availRelics[(Math.random() * availRelics.length) | 0] : null;
    const relicPrice = 65;
    const rmPrice = 35;

    UI.sheet(`
      <h2>🐚 沉船商店</h2>
      <p class="lead">当前金币：<b style="color:#fef08a" id="shop-gold">${s.gold}</b></p>
      <div class="picks" id="picks"></div>
      <div class="row" style="margin:10px 0 16px">
        ${shopRelic ? `<button class="btn gold" id="shop-relic">🎁 ${RELICS[shopRelic].i} ${RELICS[shopRelic].n}（🪙 ${relicPrice}）</button>` : ''}
        <button class="btn lav" id="shop-rm" ${s.deck.length <= 5 ? 'disabled' : ''}>🗑️ 删除 1 张牌（🪙 ${rmPrice}）</button>
      </div>
      <button class="btn ghost" onclick="Game.finishNode()">离开商店，继续下潜 ↓</button>`);

    const refreshGold = () => {
      const g = document.getElementById('shop-gold');
      if (g) g.textContent = s.gold;
      UI.top();
    };
    const box = document.getElementById('picks');
    items.forEach(id => {
      const price = 22 + CARDS[id].c * 9;
      const el = UI.cardEl(id);
      const tag = document.createElement('div');
      tag.style.cssText = 'position:absolute;top:6px;right:24px;z-index:6;background:#fef08a;color:#3a2f00;font-weight:900;font-size:11px;padding:2px 7px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.5)';
      tag.textContent = '🪙 ' + price;
      el.appendChild(tag);
      el.onclick = () => {
        if (s.gold >= price) {
          s.gold -= price; s.deck.push(id); Audio.card();
          el.style.opacity = 0.3; el.onclick = null;
          refreshGold();
        }
      };
      box.appendChild(el);
    });

    const relBtn = document.getElementById('shop-relic');
    if (relBtn && shopRelic) {
      relBtn.title = RELICS[shopRelic].d;
      relBtn.onclick = () => {
        if (s.gold >= relicPrice) {
          s.gold -= relicPrice; s.relics.push(shopRelic); Audio.win();
          relBtn.disabled = true; relBtn.textContent = `✓ 已购入 ${RELICS[shopRelic].n}`;
          refreshGold();
        }
      };
    }
    const rmBtn = document.getElementById('shop-rm');
    if (rmBtn) {
      rmBtn.onclick = () => {
        if (s.gold >= rmPrice && s.deck.length > 5) {
          openRemoveCardSheet(`🐚 商店删牌（-🪙 ${rmPrice}）`, () => {
            s.gold -= rmPrice;
            refreshGold();
            Game.finishNode();
          });
        }
      };
    }
  };

  /* ================= 5. 渲染自上而下分支地图与 SVG 航线 ================= */
  UI.map = function () {
    const s = Game.s;
    if (!s) return;
    if (!s.mapRows) s.mapRows = generateDiveMap(s.act || 1);
    document.body.dataset.act = String(s.act || 1);
    document.getElementById('map-title').textContent = `${ACT_NAME[s.act]} · 逐层深潜航路`;
    const hint = document.querySelector('#scr-map .hint');
    if (hint) hint.textContent = '从浅海向深渊逐层下潜 ↓ 点击高亮发光节点选择你的路线';

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
        [1, '🌊 第 1 幕 · 浅海珊瑚礁 (50–320m)'],
        [2, '⚓ 第 2 幕 · 幽暗沉船区 (500–2000m)'],
        [3, '🕳️ 第 3 幕 · 无光海沟 (3200–8000m)']
      ];
      meter.innerHTML = acts.map(([num, label]) =>
        `<div class="depth-step ${s.act === num ? 'active' : s.act > num ? 'passed' : ''}">${label}</div>`
      ).join('');
    }

    const track = document.getElementById('map-track');
    track.className = 'dive-map-wrap';
    const avail = Game.availableNodeIds();
    const visited = new Set(s.visitedIds || []);
    const depths = ACT_DEPTHS[s.act] || ACT_DEPTHS[1];

    track.innerHTML = `
      <div class="dive-map-legend">
        <span>⚔️ 普通怪</span><span>💀 精英（掉遗物）</span><span>❓ 随机奇遇</span>
        <span>🐚 商店</span><span>🪸 休息站</span><span>💎 宝箱</span><span>👑 Boss</span>
      </div>
      <svg class="dive-svg" id="dive-svg"></svg>
      <div class="dive-rows" id="dive-rows"></div>`;

    const rowsEl = document.getElementById('dive-rows');
    s.mapRows.forEach((row, r) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'dive-row';
      rowEl.innerHTML = `<span class="dive-depth-tag">↓ ${depths[r] || ''}</span>`;
      row.forEach(node => {
        const el = document.createElement('div');
        let cls = 'dnode';
        if (visited.has(node.id)) cls += ' done';
        else if (avail.has(node.id)) cls += ' avail';
        else if (r > s.curRow) cls += ' future';
        else cls += ' locked';
        el.className = cls;
        el.dataset.id = node.id;
        el.dataset.kind = node.k;
        el.innerHTML = `<div class="ico">${node.i}</div><div class="lbl">${node.l}</div><div class="sub">${node.sub || ''}</div>`;
        if (avail.has(node.id)) el.onclick = () => Game.enterDiveNode(node);
        rowEl.appendChild(el);
      });
      rowsEl.appendChild(rowEl);
    });

    // 绘制自上而下的贝塞尔分支航线
    const drawLines = () => {
      const svg = document.getElementById('dive-svg');
      const wrap = track.getBoundingClientRect ? track.getBoundingClientRect() : null;
      if (!svg || !wrap || !wrap.width) return;
      svg.setAttribute('viewBox', `0 0 ${wrap.width} ${wrap.height}`);
      let paths = '';
      const posOf = id => {
        const el = rowsEl.querySelector(`[data-id="${id}"]`);
        if (!el || !el.getBoundingClientRect) return null;
        const r = el.getBoundingClientRect();
        return {
          x: r.left - wrap.left + r.width / 2,
          top: r.top - wrap.top,
          bottom: r.bottom - wrap.top
        };
      };
      s.mapRows.forEach((row, r) => {
        row.forEach(node => {
          const a = posOf(node.id);
          if (!a) return;
          node.next.forEach(tid => {
            const b = posOf(tid);
            if (!b) return;
            const isActivePath = (s.lastNodeId === node.id && avail.has(tid)) || (visited.has(node.id) && visited.has(tid));
            const stroke = isActivePath ? '#17674d' : 'rgba(71, 61, 42, 0.55)';
            const width = isActivePath ? 3 : 2;
            const dash = visited.has(node.id) && visited.has(tid) ? '' : 'stroke-dasharray="6 5"';
            const midY = (a.bottom + b.top) / 2;
            paths += `<path d="M ${a.x} ${a.bottom} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.top}" fill="none" stroke="${stroke}" stroke-width="${width}" ${dash} stroke-linecap="round"/>`;
          });
        });
      });
      svg.innerHTML = paths;
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(drawLines);
    else drawLines();
  };

  UI.title();
})();
