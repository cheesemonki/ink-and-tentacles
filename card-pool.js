'use strict';

const CardPool = (() => {
  const real=id=>!CARDS[id].temporary;
  const hand=(g,ctx,filter=()=>true)=>g.s.hand.filter(id=>id!==ctx?.id&&real(id)&&filter(CARDS[id]));
  const remove=(pile,id)=>pile.splice(pile.indexOf(id),1)[0];
  const armored=g=>g.s.e.block>0;
  const below=(g,n)=>g.s.hp*100<=g.s.maxHp*n;
  const peril=g=>below(g,50);
  const full=g=>g.s.e.hp*2>g.s.e.maxHp;
  const harvest=g=>g.s.e.hp*2<=g.s.e.maxHp;
  const shielded=g=>g.s.defended;
  const attacked=g=>g.s.attacked;
  const flanked=g=>attacked(g)&&shielded(g);
  const few=(g,c)=>countHand(g,c)<=1;
  const empty=(g,c)=>countHand(g,c)===0;
  const one=(g,c)=>countHand(g,c)===1;
  const countHand=(g,c)=>g.s.hand.length-Number(g.s.hand.includes(c.id));
  const echo=g=>g.s.buffs.echo>0;
  const top=g=>g.s.drawPile.at(-1);
  const planned=g=>g.s.planned;
  const reserve=(g,c)=>g.s.hidden.has(c.id)||Boolean(c.hidden);
  const stocked=(g,c)=>hand(g,c).length>0;
  const vented=g=>g.s.vented;
  const dived=g=>g.s.dived;
  const pendingVent=g=>g.s.delayed.filter(item=>item.kind==='vent').sort((a,b)=>a.turn-b.turn)[0];
  const canRetime=g=>pendingVent(g)?.turn>g.s.turnNo+1;
  const canDive=(g,c)=>(c.paid?g.s.energy:g.s.energy-c.cost)>=1;
  const canSeal=(g,c)=>g.s.deck.length-g.s.sealed.size>1&&stocked(g,c);
  const selfSeal=(g,c)=>real(c.id)&&g.s.deck.length-g.s.sealed.size>1;
  const retainHigh=(g,c)=>hand(g,c,card=>card.c>=2).length>0;
  const discountable=(g,card)=>g.s.hidden.has(card.token)&&(g.s.discounts.get(card.token)||0)<card.c;
  const retainDiscount=(g,c)=>hand(g,c,card=>discountable(g,card)).length>0;
  const afterDefense=g=>g.s.usedHidden;
  const leaky=g=>g.s.paidLife;
  const pain=n=>g=>g.s.hp>n;
  const cross=(g,c,damage)=>!harvest(g)&&g.previewDamage(damage)>=g.s.e.hp-Math.floor(g.s.e.maxHp/2)&&g.previewDamage(damage)<g.s.e.hp;
  const hasEchoFour=g=>g.s.buffs.echo>=3;
  const highTop=g=>Boolean(top(g)&&CARDS[top(g)].c>=2);

  const hit=(n,pierce)=>g=>g.hit(n,pierce);
  const block=n=>g=>g.block(n);
  const draw=n=>g=>g.draw(n);
  const gainEcho=n=>g=>g.buff('echo',n);
  const clean=n=>g=>{g.s.p.poison=Math.max(0,g.s.p.poison-n);};
  const damageAndBlock=(damage,armor)=>seq(hit(damage),block(armor));
  function seq(...effects){
    return async (g,c)=>{
      for(const effect of effects){
        if(g.s.e.hp<=0||g.s.hp<=0) break;
        const result=effect(g,c);
        if(result instanceof Promise) await result;
      }
    };
  }
  const choose=(predicate,yes,no=()=>{})=>(g,c)=>predicate(g,c)?yes(g,c):no(g,c);
  function takeEcho(g){const amount=g.s.buffs.echo;g.buff('echo',-amount);return amount;}
  const strip=(g,n)=>{
    const enemy=g.s.e,removed=Math.min(n,enemy.block);
    enemy.block-=removed;
    if(removed&&enemy.block===0) g.s.brokeArmor=true;
    return removed;
  };
  async function moveHand(g,c,title,move,{filter,required=false}={}){
    const id=await g.pickCard(title,hand(g,c,filter),required);
    if(!id) return false;
    remove(g.s.hand,id);
    g.s.hidden.delete(id);
    g.s.retain.delete(id);
    move(id);
    return true;
  }
  const discard=(g,c)=>moveHand(g,c,'选择要丢弃的手牌',id=>g.s.discard.push(id));
  const putTop=(g,c,required=false)=>moveHand(g,c,'选择要置顶的手牌',id=>{g.s.drawPile.push(id);g.s.planned=true;},{required});
  async function sortTop(g,limit){
    const before=g.s.drawPile.slice(-limit).reverse();
    if(before.length<2) return;
    const remaining=[...before], order=[];
    while(remaining.length>1){
      const id=await g.pickCard(`选择第 ${order.length+1} 张要抽到的牌`,remaining);
      if(!id) return;
      order.push(remove(remaining,id));
    }
    order.push(remaining[0]);
    if(order.some((id,i)=>id!==before[i])){
      g.s.drawPile.splice(-before.length,before.length,...order.reverse());
      g.s.planned=true;
    }
  }
  function sealSelf(g,c){
    if(!selfSeal(g,c)) return false;
    g.s.sealed.add(c.id);
    g.s.sealedNow=true;
    return true;
  }
  async function seal(g,c,filter){
    return canSeal(g,c)&&moveHand(g,c,'选择本场封存的牌',id=>{
      g.s.sealed.add(id);
      g.s.sealedNow=true;
    },{filter});
  }
  async function retain(g,c,filter){
    const id=await g.pickCard('选择留到下回合的牌',hand(g,c,filter));
    if(id) g.s.retain.add(id);
    return Boolean(id);
  }
  function schedule(g,kind,after,effect){
    g.s.delayed.push({kind,turn:g.s.turnNo+after,effect});
  }
  const dive=effect=>async(g,c)=>{
    if(canDive(g,c)&&await g.confirmEffect('额外支付 1 洋流，发动潜航？')){
      g.s.energy--;
      schedule(g,'dive',1,effect);
    }
  };
  const vent=(after,effect)=>g=>schedule(g,'vent',after,effect);
  const payLife=n=>async g=>{
    if(!pain(n)(g)||!await g.confirmEffect(`失去 ${n} 生命，触发额外效果？`)) return false;
    g.s.hp-=n;
    g.s.paidLife=true;
    return true;
  };
  const recoverable=(g,filter)=>g.s.hand.length<10?
    g.s.discard.filter(id=>real(id)&&filter(CARDS[id])):[];
  const recoverCheck=filter=>(g,c)=>recoverable(g,filter).length>0||
    (g.s.hand.length===10&&!c.paid&&g.s.discard.some(id=>real(id)&&filter(CARDS[id])));
  async function recover(g,filter){
    const id=await g.pickCard('选择一张弃牌取回手牌',recoverable(g,filter));
    if(id){g.s.hand.push(remove(g.s.discard,id));}
  }
  const c0=c=>c.c===0, c1=c=>c.c===1, c2=c=>c.c>=2, any=()=>true;
  async function sift(g,limit=1){
    for(let i=0;i<limit&&top(g);i++){
      if(!await g.pickCard('查看牌顶。可丢弃或保留', [top(g)], false, '保留')) break;
      g.s.discard.push(g.s.drawPile.pop());
    }
  }
  const thresholdReward=reward=>seq((g,c)=>{
    const crossed=cross(g,c,7);
    g.hit(7);
    if(crossed&&g.s.e.hp>0&&harvest(g)) reward(g,c);
  });

  // Row order matches the reviewed ten cards for each archetype.
  const sets={
    echo:[
      [seq(hit(5),gainEcho(3))],
      [seq(block(6),gainEcho(3))],
      [gainEcho(2)],
      [async g=>{
        const spend=echo(g)&&await g.confirmEffect(`消耗全部 ${g.s.buffs.echo} 层回声？`);
        g.hit(7+(spend?takeEcho(g):0));
      },echo],
      [seq(block(10),gainEcho(6))],
      [(g,c)=>{const bonus=echo(g)?2:0;g.hit(4);if(g.s.e.hp>0) g.buff('echo',3+bonus);},echo],
      [seq(hit(9),gainEcho(6))],
      [seq(block(6),gainEcho(3),choose(g=>g.s.buffs.echo>=6,draw(1))),hasEchoFour],
      [g=>{strip(g,takeEcho(g));g.hit(12);},echo],
      [seq(block(10),gainEcho(12))]
    ],
    breakwater:[
      [g=>{strip(g,4);g.hit(6);},armored],
      [g=>g.block(4+strip(g,5)),armored],
      [choose(armored,seq(hit(6),draw(1)),hit(6)),armored],
      [g=>{g.block(2);strip(g,3);},armored],
      [g=>{const had=armored(g);g.hit(6);if(had&&!armored(g)&&g.s.e.hp>0) g.hit(5);},
        g=>armored(g)&&g.previewDamage(6,true)>=g.s.e.block],
      [g=>{const removed=strip(g,10);g.block(9);if(removed>=6) g.draw(1);},g=>g.s.e.block>=6],
      [choose(g=>g.s.brokeArmor,hit(17),hit(10)),g=>g.s.brokeArmor],
      [choose(g=>g.s.e.block>=8,hit(11,true),hit(7,true)),g=>g.s.e.block>=8],
      [g=>g.hit(8+strip(g,8)),armored],
      [g=>{const removed=strip(g,Infinity);g.hit(15);if(removed>=10&&g.s.e.hp>0) g.block(10);},armored]
    ],
    dive:[
      [seq(block(7),dive(block(7))),canDive],
      [seq(hit(7),dive(draw(2))),canDive],
      [seq(block(2),dive(block(6))),canDive],
      [damageAndBlock(5,4)],
      [seq(hit(7),dive(hit(8))),canDive],
      [choose(dived,hit(11),hit(7)),dived],
      [seq(block(7),choose(dived,draw(1))),dived],
      [seq(block(12),dive(seq(block(8),draw(1)))),canDive],
      [seq(hit(13),dive(hit(10))),canDive],
      [seq(hit(12),block(5),dive(damageAndBlock(10,6))),canDive]
    ],
    migrate:[
      [seq((g)=>sortTop(g,3),block(6)),g=>g.s.drawPile.length>=2],
      [seq(hit(6),(g,c)=>putTop(g,c)),stocked],
      [choose(planned,hit(10),hit(7)),planned],
      [seq(block(2),g=>sortTop(g,2)),g=>g.s.drawPile.length>=2],
      [seq(g=>sortTop(g,3),draw(1)),g=>g.s.drawPile.length>=2],
      [seq(block(6),async(g,c)=>{
        const current=top(g);
        if(!current) return;
        const id=await g.pickCard('选择与牌顶交换的手牌',hand(g,c));
        if(!id) return;
        const index=g.s.hand.indexOf(id);
        g.s.hand[index]=current;
        g.s.drawPile[g.s.drawPile.length-1]=id;
        g.s.hidden.delete(id);
        g.s.retain.delete(id);
        g.s.planned=true;
      }),(g,c)=>Boolean(top(g))&&stocked(g,c)],
      [choose(planned,block(16),block(10)),planned],
      [async g=>{const higher=highTop(g);if(top(g)) await g.showCard('当前牌顶',top(g));g.hit(10);if(higher&&g.s.e.hp>0) g.hit(7);},highTop],
      [seq(draw(2),(g,c)=>putTop(g,c,true))],
      [seq(g=>sortTop(g,6),draw(2),block(8)),g=>g.s.drawPile.length>=2]
    ],
    molt:[
      [seq(block(6),async(g,c)=>{if(await seal(g,c)) g.block(5);}),canSeal],
      [(g,c)=>{g.hit(9);sealSelf(g,c);},selfSeal],
      [seq(block(6),choose(g=>g.s.sealedNow,draw(1))),g=>g.s.sealedNow],
      [(g,c)=>{g.hit(2);if(sealSelf(g,c)&&g.s.e.hp>0) g.hit(3);},selfSeal],
      [seq(block(7),async(g,c)=>{if(await seal(g,c,card=>card.c>=1)) clean(3)(g);}),
        (g,c)=>canSeal(g,c)&&hand(g,c,card=>card.c>=1).length>0],
      [g=>g.block(9+g.s.sealed.size*2),g=>g.s.sealed.size>0],
      [async(g,c)=>g.hit(await seal(g,c)?17:10),canSeal],
      [seq(block(5),async(g,c)=>{if(await seal(g,c)) g.draw(2);}),canSeal],
      [g=>g.hit(10+g.s.sealed.size*2),g=>g.s.sealed.size>0],
      [seq(block(8),async(g,c)=>{for(let i=0;i<2&&g.s.e.hp>0;i++){if(!await seal(g,c)) break;g.hit(9);}}),canSeal]
    ],
    stress:[
      [seq(hit(7),async g=>{if(await payLife(2)(g)) g.hit(4);}),pain(2)],
      [choose(peril,block(10),block(6)),peril],
      [seq(block(2),async g=>{if(await payLife(2)(g)) g.draw(1);}),pain(2)],
      [choose(peril,hit(10),hit(6)),peril],
      [seq(async g=>g.hit(await payLife(3)(g)?17:11),choose(peril,block(4))),g=>peril(g)||pain(3)(g)],
      [choose(leaky,block(11),block(7)),leaky],
      [seq(block(5),choose(peril,g=>g.heal(4))),peril],
      [seq(hit(12),choose(peril,seq(hit(6),block(6)))),peril],
      [seq(block(10),choose(peril,seq(clean(4),block(6)))),peril],
      [choose(peril,damageAndBlock(25,10),hit(17)),peril]
    ],
    hide:[
      [seq(block(6),retain),stocked],
      [choose(reserve,hit(10),hit(6)),reserve],
      [seq(block(2),(g,c)=>retain(g,c,c2)),retainHigh],
      [choose(reserve,block(11),block(6)),reserve],
      [seq(hit(6),retain),stocked],
      [seq(block(12),async(g,c)=>{if(await retain(g,c)) schedule(g,'retain',1,block(3));}),stocked],
      [seq(hit(7),choose(afterDefense,draw(1))),afterDefense],
      [choose(reserve,seq(hit(16),draw(1)),hit(10)),reserve],
      [seq(block(6),async(g,c)=>{
        const id=await g.pickCard('选择一张伏藏手牌减费',hand(g,c,card=>discountable(g,card)));
        if(id) g.s.discounts.set(id,(g.s.discounts.get(id)||0)+1);
      }),retainDiscount],
      [choose(reserve,damageAndBlock(20,8),hit(12)),reserve]
    ],
    flank:[
      [hit(3)],
      [choose(shielded,hit(10),hit(7)),shielded],
      [choose(attacked,block(9),block(6)),attacked],
      [choose(attacked,block(4),block(2)),attacked],
      [damageAndBlock(5,4)],
      [seq(hit(12),choose(shielded,block(5))),shielded],
      [seq(block(12),choose(attacked,hit(6))),attacked],
      [seq(hit(7),choose(flanked,draw(1))),flanked],
      [choose(flanked,hit(18),hit(12)),flanked],
      [seq(hit(13),block(5),choose(flanked,draw(2))),flanked]
    ],
    vent:[
      [seq(block(4),vent(1,hit(8)))],
      [seq(hit(4),vent(1,block(8)))],
      [choose(canRetime,g=>{pendingVent(g).turn--;},block(2)),canRetime],
      [choose(vented,block(9),block(6)),vented],
      [seq(block(6),vent(2,hit(18)))],
      [choose(vented,hit(10),hit(6)),vented],
      [seq(block(8),vent(2,seq(block(13),draw(1))))],
      [seq(block(5),async g=>{const item=pendingVent(g);if(item&&await g.confirmEffect('拆除最早喷口，立刻造成 9 伤害？')){remove(g.s.delayed,item);g.hit(9);}}),g=>Boolean(pendingVent(g))],
      [choose(vented,damageAndBlock(15,4),hit(9)),vented],
      [seq(block(8),vent(1,hit(12)),vent(2,hit(16)))]
    ],
    net:[
      [seq(hit(6),choose(few,hit(3))),few],
      [choose(empty,block(11),block(6)),empty],
      [seq(hit(2),async(g,c)=>{if(await discard(g,c)) g.hit(2);}),stocked],
      [seq(block(5),async(g,c)=>{if(await discard(g,c)) g.block(3);}),stocked],
      [seq(hit(6),discard,choose(empty,hit(5))),(g,c)=>countHand(g,c)-(stocked(g,c)?1:0)<=0],
      [choose(few,block(15),block(10)),few],
      [seq(hit(7),choose(empty,g=>{g.s.extraDraw++;})),empty],
      [choose(empty,hit(18),hit(11)),empty],
      [seq(block(6),choose(one,seq(block(4),draw(1)))),one],
      [seq(hit(11),async(g,c)=>{for(let i=0;i<2;i++) if(!await discard(g,c)) break;},choose(empty,damageAndBlock(10,6))),
        (g,c)=>countHand(g,c)<=Math.min(2,hand(g,c).length)]
    ],
    filter:[
      [seq(block(6),g=>sift(g)),g=>Boolean(top(g))],
      [seq(hit(6),g=>sift(g)),g=>Boolean(top(g))],
      [seq(block(2),g=>sift(g)),g=>Boolean(top(g))],
      [seq(block(5),draw(1))],
      [seq(hit(5),g=>sift(g),draw(1)),g=>Boolean(top(g))],
      [seq(block(5),g=>recover(g,c0)),recoverCheck(c0)],
      [seq(hit(11),g=>recover(g,c2)),recoverCheck(c2)],
      [seq(block(9),g=>sift(g,2),draw(1)),g=>Boolean(top(g))],
      [seq(block(6),g=>recover(g,c1)),recoverCheck(c1)],
      [seq(hit(11),block(5),g=>recover(g,any)),recoverCheck(any)]
    ],
    pursuit:[
      [choose(full,seq(hit(6),hit(3)),hit(6)),full],
      [thresholdReward(block(5)),(g,c)=>cross(g,c,7)],
      [choose(full,block(9),block(6)),full],
      [choose(harvest,hit(5),hit(2)),harvest],
      [(g,c)=>{const activates=cross(g,c,11);g.hit(activates?16:11);},(g,c)=>cross(g,c,11)],
      [choose(full,damageAndBlock(16,4),hit(12)),full],
      [seq(block(6),choose(harvest,draw(1))),harvest],
      [thresholdReward(draw(2)),(g,c)=>cross(g,c,7)],
      [choose(harvest,hit(19),hit(12)),harvest],
      [choose(harvest,seq(hit(27),clean(3)),hit(17)),harvest]
    ]
  };
  return {sets,clean};
})();

Object.assign(Game,{
  newToken(id,temporary=false,free=false){
    const token='~'+(++this.s.tokenNo);
    const base=CARDS[CARDS[id].id];
    Object.defineProperty(CARDS,token,{configurable:true,value:{...base,token,temporary,free}});
    return token;
  },

  clearTokens(){
    for(const token of Object.getOwnPropertyNames(CARDS)){
      if(token.startsWith('~')) delete CARDS[token];
    }
  },

  initPoolFight(){
    this.clearTokens();
    Object.assign(this.s,{
      tokenNo:0,sealed:new Set(),hidden:new Set(),discounts:new Map(),
      delayed:[],retain:new Set(),extraDraw:0,resolving:null,_playedThisTurn:false,nextEnergy:0
    });
    this.s.buffs.echo=0;
  },

  async tickPool(){
    const s=this.s;
    Object.assign(s,{
      attacked:false,defended:false,planned:false,brokeArmor:false,sealedNow:false,
      paidLife:false,usedHidden:false,dived:false,vented:false,
      extraDamageUsed:false,tideAttackUsed:false,tideBlockUsed:false
    });
    s.discounts.clear();
    if(s.turnNo>1) this.changeTide(!s.tide);
    const due=s.delayed.filter(item=>item.turn<=s.turnNo);
    s.delayed=s.delayed.filter(item=>item.turn>s.turnNo);
    for(const item of due){
      if(s.e.hp<=0||s.hp<=0) break;
      if(item.kind==='dive') s.dived=true;
      if(item.kind==='vent') s.vented=true;
      await item.effect(this,{});
    }
  },

  changeTide(high){
    const s=this.s, rising=high&&!s.tide;
    s.tide=high;
    if(rising&&s.tideBonus) this.hit(s.tideBonus);
  },

  finishPoolTurn(){
    const s=this.s;
    const kept=s.hand.filter(id=>s.retain.has(id));
    s.hidden=new Set(kept);
    while(s.hand.length){
      const card=s.hand.pop();
      if(!s.hidden.has(card)&&!CARDS[card].temporary) s.discard.push(card);
    }
    s.hand.push(...kept);
    s.retain.clear();
    if(s.buffs.echo>0){
      this.log('回声造成 '+s.buffs.echo+' 伤害');
      this.hit(s.buffs.echo);
      s.buffs.echo=0;
    }
    if(s.e.hp>0&&s.buffs.swarm>0){
      this.hit(s.buffs.swarm);
      s.buffs.swarm--;
    }
  },

  pickOption(title,options,label,required=false,cancel='跳过'){
    if(!options.length) return Promise.resolve(null);
    this.uiChoice=true;
    UI.hideKW();
    return new Promise(resolve=>{
      UI.sheet('<h2></h2><div class="picks" id="effect-options"></div>');
      document.querySelector('#sheet h2').textContent=title;
      const area=document.getElementById('effect-options');
      const finish=value=>{
        this.uiChoice=false;
        UI.closeSheet();
        resolve(value);
      };
      for(const value of options){
        const button=document.createElement('button');
        button.className='btn';
        button.textContent=label(value);
        button.onclick=()=>finish(value);
        area.appendChild(button);
      }
      if(!required){
        const close=document.createElement('button');
        close.className='btn ghost';
        close.textContent=cancel;
        close.onclick=()=>finish(null);
        area.appendChild(close);
      }
      area.firstElementChild.focus();
    });
  },

  pickCard(title,ids,required=false,cancel='跳过'){
    return this.pickOption(title,ids,id=>{
      const card=CARDS[id], position=ids.indexOf(id)+1;
      return `${position}. ${card.n}（${card.c}） · ${card.d}`;
    },required,cancel);
  },

  showCard(title,id){
    return this.pickOption(title+' · '+CARDS[id].n,[true],()=> '继续',true);
  },

  confirmEffect(title){
    return this.pickOption(title,[true],()=> '发动');
  },

  copyCards(ids,free=true){
    for(const id of ids){
      if(this.s.hand.length>=10) break;
      const card=CARDS[id];
      if(!card||card.temporary||card.copyEffect) continue;
      this.s.hand.push(this.newToken(id,true,free));
    }
  },

  mimicHand(free=false,filter=()=>true){
    const eligible=this.s.hand.filter(id=>{
      const card=CARDS[id];return !card.temporary&&!card.copyEffect&&filter(card);
    });
    if(eligible.length) this.copyCards([eligible[(Math.random()*eligible.length)|0]],free);
  },

  mimicZero(){
    const unique=new Map(this.s.hand.filter(id=>CARDS[id].c===0&&!CARDS[id].temporary).map(id=>[CARDS[id].id,id]));
    this.copyCards(unique.values());
  },

  replayLast(n=1){
    this.copyCards(this.s.lastPlayed.slice(-n));
  },

  mimicHandWithZero(){this.mimicHand(true);},

  previewDamage(n,beforeArmor=false,pierce=false){
    const s=this.s,e=s.e;
    const eligible=!s.extraDamageUsed;
    const bonus=eligible?s.buffs.glow+(e.shock*s.voltPower):0;
    const tide=s.tide&&!s.tideAttackUsed?2:0;
    const amount=Math.round((n+bonus+tide)*(1+e.vuln*.05));
    return beforeArmor||pierce?amount:Math.max(0,amount-e.block);
  },

  hit(n,pierce){
    const s=this.s,e=s.e;
    if(n<=0||e.hp<=0) return;
    const ctx=s.resolving;
    const direct=ctx&&!ctx.passive;
    const before=e.block;
    let damage=direct?this.previewDamage(n,true):Math.round(n*(1+e.vuln*.05));
    if(direct){
      s.extraDamageUsed=true;
      if(s.tide) s.tideAttackUsed=true;
      ctx.attack=true;
    }
    if(!pierce&&e.block>0){const absorbed=Math.min(e.block,damage);e.block-=absorbed;damage-=absorbed;}
    if(before>0&&e.block===0) s.brokeArmor=true;
    if(damage>0){e.hp=Math.max(0,e.hp-damage);Audio.hit();UI.shake('e-art');}
  },

  block(n){
    const s=this.s;
    if(n<=0||s.e.hp<=0) return;
    if(s.resolving&&!s.resolving.passive){
      s.resolving.defense=true;
      if(!s.tide&&!s.tideBlockUsed){
        n+=2;
        s.tideBlockUsed=true;
      }
    }
    s.p.block+=n;
  },

  buff(key,n){
    const buffs=this.s.buffs;
    buffs[key]=Math.max(0,(buffs[key]||0)+n);
    return buffs[key];
  }
});

// Reviewed species names and player-facing text.
const existingSpecies = {
  krill: ["南极磷虾", "Euphausia superba"],
  sandworm: ["日本刺沙蚕", "Hediste japonica"],
  sardine: ["欧洲沙丁鱼", "Sardina pilchardus"],
  clownfish: ["眼斑双锯鱼", "Amphiprion ocellaris"],
  mackerel: ["大西洋鲭", "Scomber scombrus"],
  shark: ["大白鲨", "Carcharodon carcharias"],
  orca: ["虎鲸", "Orcinus orca"],
  barracuda: ["大梭鱼", "Sphyraena barracuda"],
  tuna: ["大西洋蓝鳍金枪鱼", "Thunnus thynnus"],
  moray: ["星斑裸胸鳝", "Gymnothorax javanicus"],
  barnacle: ["纹藤壶", "Amphibalanus amphitrite"],
  hermit: ["红带寄居蟹", "Pagurus longicarpus"],
  urchin: ["紫海胆", "Heliocidaris crassispina"],
  lobster: ["美洲螯龙虾", "Homarus americanus"],
  kingcrab: ["堪察加拟石蟹", "Paralithodes camtschaticus"],
  turtle: ["绿海龟", "Chelonia mydas"],
  crab: ["红黄道蟹", "Cancer productus"],
  horseshoe: ["中华鲎", "Tachypleus tridentatus"],
  giantclam: ["大砗磲", "Tridacna gigas"],
  abalone: ["皱纹盘鲍", "Haliotis discus"],
  nudibranch: ["大西洋海神蛞蝓", "Glaucus atlanticus"],
  seasnake: ["阔带青环海蛇", "Laticauda colubrina"],
  puffer: ["六斑刺鲀", "Diodon holocanthus"],
  lionfish: ["蓑鲉", "Pterois volitans"],
  stonefish: ["玫瑰毒鲉", "Synanceia verrucosa"],
  cone: ["地纹芋螺", "Conus geographus"],
  manowar: ["僧帽水母", "Physalia physalis"],
  boxjelly: ["澳洲箱水母", "Chironex fleckeri"],
  blueringcard: ["豹纹蛸", "Hapalochlaena lunulata"],
  toxicbloom: ["夜光游水母", "Pelagia noctiluca"],
  flyingfish: ["燕鳐", "Cypselurus poecilopterus"],
  dolphin: ["宽吻海豚", "Tursiops truncatus"],
  albatross: ["漂泊信天翁", "Diomedea exulans"],
  kelp: ["巨藻", "Macrocystis pyrifera"],
  moonjelly: ["海月水母", "Aurelia aurita"],
  sunfish: ["翻车鲀", "Mola mola"],
  sailfish: ["平鳍旗鱼", "Istiophorus platypterus"],
  manta: ["双吻前口蝠鲼", "Mobula birostris"],
  whaleshark: ["鲸鲨", "Rhincodon typus"],
  surge: ["短尾真鲨", "Carcharhinus limbatus"],
  searoach: ["海蟑螂", "Ligia exotica"],
  seabutterfly: ["北极翼足螺", "Limacina helicina"],
  copepod: ["飞马哲水蚤", "Calanus finmarchicus"],
  brineshrimp: ["卤虫", "Artemia salina"],
  daphnia: ["大型溞", "Daphnia magna"],
  amphipod: ["东北钩虾", "Gammarus oceanicus"],
  seaspider: ["粗腿海蜘蛛", "Nymphon grossipes"],
  lancelet: ["白氏文昌鱼", "Branchiostoma belcheri"],
  isopod: ["大王具足虫", "Bathynomus giganteus"],
  swarmtide: ["太平洋磷虾", "Euphausia pacifica"],
  cuttlefish: ["欧洲乌贼", "Sepia officinalis"],
  bobtail: ["夏威夷短尾乌贼", "Euprymna scolopes"],
  filefish: ["长吻单棘鲀", "Oxymonacanthus longirostris"],
  seadragon: ["叶海龙", "Phycodurus eques"],
  wonderpus: ["奇异拟态章鱼", "Wunderpus photogenicus"],
  octopus: ["普通章鱼", "Octopus vulgaris"],
  stanceturn: ["拟态章鱼", "Thaumoctopus mimicus"],
  mirrorink: ["金乌贼", "Acanthosepion esculentum"],
  twin: ["长腕蛸", "Octopus minor"],
  mimicmaster: ["宽腕乌贼", "Ascarosepion latimanus"],
  inkjet: ["曼氏无针乌贼", "Sepiella maindroni"],
  shortocto2: ["短蛸", "Amphioctopus fangsiao"],
  flamboyant2: ["火焰乌贼", "Ascarosepion pfefferi"],
  inkveil: ["太平洋褶柔鱼", "Todarodes pacificus"],
  vampire2: ["吸血鬼乌贼", "Vampyroteuthis infernalis"],
  nautiluscard: ["鹦鹉螺", "Nautilus pompilius"],
  architeuthis2: ["大王乌贼", "Architeuthis dux"],
  fog: ["透明裳柔鱼", "Hyaloteuthis pelagica"],
  inkstain: ["莱氏拟乌贼", "Sepioteuthis lessoniana"],
  abysshush: ["盲眼深海蛸", "Cirrothauma murrayi"],
  noctiluca: ["夜光藻", "Noctiluca scintillans"],
  lanternfish: ["冰川灯笼鱼", "Benthosema glaciale"],
  fireflysquid: ["萤火鱿", "Watasenia scintillans"],
  combjelly: ["海胡桃栉水母", "Mnemiopsis leidyi"],
  flashlight: ["裂鳍灯眼鱼", "Anomalops katoptron"],
  anglerfish: ["约氏角鮟鱇", "Melanocetus johnsonii"],
  glowtendril: ["光器水母", "Aequorea victoria"],
  lumenburst: ["红色烟火水母", "Atolla wyvillei"],
  deepglow: ["半裸银斧鱼", "Argyropelecus hemigymnus"],
  brilliant: ["巨型深海水母", "Stygiomedusa gigantea"],
  icefish: ["南极冰鱼", "Chaenocephalus aceratus"],
  seapig: ["球形海猪", "Scotoplanes globosa"],
  coldcurrent: ["南极银鱼", "Pleuragramma antarcticum"],
  glass2: ["尖尾玻璃乌贼", "Galiteuthis glacialis"],
  toothfish: ["南极犬牙鱼", "Dissostichus mawsoni"],
  icewall: ["南极帽贝", "Nacella concinna"],
  blind2: ["南极章鱼", "Pareledone turqueti"],
  greenland: ["格陵兰鲨", "Somniosus microcephalus"],
  permafrost: ["南极大鳞鲽鲈", "Trematomus bernacchii"],
  zeropoint: ["大王酸浆鱿", "Mesonychoteuthis hamiltoni"],
  sponge: ["橙色穿孔海绵", "Cliona celata"],
  coral: ["地中海红珊瑚", "Corallium rubrum"],
  seagrass: ["大叶藻", "Zostera marina"],
  zoox: ["微小共生甲藻", "Breviolum minutum"],
  seafan: ["维纳斯海扇", "Gorgonia flabellum"],
  tubeworm: ["巨型管虫", "Riftia pachyptila"],
  reef: ["鹿角柱珊瑚", "Acropora cervicornis"],
  mangrove: ["红树", "Rhizophora mangle"],
  ecoecho: ["美丽海葵", "Radianthus magnifica"],
  symbiowing: ["方斑蝴蝶鱼", "Chaetodon lunulatus"],
  tidepool: ["普通帽贝", "Patella vulgata"],
  sanddollar: ["偏心沙钱", "Dendraster excentricus"],
  moonsnail: ["玉螺", "Neverita didyma"],
  grunion: ["加州滑银汉鱼", "Leuresthes tenuis"],
  tidecall: ["弹涂鱼", "Periophthalmus modestus"],
  surf: ["礁蝠鲼", "Mobula alfredi"],
  lowtide: ["玳瑁", "Eretmochelys imbricata"],
  tsunami: ["棱皮龟", "Dermochelys coriacea"],
  tidefull: ["大西洋飞鱼", "Cheilopogon melanurus"],
  tideheart: ["加州角鲨", "Heterodontus francisci"],
  static: ["班氏双鳍电鳐", "Narcine bancroftii"],
  electricray: ["大理石电鳐", "Torpedo marmorata"],
  eel2: ["伏打电鳗", "Electrophorus voltai"],
  stargazer: ["大西洋瞻星鱼", "Astroscopus guttatus"],
  voltchain: ["电鲇", "Malapterurus electricus"],
  shockwave: ["象鼻鱼", "Gnathonemus petersii"],
  paralyze: ["欧洲瞻星鱼", "Uranoscopus scaber"],
  thunder: ["强电鳗", "Electrophorus electricus"],
  voltcore: ["大西洋电鳐", "Tetronarce nobiliana"],
  storm: ["南方电鳗", "Electrophorus varii"],
};

const expansionSpecies = {
  echo: [
    ["港湾鼠海豚", 1, "c", "造成 5 伤害，获得 3 层回声。", "Phocoena phocoena"],
    ["北瓶鼻鲸", 1, "c", "获得 6 护甲，获得 3 层回声。", "Hyperoodon ampullatus"],
    ["短吻真海豚", 0, "c", "获得 2 层回声。", "Delphinus delphis"],
    ["印度太平洋瓶鼻海豚", 1, "c", "可先消耗全部回声。造成 7 伤害，每消耗 1 层再加 1。", "Tursiops aduncus"],
    ["领航鲸", 2, "u", "获得 10 护甲，获得 6 层回声。", "Globicephala melas"],
    ["太平洋斑纹海豚", 1, "u", "造成 4 伤害，获得 3 层回声。若此前已有回声，再获得 2 层。", "Sagmatias obliquidens"],
    ["里氏海豚", 2, "u", "造成 9 伤害，获得 6 层回声。", "Grampus griseus"],
    ["飞旋海豚", 1, "r", "获得 6 护甲和 3 层回声。若施加后回声达到 6 层，抽 1 张牌。", "Stenella longirostris"],
    ["居氏喙鲸", 2, "r", "消耗全部回声。移除敌人等同于消耗量的护甲，再造成 12 伤害。", "Ziphius cavirostris"],
    ["白鲸", 3, "l", "获得 10 护甲，获得 12 层回声。", "Delphinapterus leucas"],
  ],
  breakwater: [
    ["岩栖穿孔海胆", 1, "c", "移除敌人至多 4 护甲，然后造成 6 伤害。", "Echinometra lucunter"],
    ["凿石蛤", 1, "c", "移除敌人至多 5 护甲。获得 4 护甲，再获得等于实际移除量的护甲。", "Lithophaga lithophaga"],
    ["岩缝枪虾", 1, "c", "造成 6 伤害。若打出前敌人有护甲，抽 1 张牌。", "Alpheus heterochaelis"],
    ["绿脆蛇尾", 0, "c", "获得 2 护甲，移除敌人至多 3 护甲。", "Ophiarachna incrassata"],
    ["孔雀螳螂虾", 1, "u", "造成 6 伤害。若本牌的伤害把敌方护甲从正数打到零，再造成 5 伤害。", "Odontodactylus scyllarus"],
    ["大西洋石蟹", 2, "u", "移除敌人至多 10 护甲。获得 9 护甲。若移除了至少 6 点，抽 1 张牌。", "Menippe mercenaria"],
    ["南方岩龙虾", 2, "u", "造成 10 伤害。若本回合此前敌人的护甲曾从正数降到零，改为造成 17 伤害。", "Jasus edwardsii"],
    ["豹纹海鳝", 1, "r", "造成 7 伤害，穿透护甲。若敌方当前有至少 8 护甲，改为 11 伤害。", "Gymnothorax favagineus"],
    ["黄道面包蟹", 2, "r", "移除敌人至多 8 护甲，造成 8 伤害，每实际移除 1 点护甲再加 1 伤害。", "Cancer pagurus"],
    ["加州螳螂虾", 3, "l", "移除敌人全部护甲。造成 15 伤害。若实际移除了至少 10 点护甲，再获得 10 护甲。", "Hemisquilla californiensis"],
  ],
  dive: [
    ["港海豹", 1, "c", "获得 7 护甲。【潜航 1】下回合再获得 7 护甲。", "Phoca vitulina"],
    ["灰海豹", 1, "c", "造成 7 伤害。【潜航 1】下回合抽 2 张牌。", "Halichoerus grypus"],
    ["韦德尔氏海豹", 0, "c", "获得 2 护甲。【潜航 1】下回合获得 6 护甲。", "Leptonychotes weddellii"],
    ["海獭", 1, "c", "造成 5 伤害，获得 4 护甲。", "Enhydra lutris"],
    ["侏儒抹香鲸", 1, "u", "造成 7 伤害。【潜航 1】下回合造成 8 伤害。", "Kogia breviceps"],
    ["北象海豹", 1, "u", "造成 7 伤害。若本回合已结算过潜航奖励，改为 11 伤害。", "Mirounga angustirostris"],
    ["环斑海豹", 1, "u", "获得 7 护甲。若本回合已结算过潜航奖励，抽 1 张牌。", "Pusa hispida"],
    ["罗斯海豹", 2, "r", "获得 12 护甲。【潜航 1】下回合获得 8 护甲并抽 1 张牌。", "Ommatophoca rossii"],
    ["南象海豹", 2, "r", "造成 13 伤害。【潜航 1】下回合造成 10 伤害。", "Mirounga leonina"],
    ["抹香鲸", 2, "l", "造成 12 伤害，获得 5 护甲。【潜航 1】下回合造成 10 伤害并获得 6 护甲。", "Physeter macrocephalus"],
  ],
  migrate: [
    ["太平洋鲱", 1, "c", "查看并排序抽牌堆顶至多 3 张牌。获得 6 护甲。", "Clupea pallasii"],
    ["日本鳀", 1, "c", "造成 6 伤害。可将一张手牌置顶。", "Engraulis japonicus"],
    ["大西洋鲑", 1, "c", "造成 7 伤害。若本回合已有牌顶操作，额外造成 3 伤害。", "Salmo salar"],
    ["虹鳟", 0, "c", "获得 2 护甲。查看牌顶至多 2 张牌，可交换其顺序。", "Oncorhynchus mykiss"],
    ["红鲑", 1, "u", "查看并排序牌顶至多 3 张牌，然后抽 1 张牌。", "Oncorhynchus nerka"],
    ["粉红鲑", 1, "u", "获得 6 护甲。若手牌及抽牌堆均有原件，可交换一张手牌和牌顶。", "Oncorhynchus gorbuscha"],
    ["花鲈", 2, "u", "获得 10 护甲。若本回合已有牌顶操作，再获得 6 护甲。", "Lateolabrax spilonotus"],
    ["欧洲鳗鲡", 2, "r", "造成 10 伤害。查看牌顶，若其基础费用至少为 2，额外造成 7 伤害。", "Anguilla anguilla"],
    ["日本鳗鲡", 1, "r", "抽 2 张牌，然后若手中有原件，选择一张置顶。", "Anguilla japonica"],
    ["大鳞大麻哈鱼", 2, "l", "查看并排序牌顶至多 6 张牌。抽 2 张，获得 8 护甲。", "Oncorhynchus tshawytscha"],
  ],
  molt: [
    ["中华绒螯蟹", 1, "c", "获得 6 护甲。可封存一张手牌，若成功，再获得 5 护甲。", "Eriocheir sinensis"],
    ["美洲蓝蟹", 1, "c", "造成 9 伤害，结算后封存此牌。", "Callinectes sapidus"],
    ["锯缘青蟹", 1, "c", "获得 6 护甲。若本回合已封存过牌，抽 1 张牌。", "Scylla serrata"],
    ["北方长额虾", 0, "c", "造成 2 伤害。若成功封存此牌，再造成 3 伤害。", "Pandalus borealis"],
    ["厚纹蟹", 1, "u", "获得 7 护甲。可封存一张基础费用至少为 1 的手牌，若成功，清除自身至多 3 层剧毒。", "Pachygrapsus crassipes"],
    ["雪蟹", 2, "u", "获得 9 护甲。本场每封存过一张牌，再获得 2 护甲。", "Chionoecetes opilio"],
    ["三疣梭子蟹", 2, "u", "造成 10 伤害。可封存一张手牌，若成功，改为造成 17 伤害。", "Portunus trituberculatus"],
    ["中国对虾", 1, "r", "获得 5 护甲。可封存一张手牌，若成功，抽 2 张牌。", "Penaeus chinensis"],
    ["日本对虾", 2, "r", "造成 10 伤害。本场每封存过一张牌，再加 2 伤害。", "Penaeus japonicus"],
    ["斑节对虾", 2, "l", "获得 8 护甲。可依次封存至多两张手牌，每成功封存一张，造成 9 伤害。", "Penaeus monodon"],
  ],
  stress: [
    ["豹鲨", 1, "c", "造成 7 伤害。可失去 2 生命，再造成 4 伤害。", "Triakis semifasciata"],
    ["花鳗鲡", 1, "c", "获得 6 护甲。【临险】额外获得 4 护甲。", "Anguilla marmorata"],
    ["大西洋针鱼", 0, "c", "获得 2 护甲。可失去 2 生命，若支付成功，抽 1 张牌。", "Strongylura marina"],
    ["黄边裸胸鳝", 1, "c", "造成 6 伤害。【临险】改为 10 伤害。", "Gymnothorax flavimarginatus"],
    ["剑旗鱼", 2, "u", "可失去 3 生命。随后造成 11 伤害，若支付成功改为 17。【临险】再获得 4 护甲。", "Xiphias gladius"],
    ["大眼金枪鱼", 1, "u", "获得 7 护甲。若本回合此前主动失去过生命，再获得 4 护甲。", "Thunnus obesus"],
    ["欧洲海鲈", 1, "u", "获得 5 护甲。【临险】恢复 4 生命。", "Dicentrarchus labrax"],
    ["钩吻鲑", 2, "r", "造成 12 伤害。【临险】再造成 6 伤害，获得 6 护甲。", "Oncorhynchus kisutch"],
    ["长鳍金枪鱼", 2, "r", "获得 10 护甲。【临险】清除自身至多 4 层剧毒，再获得 6 护甲。", "Thunnus alalunga"],
    ["尖吻鲭鲨", 3, "l", "造成 17 伤害。【临险】改为 25 伤害，并获得 10 护甲。", "Isurus oxyrinchus"],
  ],
  hide: [
    ["太平洋清洁虾", 1, "c", "获得 6 护甲。可为一张手牌施加【留牌】。", "Lysmata amboinensis"],
    ["骆驼虾", 1, "c", "造成 6 伤害。若此牌伏藏，改为 10 伤害。", "Rhynchocinetes durbanensis"],
    ["纹身躄鱼", 0, "c", "获得 2 护甲。可为一张基础费用至少为 2 的手牌施加【留牌】。", "Antennarius striatus"],
    ["蓝纹寄居蟹", 1, "c", "获得 6 护甲。若此牌伏藏，再获得 5 护甲。", "Clibanarius tricolor"],
    ["两眼章鱼", 1, "u", "造成 6 伤害。可为一张手牌施加【留牌】。", "Octopus bimaculoides"],
    ["椰子章鱼", 2, "u", "获得 12 护甲，可为一张手牌施加【留牌】。若选择了牌，下回合抽牌前获得 3 护甲。", "Amphioctopus marginatus"],
    ["圆斑拟章鱼", 1, "u", "造成 7 伤害。若本回合此前打出过伏藏牌，抽 1 张牌。", "Callistoctopus macropus"],
    ["黄眼裸胸鳝", 2, "r", "造成 10 伤害。若此牌伏藏，改为 16 伤害并抽 1 张牌。", "Gymnothorax nudivomer"],
    ["叶形海鲉", 1, "r", "获得 6 护甲。可让一张当前伏藏的手牌在本回合少付 1 洋流。", "Taenianotus triacanthus"],
    ["巨型躄鱼", 2, "l", "造成 12 伤害。若此牌伏藏，改为 20 伤害并获得 8 护甲。", "Antennarius commerson"],
  ],
  flank: [
    ["日本竹荚鱼", 0, "c", "造成 3 伤害。", "Trachurus japonicus"],
    ["大眼鲹", 1, "c", "造成 7 伤害。若本回合已防守，改为 10 伤害。", "Caranx sexfasciatus"],
    ["蓝鳍鲹", 1, "c", "获得 6 护甲。若本回合已进攻，再获得 3 护甲。", "Caranx melampygus"],
    ["杜氏鰤", 0, "c", "获得 2 护甲。若本回合已进攻，再获得 2 护甲。", "Seriola dumerili"],
    ["黄带拟鲹", 1, "u", "造成 5 伤害，获得 4 护甲。", "Selaroides leptolepis"],
    ["高体鰤", 2, "u", "造成 12 伤害。若本回合已防守，再获得 5 护甲。", "Seriola rivoliana"],
    ["黄金鲹", 2, "u", "获得 12 护甲。若本回合已进攻，再造成 6 伤害。", "Gnathanodon speciosus"],
    ["费氏鲹", 1, "r", "造成 7 伤害。若本回合已进攻且已防守，抽 1 张牌。", "Ferdauia ferdau"],
    ["五条鰤", 2, "r", "造成 12 伤害。若本回合已进攻且已防守，改为 18 伤害。", "Seriola quinqueradiata"],
    ["浪人鲹", 2, "l", "造成 13 伤害并获得 5 护甲。若本回合已进攻且已防守，再抽 2 张牌。", "Caranx ignobilis"],
  ],
  vent: [
    ["庞贝蠕虫", 1, "c", "获得 4 护甲。布置喷口，下回合造成 8 伤害。", "Alvinella pompejana"],
    ["热液铠甲虾", 1, "c", "造成 4 伤害。布置喷口，下回合获得 8 护甲。", "Rimicaris exoculata"],
    ["硫化物红螺", 0, "c", "将最早到期的喷口提前一回合。若未能提前，获得 2 护甲。", "Ifremeria nautilei"],
    ["热液新腹足螺", 1, "c", "获得 6 护甲。若本回合已有喷口喷发，再获得 3 护甲。", "Alviniconcha hessleri"],
    ["鳞足螺", 2, "u", "获得 6 护甲。布置喷口，两回合后造成 18 伤害。", "Chrysomallon squamiferum"],
    ["深海偏顶蛤", 1, "u", "造成 6 伤害。若本回合已有喷口喷发，再造成 4 伤害。", "Bathymodiolus thermophilus"],
    ["热液盲蟹", 2, "u", "获得 8 护甲。布置喷口，两回合后获得 13 护甲并抽 1 张牌。", "Bythograea thermydron"],
    ["热液绒毛蟹", 1, "r", "获得 5 护甲。可拆除最早到期的一个喷口。若拆除成功，立刻造成 9 伤害。", "Kiwa hirsuta"],
    ["深海长管虫", 2, "r", "造成 9 伤害。若本回合已有喷口喷发，改为 15 伤害并获得 4 护甲。", "Tevnia jerichonana"],
    ["赫塞尔雪人蟹", 3, "l", "获得 8 护甲。依次布置两个喷口，下回合第一个造成 12 伤害，两回合后第二个造成 16 伤害。", "Kiwa tyleri"],
  ],
  net: [
    ["欧洲鳀", 1, "c", "造成 6 伤害。若手牌至多 1 张，再造成 3 伤害。", "Engraulis encrasicolus"],
    ["太平洋鳕", 1, "c", "获得 6 护甲。若手牌为空，再获得 5 护甲。", "Gadus macrocephalus"],
    ["柳叶鱼", 0, "c", "造成 2 伤害。可丢弃一张手牌，若成功，再造成 2 伤害。", "Spirinchus lanceolatus"],
    ["狭鳕", 1, "c", "获得 5 护甲。可丢弃一张手牌，若成功，再获得 3 护甲。", "Gadus chalcogrammus"],
    ["毛鳞鱼", 1, "u", "造成 6 伤害。可丢弃一张手牌，若手牌为空，再造成 5 伤害。", "Mallotus villosus"],
    ["银鲳", 2, "u", "获得 10 护甲。若手牌至多 1 张，再获得 5 护甲。", "Pampus argenteus"],
    ["大西洋鳕", 1, "u", "造成 7 伤害。若手牌为空，下回合额外抽 1 张牌。", "Gadus morhua"],
    ["大菱鲆", 2, "r", "造成 11 伤害。若手牌为空，改为 18 伤害。", "Scophthalmus maximus"],
    ["细鳞大麻哈鱼", 1, "r", "获得 6 护甲。若手牌恰好 1 张，额外获得 4 护甲并抽 1 张牌。", "Oncorhynchus keta"],
    ["大西洋大比目鱼", 2, "l", "造成 11 伤害。可依次丢弃至多两张手牌。若手牌为空，再造成 10 伤害并获得 6 护甲。", "Hippoglossus hippoglossus"],
  ],
  filter: [
    ["紫贻贝", 1, "c", "获得 6 护甲。查看牌顶，可以丢弃它。", "Mytilus edulis"],
    ["厚壳贻贝", 1, "c", "造成 6 伤害。查看牌顶，可以丢弃它。", "Mytilus coruscus"],
    ["菲律宾蛤仔", 0, "c", "获得 2 护甲。查看牌顶，可以丢弃它。", "Ruditapes philippinarum"],
    ["地中海浴海绵", 1, "c", "获得 5 护甲，抽 1 张牌。", "Spongia officinalis"],
    ["座头鲸", 1, "u", "造成 5 伤害。查看牌顶，可以丢弃它，然后抽 1 张牌。", "Megaptera novaeangliae"],
    ["欧洲牡蛎", 1, "u", "获得 5 护甲。可回收弃牌堆中一张基础费用为 0 的原件。", "Ostrea edulis"],
    ["塞鲸", 2, "u", "造成 11 伤害。可回收弃牌堆中一张基础费用至少为 2 的原件。", "Balaenoptera borealis"],
    ["大西洋扇贝", 2, "r", "获得 9 护甲。连续筛选至多两张牌顶牌，选择保留时停止，然后抽 1 张。", "Placopecten magellanicus"],
    ["北大西洋露脊鲸", 1, "r", "获得 6 护甲。可回收弃牌堆中一张基础费用为 1 的原件。", "Eubalaena glacialis"],
    ["蓝鲸", 2, "l", "造成 11 伤害，获得 5 护甲。可回收弃牌堆中任意一张原件。", "Balaenoptera musculus"],
  ],
  pursuit: [
    ["条纹四鳍旗鱼", 1, "c", "造成 6 伤害。【满势】再造成 3 伤害。", "Kajikia audax"],
    ["蓝圆鲹", 1, "c", "造成 7 伤害。若命中后把敌人从收割线以上压进收割线，获得 5 护甲。", "Decapterus maruadsi"],
    ["北方塘鹅", 1, "c", "获得 6 护甲。【满势】再获得 3 护甲。", "Morus bassanus"],
    ["褐鹈鹕", 0, "c", "造成 2 伤害。【收割】改为 5 伤害。", "Pelecanus occidentalis"],
    ["条纹鲈", 2, "u", "造成 11 伤害。若 11 点基础伤害足以把敌人打进收割线，改为 16 伤害。", "Morone saxatilis"],
    ["黄鳍金枪鱼", 2, "u", "造成 12 伤害。【满势】改为 16 伤害，并获得 4 护甲。", "Thunnus albacares"],
    ["银鸥", 1, "u", "获得 6 护甲。【收割】抽 1 张牌。", "Larus argentatus"],
    ["大西洋马鲛", 1, "r", "造成 7 伤害。若命中后把敌人从收割线以上压进收割线，抽 2 张牌。", "Scomberomorus maculatus"],
    ["鼬鲨", 2, "r", "造成 12 伤害。【收割】改为 19 伤害。", "Galeocerdo cuvier"],
    ["伪虎鲸", 3, "l", "造成 17 伤害。【收割】改为 27 伤害，并清除自身至多 3 层剧毒。", "Pseudorca crassidens"],
  ],
};

const expansionArchetypes = {
  echo:{n:'回声',c:'#85d9ff',d:'回合末自动结算回声，也可提前消耗。'},
  breakwater:{n:'破甲',c:'#e6ad79',d:'削掉敌方护甲，再把伤害打进去。'},
  dive:{n:'潜航',c:'#69a5e8',d:'可额外支付洋流，在下回合领取效果。'},
  migrate:{n:'洄游',c:'#70d6c0',d:'调整牌顶，安排下一次抽到的牌。'},
  molt:{n:'蜕壳',c:'#d7b0fb',d:'封存本场用不上的牌，换取攻防。'},
  stress:{n:'应激',c:'#ff9a99',d:'主动支付生命，在临险时发挥更强的效果。'},
  hide:{n:'伏藏',c:'#b6beef',d:'留下好牌，下回合择机打出。'},
  flank:{n:'夹击',c:'#a1e6a4',d:'在同一轮兼顾攻击与防御，获得后续收益。'},
  vent:{n:'热泉',c:'#ffb267',d:'部署喷口，在之后的回合开局喷发。'},
  net:{n:'收网',c:'#b3e1e3',d:'把手牌打少，兑现最后几张的效果。'},
  filter:{n:'滤食',c:'#9adbcf',d:'筛掉牌顶闲牌，从弃牌堆回收需要的牌。'},
  pursuit:{n:'追猎',c:'#ffc380',d:'观察敌方生命，在满势与收割阶段强化。'}
};
Object.assign(ARCH,expansionArchetypes);
Object.assign(ARCH.devour,{n:'吞噬',d:'喂任意手牌强化攻击，饵料被吞噬时另有收益。'});
Object.assign(ARCH.shell,{n:'甲壳'});
Object.assign(ARCH.lumen,{n:'发光',d:'每轮第一次卡牌伤害受益，也可消耗发光爆发。'});
Object.assign(ARCH.symbio,{n:'共生',d:'成长每轮自动提供护甲，配合治疗。'});
ARCH.swarm.d='虫群每轮自动啃咬，也能集中兑现。';
ARCH.tide.d='涨潮强化第一击，退潮强化第一张护甲牌。';

const retainedArtwork=new Set([
  'krill','sandworm','sardine','clownfish','mackerel','shark','orca','barracuda','tuna','urchin','lobster',
  'kingcrab','turtle','horseshoe','giantclam','nudibranch','seasnake','puffer','lionfish','stonefish','cone',
  'manowar','boxjelly','blueringcard','dolphin','albatross','kelp','moonjelly','sunfish','sailfish','manta',
  'whaleshark','searoach','brineshrimp','daphnia','lancelet','isopod','cuttlefish','bobtail','seadragon',
  'wonderpus','octopus','stanceturn','inkjet','shortocto2','flamboyant2','vampire2','nautiluscard','architeuthis2',
  'noctiluca','fireflysquid','combjelly','flashlight','anglerfish','icefish','seapig','toothfish','greenland',
  'zeropoint','coral','seagrass','seafan','tubeworm','sanddollar','moonsnail','grunion','electricray','stargazer'
]);
for(const [id,[name,species]] of Object.entries(existingSpecies)){
  Object.assign(CARDS[id],{n:name,species,img:retainedArtwork.has(id)?CARDS[id].img:null});
}
for(const [key,rows] of Object.entries(expansionSpecies)){
  rows.forEach(([name,cost,rarity,description,species],index)=>{
    const id=`${key}_${String(index+1).padStart(2,'0')}`;
    const [effect,activates]=CardPool.sets[key][index];
    def(id,name,cost,key,rarity,null,description,effect,activates);
    CARDS[id].species=species;
  });
}

Object.assign(KW,{
  吞噬:'吞噬：可从手中选一张原件丢弃以强化本牌。饵料被吃时另有效果。',
  饵料:'饵料：可正常打出。被吞噬时触发词条所写效果。',
  发光:'发光：本轮第一次卡牌伤害每层加 1。',
  虫群:'虫群：每轮结束造成等同层数的伤害，然后减少 1 层。',
  成长:'成长：下回合起，每次回合开始获得等同层数的护甲。',
  涨潮:'涨潮：本轮第一次卡牌伤害额外加 2；回合开始时与退潮交替。',
  退潮:'退潮：本轮第一张提供护甲的牌额外加 2 护甲。',
  回声:'回声：回合结束造成等同层数的伤害，然后清空。',
  潜航:'潜航：每次打出可额外支付标明的费用，在下回合开局兑现。',
  置顶:'置顶：把一张牌放到下一次抽取的位置。',
  封存:'封存：把牌移出本场循环。至少保留一张原件，战后恢复牌库。',
  临险:'临险：己方生命不高于最大生命的 50%。',
  留牌:'留牌：选一张原件跳过本轮弃牌，下轮进入伏藏。',
  伏藏:'伏藏：由留牌带到本回合的牌获得此状态，离手清除。',
  喷口:'喷口：热泉的延迟效果，到指定回合自动喷发。',
  回收:'回收：从弃牌堆取回一张原件。',
  满势:'满势：敌方生命高于最大生命的 50%。',
  收割:'收割：敌方生命不高于最大生命的 50%。'
});

const reviseCard=(id,d,f,activates)=>{
  Object.assign(CARDS[id],{d,f,activates});
};
const baitBonuses={
  krill:g=>g.draw(1),sandworm:g=>g.block(2),sardine:g=>g.hit(3),clownfish:g=>g.draw(1)
};
for(const [id,bonus] of Object.entries(baitBonuses)){
  CARDS[id].baitBonus=bonus;
  CARDS[id].d+=({krill:'被吞噬时，抽 1 张。',sandworm:'被吞噬时，获得 2 护甲。',sardine:'被吞噬时，造成 3 伤害。',clownfish:'被吞噬时，抽 1 张。'})[id];
}
for(const id of ['shark','orca','barracuda','tuna']) CARDS[id].devours=true;
reviseCard('shark','造成 13 伤害。【吞噬】改为 18 伤害。',(g,c)=>g.hit(c.ate?18:13));
reviseCard('orca','造成 19 伤害。【吞噬】改为 24 伤害，并获得 6 护甲。',(g,c)=>{g.hit(c.ate?24:19);if(c.ate) g.block(6);});
reviseCard('barracuda','造成 7 伤害。【吞噬】再抽 2 张。',(g,c)=>{g.hit(7);if(c.ate&&g.s.e.hp>0) g.draw(2);});
reviseCard('tuna','造成 13 伤害。【吞噬】再造成 5 伤害。',(g,c)=>{g.hit(13);if(c.ate) g.hit(5);});
reviseCard('crab','获得 8 护甲。若打出前已有至少 5 护甲，再获得 3 护甲。',g=>g.block(g.s.p.block>=5?11:8),g=>g.s.p.block>=5);
reviseCard('horseshoe','获得 12 护甲。下回合保留全部剩余护甲。',g=>{g.block(12);g.s.keepBlock=true;});
reviseCard('sponge','获得 6 护甲，恢复 2 生命，清除自身 1 层剧毒。',g=>{g.block(6);g.heal(2);CardPool.clean(1)(g);},g=>g.s.p.poison>0);
reviseCard('coral','获得 8 护甲，恢复 2 生命。',g=>{g.block(8);g.heal(2);});
reviseCard('fireflysquid','发光 +1 层，然后造成 5 伤害。',g=>{g.buff('glow',1);g.hit(5);});
reviseCard('deepglow','发光 +2 层，抽 2 张牌。',g=>{g.buff('glow',2);g.draw(2);});
reviseCard('flashlight','造成 6 伤害。若至少有 3 层发光，再造成 3 伤害。',g=>{g.hit(6);if(g.s.buffs.glow>=3) g.hit(3);},g=>g.s.buffs.glow>=3);
reviseCard('lumenburst','消耗全部发光。造成 11 伤害，每消耗 1 层再加 3。',g=>{
  const spent=g.s.buffs.glow;g.buff('glow',-spent);g.hit(11+3*spent);
},g=>g.s.buffs.glow>0);
reviseCard('brilliant','获得 3 层发光、12 护甲，恢复等同于当前发光层数的生命。',g=>{const n=g.buff('glow',3);g.block(12);g.heal(n);});
reviseCard('seaspider','造成 6 伤害，每层虫群再加 1。',g=>g.hit(6+g.s.buffs.swarm),g=>g.s.buffs.swarm>0);
reviseCard('isopod','造成 11 伤害，再获得等同于虫群层数的护甲。',g=>{g.hit(11);g.block(g.s.buffs.swarm);},g=>g.s.buffs.swarm>0);
reviseCard('swarmtide','消耗全部虫群，造成 16 伤害，每消耗 1 层再加 2。',g=>{
  const spent=g.s.buffs.swarm;g.buff('swarm',-spent);g.hit(16+spent*2);
},g=>g.s.buffs.swarm>0);
reviseCard('zoox','获得 1 护甲，成长 +1 层。',g=>{g.block(1);g.buff('growth',1);});
reviseCard('seafan','获得 5 护甲，成长 +1 层。',g=>{g.block(5);g.buff('growth',1);});
reviseCard('ecoecho','获得 13 护甲，恢复 3 生命，每层成长多恢复 1 生命。',g=>{g.block(13);g.heal(3+g.s.buffs.growth);},g=>g.s.buffs.growth>0);
reviseCard('symbiowing','成长 +2 层，获得 10 护甲。',g=>{g.buff('growth',2);g.block(10);});
reviseCard('storm','造成 16 伤害。消耗全部麻痹，每层使伤害增加 3。',g=>{
  const spent=g.s.e.shock;g.s.e.shock-=spent;g.hit(16+spent*3);
},g=>g.s.e.shock>0);
reviseCard('voltcore','施加 2 层麻痹并获得 7 护甲。部署一层电核。本场每轮第一次卡牌伤害，每层电核与每层麻痹相乘后增加等量伤害。',g=>{g.shk(2);g.block(7);g.s.voltPower++;});
reviseCard('tidecall','切换潮汐。进入涨潮时抽 2 张牌。',g=>{g.changeTide(!g.s.tide);if(g.s.tide) g.draw(2);},isLowTide);
reviseCard('tsunami','造成 20 伤害，切换潮汐。',g=>{g.hit(20);if(g.s.e.hp>0) g.changeTide(!g.s.tide);});
reviseCard('tidefull','进入涨潮，获得 4 护甲。',g=>{g.changeTide(true);g.block(4);},isLowTide);
CARDS.tidefull.c=1;
reviseCard('tideheart','本场每次由退潮进入涨潮时，额外造成 6 伤害。',g=>{g.s.tideBonus+=6;});
reviseCard('permafrost','获得 5 护甲。增加 1 层封冻，抵消敌方接下来一次行动。',g=>{g.block(5);g.s.skipEnemy++;});
reviseCard('abysshush','增加 1 层封冻，抵消敌方接下来一次行动，并施加 5 层麻痹。',g=>{g.s.skipEnemy++;g.shk(5);});
reviseCard('fog','本场敌方攻击伤害减半，每次打出叠加一层。',g=>{g.s.fog++;});
reviseCard('zeropoint','本场敌方攻击伤害减半，每次打出叠加一层。',g=>{g.s.frozenHalf++;});
reviseCard('paralyze','获得一层瘫痪。每层使敌人下一次攻击伤害减半，结算后清空。',g=>{g.s.paralyze++;});
for(const id of ['cuttlefish','filefish','seadragon','wonderpus','octopus','twin','mimicmaster']) CARDS[id].copyEffect=true;
reviseCard('cuttlefish',CARDS.cuttlefish.d,g=>{g.hit(5);if(g.s.e.hp>0) g.mimicHand(true);},g=>g.s.hand.some(id=>!CARDS[id].temporary&&!CARDS[id].copyEffect));
reviseCard('seadragon',CARDS.seadragon.d,g=>{g.block(9);g.mimicHand(false,c=>c.defense);},g=>g.s.hand.some(id=>CARDS[id].defense&&!CARDS[id].temporary&&!CARDS[id].copyEffect));
const defensiveIds=[
  'sandworm','barnacle','hermit','urchin','lobster','kingcrab','turtle','crab','horseshoe','giantclam','abalone',
  'manowar','kelp','sunfish','daphnia','bobtail','filefish','seadragon','inkveil','nautiluscard','combjelly',
  'glowtendril','brilliant','seapig','glass2','icewall','permafrost','sponge','coral','seafan','tubeworm',
  'reef','ecoecho','symbiowing','tidepool','sanddollar','lowtide','voltcore',
  'echo_02','echo_05','echo_08','echo_10','breakwater_02','breakwater_04','breakwater_06','breakwater_10',
  'dive_01','dive_03','dive_04','dive_07','dive_08','dive_10','migrate_01','migrate_04','migrate_06','migrate_07','migrate_10',
  'molt_01','molt_03','molt_05','molt_06','molt_08','molt_10','stress_02','stress_03','stress_05','stress_06',
  'stress_07','stress_08','stress_09','stress_10','hide_01','hide_03','hide_04','hide_06','hide_09','hide_10',
  'flank_03','flank_04','flank_05','flank_06','flank_07','flank_10','vent_01','vent_03','vent_04',
  'vent_05','vent_07','vent_08','vent_09','vent_10','net_02','net_04','net_06','net_09','net_10',
  'filter_01','filter_03','filter_04','filter_06','filter_08','filter_09','filter_10','pursuit_02','pursuit_03','pursuit_06','pursuit_07'
];
for(const id of defensiveIds) CARDS[id].defense=true;
for(const id of ['filefish','twin','wonderpus','octopus','mimicmaster']){
  CARDS[id].activates=(g,c)=>{
    const candidates=id==='octopus'||id==='mimicmaster'?g.s.lastPlayed.slice(-(id==='octopus'?1:3)):g.s.hand;
    return candidates.some(token=>{
      const other=CARDS[token];
      return token!==c.id&&!other.temporary&&!other.copyEffect&&(id!=='wonderpus'||other.c===0);
    });
  };
}
CARDS.mirrorink.activates=g=>g.s.discard.length>0;
CARDS.voltchain.activates=g=>g.s.e.shock>1;

// Species artwork added from licensed images. See artwork.html.
for(const id of [
  'abalone','abysshush','amphipod','barnacle','breakwater_01','breakwater_02','breakwater_03','breakwater_04',
  'breakwater_05','breakwater_06','breakwater_07','breakwater_08','breakwater_09','brilliant','copepod','crab',
  'deepglow','dive_01','dive_02','dive_03','dive_05','dive_06','dive_07','dive_08',
  'dive_09','dive_10','echo_01','echo_02','echo_03','echo_04','echo_05','echo_06',
  'echo_07','echo_08','echo_09','echo_10','ecoecho','filefish','filter_01','filter_02',
  'filter_03','filter_04','filter_05','filter_06','filter_07','filter_08','filter_09','filter_10',
  'flank_01','flank_02','flank_03','flank_04','flank_05','flank_06','flank_07','flank_08',
  'flank_09','flank_10','flyingfish','glowtendril','hermit','hide_01','hide_02','hide_03',
  'hide_04','hide_05','hide_06','hide_08','hide_09','hide_10','icewall','inkstain',
  'inkveil','lanternfish','lowtide','lumenburst','mangrove','migrate_01','migrate_02','migrate_03',
  'migrate_04','migrate_05','migrate_06','migrate_08','migrate_09','migrate_10','mimicmaster','mirrorink',
  'molt_01','molt_02','molt_03','molt_04','molt_05','molt_06','molt_07','molt_08',
  'molt_09','molt_10','moray','net_01','net_02','net_04','net_05','net_06',
  'net_07','net_08','net_09','net_10','paralyze','permafrost','pursuit_01','pursuit_02',
  'pursuit_03','pursuit_04','pursuit_05','pursuit_06','pursuit_07','pursuit_08','pursuit_09','pursuit_10',
  'reef','seabutterfly','shockwave','sponge','static','storm','stress_01','stress_02',
  'stress_03','stress_04','stress_05','stress_06','stress_07','stress_08','stress_09','stress_10',
  'surf','surge','swarmtide','symbiowing','thunder','tidecall','tidefull','tideheart',
  'tidepool','toxicbloom','tsunami','twin','vent_02','vent_05','vent_06','vent_07',
  'vent_10','voltchain',
]) CARDS[id].img='species/'+id;
