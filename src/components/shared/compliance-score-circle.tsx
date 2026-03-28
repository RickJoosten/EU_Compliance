"use client";

interface ComplianceScoreCircleProps {
  score: number;
  size?: number;
  label?: string;
}

export function ComplianceScoreCircle({
  score,
  size = 120,
  label,
}: ComplianceScoreCircleProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  const color =
    clampedScore > 80 ? "#059669" : clampedScore >= 40 ? "#D97706" : "#DC2626";

  const trackColor = "#E2E8F0";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>

        {/* Percentage text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold text-[#334155]"
            style={{ fontSize: size * 0.22 }}
          >
            {clampedScore}%
          </span>
        </div>
      </div>

      {label && (
        <span className="text-sm font-medium text-[#64748B]">{label}</span>
      )}
    </div>
  );
}
