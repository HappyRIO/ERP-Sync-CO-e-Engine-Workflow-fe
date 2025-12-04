import { Badge } from "@/components/ui/badge";
import { WorkflowStatus, statusConfig } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface JobStatusBadgeProps {
  status: WorkflowStatus;
  size?: "sm" | "default";
}

export function JobStatusBadge({ status, size = "default" }: JobStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        config.bgColor, 
        config.color,
        size === "sm" && "text-xs px-2 py-0.5"
      )}
    >
      {config.label}
    </Badge>
  );
}
