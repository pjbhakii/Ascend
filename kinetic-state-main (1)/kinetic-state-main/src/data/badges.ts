export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  tier: BadgeTier;
  icon: string;
}

export const BADGES: BadgeDef[] = [
  { id: "first_workout", title: "First Blood", description: "Complete your first workout", tier: "bronze", icon: "Zap" },
  { id: "streak_7", title: "Week Warrior", description: "7 day workout streak", tier: "silver", icon: "Flame" },
  { id: "streak_30", title: "Iron Will", description: "30 day workout streak", tier: "gold", icon: "Flame" },
  { id: "streak_90", title: "Unbreakable", description: "90 day workout streak", tier: "platinum", icon: "Shield" },
  { id: "volume_10k", title: "10K Club", description: "Lift 10,000 kg total volume", tier: "bronze", icon: "Dumbbell" },
  { id: "volume_50k", title: "Iron Forge", description: "Lift 50,000 kg total volume", tier: "silver", icon: "Dumbbell" },
  { id: "volume_100k", title: "Titan", description: "Lift 100,000 kg total volume", tier: "gold", icon: "Mountain" },
  { id: "calories_5k", title: "Burn Notice", description: "Burn 5,000 total calories", tier: "bronze", icon: "Flame" },
  { id: "calories_20k", title: "Inferno", description: "Burn 20,000 total calories", tier: "silver", icon: "Flame" },
  { id: "calories_100k", title: "Supernova", description: "Burn 100,000 total calories", tier: "platinum", icon: "Star" },
  { id: "workouts_50", title: "Half Century", description: "Complete 50 workouts", tier: "silver", icon: "Target" },
  { id: "workouts_250", title: "Legend", description: "Complete 250 workouts", tier: "platinum", icon: "Crown" },
];

export const TIER_COLORS: Record<BadgeTier, { from: string; to: string; rim: string }> = {
  bronze: { from: "#CD7F32", to: "#8B5E3C", rim: "#CD7F32" },
  silver: { from: "#C0C0C0", to: "#808080", rim: "#C0C0C0" },
  gold: { from: "#FFD700", to: "#B8860B", rim: "#FFD700" },
  platinum: { from: "#E5E4E2", to: "#A0A0A0", rim: "#E5E4E2" },
};
