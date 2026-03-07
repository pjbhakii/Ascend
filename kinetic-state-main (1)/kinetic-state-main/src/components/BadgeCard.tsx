import { BadgeDef, TIER_COLORS } from "@/data/badges";
import { Zap, Flame, Shield, Dumbbell, Mountain, Star, Target, Crown } from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Zap, Flame, Shield, Dumbbell, Mountain, Star, Target, Crown,
};

interface BadgeCardProps {
  badge: BadgeDef;
  unlocked: boolean;
  onClick?: () => void;
}

export default function BadgeCard({ badge, unlocked, onClick }: BadgeCardProps) {
  const tier = TIER_COLORS[badge.tier];
  const Icon = ICON_MAP[badge.icon] || Zap;

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-[22px] border p-4 transition-all ${
        unlocked
          ? "border-transparent shadow-lg"
          : "border-border opacity-40 grayscale"
      }`}
      style={{
        background: unlocked
          ? `linear-gradient(135deg, ${tier.from}20, ${tier.to}10)`
          : undefined,
        boxShadow: unlocked ? `0 0 20px ${tier.from}15` : undefined,
      }}
    >
      {/* Tier rim */}
      {unlocked && (
        <div
          className="absolute inset-0 rounded-[22px]"
          style={{
            border: `1.5px solid ${tier.rim}50`,
          }}
        />
      )}

      <div
        className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{
          background: unlocked
            ? `linear-gradient(135deg, ${tier.from}, ${tier.to})`
            : "hsl(var(--muted))",
        }}
      >
        <Icon size={22} className="text-background" />
      </div>

      <span className="text-xs font-bold leading-tight">{badge.title}</span>
      <span className="mt-0.5 text-[10px] capitalize text-muted-foreground">{badge.tier}</span>
    </button>
  );
}
