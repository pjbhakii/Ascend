import { useState, useRef, useMemo } from "react";

interface BarChartProps {
  data: { day: string; value: number }[];
  color: string;
}

export default function WeeklyBarChart({ data, color }: BarChartProps) {
  const [tooltip, setTooltip] = useState<{ index: number; x: number } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const weeklyValues = data.map((d) => d.value);
  const maxValue = Math.max(...weeklyValues, 1);

  const todayIndex = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = (new Date().getDay() + 6) % 7;
    return data.findIndex((d) => d.day === days[today]);
  }, [data]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative h-[220px] flex items-end justify-between gap-3 px-2">
        {data.map((d, i) => {
          const value = d.value;

          const height =
            value === 0 ? 4 : Math.max((value / maxValue) * 180, 6);

          const isToday = i === todayIndex;

          return (
            <div
              key={d.day}
              className="flex flex-1 flex-col items-center gap-2"
              onClick={(e) => {
                const rect =
                  e.currentTarget.getBoundingClientRect();
                const parentRect =
                  containerRef.current?.getBoundingClientRect();

                if (parentRect) {
                  setTooltip((prev) =>
                    prev?.index === i
                      ? null
                      : {
                          index: i,
                          x:
                            rect.left -
                            parentRect.left +
                            rect.width / 2,
                        }
                  );
                }
              }}
            >
              {/* BAR CONTAINER */}
              <div className="flex items-end justify-center h-[200px] w-full relative">
                
                {/* GLOW WRAPPER (safe, no GPU stacking) */}
                {isToday && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      width: 26,
                      height: `${height}px`,
                      borderRadius: "16px 16px 0 0",
                      backgroundColor: color,
                      opacity: 0.15,
                      filter: "blur(8px)",
                    }}
                  />
                )}

                {/* MAIN BAR */}
                <div
                  style={{
                    width: 24,
                    height: `${height}px`,
                    borderRadius: "14px 14px 0 0",
                    backgroundColor: color,
                    transition: "height 300ms ease",
                    willChange: "height",
                  }}
                />
              </div>

              <span
                className="text-[11px] font-medium"
                style={{
                  color: isToday
                    ? color
                    : "hsl(var(--muted-foreground))",
                }}
              >
                {d.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* TOOLTIP */}
      {tooltip !== null && (
        <div
          className="absolute -top-8 rounded-md bg-foreground px-2 py-1 text-xs font-bold text-background shadow-lg"
          style={{
            left: tooltip.x,
            transform: "translateX(-50%)",
          }}
        >
          {data[tooltip.index].value.toLocaleString()}
        </div>
      )}
    </div>
  );
}