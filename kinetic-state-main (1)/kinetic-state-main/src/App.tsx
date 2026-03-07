import { useState, useEffect, useRef, useCallback } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { BADGES } from "@/data/badges";
import BottomNav, { TabId } from "@/components/BottomNav";
import OnboardingModal from "@/components/OnboardingModal";
import BadgeUnlockOverlay from "@/components/BadgeUnlockOverlay";
import HomePage from "@/pages/HomePage";
import StatsPage from "@/pages/StatsPage";
import AwardsPage from "@/pages/AwardsPage";
import ProfilePage from "@/pages/ProfilePage";

function AppContent() {
  const { state, unlockedBadgeIds } = useApp();
  const [tab, setTab] = useState<TabId>("home");
  const [pendingBadge, setPendingBadge] = useState<string | null>(null);
  const prevBadges = useRef<string[]>(unlockedBadgeIds);

  // Detect new badge unlocks
  useEffect(() => {
    const newBadges = unlockedBadgeIds.filter(id => !prevBadges.current.includes(id));
    if (newBadges.length > 0) {
      setPendingBadge(newBadges[0]);
    }
    prevBadges.current = unlockedBadgeIds;
  }, [unlockedBadgeIds]);

  const handleBadgeDone = useCallback(() => setPendingBadge(null), []);

  if (!state.onboarded) {
    return <OnboardingModal />;
  }

  const badgeDef = pendingBadge ? BADGES.find(b => b.id === pendingBadge) || null : null;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      {tab === "home" && <HomePage />}
      {tab === "stats" && <StatsPage />}
      {tab === "awards" && <AwardsPage />}
      {tab === "profile" && <ProfilePage />}
      <BottomNav active={tab} onChange={setTab} />
      <BadgeUnlockOverlay badge={badgeDef} onDone={handleBadgeDone} />
    </div>
  );
}

const App = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
