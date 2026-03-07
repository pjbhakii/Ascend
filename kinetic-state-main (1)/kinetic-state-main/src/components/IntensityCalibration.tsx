import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { Slider } from "@/components/ui/slider";

const ZONES = [
  { label: "Recovery", min: 0, max: 30 },
  { label: "Controlled", min: 30, max: 60 },
  { label: "Performance", min: 60, max: 85 },
  { label: "Peak", min: 85, max: 100 },
] as const;

function getZone(intensity: number) {
  return ZONES.find(z => intensity >= z.min && intensity < z.max) || ZONES[ZONES.length - 1];
}

function useAnimatedValue(target: number, duration = 300) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number>();
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    const to = target;
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
  }, [target, duration]);

  return display;
}

export default function IntensityCalibration() {
  const { dailyCalorieGoal, weeklyVolumeGoal, state } = useApp();
  const [intensity, setIntensity] = useState(50);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll-based reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // Recovery adjustments
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const yesterdayWorkouts = state.workouts.filter(w => w.date === yesterday);
  const yesterdayVolume = yesterdayWorkouts.reduce((s, w) => s + w.totalVolume, 0);

  const last7 = state.workouts.filter(w => {
    const d = new Date(w.date);
    const now = new Date();
    return (now.getTime() - d.getTime()) / 86400000 <= 7;
  });
  const weeklyAvg = last7.length > 0
    ? last7.reduce((s, w) => s + w.totalVolume, 0) / 7
    : 0;

  const streak = (() => {
    if (state.workouts.length === 0) return 0;
    const dates = [...new Set(state.workouts.map(w => w.date))].sort().reverse();
    let s = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      if ((prev.getTime() - curr.getTime()) / 86400000 === 1) s++;
      else break;
    }
    return s;
  })();

  const maxSlider = yesterdayVolume > weeklyAvg && weeklyAvg > 0 ? 80 : 100;
  const showRestIndicator = streak > 7;

  // Projections
  const projectedCalories = Math.round(dailyCalorieGoal * (intensity / 100));
  const projectedVolume = Math.round((weeklyVolumeGoal * (intensity / 100)) / 5);
  const fatigueImpact = Math.round(intensity * 0.8);

  const animCalories = useAnimatedValue(projectedCalories);
  const animVolume = useAnimatedValue(projectedVolume);
  const animFatigue = useAnimatedValue(fatigueImpact);

  const zone = getZone(intensity);
  const sliderPercent = intensity / 100;

  const handleChange = useCallback((val: number[]) => {
    setIntensity(Math.min(val[0], maxSlider));
  }, [maxSlider]);

  return (
    <div
      ref={cardRef}
      className={`w-full max-w-md transition-all duration-[400ms] ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-5">
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
          Today's Intensity Calibration
        </h3>

        {showRestIndicator && (
          <p className="text-[10px] text-amber mb-3 font-medium tracking-wide">
            {streak}-day streak detected — consider recovery
          </p>
        )}

        {/* Zone labels */}
        <div className="flex justify-between mb-1.5">
          {ZONES.map(z => (
            <span
              key={z.label}
              className={`text-[9px] uppercase tracking-wider transition-colors duration-200 ${
                zone.label === z.label ? "text-foreground font-semibold" : "text-muted-foreground/50"
              }`}
            >
              {z.label}
            </span>
          ))}
        </div>

        {/* Slider */}
        <div className="relative mb-5">
          <Slider
            value={[intensity]}
            onValueChange={handleChange}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          {/* Intensity percentage */}
          <div className="mt-2 text-center">
            <span className="text-2xl font-bold tabular-nums text-foreground">{intensity}</span>
            <span className="text-sm text-muted-foreground ml-0.5">%</span>
          </div>
        </div>

        {/* Projected metrics */}
        <div className="grid grid-cols-3 gap-3">
          <ProjectionMetric
            label="Projected Burn"
            value={animCalories}
            unit="kcal"
            colorClass="text-crimson"
          />
          <ProjectionMetric
            label="Projected Volume"
            value={animVolume}
            unit="kg"
            colorClass="text-teal"
          />
          <ProjectionMetric
            label="Fatigue Load"
            value={animFatigue}
            unit="%"
            colorClass="text-amber"
          />
        </div>
      </div>
    </div>
  );
}

function ProjectionMetric({
  label,
  value,
  unit,
  colorClass,
}: {
  label: string;
  value: number;
  unit: string;
  colorClass: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p>
        <span className={`text-lg font-bold tabular-nums ${colorClass}`}>
          {value.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  );
}
