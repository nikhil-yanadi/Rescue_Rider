import { CheckCircle, Clock, AlertTriangle, XCircle, Loader2, Bell } from "lucide-react";

type Status =
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "verified"
  | "rejected"
  | "suspended"
  | "notified"
  | "accepted";

interface StatusBadgeProps {
  status: Status | string;
  size?: "sm" | "md";
}

const statusConfig: Record<Status, { label: string; icon: React.ReactNode; classes: string }> = {
  pending: {
    label: "Pending",
    icon: <Clock className="w-3 h-3" />,
    classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  notified: {
    label: "Notified",
    icon: <Bell className="w-3 h-3" />,
    classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  accepted: {
    label: "Accepted",
    icon: <CheckCircle className="w-3 h-3" />,
    classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  assigned: {
    label: "Assigned",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  in_progress: {
    label: "In Progress",
    icon: <AlertTriangle className="w-3 h-3" />,
    classes: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle className="w-3 h-3" />,
    classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="w-3 h-3" />,
    classes: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  },
  verified: {
    label: "Verified",
    icon: <CheckCircle className="w-3 h-3" />,
    classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="w-3 h-3" />,
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  suspended: {
    label: "Suspended",
    icon: <XCircle className="w-3 h-3" />,
    classes: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  },
};

const fallback = {
  label: "Unknown",
  icon: <Clock className="w-3 h-3" />,
  classes: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status as Status] ?? fallback;
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${config.classes}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
