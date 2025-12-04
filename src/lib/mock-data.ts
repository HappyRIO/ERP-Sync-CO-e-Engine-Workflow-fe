// Mock data for the Reuse ITAD Platform Demo

export type WorkflowStatus = 
  | 'booked' 
  | 'routed' 
  | 'en-route' 
  | 'collected' 
  | 'warehouse' 
  | 'sanitised' 
  | 'graded' 
  | 'finalised';

export interface Job {
  id: string;
  erpJobNumber: string;
  clientName: string;
  siteName: string;
  siteAddress: string;
  status: WorkflowStatus;
  scheduledDate: string;
  completedDate?: string;
  assets: Asset[];
  driver?: Driver;
  co2eSaved: number;
  travelEmissions: number;
  buybackValue: number;
  charityPercent: number;
  evidence?: Evidence;
  certificates: Certificate[];
}

export interface Asset {
  id: string;
  category: string;
  quantity: number;
  serialNumbers?: string[];
  grade?: 'A' | 'B' | 'C' | 'D' | 'Recycled';
  weight?: number;
  sanitised?: boolean;
  wipeMethod?: string;
}

export interface Driver {
  name: string;
  vehicleReg: string;
  vehicleType: 'van' | 'truck' | 'car';
  eta?: string;
  phone: string;
}

export interface Evidence {
  photos: string[];
  signature?: string;
  sealNumbers: string[];
  notes?: string;
}

export interface Certificate {
  type: 'chain-of-custody' | 'data-wipe' | 'destruction' | 'recycling';
  generatedDate: string;
  downloadUrl: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  icon: string;
  co2ePerUnit: number; // kg CO2e saved per unit reused
  avgWeight: number; // kg
  avgBuybackValue: number; // £
}

export const assetCategories: AssetCategory[] = [
  { id: 'laptop', name: 'Laptops', icon: '💻', co2ePerUnit: 350, avgWeight: 2.5, avgBuybackValue: 85 },
  { id: 'desktop', name: 'Desktops', icon: '🖥️', co2ePerUnit: 450, avgWeight: 8, avgBuybackValue: 45 },
  { id: 'monitor', name: 'Monitors', icon: '📺', co2ePerUnit: 280, avgWeight: 5, avgBuybackValue: 25 },
  { id: 'server', name: 'Servers', icon: '🗄️', co2ePerUnit: 1200, avgWeight: 25, avgBuybackValue: 250 },
  { id: 'phone', name: 'Mobile Phones', icon: '📱', co2ePerUnit: 70, avgWeight: 0.2, avgBuybackValue: 40 },
  { id: 'tablet', name: 'Tablets', icon: '📋', co2ePerUnit: 120, avgWeight: 0.5, avgBuybackValue: 55 },
  { id: 'printer', name: 'Printers', icon: '🖨️', co2ePerUnit: 180, avgWeight: 12, avgBuybackValue: 15 },
  { id: 'network', name: 'Network Equipment', icon: '🌐', co2ePerUnit: 95, avgWeight: 3, avgBuybackValue: 35 },
];

export const mockJobs: Job[] = [
  {
    id: 'job-001',
    erpJobNumber: 'ERP-2024-00142',
    clientName: 'TechCorp Industries',
    siteName: 'London HQ',
    siteAddress: '123 Tech Street, London EC1A 1BB',
    status: 'finalised',
    scheduledDate: '2024-11-28',
    completedDate: '2024-11-28',
    assets: [
      { id: 'a1', category: 'laptop', quantity: 45, grade: 'A', weight: 112.5, sanitised: true, wipeMethod: 'Blancco' },
      { id: 'a2', category: 'monitor', quantity: 30, grade: 'B', weight: 150, sanitised: true },
      { id: 'a3', category: 'phone', quantity: 25, grade: 'A', weight: 5, sanitised: true, wipeMethod: 'Blancco' },
    ],
    driver: { name: 'James Wilson', vehicleReg: 'AB12 CDE', vehicleType: 'van', phone: '+44 7700 900123' },
    co2eSaved: 26150,
    travelEmissions: 45,
    buybackValue: 5875,
    charityPercent: 10,
    evidence: { photos: [], signature: 'collected', sealNumbers: ['SEAL-001', 'SEAL-002'] },
    certificates: [
      { type: 'chain-of-custody', generatedDate: '2024-11-28', downloadUrl: '#' },
      { type: 'data-wipe', generatedDate: '2024-11-30', downloadUrl: '#' },
    ],
  },
  {
    id: 'job-002',
    erpJobNumber: 'ERP-2024-00143',
    clientName: 'Green Finance Ltd',
    siteName: 'Manchester Office',
    siteAddress: '45 Finance Way, Manchester M1 2AB',
    status: 'graded',
    scheduledDate: '2024-12-01',
    assets: [
      { id: 'a4', category: 'desktop', quantity: 60, grade: 'B', weight: 480, sanitised: true, wipeMethod: 'Blancco' },
      { id: 'a5', category: 'server', quantity: 5, grade: 'A', weight: 125, sanitised: true, wipeMethod: 'Blancco' },
    ],
    driver: { name: 'Sarah Chen', vehicleReg: 'XY34 FGH', vehicleType: 'truck', phone: '+44 7700 900456' },
    co2eSaved: 33000,
    travelEmissions: 120,
    buybackValue: 3950,
    charityPercent: 15,
    evidence: { photos: [], signature: 'collected', sealNumbers: ['SEAL-003', 'SEAL-004', 'SEAL-005'] },
    certificates: [
      { type: 'chain-of-custody', generatedDate: '2024-12-01', downloadUrl: '#' },
    ],
  },
  {
    id: 'job-003',
    erpJobNumber: 'ERP-2024-00144',
    clientName: 'HealthFirst NHS Trust',
    siteName: 'Birmingham Hospital',
    siteAddress: '789 Health Road, Birmingham B1 1AA',
    status: 'warehouse',
    scheduledDate: '2024-12-02',
    assets: [
      { id: 'a6', category: 'laptop', quantity: 120, weight: 300 },
      { id: 'a7', category: 'tablet', quantity: 50, weight: 25 },
      { id: 'a8', category: 'printer', quantity: 20, weight: 240 },
    ],
    driver: { name: 'Mike Thompson', vehicleReg: 'CD56 IJK', vehicleType: 'truck', phone: '+44 7700 900789' },
    co2eSaved: 51600,
    travelEmissions: 85,
    buybackValue: 13550,
    charityPercent: 5,
    evidence: { photos: [], signature: 'collected', sealNumbers: ['SEAL-006', 'SEAL-007'] },
    certificates: [],
  },
  {
    id: 'job-004',
    erpJobNumber: 'ERP-2024-00145',
    clientName: 'EduTech University',
    siteName: 'Campus IT Department',
    siteAddress: '321 University Ave, Oxford OX1 2AB',
    status: 'en-route',
    scheduledDate: '2024-12-04',
    assets: [
      { id: 'a9', category: 'laptop', quantity: 200 },
      { id: 'a10', category: 'monitor', quantity: 150 },
    ],
    driver: { name: 'Emma Davis', vehicleReg: 'EF78 LMN', vehicleType: 'truck', eta: '14:30', phone: '+44 7700 900321' },
    co2eSaved: 112000,
    travelEmissions: 65,
    buybackValue: 20750,
    charityPercent: 20,
    certificates: [],
  },
  {
    id: 'job-005',
    erpJobNumber: 'ERP-2024-00146',
    clientName: 'RetailMax Stores',
    siteName: 'Distribution Centre',
    siteAddress: '555 Logistics Park, Leeds LS1 4AA',
    status: 'booked',
    scheduledDate: '2024-12-10',
    assets: [
      { id: 'a11', category: 'phone', quantity: 500 },
      { id: 'a12', category: 'tablet', quantity: 200 },
      { id: 'a13', category: 'network', quantity: 80 },
    ],
    co2eSaved: 66600,
    travelEmissions: 95,
    buybackValue: 33550,
    charityPercent: 0,
    certificates: [],
  },
];

export const statusConfig: Record<WorkflowStatus, { label: string; color: string; bgColor: string }> = {
  'booked': { label: 'Booked', color: 'text-info', bgColor: 'bg-info/10' },
  'routed': { label: 'Routed', color: 'text-accent-foreground', bgColor: 'bg-accent/20' },
  'en-route': { label: 'En Route', color: 'text-warning-foreground', bgColor: 'bg-warning/20' },
  'collected': { label: 'Collected', color: 'text-primary', bgColor: 'bg-primary/10' },
  'warehouse': { label: 'At Warehouse', color: 'text-secondary-foreground', bgColor: 'bg-secondary' },
  'sanitised': { label: 'Sanitised', color: 'text-primary', bgColor: 'bg-primary/15' },
  'graded': { label: 'Graded', color: 'text-success', bgColor: 'bg-success/15' },
  'finalised': { label: 'Finalised', color: 'text-success-foreground', bgColor: 'bg-success/20' },
};

// CO2e equivalencies for visualisation
export const co2eEquivalencies = {
  treesPlanted: (kg: number) => Math.round(kg / 21), // 1 tree absorbs ~21kg CO2/year
  householdDays: (kg: number) => Math.round(kg / 27), // UK household ~27kg CO2/day
  carMiles: (kg: number) => Math.round(kg / 0.21), // ~0.21kg CO2 per mile
  flightHours: (kg: number) => Math.round(kg / 250), // ~250kg CO2 per flight hour
};

export const vehicleEmissions: Record<string, number> = {
  car: 0.17, // kg CO2 per km
  van: 0.24,
  truck: 0.89,
};

export function calculateTravelEmissions(distanceKm: number, vehicleType: string): number {
  return Math.round(distanceKm * (vehicleEmissions[vehicleType] || 0.24) * 2); // Round trip
}

export function calculateReuseCO2e(assets: { categoryId: string; quantity: number }[]): number {
  return assets.reduce((total, asset) => {
    const category = assetCategories.find(c => c.id === asset.categoryId);
    return total + (category?.co2ePerUnit || 0) * asset.quantity;
  }, 0);
}

export function calculateBuybackEstimate(assets: { categoryId: string; quantity: number }[]): number {
  return assets.reduce((total, asset) => {
    const category = assetCategories.find(c => c.id === asset.categoryId);
    return total + (category?.avgBuybackValue || 0) * asset.quantity;
  }, 0);
}

// Dashboard stats
export const dashboardStats = {
  totalJobs: mockJobs.length,
  activeJobs: mockJobs.filter(j => !['finalised'].includes(j.status)).length,
  totalCO2eSaved: mockJobs.reduce((sum, j) => sum + j.co2eSaved, 0),
  totalBuyback: mockJobs.reduce((sum, j) => sum + j.buybackValue, 0),
  totalAssets: mockJobs.reduce((sum, j) => sum + j.assets.reduce((a, asset) => a + asset.quantity, 0), 0),
  avgCharityPercent: Math.round(mockJobs.reduce((sum, j) => sum + j.charityPercent, 0) / mockJobs.length),
};
