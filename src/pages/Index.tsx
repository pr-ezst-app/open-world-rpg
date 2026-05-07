import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ── Images ──────────────────────────────────────────────────────────────────
const HERO_IMG   = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/cbc66433-d373-49f3-88a8-f5d8abaca119.jpg";
const KING_IMG   = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/5ea4b054-df9b-425e-b866-3af5e7348628.jpg";
const COMBAT_IMG = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/ea0ecde0-a693-4f24-9049-c71b6c8041ce.jpg";

// ── Types ────────────────────────────────────────────────────────────────────
type GameScreen = "title" | "world" | "npc" | "battle" | "victory" | "defeat" | "ending";
type BattlePhase = "player" | "enemy" | "animating";

interface Skill {
  id: string; name: string; icon: string;
  chiCost: number; damage: number; heal: number;
  effect: string; desc: string; unlocked: boolean;
}
interface Enemy {
  id: string; name: string; title: string;
  hp: number; maxHp: number; chi: number; maxChi: number;
  attack: number; defense: number; portrait: string;
  reward: string; isBoss?: boolean;
}
interface Region {
  id: string; name: string; type: string; icon: string;
  discovered: boolean; cleared: boolean; enemies: Enemy[];
  unlockAfter?: string;
}
interface BattleLog { text: string; type: "player" | "enemy" | "system"; }
interface NPCData {
  id: string; name: string; role: string; relation: string;
  portrait: string; color: string; affinity: number;
  dialogue: { trigger: string; lines: string[] }[];
}

// ── Game Data ────────────────────────────────────────────────────────────────
const PLAYER_SKILLS: Skill[] = [
  { id: "s_attack",  name: "Basic Strike",    icon: "Sword",         chiCost: 0,  damage: 18, heal: 0,  effect: "",          desc: "A swift blade strike. No chi required.", unlocked: true },
  { id: "s_wind",    name: "Wind Step",        icon: "Wind",          chiCost: 10, damage: 12, heal: 0,  effect: "dodge",     desc: "Dash past the enemy — 40% chance to evade their next attack.", unlocked: true },
  { id: "s_crimson", name: "Crimson Fang",     icon: "Zap",           chiCost: 20, damage: 52, heal: 0,  effect: "bleed",     desc: "Three rapid slashes. Causes bleed — enemy takes 8 dmg/turn.", unlocked: true },
  { id: "s_iron",    name: "Iron Body",        icon: "Shield",        chiCost: 15, damage: 0,  heal: 0,  effect: "guard",     desc: "Brace yourself — block 50% of next enemy hit.", unlocked: true },
  { id: "s_void",    name: "Void Palm",        icon: "Hand",          chiCost: 25, damage: 38, heal: 0,  effect: "stagger",   desc: "Chi palm strike — stuns the enemy, skipping their next turn.", unlocked: false },
  { id: "s_dragon",  name: "Rising Dragon",    icon: "Flame",         chiCost: 30, damage: 70, heal: 0,  effect: "launch",    desc: "An uppercut that launches the enemy — deals massive damage.", unlocked: false },
  { id: "s_meditate","name": "Meditate",        icon: "Sparkles",      chiCost: 0,  damage: 0,  heal: 25, effect: "chi_regen", desc: "Calm the mind. Restore 25 HP and 20 chi.", unlocked: true },
  { id: "s_thousand","name": "Thousand Cuts",  icon: "Swords",        chiCost: 40, damage: 110,heal: 0,  effect: "armor_break",desc: "50 strikes in 3 seconds — shatters enemy defense.", unlocked: false },
];

const ENEMIES_DB: Record<string, Enemy> = {
  bandit:   { id: "bandit",   name: "Road Bandit",       title: "Hired Blade",      hp: 55,  maxHp: 55,  chi: 0,  maxChi: 0,   attack: 12, defense: 3,  portrait: "⚔️", reward: "Wind Step mastered" },
  guard1:   { id: "guard1",   name: "Palace Guard",      title: "Imperial Soldier", hp: 80,  maxHp: 80,  chi: 20, maxChi: 40,  attack: 18, defense: 6,  portrait: "🛡️", reward: "Void Palm unlocked" },
  general:  { id: "general",  name: "Commander Zhao",    title: "The Iron Fist",    hp: 120, maxHp: 120, chi: 40, maxChi: 80,  attack: 22, defense: 10, portrait: "🗡️", reward: "Rising Dragon unlocked" },
  spy:      { id: "spy",      name: "Shadow Assassin",   title: "King's Shadow",    hp: 90,  maxHp: 90,  chi: 50, maxChi: 80,  attack: 28, defense: 4,  portrait: "🥷", reward: "Thousand Cuts unlocked" },
  king:     { id: "king",     name: "King Weilong",      title: "The Betrayer",     hp: 200, maxHp: 200, chi: 80, maxChi: 120, attack: 32, defense: 15, portrait: "👑", reward: "VICTORY", isBoss: true },
};

const INITIAL_REGIONS: Region[] = [
  {
    id: "mountains", name: "Dragon Spine Mountains", type: "Wilderness", icon: "Mountain",
    discovered: true, cleared: false,
    enemies: [{ ...ENEMIES_DB.bandit }, { ...ENEMIES_DB.bandit, id: "bandit2", name: "Bandit Chief", hp: 70, maxHp: 70, attack: 15 }],
  },
  {
    id: "temple", name: "Crimson Temple Ruins", type: "Dungeon", icon: "Flame",
    discovered: true, cleared: false,
    enemies: [{ ...ENEMIES_DB.guard1 }, { ...ENEMIES_DB.general }],
    unlockAfter: "mountains",
  },
  {
    id: "road", name: "Merchant Road East", type: "Open World", icon: "Route",
    discovered: true, cleared: false,
    enemies: [{ ...ENEMIES_DB.bandit }, { ...ENEMIES_DB.spy }],
    unlockAfter: "mountains",
  },
  {
    id: "mist", name: "Lake of Eternal Mist", type: "Exploration", icon: "Droplets",
    discovered: false, cleared: false,
    enemies: [{ ...ENEMIES_DB.spy }, { ...ENEMIES_DB.general, id: "gen2", name: "General Huo", hp: 140, maxHp: 140, attack: 25 }],
    unlockAfter: "temple",
  },
  {
    id: "tombs", name: "The Forgotten Tombs", type: "Dungeon", icon: "Skull",
    discovered: false, cleared: false,
    enemies: [{ ...ENEMIES_DB.guard1, id: "g2" }, { ...ENEMIES_DB.spy, id: "spy2" }],
    unlockAfter: "road",
  },
  {
    id: "imperial", name: "Imperial City Luoyang", type: "Urban", icon: "Building",
    discovered: false, cleared: false,
    enemies: [{ ...ENEMIES_DB.king }],
    unlockAfter: "mist",
  },
];

const NPCS_DATA: NPCData[] = [
  {
    id: "liang", name: "Master Liang Qinghe", role: "Wandering Hermit", relation: "Mentor",
    portrait: "🧙", color: "#c9a84c", affinity: 60,
    dialogue: [
      { trigger: "start",    lines: ["You reek of blood and vengeance, boy.", "Sit. Before you charge the Imperial City, you'll need more than rage.", "I will teach you what I know. In exchange — do not die stupidly."] },
      { trigger: "victory1", lines: ["You survived. Good.", "The mountains were easy. The road ahead will not be.", "Come back when you've cleared the temple. I'll have something for you."] },
      { trigger: "victory2", lines: ["You've grown strong, Wei Jian.", "The Void Palm — here. You've earned it.", "The king fears one thing: someone who has nothing left to lose. That is you."] },
    ],
  },
  {
    id: "xiaomei", name: "Yue Xiaomei", role: "Imperial Spy", relation: "Ambiguous",
    portrait: "🥀", color: "#c0392b", affinity: 40,
    dialogue: [
      { trigger: "start",    lines: ["I know who you are, General Wei.", "Don't reach for your blade. If I wanted you dead, you'd already be.", "The king... he's not what I expected either. Perhaps we can help each other."] },
      { trigger: "victory1", lines: ["You actually won. Interesting.", "The king has dispatched his Shadow Assassins. Be careful on the Merchant Road.", "I'll leave a side gate unlatched. You'll know which one."] },
    ],
  },
  {
    id: "daishan", name: "Brother Daishan", role: "Disgraced Commander", relation: "Rival / Ally",
    portrait: "⚔️", color: "#7a8a9a", affinity: 50,
    dialogue: [
      { trigger: "start",    lines: ["So you're still alive.", "I was the king's greatest weapon once. Now look at us both.", "I won't stop you from reaching Luoyang. But I won't help either. Not yet."] },
      { trigger: "victory2", lines: ["You cleared the temple AND the road? Without dying?", "...Fine. I'll watch your back in the Imperial City.", "Don't make me regret this, Wei Jian."] },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp(val: number, min: number, max: number) { return Math.max(min, Math.min(max, val)); }

export default function Index() {
  // ── Core game state ──
  const [screen, setScreen] = useState<GameScreen>("title");
  const [playerHP, setPlayerHP]   = useState(100);
  const [playerMaxHP]              = useState(100);
  const [playerChi, setPlayerChi] = useState(60);
  const [playerMaxChi]             = useState(100);
  const [playerSkills, setPlayerSkills] = useState<Skill[]>(PLAYER_SKILLS);
  const [chiPoints, setChiPoints] = useState(0);
  const [regions, setRegions]     = useState<Region[]>(INITIAL_REGIONS);
  const [clearedCount, setClearedCount] = useState(0);

  // ── Battle state ──
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [enemyQueue, setEnemyQueue]         = useState<Enemy[]>([]);
  const [currentEnemy, setCurrentEnemy]     = useState<Enemy | null>(null);
  const [battlePhase, setBattlePhase]       = useState<BattlePhase>("player");
  const [battleLog, setBattleLog]           = useState<BattleLog[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>("s_attack");
  const [playerDodge, setPlayerDodge]       = useState(false);
  const [playerGuard, setPlayerGuard]       = useState(false);
  const [playerBleed, setPlayerBleed]       = useState(0);
  const [enemyBleed, setEnemyBleed]         = useState(0);
  const [enemyStunned, setEnemyStunned]     = useState(false);
  const [enemyArmorBroken, setEnemyArmorBroken] = useState(false);
  const [shakeEnemy, setShakeEnemy]         = useState(false);
  const [shakePlayer, setShakePlayer]       = useState(false);
  const [battleResult, setBattleResult]     = useState<"victory" | "defeat" | null>(null);
  const [regionReward, setRegionReward]     = useState("");

  // ── NPC / dialogue state ──
  const [activeNPC, setActiveNPC]           = useState<NPCData | null>(null);
  const [dialogueLine, setDialogueLine]     = useState(0);
  const [npcTrigger, setNpcTrigger]         = useState("start");
  const [npcAffinities, setNpcAffinities]   = useState<Record<string, number>>({ liang: 60, xiaomei: 40, daishan: 50 });
  const [visitedNPCs, setVisitedNPCs]       = useState<Set<string>>(new Set());

  const logRef = useRef<HTMLDivElement>(null);

  // auto-scroll battle log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battleLog]);

  // ── Unlock regions after clearing ──
  useEffect(() => {
    setRegions(prev => prev.map(r => {
      if (!r.discovered && r.unlockAfter) {
        const prereq = prev.find(p => p.id === r.unlockAfter);
        if (prereq?.cleared) return { ...r, discovered: true };
      }
      return r;
    }));
  }, [clearedCount]);

  // ── Add to battle log ──
  const addLog = useCallback((text: string, type: BattleLog["type"] = "system") => {
    setBattleLog(prev => [...prev.slice(-40), { text, type }]);
  }, []);

  // ── Enter region ──
  const enterRegion = (region: Region) => {
    if (!region.discovered || region.cleared) return;
    const freshEnemies = region.enemies.map(e => ({ ...e, hp: e.maxHp }));
    setCurrentRegion(region);
    setEnemyQueue(freshEnemies.slice(1));
    setCurrentEnemy({ ...freshEnemies[0] });
    setBattleLog([{ text: `⚔️ Entering ${region.name}...`, type: "system" }]);
    setBattlePhase("player");
    setPlayerDodge(false);
    setPlayerGuard(false);
    setEnemyBleed(0);
    setPlayerBleed(0);
    setEnemyStunned(false);
    setEnemyArmorBroken(false);
    setBattleResult(null);
    setScreen("battle");
  };

  // ── Player uses a skill ──
  const executeSkill = useCallback((skill: Skill) => {
    if (battlePhase !== "player" || !currentEnemy || battleResult) return;
    if (playerChi < skill.chiCost) { addLog("Not enough chi!", "system"); return; }

    setBattlePhase("animating");

    // consume chi / apply skill
    setPlayerChi(prev => Math.max(0, prev - skill.chiCost));

    let newEnemyHP = currentEnemy.hp;
    let newPlayerHP = playerHP;
    const logs: BattleLog[] = [];

    // healing / chi regen
    if (skill.heal > 0) {
      const healed = clamp(skill.heal, 0, playerMaxHP - playerHP);
      newPlayerHP = clamp(playerHP + skill.heal, 0, playerMaxHP);
      logs.push({ text: `🌿 ${skill.name} — restored ${healed} HP`, type: "player" });
      if (skill.effect === "chi_regen") {
        setPlayerChi(prev => Math.min(playerMaxChi, prev + 20));
        logs.push({ text: `✨ Meditation restored 20 chi.`, type: "player" });
      }
    }

    // damage
    if (skill.damage > 0) {
      const def = enemyArmorBroken ? 0 : currentEnemy.defense;
      const rawDmg = skill.damage + Math.floor(Math.random() * 8) - 3;
      const finalDmg = Math.max(1, rawDmg - def);
      newEnemyHP = Math.max(0, currentEnemy.hp - finalDmg);
      logs.push({ text: `⚔️ ${skill.name} → ${currentEnemy.name} for ${finalDmg} damage!`, type: "player" });
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 400);
    }

    // effects
    if (skill.effect === "dodge")      { setPlayerDodge(true);  logs.push({ text: "💨 Wind Step — you'll dodge the next attack!", type: "player" }); }
    if (skill.effect === "guard")      { setPlayerGuard(true);  logs.push({ text: "🛡️ Iron Body — blocking next hit (50% reduction)!", type: "player" }); }
    if (skill.effect === "bleed")      { setEnemyBleed(3);      logs.push({ text: "🩸 Crimson Fang — enemy is bleeding! (3 turns)", type: "player" }); }
    if (skill.effect === "stagger")    { setEnemyStunned(true); logs.push({ text: "💫 Void Palm — enemy stunned! They'll skip a turn.", type: "player" }); }
    if (skill.effect === "armor_break"){ setEnemyArmorBroken(true); logs.push({ text: "💥 Thousand Cuts — enemy armor shattered!", type: "player" }); }

    setPlayerHP(newPlayerHP);
    logs.forEach(l => setBattleLog(prev => [...prev.slice(-40), l]));

    // check enemy death
    if (newEnemyHP <= 0) {
      handleEnemyDeath(newEnemyHP);
      return;
    }

    setCurrentEnemy(prev => prev ? { ...prev, hp: newEnemyHP } : null);

    // enemy bleed tick
    let finalEnemyHP = newEnemyHP;
    if (enemyBleed > 0) {
      finalEnemyHP = Math.max(0, newEnemyHP - 8);
      setCurrentEnemy(prev => prev ? { ...prev, hp: finalEnemyHP } : null);
      setBattleLog(prev => [...prev, { text: `🩸 Bleed deals 8 damage to ${currentEnemy.name}!`, type: "system" }]);
      setEnemyBleed(prev => prev - 1);
      if (finalEnemyHP <= 0) { handleEnemyDeath(finalEnemyHP); return; }
    }

    // player bleed tick
    if (playerBleed > 0) {
      setPlayerHP(prev => { const np = Math.max(0, prev - 5); if (np <= 0) handlePlayerDeath(); return np; });
      setBattleLog(prev => [...prev, { text: `🩸 Your wound deals 5 damage...`, type: "system" }]);
      setPlayerBleed(prev => prev - 1);
    }

    // enemy turn
    setTimeout(() => {
      if (enemyStunned) {
        setBattleLog(prev => [...prev, { text: `💫 ${currentEnemy.name} is stunned and loses their turn!`, type: "system" }]);
        setEnemyStunned(false);
        setBattlePhase("player");
        setPlayerChi(prev => Math.min(playerMaxChi, prev + 8)); // chi regen per turn
        return;
      }
      enemyAttack(finalEnemyHP);
    }, 700);
  }, [battlePhase, currentEnemy, playerChi, playerHP, enemyBleed, playerBleed, enemyStunned, enemyArmorBroken, battleResult]);

  // ── Enemy attack ──
  const enemyAttack = useCallback((enemyCurrentHP: number) => {
    if (!currentEnemy) return;
    const rawDmg = currentEnemy.attack + Math.floor(Math.random() * 10) - 4;
    let finalDmg = Math.max(1, rawDmg);

    if (playerDodge) {
      setBattleLog(prev => [...prev, { text: `💨 You dodged ${currentEnemy.name}'s attack!`, type: "system" }]);
      setPlayerDodge(false);
    } else if (playerGuard) {
      finalDmg = Math.floor(finalDmg * 0.5);
      setBattleLog(prev => [...prev, { text: `🛡️ Iron Body absorbs the blow — only ${finalDmg} damage!`, type: "enemy" }]);
      setPlayerGuard(false);
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 400);
      setPlayerHP(prev => {
        const np = Math.max(0, prev - finalDmg);
        if (np <= 0) handlePlayerDeath();
        return np;
      });
    } else {
      // random enemy special moves
      const special = Math.random();
      let attackName = "strikes";
      if (special > 0.8 && enemyCurrentHP < currentEnemy.maxHp * 0.4) {
        finalDmg = Math.floor(finalDmg * 1.5);
        attackName = "unleashes a DESPERATE STRIKE";
      }
      setBattleLog(prev => [...prev, { text: `💢 ${currentEnemy.name} ${attackName} for ${finalDmg} damage!`, type: "enemy" }]);
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 400);
      setPlayerHP(prev => {
        const np = Math.max(0, prev - finalDmg);
        if (np <= 0) handlePlayerDeath();
        return np;
      });
    }

    // chi regen per turn
    setPlayerChi(prev => Math.min(playerMaxChi, prev + 8));
    setBattlePhase("player");
  }, [currentEnemy, playerDodge, playerGuard]);

  // ── Enemy death ──
  const handleEnemyDeath = useCallback((hp: number) => {
    if (!currentEnemy || !currentRegion) return;
    setBattleLog(prev => [...prev, { text: `✅ ${currentEnemy.name} has been defeated!`, type: "system" }]);

    if (enemyQueue.length > 0) {
      // next enemy
      const next = { ...enemyQueue[0] };
      setTimeout(() => {
        setCurrentEnemy(next);
        setEnemyQueue(prev => prev.slice(1));
        setEnemyBleed(0);
        setEnemyStunned(false);
        setEnemyArmorBroken(false);
        setBattleLog(prev => [...prev, { text: `⚔️ ${next.name} enters the fray!`, type: "system" }]);
        setBattlePhase("player");
      }, 800);
    } else {
      // region cleared
      const reward = currentRegion.enemies[currentRegion.enemies.length - 1].reward;
      setRegionReward(reward);
      setBattleLog(prev => [...prev, { text: `🏆 Region cleared! Reward: ${reward}`, type: "system" }]);
      setBattleResult("victory");

      // unlock skill from reward
      if (reward.includes("Void Palm"))       setPlayerSkills(prev => prev.map(s => s.id === "s_void"     ? { ...s, unlocked: true } : s));
      if (reward.includes("Rising Dragon"))   setPlayerSkills(prev => prev.map(s => s.id === "s_dragon"   ? { ...s, unlocked: true } : s));
      if (reward.includes("Thousand Cuts"))   setPlayerSkills(prev => prev.map(s => s.id === "s_thousand" ? { ...s, unlocked: true } : s));

      if (currentEnemy.isBoss) {
        setBattleResult(null);
        setTimeout(() => setScreen("ending"), 1200);
        return;
      }

      // mark region cleared
      setRegions(prev => prev.map(r => r.id === currentRegion.id ? { ...r, cleared: true } : r));
      setClearedCount(prev => prev + 1);
      setChiPoints(prev => prev + 2);

      // heal a bit between fights
      setPlayerHP(prev => Math.min(playerMaxHP, prev + 20));
      setPlayerChi(prev => Math.min(playerMaxChi, prev + 30));
    }
  }, [currentEnemy, currentRegion, enemyQueue, playerMaxHP, playerMaxChi]);

  const handlePlayerDeath = useCallback(() => {
    setBattleLog(prev => [...prev, { text: `💀 Wei Jian falls...`, type: "system" }]);
    setBattleResult("defeat");
  }, []);

  const retryBattle = () => {
    setPlayerHP(playerMaxHP);
    setPlayerChi(60);
    if (currentRegion) enterRegion(currentRegion);
  };

  // ── NPC dialogue ──
  const openNPC = (npc: NPCData, trigger = "start") => {
    const t = visitedNPCs.has(npc.id) && trigger === "start" ? (clearedCount >= 2 ? "victory2" : clearedCount >= 1 ? "victory1" : "start") : trigger;
    const dlg = npc.dialogue.find(d => d.trigger === t) || npc.dialogue[0];
    setActiveNPC(npc);
    setNpcTrigger(t);
    setDialogueLine(0);
    setScreen("npc");
    setVisitedNPCs(prev => new Set([...prev, npc.id]));
    setNpcAffinities(prev => ({ ...prev, [npc.id]: Math.min(100, prev[npc.id] + 5) }));
  };

  const advanceDialogue = () => {
    if (!activeNPC) return;
    const dlg = activeNPC.dialogue.find(d => d.trigger === npcTrigger) || activeNPC.dialogue[0];
    if (dialogueLine < dlg.lines.length - 1) {
      setDialogueLine(prev => prev + 1);
    } else {
      setScreen("world");
      setActiveNPC(null);
    }
  };

  const selectedSkill = playerSkills.find(s => s.id === selectedSkillId) || playerSkills[0];

  // ── Render ────────────────────────────────────────────────────────────────

  // ── TITLE SCREEN ──
  if (screen === "title") return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden ink-bg">
      <div className="absolute inset-0">
        <img src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(139,0,0,0.15) 0%, rgba(10,10,10,0.97) 70%)" }} />
      </div>
      {[...Array(14)].map((_, i) => (
        <div key={i} className="particle" style={{ left: `${5 + i * 7}%`, bottom: `${5 + (i % 5) * 12}%`, animationDuration: `${4 + i * 0.6}s`, animationDelay: `${i * 0.25}s`, "--drift": `${(i % 2 ? 1 : -1) * (8 + i * 2)}px` } as React.CSSProperties} />
      ))}
      <div className="relative z-10 text-center px-8">
        <div className="font-cinzel-dec text-gold/40 text-sm tracking-[0.4em] mb-4 animate-flicker">A WUXIA RPG</div>
        <h1 className="font-cinzel-dec font-black gold-glow mb-2" style={{ fontSize: "clamp(3.5rem,10vw,8rem)", color: "var(--gold)" }}>刃道</h1>
        <h2 className="font-cinzel text-2xl md:text-4xl tracking-widest mb-2" style={{ color: "var(--parchment)" }}>PATH OF THE BLADE</h2>
        <p className="font-fell italic text-lg mb-12" style={{ color: "rgba(232,220,200,0.5)" }}>
          "A kingdom built on lies. A throne soaked in blood."
        </p>
        <div className="flex flex-col items-center gap-4">
          <button className="btn-blood text-base px-12 py-4" onClick={() => setScreen("world")}>
            Begin Your Journey
          </button>
          <p className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.25)" }}>
            HP: {playerHP} · Chi: {playerChi} · {playerSkills.filter(s=>s.unlocked).length} skills unlocked
          </p>
        </div>
      </div>
    </div>
  );

  // ── ENDING SCREEN ──
  if (screen === "ending") return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden ink-bg">
      <div className="absolute inset-0">
        <img src={KING_IMG} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0" style={{ background: "rgba(10,10,10,0.85)" }} />
      </div>
      <div className="relative z-10 text-center px-8 max-w-xl">
        <div className="font-cinzel-dec text-6xl text-gold gold-glow mb-6">Victory</div>
        <h2 className="font-cinzel text-xl text-parchment tracking-widest mb-6">THE KING IS DEAD</h2>
        <p className="font-fell italic text-lg leading-loose mb-8" style={{ color: "rgba(232,220,200,0.65)" }}>
          The throne room falls silent. King Weilong's body crumples to the jade floor.
          Wei Jian stands among the wreckage of an empire — and feels nothing but the cold truth:
          justice, at last, has been served.
        </p>
        <p className="font-cinzel text-sm tracking-widest text-gold/60 mb-10">
          "It is done."
        </p>
        <button className="btn-wuxia" onClick={() => { setScreen("title"); setPlayerHP(100); setPlayerChi(60); setRegions(INITIAL_REGIONS); setClearedCount(0); setChiPoints(0); setPlayerSkills(PLAYER_SKILLS); }}>
          Play Again
        </button>
      </div>
    </div>
  );

  // ── NPC SCREEN ──
  if (screen === "npc" && activeNPC) {
    const dlg = activeNPC.dialogue.find(d => d.trigger === npcTrigger) || activeNPC.dialogue[0];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center ink-bg px-4 relative">
        <div className="absolute inset-0 opacity-10">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 w-full max-w-2xl">
          {/* NPC portrait area */}
          <div className="flex items-end gap-6 mb-6">
            <div className="w-20 h-20 rounded-sm flex items-center justify-center text-5xl flex-shrink-0"
              style={{ background: `${activeNPC.color}22`, border: `2px solid ${activeNPC.color}55` }}>
              {activeNPC.portrait}
            </div>
            <div>
              <div className="font-cinzel text-xs tracking-[0.3em] mb-1" style={{ color: activeNPC.color }}>{activeNPC.role}</div>
              <div className="font-cinzel text-xl text-gold">{activeNPC.name}</div>
            </div>
          </div>
          {/* Dialogue box */}
          <div className="card-wuxia rounded-sm p-8 cursor-pointer relative" onClick={advanceDialogue}
            style={{ border: `1px solid ${activeNPC.color}44`, minHeight: "160px" }}>
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-sm" style={{ background: activeNPC.color }} />
            <p className="font-fell italic text-xl leading-loose" style={{ color: "rgba(232,220,200,0.9)" }}>
              "{dlg.lines[dialogueLine]}"
            </p>
            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-1.5">
                {dlg.lines.map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === dialogueLine ? activeNPC.color : "rgba(255,255,255,0.15)" }} />
                ))}
              </div>
              <span className="font-cinzel text-xs tracking-widest animate-pulse" style={{ color: activeNPC.color }}>
                {dialogueLine < dlg.lines.length - 1 ? "Click to continue →" : "Click to close"}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 justify-center">
            <Icon name="Heart" size={12} className="text-gold/40" />
            <span className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.3)" }}>
              Affinity: {npcAffinities[activeNPC.id]}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── WORLD MAP ──
  if (screen === "world") return (
    <div className="min-h-screen ink-bg">
      {/* Top HUD */}
      <div className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between" style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="font-cinzel-dec text-gold text-sm tracking-widest animate-flicker">刃道</div>
        <div className="flex items-center gap-6">
          {/* HP */}
          <div className="flex items-center gap-2">
            <Icon name="Heart" size={12} className="text-blood" />
            <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(playerHP / playerMaxHP) * 100}%`, background: "linear-gradient(90deg, #8b0000, #c0392b)" }} />
            </div>
            <span className="font-cinzel text-xs text-blood">{playerHP}/{playerMaxHP}</span>
          </div>
          {/* Chi */}
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" size={12} className="text-gold" />
            <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(playerChi / playerMaxChi) * 100}%`, background: "linear-gradient(90deg, #c9a84c, #e8cc7a)" }} />
            </div>
            <span className="font-cinzel text-xs text-gold">{playerChi}/{playerMaxChi}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}>
            <Icon name="Star" size={11} className="text-gold" />
            <span className="font-cinzel text-xs text-gold">{chiPoints} chi pts</span>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 py-8">
        <div className="mb-8">
          <h2 className="font-cinzel text-2xl text-gold tracking-widest mb-1">WORLD MAP</h2>
          <p className="font-noto text-sm" style={{ color: "rgba(232,220,200,0.4)" }}>
            {clearedCount === 0 ? "Your journey begins. Clear regions to unlock new areas." : `${clearedCount} region${clearedCount > 1 ? "s" : ""} cleared — new paths open.`}
          </p>
        </div>

        {/* Regions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {regions.map((r) => (
            <div key={r.id}
              onClick={() => r.discovered && !r.cleared ? enterRegion(r) : undefined}
              className={`card-wuxia rounded-sm p-5 transition-all duration-300 relative overflow-hidden
                ${r.discovered && !r.cleared ? "cursor-pointer hover:border-blood/50 hover:shadow-lg" : ""}
                ${!r.discovered ? "opacity-35 cursor-not-allowed" : ""}
                ${r.cleared ? "opacity-60 cursor-default" : ""}
              `}>
              {r.cleared && <div className="absolute top-3 right-3"><span className="font-cinzel text-xs text-gold/60 tracking-widest">✓ CLEARED</span></div>}
              {!r.discovered && <div className="absolute inset-0 flex items-center justify-center"><Icon name="Lock" size={24} className="text-white/10" /></div>}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ background: r.cleared ? "rgba(201,168,76,0.1)" : r.discovered ? "rgba(139,0,0,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${r.cleared ? "rgba(201,168,76,0.25)" : r.discovered ? "rgba(192,57,43,0.4)" : "rgba(255,255,255,0.08)"}` }}>
                  <Icon name={r.icon} size={16} className={r.cleared ? "text-gold/50" : r.discovered ? "text-blood" : "text-white/20"} fallback="MapPin" />
                </div>
                <div>
                  <div className="font-cinzel text-sm tracking-wide" style={{ color: r.discovered ? "var(--parchment)" : "rgba(232,220,200,0.3)" }}>{r.name}</div>
                  <div className="font-cinzel text-xs mt-0.5 tracking-widest" style={{ color: "rgba(201,168,76,0.4)" }}>{r.type}</div>
                </div>
              </div>
              {r.discovered && !r.cleared && (
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.4)" }}>
                    {r.enemies.length} {r.enemies.length === 1 ? "enemy" : "enemies"}
                  </span>
                  <span className="font-cinzel text-xs text-blood tracking-widest">→ Enter</span>
                </div>
              )}
              {!r.discovered && (
                <p className="font-cinzel text-xs tracking-widest text-white/20">— Undiscovered —</p>
              )}
            </div>
          ))}
        </div>

        {/* NPCs row */}
        <div className="mb-4">
          <h3 className="font-cinzel text-sm tracking-[0.3em] text-gold/50 mb-4">CHARACTERS — SPEAK TO THEM</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {NPCS_DATA.map(npc => (
              <div key={npc.id} onClick={() => openNPC(npc)}
                className="card-wuxia rounded-sm p-4 cursor-pointer group hover:border-gold/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${npc.color}20`, border: `1px solid ${npc.color}40` }}>
                    {npc.portrait}
                  </div>
                  <div>
                    <div className="font-cinzel text-xs text-gold tracking-wide">{npc.name}</div>
                    <div className="font-cinzel text-xs mt-0.5" style={{ color: "rgba(232,220,200,0.3)" }}>{npc.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="h-full rounded-full" style={{ width: `${npcAffinities[npc.id]}%`, background: npc.color }} />
                  </div>
                  <span className="font-cinzel text-xs" style={{ color: npc.color }}>{npcAffinities[npc.id]}%</span>
                </div>
                <div className="mt-2 font-cinzel text-xs text-blood/60 tracking-widest group-hover:text-gold transition-colors">
                  → Speak
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── BATTLE SCREEN ──
  if (screen === "battle") return (
    <div className="min-h-screen ink-bg flex flex-col">
      {/* Battle HUD */}
      <div className="px-6 py-3 flex items-center justify-between" style={{ background: "rgba(10,10,10,0.97)", borderBottom: "1px solid rgba(139,0,0,0.25)" }}>
        <button onClick={() => setScreen("world")} className="font-cinzel text-xs tracking-widest text-white/30 hover:text-gold transition-colors flex items-center gap-1">
          <Icon name="ChevronLeft" size={12} /> Retreat
        </button>
        <div className="font-cinzel text-xs tracking-[0.3em] text-gold/50">{currentRegion?.name}</div>
        <div className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.3)" }}>
          Enemies: {enemyQueue.length + (currentEnemy ? 1 : 0)}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-0">
        {/* LEFT: battle arena */}
        <div className="flex-1 flex flex-col px-6 py-6">
          {/* Enemy + Player stat bars */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Enemy */}
            <div className={`card-wuxia rounded-sm p-4 transition-all ${shakeEnemy ? "translate-x-2" : ""}`} style={{ transitionDuration: "0.1s" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{currentEnemy?.portrait}</span>
                <div>
                  <div className="font-cinzel text-xs text-blood tracking-wide">{currentEnemy?.name}</div>
                  <div className="font-cinzel text-xs" style={{ color: "rgba(232,220,200,0.3)" }}>{currentEnemy?.title}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Heart" size={10} className="text-blood" />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${currentEnemy ? (currentEnemy.hp / currentEnemy.maxHp) * 100 : 0}%`, background: "linear-gradient(90deg,#8b0000,#c0392b)" }} />
                </div>
                <span className="font-cinzel text-xs text-blood">{currentEnemy?.hp}/{currentEnemy?.maxHp}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {enemyBleed > 0 && <span className="font-cinzel text-xs px-1 rounded" style={{ background: "rgba(139,0,0,0.3)", color: "#c0392b" }}>🩸 Bleed {enemyBleed}</span>}
                {enemyStunned && <span className="font-cinzel text-xs px-1 rounded" style={{ background: "rgba(201,168,76,0.2)", color: "#c9a84c" }}>💫 Stun</span>}
                {enemyArmorBroken && <span className="font-cinzel text-xs px-1 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(232,220,200,0.5)" }}>💥 No Armor</span>}
              </div>
            </div>

            {/* Player */}
            <div className={`card-wuxia rounded-sm p-4 transition-all ${shakePlayer ? "-translate-x-2" : ""}`} style={{ transitionDuration: "0.1s" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🗡️</span>
                <div>
                  <div className="font-cinzel text-xs text-gold tracking-wide">Wei Jian</div>
                  <div className="font-cinzel text-xs" style={{ color: "rgba(232,220,200,0.3)" }}>Fallen General</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Heart" size={10} className="text-blood" />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(playerHP / playerMaxHP) * 100}%`, background: "linear-gradient(90deg,#8b0000,#c0392b)" }} />
                </div>
                <span className="font-cinzel text-xs text-blood">{playerHP}/{playerMaxHP}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Sparkles" size={10} className="text-gold" />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(playerChi / playerMaxChi) * 100}%`, background: "linear-gradient(90deg,#c9a84c,#e8cc7a)" }} />
                </div>
                <span className="font-cinzel text-xs text-gold">{playerChi}/{playerMaxChi}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {playerDodge && <span className="font-cinzel text-xs px-1 rounded" style={{ background: "rgba(201,168,76,0.2)", color: "#c9a84c" }}>💨 Dodge</span>}
                {playerGuard && <span className="font-cinzel text-xs px-1 rounded" style={{ background: "rgba(122,138,154,0.3)", color: "#7a8a9a" }}>🛡️ Guard</span>}
                {playerBleed > 0 && <span className="font-cinzel text-xs px-1 rounded" style={{ background: "rgba(139,0,0,0.3)", color: "#c0392b" }}>🩸 Bleed {playerBleed}</span>}
              </div>
            </div>
          </div>

          {/* Battle log */}
          <div ref={logRef} className="flex-1 rounded-sm p-4 mb-4 overflow-y-auto space-y-1" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", minHeight: "160px", maxHeight: "220px" }}>
            {battleLog.map((l, i) => (
              <p key={i} className="font-noto text-xs leading-relaxed"
                style={{ color: l.type === "player" ? "var(--gold-light)" : l.type === "enemy" ? "#e88;" : "rgba(232,220,200,0.5)" }}>
                {l.text}
              </p>
            ))}
            {battlePhase === "enemy" && !battleResult && (
              <p className="font-cinzel text-xs text-white/30 animate-pulse">Enemy is thinking...</p>
            )}
          </div>

          {/* Victory / Defeat overlays */}
          {battleResult === "victory" && (
            <div className="rounded-sm p-5 text-center mb-4" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}>
              <div className="font-cinzel-dec text-2xl text-gold gold-glow mb-2">Victory!</div>
              <p className="font-cinzel text-xs tracking-widest text-gold/70 mb-1">Reward: {regionReward}</p>
              <p className="font-cinzel text-xs tracking-widest mb-4" style={{ color: "rgba(232,220,200,0.4)" }}>+2 Chi Points · +20 HP restored</p>
              <button className="btn-wuxia" onClick={() => setScreen("world")}>Return to World Map</button>
            </div>
          )}
          {battleResult === "defeat" && (
            <div className="rounded-sm p-5 text-center mb-4" style={{ background: "rgba(139,0,0,0.15)", border: "1px solid rgba(139,0,0,0.4)" }}>
              <div className="font-cinzel-dec text-2xl text-blood blood-glow mb-2">Defeated</div>
              <p className="font-fell italic mb-4" style={{ color: "rgba(232,220,200,0.5)" }}>"The blade falters... but the spirit endures."</p>
              <div className="flex gap-3 justify-center">
                <button className="btn-blood" onClick={retryBattle}>Try Again</button>
                <button className="btn-wuxia" onClick={() => setScreen("world")}>Retreat</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: skill selector */}
        <div className="w-full lg:w-72 flex flex-col px-4 pb-4 lg:py-6" style={{ borderLeft: "1px solid rgba(201,168,76,0.08)" }}>
          <div className="font-cinzel text-xs tracking-[0.3em] text-gold/40 mb-3">SELECT SKILL</div>
          <div className="space-y-2 flex-1 overflow-y-auto pr-1" style={{ maxHeight: "360px" }}>
            {playerSkills.filter(s => s.unlocked).map(skill => (
              <div key={skill.id}
                onClick={() => setSelectedSkillId(skill.id)}
                className={`rounded-sm p-3 cursor-pointer transition-all duration-200 border ${selectedSkillId === skill.id ? "border-gold/50" : "border-white/5 hover:border-gold/25"}`}
                style={{ background: selectedSkillId === skill.id ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
                    style={{ background: selectedSkillId === skill.id ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.05)" }}>
                    <Icon name={skill.icon} size={13} className={selectedSkillId === skill.id ? "text-gold" : "text-white/40"} fallback="Sword" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-cinzel text-xs tracking-wide truncate" style={{ color: selectedSkillId === skill.id ? "var(--gold)" : "rgba(232,220,200,0.7)" }}>{skill.name}</div>
                    <div className="font-cinzel text-xs" style={{ color: "rgba(232,220,200,0.3)" }}>
                      {skill.chiCost > 0 ? `${skill.chiCost} chi` : "Free"}{skill.damage > 0 ? ` · ${skill.damage} dmg` : ""}{skill.heal > 0 ? ` · +${skill.heal} HP` : ""}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected skill detail */}
          <div className="mt-3 rounded-sm p-3 mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.1)" }}>
            <div className="font-cinzel text-xs text-gold mb-1">{selectedSkill.name}</div>
            <p className="font-noto text-xs leading-relaxed" style={{ color: "rgba(232,220,200,0.45)" }}>{selectedSkill.desc}</p>
          </div>

          {/* USE SKILL button */}
          <button
            onClick={() => { if (!battleResult && battlePhase === "player") executeSkill(selectedSkill); }}
            disabled={!!battleResult || battlePhase !== "player" || playerChi < selectedSkill.chiCost}
            className={`btn-blood w-full text-center py-3 ${(!!battleResult || battlePhase !== "player" || playerChi < selectedSkill.chiCost) ? "opacity-40 cursor-not-allowed" : ""}`}>
            {battlePhase === "player" ? `USE: ${selectedSkill.name}` : battlePhase === "animating" ? "..." : "Enemy Turn..."}
          </button>
          {selectedSkill.chiCost > playerChi && (
            <p className="font-cinzel text-xs text-center mt-1" style={{ color: "rgba(192,57,43,0.7)" }}>Need {selectedSkill.chiCost - playerChi} more chi</p>
          )}
        </div>
      </div>
    </div>
  );

  return null;
}