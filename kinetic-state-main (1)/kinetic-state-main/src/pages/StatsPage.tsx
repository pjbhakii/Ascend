import { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import ActivityRings from "@/components/ActivityRings";
import WeeklyBarChart from "@/components/WeeklyBarChart";

type Metric = "calories" | "volume" | "minutes";

const METRIC_CONFIG: Record<Metric, { label: string; color: string }> = {
  calories: { label: "Calories", color: "#FF2D55" },
  volume: { label: "Volume", color: "#32D74B" },
  minutes: { label: "Minutes", color: "#FFD60A" },
};

function useAnimatedNumber(value: number, duration = 300) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const raf = useRef<number>();

  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t * (2 - t);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    prev.current = to;
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  return display;
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr);
  return (d.getDay() + 6) % 7;
}

export default function StatsPage() {
  const { todayStats, weeklyStats, totalStats, dailyCalorieGoal, dailyMinuteGoal, weeklyVolumeGoal, passiveCaloriesToday, state } = useApp();
  const [metric, setMetric] = useState<Metric>("calories");

  const dailyVolumeGoal = Math.round(weeklyVolumeGoal / 7);

  const barData = useMemo(
    () => weeklyStats.map(d => ({ day: d.day, value: d[metric] })),
    [weeklyStats, metric]
  );

  // Build hourly data for the current metric
  const hourlyData = useMemo(() => {
    const days = getLast7Days();
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const result: Record<string, number[]> = {};

    days.forEach(date => {
      const dayName = dayNames[getDayOfWeek(date)];
      const hours = new Array(24).fill(0);
      const dayWorkouts = state.workouts.filter(w => w.date?.startsWith(date));

      dayWorkouts.forEach(w => {
        const hour = w.timestamp ? new Date(w.timestamp).getHours() : 12;
        if (metric === "calories") hours[hour] += w.totalCalories;
        else if (metric === "volume") hours[hour] += w.totalVolume;
        else hours[hour] += w.totalMinutes;
      });

      result[dayName] = hours;
    });

    return result;
  }, [state.workouts, metric]);

  const animPassive = useAnimatedNumber(passiveCaloriesToday);

  return (
    <div className="px-4 pb-24 pt-8">
      <h1 className="mb-6 text-xl font-bold">Statistics</h1>

      {/* Mini rings */}
      <div className="mb-6 flex justify-center">
        <ActivityRings
          calories={{ current: todayStats.calories, goal: dailyCalorieGoal }}
          minutes={{ current: todayStats.minutes, goal: dailyMinuteGoal }}
          volume={{ current: todayStats.volume, goal: dailyVolumeGoal }}
          size={120}
        />
      </div>

      {/* Passive burn info */}
      <div className="mb-4 rounded-xl border border-border bg-card/60 p-3 text-center">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Passive Burn Today (BMR)</p>
        <p className="mt-0.5">
          <span className="text-lg font-bold tabular-nums text-muted-foreground">{animPassive.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground ml-1">kcal</span>
        </p>
      </div>

      {/* Metric toggle */}
      <div className="mb-4 flex gap-1 rounded-xl bg-secondary p-1">
        {(Object.keys(METRIC_CONFIG) as Metric[]).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              metric === m
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {METRIC_CONFIG[m].label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-4">
        <WeeklyBarChart data={barData} color={METRIC_CONFIG[metric].color} hourlyData={hourlyData} />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Sessions" value={totalStats.sessions} accent="#FF2D55" />
        <StatCard label="Longest Streak" value={totalStats.longestStreak} suffix="d" accent="#FFD60A" />
        <StatCard label="Today's Volume" value={todayStats.volume} format="k" accent="#32D74B" />
        <StatCard label="Today's Calories" value={todayStats.calories} format="k" accent="#FF2D55" />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, suffix, format }: { label: string; value: number; accent: string; suffix?: string; format?: "k" }) {
  const animatedValue = useAnimatedNumber(value);
  const displayValue = format === "k" ? `${(animatedValue / 1000).toFixed(1)}k` : `${animatedValue}${suffix || ""}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
      <div className="absolute left-0 right-0 top-0 h-0.5" style={{ backgroundColor: accent }} />
      <p className="text-2xl font-bold tabular-nums">{displayValue}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
