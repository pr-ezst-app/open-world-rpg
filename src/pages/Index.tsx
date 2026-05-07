import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMG = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/cbc66433-d373-49f3-88a8-f5d8abaca119.jpg";
const KING_IMG = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/5ea4b054-df9b-425e-b866-3af5e7348628.jpg";
const COMBAT_IMG = "https://cdn.ezst.app/projects/b1ea146d-e53a-49bf-ae0c-a4c1c62e9f48/files/ea0ecde0-a693-4f24-9049-c71b6c8041ce.jpg";

const NAV_ITEMS = ["Story", "World", "Combat", "Skills", "NPCs"];

const STORY_CHAPTERS = [
  {
    act: "ACT I",
    title: "The Oath of Blood",
    desc: "Wei Jian returns to his homeland to find it burning. The kingdom he served lies in ashes — and the king's betrayal has taken everything he loved. Swear your oath on the ruins of the old temple.",
    status: "Available",
    img: HERO_IMG,
  },
  {
    act: "ACT II",
    title: "The Wandering Blade",
    desc: "Cross the Dragon Spine Mountains. Seek the three hidden masters of the Forbidden Styles. Each will test your resolve — body, mind, and soul — before revealing their ultimate techniques.",
    status: "Available",
    img: COMBAT_IMG,
  },
  {
    act: "ACT III",
    title: "Audience with the Tyrant",
    desc: "The gates of the Imperial City open only for the invited — or the feared. Infiltrate the court, expose the king's treachery before the assembled lords, then face the throne alone.",
    status: "Locked",
    img: KING_IMG,
  },
];

const SKILLS = [
  {
    tier: "Foundation",
    nodes: [
      { id: "s1", name: "Iron Body", icon: "Shield", desc: "Harden your body against blows. Reduce incoming damage by 15%.", unlocked: true, active: false },
      { id: "s2", name: "Wind Step", icon: "Wind", desc: "Light as feather. Dash distance +30%, costs no stamina.", unlocked: true, active: true },
      { id: "s3", name: "Eagle Eye", icon: "Eye", desc: "Read enemy intent. Parry window extended by 0.4 seconds.", unlocked: false, active: false },
    ],
  },
  {
    tier: "Intermediate",
    nodes: [
      { id: "s4", name: "Crimson Fang", icon: "Sword", desc: "A slashing combo strike. Three-hit sequence dealing 180% total damage.", unlocked: true, active: true },
      { id: "s5", name: "Void Palm", icon: "Hand", desc: "Channel chi into an open-palm strike. Staggers armored enemies.", unlocked: false, active: false },
      { id: "s6", name: "Rising Dragon", icon: "Flame", desc: "Uppercut that launches enemies airborne. Follow with aerial combos.", unlocked: false, active: false },
    ],
  },
  {
    tier: "Forbidden",
    nodes: [
      { id: "s7", name: "Thousand Cuts", icon: "Zap", desc: "50 strikes in 3 seconds. Shreds armor and breaks guard permanently.", unlocked: false, active: false },
      { id: "s8", name: "Death Blossom", icon: "Sparkles", desc: "Spin in place releasing a ring of blade energy. Area devastation.", unlocked: false, active: false },
      { id: "s9", name: "Heaven's Wrath", icon: "CloudLightning", desc: "Draw down lightning chi. One strike that ignores all defenses.", unlocked: false, active: false },
    ],
  },
];

const COMBOS = [
  { name: "Storm Sequence", input: "↑ → ↓ + Attack", effect: "Launches enemy + 3-hit aerial", damage: "240%" },
  { name: "Death's Whisper", input: "Hold Guard + Release + Attack", effect: "Counter strike — triple parry power", damage: "190%" },
  { name: "Phantom Step", input: "Dodge × 2 + Attack", effect: "Teleport behind — back stab", damage: "320%" },
  { name: "Dragon Coil", input: "↓ ↓ + Heavy", effect: "Spinning sweep — hits all around", damage: "160% AoE" },
];

const NPCS = [
  {
    name: "Master Liang Qinghe",
    role: "Wandering Hermit",
    relation: "Mentor",
    desc: "Once the greatest swordsman of the Northern School. He retreated into silence after the purge. His hands no longer touch a blade — until he sees something in Wei Jian's eyes.",
    affinity: 85,
    color: "#c9a84c",
  },
  {
    name: "Yue Xiaomei",
    role: "Imperial Spy",
    relation: "Ambiguous",
    desc: "She serves the king's court and shadows your every move. But her reports have been... inaccurate. Is she protecting you, or setting the perfect trap?",
    affinity: 50,
    color: "#c0392b",
  },
  {
    name: "Brother Daishan",
    role: "Disgraced Commander",
    relation: "Rival / Ally",
    desc: "The king's finest general — also cast aside when he refused the order to massacre civilians. His blade is equal to yours. His goals may not be.",
    affinity: 60,
    color: "#7a8a9a",
  },
];

const WORLD_REGIONS = [
  { name: "Dragon Spine Mountains", type: "Wilderness", quests: 12, icon: "Mountain", discovered: true },
  { name: "Imperial City Luoyang", type: "Urban", quests: 8, icon: "Building", discovered: false },
  { name: "Crimson Temple Ruins", type: "Dungeon", quests: 5, icon: "Flame", discovered: true },
  { name: "Merchant Road East", type: "Open World", quests: 15, icon: "Route", discovered: true },
  { name: "Lake of Eternal Mist", type: "Exploration", quests: 7, icon: "Droplets", discovered: false },
  { name: "The Forgotten Tombs", type: "Dungeon", quests: 9, icon: "Skull", discovered: false },
];

export default function Index() {
  const [activeSection, setActiveSection] = useState("Story");
  const [selectedSkill, setSelectedSkill] = useState<string | null>("s2");
  const [activeCombo, setActiveCombo] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove("opacity-0-init");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const selectedSkillData = SKILLS.flatMap((t) => t.nodes).find((n) => n.id === selectedSkill);

  return (
    <div className="min-h-screen ink-bg text-foreground font-noto overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%)" }}>
        <div className="font-cinzel-dec text-sm tracking-widest text-gold animate-flicker" style={{ letterSpacing: "0.3em" }}>
          刃道
        </div>
        <div className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <button key={item} onClick={() => setActiveSection(item)}
              className={`nav-link ${activeSection === item ? "active" : ""}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border border-gold/40 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-blood animate-pulse-glow" />
          </div>
          <span className="font-cinzel text-xs text-gold/60 tracking-widest">Wei Jian</span>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Warrior" className="w-full h-full object-cover object-center opacity-35" />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to right, rgba(10,10,10,0.97) 30%, rgba(10,10,10,0.5) 65%, rgba(10,10,10,0.85) 100%)"
          }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 40%)"
          }} />
        </div>

        {[...Array(12)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${10 + i * 8}%`,
            bottom: `${10 + (i % 4) * 15}%`,
            animationDuration: `${4 + i * 0.7}s`,
            animationDelay: `${i * 0.3}s`,
            "--drift": `${(i % 2 === 0 ? 1 : -1) * (10 + i * 3)}px`,
          } as React.CSSProperties} />
        ))}

        <div className="relative z-10 px-8 md:px-16 lg:px-24 max-w-4xl pt-24">
          <div className="reveal opacity-0-init animate-fade-up delay-100">
            <div className="divider-ornate mb-6 w-48">
              <span className="font-cinzel text-xs tracking-[0.3em] text-gold/60">A WUXIA RPG</span>
            </div>
          </div>

          <h1 className="reveal opacity-0-init animate-fade-up delay-200 font-cinzel-dec font-black leading-none mb-2"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)", color: "var(--parchment)" }}>
            PATH
          </h1>
          <h1 className="reveal opacity-0-init animate-fade-up delay-300 font-cinzel-dec font-black leading-none mb-6 gold-glow"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)", color: "var(--gold)" }}>
            OF THE BLADE
          </h1>

          <p className="reveal opacity-0-init animate-fade-up delay-400 font-fell italic text-xl leading-relaxed mb-2"
            style={{ color: "rgba(232,220,200,0.7)", maxWidth: "520px" }}>
            "A kingdom built on lies. A throne soaked in blood.<br />
            A warrior who remembers everything."
          </p>

          <p className="reveal opacity-0-init animate-fade-up delay-500 font-noto text-sm leading-loose mb-10"
            style={{ color: "rgba(232,220,200,0.45)", maxWidth: "460px" }}>
            Play as Wei Jian — former General of the Seven Banners, betrayed and cast out.
            Master forbidden martial arts, forge unlikely alliances, and cut through an entire
            empire to reach the man who stole everything from you.
          </p>

          <div className="reveal opacity-0-init animate-fade-up delay-700 flex items-center gap-4">
            <button className="btn-blood" onClick={() => setActiveSection("Story")}>
              Begin Journey
            </button>
            <button className="btn-wuxia" onClick={() => setActiveSection("Skills")}>
              View Skills
            </button>
          </div>

          <div className="reveal opacity-0-init animate-fade-up delay-900 mt-16 flex items-center gap-8">
            {[
              { label: "Chapters", val: "3 Acts" },
              { label: "Martial Arts", val: "27 Skills" },
              { label: "Open World", val: "6 Regions" },
              { label: "NPCs", val: "40+ Chars" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="font-cinzel text-gold text-lg font-bold">{s.val}</span>
                <span className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.35)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="relative z-10 px-8 md:px-16 lg:px-24 pb-24">
        <div className="flex items-center gap-0 mb-12 border-b" style={{ borderColor: "rgba(201,168,76,0.1)" }}>
          {NAV_ITEMS.map((item) => (
            <button key={item}
              onClick={() => setActiveSection(item)}
              className={`font-cinzel text-xs tracking-[0.2em] uppercase py-4 px-6 transition-all duration-300 ${activeSection === item ? "tab-active" : "tab-inactive"}`}>
              {item}
            </button>
          ))}
        </div>

        {/* STORY */}
        {activeSection === "Story" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-cinzel text-2xl text-gold tracking-widest">MAIN CAMPAIGN</h2>
              <div className="divider-ornate flex-1"><span /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STORY_CHAPTERS.map((ch, i) => (
                <div key={i} className={`card-wuxia rounded-sm overflow-hidden transition-all duration-500 group cursor-pointer ${ch.status === "Locked" ? "opacity-50" : ""}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img src={ch.img} alt={ch.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 50%)" }} />
                    <div className="absolute top-3 left-3">
                      <span className="font-cinzel text-xs tracking-widest px-2 py-1 rounded-sm"
                        style={{ background: "rgba(139,0,0,0.8)", color: "var(--parchment)", border: "1px solid rgba(192,57,43,0.4)" }}>
                        {ch.act}
                      </span>
                    </div>
                    {ch.status === "Locked" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="Lock" size={32} className="text-gold/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-cinzel text-base text-gold mb-2 tracking-wide">{ch.title}</h3>
                    <p className="font-noto text-sm leading-relaxed" style={{ color: "rgba(232,220,200,0.55)" }}>{ch.desc}</p>
                    {ch.status !== "Locked" && (
                      <button className="mt-4 font-cinzel text-xs tracking-widest text-blood hover:text-gold transition-colors flex items-center gap-2">
                        Enter Chapter <Icon name="ChevronRight" size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-8 rounded-sm relative overflow-hidden" style={{ background: "rgba(232,220,200,0.03)", border: "1px solid rgba(201,168,76,0.1)" }}>
              <div className="absolute top-0 left-0 w-1 h-full bg-blood" />
              <div className="font-cinzel text-xs tracking-[0.3em] text-gold/40 mb-3">LORE ENTRY #001</div>
              <p className="font-fell italic text-lg leading-loose" style={{ color: "rgba(232,220,200,0.6)" }}>
                "The King of Wei summoned his seven generals to the Hall of Ten Thousand Banners.
                Six left in chains. One escaped into the mountains with a broken sword and an unbroken spirit.
                The scribes recorded it as a purge of traitors. History, as always, was written by those who survived."
              </p>
              <div className="mt-4 font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.3)" }}>
                — Chronicles of the Fallen Banner, Vol. III
              </div>
            </div>
          </div>
        )}

        {/* WORLD */}
        {activeSection === "World" && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-cinzel text-2xl text-gold tracking-widest">OPEN WORLD</h2>
              <div className="divider-ornate flex-1"><span /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WORLD_REGIONS.map((r, i) => (
                <div key={i} className={`card-wuxia rounded-sm p-5 cursor-pointer group transition-all duration-300 ${!r.discovered ? "opacity-40" : ""}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center"
                      style={{ background: r.discovered ? "rgba(139,0,0,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${r.discovered ? "rgba(192,57,43,0.4)" : "rgba(255,255,255,0.1)"}` }}>
                      <Icon name={r.icon} size={18} className={r.discovered ? "text-blood" : "text-white/30"} fallback="MapPin" />
                    </div>
                    <span className="font-cinzel text-xs tracking-widest px-2 py-0.5 rounded-sm"
                      style={{ background: "rgba(201,168,76,0.1)", color: "var(--gold)", border: "1px solid rgba(201,168,76,0.2)" }}>
                      {r.type}
                    </span>
                  </div>
                  <h3 className="font-cinzel text-sm group-hover:text-gold transition-colors tracking-wide" style={{ color: "var(--parchment)" }}>{r.name}</h3>
                  <div className="flex items-center gap-1 mt-3">
                    <Icon name="ScrollText" size={11} className="text-gold/40" />
                    <span className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(201,168,76,0.5)" }}>{r.quests} side quests</span>
                  </div>
                  {!r.discovered && (
                    <div className="mt-3 flex items-center gap-1">
                      <Icon name="Lock" size={10} className="text-white/20" />
                      <span className="font-cinzel text-xs text-white/20 tracking-widest">Undiscovered</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { label: "Side Quests Available", val: "27", icon: "ScrollText" },
                { label: "Hidden Secrets", val: "???", icon: "Search" },
                { label: "World Completion", val: "34%", icon: "Map" },
              ].map((stat, i) => (
                <div key={i} className="card-wuxia rounded-sm p-5 text-center">
                  <Icon name={stat.icon} size={20} className="text-gold mx-auto mb-2" fallback="Info" />
                  <div className="font-cinzel text-2xl font-bold text-gold mb-1">{stat.val}</div>
                  <div className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.4)" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMBAT */}
        {activeSection === "Combat" && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-cinzel text-2xl text-gold tracking-widest">COMBAT SYSTEM</h2>
              <div className="divider-ornate flex-1"><span /></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="relative rounded-sm overflow-hidden h-80">
                <img src={COMBAT_IMG} alt="Combat" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 50%)" }} />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="font-cinzel text-xs tracking-widest text-gold mb-2">CHI ENERGY</div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div className="h-full chi-bar rounded-full" style={{ width: "65%" }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="font-cinzel text-xs text-blood/70">65 / 100</span>
                    <span className="font-cinzel text-xs" style={{ color: "rgba(232,220,200,0.3)" }}>Chi Flow Active</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="font-cinzel text-sm tracking-widest text-gold/70 mb-4">SIGNATURE COMBINATIONS</div>
                <div className="space-y-3">
                  {COMBOS.map((combo, i) => (
                    <div key={i}
                      onClick={() => setActiveCombo(activeCombo === i ? null : i)}
                      className={`card-wuxia rounded-sm p-4 cursor-pointer transition-all duration-300 ${activeCombo === i ? "border-gold/40" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-sm flex items-center justify-center"
                            style={{ background: "rgba(139,0,0,0.3)", border: "1px solid rgba(192,57,43,0.3)" }}>
                            <span className="font-cinzel text-xs text-blood font-bold">{i + 1}</span>
                          </div>
                          <span className="font-cinzel text-sm tracking-wide" style={{ color: "var(--parchment)" }}>{combo.name}</span>
                        </div>
                        <span className="font-cinzel text-xs text-gold font-bold">{combo.damage}</span>
                      </div>
                      {activeCombo === i && (
                        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon name="Keyboard" size={11} className="text-gold/50" />
                            <span className="font-cinzel text-xs tracking-widest text-gold/60">INPUT:</span>
                            <span className="font-cinzel text-xs text-gold">{combo.input}</span>
                          </div>
                          <p className="font-noto text-xs" style={{ color: "rgba(232,220,200,0.5)" }}>{combo.effect}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Precision Parry", icon: "ShieldCheck", desc: "Time a block perfectly to reflect damage back" },
                { name: "Chi Burst", icon: "Zap", desc: "Consume chi for a devastating energy release" },
                { name: "Death Counter", icon: "RotateCcw", desc: "Near-death triggers a one-time counter strike" },
                { name: "Stance Shift", icon: "RefreshCw", desc: "Switch between 3 combat stances mid-fight" },
              ].map((m, i) => (
                <div key={i} className="card-wuxia rounded-sm p-4 text-center group hover:border-blood/40 transition-all">
                  <Icon name={m.icon} size={22} className="text-blood mx-auto mb-2 group-hover:text-gold transition-colors" fallback="Sword" />
                  <div className="font-cinzel text-xs tracking-wide text-gold mb-1">{m.name}</div>
                  <p className="font-noto text-xs" style={{ color: "rgba(232,220,200,0.4)" }}>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SKILLS */}
        {activeSection === "Skills" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className="font-cinzel text-2xl text-gold tracking-widest">SKILL TREE</h2>
                <div className="divider-ornate w-32"><span /></div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}>
                <Icon name="Star" size={12} className="text-gold" />
                <span className="font-cinzel text-xs text-gold tracking-widest">4 Chi Points</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {SKILLS.map((tier, ti) => (
                  <div key={ti}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1" style={{ background: "rgba(201,168,76,0.15)" }} />
                      <span className="font-cinzel text-xs tracking-[0.3em]"
                        style={{ color: ti === 2 ? "var(--blood-light)" : "rgba(201,168,76,0.5)" }}>
                        {tier.tier.toUpperCase()}
                      </span>
                      <div className="h-px flex-1" style={{ background: "rgba(201,168,76,0.15)" }} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {tier.nodes.map((node) => (
                        <div key={node.id}
                          onClick={() => node.unlocked && setSelectedSkill(node.id)}
                          className={`skill-node ${node.unlocked ? "unlocked" : ""} ${node.active ? "active" : ""} ${!node.unlocked ? "opacity-40 cursor-not-allowed" : ""}`}>
                          <div className="skill-inner rounded-sm p-4 text-center border"
                            style={{ borderColor: node.active ? "var(--blood-light)" : node.unlocked ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)" }}>
                            <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                              style={{
                                background: node.active ? "rgba(192,57,43,0.2)" : node.unlocked ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${node.active ? "rgba(192,57,43,0.5)" : node.unlocked ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.1)"}`,
                              }}>
                              <Icon name={node.icon} size={16}
                                className={node.active ? "text-blood" : node.unlocked ? "text-gold" : "text-white/20"}
                                fallback="Star" />
                            </div>
                            <div className="font-cinzel text-xs tracking-wide leading-tight"
                              style={{ color: node.active ? "var(--blood-light)" : node.unlocked ? "var(--gold)" : "rgba(255,255,255,0.2)" }}>
                              {node.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-wuxia rounded-sm p-6 h-fit sticky top-24">
                {selectedSkillData ? (
                  <>
                    <div className="w-16 h-16 rounded-sm mx-auto mb-4 flex items-center justify-center"
                      style={{
                        background: selectedSkillData.active ? "rgba(192,57,43,0.2)" : "rgba(201,168,76,0.1)",
                        border: `2px solid ${selectedSkillData.active ? "rgba(192,57,43,0.5)" : "rgba(201,168,76,0.3)"}`,
                      }}>
                      <Icon name={selectedSkillData.icon} size={28}
                        className={selectedSkillData.active ? "text-blood" : "text-gold"}
                        fallback="Star" />
                    </div>
                    <h3 className="font-cinzel text-base text-center text-gold tracking-wide mb-1">{selectedSkillData.name}</h3>
                    <div className="text-center mb-4">
                      <span className={`font-cinzel text-xs tracking-widest px-2 py-0.5 rounded-sm ${selectedSkillData.active ? "text-blood" : "text-gold/60"}`}
                        style={{ background: selectedSkillData.active ? "rgba(139,0,0,0.2)" : "rgba(201,168,76,0.1)" }}>
                        {selectedSkillData.active ? "ACTIVE" : selectedSkillData.unlocked ? "UNLOCKED" : "LOCKED"}
                      </span>
                    </div>
                    <p className="font-noto text-sm text-center leading-relaxed" style={{ color: "rgba(232,220,200,0.55)" }}>
                      {selectedSkillData.desc}
                    </p>
                    {selectedSkillData.unlocked && !selectedSkillData.active && (
                      <button className="btn-blood w-full mt-5 text-center">Equip Skill</button>
                    )}
                    {!selectedSkillData.unlocked && (
                      <button className="btn-wuxia w-full mt-5 text-center" style={{ opacity: 0.6, cursor: "not-allowed" }}>
                        Requires Chi Points
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Icon name="MousePointer" size={24} className="text-gold/20 mx-auto mb-2" />
                    <p className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.3)" }}>Select a skill to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NPCS */}
        {activeSection === "NPCs" && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-cinzel text-2xl text-gold tracking-widest">CHARACTERS</h2>
              <div className="divider-ornate flex-1"><span /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {NPCS.map((npc, i) => (
                <div key={i} className="card-wuxia rounded-sm p-6 group hover:border-gold/30 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-cinzel text-lg font-bold"
                      style={{ background: `${npc.color}22`, border: `2px solid ${npc.color}44`, color: npc.color }}>
                      {npc.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-cinzel text-xs tracking-widest text-gold">{npc.name}</div>
                      <div className="font-cinzel text-xs mt-0.5" style={{ color: "rgba(232,220,200,0.35)" }}>{npc.role}</div>
                    </div>
                  </div>
                  <div className="inline-block px-2 py-0.5 rounded-sm mb-3 font-cinzel text-xs tracking-widest"
                    style={{ background: `${npc.color}15`, color: npc.color, border: `1px solid ${npc.color}30` }}>
                    {npc.relation}
                  </div>
                  <p className="font-noto text-sm leading-relaxed" style={{ color: "rgba(232,220,200,0.5)" }}>{npc.desc}</p>
                  <div className="mt-5">
                    <div className="flex justify-between mb-1">
                      <span className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.35)" }}>Affinity</span>
                      <span className="font-cinzel text-xs" style={{ color: npc.color }}>{npc.affinity}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${npc.affinity}%`, background: `linear-gradient(to right, ${npc.color}, ${npc.color}88)`, boxShadow: `0 0 8px ${npc.color}50` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 rounded-sm" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.1)" }}>
              <div className="font-cinzel text-xs tracking-[0.3em] text-gold/50 mb-4">INTERACTION SYSTEM</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Dialogue Trees", desc: "Multi-path conversations that change relationships", icon: "MessageSquare" },
                  { name: "Gift System", desc: "Present items to raise affinity and unlock quests", icon: "Gift" },
                  { name: "Reputation", desc: "Your actions shape how factions view you", icon: "TrendingUp" },
                  { name: "Betrayal Paths", desc: "Some alliances come at a terrible cost", icon: "Swords" },
                ].map((f, i) => (
                  <div key={i} className="flex flex-col items-start gap-2">
                    <Icon name={f.icon} size={16} className="text-gold/50" fallback="Users" />
                    <div className="font-cinzel text-xs tracking-wide text-gold/70">{f.name}</div>
                    <p className="font-noto text-xs" style={{ color: "rgba(232,220,200,0.35)" }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="relative px-8 md:px-16 lg:px-24 py-10 border-t" style={{ borderColor: "rgba(201,168,76,0.08)" }}>
        <div className="flex items-center justify-between">
          <div className="font-cinzel-dec text-gold/40 tracking-widest text-sm animate-flicker">刃道</div>
          <div className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(232,220,200,0.2)" }}>
            PATH OF THE BLADE — WUXIA RPG
          </div>
          <div className="font-fell italic text-xs" style={{ color: "rgba(232,220,200,0.2)" }}>
            "Honor is the sharpest blade."
          </div>
        </div>
      </footer>
    </div>
  );
}