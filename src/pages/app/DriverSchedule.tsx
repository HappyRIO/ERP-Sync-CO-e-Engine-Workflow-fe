import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Package, 
  Loader2, 
  Navigation,
  Route as RouteIcon,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { useJobs } from "@/hooks/useJobs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { kmToMiles } from "@/lib/calculations";

const DriverSchedule = () => {
  const { user } = useAuth();
  const { data: allJobs = [], isLoading, error } = useJobs();

  // Filter jobs for current driver (assigned to this driver, exclude jobs at "warehouse" or later)
  // Jobs at "warehouse" or later should only appear in Job History
  const driverJobs = useMemo(() => {
    return allJobs.filter(job => 
      job.driver && 
      (job.driver.id === user?.id || job.driver.name === user?.name) && 
      !['warehouse', 'sanitised', 'graded', 'completed'].includes(job.status)
    );
  }, [allJobs, user?.id, user?.name]);

  // Get today's date for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter jobs scheduled for today or future (or in progress jobs from past)
  const upcomingJobs = useMemo(() => {
    return driverJobs.filter(job => {
      const scheduledDate = new Date(job.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      // Include jobs scheduled for today or future
      // Also include in-progress jobs (en-route, arrived, collected) even if scheduled in the past
      const isUpcoming = scheduledDate >= today;
      const isInProgress = ['en-route', 'arrived', 'collected', 'warehouse'].includes(job.status);
      return isUpcoming || isInProgress;
    }).sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [driverJobs]);

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const grouped: Record<string, typeof upcomingJobs> = {};
    upcomingJobs.forEach(job => {
      const dateKey = new Date(job.scheduledDate).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(job);
    });
    return grouped;
  }, [upcomingJobs]);

  // Calculate route statistics based on actual distance data from bookings
  const routeStats = useMemo(() => {
    if (upcomingJobs.length === 0) return null;

    let totalDistanceKm = 0;

    for (const job of upcomingJobs) {
      // Use actual roundTripDistanceKm from booking if available
      if (job.roundTripDistanceKm && job.roundTripDistanceKm > 0) {
        totalDistanceKm += job.roundTripDistanceKm;
      }
      // Do not use travelEmissions / 0.24 as fallback - this is inaccurate
      // If distance is not available, skip it (distance remains 0) to show error/warning
    }

    // Estimate total time:
    // - Travel time at ~40 km/h average speed
    // - Plus 30 minutes on-site per job
    const averageSpeedKmh = 40;
    const travelTimeMinutes = averageSpeedKmh > 0 && totalDistanceKm > 0
      ? (totalDistanceKm / averageSpeedKmh) * 60
      : 0;
    const onSiteMinutes = upcomingJobs.length * 30;
    const estimatedTimeMinutes = Math.round(travelTimeMinutes + onSiteMinutes);

    return {
      totalJobs: upcomingJobs.length,
      totalDistanceKm,
      totalDistanceMiles: kmToMiles(totalDistanceKm),
      estimatedTimeMinutes,
    };
  }, [upcomingJobs]);

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load schedule. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Route & Schedule</h2>
          <p className="text-muted-foreground">View your assigned jobs and plan your route</p>
        </div>
      </motion.div>

      {/* Route Statistics */}
      {routeStats && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-3"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold">{routeStats.totalJobs}</p>
                </div>
                <Package className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Distance</p>
                  {routeStats.totalDistanceKm > 0 ? (
                    <>
                      <p className="text-2xl font-bold">
                        {routeStats.totalDistanceMiles.toFixed(1)} miles
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ({routeStats.totalDistanceKm.toFixed(1)} km)
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-warning">0 km</p>
                      <p className="text-xs text-warning mt-1">
                        ⚠️ Distance data unavailable for some jobs
                      </p>
                    </>
                  )}
                </div>
                <RouteIcon className={`h-8 w-8 ${routeStats.totalDistanceKm > 0 ? 'text-success/50' : 'text-warning/50'}`} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Time</p>
                  <p className="text-2xl font-bold">
                    {Math.floor(routeStats.estimatedTimeMinutes / 60)}h{" "}
                    {routeStats.estimatedTimeMinutes % 60}m
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">(Including travel)</p>
                </div>
                <Clock className="h-8 w-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Jobs List by Date */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : driverJobs.length === 0 ? (
        <div className="text-center py-12">
          <Navigation className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-2">
            No jobs assigned to you found.
          </p>
          <p className="text-sm text-muted-foreground">
            {allJobs.length > 0 
              ? `Found ${allJobs.length} total jobs, but none match your driver profile (${user?.name || user?.id}).`
              : 'No jobs available.'}
          </p>
        </div>
      ) : upcomingJobs.length === 0 ? (
        <div className="text-center py-12">
          <Navigation className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-2">
            No upcoming jobs scheduled.
          </p>
          <p className="text-sm text-muted-foreground">
            You have {driverJobs.length} assigned job{driverJobs.length !== 1 ? 's' : ''}, but none are scheduled for today or future dates.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(jobsByDate).map(([dateKey, jobs]) => (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">{dateKey}</h3>
                <Badge variant="secondary">{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}</Badge>
              </div>
              <div className="space-y-3">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/driver/jobs/${job.id}`}
                      className="block rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Job Number & Status */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-mono text-sm font-medium">{job.erpJobNumber}</p>
                            <JobStatusBadge status={job.status} size="sm" />
                          </div>
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-2">{job.organisationName || job.clientName}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate">{job.siteName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" />
                              <span>
                                {job.assets.reduce((sum, asset) => sum + asset.quantity, 0)} assets
                              </span>
                            </div>
                            {(job.status === "routed" || job.status === "en-route") && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>ETA: {job.driver?.eta || "--:--"}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex items-center gap-3">
                          {job.status === 'booked' && (
                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                              Start Job
                            </Badge>
                          )}
                          {job.status === 'en-route' && (
                            <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                              In Progress
                            </Badge>
                          )}
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Route Optimization Note */}
      {upcomingJobs.length > 1 && (
        <Card className="bg-info/5 border-info/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Navigation className="h-5 w-5 text-info mt-0.5" />
              <div>
                <p className="font-medium mb-1">Route Optimization</p>
                <p className="text-sm text-muted-foreground">
                  Jobs are displayed in chronological order. For optimal routing, consider starting with the earliest scheduled job and planning your route based on geographic proximity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverSchedule;

