import { useEffect, useRef, useState } from "react";

interface RingProps {
  progress: number;
  radius: number;
  strokeWidth: number;
  color: string;
  center: number;
}

function Ring({ progress, radius, strokeWidth, color, center }: RingProps) {
  const circumference = 2 * Math.PI * radius;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    const clampedProgress = Math.min(progress, 1);
    const target = circumference - clampedProgress * circumference;
    requestAnimationFrame(() => {
      setAnimatedOffset(target);
    });
  }, [progress, circumference]);

  const showLap = progress > 1;
  const lapRadius = radius + strokeWidth / 2 + 2;
  const lapCircumference = 2 * Math.PI * lapRadius;
  const lapOffset = lapCircumference - ((progress - 1) % 1) * lapCircumference;

  const goalAchieved = progress >= 1;

  return (
    <g>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={0.12}
      />
      {/* Progress */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animatedOffset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{
          transition: "stroke-dashoffset 1.2s ease-out",
          filter: `drop-shadow(0 0 3px ${color}30)`,
          ...(goalAchieved ? { animation: "ring-pulse 2s ease-in-out infinite" } : {}),
        }}
      />
      {/* Lap indicator */}
      {showLap && (
        <circle
          cx={center}
          cy={center}
          r={lapRadius}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={lapCircumference}
          strokeDashoffset={lapOffset}
          transform={`rotate(-90 ${center} ${center})`}
          opacity={0.5}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      )}
    </g>
  );
}

interface ActivityRingsProps {
  calories: { current: number; goal: number };
  minutes: { current: number; goal: number };
  volume: { current: number; goal: number };
  size?: number;
}

export default function ActivityRings({ calories, minutes, volume, size = 220 }: ActivityRingsProps) {
  const center = size / 2;
  const outerStroke = 22;
  const middleStroke = 20;
  const innerStroke = 18;
  const gap = 3;

  const outerR = center - outerStroke / 2 - 2;
  const middleR = outerR - outerStroke / 2 - gap - middleStroke / 2;
  const innerR = middleR - middleStroke / 2 - gap - innerStroke / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Ring
        progress={calories.goal > 0 ? calories.current / calories.goal : 0}
        radius={outerR}
        strokeWidth={outerStroke}
        color="#FF2D55"
        center={center}
      />
      <Ring
        progress={minutes.goal > 0 ? minutes.current / minutes.goal : 0}
        radius={middleR}
        strokeWidth={middleStroke}
        color="#FFD60A"
        center={center}
      />
      <Ring
        progress={volume.goal > 0 ? volume.current / volume.goal : 0}
        radius={innerR}
        strokeWidth={innerStroke}
        color="#32D74B"
        center={center}
      />
    </svg>
  );
}
