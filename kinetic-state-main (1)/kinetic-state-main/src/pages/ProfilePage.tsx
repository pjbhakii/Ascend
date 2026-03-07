import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GOALS = [
  { value: "lose" as const, label: "Lose Fat" },
  { value: "maintain" as const, label: "Maintain" },
  { value: "gain" as const, label: "Gain Muscle" },
];

export default function ProfilePage() {
  const { state, setUser, totalStats, todayStats, xp, level } = useApp();
  const user = state.user;

  const [name, setName] = useState(user?.name || "");
  const [weight, setWeight] = useState(String(user?.weight || ""));
  const [height, setHeight] = useState(String(user?.height || ""));
  const [goalType, setGoalType] = useState(user?.goalType || "maintain");
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const save = () => {
    setUser({
      ...user,
      name: name.trim() || user.name,
      weight: +weight || user.weight,
      height: +height || user.height,
      goalType,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="px-4 pb-24 pt-8">
      <h1 className="mb-6 text-xl font-bold">Profile</h1>

      {/* Stats summary */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <MiniStat label="Total XP" value={xp.toLocaleString()} />
        <MiniStat label="Level" value={String(level)} />
        <MiniStat label="Today's Volume" value={`${(todayStats.volume / 1000).toFixed(1)}k kg`} />
        <MiniStat label="Longest Streak" value={`${totalStats.longestStreak} days`} />
      </div>

      {/* Edit form */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} className="mt-1 bg-background" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Weight (kg)</Label>
            <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="mt-1 bg-background" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Height (cm)</Label>
            <Input type="number" value={height} onChange={e => setHeight(e.target.value)} className="mt-1 bg-background" />
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Goal</Label>
          <div className="mt-2 flex gap-2">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => setGoalType(g.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  goalType === g.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={save} className="w-full">
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
