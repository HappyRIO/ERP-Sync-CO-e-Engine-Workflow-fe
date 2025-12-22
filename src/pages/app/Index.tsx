import { motion } from "framer-motion";
import { Truck, Package, PoundSterling, Leaf, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentJobsTable } from "@/components/dashboard/RecentJobsTable";
import { CO2eOverview } from "@/components/dashboard/CO2eOverview";
import { TravelEmissionsBox } from "@/components/dashboard/TravelEmissionsBox";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useJobs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const { user } = useAuth();
  const canCreateBooking = user && ['admin', 'client', 'reseller'].includes(user.role);
  const welcomeName = user?.name || 'User';
  
  const { data: stats, isLoading, error } = useDashboardStats();

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Welcome back, {welcomeName}</h2>
          <p className="text-muted-foreground">
            {user?.role === 'admin' && "Here's what's happening with your ITAD operations"}
            {user?.role === 'client' && "Track your asset collections and environmental impact"}
            {user?.role === 'reseller' && "Manage your partner bookings and client relationships"}
            {user?.role === 'driver' && "View your assigned routes and collection jobs"}
            {!user && "Welcome to the ITAD Platform"}
          </p>
        </div>
        {canCreateBooking && (
          <Button variant="header" size="lg" asChild>
            <Link to="/booking" className="text-inherit no-underline">
              <Plus />
              New Booking
            </Link>
          </Button>
        )}
      </motion.div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className={`grid gap-4 ${user?.role === 'driver' ? 'sm:grid-cols-1 lg:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
          <StatCard
            title="Active Jobs"
            value={stats.activeJobs}
            subtitle="In progress"
            icon={Truck}
            variant="primary"
            delay={0}
          />
          {user?.role !== 'driver' && (
            <>
              <StatCard
                title="Total Assets"
                value={stats.totalAssets.toLocaleString()}
                subtitle="Processed this month"
                icon={Package}
                trend={{ value: 12, isPositive: true }}
                delay={0.1}
              />
              <StatCard
                title="Buyback Value"
                value={`£${stats.totalBuyback.toLocaleString()}`}
                subtitle="Total recovered"
                icon={PoundSterling}
                variant="accent"
                delay={0.2}
              />
              <StatCard
                title="CO₂e Saved"
                value={`${(stats.totalCO2eSaved / 1000).toFixed(1)}t`}
                subtitle="Environmental impact"
                icon={Leaf}
                variant="success"
                trend={{ value: 8, isPositive: true }}
                delay={0.3}
              />
            </>
          )}
        </div>
      ) : null}

      {/* Main Content Grid */}
      <div className={`grid gap-6 ${user?.role === 'driver' ? 'lg:grid-cols-1' : 'lg:grid-cols-5'}`}>
        <div className={user?.role === 'driver' ? '' : 'lg:col-span-3'}>
          <RecentJobsTable />
        </div>
        {user?.role !== 'driver' && (
          <div className="lg:col-span-2 space-y-6">
            <CO2eOverview />
            <TravelEmissionsBox />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

