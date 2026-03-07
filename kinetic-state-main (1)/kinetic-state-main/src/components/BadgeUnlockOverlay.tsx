import { useEffect, useState } from "react";
import { BadgeDef, TIER_COLORS } from "@/data/badges";
import { Zap, Flame, Shield, Dumbbell, Mountain, Star, Target, Crown } from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Zap, Flame, Shield, Dumbbell, Mountain, Star, Target, Crown,
};

interface Props {
  badge: BadgeDef | null;
  onDone: () => void;
}

export default function BadgeUnlockOverlay({ badge, onDone }: Props) {
  const [phase, setPhase] = useState<"enter" | "sweep" | "idle" | "exit">("enter");

  useEffect(() => {
    if (!badge) return;
    setPhase("enter");
    const t1 = setTimeout(() => setPhase("sweep"), 400);
    const t2 = setTimeout(() => setPhase("idle"), 1200);
    const t3 = setTimeout(() => {
      setPhase("exit");
      setTimeout(onDone, 300);
    }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [badge, onDone]);

  if (!badge) return null;

  const tier = TIER_COLORS[badge.tier];
  const Icon = ICON_MAP[badge.icon] || Zap;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-300 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onDone}
    >
      <div
        className="relative flex flex-col items-center"
        style={{
          transform: phase === "enter" ? "scale(0.7)" : phase === "sweep" ? "scale(1.1)" : "scale(1)",
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Glow */}
        <div
          className="absolute -inset-16 rounded-full animate-glow-pulse"
          style={{
            background: `radial-gradient(circle, ${tier.from}30 0%, transparent 70%)`,
          }}
        />

        {/* Badge */}
        <div
          className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[22px]"
          style={{
            background: `linear-gradient(135deg, ${tier.from}, ${tier.to})`,
            boxShadow: `0 0 40px ${tier.from}40`,
            border: `2px solid ${tier.rim}80`,
          }}
        >
          <Icon size={44} className="text-background" />

          {/* Sweep */}
          {phase === "sweep" && (
            <div
              className="absolute inset-0 animate-sweep"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                width: "60%",
              }}
            />
          )}
        </div>

        <h3 className="mt-5 text-xl font-bold">{badge.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
        <span
          className="mt-2 text-xs font-bold uppercase tracking-widest"
          style={{ color: tier.from }}
        >
          {badge.tier}
        </span>
      </div>
    </div>
  );
}
