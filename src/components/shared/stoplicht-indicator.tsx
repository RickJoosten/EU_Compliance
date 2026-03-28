"use client";

interface StoplichtIndicatorProps {
  score: number;
  showLabel?: boolean;
}

export function StoplichtIndicator({
  score,
  showLabel = false,
}: StoplichtIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, score));

  let color: string;
  let label: string;

  if (clamped > 80) {
    color = "#059669";
    label = "Good";
  } else if (clamped >= 40) {
    color = "#D97706";
    label = "Attention";
  } else {
    color = "#DC2626";
    label = "Critical";
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-label={label}
      />
      {showLabel && (
        <span className="text-xs font-medium text-[#64748B]">{label}</span>
      )}
    </span>
  );
}
