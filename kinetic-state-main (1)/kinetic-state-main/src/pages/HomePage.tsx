import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import ActivityRings from "@/components/ActivityRings";
import WorkoutModal from "@/components/WorkoutModal";
import IntensityCalibration from "@/components/IntensityCalibration";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function useAnimatedNumber(value: number, duration = 400) {
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
      const eased = t * (2 - t); // ease-out
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    prev.current = to;
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  return display;
}

export default function HomePage() {
  const { state, todayStats, dailyCalorieGoal, dailyMinuteGoal, weeklyVolumeGoal } = useApp();
  const [workoutOpen, setWorkoutOpen] = useState(false);

  const dailyVolumeGoal = Math.round(weeklyVolumeGoal / 7);

  return (
    <div className="flex flex-col items-center px-4 pb-24 pt-8">
      <header className="mb-8 w-full max-w-md">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-2xl font-bold tracking-tight">{state.user?.name || "Athlete"}</h1>
      </header>

      <div className="relative mb-6">
        <ActivityRings
          calories={{ current: todayStats.calories, goal: dailyCalorieGoal }}
          minutes={{ current: todayStats.minutes, goal: dailyMinuteGoal }}
          volume={{ current: todayStats.volume, goal: dailyVolumeGoal }}
          size={240}
        />
      </div>

      {/* Metric readouts */}
      <div className="mb-8 flex w-full max-w-md justify-around">
        <MetricReadout
          label="Calories"
          value={todayStats.calories}
          goal={dailyCalorieGoal}
          unit="kcal"
          colorClass="text-crimson"
        />
        <MetricReadout
          label="Minutes"
          value={todayStats.minutes}
          goal={dailyMinuteGoal}
          unit="min"
          colorClass="text-amber"
        />
        <MetricReadout
          label="Volume"
          value={todayStats.volume}
          goal={dailyVolumeGoal}
          unit="kg"
          colorClass="text-teal"
        />
      </div>

      <Button
        onClick={() => setWorkoutOpen(true)}
        className="w-full max-w-md gap-2 rounded-xl py-6 text-base font-bold active:scale-[0.97] transition-transform duration-150"
      >
        <Plus size={18} />
        Log Workout
      </Button>

      <div className="mt-6 w-full flex justify-center">
        <IntensityCalibration />
      </div>

      <WorkoutModal open={workoutOpen} onClose={() => setWorkoutOpen(false)} />
    </div>
  );
}

function MetricReadout({
  label,
  value,
  goal,
  unit,
  colorClass,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  colorClass: string;
}) {
  const animatedValue = useAnimatedNumber(value);

  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5">
        <span className={`text-xl font-bold tabular-nums ${colorClass}`}>{animatedValue.toLocaleString()}</span>
        <span className="text-sm text-muted-foreground"> / {goal.toLocaleString()}</span>
      </p>
      <p className="text-[10px] text-muted-foreground">{unit}</p>
    </div>
  );
}
