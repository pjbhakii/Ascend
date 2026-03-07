export const MUSCLE_GROUPS = ["Legs", "Chest", "Back", "Shoulders", "Arms", "Core"] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EXERCISES: Record<MuscleGroup, { name: string; type: "strength" | "cardio" }[]> = {
  Legs: [
    { name: "Barbell Squat", type: "strength" },
    { name: "Leg Press", type: "strength" },
    { name: "Romanian Deadlift", type: "strength" },
    { name: "Leg Curl", type: "strength" },
    { name: "Leg Extension", type: "strength" },
    { name: "Calf Raise", type: "strength" },
    { name: "Walking Lunge", type: "strength" },
    { name: "Cycling", type: "cardio" },
  ],
  Chest: [
    { name: "Bench Press", type: "strength" },
    { name: "Incline Dumbbell Press", type: "strength" },
    { name: "Cable Fly", type: "strength" },
    { name: "Dips", type: "strength" },
    { name: "Push-Up", type: "strength" },
  ],
  Back: [
    { name: "Deadlift", type: "strength" },
    { name: "Pull-Up", type: "strength" },
    { name: "Barbell Row", type: "strength" },
    { name: "Lat Pulldown", type: "strength" },
    { name: "Seated Cable Row", type: "strength" },
    { name: "Rowing Machine", type: "cardio" },
  ],
  Shoulders: [
    { name: "Overhead Press", type: "strength" },
    { name: "Lateral Raise", type: "strength" },
    { name: "Face Pull", type: "strength" },
    { name: "Front Raise", type: "strength" },
    { name: "Arnold Press", type: "strength" },
  ],
  Arms: [
    { name: "Barbell Curl", type: "strength" },
    { name: "Tricep Pushdown", type: "strength" },
    { name: "Hammer Curl", type: "strength" },
    { name: "Skull Crusher", type: "strength" },
    { name: "Concentration Curl", type: "strength" },
  ],
  Core: [
    { name: "Plank", type: "cardio" },
    { name: "Cable Crunch", type: "strength" },
    { name: "Hanging Leg Raise", type: "strength" },
    { name: "Ab Rollout", type: "strength" },
    { name: "Russian Twist", type: "strength" },
  ],
};

export const MET_VALUES = [
  { label: "Light", value: 4 },
  { label: "Moderate", value: 6 },
  { label: "Intense", value: 8 },
  { label: "HIIT", value: 10 },
];
