import { motion } from "framer-motion";
import { 
  Leaf, 
  TreeDeciduous, 
  Home, 
  Car, 
  Plane,
  TrendingUp,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { mockJobs, assetCategories, co2eEquivalencies, dashboardStats } from "@/lib/mock-data";

// Generate monthly data for charts
const monthlyData = [
  { month: "Jul", saved: 45000, travel: 320 },
  { month: "Aug", saved: 52000, travel: 380 },
  { month: "Sep", saved: 48000, travel: 290 },
  { month: "Oct", saved: 61000, travel: 420 },
  { month: "Nov", saved: 58000, travel: 350 },
  { month: "Dec", saved: dashboardStats.totalCO2eSaved, travel: 410 },
];

// Asset category breakdown
const categoryData = assetCategories.slice(0, 5).map((cat, i) => ({
  name: cat.name,
  value: [45, 25, 15, 10, 5][i],
  color: ["hsl(168, 70%, 35%)", "hsl(168, 60%, 45%)", "hsl(180, 50%, 40%)", "hsl(205, 60%, 45%)", "hsl(38, 95%, 55%)"][i],
}));

const CO2eDashboard = () => {
  const totalSaved = dashboardStats.totalCO2eSaved;
  const totalTravel = mockJobs.reduce((sum, j) => sum + j.travelEmissions, 0);
  const netBenefit = totalSaved - totalTravel;

  const equivalencies = [
    { 
      icon: TreeDeciduous, 
      value: co2eEquivalencies.treesPlanted(netBenefit).toLocaleString(), 
      label: "Trees planted", 
      sublabel: "for one year" 
    },
    { 
      icon: Home, 
      value: co2eEquivalencies.householdDays(netBenefit).toLocaleString(), 
      label: "Household days", 
      sublabel: "of energy offset" 
    },
    { 
      icon: Car, 
      value: co2eEquivalencies.carMiles(netBenefit).toLocaleString(), 
      label: "Car miles", 
      sublabel: "avoided" 
    },
    { 
      icon: Plane, 
      value: co2eEquivalencies.flightHours(netBenefit).toLocaleString(), 
      label: "Flight hours", 
      sublabel: "offset" 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Environmental Impact</h2>
          <p className="text-muted-foreground">Your CO₂e savings and ESG metrics</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export ESG Report
        </Button>
      </motion.div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="bg-gradient-eco border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">CO₂e Saved</span>
              </div>
              <p className="text-4xl font-bold text-success">{(totalSaved / 1000).toFixed(1)}t</p>
              <p className="text-sm text-muted-foreground mt-1">Through IT asset reuse</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Car className="h-5 w-5 text-destructive" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Travel Emissions</span>
              </div>
              <p className="text-4xl font-bold text-destructive">{totalTravel}kg</p>
              <p className="text-sm text-muted-foreground mt-1">Collection logistics</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-hero text-primary-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary-foreground/10">
                  <Leaf className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-primary-foreground/80">Net Benefit</span>
              </div>
              <p className="text-4xl font-bold">{(netBenefit / 1000).toFixed(1)}t</p>
              <p className="text-sm text-primary-foreground/70 mt-1">Total environmental impact</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Equivalencies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Impact Equivalencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {equivalencies.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center p-4 rounded-xl bg-secondary/50"
                >
                  <item.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CO₂e Savings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(168, 70%, 35%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(168, 70%, 35%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(v) => `${v/1000}t`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [`${(value/1000).toFixed(1)}t`, "CO₂e Saved"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="saved"
                      stroke="hsl(168, 70%, 35%)"
                      fillOpacity={1}
                      fill="url(#colorSaved)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Savings by Asset Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [`${value}%`, "Contribution"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 ml-4">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Per-Job Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CO₂e by Job</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockJobs.slice(0, 5).map(j => ({
                  name: j.clientName.split(' ')[0],
                  saved: j.co2eSaved / 1000,
                  travel: j.travelEmissions / 1000
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(v) => `${v}t`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}t`]}
                  />
                  <Bar dataKey="saved" name="CO₂e Saved" fill="hsl(168, 70%, 35%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CO2eDashboard;
