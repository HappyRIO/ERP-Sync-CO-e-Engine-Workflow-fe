import { motion } from "framer-motion";
import { Leaf, TreeDeciduous, Home, Car } from "lucide-react";
import { dashboardStats, co2eEquivalencies } from "@/lib/mock-data";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CO2eOverview() {
  const totalCO2e = dashboardStats.totalCO2eSaved;
  const trees = co2eEquivalencies.treesPlanted(totalCO2e);
  const householdDays = co2eEquivalencies.householdDays(totalCO2e);
  const carMiles = co2eEquivalencies.carMiles(totalCO2e);

  const equivalencies = [
    { icon: TreeDeciduous, value: trees.toLocaleString(), label: "Trees planted equivalent" },
    { icon: Home, value: householdDays.toLocaleString(), label: "Household days offset" },
    { icon: Car, value: carMiles.toLocaleString(), label: "Car miles avoided" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl border bg-gradient-hero text-primary-foreground p-6 shadow-lg overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary-foreground/10">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-primary-foreground/80">Environmental Impact</span>
            </div>
            <p className="text-4xl font-bold">{(totalCO2e / 1000).toFixed(1)}t</p>
            <p className="text-sm text-primary-foreground/70">CO₂e saved through reuse</p>
          </div>
          <Button variant="glass" size="sm" asChild className="text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10">
            <Link to="/co2e" className="gap-1">
              Full Report <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {equivalencies.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className="text-center p-3 rounded-lg bg-primary-foreground/10 backdrop-blur-sm"
            >
              <item.icon className="h-5 w-5 mx-auto mb-2 text-primary-foreground/80" />
              <p className="text-xl font-bold">{item.value}</p>
              <p className="text-xs text-primary-foreground/70 leading-tight">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
