import { Home, BarChart3, Award, User } from "lucide-react";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "awards", label: "Awards", icon: Award },
  { id: "profile", label: "Profile", icon: User },
] as const;

export type TabId = (typeof tabs)[number]["id"];

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              {isActive && (
                <div className="mt-0.5 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
