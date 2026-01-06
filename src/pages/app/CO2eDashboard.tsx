import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Leaf, 
  TreeDeciduous, 
  Home, 
  Car, 
  Plane,
  TrendingUp,
  Download,
  Users,
  Search,
  Building2,
  CheckCircle2,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Bar,
  LabelList
} from "recharts";
import { co2eEquivalencies } from "@/lib/constants";
import { useJobs } from "@/hooks/useJobs";
import { useAssetCategories } from "@/hooks/useAssets";
import { useDashboardStats } from "@/hooks/useJobs";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const CO2eDashboard = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const isReseller = user?.role === 'reseller';
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: jobs = [], isLoading: isLoadingJobs } = useJobs();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: assetCategories = [] } = useAssetCategories();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Filter jobs by selected client if reseller has selected a client
  const filteredJobs = useMemo(() => {
    if (!isReseller || !selectedClientId) {
      return jobs;
    }
    const selectedClient = clients.find(c => c.id === selectedClientId);
    if (!selectedClient) return jobs;
    return jobs.filter(j => j.clientName === selectedClient.name);
  }, [jobs, selectedClientId, clients, isReseller]);

  // Calculate stats for selected client or all clients
  const clientStats = useMemo(() => {
    const clientJobs = filteredJobs;
    const totalSaved = clientJobs.reduce((sum, j) => sum + j.co2eSaved, 0);
    const totalTravel = clientJobs.reduce((sum, j) => sum + j.travelEmissions, 0);
    const netBenefit = totalSaved - totalTravel;
    const completedJobs = clientJobs.filter(j => j.status === 'completed');
    const bookedJobs = clientJobs.filter(j => j.status !== 'completed');
    
    return {
      totalSaved,
      totalTravel,
      netBenefit,
      completedJobsCount: completedJobs.length,
      bookedJobsCount: bookedJobs.length,
      completedCO2eSaved: completedJobs.reduce((sum, j) => sum + j.co2eSaved, 0),
      estimatedCO2eSaved: bookedJobs.reduce((sum, j) => sum + j.co2eSaved, 0),
      totalJobs: clientJobs.length,
    };
  }, [filteredJobs]);

  // Generate monthly data for charts (will be updated based on filtered jobs)
  const monthlyData = useMemo(() => {
    const currentTotal = clientStats.totalSaved;
    return [
      { month: "Jul", saved: currentTotal * 0.7, travel: 320 },
      { month: "Aug", saved: currentTotal * 0.8, travel: 380 },
      { month: "Sep", saved: currentTotal * 0.75, travel: 290 },
      { month: "Oct", saved: currentTotal * 0.95, travel: 420 },
      { month: "Nov", saved: currentTotal * 0.9, travel: 350 },
      { month: "Dec", saved: currentTotal, travel: 410 },
    ];
  }, [clientStats.totalSaved]);

  // Calculate CO2 stats per client for reseller
  const clientCO2Stats = useMemo(() => {
    if (!isReseller) return [];
    
    return clients.map(client => {
      const clientJobs = jobs.filter(j => j.clientName === client.name);
      const totalCO2e = clientJobs.reduce((sum, j) => sum + j.co2eSaved, 0);
      const totalTravel = clientJobs.reduce((sum, j) => sum + j.travelEmissions, 0);
      const netBenefit = totalCO2e - totalTravel;
      const jobCount = clientJobs.length;
      const completedCount = clientJobs.filter(j => j.status === 'completed').length;
      
      return {
        clientId: client.id,
        clientName: client.name,
        totalCO2e,
        totalTravel,
        netBenefit,
        jobCount,
        completedCount,
      };
    }).sort((a, b) => b.totalCO2e - a.totalCO2e); // Sort by CO2e descending
  }, [clients, jobs, isReseller]);

  // Filter clients by search query
  const filteredClientStats = useMemo(() => {
    if (!clientSearchQuery.trim()) return clientCO2Stats;
    const query = clientSearchQuery.toLowerCase();
    return clientCO2Stats.filter(c => 
      c.clientName.toLowerCase().includes(query)
    );
  }, [clientCO2Stats, clientSearchQuery]);

  // Asset category breakdown
  const categoryData = assetCategories.slice(0, 5).map((cat, i) => ({
    name: cat.name,
    value: [45, 25, 15, 10, 5][i],
    color: ["hsl(168, 70%, 35%)", "hsl(168, 60%, 45%)", "hsl(180, 50%, 40%)", "hsl(205, 60%, 45%)", "hsl(38, 95%, 55%)"][i],
  }));
  
  const totalSaved = clientStats.totalSaved;
  const totalTravel = clientStats.totalTravel;
  const netBenefit = clientStats.netBenefit;

  // Wait for auth to load before checking role
  if (isAuthLoading || isLoadingJobs || isLoadingStats || (isReseller && isLoadingClients)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

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

  // Debug: Log user info to help diagnose
  console.log('[CO2eDashboard Debug]', {
    user: user ? { id: user.id, role: user.role, email: user.email } : null,
    isReseller,
    clientsCount: clients.length,
    clientCO2StatsCount: clientCO2Stats.length,
  });

  // For resellers: show split layout with client list on left
  // Check both user?.role and isReseller to ensure we catch the reseller role
  if (user && (user.role === 'reseller' || isReseller)) {
    return (
      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        {/* Left Sidebar - Client List */}
        <div className="w-80 flex-shrink-0 border-r border-border">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Clients</h3>
                </div>
                {selectedClientId && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedClientId(null);
                      setClientSearchQuery("");
                    }}
                    className="h-7 px-3 bg-primary text-inherit font-medium shadow-sm"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    View All
                  </Button>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Client List */}
            <div className="flex-1 overflow-y-auto">
              {filteredClientStats.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No clients found</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredClientStats.map((clientStat) => {
                    const isSelected = selectedClientId === clientStat.clientId;
                    return (
                      <motion.button
                        key={clientStat.clientId}
                        onClick={() => setSelectedClientId(
                          isSelected ? null : clientStat.clientId
                        )}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card hover:border-primary/50 hover:bg-accent/5"
                        )}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-foreground truncate">
                              {clientStat.clientName}
                            </h4>
                            {isSelected && (
                              <Badge className="bg-primary text-primary-foreground text-xs mt-1">
                                Selected
                              </Badge>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">CO₂e Saved</span>
                            <span className="font-bold text-success">
                              {(clientStat.totalCO2e / 1000).toFixed(1)}t
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Net Benefit</span>
                            <span className="font-semibold text-foreground">
                              {(clientStat.netBenefit / 1000).toFixed(1)}t
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-border/50">
                            <span className="text-muted-foreground">Jobs</span>
                            <span className="font-medium text-foreground">
                              {clientStat.completedCount}/{clientStat.jobCount}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary Footer */}
            {!selectedClientId && clientCO2Stats.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/30">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total CO₂e Saved</span>
                    <span className="font-bold text-success">
                      {(clientCO2Stats.reduce((sum, c) => sum + c.totalCO2e, 0) / 1000).toFixed(1)}t
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Jobs</span>
                    <span className="font-semibold text-foreground">
                      {clientCO2Stats.reduce((sum, c) => sum + c.jobCount, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Clients</span>
                    <span className="font-semibold text-primary">
                      {clientCO2Stats.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Content - Dashboard */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 pr-2">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Environmental Impact
                  {selectedClient && (
                    <span className="text-lg text-primary ml-2">- {selectedClient.name}</span>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedClient 
                    ? `${selectedClient.name}'s CO₂e savings and ESG metrics`
                    : "Your clients' CO₂e savings and ESG metrics"}
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </motion.div>

            {/* Main Stats - Reduced Size */}
            <div className="grid gap-3 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <Card className="bg-gradient-eco border-primary/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-success/10">
                        <TrendingUp className="h-4 w-4 text-success" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">CO₂e Saved</span>
                    </div>
                    <p className="text-2xl font-bold text-success">{(totalSaved / 1000).toFixed(1)}t</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Through IT asset reuse</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-destructive/10">
                        <Car className="h-4 w-4 text-destructive" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Travel Emissions</span>
                    </div>
                    <p className="text-2xl font-bold text-destructive">{totalTravel}kg</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Collection logistics</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-hero text-primary-foreground">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-primary-foreground/10">
                        <Leaf className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-primary-foreground/80">Net Benefit</span>
                    </div>
                    <p className="text-2xl font-bold">{(netBenefit / 1000).toFixed(1)}t</p>
                    <p className="text-xs text-primary-foreground/70 mt-0.5">Total environmental impact</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Equivalencies - Reduced Size */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Impact Equivalencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {equivalencies.map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="text-center p-3 rounded-lg bg-secondary/50"
                      >
                        <item.icon className="h-6 w-6 mx-auto mb-1.5 text-primary" />
                        <p className="text-lg font-bold text-foreground">{item.value}</p>
                        <p className="text-xs font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Charts - Reduced Size */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Trend Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">CO₂e Savings Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
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
                            fontSize={11}
                            tickFormatter={(value) => `${value} 2024`}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickFormatter={(v) => `${v/1000}t`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px"
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
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Savings by Asset Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
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
                              borderRadius: "8px",
                              fontSize: "12px"
                            }}
                            formatter={(value: number) => [`${value}%`, "Contribution"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 ml-3">
                        {categoryData.map((item) => (
                          <div key={item.name} className="flex items-center gap-2 text-xs">
                            <div 
                              className="w-2.5 h-2.5 rounded-full" 
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

            {/* Per-Job Breakdown - Reduced Size */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">CO₂e by Job</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      {(() => {
                        const chartData = filteredJobs.slice(0, 5).map(j => {
                          // Format date to show month and year
                          const date = new Date(j.scheduledDate);
                          const month = date.toLocaleDateString('en-GB', { month: 'short' });
                          const year = date.getFullYear();
                          return {
                            name: j.erpJobNumber, // Use full job number as key
                            jobNumber: j.erpJobNumber,
                            clientName: j.clientName,
                            siteName: j.siteName,
                            date: `${month} ${year}`,
                            fullName: `${j.erpJobNumber} - ${j.siteName} (${month} ${year})`,
                            saved: j.co2eSaved / 1000,
                            travel: j.travelEmissions / 1000
                          };
                        });
                        
                        return (
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="name" 
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={10}
                              angle={-45}
                              textAnchor="end"
                              height={selectedClientId ? 80 : 100}
                              tick={(props: any) => {
                                const { x, y, payload, index } = props;
                                if (!payload) return null;
                                
                                // Find the matching data point
                                const value = payload.value || payload;
                                const data = chartData.find(d => d.name === value);
                                if (!data) return null;
                                
                                // Estimate bar width: chart width / number of bars
                                // Approximate chart width for h-48 container (192px minus margins)
                                const estimatedChartWidth = 180;
                                const barCount = chartData.length;
                                const estimatedBarWidth = estimatedChartWidth / barCount;
                                
                                // Character width estimation (approximate: 6px per character at fontSize 10)
                                const charWidth = 6;
                                const maxChars = Math.floor((estimatedBarWidth * 0.9) / charWidth);
                                
                                // Show full text, but italicize if it would overflow
                                const clientName = data.clientName || '';
                                const siteName = data.siteName || '';
                                const date = data.date || '';
                                
                                // Check if text would overflow
                                const clientNameOverflow = clientName.length > maxChars;
                                const siteNameOverflow = siteName.length > maxChars;
                                const dateOverflow = date.length > maxChars;
                                
                                // Show client name when in "View All" state (no client selected)
                                const showClientName = !selectedClientId;
                                
                                return (
                                  <g transform={`translate(${x},${y})`}>
                                    {showClientName && (
                                      <text
                                        x={0}
                                        y={0}
                                        dy={16}
                                        textAnchor="middle"
                                        fill="hsl(var(--muted-foreground))"
                                        fontSize={10}
                                        fontStyle={clientNameOverflow ? 'italic' : 'normal'}
                                      >
                                        {clientName}
                                      </text>
                                    )}
                                    <text
                                      x={0}
                                      y={0}
                                      dy={showClientName ? 28 : 16}
                                      textAnchor="middle"
                                      fill="hsl(var(--muted-foreground))"
                                      fontSize={10}
                                      fontStyle={siteNameOverflow ? 'italic' : 'normal'}
                                    >
                                      {siteName}
                                    </text>
                                    <text
                                      x={0}
                                      y={0}
                                      dy={showClientName ? 40 : 28}
                                      textAnchor="middle"
                                      fill="hsl(var(--muted-foreground))"
                                      fontSize={10}
                                      fontStyle={dateOverflow ? 'italic' : 'normal'}
                                    >
                                      {date}
                                    </text>
                                  </g>
                                );
                              }}
                            />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickFormatter={(v) => `${v}t`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px"
                          }}
                          formatter={(value: number) => [`${value.toFixed(2)}t`]}
                          labelFormatter={(label, payload) => {
                            if (payload && payload[0] && payload[0].payload) {
                              return payload[0].payload.fullName;
                            }
                            return label;
                          }}
                        />
                            <Bar dataKey="saved" name="CO₂e Saved" fill="hsl(168, 70%, 35%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        );
                      })()}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // For non-resellers or when no clients: show original layout
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
                      tickFormatter={(value) => `${value} 2024`}
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
                {(() => {
                  const chartData = filteredJobs.slice(0, 5).map(j => {
                    // Format date to show month and year
                    const date = new Date(j.scheduledDate);
                    const month = date.toLocaleDateString('en-GB', { month: 'short' });
                    const year = date.getFullYear();
                    return {
                      name: j.erpJobNumber, // Use full job number as key
                      jobNumber: j.erpJobNumber,
                      clientName: j.clientName,
                      siteName: j.siteName,
                      date: `${month} ${year}`,
                      fullName: `${j.erpJobNumber} - ${j.siteName} (${month} ${year})`,
                  saved: j.co2eSaved / 1000,
                  travel: j.travelEmissions / 1000
                    };
                  });
                  
                  return (
                    <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        angle={-45}
                        textAnchor="end"
                        height={selectedClientId ? 80 : 100}
                         tick={(props: any) => {
                           const { x, y, payload, index } = props;
                           if (!payload) return null;
                           
                           // Find the matching data point
                           const value = payload.value || payload;
                           const data = chartData.find(d => d.name === value);
                           if (!data) return null;
                           
                           // Estimate bar width: chart width / number of bars
                           // Approximate chart width for h-64 container (256px minus margins)
                           const estimatedChartWidth = 240;
                           const barCount = chartData.length;
                           const estimatedBarWidth = estimatedChartWidth / barCount;
                           
                           // Character width estimation (approximate: 6.5px per character at fontSize 11)
                           const charWidth = 6.5;
                           const maxChars = Math.floor((estimatedBarWidth * 0.9) / charWidth);
                           
                           // Show full text, but italicize if it would overflow
                           const clientName = data.clientName || '';
                           const siteName = data.siteName || '';
                           const date = data.date || '';
                           
                           // Check if text would overflow
                           const clientNameOverflow = clientName.length > maxChars;
                           const siteNameOverflow = siteName.length > maxChars;
                           const dateOverflow = date.length > maxChars;
                           
                           // Show client name when in "View All" state (no client selected)
                           const showClientName = !selectedClientId;
                           
                           return (
                             <g transform={`translate(${x},${y})`}>
                               {showClientName && (
                                 <text
                                   x={0}
                                   y={0}
                                   dy={16}
                                   textAnchor="middle"
                                   fill="hsl(var(--muted-foreground))"
                                   fontSize={11}
                                   fontStyle={clientNameOverflow ? 'italic' : 'normal'}
                                 >
                                   {clientName}
                                 </text>
                               )}
                               <text
                                 x={0}
                                 y={0}
                                 dy={showClientName ? 28 : 16}
                                 textAnchor="middle"
                                 fill="hsl(var(--muted-foreground))"
                                 fontSize={11}
                                 fontStyle={siteNameOverflow ? 'italic' : 'normal'}
                               >
                                 {siteName}
                               </text>
                               <text
                                 x={0}
                                 y={0}
                                 dy={showClientName ? 40 : 28}
                                 textAnchor="middle"
                                 fill="hsl(var(--muted-foreground))"
                                 fontSize={11}
                                 fontStyle={dateOverflow ? 'italic' : 'normal'}
                               >
                                 {date}
                               </text>
                             </g>
                           );
                         }}
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
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0] && payload[0].payload) {
                        return payload[0].payload.fullName;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey="saved" name="CO₂e Saved" fill="hsl(168, 70%, 35%)" radius={[4, 4, 0, 0]} />
                </BarChart>
                  );
                })()}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CO2eDashboard;
