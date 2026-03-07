import { useState, useCallback } from "react";
import { useApp, Exercise, Workout } from "@/context/AppContext";
import { MUSCLE_GROUPS, EXERCISES, MET_VALUES, MuscleGroup } from "@/data/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ExerciseEntry {
  name: string;
  type: "strength" | "cardio";
  sets: string;
  reps: string;
  weight: string;
  duration: string;
  met: number;
}

export default function WorkoutModal({ open, onClose }: Props) {
  const { addWorkout, state, weeklyVolumeGoal } = useApp();
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);

  const addExercise = useCallback((name: string, type: "strength" | "cardio") => {
    setEntries(prev => [
      ...prev,
      { name, type, sets: "3", reps: "10", weight: "20", duration: "30", met: 6 },
    ]);
  }, []);

  const updateEntry = useCallback((index: number, key: string, value: string | number) => {
    setEntries(prev =>
      prev.map((e, i) => (i === index ? { ...e, [key]: value } : e))
    );
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  const saveWorkout = () => {
    const userWeight = state.user?.weight ?? 70;

    // Calculate weekly average volume for EPOC check
    const last7 = state.workouts.filter(w => {
      const d = new Date(w.date);
      return (Date.now() - d.getTime()) / 86400000 <= 7;
    });
    const weeklyAvgVolume = last7.length > 0
      ? last7.reduce((s, w) => s + w.totalVolume, 0) / 7
      : 0;

    const exercises: Exercise[] = entries.map((e, i) => {
      const sets = +e.sets || 0;
      const reps = +e.reps || 0;
      const weight = +e.weight || 0;
      const duration = +e.duration || 0;

      return {
        id: `ex_${Date.now()}_${i}`,
        name: e.name,
        muscleGroup: muscleGroup || "Core",
        type: e.type,
        sets, reps, weight, duration,
        met: e.met,
      };
    });

    let totalCalories = 0;
    let totalVolume = 0;
    let totalMinutes = 0;

    exercises.forEach(ex => {
      let activityCalories = 0;

      if (ex.type === "strength") {
        // B) Active Workout Burn — Strength
        const volume = ex.sets * ex.reps * ex.weight;
        totalVolume += volume;
        totalMinutes += ex.sets * 2;

        activityCalories = volume * 0.08;

        // High intensity modifier (MET >= 8 treated as high intensity)
        if (ex.met >= 8) {
          activityCalories *= 1.1;
        }
      } else {
        // B) Active Workout Burn — Cardio
        const durationHours = ex.duration / 60;
        activityCalories = ex.met * userWeight * durationHours;
        totalMinutes += ex.duration;
      }

      // C) Afterburn (EPOC)
      const volumeThisExercise = ex.type === "strength" ? ex.sets * ex.reps * ex.weight : 0;
      if (ex.met >= 8 || volumeThisExercise > weeklyAvgVolume) {
        activityCalories += activityCalories * 0.1;
      }

      totalCalories += activityCalories;
    });

    const workout: Workout = {
      id: `w_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      exercises,
      totalCalories: Math.round(totalCalories),
      totalVolume: Math.round(totalVolume),
      totalMinutes: Math.round(totalMinutes),
    };

    addWorkout(workout);
    setEntries([]);
    setMuscleGroup(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Log Workout</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Muscle group selector */}
        <div className="mb-4">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Muscle Group</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {MUSCLE_GROUPS.map(mg => (
              <button
                key={mg}
                onClick={() => setMuscleGroup(mg)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  muscleGroup === mg
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {mg}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise picker */}
        {muscleGroup && (
          <div className="mb-4">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Add Exercise</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXERCISES[muscleGroup].map(ex => (
                <button
                  key={ex.name}
                  onClick={() => addExercise(ex.name, ex.type)}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  <Plus size={12} /> {ex.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Entries */}
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div key={i} className="rounded-lg border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{entry.name}</span>
                <button onClick={() => removeEntry(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>

              {entry.type === "strength" ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">Sets</label>
                    <Input
                      type="number"
                      value={entry.sets}
                      onChange={e => updateEntry(i, "sets", e.target.value)}
                      className="mt-0.5 h-8 bg-card text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">Reps</label>
                    <Input
                      type="number"
                      value={entry.reps}
                      onChange={e => updateEntry(i, "reps", e.target.value)}
                      className="mt-0.5 h-8 bg-card text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">Kg</label>
                    <Input
                      type="number"
                      value={entry.weight}
                      onChange={e => updateEntry(i, "weight", e.target.value)}
                      className="mt-0.5 h-8 bg-card text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">Duration (min)</label>
                    <Input
                      type="number"
                      value={entry.duration}
                      onChange={e => updateEntry(i, "duration", e.target.value)}
                      className="mt-0.5 h-8 bg-card text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground">Intensity</label>
                    <select
                      value={entry.met}
                      onChange={e => updateEntry(i, "met", +e.target.value)}
                      className="mt-0.5 h-8 w-full rounded-md border border-input bg-card px-2 text-sm text-foreground"
                    >
                      {MET_VALUES.map(m => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {entries.length > 0 && (
          <Button onClick={saveWorkout} className="mt-4 w-full">
            Save Workout
          </Button>
        )}
      </div>
    </div>
  );
}
