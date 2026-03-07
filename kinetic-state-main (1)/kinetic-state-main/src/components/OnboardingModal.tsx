import { useState } from "react";
import { useApp, UserProfile } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GOALS = [
  { value: "lose" as const, label: "Lose Fat" },
  { value: "maintain" as const, label: "Maintain" },
  { value: "gain" as const, label: "Gain Muscle" },
];

export default function OnboardingModal() {
  const { setUser } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "male" as "male" | "female",
    height: "",
    weight: "",
    goalType: "maintain" as "lose" | "maintain" | "gain",
  });

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const canProceed = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return +form.age > 0 && +form.height > 0 && +form.weight > 0;
    return true;
  };

  const submit = () => {
    const user: UserProfile = {
      name: form.name.trim(),
      age: +form.age,
      gender: form.gender,
      height: +form.height,
      weight: +form.weight,
      goalType: form.goalType,
    };
    setUser(user);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">ASCEND</h1>
        <p className="mb-6 text-sm text-muted-foreground">Elite Fitness Operating System</p>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
              <Input
                value={form.name}
                onChange={e => update("name", e.target.value)}
                placeholder="Your name"
                className="mt-1 bg-background"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Gender</Label>
              <div className="mt-1 flex gap-2">
                {(["male", "female"] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => update("gender", g)}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      form.gender === g
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Age</Label>
              <Input
                type="number"
                value={form.age}
                onChange={e => update("age", e.target.value)}
                placeholder="25"
                className="mt-1 bg-background"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Height (cm)</Label>
              <Input
                type="number"
                value={form.height}
                onChange={e => update("height", e.target.value)}
                placeholder="180"
                className="mt-1 bg-background"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Weight (kg)</Label>
              <Input
                type="number"
                value={form.weight}
                onChange={e => update("weight", e.target.value)}
                placeholder="80"
                className="mt-1 bg-background"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Goal</Label>
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => update("goalType", g.value)}
                className={`block w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                  form.goalType === g.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Continue
            </Button>
          ) : (
            <Button onClick={submit} className="flex-1">
              Begin
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
