import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

// ── Images ──────────────────────────────────────────────────────────────────
const HERO_IMG    = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/cbc66433-d373-49f3-88a8-f5d8abaca119.jpg";
const KING_IMG    = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/5ea4b054-df9b-425e-b866-3af5e7348628.jpg";
const COMBAT_IMG  = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/ea0ecde0-a693-4f24-9049-c71b6c8041ce.jpg";
const NPC_LIANG    = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/c14b95e5-427b-47b9-8f8a-e72b0d519a11.jpg";
const NPC_XIAOMEI  = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/c8c9a5c3-432b-450d-b67b-ce0458dde835.jpg";
const NPC_DAISHAN  = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/6198cecd-0c80-4abc-af9a-035ea8ebbe15.jpg";
const ENM_BANDIT   = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/71f17d9b-58d4-4cfc-9851-0041aaeb9880.jpg";
const ENM_GUARD    = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/be7ff5ff-3ba2-4374-8786-adafc3db4b7e.jpg";
const ENM_GENERAL  = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/99c9fe05-8bc9-4033-88f9-7a3e0623bdac.jpg";
const ENM_SPY      = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/dcac210e-dcb9-4571-ba8a-d5ffbf0e8969.jpg";
const ENM_KING     = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/f875f069-ae80-4e25-a32d-52c567e708e6.jpg";

// ── Types ────────────────────────────────────────────────────────────────────
type GameScreen = "title" | "world" | "characters" | "npc" | "battle" | "victory" | "defeat" | "ending";
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
  bandit:   { id: "bandit",   name: "Road Bandit",       title: "Hired Blade",      hp: 55,  maxHp: 55,  chi: 0,  maxChi: 0,   attack: 12, defense: 3,  portrait: ENM_BANDIT,  reward: "Wind Step mastered" },
  guard1:   { id: "guard1",   name: "Palace Guard",      title: "Imperial Soldier", hp: 80,  maxHp: 80,  chi: 20, maxChi: 40,  attack: 18, defense: 6,  portrait: ENM_GUARD,   reward: "Void Palm unlocked" },
  general:  { id: "general",  name: "Commander Zhao",    title: "The Iron Fist",    hp: 120, maxHp: 120, chi: 40, maxChi: 80,  attack: 22, defense: 10, portrait: ENM_GENERAL, reward: "Rising Dragon unlocked" },
  spy:      { id: "spy",      name: "Shadow Assassin",   title: "King's Shadow",    hp: 90,  maxHp: 90,  chi: 50, maxChi: 80,  attack: 28, defense: 4,  portrait: ENM_SPY,     reward: "Thousand Cuts unlocked" },
  king:     { id: "king",     name: "King Weilong",      title: "The Betrayer",     hp: 200, maxHp: 200, chi: 80, maxChi: 120, attack: 32, defense: 15, portrait: ENM_KING,    reward: "VICTORY", isBoss: true },
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
    portrait: NPC_LIANG, color: "#c9a84c", affinity: 60,
    dialogue: [
      { trigger: "start",    lines: ["You reek of blood and vengeance, boy.", "Sit. Before you charge the Imperial City, you'll need more than rage.", "I will teach you what I know. In exchange — do not die stupidly."] },
      { trigger: "victory1", lines: ["You survived. Good.", "The mountains were easy. The road ahead will not be.", "Come back when you've cleared the temple. I'll have something for you."] },
      { trigger: "victory2", lines: ["You've grown strong, Wei Jian.", "The Void Palm — here. You've earned it.", "The king fears one thing: someone who has nothing left to lose. That is you."] },
    ],
  },
  {
    id: "xiaomei", name: "Yue Xiaomei", role: "Imperial Spy", relation: "Ambiguous",
    portrait: NPC_XIAOMEI, color: "#c0392b", affinity: 40,
    dialogue: [
      { trigger: "start",    lines: ["I know who you are, General Wei.", "Don't reach for your blade. If I wanted you dead, you'd already be.", "The king... he's not what I expected either. Perhaps we can help each other."] },
      { trigger: "victory1", lines: ["You actually won. Interesting.", "The king has dispatched his Shadow Assassins. Be careful on the Merchant Road.", "I'll leave a side gate unlatched. You'll know which one."] },
    ],
  },
  {
    id: "daishan", name: "Brother Daishan", role: "Disgraced Commander", relation: "Rival / Ally",
    portrait: NPC_DAISHAN, color: "#7a8a9a", affinity: 50,
    dialogue: [
      { trigger: "start",    lines: ["So you're still alive.", "I was the king's greatest weapon once. Now look at us both.", "I won't stop you from reaching Luoyang. But I won't help either. Not yet."] },
      { trigger: "victory2", lines: ["You cleared the temple AND the road? Without dying?", "...Fine. I'll watch your back in the Imperial City.", "Don't make me regret this, Wei Jian."] },
    ],
  },
];

// ── Characters World Data ────────────────────────────────────────────────────
interface CharacterEntry {
  id: string; name: string; title: string; role: string;
  faction: string; factionColor: string;
  portrait: string; bgColor: string; accentColor: string;
  weapon: string; specialty: string;
  lore: string; quote: string;
  stats?: { atk?: number; def?: number; hp?: number; chi?: number };
  isEnemy?: boolean; isBoss?: boolean; isPlayer?: boolean;
  npcId?: string;
}

const ALL_CHARACTERS: CharacterEntry[] = [
  {
    id: "weijian", name: "Wei Jian", title: "The Fallen General",
    role: "Protagonist", faction: "Exiled", factionColor: "#c9a84c",
    portrait: HERO_IMG, bgColor: "#1a0a0a", accentColor: "#c9a84c",
    weapon: "Dao Sword", specialty: "Adaptive Combat",
    lore: "Once the empire's greatest general, Wei Jian was stripped of rank and cast out after refusing to massacre a village on the king's orders. He returns now — not for glory, but for justice.",
    quote: "I did not come back to reclaim a throne. I came back to burn one.",
    stats: { hp: 100, chi: 100 },
    isPlayer: true,
  },
  {
    id: "liang", name: "Master Liang Qinghe", title: "The Wandering Hermit",
    role: "Mentor", faction: "Unaligned", factionColor: "#c9a84c",
    portrait: NPC_LIANG, bgColor: "#0f0d06", accentColor: "#c9a84c",
    weapon: "Jade Staff", specialty: "Chi Cultivation",
    lore: "Once the greatest swordsman the kingdom had ever seen, Liang Qinghe vanished after the previous king's death. He resurfaces now, drawn to Wei Jian's path — whether as a teacher or a test remains unclear.",
    quote: "A blade that does not know when to rest is a blade that will shatter.",
    npcId: "liang",
  },
  {
    id: "xiaomei", name: "Yue Xiaomei", title: "The Imperial Spy",
    role: "Ambiguous Ally", faction: "Imperial Court", factionColor: "#c0392b",
    portrait: NPC_XIAOMEI, bgColor: "#130505", accentColor: "#c0392b",
    weapon: "Hidden Daggers", specialty: "Infiltration & Poison",
    lore: "Xiaomei serves the king — or did. After witnessing what he ordered done to the northern villages, something cracked. She walks both sides of the line now, feeding Wei Jian intelligence while still playing her role at court.",
    quote: "I have been a spy so long I've forgotten what loyalty feels like. Perhaps that makes me useful.",
    npcId: "xiaomei",
  },
  {
    id: "daishan", name: "Brother Daishan", title: "The Disgraced Commander",
    role: "Rival / Ally", faction: "Former Imperial", factionColor: "#7a8a9a",
    portrait: NPC_DAISHAN, bgColor: "#080c10", accentColor: "#7a8a9a",
    weapon: "War Glaive", specialty: "Heavy Armor Warfare",
    lore: "Daishan was the king's iron fist — until he refused one order too many. Stripped of command but too dangerous to execute, he now wanders the borderlands. He owes Wei Jian nothing. He might help him anyway.",
    quote: "I'm not your sword. But if you're headed where I think you're headed — I'll walk beside you.",
    npcId: "daishan",
  },
  {
    id: "bandit_e", name: "Road Bandit", title: "Hired Blade",
    role: "Enemy", faction: "Brigands", factionColor: "#8b6914",
    portrait: ENM_BANDIT, bgColor: "#0d0a02", accentColor: "#8b6914",
    weapon: "Rusty Dao", specialty: "Ambush",
    lore: "Desperate men driven from their villages by imperial tax collectors. They prey on travelers through the Dragon Spine pass — but loyalty goes to whoever pays most. Or bleeds least.",
    quote: "Hand over your coin and walk away with your fingers.",
    stats: { hp: 55, atk: 12, def: 3 },
    isEnemy: true,
  },
  {
    id: "guard_e", name: "Palace Guard", title: "Imperial Soldier",
    role: "Enemy", faction: "Imperial Legion", factionColor: "#c0392b",
    portrait: ENM_GUARD, bgColor: "#100305", accentColor: "#8b1a1a",
    weapon: "Spear & Shield", specialty: "Formation Combat",
    lore: "The empire's foot soldiers — drilled, disciplined, and loyal to a fault. Most were peasants a year ago. Now they stand between the king and his enemies, never questioning why.",
    quote: "Stand down. This is your only warning.",
    stats: { hp: 80, atk: 18, def: 6 },
    isEnemy: true,
  },
  {
    id: "general_e", name: "Commander Zhao", title: "The Iron Fist",
    role: "Elite Enemy", faction: "Imperial Legion", factionColor: "#c0392b",
    portrait: ENM_GENERAL, bgColor: "#0d0203", accentColor: "#a0281a",
    weapon: "Iron War Hammer", specialty: "Crushing Blows",
    lore: "Zhao rose through the ranks by breaking everything in his path — enemies, officers, and principles alike. He serves the king because cruelty has found a comfortable home there. He has no ideology. Only force.",
    quote: "I don't hate you, Wei Jian. I'll just enjoy this.",
    stats: { hp: 120, atk: 22, def: 10 },
    isEnemy: true,
  },
  {
    id: "spy_e", name: "Shadow Assassin", title: "King's Shadow",
    role: "Elite Enemy", faction: "Shadow Bureau", factionColor: "#2d2d3a",
    portrait: ENM_SPY, bgColor: "#05050d", accentColor: "#4a4a6a",
    weapon: "Twin Short Blades", specialty: "Assassination & Poison",
    lore: "The Shadow Bureau has no names, no faces, no records. They exist only in results — bodies found without wounds, generals who simply disappear. This one has been assigned Wei Jian personally.",
    quote: "...",
    stats: { hp: 90, atk: 28, def: 4 },
    isEnemy: true,
  },
  {
    id: "king_e", name: "King Weilong", title: "The Betrayer",
    role: "Final Boss", faction: "Imperial Throne", factionColor: "#c9a84c",
    portrait: ENM_KING, bgColor: "#0d0800", accentColor: "#c9a84c",
    weapon: "Jade Scepter / Hidden Sword", specialty: "Chi Mastery & Treachery",
    lore: "Weilong was not always a tyrant. Once he and Wei Jian fought side by side. Then power showed him what he truly was. He ordered the massacres. He signed the exile. He built his throne on betrayal — and he will defend it with everything he has.",
    quote: "You were my greatest general, Wei Jian. Now you are simply an obstacle.",
    stats: { hp: 200, atk: 32, def: 15, chi: 120 },
    isEnemy: true, isBoss: true,
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

  // ── Characters gallery state ──
  const [activeChar, setActiveChar]         = useState<CharacterEntry | null>(null);
  const [charFilter, setCharFilter]         = useState<"all" | "ally" | "enemy">("all");

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

  // ── CHARACTERS SCREEN ──
  if (screen === "characters") {
    const filtered = ALL_CHARACTERS.filter(c => {
      if (charFilter === "ally")  return !c.isEnemy;
      if (charFilter === "enemy") return !!c.isEnemy;
      return true;
    });

    return (
      <div className="min-h-screen ink-bg flex flex-col" style={{ background: "radial-gradient(ellipse at 50% 0%, #120808 0%, #0a0a0a 60%)" }}>
        {/* Header */}
        <div className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
          style={{ background: "rgba(10,10,10,0.97)", borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
          <button onClick={() => { setActiveChar(null); setScreen("world"); }}
            className="font-cinzel text-xs tracking-widest flex items-center gap-1 transition-colors"
            style={{ color: "rgba(232,220,200,0.35)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,220,200,0.35)")}>
            <Icon name="ChevronLeft" size={12} /> World Map
          </button>
          <div className="font-cinzel-dec text-gold text-sm tracking-widest animate-flicker">CHARACTERS</div>
          {/* Filter tabs */}
          <div className="flex gap-1">
            {(["all", "ally", "enemy"] as const).map(f => (
              <button key={f} onClick={() => { setCharFilter(f); setActiveChar(null); }}
                className="font-cinzel text-xs px-3 py-1 rounded-sm tracking-widest transition-all"
                style={{
                  background: charFilter === f ? "rgba(201,168,76,0.15)" : "transparent",
                  color: charFilter === f ? "var(--gold)" : "rgba(232,220,200,0.3)",
                  border: `1px solid ${charFilter === f ? "rgba(201,168,76,0.35)" : "transparent"}`,
                }}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── LEFT: character grid ── */}
          <div className={`flex-shrink-0 overflow-y-auto p-4 transition-all duration-300 ${activeChar ? "w-full md:w-80" : "w-full"}`}>
            <div className={`grid gap-3 ${activeChar ? "grid-cols-2 md:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}`}>
              {filtered.map(char => (
                <div key={char.id}
                  onClick={() => setActiveChar(activeChar?.id === char.id ? null : char)}
                  className="relative overflow-hidden rounded-sm cursor-pointer group transition-all duration-300"
                  style={{
                    aspectRatio: "2/3",
                    border: `1px solid ${activeChar?.id === char.id ? char.accentColor + "80" : "rgba(255,255,255,0.06)"}`,
                    boxShadow: activeChar?.id === char.id ? `0 0 20px ${char.accentColor}30` : "none",
                  }}>
                  {/* Portrait */}
                  <img src={char.portrait} alt={char.name}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: `brightness(${activeChar?.id === char.id ? "0.9" : "0.6"}) contrast(1.1) saturate(${char.isEnemy ? "0.7" : "0.85"})` }} />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${char.bgColor}f0 0%, ${char.bgColor}80 40%, transparent 70%)` }} />
                  {/* Role badge */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-sm font-cinzel"
                    style={{ background: `${char.accentColor}25`, border: `1px solid ${char.accentColor}40`, color: char.accentColor, fontSize: "0.5rem", letterSpacing: "0.12em" }}>
                    {char.isPlayer ? "PLAYER" : char.isBoss ? "BOSS" : char.isEnemy ? "ENEMY" : "ALLY"}
                  </div>
                  {/* Name */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <div className="font-cinzel tracking-wide leading-tight" style={{ color: "var(--parchment)", fontSize: "0.65rem" }}>{char.name}</div>
                    <div className="font-cinzel mt-0.5" style={{ color: char.accentColor, fontSize: "0.55rem", opacity: 0.85 }}>{char.title}</div>
                  </div>
                  {/* Active indicator */}
                  {activeChar?.id === char.id && (
                    <div className="absolute inset-y-0 right-0 w-0.5" style={{ background: char.accentColor }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: character detail ── */}
          {activeChar && (
            <div className="hidden md:flex flex-1 flex-col overflow-y-auto relative" style={{ borderLeft: `1px solid ${activeChar.accentColor}20` }}>
              {/* Large portrait bg */}
              <div className="relative flex-shrink-0" style={{ height: "55vh" }}>
                <img src={activeChar.portrait} alt={activeChar.name}
                  className="w-full h-full object-cover object-top"
                  style={{ filter: "brightness(0.55) contrast(1.15) saturate(0.7)" }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.3) 50%, transparent 80%)` }} />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to right, transparent 60%, rgba(10,10,10,0.7) 100%)` }} />
                {/* Faction badge */}
                <div className="absolute top-5 right-5 px-3 py-1.5 rounded-sm font-cinzel text-xs tracking-widest"
                  style={{ background: `${activeChar.factionColor}18`, border: `1px solid ${activeChar.factionColor}40`, color: activeChar.factionColor }}>
                  {activeChar.faction}
                </div>
                {/* Name overlay */}
                <div className="absolute bottom-6 left-8">
                  <div className="font-cinzel text-xs tracking-[0.35em] mb-2" style={{ color: activeChar.accentColor }}>{activeChar.role.toUpperCase()}</div>
                  <h2 className="font-cinzel text-4xl tracking-wide mb-1" style={{ color: "var(--parchment)" }}>{activeChar.name}</h2>
                  <div className="font-cinzel text-sm tracking-widest" style={{ color: "rgba(232,220,200,0.4)" }}>{activeChar.title}</div>
                </div>
              </div>

              {/* Detail content */}
              <div className="px-8 py-6 flex-1">
                {/* Quote */}
                <div className="mb-6 pl-4 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: activeChar.accentColor }} />
                  <p className="font-fell italic text-xl leading-loose" style={{ color: "rgba(232,220,200,0.8)" }}>"{activeChar.quote}"</p>
                </div>

                {/* Stats row */}
                {activeChar.stats && (
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {activeChar.stats.hp  !== undefined && (
                      <div className="text-center p-3 rounded-sm" style={{ background: "rgba(139,0,0,0.15)", border: "1px solid rgba(139,0,0,0.2)" }}>
                        <div className="font-cinzel text-xl text-blood">{activeChar.stats.hp}</div>
                        <div className="font-cinzel text-xs text-blood/50 tracking-widest mt-0.5">HP</div>
                      </div>
                    )}
                    {activeChar.stats.atk !== undefined && (
                      <div className="text-center p-3 rounded-sm" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.15)" }}>
                        <div className="font-cinzel text-xl text-gold">{activeChar.stats.atk}</div>
                        <div className="font-cinzel text-xs text-gold/50 tracking-widest mt-0.5">ATK</div>
                      </div>
                    )}
                    {activeChar.stats.def !== undefined && (
                      <div className="text-center p-3 rounded-sm" style={{ background: "rgba(122,138,154,0.12)", border: "1px solid rgba(122,138,154,0.15)" }}>
                        <div className="font-cinzel text-xl" style={{ color: "#7a8a9a" }}>{activeChar.stats.def}</div>
                        <div className="font-cinzel text-xs tracking-widest mt-0.5" style={{ color: "rgba(122,138,154,0.5)" }}>DEF</div>
                      </div>
                    )}
                    {activeChar.stats.chi !== undefined && (
                      <div className="text-center p-3 rounded-sm" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.1)" }}>
                        <div className="font-cinzel text-xl text-gold">{activeChar.stats.chi}</div>
                        <div className="font-cinzel text-xs text-gold/40 tracking-widest mt-0.5">CHI</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Weapon & specialty */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="font-cinzel text-xs tracking-widest mb-1" style={{ color: "rgba(232,220,200,0.3)" }}>WEAPON</div>
                    <div className="font-cinzel text-sm" style={{ color: "var(--parchment)" }}>{activeChar.weapon}</div>
                  </div>
                  <div className="p-3 rounded-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="font-cinzel text-xs tracking-widest mb-1" style={{ color: "rgba(232,220,200,0.3)" }}>SPECIALTY</div>
                    <div className="font-cinzel text-sm" style={{ color: "var(--parchment)" }}>{activeChar.specialty}</div>
                  </div>
                </div>

                {/* Lore */}
                <div className="mb-6">
                  <div className="font-cinzel text-xs tracking-[0.35em] mb-3" style={{ color: activeChar.accentColor, opacity: 0.7 }}>LORE</div>
                  <p className="font-noto text-sm leading-loose" style={{ color: "rgba(232,220,200,0.55)" }}>{activeChar.lore}</p>
                </div>

                {/* Speak button for NPCs */}
                {activeChar.npcId && (
                  <button
                    onClick={() => { const npc = NPCS_DATA.find(n => n.id === activeChar.npcId); if (npc) { setActiveChar(null); openNPC(npc); } }}
                    className="btn-wuxia w-full text-center">
                    Speak with {activeChar.name.split(" ")[0]}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mobile detail panel */}
          {activeChar && (
            <div className="md:hidden fixed inset-0 z-50 ink-bg overflow-y-auto" style={{ background: "rgba(10,10,10,0.98)" }}>
              <div className="relative" style={{ height: "45vh" }}>
                <img src={activeChar.portrait} alt={activeChar.name} className="w-full h-full object-cover object-top" style={{ filter: "brightness(0.55) saturate(0.7)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 60%)" }} />
                <button onClick={() => setActiveChar(null)}
                  className="absolute top-4 right-4 font-cinzel text-xs tracking-widest px-3 py-1 rounded-sm"
                  style={{ background: "rgba(0,0,0,0.7)", color: "rgba(232,220,200,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  ✕ Close
                </button>
                <div className="absolute bottom-5 left-5">
                  <div className="font-cinzel text-xs mb-1" style={{ color: activeChar.accentColor }}>{activeChar.role}</div>
                  <h2 className="font-cinzel text-2xl" style={{ color: "var(--parchment)" }}>{activeChar.name}</h2>
                  <div className="font-cinzel text-xs mt-1" style={{ color: "rgba(232,220,200,0.4)" }}>{activeChar.title}</div>
                </div>
              </div>
              <div className="p-5">
                <p className="font-fell italic text-lg leading-loose mb-5 pl-3" style={{ color: "rgba(232,220,200,0.8)", borderLeft: `2px solid ${activeChar.accentColor}` }}>"{activeChar.quote}"</p>
                {activeChar.stats && (
                  <div className="flex gap-2 mb-5 flex-wrap">
                    {Object.entries(activeChar.stats).map(([k, v]) => (
                      <div key={k} className="px-3 py-2 rounded-sm text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", minWidth: "56px" }}>
                        <div className="font-cinzel text-lg text-gold">{v}</div>
                        <div className="font-cinzel text-xs text-gold/40 tracking-widest">{k.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mb-4">
                  <div className="font-cinzel text-xs tracking-widest mb-2" style={{ color: "rgba(232,220,200,0.3)" }}>WEAPON · {activeChar.weapon}</div>
                  <div className="font-cinzel text-xs tracking-widest mb-4" style={{ color: "rgba(232,220,200,0.3)" }}>SPECIALTY · {activeChar.specialty}</div>
                  <p className="font-noto text-sm leading-loose" style={{ color: "rgba(232,220,200,0.5)" }}>{activeChar.lore}</p>
                </div>
                {activeChar.npcId && (
                  <button onClick={() => { const npc = NPCS_DATA.find(n => n.id === activeChar.npcId); if (npc) { setActiveChar(null); openNPC(npc); } }}
                    className="btn-wuxia w-full text-center mt-4">
                    Speak with {activeChar.name.split(" ")[0]}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen flex ink-bg overflow-hidden relative" onClick={advanceDialogue} style={{ cursor: "pointer" }}>
        {/* Full bleed portrait LEFT */}
        <div className="hidden md:block w-2/5 relative flex-shrink-0">
          <img src={activeNPC.portrait} alt={activeNPC.name} className="w-full h-full object-cover object-top" style={{ filter: "brightness(0.75) contrast(1.1)" }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to right, transparent 60%, rgba(10,10,10,1) 100%)` }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 40%)` }} />
          {/* Color accent glow on portrait edge */}
          <div className="absolute inset-y-0 right-0 w-1" style={{ background: activeNPC.color, opacity: 0.6 }} />
        </div>

        {/* RIGHT: dialogue content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-12 relative">
          {/* Background texture */}
          <div className="absolute inset-0 opacity-5">
            <img src={HERO_IMG} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 max-w-xl">
            {/* Back button */}
            <button onClick={(e) => { e.stopPropagation(); setScreen("world"); setActiveNPC(null); }}
              className="font-cinzel text-xs tracking-widest mb-10 flex items-center gap-1 transition-colors"
              style={{ color: "rgba(232,220,200,0.3)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,220,200,0.3)")}>
              <Icon name="ChevronLeft" size={12} /> Leave
            </button>

            {/* Mobile portrait */}
            <div className="md:hidden w-20 h-20 rounded-sm overflow-hidden mb-6 flex-shrink-0"
              style={{ border: `2px solid ${activeNPC.color}55` }}>
              <img src={activeNPC.portrait} alt={activeNPC.name} className="w-full h-full object-cover object-top" />
            </div>

            {/* Name / role */}
            <div className="font-cinzel text-xs tracking-[0.35em] mb-2" style={{ color: activeNPC.color }}>{activeNPC.role.toUpperCase()}</div>
            <h2 className="font-cinzel text-3xl md:text-4xl mb-2 tracking-wide" style={{ color: "var(--parchment)" }}>{activeNPC.name}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm mb-10"
              style={{ background: `${activeNPC.color}15`, border: `1px solid ${activeNPC.color}30` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: activeNPC.color }} />
              <span className="font-cinzel text-xs tracking-widest" style={{ color: activeNPC.color }}>
                {NPCS_DATA.find(n => n.id === activeNPC.id)?.relation}
              </span>
            </div>

            {/* Dialogue bubble */}
            <div className="relative mb-8">
              <div className="absolute -left-4 top-0 bottom-0 w-0.5 rounded-full" style={{ background: `linear-gradient(to bottom, ${activeNPC.color}, transparent)` }} />
              <p className="font-fell italic text-2xl md:text-3xl leading-relaxed pl-4"
                style={{ color: "rgba(232,220,200,0.92)", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
                "{dlg.lines[dialogueLine]}"
              </p>
            </div>

            {/* Progress dots + prompt */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {dlg.lines.map((_, i) => (
                  <div key={i} className="rounded-full transition-all duration-300"
                    style={{ width: i === dialogueLine ? "20px" : "6px", height: "6px", background: i === dialogueLine ? activeNPC.color : "rgba(255,255,255,0.15)" }} />
                ))}
              </div>
              <span className="font-cinzel text-xs tracking-widest animate-pulse"
                style={{ color: activeNPC.color }}>
                {dialogueLine < dlg.lines.length - 1 ? "Click anywhere to continue →" : "Click to return"}
              </span>
            </div>

            {/* Affinity bar */}
            <div className="mt-10 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex justify-between mb-2">
                <span className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.3)" }}>Affinity</span>
                <span className="font-cinzel text-xs" style={{ color: activeNPC.color }}>{npcAffinities[activeNPC.id]}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${npcAffinities[activeNPC.id]}%`, background: `linear-gradient(to right, ${activeNPC.color}88, ${activeNPC.color})` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── WORLD MAP ──
  // Region node positions on the SVG canvas (800x540)
  const MAP_NODES: Record<string, { x: number; y: number; labelX?: number; labelY?: number }> = {
    mountains: { x: 180, y: 120 },
    temple:    { x: 90,  y: 260 },
    road:      { x: 310, y: 240 },
    mist:      { x: 110, y: 390 },
    tombs:     { x: 450, y: 350 },
    imperial:  { x: 620, y: 200 },
  };
  // Paths between connected nodes
  const MAP_PATHS = [
    ["mountains", "temple"],
    ["mountains", "road"],
    ["temple",    "mist"],
    ["road",      "tombs"],
    ["mist",      "imperial"],
    ["tombs",     "imperial"],
  ];

  if (screen === "world") return (
    <div className="min-h-screen ink-bg flex flex-col" style={{ background: "radial-gradient(ellipse at 30% 20%, #1a0a0a 0%, #0a0a0a 70%)" }}>
      {/* Top HUD */}
      <div className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between flex-wrap gap-3"
        style={{ background: "rgba(10,10,10,0.97)", borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
        <div className="font-cinzel-dec text-gold text-sm tracking-widest animate-flicker">刃道</div>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <Icon name="Heart" size={12} className="text-blood" />
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(playerHP / playerMaxHP) * 100}%`, background: "linear-gradient(90deg,#8b0000,#c0392b)" }} />
            </div>
            <span className="font-cinzel text-xs text-blood">{playerHP}/{playerMaxHP}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" size={12} className="text-gold" />
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(playerChi / playerMaxChi) * 100}%`, background: "linear-gradient(90deg,#c9a84c,#e8cc7a)" }} />
            </div>
            <span className="font-cinzel text-xs text-gold">{playerChi}/{playerMaxChi}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}>
            <Icon name="Star" size={11} className="text-gold" />
            <span className="font-cinzel text-xs text-gold">{chiPoints} chi pts</span>
          </div>
          <div className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.25)" }}>
            {clearedCount}/6 cleared
          </div>
          <button onClick={() => { setActiveChar(null); setCharFilter("all"); setScreen("characters"); }}
            className="font-cinzel text-xs px-3 py-1.5 rounded-sm tracking-widest transition-all"
            style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: "rgba(201,168,76,0.7)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--gold)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(201,168,76,0.7)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.2)"; }}>
            Characters
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-0">
        {/* ── SVG MAP ── */}
        <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 min-h-[400px]">
          {/* Parchment texture overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a84c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />

          <div className="w-full max-w-3xl">
            <div className="font-cinzel text-xs tracking-[0.4em] text-gold/30 mb-4 text-center">— THE KINGDOM OF WEI —</div>
            <svg viewBox="0 0 800 480" className="w-full" style={{ filter: "drop-shadow(0 0 40px rgba(139,0,0,0.1))" }}>
              {/* Ink-wash terrain blobs */}
              <defs>
                <radialGradient id="glow-gold" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#c9a84c" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="glow-blood" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c0392b" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#c0392b" stopOpacity="0"/>
                </radialGradient>
                <radialGradient id="glow-grey" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7a8a9a" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#7a8a9a" stopOpacity="0"/>
                </radialGradient>
                <filter id="blur-sm">
                  <feGaussianBlur stdDeviation="1.5"/>
                </filter>
              </defs>

              {/* Decorative terrain shapes */}
              {/* Northern mountains */}
              <path d="M100,60 L160,10 L220,55 L280,20 L340,60 L370,80 L300,90 L200,85 L100,80 Z"
                fill="rgba(201,168,76,0.04)" stroke="rgba(201,168,76,0.08)" strokeWidth="1"/>
              {/* River / road */}
              <path d="M310,240 Q380,270 450,300 Q550,340 620,200"
                fill="none" stroke="rgba(122,138,154,0.12)" strokeWidth="6" strokeLinecap="round"/>
              {/* Southern terrain */}
              <ellipse cx="150" cy="430" rx="120" ry="50" fill="rgba(139,0,0,0.04)" />
              <ellipse cx="500" cy="420" rx="100" ry="40" fill="rgba(201,168,76,0.03)" />
              {/* Imperial city aura */}
              <circle cx="620" cy="200" r="70" fill="url(#glow-gold)" opacity="0.5"/>
              {/* Decorative compass rose bottom right */}
              <g transform="translate(740,430)" opacity="0.15">
                <circle cx="0" cy="0" r="22" fill="none" stroke="#c9a84c" strokeWidth="0.5"/>
                <path d="M0,-18 L3,-5 L0,0 L-3,-5 Z" fill="#c9a84c"/>
                <path d="M0,18 L3,5 L0,0 L-3,5 Z" fill="#c9a84c" opacity="0.5"/>
                <path d="M18,0 L5,3 L0,0 L5,-3 Z" fill="#c9a84c" opacity="0.5"/>
                <path d="M-18,0 L-5,3 L0,0 L-5,-3 Z" fill="#c9a84c" opacity="0.5"/>
                <text x="0" y="-25" textAnchor="middle" fontSize="7" fill="#c9a84c" fontFamily="serif">N</text>
              </g>

              {/* ── PATH LINES ── */}
              {MAP_PATHS.map(([fromId, toId], pi) => {
                const from = MAP_NODES[fromId];
                const to   = MAP_NODES[toId];
                const fromR = regions.find(r => r.id === fromId);
                const toR   = regions.find(r => r.id === toId);
                const active = fromR?.discovered && toR?.discovered;
                const midX = (from.x + to.x) / 2 + (pi % 2 === 0 ? 20 : -20);
                const midY = (from.y + to.y) / 2 + (pi % 2 === 0 ? -15 : 15);
                return (
                  <g key={`${fromId}-${toId}`}>
                    {/* Shadow */}
                    <path d={`M${from.x},${from.y} Q${midX},${midY} ${to.x},${to.y}`}
                      fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={active ? "none" : "6 5"} filter="url(#blur-sm)"/>
                    {/* Main path */}
                    <path d={`M${from.x},${from.y} Q${midX},${midY} ${to.x},${to.y}`}
                      fill="none"
                      stroke={active ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)"}
                      strokeWidth={active ? "2" : "1.5"}
                      strokeLinecap="round"
                      strokeDasharray={active ? "none" : "6 5"}/>
                  </g>
                );
              })}

              {/* ── REGION NODES ── */}
              {regions.map((r) => {
                const pos = MAP_NODES[r.id];
                if (!pos) return null;
                const isActive = r.discovered && !r.cleared;
                const isCleared = r.cleared;
                const isHidden = !r.discovered;
                const isBoss = r.id === "imperial";
                const nodeR = isBoss ? 28 : 22;

                return (
                  <g key={r.id} style={{ cursor: isActive ? "pointer" : "default" }}
                    onClick={() => isActive ? enterRegion(r) : undefined}>
                    {/* Glow halo for active nodes */}
                    {isActive && (
                      <circle cx={pos.x} cy={pos.y} r={nodeR + 16}
                        fill={isBoss ? "url(#glow-gold)" : "url(#glow-blood)"} />
                    )}
                    {/* Node ring */}
                    <circle cx={pos.x} cy={pos.y} r={nodeR + 5}
                      fill="none"
                      stroke={isHidden ? "rgba(255,255,255,0.05)" : isCleared ? "rgba(201,168,76,0.3)" : isBoss ? "rgba(201,168,76,0.6)" : "rgba(192,57,43,0.45)"}
                      strokeWidth={isBoss ? "1.5" : "1"}
                      strokeDasharray={isHidden ? "3 3" : "none"}/>
                    {/* Node fill */}
                    <circle cx={pos.x} cy={pos.y} r={nodeR}
                      fill={isHidden ? "rgba(255,255,255,0.03)" : isCleared ? "rgba(201,168,76,0.12)" : isBoss ? "rgba(201,168,76,0.18)" : "rgba(139,0,0,0.25)"}
                      stroke={isHidden ? "rgba(255,255,255,0.08)" : isCleared ? "rgba(201,168,76,0.4)" : isBoss ? "rgba(201,168,76,0.7)" : "rgba(192,57,43,0.6)"}
                      strokeWidth="1.5"/>
                    {/* Icon text */}
                    <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                      fontSize={isBoss ? "18" : "15"}
                      style={{ userSelect: "none" }}>
                      {isHidden ? "?" : isBoss ? "👑" : isCleared ? "✓" : r.type === "Dungeon" ? "⚔" : r.type === "Wilderness" ? "⛰" : r.type === "Exploration" ? "〜" : "⊕"}
                    </text>
                    {/* Label */}
                    {!isHidden && (
                      <text x={pos.x} y={pos.y + nodeR + 16} textAnchor="middle"
                        fontSize={isBoss ? "10" : "9"}
                        fill={isCleared ? "rgba(201,168,76,0.55)" : isBoss ? "#e8cc7a" : "rgba(232,220,200,0.75)"}
                        fontFamily="'Cinzel', serif"
                        style={{ userSelect: "none" }}>
                        {r.name.length > 20 ? r.name.slice(0, 18) + "…" : r.name}
                      </text>
                    )}
                    {/* "ENTER" label for active */}
                    {isActive && (
                      <text x={pos.x} y={pos.y + nodeR + 26} textAnchor="middle"
                        fontSize="7.5" fill="rgba(192,57,43,0.8)" fontFamily="'Cinzel', serif"
                        style={{ userSelect: "none" }}>
                        [ Click to Enter ]
                      </text>
                    )}
                    {/* Enemy count badge */}
                    {isActive && (
                      <g>
                        <circle cx={pos.x + nodeR - 2} cy={pos.y - nodeR + 2} r="9"
                          fill="#8b0000" stroke="rgba(192,57,43,0.6)" strokeWidth="1"/>
                        <text x={pos.x + nodeR - 2} y={pos.y - nodeR + 3} textAnchor="middle"
                          dominantBaseline="middle" fontSize="7" fill="#e8dcc8"
                          fontFamily="'Cinzel', serif" style={{ userSelect: "none" }}>
                          {r.enemies.length}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Map title */}
              <text x="400" y="468" textAnchor="middle" fontSize="8"
                fill="rgba(201,168,76,0.2)" fontFamily="'Cinzel Decorative', serif"
                style={{ userSelect: "none" }}>
                PATH OF THE BLADE — WEI KINGDOM
              </text>
            </svg>
          </div>
        </div>

        {/* ── CHARACTERS SIDEBAR ── */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col" style={{ borderLeft: "1px solid rgba(201,168,76,0.08)", background: "rgba(0,0,0,0.3)" }}>
          <div className="px-5 pt-6 pb-3 flex items-center justify-between">
            <div>
              <div className="font-cinzel text-xs tracking-[0.35em] text-gold/40 mb-1">CHARACTERS</div>
              <div className="h-px w-full" style={{ background: "linear-gradient(to right, rgba(201,168,76,0.3), transparent)" }} />
            </div>
            <button onClick={() => { setActiveChar(null); setCharFilter("all"); setScreen("characters"); }}
              className="font-cinzel text-xs tracking-widest transition-colors flex items-center gap-1 flex-shrink-0 ml-3"
              style={{ color: "rgba(201,168,76,0.4)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(201,168,76,0.4)")}>
              All →
            </button>
          </div>
          <div className="flex-1 px-4 pb-6 space-y-3 overflow-y-auto">
            {NPCS_DATA.map(npc => (
              <div key={npc.id} onClick={() => openNPC(npc)}
                className="group cursor-pointer rounded-sm overflow-hidden transition-all duration-300 relative"
                style={{ border: `1px solid ${npc.color}20` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${npc.color}50`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${npc.color}20`; }}>
                {/* Portrait strip */}
                <div className="relative h-36 overflow-hidden">
                  <img src={npc.portrait} alt={npc.name}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: "brightness(0.65) contrast(1.1) saturate(0.8)" }} />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.2) 60%)` }} />
                  {/* Color accent bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: npc.color, opacity: 0.5 }} />
                  {/* Name overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="font-cinzel text-xs tracking-wide" style={{ color: "var(--parchment)" }}>{npc.name}</div>
                    <div className="font-cinzel text-xs mt-0.5" style={{ color: npc.color, opacity: 0.8 }}>{npc.role}</div>
                  </div>
                  {/* Relation badge */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-sm font-cinzel text-xs"
                    style={{ background: `${npc.color}22`, color: npc.color, border: `1px solid ${npc.color}33`, fontSize: "0.55rem", letterSpacing: "0.1em" }}>
                    {npc.relation}
                  </div>
                </div>
                {/* Affinity + speak */}
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${npcAffinities[npc.id]}%`, background: `linear-gradient(to right, ${npc.color}66, ${npc.color})` }} />
                    </div>
                    <span className="font-cinzel text-xs" style={{ color: npc.color, fontSize: "0.6rem" }}>{npcAffinities[npc.id]}%</span>
                  </div>
                  <div className="font-cinzel text-xs tracking-widest transition-colors" style={{ color: "rgba(232,220,200,0.3)", fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                    → SPEAK
                  </div>
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
            <div className={`card-wuxia rounded-sm p-4 transition-all overflow-hidden relative ${shakeEnemy ? "translate-x-2" : ""}`} style={{ transitionDuration: "0.1s" }}>
              {/* Background portrait */}
              {currentEnemy && (
                <div className="absolute inset-0 pointer-events-none">
                  <img src={currentEnemy.portrait} alt="" className="w-full h-full object-cover object-top opacity-10" style={{ filter: "saturate(0.3)" }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,10,0.7), rgba(10,10,10,0.9))" }} />
                </div>
              )}
              <div className="relative flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-sm overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(192,57,43,0.4)" }}>
                  {currentEnemy && <img src={currentEnemy.portrait} alt="" className="w-full h-full object-cover object-top" style={{ filter: "brightness(0.8) saturate(0.7)" }} />}
                </div>
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
            <div className={`card-wuxia rounded-sm p-4 transition-all overflow-hidden relative ${shakePlayer ? "-translate-x-2" : ""}`} style={{ transitionDuration: "0.1s" }}>
              <div className="absolute inset-0 pointer-events-none">
                <img src={HERO_IMG} alt="" className="w-full h-full object-cover object-top opacity-10" style={{ filter: "saturate(0.3)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,10,0.7), rgba(10,10,10,0.9))" }} />
              </div>
              <div className="relative flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-sm overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(201,168,76,0.4)" }}>
                  <img src={HERO_IMG} alt="" className="w-full h-full object-cover object-top" style={{ filter: "brightness(0.8) saturate(0.7)" }} />
                </div>
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