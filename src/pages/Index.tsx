import { motion } from "framer-motion";
import { Truck, Package, PoundSterling, Leaf } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentJobsTable } from "@/components/dashboard/RecentJobsTable";
import { CO2eOverview } from "@/components/dashboard/CO2eOverview";
import { dashboardStats } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Welcome back, Admin</h2>
          <p className="text-muted-foreground">Here's what's happening with your ITAD operations</p>
        </div>
        <Button variant="hero" size="lg" asChild>
          <Link to="/booking">
            <Plus className="h-5 w-5" />
            New Booking
          </Link>
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Jobs"
          value={dashboardStats.activeJobs}
          subtitle="In progress"
          icon={Truck}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Total Assets"
          value={dashboardStats.totalAssets.toLocaleString()}
          subtitle="Processed this month"
          icon={Package}
          trend={{ value: 12, isPositive: true }}
          delay={0.1}
        />
        <StatCard
          title="Buyback Value"
          value={`£${dashboardStats.totalBuyback.toLocaleString()}`}
          subtitle="Total recovered"
          icon={PoundSterling}
          variant="accent"
          delay={0.2}
        />
        <StatCard
          title="CO₂e Saved"
          value={`${(dashboardStats.totalCO2eSaved / 1000).toFixed(1)}t`}
          subtitle="Environmental impact"
          icon={Leaf}
          variant="success"
          trend={{ value: 8, isPositive: true }}
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentJobsTable />
        </div>
        <div className="lg:col-span-2">
          <CO2eOverview />
        </div>
      </div>
    </div>
  );
};

export default Index;
