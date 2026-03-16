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
  FileCheck,
  Warehouse,
  Navigation
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface WorkflowTimelineProps {
  currentStatus: WorkflowStatus;
  bookingType?: 'itad_collection' | 'jml';
  jmlSubType?: 'new_starter' | 'leaver' | 'breakfix' | 'mover' | null;
}

// Helper function to get workflow steps based on booking type
function getWorkflowSteps(
  bookingType?: 'itad_collection' | 'jml',
  jmlSubType?: 'new_starter' | 'leaver' | 'breakfix' | 'mover' | null
): { 
  status: WorkflowStatus; 
  label: string; 
  icon: typeof CheckCircle2;
  description: string;
}[] {
  // ITAD workflow
  if (!bookingType || bookingType === 'itad_collection') {
    return [
      { status: "booked", label: "Booked", icon: Calendar, description: "Job booking confirmed" },
      { status: "routed", label: "Routed", icon: MapPin, description: "Route assigned to driver" },
      { status: "en-route", label: "En Route", icon: Truck, description: "Driver traveling to site (no assets)" },
      { status: "arrived", label: "Arrived", icon: MapPin, description: "Driver arrived at collection site" },
      { status: "collected", label: "Collected", icon: Package, description: "Assets collected from site" },
      { status: "warehouse", label: "Warehouse", icon: Warehouse, description: "Assets at processing facility" },
      { status: "sanitised", label: "Sanitised", icon: Shield, description: "Data sanitisation completed" },
      { status: "graded", label: "Graded", icon: Award, description: "Assets graded for resale" },
      { status: "completed", label: "Completed", icon: FileCheck, description: "Job completed" },
    ];
  }

  // JML workflows
  if (bookingType === 'jml') {
    if (jmlSubType === 'new_starter') {
      // New-starter: booked → routed → collected (at warehouse) → in-transit → arrived → completed
      return [
        { status: "booked", label: "Booked", icon: Calendar, description: "Job booking confirmed" },
        { status: "routed", label: "Routed", icon: MapPin, description: "Route assigned to driver" },
        { status: "collected", label: "Collected", icon: Package, description: "Device collected from warehouse" },
        { status: "in-transit", label: "In Transit", icon: Navigation, description: "Device in transit to employee" },
        { status: "arrived", label: "Arrived", icon: MapPin, description: "Driver arrived at employee location" },
        { status: "completed", label: "Completed", icon: FileCheck, description: "Device delivered and job completed" },
      ];
    } else if (jmlSubType === 'leaver') {
      // Leaver: booked → routed → en-route → arrived → collected → warehouse → sanitised → graded → inventory → completed
      return [
        { status: "booked", label: "Booked", icon: Calendar, description: "Job booking confirmed" },
        { status: "routed", label: "Routed", icon: MapPin, description: "Route assigned to driver" },
        { status: "en-route", label: "En Route", icon: Truck, description: "Driver traveling to employee location" },
        { status: "arrived", label: "Arrived", icon: MapPin, description: "Driver arrived at employee location" },
        { status: "collected", label: "Collected", icon: Package, description: "Devices collected from employee" },
        { status: "warehouse", label: "Warehouse", icon: Warehouse, description: "Devices at processing facility" },
        { status: "sanitised", label: "Sanitised", icon: Shield, description: "Data sanitisation completed" },
        { status: "graded", label: "Graded", icon: Award, description: "Devices graded" },
        { status: "inventory", label: "Inventory", icon: Package, description: "Devices added to inventory for reuse" },
        { status: "completed", label: "Completed", icon: FileCheck, description: "Job completed" },
      ];
    } else if (jmlSubType === 'mover') {
      // Mover: Leaver first (collect old), then New Starter (deliver new)
      // booked → routed → en-route → arrived → collected → warehouse → sanitised → graded → inventory → delivery_routed → delivery_en_route → delivery_arrived → completed
      return [
        { status: "booked", label: "Booked", icon: Calendar, description: "Job booking confirmed" },
        { status: "routed", label: "Routed", icon: MapPin, description: "Route assigned to driver" },
        { status: "en-route", label: "En Route", icon: Truck, description: "Driver traveling to old location" },
        { status: "arrived", label: "Arrived", icon: MapPin, description: "Driver arrived at old location" },
        { status: "collected", label: "Collected (Old)", icon: Package, description: "Old devices collected from old location" },
        { status: "warehouse", label: "Warehouse", icon: Warehouse, description: "Old devices at processing facility" },
        { status: "sanitised", label: "Sanitised", icon: Shield, description: "Data sanitisation completed" },
        { status: "graded", label: "Graded", icon: Award, description: "Devices graded" },
        { status: "inventory", label: "Inventory", icon: Package, description: "Old devices added to inventory" },
        { status: "delivery-routed", label: "Delivery Routed", icon: MapPin, description: "New device delivery route assigned" },
        { status: "delivery-en-route", label: "Delivery En Route", icon: Truck, description: "Driver traveling with new device" },
        { status: "delivery-arrived", label: "Delivery Arrived", icon: MapPin, description: "Driver arrived at new location" },
        { status: "completed", label: "Completed", icon: FileCheck, description: "Job completed" },
      ];
    } else if (jmlSubType === 'breakfix') {
      // Breakfix: New Starter first (deliver replacement), then Leaver (collect broken)
      // booked → routed → collected → in-transit → arrived → warehouse → sanitised → graded → inventory → completed
      return [
        { status: "booked", label: "Booked", icon: Calendar, description: "Job booking confirmed" },
        { status: "routed", label: "Routed", icon: MapPin, description: "Replacement device route assigned" },
        { status: "collected", label: "Collected (Replacement)", icon: Package, description: "Replacement device collected from warehouse" },
        { status: "in-transit", label: "In Transit", icon: Navigation, description: "Replacement device in transit to employee" },
        { status: "arrived", label: "Arrived", icon: MapPin, description: "Driver arrived at employee location" },
        { status: "warehouse", label: "Warehouse", icon: Warehouse, description: "Broken device at processing facility" },
        { status: "sanitised", label: "Sanitised", icon: Shield, description: "Data sanitisation completed" },
        { status: "graded", label: "Graded", icon: Award, description: "Broken device graded" },
        { status: "inventory", label: "Inventory", icon: Package, description: "Broken device added to inventory" },
        { status: "completed", label: "Completed", icon: FileCheck, description: "Job completed" },
      ];
    }
  }

  // Default to ITAD if unknown
  return [
    { status: "booked", label: "Booked", icon: Calendar, description: "Job booking confirmed" },
    { status: "routed", label: "Routed", icon: MapPin, description: "Route assigned to driver" },
    { status: "en-route", label: "En Route", icon: Truck, description: "Driver traveling to site (no assets)" },
    { status: "arrived", label: "Arrived", icon: MapPin, description: "Driver arrived at collection site" },
    { status: "collected", label: "Collected", icon: Package, description: "Assets collected from site" },
    { status: "warehouse", label: "Warehouse", icon: Warehouse, description: "Assets at processing facility" },
    { status: "sanitised", label: "Sanitised", icon: Shield, description: "Data sanitisation completed" },
    { status: "graded", label: "Graded", icon: Award, description: "Assets graded for resale" },
    { status: "completed", label: "Completed", icon: FileCheck, description: "Job completed" },
  ];
}

export function WorkflowTimeline({ currentStatus, bookingType, jmlSubType }: WorkflowTimelineProps) {
  const workflowSteps = getWorkflowSteps(bookingType, jmlSubType);
  
  // Normalize status for comparison (handle both en-route and en_route, delivery statuses)
  const normalizedStatus = currentStatus === 'en_route' ? 'en-route' 
    : currentStatus === 'delivery_routed' ? 'delivery-routed'
    : currentStatus === 'delivery_en_route' ? 'delivery-en-route'
    : currentStatus === 'delivery_arrived' ? 'delivery-arrived'
    : currentStatus;
  
  // Find current index - handle duplicate statuses (like 'arrived' appearing twice)
  // For workflows with duplicate statuses, we need to determine which occurrence we're at
  // Strategy: Find all matching indices, then determine the correct one based on workflow position
  const matchingIndices: number[] = [];
  workflowSteps.forEach((step, index) => {
    const normalizedStepStatus = step.status === 'en_route' ? 'en-route' 
      : step.status === 'delivery_routed' ? 'delivery-routed'
      : step.status === 'delivery_en_route' ? 'delivery-en-route'
      : step.status === 'delivery_arrived' ? 'delivery-arrived'
      : step.status;
    if (normalizedStepStatus === normalizedStatus) {
      matchingIndices.push(index);
    }
  });
  
  let currentIndex = -1;
  
  if (matchingIndices.length === 0) {
    // Status not found in workflow - shouldn't happen, but handle gracefully
    currentIndex = -1;
  } else if (matchingIndices.length === 1) {
    // Single occurrence - use it
    currentIndex = matchingIndices[0];
  } else {
    // Multiple occurrences - use the last one (most advanced position)
    // This works because users progress sequentially through the workflow
    // If they're at 'arrived' and it appears twice, they're at the later occurrence
    currentIndex = matchingIndices[matchingIndices.length - 1];
  }
  
  const totalSteps = workflowSteps.length;
  
  // Calculate progress for horizontal layout
  const iconCenterOffset = 2.5;
  const progressPercent = totalSteps === 1
    ? 100
    : currentIndex === 0
    ? iconCenterOffset
    : currentIndex === totalSteps - 1
    ? 100
    : iconCenterOffset + (currentIndex / (totalSteps - 1)) * (100 - 2 * iconCenterOffset);

  // Calculate progress height for vertical layout
  // Line should end at the center of the current icon
  // Each step has icon (40px) + padding, so we calculate to icon center
  // Icon center is at: (stepIndex * stepHeight) + (iconHeight / 2)
  // Using percentage: (currentIndex + 0.5) / totalSteps gives us the center of current icon
  const progressHeightPercent = currentIndex < 0
    ? 0
    : totalSteps === 1
    ? 50 // Center of single icon
    : currentIndex === 0
    ? (0.5 / totalSteps) * 100 // Center of first icon
    : currentIndex === totalSteps - 1
    ? 100 // Full height for last icon
    : ((currentIndex + 0.5) / totalSteps) * 100; // Center of current icon

  return (
    <div className="py-4">
      {/* Mobile: Vertical Timeline */}
      <div className="md:hidden">
        <div className="relative flex flex-col">
          {/* Full height background line */}
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
        
          {/* Progress line - ends at center of current icon */}
          {currentIndex >= 0 && (
        <motion.div 
              className="absolute left-5 w-0.5 bg-primary"
              initial={{ height: "0%" }}
              animate={{ 
                height: currentIndex === 0 
                  ? '0px'
                  : currentIndex === totalSteps - 1
                  ? 'calc(100% - 20px)' // Full height minus top offset
                  : `calc(${((currentIndex + 0.5) / totalSteps) * 100}% - 20px)` // To center of current icon
              }}
          transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ top: '20px' }} // Start from center of first icon
        />
          )}

        {workflowSteps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

            return (
              <motion.div
                key={step.status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative flex items-start gap-3 pb-6 last:pb-0 group"
              >
                {/* Icon with solid background to cover line */}
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all flex-shrink-0 relative z-10",
                  isCompleted || isCurrent
                    ? "border-primary bg-background"
                    : "border-muted bg-background"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Icon className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-muted-foreground")} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-sm font-medium",
                      (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
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
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Desktop: Horizontal Timeline */}
      <div className="hidden md:block">
        <div className="relative flex items-center justify-between">
          {workflowSteps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = step.icon;
            const isLast = index === totalSteps - 1;

          return (
            <motion.div
              key={step.status}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex flex-col items-center relative z-10 group flex-1"
            >
                {/* Horizontal line connector - connects through center of icons */}
                {!isLast && (
                  <div 
                    className={cn(
                      "absolute top-1/2 h-0.5 -translate-y-1/2",
                      index < currentIndex 
                        ? "bg-primary" 
                        : index === currentIndex
                        ? "bg-primary"
                        : "bg-border"
                    )}
                    style={{
                      left: '50%', // Start from center of current icon
                      right: 'calc(-50%)', // End at center of next icon (extend into next flex item)
                      zIndex: 0
                    }}
                  />
                )}
                
                {/* Icon with solid background to cover line */}
              <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all mb-2 relative z-10",
                isCompleted || isCurrent
                    ? "border-primary bg-background"
                    : "border-muted bg-background"
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
    </div>
  );
}
