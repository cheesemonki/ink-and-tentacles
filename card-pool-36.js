'use strict';

(() => {
  /* ================= 1. 扩展流派与关键词 ================= */
  const newArchetypes = {
    pressure: { n: '水压', c: '#4c8bf5', d: '调节水深，在深海高压下打出重击，或上浮减压释放。' },
    parasite: { n: '寄生', c: '#c96b8c', d: '在敌人身上种下寄宿印记，持续汲取生命与护甲，满层孵化爆发。' },
    counter:  { n: '反制', c: '#f4a261', d: '洞察敌方当前意图，精准破招并令其失衡，以弱胜强。' },
    frenzy:   { n: '狂潮', c: '#ff5964', d: '用高频低费牌堆叠连段，叠加流血并打出多段狂暴连击。' },
    mutate:   { n: '演化', c: '#6ee7b7', d: '在单场战斗内永久升级卡牌形态，让幼体成长为深海霸主。' },
    bastion:  { n: '构礁', c: '#52b788', d: '建造最多三座持久生态礁体，每回合提供被动支援，或崩礁引爆。' },
    vortex:   { n: '涡流', c: '#38bdf8', d: '主动冲刷与洗牌，把整副牌库变成高速运转的旋涡水车。' },
    salvage:  { n: '拾遗', c: '#d4a373', d: '搜集海底残骸锻造 0 费临时零件牌，以零件运转或熔铸爆发。' },
    magnet:   { n: '磁感', c: '#a78bfa', d: '依循地磁韵律交替奇偶费用或按费递增，触发磁极共振。' },
    bounty:   { n: '掠金', c: '#fbbf24', d: '战斗中悬赏敛财，用金币驱动超模爆发，打通战斗与商店经济。' },
    corrode:  { n: '酸蚀', c: '#a3e635', d: '持续腐蚀敌人攻防底盘，削弱其攻击与叠甲，并反制治疗。' },
    omen:     { n: '占星', c: '#e879f9', d: '揭示牌顶并押注预言，猜中费用或类型即可触发双倍星象恩赐。' }
  };
  Object.assign(ARCH, newArchetypes);

  Object.assign(KW, {
    水深: '水深：上限 5。每层使水压牌获得深度强化；水深达到 4 以上时，回合结束承受 2 点压迫伤害。',
    下潜: '下潜：水深 +1（上限 5）。',
    上浮: '上浮：降低水深或归零，按下降层数触发减压收益。',
    寄宿: '寄宿：附着在敌人身上的持久印记（上限 5，不自动衰减）。触发时按层数吸血或窃甲。',
    孵化: '孵化：消耗敌人全部寄宿层数，立即造成爆发穿透伤害。',
    破招: '破招：当敌人当前意图满足卡牌所写类型（如攻击、护甲、非攻击）时触发强化。',
    失衡: '失衡：敌人下次攻击伤害 -35%，且受到的下一次攻击伤害 +35%（触发后清空）。',
    连段: '连段：本回合此前已打出的卡牌张数（不含本牌）。',
    流血: '流血：敌人每次受到直接卡牌伤害时额外承受等同层数的伤害，回合结束减半（向下取整）。',
    演化: '演化：使目标原件在本场战斗中永久升级（最多 2 阶），保留在抽弃牌循环中直至战后恢复。',
    礁体: '礁体：驻场生态结构，同时最多存在 3 座。每回合开始自动触发被动，可加固或崩礁引爆。',
    崩礁: '崩礁：摧毁所有礁体，按总层数转化为即时爆发与护甲。',
    搅流: '搅流：主动将弃牌堆洗入抽牌堆，或将牌顶冲入弃牌堆以加速循环。',
    残骸: '残骸：0 费一次性临时零件牌（贝片/铁板/油脂/锚链），打出后消失，不进弃牌堆。',
    磁极: '磁极：上一张打出卡牌的费用奇偶（奇极/偶极）或递增阶梯，交替或递增触发共振。',
    悬赏: '悬赏：标记敌人或达成条件时直接获得金币；部分掠金牌可消费金币触发强效。',
    腐蚀: '腐蚀：敌方持久减益（上限 8，不自动清零）。每层使敌人每次叠甲 -1、每次攻击 -1 伤。',
    预言: '预言：揭示抽牌堆顶牌，若满足所写条件则触发强化；随后牌顶保持原位（除非另有说明）。'
  });

  /* ================= 2. 6 个配套新遗物 ================= */
  Object.assign(RELICS, {
    bathyscaphe: { i: '🤿', n: '深潜玻璃球', d: '每场战斗开始自动下潜 1 层；水深 ≥ 4 时压迫伤害 -1' },
    leechtooth:  { i: '🩸', n: '寄生吸盘',   d: '每场战斗开始，敌人获得 1 层寄宿与 1 层流血' },
    astrolabe:   { i: '🧭', n: '沉船星盘',   d: '每回合开始自动查看抽牌堆顶 1 张牌（计为已知）' },
    anvil:       { i: '⚓', n: '生锈铁砧',   d: '每回合第一次打出临时或残骸牌时，获得 3 护甲' },
    goldscale:   { i: '⚖️', n: '黄金天平',   d: '战斗胜利额外获得 10 金币；每持有 100 金币，每回合开始获得 2 护甲' },
    acidjar:     { i: '🧪', n: '冷泉酸瓶',   d: '每场战斗开始，敌人获得 1 层腐蚀；每次破招额外施加 1 层腐蚀' }
  });

  /* ================= 3. 残骸衍生牌（不入图鉴与选牌） ================= */
  const SALVAGE_DEFS = [
    ['_salvage_blade', '锋利贝片', '造成 4 伤害。【残骸】', g => g.hit(4)],
    ['_salvage_plate', '沉船铁板', '获得 4 护甲。【残骸】', g => g.block(4)],
    ['_salvage_oil',   '深海油脂', '获得 1 点洋流。【残骸】', g => g.gain(1)],
    ['_salvage_chain', '腐朽锚链', '施加 2 层易伤。【残骸】', g => g.vln(2)]
  ];
  for (const [id, n, d, f] of SALVAGE_DEFS) {
    def(id, n, 0, 'salvage', 'c', null, d, f);
    CARDS[id].nonCollectible = true;
    CARDS[id].isSalvage = true;
    if (id === '_salvage_plate') CARDS[id].defense = true;
  }

  /* ================= 4. 辅助函数与新流派机制工具 ================= */
  const real = id => CARDS[id] && !CARDS[id].temporary && !CARDS[id].nonCollectible;
  const handReal = (g, c, filter = () => true) =>
    g.s.hand.filter(id => id !== c?.id && real(id) && filter(CARDS[id]));
  const topCardId = g => g.s.drawPile.at(-1) || null;
  const curIntent = g => g.s.e.def ? g.s.e.def.it[g.s.e.i % g.s.e.def.it.length] : null;
  const intentHasAtk = g => { const it = curIntent(g); return Boolean(it && (it.k === 'atk' || it.k === 'mix')); };
  const intentAtkVal = g => { const it = curIntent(g); return !it ? 0 : it.k === 'atk' ? it.v : it.k === 'mix' ? it.a : 0; };
  const intentNonAtk = g => Boolean(curIntent(g) && !intentHasAtk(g));

  const REEF_LABELS = { wall: '护壁礁', spike: '刺珊瑚礁', life: '生机礁' };

  Object.assign(Game, {
    diveDepth(n = 1) {
      const s = this.s;
      const before = s.depth;
      s.depth = Math.max(0, Math.min(5, s.depth + n));
      if (s.depth > before) s.divedDepthThisTurn = true;
      return s.depth - before;
    },
    surfaceDepth(n = Infinity) {
      const s = this.s;
      const drop = Math.min(s.depth, n);
      s.depth -= drop;
      return drop;
    },
    addParasite(n = 1) {
      this.s.e.parasite = Math.min(5, (this.s.e.parasite || 0) + n);
    },
    hatchParasite() {
      const s = this.s;
      const layers = s.e.parasite || 0;
      if (!layers) return 0;
      s.e.parasite = s.parasiteKeep ? Math.min(2, layers) : 0;
      if (s.parasiteKeep && s.e.hp > 0) this.draw(2);
      return layers;
    },
    addBleed(n = 1) {
      this.s.e.bleed = Math.max(0, (this.s.e.bleed || 0) + n);
    },
    addCorrode(n = 1) {
      this.s.e.corrode = Math.min(8, (this.s.e.corrode || 0) + n);
    },
    triggerCounter() {
      this.s.counteredThisTurn = true;
      if (this.hasRelic('acidjar')) this.addCorrode(1);
    },
    getEvo(id) {
      return this.s?.evoLevel?.get(id) || 0;
    },
    evolveCard(id) {
      const s = this.s;
      if (!id || !real(id)) return false;
      const cur = s.evoLevel.get(id) || 0;
      if (cur >= 2) return false;
      s.evoLevel.set(id, cur + 1);
      s.evoTriggers++;
      const card = CARDS[id];
      if (card.a !== 'mutate') {
        s.evoBonus.set(id, (s.evoBonus.get(id) || 0) + 3);
      }
      // 长棘海胆在手牌中同步蹭演化
      for (const hid of s.hand) {
        if (hid !== id && CARDS[hid]?.id === 'mutate_08') {
          const hCur = s.evoLevel.get(hid) || 0;
          if (hCur < 2) {
            s.evoLevel.set(hid, hCur + 1);
            s.evoTriggers++;
          }
        }
      }
      return true;
    },
    evolvedCount() {
      const s = this.s;
      let n = 0;
      for (const lvl of s.evoLevel.values()) if (lvl > 0) n++;
      return n;
    },
    buildReef(kind, amount = 1) {
      const s = this.s;
      let r = s.reefs.find(x => x.kind === kind);
      if (r) {
        r.stacks = Math.min(5, r.stacks + amount);
      } else if (s.reefs.length < 3) {
        s.reefs.push({ kind, stacks: Math.min(5, amount), label: REEF_LABELS[kind] });
      }
    },
    triggerReefs() {
      const s = this.s;
      for (const r of s.reefs) {
        if (s.e.hp <= 0 || s.hp <= 0) break;
        if (r.kind === 'wall') s.p.block += r.stacks * 2;
        else if (r.kind === 'spike') this.hit(r.stacks * 2);
        else if (r.kind === 'life') {
          this.heal(r.stacks);
          if (r.stacks >= 3) this.draw(1);
        }
      }
    },
    totalReefStacks() {
      return this.s.reefs.reduce((sum, r) => sum + r.stacks, 0);
    },
    onShuffle() {
      const s = this.s;
      s.shufflesThisBattle++;
      s.shufflesThisTurn++;
      if (s.vortexEngine && s.e.hp > 0) {
        const prev = s.resolving;
        s.resolving = { passive: true };
        this.hit(6);
        s.p.block += 4;
        s.resolving = prev;
      }
    },
    shuffleDiscardIn() {
      const s = this.s;
      if (!s.discard.length) return 0;
      const count = s.discard.length;
      s.drawPile = shuffle(s.drawPile.concat(s.discard));
      s.discard = [];
      s.omenKnownTop = null;
      this.onShuffle();
      return count;
    },
    millDraw(n) {
      const s = this.s;
      let moved = 0;
      for (let i = 0; i < n && s.drawPile.length; i++) {
        s.discard.push(s.drawPile.pop());
        moved++;
      }
      if (moved) s.omenKnownTop = null;
      return moved;
    },
    addSalvage(id) {
      if (this.s.hand.length >= 10) return false;
      const key = id || SALVAGE_DEFS[(Math.random() * SALVAGE_DEFS.length) | 0][0];
      this.s.hand.push(this.newToken(key, true, true));
      return true;
    },
    earnBountyGold(amount, ignoreCap = false) {
      const s = this.s;
      const grant = ignoreCap ? amount : Math.max(0, Math.min(amount, 35 - s.bountyGoldEarned));
      if (grant > 0) {
        s.gold += grant;
        if (!ignoreCap) s.bountyGoldEarned += grant;
      }
      return grant;
    },
    async spendBountyGold(amount, prompt) {
      const s = this.s;
      if (s.gold < amount) return false;
      if (!await this.confirmEffect(prompt || `支付 ${amount} 金币，触发强效？`)) return false;
      s.gold -= amount;
      if (s.bountyCannon && s.e.hp > 0) {
        this.hit(amount);
        this.block(Math.floor(amount / 2));
      }
      return true;
    },
    recordMagnetTrigger() {
      const s = this.s;
      s.magnetTriggersThisTurn++;
      if (s.magnetCoil && s.e.hp > 0) {
        this.hit(4, true);
        s.p.block += 2;
      }
    },
    async revealOmen(predicate) {
      const s = this.s;
      const tid = topCardId(this);
      if (!tid) return { tid: null, hit: false };
      s.omenKnownTop = tid;
      const card = CARDS[tid];
      const hit = Boolean(predicate(card, tid));
      UI.log(`🔮 预言揭示：${card.n}（${card.c}费）· ${hit ? '命中！' : '未命中'}`);
      if (hit) {
        s.omenHitThisTurn = true;
        if (s.omenStar && s.omenStarUsed < 2 && s.e.hp > 0) {
          s.omenStarUsed++;
          this.draw(1);
          this.hit(4);
        }
      }
      return { tid, hit, card };
    }
  });

  /* ================= 5. 引擎生命周期钩子封装 ================= */
  const _initPoolFight = Game.initPoolFight.bind(Game);
  Game.initPoolFight = function () {
    _initPoolFight();
    const s = this.s;
    Object.assign(s, {
      depth: 0, divedDepthThisTurn: false, ignorePressureThisTurn: false, pressureReversed: false,
      parasiteDrain: false, parasiteKeep: false,
      counteredThisTurn: false, tempThorns: 0, reflectIntentAtk: 0, cancelEnemyNonAtk: false, negateNextEnemyAtk: false,
      playedCount: 0, extraStrikeCharges: 0, frenzyEngine: false, frenzyEngineUsed: false,
      evoLevel: new Map(), evoBonus: new Map(), evoTriggers: 0,
      costOverrides: new Map(), turnCostOverrides: new Map(),
      reefs: [],
      shufflesThisBattle: 0, shufflesThisTurn: 0, vortexEngine: false,
      tempPlayedThisTurn: 0, salvageForge: false, anvilUsed: false,
      lastCost: null, magnetTriggersThisTurn: 0, magnetCoil: false, nextAtkBonus: 0,
      bountyGoldEarned: 0, bountyCannon: false,
      acidTrap: false, corrodeAmp: false,
      omenKnownTop: null, omenHitThisTurn: false, omenStar: false, omenStarUsed: 0,
      firstDefPlayed: false, toxicBloomUsed: false
    });
    Object.assign(s.e, { parasite: 0, imbalance: false, bleed: 0, corrode: 0 });
    if (this.hasRelic('bathyscaphe')) s.depth = 1;
    if (this.hasRelic('leechtooth')) { s.e.parasite = 1; s.e.bleed = 1; }
    if (this.hasRelic('acidjar')) s.e.corrode = 1;
  };

  const _tickPool = Game.tickPool.bind(Game);
  Game.tickPool = async function () {
    const s = this.s;
    Object.assign(s, {
      divedDepthThisTurn: false, ignorePressureThisTurn: false,
      counteredThisTurn: false, reflectIntentAtk: 0, cancelEnemyNonAtk: false, negateNextEnemyAtk: false,
      playedCount: 0, extraStrikeCharges: 0, frenzyEngineUsed: false,
      shufflesThisTurn: 0, tempPlayedThisTurn: 0, anvilUsed: false,
      lastCost: null, magnetTriggersThisTurn: 0, nextAtkBonus: 0,
      omenHitThisTurn: false, omenStarUsed: 0, firstDefPlayed: false, toxicBloomUsed: false
    });
    s.turnCostOverrides.clear();
    if (this.hasRelic('goldscale')) {
      const bonus = Math.floor(s.gold / 100) * 2;
      if (bonus > 0) s.p.block += bonus;
    }
    this.triggerReefs();
    await _tickPool();
    if (this.hasRelic('astrolabe') && topCardId(this)) {
      s.omenKnownTop = topCardId(this);
    }
  };

  const _finishPoolTurn = Game.finishPoolTurn.bind(Game);
  Game.finishPoolTurn = function () {
    const s = this.s;
    _finishPoolTurn();
    if (s.depth >= 4 && !s.ignorePressureThisTurn && s.e.hp > 0) {
      if (s.pressureReversed) {
        this.hit(4);
      } else {
        const dmg = this.hasRelic('bathyscaphe') ? 1 : 2;
        let rem = dmg;
        if (s.p.block > 0) { const a = Math.min(s.p.block, rem); s.p.block -= a; rem -= a; }
        if (rem > 0) s.hp = Math.max(0, s.hp - rem);
      }
    }
    if (s.e.bleed > 0) s.e.bleed = Math.floor(s.e.bleed / 2);
  };

  // 拦截 draw 以统计洗牌触发涡流
  Game.draw = function (n) {
    const s = this.s;
    for (let i = 0; i < n && s.hand.length < 10; i++) {
      if (!s.drawPile.length) {
        if (!s.discard.length) break;
        s.drawPile = shuffle(s.discard);
        s.discard = [];
        s.omenKnownTop = null;
        this.onShuffle();
        if (this.hasRelic('lens') && s.hand.length < 10 && s.drawPile.length) {
          s.hand.push(s.drawPile.pop());
        }
      }
      if (s.hand.length < 10 && s.drawPile.length) {
        const drawn = s.drawPile.pop();
        if (s.omenKnownTop === drawn) s.omenKnownTop = null;
        s.hand.push(drawn);
      }
    }
  };

  // 扩展 previewDamage & hit：加入流血、失衡、腐蚀增伤、演化非变异加成、磁感下击增伤
  Game.previewDamage = function (n, beforeArmor = false, pierce = false) {
    const s = this.s, e = s.e;
    const eligible = !s.extraDamageUsed;
    const bonus = eligible ? s.buffs.glow + (s.voltPower ? Math.min(5, e.shock) : 0) : 0;
    const tide = s.tide && !s.tideAttackUsed ? 2 : 0;
    const bleed = e.bleed || 0;
    const corrodeAmp = s.corrodeAmp ? 2 : 0;
    const nextBonus = s.nextAtkBonus || 0;
    const mult = (1 + e.vuln * 0.25) * (e.imbalance ? 1.35 : 1);
    const amount = Math.round((n + bonus + tide + bleed + corrodeAmp + nextBonus) * mult);
    return beforeArmor || pierce ? amount : Math.max(0, amount - e.block);
  };

  Game.hit = function (n, pierce) {
    const s = this.s, e = s.e;
    if (n <= 0 || e.hp <= 0) return;
    const ctx = s.resolving;
    const direct = ctx && !ctx.passive;
    const before = e.block;
    let base = n;
    if (direct && ctx.id && s.evoBonus?.has(ctx.id) && !ctx.evoBonusApplied) {
      base += s.evoBonus.get(ctx.id);
      ctx.evoBonusApplied = true;
    }
    let damage;
    if (direct) {
      damage = this.previewDamage(base, true, pierce);
      s.extraDamageUsed = true;
      if (s.tide) s.tideAttackUsed = true;
      if (e.imbalance) e.imbalance = false;
      if (s.nextAtkBonus) s.nextAtkBonus = 0;
      ctx.attack = true;
    } else {
      const corrodeAmp = s.corrodeAmp ? 2 : 0;
      damage = Math.round((base + corrodeAmp) * (1 + e.vuln * 0.25));
    }
    if (!pierce && e.block > 0) {
      const absorbed = Math.min(e.block, damage);
      e.block -= absorbed;
      damage -= absorbed;
    }
    if (before > 0 && e.block === 0) s.brokeArmor = true;
    if (damage > 0) {
      e.hp = Math.max(0, e.hp - damage);
      Audio.hit();
      UI.shake('e-art');
    }
  };

  const _block = Game.block.bind(Game);
  Game.block = function (n) {
    const s = this.s, ctx = s.resolving;
    let total = n;
    if (ctx && !ctx.passive && ctx.id && s.evoBonus?.has(ctx.id) && !ctx.evoBlockApplied) {
      total += s.evoBonus.get(ctx.id);
      ctx.evoBlockApplied = true;
    }
    _block(total);
  };

  // 扩展 handCardState：支持费用覆写、远洋白鳍鲨连段减费、动态激活检测
  Game.handCardState = function (card, id = card.token) {
    const s = this.s;
    const eligible = s.hand.some(token => token !== id && !CARDS[token].temporary);
    const canDevour = Boolean(card.devours && eligible);
    let baseCost = card.free ? 0 : card.c;
    if (s.costOverrides?.has(id)) baseCost = s.costOverrides.get(id);
    if (s.turnCostOverrides?.has(id)) baseCost = s.turnCostOverrides.get(id);
    if (card.id === 'frenzy_10' && s.playedCount >= 4) baseCost = Math.max(0, baseCost - 1);
    const cost = Math.max(0, baseCost - (s.costDown > 0 ? 1 : 0) - Number(s.discounts.has(id)));
    const ctx = { id, card, cost, paid: false };
    const conditional = Boolean(card.devours || card.activates);
    const active = canDevour || Boolean(card.activates?.(this, ctx));
    return { cost, canDevour, conditional, active };
  };

  // 扩展 playCard：支持连段计数、磁极交替记录、临时/残骸牌引擎、白边真鲨追加攻击、灯塔水母置顶
  const _playCard = Game.playCard.bind(Game);
  Game.playCard = async function (handIdx) {
    const s = this.s;
    if (!s.inBattle || s.resolving || this.turnStarting) return;
    const id = s.hand[handIdx];
    if (!id) return;
    const card = CARDS[id];
    const { cost } = this.handCardState(card, id);
    if (s.energy < cost) return;

    const prevLastCost = s.lastCost;
    const wasTemp = Boolean(card.temporary);
    const wasDef = Boolean(card.defense);
    const hadStrikeCharge = s.extraStrikeCharges > 0;

    await _playCard(handIdx);
    if (!s.inBattle) return;

    s.playedCount++;
    if (wasDef) s.firstDefPlayed = true;

    // 磁极奇偶交替检测（供帝企鹅光环）
    if (prevLastCost !== null && (prevLastCost % 2 !== cost % 2)) {
      this.recordMagnetTrigger();
    }
    s.lastCost = cost;

    // 黑枪鱼第 4 张牌回费抽牌
    if (s.frenzyEngine && !s.frenzyEngineUsed && s.playedCount === 4) {
      s.frenzyEngineUsed = true;
      this.gain(1);
      this.draw(1);
    }

    // 白边真鲨追加 3 伤（仅对攻击型牌）
    if (hadStrikeCharge && !card.isStrikeBuff && s.attacked && s.e.hp > 0 && card.id !== 'frenzy_07') {
      s.extraStrikeCharges--;
      const prev = s.resolving;
      s.resolving = { passive: false };
      this.hit(3);
      s.resolving = prev;
    }

    // 临时/残骸牌引擎
    if (wasTemp) {
      s.tempPlayedThisTurn++;
      if (this.hasRelic('anvil') && !s.anvilUsed) {
        s.anvilUsed = true;
        s.p.block += 3;
      }
      if (s.salvageForge && s.e.hp > 0) {
        this.hit(2, true);
      }
    }

    if (!this.checkEnd()) { UI.battle(); UI.top(); }
    else UI.top();
  };

  // 扩展 hurtPlayer：支持腐蚀减敌攻、失衡减敌攻、极寒大王酸浆鱿减伤反伤、大西洋蓝枪鱼零伤格挡、反制反弹
  Game.hurtPlayer = function (base) {
    const s = this.s;
    if (s.negateNextEnemyAtk) {
      s.negateNextEnemyAtk = false;
      UI.log('大西洋蓝枪鱼完美格挡了本次攻击！');
      return;
    }
    let adjBase = Math.max(0, base - (s.e.corrode || 0));
    let mult = 1;
    if (s.e.shock > 0) mult -= 0.25;
    if (s.fog) mult -= s.fog / 100;
    if (s.paralyze) { mult *= 0.5; s.paralyze = 0; }
    if (s.frozenHalf) mult *= 0.7; // 优化后的大王酸浆鱿：-30%
    if (s.e.imbalance) { mult *= 0.65; s.e.imbalance = false; }
    let d = Math.round(adjBase * Math.max(0.15, mult));
    if (s.e.freeze > 0) {
      d = Math.max(0, d - 2 * s.e.freeze);
      if (s.frozenHalf && s.e.hp > 0) this.hit(2); // 冻结反伤 2
    }
    let dd = d;
    if (s.p.block > 0) { const a = Math.min(s.p.block, dd); s.p.block -= a; dd -= a; }
    if (dd > 0) { s.hp = Math.max(0, s.hp - dd); Audio.hit(); UI.shake('p-art'); }
    const totalThorns = (s.p.thorns || 0) + (s.tempThorns || 0);
    if (totalThorns > 0) this.hit(totalThorns);
    if (s.reflectIntentAtk > 0 && s.e.hp > 0) {
      this.hit(s.reflectIntentAtk);
      s.reflectIntentAtk = 0;
    }
  };

  // 扩展 endTurn：支持腐蚀削减敌方叠甲、火海胆反制叠甲/回血、锯鲨打断护甲/治疗、拟寄生海螺敌动吸血、临时荆棘清理
  Game.endTurn = function () {
    const s = this.s;
    if (!s.inBattle || s.resolving || this.turnStarting) return;
    this.finishPoolTurn();
    s._playedThisTurn = false;
    if (this.checkEnd()) return;

    if (s.e.poison > 0) {
      s.e.hp = Math.max(0, s.e.hp - s.e.poison);
      UI.log('剧毒侵蚀 ' + s.e.poison);
      s.e.poison--;
      if (this.checkEnd()) return;
    }

    s.e.block = 0;
    if (s.skipEnemy) {
      UI.log('对手被冻结，无法行动');
    } else {
      const it = s.e.def.it[s.e.i % s.e.def.it.length];
      let msg = '';
      const applyEnemyBlock = amt => {
        if (s.cancelEnemyNonAtk) return 0;
        const gain = Math.max(0, amt - (s.e.corrode || 0));
        if (s.acidTrap && s.e.corrode > 0 && gain > 0) this.hit(s.e.corrode * 2);
        s.e.block += gain;
        return gain;
      };
      if (it.k === 'atk') { this.hurtPlayer(it.v); msg = it.t + ' ' + it.v; }
      else if (it.k === 'blk') { const g = applyEnemyBlock(it.v); msg = it.t + (s.cancelEnemyNonAtk ? '（被打断）' : ' +' + g + ' 护甲'); }
      else if (it.k === 'mix') { this.hurtPlayer(it.a); const g = applyEnemyBlock(it.b); msg = it.t + ' ' + it.a + '/+' + g; }
      else if (it.k === 'psn') { s.p.poison += it.v; msg = it.t + ' +' + it.v; }
      else if (it.k === 'heal') {
        if (s.cancelEnemyNonAtk) { msg = it.t + '（被打断）'; }
        else {
          if (s.acidTrap && s.e.corrode > 0) this.hit(s.e.corrode * 2);
          s.e.hp = Math.min(s.e.maxHp, s.e.hp + it.v);
          msg = it.t + ' +' + it.v;
        }
      }
      if (s.parasiteDrain && s.e.parasite > 0 && s.e.hp > 0) this.heal(2);
      UI.log('对手：' + msg);
    }
    s.tempThorns = 0;
    s.cancelEnemyNonAtk = false;
    s.e.i++;
    s.skipEnemy = false;
    if (s.e.shock > 0) s.e.shock--;
    if (s.e.vuln > 0) s.e.vuln--;
    if (s.e.freeze > 0) s.e.freeze--;

    if (s.p.poison > 0) { s.hp = Math.max(0, s.hp - s.p.poison); s.p.poison--; }
    if (s.skillCd > 0) s.skillCd--;

    if (this.checkEnd()) return;
    this.startTurn();
  };

  // 扩展 checkEnd：黄金天平胜利额外 +10 金币
  const _checkEnd = Game.checkEnd.bind(Game);
  Game.checkEnd = function () {
    const s = this.s;
    const wasInBattle = s.inBattle;
    const enemyDead = s.e.hp <= 0 && s.hp > 0;
    if (wasInBattle && enemyDead && this.hasRelic('goldscale')) s.gold += 10;
    return _checkEnd();
  };

  /* ================= 6. 36 流派智能发牌优化 ================= */
  Game.archMul = function (a) {
    const n = this.affinity()[a] || 0;
    return 1 + Math.min(14, n * 1.15);
  };
  Game.pickWeighted = function (exclude, forceArch) {
    const pool = Object.keys(CARDS).filter(id =>
      !CARDS[id].nonCollectible && !CARDS[id].temporary && (!exclude || !exclude.includes(id))
    );
    let cand = forceArch ? pool.filter(id => CARDS[id].a === forceArch) : pool;
    if (!cand.length) cand = pool;
    let total = 0;
    const ws = cand.map(id => { const w = this.cardWeight(id); total += w; return w; });
    let r = Math.random() * total;
    for (let i = 0; i < cand.length; i++) { r -= ws[i]; if (r <= 0) return cand[i]; }
    return cand[cand.length - 1];
  };
  Game.draftPicks = function (n, force) {
    const picks = [];
    const aff = this.affinity();
    const ownedArchs = Object.keys(aff).sort((a, b) => aff[b] - aff[a]);
    const top = force || this.topArch();
    if (top && Math.random() < 0.82) picks.push(this.pickWeighted(picks, top));
    if (picks.length < n && ownedArchs.length >= 2 && Math.random() < 0.45) {
      const subArch = ownedArchs[1];
      picks.push(this.pickWeighted(picks, subArch));
    }
    let guard = 0;
    while (picks.length < n && guard++ < 80) {
      const id = this.pickWeighted(picks);
      if (id) picks.push(id);
    }
    return picks;
  };

  /* ================= 7. 现有 240 张卡的 16 项审计优化 ================= */
  const opt = (id, d, f, activates) => {
    if (!CARDS[id]) return;
    Object.assign(CARDS[id], { d, f });
    if (activates !== undefined) CARDS[id].activates = activates;
  };

  // 1) 海獭 (dive_04) 解除与黄带拟鲹重复
  opt('dive_04', '造成 4 伤害，获得 4 护甲。【潜航 1】下回合抽 1 张牌并获得 4 护甲。',
    async (g, c) => {
      g.hit(4); g.block(4);
      if (!g.s.diveQueued && (c.paid ? g.s.energy : g.s.energy - c.cost) >= 1 &&
          await g.confirmEffect('额外支付 1 洋流，发动潜航？')) {
        g.s.energy--; g.s.diveQueued = true;
        g.s.delayed.push({ kind: 'dive', turn: g.s.turnNo + 1, effect: gg => { gg.draw(1); gg.block(4); } });
      }
    },
    (g, c) => !g.s.diveQueued && (c.paid ? g.s.energy : g.s.energy - c.cost) >= 1
  );

  // 2) 红带寄居蟹 (hermit) 不再被下位替代
  opt('hermit', '获得 6 护甲。若本回合这是你打出的第一张防御牌，再获得 2 护甲。',
    g => g.block(g.s.firstDefPlayed ? 6 : 8),
    g => !g.s.firstDefPlayed
  );

  // 3) 眼斑双锯鱼 (clownfish) 差异化饵料收益
  CARDS.clownfish.baitBonus = g => { g.s.nextEnergy += 1; };
  CARDS.clownfish.d = '造成 5 伤害，抽 1 张。【饵料】被吞噬时，下回合 +1 洋流。';

  // 4) 星斑裸胸鳝 (moray) 融入吞噬体系
  CARDS.moray.devours = true;
  opt('moray', '造成 7 伤害，施加 2 层剧毒。【吞噬】改为施加 5 层剧毒。',
    (g, c) => { g.hit(7); g.psn(c.ate ? 5 : 2); }
  );

  // 5) 六斑刺鲀 (puffer) 融入剧毒体系
  opt('puffer', '造成 5 伤害，获得 3 层荆棘。若敌人已有剧毒，再施加 2 层剧毒。',
    g => { g.hit(5); g.thr(3); if (g.s.e.poison > 0) g.psn(2); },
    g => g.s.e.poison > 0
  );

  // 6) 球形海猪 (seapig) 融入极寒体系
  opt('seapig', '获得 5 护甲，抽 1 张牌。若敌人处于冻结，再获得 3 护甲。',
    g => { g.block(g.s.e.freeze > 0 ? 8 : 5); g.draw(1); },
    g => g.s.e.freeze > 0
  );

  // 7) 夏威夷短尾乌贼 (bobtail) 融入拟态体系
  opt('bobtail', '获得 6 护甲，抽 1 张牌。若本回合已打出过临时牌，改为获得 9 护甲。',
    g => { g.block(g.s.tempPlayedThisTurn > 0 ? 9 : 6); g.draw(1); },
    g => g.s.tempPlayedThisTurn > 0
  );

  // 8-9) 普通帽贝 (tidepool) & 玉螺 (moonsnail) 融入潮汐体系
  opt('tidepool', '获得 4 护甲。退潮时额外获得 2 护甲。',
    g => g.block(g.s.tide ? 4 : 6),
    g => !g.s.tide
  );
  opt('moonsnail', '造成 7 伤害。涨潮时抽 1 张牌。',
    g => { g.hit(7); if (g.s.tide) g.draw(1); },
    g => g.s.tide
  );

  // 10-11) 吸血鬼乌贼 (vampire2) & 鹦鹉螺 (nautiluscard) 融入墨汁体系
  opt('vampire2', '造成 8 伤害，恢复 5 生命。若敌人有麻痹，额外恢复 3 生命。',
    g => { g.hit(8); g.heal(g.s.e.shock > 0 ? 8 : 5); },
    g => g.s.e.shock > 0
  );
  opt('nautiluscard', '获得 12 护甲，抽 1 张牌。若敌人有麻痹或易伤，再施加 1 层麻痹。',
    g => { g.block(12); g.draw(1); if (g.s.e.shock > 0 || g.s.e.vuln > 0) g.shk(1); },
    g => g.s.e.shock > 0 || g.s.e.vuln > 0
  );

  // 12) 大王酸浆鱿 (zeropoint) 平衡调整
  opt('zeropoint', '本场敌人每次攻击伤害 -30%，并立即施加 4 层冻结；每次冻结减伤时额外对敌人造成 2 伤害。',
    g => { g.s.frozenHalf = true; g.frz(4); g.log('深渊零点降临'); },
    g => !g.s.frozenHalf
  );

  // 13) 夜光游水母 (toxicbloom) 防 1 费无限秒杀
  opt('toxicbloom', '立即结算一次敌方剧毒伤害（不减少层数），每回合限触发一次。',
    g => { if (!g.s.toxicBloomUsed) { g.s.toxicBloomUsed = true; g.hit(g.s.e.poison, true); g.log('毒素爆发！'); } },
    g => g.s.e.poison > 0 && !g.s.toxicBloomUsed
  );

  // 14) 方斑蝴蝶鱼 (symbiowing) 满层成长溢出补偿
  opt('symbiowing', '成长 +2 层，获得 10 护甲。若成长溢出上限，每溢出 1 层改为额外获得 6 护甲并恢复 4 生命。',
    g => {
      const before = g.s.buffs.growth;
      const after = g.buff('growth', 2);
      const overflow = Math.max(0, before + 2 - after);
      g.block(10 + overflow * 6);
      if (overflow > 0) g.heal(overflow * 4);
    },
    g => g.s.buffs.growth >= 4
  );

  // 15) 白鲸 (echo_10) 回声溢出转穿透伤害
  opt('echo_10', '获得 10 护甲，获得 10 层回声。若回声溢出上限，每溢出 1 层改为立即造成 2 点穿透伤害。',
    g => {
      g.block(10);
      const before = g.s.buffs.echo;
      const after = g.buff('echo', 10);
      const overflow = Math.max(0, before + 10 - after);
      if (overflow > 0) g.hit(overflow * 2, true);
    },
    g => g.s.buffs.echo >= 7
  );

  // 16) 盲眼深海蛸 (abysshush) & 翻车鲀 (sunfish)
  opt('abysshush', '敌人本回合不行动，施加 4 层麻痹与 2 层易伤。',
    g => { g.s.skipEnemy = true; g.shk(4); g.vln(2); }
  );
  opt('sunfish', '获得 8 护甲，获得 1 点洋流。若打出后当前洋流 ≥ 3，抽 1 张牌。',
    g => { g.block(8); g.gain(1); if (g.s.energy >= 3) g.draw(1); },
    (g, c) => (c.paid ? g.s.energy : g.s.energy - c.cost) + 1 >= 3
  );

  /* ================= 8. 新增 12 大流派（120 张完整卡牌） ================= */
  const registerArch = (archKey, list) => {
    list.forEach(([name, cost, rar, species, desc, effect, activates, defense], idx) => {
      const id = `${archKey}_${String(idx + 1).padStart(2, '0')}`;
      def(id, name, cost, archKey, rar, null, desc, effect, activates);
      CARDS[id].species = species;
      if (defense) CARDS[id].defense = true;
    });
  };

  // 25. 水压 (pressure)
  registerArch('pressure', [
    ['深海蝰鱼', 1, 'c', 'Chauliodus sloani', '造成 5 伤害，【下潜】1 层。若水深 ≥ 3，额外造成 3 伤害。',
      g => { g.hit(5); g.diveDepth(1); if (g.s.depth >= 3) g.hit(3); }, g => g.s.depth >= 2],
    ['水滴鱼', 1, 'c', 'Psychrolutes marcidus', '获得 6 护甲，【下潜】1 层。若水深 ≥ 3，再获得 3 护甲。',
      g => { g.block(6); g.diveDepth(1); if (g.s.depth >= 3) g.block(3); }, g => g.s.depth >= 2, true],
    ['海鳞虫', 0, 'c', 'Peinaleopolynoe orphanae', '【下潜】1 层，获得 2 护甲。',
      g => { g.diveDepth(1); g.block(2); }, null, true],
    ['深海鼠尾鳕', 1, 'c', 'Coryphaenoides armatus', '造成 6 伤害，每层【水深】额外 +1 伤害。',
      g => g.hit(6 + g.s.depth), g => g.s.depth > 0],
    ['宽咽鱼', 1, 'u', 'Eurypharynx pelecanoides', '【上浮】至多 2 层。每上浮 1 层，抽 1 张牌并获得 4 护甲。',
      g => { const d = g.surfaceDepth(2); if (d > 0) { g.draw(d); g.block(d * 4); } }, g => g.s.depth > 0, true],
    ['深海巨口鱼', 2, 'u', 'Malacosteus niger', '造成 10 伤害，【下潜】2 层。若本回合已下潜过，再施加 2 层易伤。',
      g => { const had = g.s.divedDepthThisTurn; g.hit(10); g.diveDepth(2); if (had) g.vln(2); }, g => g.s.divedDepthThisTurn],
    ['腔棘鱼', 2, 'u', 'Latimeria chalumnae', '获得 10 护甲，每层【水深】额外获得 2 护甲。本回合免疫压迫伤害。',
      g => { g.block(10 + g.s.depth * 2); g.s.ignorePressureThisTurn = true; }, g => g.s.depth > 0, true],
    ['皱鳃鲨', 2, 'r', 'Chlamydoselachus anguineus', '造成 9 伤害，每层【水深】额外 +3 伤害。若水深为 5，改为穿透护甲。',
      g => g.hit(9 + g.s.depth * 3, g.s.depth >= 5), g => g.s.depth >= 5],
    ['深海魔鬼鲨', 1, 'r', 'Mitsukurina owstoni', '【上浮】全部水深。每上浮 1 层，造成 4 伤害并恢复 2 生命。',
      g => { const d = g.surfaceDepth(Infinity); if (d > 0) { g.hit(d * 4); g.heal(d * 2); } }, g => g.s.depth > 0],
    ['马里亚纳狮子鱼', 3, 'l', 'Pseudoliparis swirei', '立即将【水深】拉满至 5 层，获得 12 护甲，造成 15 伤害。本场此后压迫伤害改为对敌人造成 4 伤害。',
      g => { g.diveDepth(5); g.block(12); g.hit(15); g.s.pressureReversed = true; }, g => g.s.depth < 5, true]
  ]);

  // 26. 寄生 (parasite)
  registerArch('parasite', [
    ['缩头鱼虱', 1, 'c', 'Cymothoa exigua', '造成 5 伤害，施加 1 层【寄宿】。',
      g => { g.hit(5); g.addParasite(1); }],
    ['长印鱼', 1, 'c', 'Echeneis naucrates', '获得 6 护甲。敌人每有 1 层【寄宿】，再获得 2 护甲。',
      g => g.block(6 + g.s.e.parasite * 2), g => g.s.e.parasite > 0, true],
    ['海七鳃鳗', 0, 'c', 'Petromyzon marinus', '施加 1 层【寄宿】。若敌人已有寄宿，恢复 2 生命。',
      g => { const had = g.s.e.parasite > 0; g.addParasite(1); if (had) g.heal(2); }, g => g.s.e.parasite > 0],
    ['大西洋盲鳗', 1, 'c', 'Myxine glutinosa', '造成 6 伤害。若敌人有【寄宿】，恢复等同于寄宿层数的生命。',
      g => { g.hit(6); if (g.s.e.parasite > 0) g.heal(g.s.e.parasite); }, g => g.s.e.parasite > 0],
    ['蟹奴', 1, 'u', 'Sacculina carcini', '施加 2 层【寄宿】。敌人当前若有护甲，窃取至多 5 点护甲归己所有。',
      g => { g.addParasite(2); const steal = Math.min(5, g.s.e.block); if (steal > 0) { g.s.e.block -= steal; g.block(steal); } }, g => g.s.e.block > 0],
    ['雪茄达摩鲨', 2, 'u', 'Isistius brasiliensis', '造成 10 伤害，施加 1 层【寄宿】，然后抽 1 张牌。若寄宿达到 5 层，改为抽 2 张。',
      g => { g.hit(10); g.addParasite(1); g.draw(g.s.e.parasite >= 5 ? 2 : 1); }, g => g.s.e.parasite >= 4],
    ['鱼虱', 1, 'u', 'Lepeophtheirus salmonis', '对敌人造成等同于【寄宿】×2 的穿透伤害，并恢复等量一半的生命（向上取整）。',
      g => { const p = g.s.e.parasite; if (p > 0) { g.hit(p * 2, true); g.heal(Math.ceil(p)); } }, g => g.s.e.parasite > 0],
    ['拟寄生海螺', 2, 'r', 'Thyca crystallina', '获得 10 护甲，施加 2 层【寄宿】。本场每当敌人行动后，若其有寄宿，你恢复 2 生命。',
      g => { g.block(10); g.addParasite(2); g.s.parasiteDrain = true; }, g => !g.s.parasiteDrain, true],
    ['珍珠隐鱼', 2, 'r', 'Carapus acus', '【孵化】：消耗敌人全部【寄宿】，每层造成 6 点穿透伤害并获得 2 护甲。',
      g => { const n = g.hatchParasite(); if (n > 0) { g.hit(n * 6, true); g.block(n * 2); } }, g => g.s.e.parasite > 0],
    ['深海寄生鮟鱇', 3, 'l', 'Ceratias holboelli', '施加 3 层【寄宿】，造成 12 伤害。本场此后每次【孵化】后，保留 2 层寄宿不清空，且立刻再抽 2 张牌。',
      g => { g.addParasite(3); g.hit(12); g.s.parasiteKeep = true; }, g => g.s.e.parasite >= 2]
  ]);

  // 27. 反制 (counter)
  registerArch('counter', [
    ['路氏双髻鲨', 1, 'c', 'Sphyrna lewini', '造成 6 伤害。【破招：敌意图攻击】施加【失衡】并额外造成 3 伤害。',
      g => { g.hit(6); if (intentHasAtk(g)) { g.s.e.imbalance = true; g.triggerCounter(); g.hit(3); } }, intentHasAtk],
    ['斑点鹰鳐', 1, 'c', 'Aetobatus narinari', '获得 6 护甲。【破招：敌意图攻击】再获得 4 护甲。',
      g => { const hit = intentHasAtk(g); g.block(hit ? 10 : 6); if (hit) g.triggerCounter(); }, intentHasAtk, true],
    ['拟刺尾鲷', 0, 'c', 'Paracanthurus hepatus', '获得 2 护甲。【破招：敌意图非攻击】改为造成 5 伤害并抽 1 张牌。',
      g => { if (intentNonAtk(g)) { g.triggerCounter(); g.hit(5); g.draw(1); } else g.block(2); }, intentNonAtk, true],
    ['长尾鲨', 1, 'c', 'Alopias vulpinus', '造成 6 伤害。【破招：敌意图非攻击】改为造成 11 伤害。',
      g => { const hit = intentNonAtk(g); if (hit) g.triggerCounter(); g.hit(hit ? 11 : 6); }, intentNonAtk],
    ['尖齿锯鳐', 1, 'u', 'Pristis zijsron', '获得 5 护甲。【破招：敌意图攻击】本回合额外获得 4 层临时荆棘。',
      g => { g.block(5); if (intentHasAtk(g)) { g.triggerCounter(); g.s.tempThorns += 4; } }, intentHasAtk, true],
    ['雪花裸胸鳝', 2, 'u', 'Echidna nebulosa', '造成 10 伤害。若本回合已触发过【破招】，再造成 6 伤害并抽 1 张牌。',
      g => { g.hit(10); if (g.s.counteredThisTurn) { g.hit(6); g.draw(1); } }, g => g.s.counteredThisTurn],
    ['加拉帕戈斯真鲨', 1, 'u', 'Carcharhinus galapagensis', '施加【失衡】，获得 5 护甲。若敌人当前意图伤害 ≥ 12，额外获得 5 护甲。',
      g => { g.s.e.imbalance = true; const heavy = intentAtkVal(g) >= 12; if (heavy) g.triggerCounter(); g.block(heavy ? 10 : 5); },
      g => intentAtkVal(g) >= 12, true],
    ['蓝斑条尾魟', 2, 'r', 'Taeniura lymma', '获得 11 护甲。【破招：敌意图攻击】敌本回合攻击后立即承受等同于其意图攻击值的伤害。',
      g => { g.block(11); if (intentHasAtk(g)) { g.triggerCounter(); g.s.reflectIntentAtk += intentAtkVal(g); } }, intentHasAtk, true],
    ['锯鲨', 2, 'r', 'Pristiophorus cirratus', '造成 11 伤害。【破招：敌意图护甲或治疗】取消其本回合护甲或治疗效果，并额外造成 8 伤害。',
      g => {
        const it = curIntent(g);
        const match = Boolean(it && (it.k === 'blk' || it.k === 'heal' || it.k === 'mix'));
        g.hit(11);
        if (match) { g.triggerCounter(); g.s.cancelEnemyNonAtk = true; g.hit(8); }
      }, g => { const it = curIntent(g); return Boolean(it && (it.k === 'blk' || it.k === 'heal' || it.k === 'mix')); }],
    ['大西洋蓝枪鱼', 3, 'l', 'Makaira nigricans', '造成 16 伤害，施加【失衡】，获得 10 护甲。若敌人本回合意图攻击，使其本次攻击伤害归零，且你下回合 +2 洋流。',
      g => {
        g.hit(16); g.s.e.imbalance = true; g.block(10);
        if (intentHasAtk(g)) { g.triggerCounter(); g.s.negateNextEnemyAtk = true; g.s.nextEnergy += 2; }
      }, intentHasAtk, true]
  ]);

  // 28. 狂潮 (frenzy)
  registerArch('frenzy', [
    ['乌翅真鲨', 0, 'c', 'Carcharhinus melanopterus', '造成 2 伤害，施加 1 层【流血】。',
      g => { g.hit(2); g.addBleed(1); }],
    ['灰三齿鲨', 1, 'c', 'Triaenodon obesus', '连续造成 2 次 3 伤害。',
      g => { g.hit(3); g.hit(3); }, g => g.s.e.bleed > 0],
    ['鲣鱼', 0, 'c', 'Katsuwonus pelamis', '抽 1 张牌。若【连段】≥ 2，再造成 3 伤害。',
      g => { g.draw(1); if (g.s.playedCount >= 2) g.hit(3); }, g => g.s.playedCount >= 2],
    ['红笛鲷', 1, 'c', 'Lutjanus campechanus', '获得 5 护甲。每有 1 层【连段】，再获得 1 护甲（最多额外 5）。',
      g => g.block(5 + Math.min(5, g.s.playedCount)), g => g.s.playedCount > 0, true],
    ['鲯鳅', 1, 'u', 'Coryphaena hippurus', '造成 4 伤害，施加 2 层【流血】。若【连段】≥ 2，抽 1 张牌。',
      g => { g.hit(4); g.addBleed(2); if (g.s.playedCount >= 2) g.draw(1); }, g => g.s.playedCount >= 2],
    ['公牛真鲨', 2, 'u', 'Carcharhinus leucas', '连续造成 3 次 3 伤害。若【连段】≥ 3，改为连续造成 4 次 3 伤害。',
      g => { const times = g.s.playedCount >= 3 ? 4 : 3; for (let i = 0; i < times; i++) g.hit(3); }, g => g.s.playedCount >= 3],
    ['白边真鲨', 1, 'u', 'Carcharhinus albimarginatus', '本回合接下来打出的下 2 张攻击牌，额外追加 1 次 3 伤害。',
      g => { g.s.extraStrikeCharges += 2; }, g => g.s.playedCount > 0],
    ['大眼长尾鲨', 2, 'r', 'Alopias superciliosus', '造成 7 伤害，本回合每有 1 层【连段】再追加 1 次 3 伤害（最多追加 4 次）。',
      g => { g.hit(7); const times = Math.min(4, g.s.playedCount); for (let i = 0; i < times; i++) g.hit(3); }, g => g.s.playedCount >= 2],
    ['黑枪鱼', 2, 'r', 'Istiompax indica', '获得 8 护甲，施加 3 层【流血】。本场每回合你打出第 4 张牌时，自动获得 1 点洋流并抽 1 张牌。',
      g => { g.block(8); g.addBleed(3); g.s.frenzyEngine = true; }, g => g.s.playedCount >= 3, true],
    ['远洋白鳍鲨', 3, 'l', 'Carcharhinus longimanus', '施加 4 层【流血】，然后连续造成 5 次 4 伤害。若本回合【连段】≥ 4，费用减少 1 点。',
      g => { g.addBleed(4); for (let i = 0; i < 5; i++) g.hit(4); }, g => g.s.playedCount >= 4]
  ]);
  CARDS.frenzy_07.isStrikeBuff = true;

  // 29. 演化 (mutate)
  const canEvoAny = (g, c) => handReal(g, c, card => g.getEvo(card.token) < 2).length > 0;
  async function pickAndEvolve(g, c) {
    const ids = handReal(g, c, card => g.getEvo(card.token) < 2);
    const id = await g.pickCard('选择一张手牌进行演化', ids);
    if (id) g.evolveCard(id);
    return Boolean(id);
  }
  registerArch('mutate', [
    ['棘海马', 1, 'c', 'Hippocampus histrix', '获得 5 护甲（1 阶：8 / 2 阶：12）。打出后使自身【演化】+1 阶。',
      (g, c) => { g.block([5, 8, 12][g.getEvo(c.id)]); g.evolveCard(c.id); }, (g, c) => g.getEvo(c.id) < 2, true],
    ['星鲽', 1, 'c', 'Platichthys stellatus', '造成 5 伤害（1 阶：9 / 2 阶：14）。打出后使自身【演化】+1 阶。',
      (g, c) => { g.hit([5, 9, 14][g.getEvo(c.id)]); g.evolveCard(c.id); }, (g, c) => g.getEvo(c.id) < 2],
    ['海鞘', 0, 'c', 'Ciona intestinalis', '选择 1 张手牌原件使其【演化】+1 阶（非演化流牌基础攻防永久 +3）。',
      (g, c) => pickAndEvolve(g, c), canEvoAny],
    ['刺参', 1, 'c', 'Apostichopus japonicus', '获得 6 护甲。若本牌已【演化】，再恢复 3 生命。',
      (g, c) => { g.block(6); if (g.getEvo(c.id) > 0) g.heal(3); }, (g, c) => g.getEvo(c.id) > 0, true],
    ['太阳海星', 1, 'u', 'Solaster endeca', '造成 6 伤害，选择 1 张手牌使其【演化】+1 阶。',
      async (g, c) => { g.hit(6); await pickAndEvolve(g, c); }, canEvoAny],
    ['脑珊瑚', 2, 'u', 'Diploria labyrinthiformis', '获得 10 护甲。牌库中每有 1 张已【演化】的牌，额外获得 2 护甲（最多额外 10）。',
      g => g.block(10 + Math.min(10, g.evolvedCount() * 2)), g => g.evolvedCount() > 0, true],
    ['蝉虾', 1, 'u', 'Scyllarides latus', '抽 2 张牌。若抽到的牌中有已【演化】的牌，获得 1 点洋流。',
      g => {
        const before = g.s.hand.length;
        g.draw(2);
        const added = g.s.hand.slice(before);
        if (added.some(id => g.getEvo(id) > 0)) g.gain(1);
      }, g => g.evolvedCount() > 0],
    ['长棘海胆', 2, 'r', 'Diadema setosum', '造成 9 伤害，获得 6 护甲（1 阶：14/9；2 阶：20/12）。手牌中其他牌演化时，本牌同步【演化】+1 阶。',
      (g, c) => { const lvl = g.getEvo(c.id); g.hit([9, 14, 20][lvl]); g.block([6, 9, 12][lvl]); }, (g, c) => g.getEvo(c.id) > 0, true],
    ['苏眉鱼', 2, 'r', 'Cheilinus undulatus', '造成 11 伤害。本场每触发过 1 次【演化】，额外造成 2 伤害（最多额外 14）。',
      g => g.hit(11 + Math.min(14, g.s.evoTriggers * 2)), g => g.s.evoTriggers > 0],
    ['灯塔水母', 3, 'l', 'Turritopsis dohrnii', '使当前全部手牌【演化】+1 阶，恢复 6 生命。本牌打出后置回抽牌堆顶且本场费用永久 -1（最低为 1）。',
      (g, c) => {
        for (const id of [...g.s.hand]) if (real(id)) g.evolveCard(id);
        g.heal(6);
        const curCost = g.s.costOverrides.has(c.id) ? g.s.costOverrides.get(c.id) : 3;
        g.s.costOverrides.set(c.id, Math.max(1, curCost - 1));
        g.s.sealed.add(c.id); // 阻止进入弃牌堆，改为置顶
        g.s.drawPile.push(c.id);
        setTimeout(() => g.s.sealed.delete(c.id), 0);
      }, canEvoAny]
  ]);

  // 30. 构礁 (bastion)
  registerArch('bastion', [
    ['滨珊瑚', 1, 'c', 'Porites lutea', '获得 4 护甲，建造或加固 1 层【护壁礁】（回合初提供层数×2 护甲）。',
      g => { g.block(4); g.buildReef('wall', 1); }, null, true],
    ['圣诞树管虫', 1, 'c', 'Spirobranchus giganteus', '造成 4 伤害，建造或加固 1 层【刺珊瑚礁】（回合初造成层数×2 伤害）。',
      g => { g.hit(4); g.buildReef('spike', 1); }],
    ['珊瑚藻', 0, 'c', 'Corallina officinalis', '选择 1 座现有【礁体】使其层数 +1；若当前没有礁体，改为获得 3 护甲。',
      async g => {
        if (!g.s.reefs.length) { g.block(3); return; }
        const picked = await g.pickOption('选择要加固的礁体', g.s.reefs, r => `${r.label}（当前 ${r.stacks} 层）`);
        if (picked) picked.stacks = Math.min(5, picked.stacks + 1);
      }, g => g.s.reefs.length > 0, true],
    ['蓝魔雀鲷', 1, 'c', 'Chrysiptera cyanea', '造成 6 伤害。你每拥有 1 座【礁体】，额外造成 2 伤害。',
      g => g.hit(6 + g.s.reefs.length * 2), g => g.s.reefs.length > 0],
    ['管海绵', 1, 'u', 'Aplysina archeri', '获得 4 护甲，建造或加固 1 层【生机礁】（回合初恢复层数点生命，3 层时额外抽 1 牌）。',
      g => { g.block(4); g.buildReef('life', 1); }, null, true],
    ['鳞砗磲', 2, 'u', 'Tridacna squamosa', '获得 9 护甲，使你所有【礁体】层数 +1。',
      g => { g.block(9); for (const r of g.s.reefs) r.stacks = Math.min(5, r.stacks + 1); }, g => g.s.reefs.length > 0, true],
    ['地毯海葵', 1, 'u', 'Stichodactyla gigantea', '立即触发一次所有【礁体】的回合初效果（不消耗礁体）。',
      g => g.triggerReefs(), g => g.s.reefs.length > 0],
    ['隆头鹦嘴鱼', 2, 'r', 'Bolbometopon muricatum', '【崩礁】：摧毁全部【礁体】，每有 1 层总礁体层数造成 4 点伤害并获得 2 护甲。',
      g => { const n = g.totalReefStacks(); g.s.reefs = []; if (n > 0) { g.hit(n * 4); g.block(n * 2); } }, g => g.totalReefStacks() > 0],
    ['羽状海百合', 2, 'r', 'Oxycomanthus bennetti', '抽 2 张牌，获得 8 护甲。若你同时拥有 3 座【礁体】，本回合获得 2 点洋流。',
      g => { g.draw(2); g.block(8); if (g.s.reefs.length >= 3) g.gain(2); }, g => g.s.reefs.length >= 3, true],
    ['桌形轴孔珊瑚', 3, 'l', 'Acropora hyacinthus', '建造或加固全部 3 种【礁体】各 2 层，并立即触发一次全部礁体效果。',
      g => { g.buildReef('wall', 2); g.buildReef('spike', 2); g.buildReef('life', 2); g.triggerReefs(); }, null, true]
  ]);

  // 31. 涡流 (vortex)
  registerArch('vortex', [
    ['大西洋鲱', 1, 'c', 'Clupea harengus', '造成 6 伤害，【搅流】：将抽牌堆顶 2 张牌直接置入弃牌堆。',
      g => { g.hit(6); g.millDraw(2); }, g => g.s.drawPile.length > 0],
    ['尖翅燕鱼', 1, 'c', 'Platax teira', '获得 6 护甲。若本回合已发生过洗牌，再获得 5 护甲。',
      g => g.block(g.s.shufflesThisTurn > 0 ? 11 : 6), g => g.s.shufflesThisTurn > 0, true],
    ['牛鼻鲼', 0, 'c', 'Rhinoptera bonasus', '【搅流】：将弃牌堆洗入抽牌堆，然后抽 1 张牌。',
      g => { g.shuffleDiscardIn(); g.draw(1); }, g => g.s.discard.length > 0],
    ['丽龟', 1, 'c', 'Lepidochelys olivacea', '造成 5 伤害。弃牌堆每有 3 张牌，额外造成 2 伤害（最多额外 8）。',
      g => g.hit(5 + Math.min(8, Math.floor(g.s.discard.length / 3) * 2)), g => g.s.discard.length >= 3],
    ['狮鬃水母', 1, 'u', 'Cyanea capillata', '抽 2 张牌，【搅流】：将抽牌堆顶 3 张牌置入弃牌堆。',
      g => { g.draw(2); g.millDraw(3); }],
    ['中华白海豚', 1, 'u', 'Sousa chinensis', '造成 7 伤害。若本回合已发生过洗牌，抽 1 张牌并获得 1 点洋流。',
      g => { g.hit(7); if (g.s.shufflesThisTurn > 0) { g.draw(1); g.gain(1); } }, g => g.s.shufflesThisTurn > 0],
    ['瓜头鲸', 2, 'u', 'Peponocephala electra', '获得 10 护甲，【搅流】：将弃牌堆洗入抽牌堆；每洗回 4 张牌，额外获得 3 护甲。',
      g => { const n = g.shuffleDiscardIn(); g.block(10 + Math.floor(n / 4) * 3); }, g => g.s.discard.length >= 4, true],
    ['大西洋斑点海豚', 2, 'r', 'Stenella frontalis', '获得 8 护甲。本场每当你发生洗牌时，自动对敌人造成 6 点伤害并获得 4 护甲。',
      g => { g.block(8); g.s.vortexEngine = true; }, g => !g.s.vortexEngine, true],
    ['长须鲸', 2, 'r', 'Balaenoptera physalus', '造成 11 伤害。本场每发生过 1 次洗牌，额外造成 4 伤害（最多额外 20）。',
      g => g.hit(11 + Math.min(20, g.s.shufflesThisBattle * 4)), g => g.s.shufflesThisBattle > 0],
    ['弓头鲸', 3, 'l', 'Balaena mysticetus', '将弃牌堆与手牌中其他牌全部洗入抽牌堆，抽 5 张牌，并造成等同于洗回牌数×2 的伤害。',
      g => {
        let moved = g.s.discard.length;
        const moving = g.s.discard.splice(0);
        while (g.s.hand.length) {
          const id = g.s.hand.pop();
          if (!CARDS[id].temporary) { moving.push(id); moved++; }
        }
        g.s.drawPile = shuffle(g.s.drawPile.concat(moving));
        g.s.omenKnownTop = null;
        if (moved > 0) g.onShuffle();
        g.draw(5);
        if (moved > 0) g.hit(moved * 2);
      }, g => g.s.discard.length + g.s.hand.length > 1]
  ]);

  // 32. 拾遗 (salvage)
  registerArch('salvage', [
    ['鹅颈藤壶', 1, 'c', 'Pollicipes pollicipes', '造成 5 伤害，将 1 张锋利贝片（0 费打 4）【残骸】加入手牌。',
      g => { g.hit(5); g.addSalvage('_salvage_blade'); }, g => g.s.hand.length < 10],
    ['粒皮箱鲀', 1, 'c', 'Ostracion cubicus', '获得 5 护甲，将 1 张沉船铁板（0 费 4 甲）【残骸】加入手牌。',
      g => { g.block(5); g.addSalvage('_salvage_plate'); }, g => g.s.hand.length < 10, true],
    ['白棘三列海胆', 0, 'c', 'Tripneustes gratilla', '随机将 1 张【残骸】加入手牌。',
      g => g.addSalvage(), g => g.s.hand.length < 10],
    ['玉足海参', 1, 'c', 'Holothuria leucospilota', '获得 6 护甲。本回合每打出过 1 张临时或【残骸】牌，再获得 2 护甲（最多额外 6）。',
      g => g.block(6 + Math.min(6, g.s.tempPlayedThisTurn * 2)), g => g.s.tempPlayedThisTurn > 0, true],
    ['装饰蜘蛛蟹', 1, 'u', 'Camposcia retusa', '将 1 张锋利贝片和 1 张沉船铁板【残骸】加入手牌。',
      g => { g.addSalvage('_salvage_blade'); g.addSalvage('_salvage_plate'); }, g => g.s.hand.length < 10],
    ['海葵寄居蟹', 1, 'u', 'Dardanus pedunculatus', '造成 6 伤害，将 1 张腐朽锚链（0 费施加 2 易伤）【残骸】加入手牌。',
      g => { g.hit(6); g.addSalvage('_salvage_chain'); }, g => g.s.hand.length < 10],
    ['蹲龙虾', 2, 'u', 'Munida rugosa', '获得 8 护甲，将 1 张深海油脂（0 费 +1 洋流）和 1 张随机【残骸】加入手牌。',
      g => { g.block(8); g.addSalvage('_salvage_oil'); g.addSalvage(); }, g => g.s.hand.length < 10, true],
    ['大西洋长臂章鱼', 2, 'r', 'Macrotritopus defilippi', '将 2 张随机【残骸】加入手牌。本场每当你打出临时或【残骸】牌时，对敌人造成 2 点穿透伤害。',
      g => { g.addSalvage(); g.addSalvage(); g.s.salvageForge = true; }, g => !g.s.salvageForge],
    ['鲸落食骨蠕虫', 2, 'r', 'Osedax rubiplumus', '销毁手牌中全部【残骸】与临时牌。造成 10 伤害，每销毁 1 张额外造成 7 伤害并抽 1 张牌（最多抽 3）。',
      g => {
        let destroyed = 0;
        g.s.hand = g.s.hand.filter(id => {
          if (CARDS[id].temporary) { destroyed++; return false; }
          return true;
        });
        g.hit(10 + destroyed * 7);
        if (destroyed > 0) g.draw(Math.min(3, destroyed));
      }, g => g.s.hand.some(id => CARDS[id].temporary)],
    ['巨型蜘蛛蟹', 3, 'l', 'Macrocheira kaempferi', '造成 14 伤害，获得 10 护甲，将 4 种【残骸】各 1 张加入手牌。',
      g => { g.hit(14); g.block(10); for (const [id] of SALVAGE_DEFS) g.addSalvage(id); }, g => g.s.hand.length < 10, true]
  ]);

  // 33. 磁感 (magnet)
  const prevEven = g => g.s.lastCost !== null && g.s.lastCost % 2 === 0;
  const prevOdd  = g => g.s.lastCost !== null && g.s.lastCost % 2 === 1;
  const higherThanPrev = (g, c) => g.s.lastCost !== null && c.cost > g.s.lastCost;
  registerArch('magnet', [
    ['赤蠵龟', 1, 'c', 'Caretta caretta', '获得 6 护甲。【磁极：上一张为偶费】再获得 4 护甲。',
      g => g.block(prevEven(g) ? 10 : 6), prevEven, true],
    ['平背海龟', 0, 'c', 'Natator depressus', '造成 3 伤害。【磁极：上一张为奇费】再造成 3 伤害。',
      g => g.hit(prevOdd(g) ? 6 : 3), prevOdd],
    ['北极红点鲑', 1, 'c', 'Salvelinus alpinus', '造成 6 伤害。【磁极：费用高于上一张】再造成 4 伤害。',
      (g, c) => g.hit(higherThanPrev(g, c) ? 10 : 6), higherThanPrev],
    ['黑背信天翁', 0, 'c', 'Phoebastria immutabilis', '获得 2 护甲，抽 1 张牌。若上一张牌为奇费，再获得 2 护甲。',
      g => { g.block(prevOdd(g) ? 4 : 2); g.draw(1); }, prevOdd, true],
    ['太平洋蓝鳍金枪鱼', 2, 'u', 'Thunnus orientalis', '造成 11 伤害。【磁极：费用高于上一张】再造成 6 伤害并抽 1 张牌。',
      (g, c) => { const ok = higherThanPrev(g, c); g.hit(ok ? 17 : 11); if (ok) g.draw(1); }, higherThanPrev],
    ['平滑双髻鲨', 1, 'u', 'Sphyrna zygaena', '选择 1 张手牌，使其本回合费用 -1（最低 0）或 +1，然后获得 5 护甲。',
      async (g, c) => {
        const id = await g.pickCard('选择要调整费用的手牌', g.s.hand.filter(x => x !== c.id));
        if (id) {
          const cur = g.handCardState(CARDS[id], id).cost;
          const delta = await g.pickOption('选择费用变化', [-1, 1], d => d < 0 ? `费用 -1（变为 ${Math.max(0, cur - 1)}）` : `费用 +1（变为 ${cur + 1}）`);
          if (delta) g.s.turnCostOverrides.set(id, Math.max(0, cur + delta));
        }
        g.block(5);
      }, (g, c) => g.s.hand.length > (c.paid ? 0 : 1), true],
    ['大青鲨', 2, 'u', 'Prionace glauca', '获得 11 护甲。【磁极：上一张为奇费】本回合下一次攻击伤害 +6。',
      g => { g.block(11); if (prevOdd(g)) g.s.nextAtkBonus += 6; }, prevOdd, true],
    ['帝企鹅', 1, 'r', 'Aptenodytes forsteri', '获得 6 护甲。本场每当你触发奇偶【磁极】交替时，自动造成 4 点穿透伤害并获得 2 护甲。',
      g => { g.block(6); g.s.magnetCoil = true; }, g => !g.s.magnetCoil, true],
    ['灰鲸', 2, 'r', 'Eschrichtius robustus', '造成 10 伤害。本回合每触发过 1 次【磁极】共振，额外造成 5 伤害（最多额外 20）。',
      g => g.hit(10 + Math.min(20, g.s.magnetTriggersThisTurn * 5)), g => g.s.magnetTriggersThisTurn > 0],
    ['姥鲨', 3, 'l', 'Cetorhinus maximus', '造成 18 伤害，获得 12 护甲。【磁极：费用高于上一张】改为造成 26 伤害，并使手牌中非 0 费牌本回合费用变为 1。',
      (g, c) => {
        const ok = higherThanPrev(g, c);
        g.hit(ok ? 26 : 18); g.block(12);
        if (ok) {
          for (const id of g.s.hand) {
            if (g.handCardState(CARDS[id], id).cost > 0) g.s.turnCostOverrides.set(id, 1);
          }
        }
      }, higherThanPrev, true]
  ]);

  // 34. 掠金 (bounty)
  registerArch('bounty', [
    ['货贝', 0, 'c', 'Monetaria moneta', '获得 2 护甲，立即获得 4 金币（【悬赏】单场产金上限 35）。',
      g => { g.block(2); g.earnBountyGold(4); }, g => g.s.bountyGoldEarned < 35, true],
    ['招潮蟹', 1, 'c', 'Uca pugnax', '造成 6 伤害。若本牌击败敌人，额外获得 15 金币。',
      g => { g.hit(6); if (g.s.e.hp <= 0) g.earnBountyGold(15, true); }, g => g.previewDamage(6) >= g.s.e.hp],
    ['合浦珠母贝', 1, 'c', 'Pinctada fucata', '获得 6 护甲。每持有 30 金币，再获得 1 护甲（最多额外 6）。',
      g => g.block(6 + Math.min(6, Math.floor(g.s.gold / 30))), g => g.s.gold >= 30, true],
    ['黄金蝶鱼', 1, 'c', 'Chaetodon semilarvatus', '造成 6 伤害。可支付 6 金币，改为造成 11 伤害。',
      async g => { const paid = await g.spendBountyGold(6, '支付 6 金币，改为造成 11 伤害？'); g.hit(paid ? 11 : 6); }, g => g.s.gold >= 6],
    ['金鳞鱼', 1, 'u', 'Sargocentron spiniferum', '获得 5 护甲，抽 1 张牌。可支付 8 金币，再抽 2 张牌并获得 1 点洋流。',
      async g => {
        g.block(5); g.draw(1);
        if (await g.spendBountyGold(8, '支付 8 金币，再抽 2 张牌并 +1 洋流？')) { g.draw(2); g.gain(1); }
      }, g => g.s.gold >= 8, true],
    ['黄金水母', 2, 'u', 'Mastigias papua', '获得 10 护甲，获得 8 金币。若当前金币 ≥ 100，再获得 5 护甲。',
      g => { g.earnBountyGold(8); g.block(g.s.gold >= 100 ? 15 : 10); }, g => g.s.gold >= 100, true],
    ['黄金拟花鮨', 1, 'u', 'Pseudanthias squamipinnis', '造成 5 伤害。每持有 25 金币，额外造成 2 伤害（最多额外 10）。',
      g => g.hit(5 + Math.min(10, Math.floor(g.s.gold / 25) * 2)), g => g.s.gold >= 25],
    ['红宝石海龙', 2, 'r', 'Phyllopteryx dewysea', '获得 10 护甲。可支付 12 金币，立即恢复 10 生命并清除自身全部剧毒。',
      async g => {
        g.block(10);
        if (await g.spendBountyGold(12, '支付 12 金币，恢复 10 生命并清除全部剧毒？')) { g.heal(10); g.s.p.poison = 0; }
      }, g => g.s.gold >= 12, true],
    ['黑斑狗头鲀', 2, 'r', 'Arothron nigropunctatus', '造成 12 伤害。可支付 15 金币，改为造成 24 点穿透伤害。',
      async g => {
        const paid = await g.spendBountyGold(15, '支付 15 金币，改为造成 24 点穿透伤害？');
        g.hit(paid ? 24 : 12, paid);
      }, g => g.s.gold >= 15],
    ['丽色军舰鸟', 3, 'l', 'Fregata magnificens', '造成 16 伤害并获得 15 金币。本场此后每次消费金币时，造成等同于消费金币数的伤害并获得一半护甲。',
      g => { g.hit(16); g.earnBountyGold(15); g.s.bountyCannon = true; }, g => !g.s.bountyCannon]
  ]);

  // 35. 酸蚀 (corrode)
  registerArch('corrode', [
    ['钻孔骨螺', 1, 'c', 'Murex pecten', '造成 5 伤害，施加 1 层【腐蚀】。',
      g => { g.hit(5); g.addCorrode(1); }],
    ['玻璃海鞘', 1, 'c', 'Ascidiella aspersa', '获得 6 护甲，施加 1 层【腐蚀】。',
      g => { g.block(6); g.addCorrode(1); }, null, true],
    ['侧鳃海蛞蝓', 0, 'c', 'Berthellina citrina', '施加 1 层【腐蚀】。若敌人已有腐蚀，造成 3 点穿透伤害。',
      g => { const had = g.s.e.corrode > 0; g.addCorrode(1); if (had) g.hit(3, true); }, g => g.s.e.corrode > 0],
    ['绿海葵', 1, 'c', 'Anthopleura xanthogrammica', '造成 6 伤害。敌人每有 1 层【腐蚀】，再造成 1 点穿透伤害。',
      g => { g.hit(6); if (g.s.e.corrode > 0) g.hit(g.s.e.corrode, true); }, g => g.s.e.corrode > 0],
    ['加州海兔', 1, 'u', 'Aplysia californica', '获得 5 护甲，抽 1 张牌。若敌人【腐蚀】≥ 3 层，再获得 4 护甲。',
      g => { g.block(g.s.e.corrode >= 3 ? 9 : 5); g.draw(1); }, g => g.s.e.corrode >= 3, true],
    ['鬼鲉', 2, 'u', 'Inimicus japonicus', '造成 9 伤害，施加 2 层【腐蚀】。若敌人当前有护甲，先使敌方护甲减半。',
      g => { if (g.s.e.block > 0) g.s.e.block = Math.floor(g.s.e.block / 2); g.hit(9); g.addCorrode(2); }, g => g.s.e.block > 0],
    ['棘冠海星', 1, 'u', 'Acanthaster planci', '施加 2 层【腐蚀】。若敌人处于满腐蚀（8 层），改为造成 12 点穿透伤害。',
      g => { if (g.s.e.corrode >= 8) g.hit(12, true); else g.addCorrode(2); }, g => g.s.e.corrode >= 8],
    ['火海胆', 2, 'r', 'Asthenosoma varium', '获得 10 护甲，施加 2 层【腐蚀】。本场敌人叠甲或回血时，先承受【腐蚀】×2 伤害。',
      g => { g.block(10); g.addCorrode(2); g.s.acidTrap = true; }, g => !g.s.acidTrap, true],
    ['冷泉深海贻贝', 2, 'r', 'Gigantidas platifrons', '造成 10 点穿透伤害，敌人每有 1 层【腐蚀】额外 +2 伤害。若腐蚀 ≥ 5，再获得 8 护甲。',
      g => { g.hit(10 + g.s.e.corrode * 2, true); if (g.s.e.corrode >= 5) g.block(8); }, g => g.s.e.corrode >= 5, true],
    ['大鳍后乌贼', 3, 'l', 'Magnapinna pacifica', '施加 3 层【腐蚀】，立即造成【腐蚀】×4 穿透伤害；此后本场敌人受到所有伤害额外 +2 点。',
      g => { g.addCorrode(3); g.hit(g.s.e.corrode * 4, true); g.s.corrodeAmp = true; }, g => g.s.e.corrode > 0]
  ]);

  // 36. 占星 (omen)
  const isAtkCard = card => /伤害/.test(card.d);
  const knownTopMatch = pred => g => {
    const tid = topCardId(g);
    return Boolean(tid && g.s.omenKnownTop === tid && pred(CARDS[tid]));
  };
  registerArch('omen', [
    ['日晷螺', 1, 'c', 'Architectonica perspectiva', '造成 6 伤害。【预言：牌顶费用 ≥ 1】命中时额外造成 5 伤害。',
      async g => { g.hit(6); const res = await g.revealOmen(c => c.c >= 1); if (res.hit) g.hit(5); }, knownTopMatch(c => c.c >= 1)],
    ['蓝指海星', 1, 'c', 'Linckia laevigata', '获得 6 护甲。【预言：牌顶为防御或技能牌】命中时再获得 5 护甲。',
      async g => { g.block(6); const res = await g.revealOmen(c => c.defense || !isAtkCard(c)); if (res.hit) g.block(5); },
      knownTopMatch(c => c.defense || !isAtkCard(c)), true],
    ['海天使', 0, 'c', 'Clione limacina', '查看抽牌堆顶 2 张牌，可任选 1 张置入弃牌堆，另一张留在牌顶（已知）。',
      async g => {
        const top2 = g.s.drawPile.slice(-2).reverse();
        if (!top2.length) return;
        const drop = await g.pickCard('海天使：可选择丢弃 1 张，其余留顶', top2, false, '全部保留');
        if (drop) {
          g.s.drawPile.splice(g.s.drawPile.lastIndexOf(drop), 1);
          g.s.discard.push(drop);
        }
        g.s.omenKnownTop = topCardId(g);
      }, g => g.s.drawPile.length > 0],
    ['星点东方鲀', 1, 'c', 'Takifugu niphobles', '造成 5 伤害，抽 1 张牌。若本回合此前已命中过【预言】，再造成 4 伤害。',
      g => { g.hit(5); g.draw(1); if (g.s.omenHitThisTurn) g.hit(4); }, g => g.s.omenHitThisTurn],
    ['月光蝶鱼', 1, 'u', 'Chaetodon ephippium', '获得 5 护甲。【预言：自选押注牌顶为 1 费或偶费】命中时抽 2 张牌并获得 1 点洋流。',
      async g => {
        g.block(5);
        if (!topCardId(g)) return;
        const bet = await g.pickOption('月光蝶鱼：押注牌顶费用', ['one', 'even'], v => v === 'one' ? '押注：牌顶为 1 费' : '押注：牌顶为偶费（0/2）', true);
        const res = await g.revealOmen(c => bet === 'one' ? c.c === 1 : c.c % 2 === 0);
        if (res.hit) { g.draw(2); g.gain(1); }
      }, g => g.s.drawPile.length > 0, true],
    ['星斑川鲽', 2, 'u', 'Platichthys flesus', '造成 10 伤害。【预言：牌顶为攻击牌】命中时改为造成 18 伤害；未命中时获得 6 护甲。',
      async g => {
        const res = await g.revealOmen(isAtkCard);
        if (res.hit) g.hit(18);
        else { g.hit(10); g.block(6); }
      }, knownTopMatch(isAtkCard)],
    ['紫纹海刺水母', 1, 'u', 'Chrysaora colorata', '获得 7 护甲。若本回合已命中过【预言】，改为获得 11 护甲并施加 2 层易伤。',
      g => { if (g.s.omenHitThisTurn) { g.block(11); g.vln(2); } else g.block(7); }, g => g.s.omenHitThisTurn, true],
    ['月亮鱼', 2, 'r', 'Lampris guttatus', '揭示牌顶并将其加入手牌（本回合费用变为 0）；若其原基础费用 ≥ 2，额外造成 10 伤害。',
      async g => {
        const res = await g.revealOmen(c => c.c >= 2);
        if (res.tid && g.s.hand.length < 10) {
          g.s.drawPile.pop();
          g.s.omenKnownTop = null;
          g.s.hand.push(res.tid);
          g.s.turnCostOverrides.set(res.tid, 0);
          if (res.hit) g.hit(10);
        }
      }, g => g.s.drawPile.length > 0],
    ['细长海百合', 2, 'r', 'Comanthus parvicirrus', '获得 8 护甲。本场你每次命中【预言】时，自动抽 1 张牌并造成 4 点伤害（每回合至多 2 次）。',
      g => { g.block(8); g.s.omenStar = true; }, g => !g.s.omenStar, true],
    ['皇带鱼', 3, 'l', 'Regalecus glesne', '依次揭示牌顶至多 3 张牌：1–2 费造成 10 伤，0 费抽 1 牌并 +1 洋流，3 费直接免费打出！',
      async g => {
        const revealed = g.s.drawPile.slice(-3).reverse();
        if (!revealed.length) return;
        for (const tid of revealed) {
          if (g.s.e.hp <= 0) break;
          const c = CARDS[tid];
          g.s.omenKnownTop = tid;
          g.s.omenHitThisTurn = true;
          if (c.c === 0) { g.draw(1); g.gain(1); }
          else if (c.c === 1 || c.c === 2) { g.hit(10); }
          else if (c.c >= 3) {
            const idx = g.s.drawPile.lastIndexOf(tid);
            if (idx >= 0) g.s.drawPile.splice(idx, 1);
            await c.f(g, { id: tid, card: c, cost: 0, paid: true, ate: false, hidden: false, attack: false, defense: false });
            if (!c.temporary && !g.s.sealed.has(tid)) g.s.discard.push(tid);
          }
        }
      }, g => g.s.drawPile.length > 0]
  ]);

  /* ================= 9. UI 状态栏、演化角标与 360 图鉴适配 ================= */
  const _battle = UI.battle.bind(UI);
  UI.battle = function () {
    _battle();
    const s = Game.s, e = s.e;
    const pBox = document.getElementById('p-status');
    const eBox = document.getElementById('e-status');
    const pExtra = [];
    if (s.depth > 0) pExtra.push(`<span class="st buff">🌊 水深 ${s.depth}</span>`);
    for (const r of s.reefs) pExtra.push(`<span class="st buff">🪸 ${r.label} ${r.stacks}</span>`);
    if (s.playedCount > 0) pExtra.push(`<span class="st buff">🔥 连段 ${s.playedCount}</span>`);
    if (s.lastCost !== null) pExtra.push(`<span class="st buff">🧲 ${s.lastCost % 2 === 0 ? '偶极' : '奇极'}(${s.lastCost})</span>`);
    if (pExtra.length) pBox.innerHTML += pExtra.join('');

    const eExtra = [];
    if (e.parasite > 0) eExtra.push(`<span class="st thr">🪱 寄宿 ${e.parasite}</span>`);
    if (e.imbalance) eExtra.push(`<span class="st vln">⚖ 失衡</span>`);
    if (e.bleed > 0) eExtra.push(`<span class="st vln">🩸 流血 ${e.bleed}</span>`);
    if (e.corrode > 0) eExtra.push(`<span class="st psn">🧪 腐蚀 ${e.corrode}</span>`);
    if (eExtra.length) eBox.innerHTML += eExtra.join('');

    // 手牌演化角标标注
    const handEls = document.querySelectorAll('#hand .card');
    s.hand.forEach((id, i) => {
      const el = handEls[i];
      if (!el) return;
      const lvl = Game.getEvo(id);
      if (lvl > 0) {
        const nm = el.querySelector('.nm');
        if (nm && !nm.textContent.includes('+')) nm.textContent += ` +${lvl}`;
      }
    });
  };

  // 图鉴排除不可收集衍生牌与临时 token
  const collectibleIds = () => Object.keys(CARDS).filter(id => !id.startsWith('~') && !CARDS[id].nonCollectible);
  UI.openCodex = function () {
    if (Game.uiChoice) return;
    this._cxArch = 'all'; this._cxRar = 'all';
    const n = collectibleIds().length;
    this.sheet(`
      <h2>📖 卡牌图鉴 <span style="font-size:12.5px;color:#8fbfae;font-weight:600">共 ${n} 张</span></h2>
      <p class="lead">鼠标移到卡牌上可查看关键词说明</p>
      <div class="filters" id="cx-arch"></div>
      <div class="filters" id="cx-rar"></div>
      <div class="picks" id="cx-list"></div>
      <button class="btn ghost" onclick="UI.closeSheet()">关闭</button>`);
    this._renderCodex();
  };
  UI._renderCodex = function () {
    const aBox = document.getElementById('cx-arch');
    const rBox = document.getElementById('cx-rar');
    const archs = [['all', '全部流派']].concat(Object.keys(ARCH).map(k => [k, ARCH[k].n]));
    const rars = [['all', '全部稀有度'], ['c', '普通'], ['u', '精良'], ['r', '稀有'], ['l', '传说']];
    aBox.innerHTML = archs.map(([k, n]) => `<div class="chip ${this._cxArch === k ? 'on' : ''}" data-a="${k}">${n}</div>`).join('');
    rBox.innerHTML = rars.map(([k, n]) => `<div class="chip ${this._cxRar === k ? 'on' : ''}" data-r="${k}">${n}</div>`).join('');
    aBox.querySelectorAll('.chip').forEach(el => el.onclick = () => { this._cxArch = el.dataset.a; this._renderCodex(); });
    rBox.querySelectorAll('.chip').forEach(el => el.onclick = () => { this._cxRar = el.dataset.r; this._renderCodex(); });
    const list = document.getElementById('cx-list');
    list.innerHTML = '';
    collectibleIds().filter(id => {
      const c = CARDS[id];
      return (this._cxArch === 'all' || c.a === this._cxArch) && (this._cxRar === 'all' || c.r === this._cxRar);
    }).forEach(id => list.appendChild(this.cardEl(id, { fixed: true })));
  };
})();
