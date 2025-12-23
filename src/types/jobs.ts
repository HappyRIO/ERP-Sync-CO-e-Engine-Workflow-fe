// Job and Workflow Types

export type WorkflowStatus = 
  | 'booked' 
  | 'routed' 
  | 'en-route' 
  | 'arrived'    // Driver has arrived at collection site
  | 'collected' 
  | 'warehouse' 
  | 'sanitised' 
  | 'graded' 
  | 'finalised';

export interface Job {
  id: string;
  erpJobNumber: string;
  bookingId?: string; // Link to booking
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
  sanitisationRecordId?: string; // Link to sanitisation record
  gradingRecordId?: string; // Link to grading record
  resaleValue?: number; // Per-unit resale value
}

export interface Driver {
  id?: string; // Optional user ID to link driver to user
  name: string;
  vehicleReg: string;
  vehicleType: 'van' | 'truck' | 'car';
  vehicleFuelType?: 'petrol' | 'diesel' | 'electric'; // Fuel type of the vehicle
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

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalCO2eSaved: number;
  totalBuyback: number;
  totalAssets: number;
  avgCharityPercent: number;
  // Travel emissions breakdown by vehicle type
  travelEmissions?: {
    petrol: number; // kg CO2e
    diesel: number; // kg CO2e
    electric: number; // kg CO2e
    totalDistanceKm: number; // Total round trip distance
    totalDistanceMiles: number; // Total round trip distance in miles
  };
  // For client dashboard: actual vs estimated
  completedJobsCount?: number;
  bookedJobsCount?: number;
  completedCO2eSaved?: number;
  estimatedCO2eSaved?: number;
}

export interface JobsFilter {
  status?: WorkflowStatus | 'all';
  clientName?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

