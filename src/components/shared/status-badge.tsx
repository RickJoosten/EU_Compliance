import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NOT_STARTED: {
    label: "Not Started",
    className:
      "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
  },
  COMPLIANT: {
    label: "Compliant",
    className:
      "bg-green-50 text-[#059669] border-green-200 hover:bg-green-50",
  },
  NON_COMPLIANT: {
    label: "Non-Compliant",
    className:
      "bg-red-50 text-[#DC2626] border-red-200 hover:bg-red-50",
  },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    className: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100",
  };

  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
