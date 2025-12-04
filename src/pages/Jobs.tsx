import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, Filter, ArrowRight, MapPin, Calendar, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { mockJobs, WorkflowStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusFilters: { value: WorkflowStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "booked", label: "Booked" },
  { value: "en-route", label: "En Route" },
  { value: "warehouse", label: "Warehouse" },
  { value: "graded", label: "Graded" },
  { value: "finalised", label: "Finalised" },
];

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<WorkflowStatus | "all">("all");

  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch =
      job.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.erpJobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.siteName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || job.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client, job number, or site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className="whitespace-nowrap"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link
              to={`/jobs/${job.id}`}
              className="block rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground truncate">{job.clientName}</h3>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">
                      {job.erpJobNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.siteName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(job.scheduledDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-foreground">
                      {job.assets.reduce((sum, a) => sum + a.quantity, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Assets</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-success">
                      {(job.co2eSaved / 1000).toFixed(1)}t
                    </p>
                    <p className="text-xs text-muted-foreground">CO₂e</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">
                      £{job.buybackValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Buyback</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Driver Info (if en-route) */}
              {job.status === "en-route" && job.driver && (
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-4 text-sm">
                  <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                    ETA: {job.driver.eta}
                  </Badge>
                  <span className="text-muted-foreground">
                    Driver: <span className="text-foreground">{job.driver.name}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Vehicle: <span className="font-mono text-foreground">{job.driver.vehicleReg}</span>
                  </span>
                </div>
              )}
            </Link>
          </motion.div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No jobs found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
