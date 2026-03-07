import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export interface UserProfile {
  name: string;
  age: number;
  gender: "male" | "female";
  height: number;
  weight: number;
  goalType: "lose" | "maintain" | "gain";
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  type: "strength" | "cardio";
  sets: number;
  reps: number;
  weight: number;
  duration: number;
  met: number;
}

export interface Workout {
  id: string;
  date: string;
  timestamp: number;
  exercises: Exercise[];
  totalCalories: number;
  totalVolume: number;
  totalMinutes: number;
}

interface AppState {
  user: UserProfile | null;
  workouts: Workout[];
  onboarded: boolean;
}

interface AppContextType {
  state: AppState;
  setUser: (user: UserProfile) => void;
  addWorkout: (workout: Workout) => void;
  dailyCalorieGoal: number;
  weeklyVolumeGoal: number;
  dailyMinuteGoal: number;
  todayStats: { calories: number; volume: number; minutes: number };
  passiveCaloriesToday: number;
  weeklyStats: { day: string; calories: number; volume: number; minutes: number }[];
  totalStats: { calories: number; volume: number; sessions: number; longestStreak: number };
  xp: number;
  level: number;
  unlockedBadgeIds: string[];
  bmr: number;
}

export function calcBMR(user: UserProfile): number {
  const base = 10 * user.weight + 6.25 * user.height - 5 * user.age;
  return user.gender === "male" ? base + 5 : base - 161;
}

function calcDailyTarget(user: UserProfile): number {
  const bmr = calcBMR(user);
  if (user.goalType === "lose") return bmr * 1.4 - 400;
  if (user.goalType === "maintain") return bmr * 1.4;
  return bmr * 1.6 + 250;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr);
  return (d.getDay() + 6) % 7;
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

function calcStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  const dates = [...new Set(workouts.map(w => w.date))].sort().reverse();
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

const STORAGE_KEY = "ascend_state";

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      
      // Migration: Fix date format if needed
      if (state.workouts && state.workouts.some((w: any) => typeof w.date !== "string")) {
        state.workouts = state.workouts.map((w: any) => ({
          ...w,
          date: new Date(w.timestamp || Date.now())
            .toISOString()
            .split("T")[0]
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
      
      return state;
    }
  } catch {}
  return { user: null, workouts: [], onboarded: false };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  const setUser = useCallback((user: UserProfile) => {
    setState(prev => {
      const next = { ...prev, user, onboarded: true };
      saveState(next);
      return next;
    });
  }, []);

  const addWorkout = useCallback((workout: Workout) => {
    setState(prev => {
      const next = { ...prev, workouts: [...prev.workouts, workout] };
      saveState(next);
      return next;
    });
  }, []);

  const bmr = useMemo(() => {
    if (!state.user) return 1800;
    return Math.round(calcBMR(state.user));
  }, [state.user]);

  const dailyCalorieGoal = useMemo(() => {
    if (!state.user) return 600;
    return Math.round(calcDailyTarget(state.user));
  }, [state.user]);

  const weeklyVolumeGoal = 70000;
  const dailyMinuteGoal = 40;

  // Passive burn: BMR spread across hours since midnight
  const passiveCaloriesToday = useMemo(() => {
    const now = new Date();
    const hoursSinceMidnight = now.getHours() + now.getMinutes() / 60;
    return Math.round((bmr / 24) * hoursSinceMidnight);
  }, [bmr]);

  const todayStats = useMemo(() => {
    const today = getToday();
    const todayWorkouts = state.workouts.filter(w => w.date?.startsWith(today));
    return {
      calories: todayWorkouts.reduce((s, w) => s + w.totalCalories, 0),
      volume: todayWorkouts.reduce((s, w) => s + w.totalVolume, 0),
      minutes: todayWorkouts.reduce((s, w) => s + w.totalMinutes, 0),
    };
  }, [state.workouts]);

 const weeklyStats = useMemo(() => {
  const days = getLast7Days();
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  console.log("WORKOUTS:", state.workouts);
  console.log("WEEKLY DAYS:", days);

  const stats = days.map(date => {
    const dayWorkouts = state.workouts.filter(w =>
  w.date?.startsWith(date)
);

    const calories = dayWorkouts.reduce((s, w) => s + (w.totalCalories || 0), 0);
    const volume = dayWorkouts.reduce((s, w) => s + (w.totalVolume || 0), 0);
    const minutes = dayWorkouts.reduce((s, w) => s + (w.totalMinutes || 0), 0);

    return {
      day: dayNames[getDayOfWeek(date)],
      calories,
      volume,
      minutes,
    };
  });

  console.log("WEEKLY STATS:", stats);
  return stats;
}, [state.workouts]);

  const totalStats = useMemo(() => {
    const calories = state.workouts.reduce((s, w) => s + w.totalCalories, 0);
    const volume = state.workouts.reduce((s, w) => s + w.totalVolume, 0);
    return {
      calories,
      volume,
      sessions: state.workouts.length,
      longestStreak: calcStreak(state.workouts),
    };
  }, [state.workouts]);

  const xp = totalStats.calories;
  const level = Math.floor(Math.sqrt(xp / 100));

  const unlockedBadgeIds = useMemo(() => {
    const ids: string[] = [];
    const s = totalStats;
    const streak = s.longestStreak;
    if (s.sessions >= 1) ids.push("first_workout");
    if (streak >= 7) ids.push("streak_7");
    if (streak >= 30) ids.push("streak_30");
    if (streak >= 90) ids.push("streak_90");
    if (s.volume >= 10000) ids.push("volume_10k");
    if (s.volume >= 50000) ids.push("volume_50k");
    if (s.volume >= 100000) ids.push("volume_100k");
    if (s.calories >= 5000) ids.push("calories_5k");
    if (s.calories >= 20000) ids.push("calories_20k");
    if (s.calories >= 100000) ids.push("calories_100k");
    if (s.sessions >= 50) ids.push("workouts_50");
    if (s.sessions >= 250) ids.push("workouts_250");
    return ids;
  }, [totalStats]);

  const value = useMemo(() => ({
    state, setUser, addWorkout,
    dailyCalorieGoal, weeklyVolumeGoal, dailyMinuteGoal,
    todayStats, passiveCaloriesToday, weeklyStats, totalStats,
    xp, level, unlockedBadgeIds, bmr,
  }), [state, setUser, addWorkout, dailyCalorieGoal, weeklyVolumeGoal, dailyMinuteGoal, todayStats, passiveCaloriesToday, weeklyStats, totalStats, xp, level, unlockedBadgeIds, bmr]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
