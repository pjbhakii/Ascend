import { useApp } from "@/context/AppContext";
import { BADGES } from "@/data/badges";
import BadgeCard from "@/components/BadgeCard";

export default function AwardsPage() {
  const { unlockedBadgeIds, xp, level } = useApp();

  return (
    <div className="px-4 pb-24 pt-8">
      <h1 className="mb-1 text-xl font-bold">Awards</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {unlockedBadgeIds.length} / {BADGES.length} unlocked
      </p>

      {/* XP & Level */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Level</p>
            <p className="text-3xl font-bold">{level}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total XP</p>
            <p className="text-xl font-bold" style={{ color: "#FFD60A" }}>
              {xp.toLocaleString()}
            </p>
          </div>
        </div>
        {/* XP progress to next level */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(((xp - level * level * 100) / ((level + 1) * (level + 1) * 100 - level * level * 100)) * 100, 100)}%`,
                background: "linear-gradient(90deg, #FFD60A, #FF2D55)",
              }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {((level + 1) * (level + 1) * 100 - xp).toLocaleString()} XP to Level {level + 1}
          </p>
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-3 gap-3">
        {BADGES.map(badge => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            unlocked={unlockedBadgeIds.includes(badge.id)}
          />
        ))}
      </div>
    </div>
  );
}
