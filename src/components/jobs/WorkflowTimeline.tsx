import { WorkflowStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface WorkflowTimelineProps {
  currentStatus: WorkflowStatus;
}

const workflowSteps: { status: WorkflowStatus; label: string }[] = [
  { status: "booked", label: "Booked" },
  { status: "routed", label: "Routed" },
  { status: "en-route", label: "En Route" },
  { status: "collected", label: "Collected" },
  { status: "warehouse", label: "Warehouse" },
  { status: "sanitised", label: "Sanitised" },
  { status: "graded", label: "Graded" },
  { status: "finalised", label: "Finalised" },
];

export function WorkflowTimeline({ currentStatus }: WorkflowTimelineProps) {
  const currentIndex = workflowSteps.findIndex((s) => s.status === currentStatus);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
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
          const isPending = index > currentIndex;

          return (
            <motion.div
              key={step.status}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex flex-col items-center relative z-10"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isPending && "bg-background border-2 border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className={cn("h-3 w-3", isCurrent && "fill-current")} />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium text-center w-16",
                  (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
