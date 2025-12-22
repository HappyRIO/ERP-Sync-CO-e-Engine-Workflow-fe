import type { WorkflowStatus } from "@/types/jobs";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Truck, 
  Package, 
  Shield, 
  Award, 
  FileCheck 
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface WorkflowTimelineProps {
  currentStatus: WorkflowStatus;
}

const workflowSteps: { 
  status: WorkflowStatus; 
  label: string; 
  icon: typeof CheckCircle2;
  description: string;
}[] = [
  { status: "booked", label: "Booked", icon: Calendar, description: "Job booking confirmed" },
  { status: "routed", label: "Routed", icon: MapPin, description: "Route assigned to driver" },
  { status: "en-route", label: "En Route", icon: Truck, description: "Driver traveling to site" },
  { status: "arrived", label: "Arrived", icon: MapPin, description: "Driver arrived at collection site" },
  { status: "collected", label: "Collected", icon: Package, description: "Assets collected from site" },
  { status: "warehouse", label: "Warehouse", icon: Package, description: "Assets at processing facility" },
  { status: "sanitised", label: "Sanitised", icon: Shield, description: "Data sanitisation completed" },
  { status: "graded", label: "Graded", icon: Award, description: "Assets graded for resale" },
  { status: "finalised", label: "Finalised", icon: FileCheck, description: "Job completed" },
];

export function WorkflowTimeline({ currentStatus }: WorkflowTimelineProps) {
  const currentIndex = workflowSteps.findIndex((s) => s.status === currentStatus);

  return (
    <div className="py-4">
      <div className="relative flex items-center justify-between">
        {/* Progress line background */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2 mx-6" />
        
        {/* Progress line fill */}
        <motion.div 
          className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 mx-6"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentIndex / (workflowSteps.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {workflowSteps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.status}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex flex-col items-center relative z-10 group"
            >
              {/* Icon */}
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all mb-2",
                isCompleted || isCurrent
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-muted"
              )}>
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Icon className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-muted-foreground")} />
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-xs font-medium text-center mb-1",
                (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>

              {/* Status Badge */}
              {isCurrent && (
                <Badge className="bg-warning/20 text-warning text-xs px-2 py-0">
                  Current
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="outline" className="bg-success/10 text-success text-xs px-2 py-0">
                  Done
                </Badge>
              )}

              {/* Tooltip with description on hover */}
              <div className="absolute top-full mt-2 hidden group-hover:block z-20">
                <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg p-2 whitespace-nowrap border">
                  {step.description}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
