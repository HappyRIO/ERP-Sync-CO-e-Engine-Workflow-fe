// Additional Mock Entities for Role-Based Features
// This file contains mock data for: bookings, clients, invoices, commission, users

import type { User } from '@/types/auth';
import type { BookingLifecycleStatus } from '@/types/booking-lifecycle';

// Extended User type for admin user management
export interface ExtendedUser extends User {
  isActive: boolean; // Deprecated: use status field instead, but keeping for backwards compatibility
  status?: 'pending' | 'active' | 'inactive'; // New signups are 'pending', approved users are 'active'
  lastLogin?: string;
  invitedBy?: string;
}

// Client entity (for reseller client management)
export interface Client {
  id: string;
  name: string;
  tenantId: string;
  tenantName: string;
  email: string;
  contactName: string;
  contactPhone: string;
  resellerId?: string; // If managed by reseller
  resellerName?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  totalBookings: number;
  totalJobs: number;
  totalValue: number;
}

// Booking entity (separate from jobs - represents booking requests)
export interface Booking {
  id: string;
  bookingNumber: string;
  clientId: string;
  clientName: string;
  resellerId?: string;
  resellerName?: string;
  siteName: string;
  siteAddress: string;
  scheduledDate: string;
  status: BookingLifecycleStatus | 'cancelled';
  assets: Array<{
    categoryId: string;
    categoryName: string;
    quantity: number;
  }>;
  charityPercent: number;
  estimatedCO2e: number;
  estimatedBuyback: number;
  jobId?: string; // Linked job if created
  driverId?: string; // Assigned driver
  driverName?: string;
  createdAt: string;
  createdBy: string;
  scheduledBy?: string; // Admin who scheduled
  scheduledAt?: string;
  collectedAt?: string;
  sanitisedAt?: string;
  gradedAt?: string;
  completedAt?: string;
  notes?: string;
}

// Sanitisation record
export interface SanitisationRecord {
  id: string;
  bookingId: string;
  jobId?: string;
  assetId: string;
  method: 'blancco' | 'physical-destruction' | 'degaussing' | 'shredding' | 'other';
  methodDetails?: string;
  timestamp: string;
  performedBy: string; // Admin/Ops user ID
  certificateId: string;
  certificateUrl: string;
  verified: boolean;
  notes?: string;
}

// Grading record
export interface GradingRecord {
  id: string;
  bookingId: string;
  jobId?: string;
  assetId: string;
  assetCategory: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'Recycled';
  resaleValue: number;
  gradedAt: string;
  gradedBy: string; // Admin user ID
  notes?: string;
  condition?: string; // Physical condition notes
}

// Invoice entity
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  jobId: string;
  jobNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  downloadUrl: string;
}

// Commission record (for resellers)
export interface Commission {
  id: string;
  resellerId: string;
  resellerName: string;
  clientId: string;
  clientName: string;
  jobId: string;
  jobNumber: string;
  bookingId: string;
  bookingNumber: string;
  commissionPercent: number;
  jobValue: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid';
  period: string; // YYYY-MM
  paidDate?: string;
  createdAt: string;
}

// Sanitisation record
export interface SanitisationRecord {
  id: string;
  bookingId: string;
  jobId?: string;
  assetId: string;
  method: 'blancco' | 'physical-destruction' | 'degaussing' | 'shredding' | 'other';
  methodDetails?: string;
  timestamp: string;
  performedBy: string; // Admin/Ops user ID
  certificateId: string;
  certificateUrl: string;
  verified: boolean;
  notes?: string;
}

// Grading record
export interface GradingRecord {
  id: string;
  bookingId: string;
  jobId?: string;
  assetId: string;
  assetCategory: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'Recycled';
  resaleValue: number;
  gradedAt: string;
  gradedBy: string; // Admin user ID
  notes?: string;
  condition?: string; // Physical condition notes
}

// Mock Users (extended for admin management)
export const mockExtendedUsers: ExtendedUser[] = [
  {
    id: 'user-1',
    email: 'admin@reuse.com',
    name: 'Admin User',
    role: 'admin',
    tenantId: 'tenant-1',
    tenantName: 'Reuse ITAD Platform',
    createdAt: '2024-01-01',
    isActive: true,
    lastLogin: '2024-12-17T10:30:00Z',
  },
  {
    id: 'user-2',
    email: 'client@techcorp.com',
    name: 'Client User',
    role: 'client',
    tenantId: 'tenant-2',
    tenantName: 'TechCorp Industries',
    createdAt: '2024-01-15',
    isActive: true,
    lastLogin: '2024-12-17T09:15:00Z',
    invitedBy: 'user-1',
  },
  {
    id: 'user-3',
    email: 'reseller@partner.com',
    name: 'Reseller User',
    role: 'reseller',
    tenantId: 'tenant-3',
    tenantName: 'Partner Solutions',
    createdAt: '2024-02-01',
    isActive: true,
    lastLogin: '2024-12-17T08:45:00Z',
    invitedBy: 'user-1',
  },
  {
    id: 'user-4',
    email: 'driver@reuse.com',
    name: 'James Wilson',
    role: 'driver',
    tenantId: 'tenant-1',
    tenantName: 'Reuse ITAD Platform',
    createdAt: '2024-03-01',
    isActive: true,
    lastLogin: '2024-12-17T07:20:00Z',
    invitedBy: 'user-1',
  },
  {
    id: 'user-5',
    email: 'client2@techcorp.com',
    name: 'TechCorp Manager',
    role: 'client',
    tenantId: 'tenant-2',
    tenantName: 'TechCorp Industries',
    createdAt: '2024-04-01',
    isActive: true,
    lastLogin: '2024-12-16T16:30:00Z',
    invitedBy: 'user-2',
  },
  {
    id: 'user-6',
    email: 'driver2@reuse.com',
    name: 'Sarah Chen',
    role: 'driver',
    tenantId: 'tenant-1',
    tenantName: 'Reuse ITAD Platform',
    createdAt: '2024-05-01',
    isActive: true,
    lastLogin: '2024-12-17T06:00:00Z',
    invitedBy: 'user-1',
  },
];

// Mock Clients (for reseller and admin management)
export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'TechCorp Industries',
    tenantId: 'tenant-2',
    tenantName: 'TechCorp Industries',
    email: 'contact@techcorp.com',
    contactName: 'Client User',
    contactPhone: '+44 20 1234 5678',
    status: 'active',
    createdAt: '2024-01-15',
    totalBookings: 12,
    totalJobs: 8,
    totalValue: 45000,
  },
  {
    id: 'client-2',
    name: 'Green Finance Ltd',
    tenantId: 'tenant-4',
    tenantName: 'Green Finance Ltd',
    email: 'contact@greenfinance.com',
    contactName: 'Finance Manager',
    contactPhone: '+44 20 2345 6789',
    resellerId: 'tenant-3',
    resellerName: 'Partner Solutions',
    status: 'active',
    createdAt: '2024-03-01',
    totalBookings: 5,
    totalJobs: 3,
    totalValue: 12000,
  },
  {
    id: 'client-3',
    name: 'HealthFirst NHS Trust',
    tenantId: 'tenant-5',
    tenantName: 'HealthFirst NHS Trust',
    email: 'contact@healthfirst.nhs.uk',
    contactName: 'IT Manager',
    contactPhone: '+44 20 3456 7890',
    resellerId: 'tenant-3',
    resellerName: 'Partner Solutions',
    status: 'active',
    createdAt: '2024-04-01',
    totalBookings: 8,
    totalJobs: 6,
    totalValue: 28000,
  },
  {
    id: 'client-4',
    name: 'EduTech University',
    tenantId: 'tenant-6',
    tenantName: 'EduTech University',
    email: 'contact@edutech.ac.uk',
    contactName: 'Procurement Officer',
    contactPhone: '+44 20 4567 8901',
    status: 'pending',
    createdAt: '2024-12-01',
    totalBookings: 0,
    totalJobs: 0,
    totalValue: 0,
  },
];

// Mock Bookings (booking requests, separate from jobs)
export const mockBookings: Booking[] = [
  {
    id: 'booking-001',
    bookingNumber: 'BK-2024-001',
    clientId: 'tenant-2',
    clientName: 'TechCorp Industries',
    siteName: 'London HQ',
    siteAddress: '123 Tech Street, London EC1A 1BB',
    scheduledDate: '2024-12-20',
    status: 'scheduled',
    driverId: 'user-4',
    driverName: 'James Wilson',
    scheduledBy: 'user-1',
    scheduledAt: '2024-12-15T10:00:00Z',
    assets: [
      { categoryId: 'laptop', categoryName: 'Laptops', quantity: 30 },
      { categoryId: 'monitor', categoryName: 'Monitors', quantity: 20 },
    ],
    charityPercent: 10,
    estimatedCO2e: 18000,
    estimatedBuyback: 3500,
    jobId: 'job-001',
    createdAt: '2024-11-15',
    createdBy: 'user-2',
  },
  {
    id: 'booking-002',
    bookingNumber: 'BK-2024-002',
    clientId: 'tenant-2',
    clientName: 'TechCorp Industries',
    siteName: 'Manchester Office',
    siteAddress: '456 Business Park, Manchester M1 2AB',
    scheduledDate: '2024-12-22',
    status: 'created',
    assets: [
      { categoryId: 'desktop', categoryName: 'Desktops', quantity: 15 },
      { categoryId: 'printer', categoryName: 'Printers', quantity: 5 },
    ],
    charityPercent: 5,
    estimatedCO2e: 8500,
    estimatedBuyback: 900,
    createdAt: '2024-12-10',
    createdBy: 'user-2',
  },
  {
    id: 'booking-003',
    bookingNumber: 'BK-2024-003',
    clientId: 'tenant-4',
    clientName: 'Green Finance Ltd',
    resellerId: 'tenant-3',
    resellerName: 'Partner Solutions',
    siteName: 'Leeds Branch',
    siteAddress: '100 Finance Road, Leeds LS1 1FG',
    scheduledDate: '2024-12-25',
    status: 'collected',
    driverId: 'user-4',
    driverName: 'James Wilson',
    scheduledBy: 'user-1',
    scheduledAt: '2024-12-20T09:00:00Z',
    collectedAt: '2024-12-25T14:30:00Z',
    assets: [
      { categoryId: 'laptop', categoryName: 'Laptops', quantity: 25 },
      { categoryId: 'phone', categoryName: 'Mobile Phones', quantity: 40 },
    ],
    charityPercent: 0,
    estimatedCO2e: 12000,
    estimatedBuyback: 2500,
    createdAt: '2024-12-05',
    createdBy: 'user-3',
    notes: 'Created on behalf of client',
  },
  {
    id: 'booking-004',
    bookingNumber: 'BK-2024-004',
    clientId: 'tenant-5',
    clientName: 'HealthFirst NHS Trust',
    resellerId: 'tenant-3',
    resellerName: 'Partner Solutions',
    siteName: 'Manchester Clinic',
    siteAddress: '200 Health Lane, Manchester M1 2GH',
    scheduledDate: '2024-12-28',
    status: 'created',
    assets: [
      { categoryId: 'tablet', categoryName: 'Tablets', quantity: 50 },
      { categoryId: 'server', categoryName: 'Servers', quantity: 3 },
    ],
    charityPercent: 15,
    estimatedCO2e: 15000,
    estimatedBuyback: 1200,
    createdAt: '2024-12-12',
    createdBy: 'user-3',
  },
  {
    id: 'booking-005',
    bookingNumber: 'BK-2024-005',
    clientId: 'tenant-2',
    clientName: 'TechCorp Industries',
    siteName: 'Birmingham Office',
    siteAddress: '45 Tech Park, Birmingham B1 1CD',
    scheduledDate: '2024-12-10',
    status: 'sanitised',
    driverId: 'user-4',
    driverName: 'James Wilson',
    scheduledBy: 'user-1',
    scheduledAt: '2024-12-05T08:00:00Z',
    collectedAt: '2024-12-10T11:00:00Z',
    sanitisedAt: '2024-12-11T15:00:00Z',
    assets: [
      { categoryId: 'laptop', categoryName: 'Laptops', quantity: 25 },
      { categoryId: 'monitor', categoryName: 'Monitors', quantity: 15 },
    ],
    charityPercent: 5,
    estimatedCO2e: 12000,
    estimatedBuyback: 2500,
    createdAt: '2024-12-01',
    createdBy: 'user-2',
  },
  {
    id: 'booking-006',
    bookingNumber: 'BK-2024-006',
    clientId: 'tenant-2',
    clientName: 'TechCorp Industries',
    siteName: 'Leeds Branch',
    siteAddress: '100 Finance Road, Leeds LS1 1FG',
    scheduledDate: '2024-12-05',
    status: 'graded',
    driverId: 'user-4',
    driverName: 'James Wilson',
    scheduledBy: 'user-1',
    scheduledAt: '2024-12-01T09:00:00Z',
    collectedAt: '2024-12-05T13:00:00Z',
    sanitisedAt: '2024-12-06T10:00:00Z',
    gradedAt: '2024-12-07T14:00:00Z',
    assets: [
      { categoryId: 'desktop', categoryName: 'Desktops', quantity: 20 },
      { categoryId: 'printer', categoryName: 'Printers', quantity: 8 },
    ],
    charityPercent: 10,
    estimatedCO2e: 10440,
    estimatedBuyback: 1200,
    createdAt: '2024-11-25',
    createdBy: 'user-2',
  },
  {
    id: 'booking-007',
    bookingNumber: 'BK-2024-007',
    clientId: 'tenant-2',
    clientName: 'TechCorp Industries',
    siteName: 'London HQ',
    siteAddress: '123 Tech Street, London EC1A 1BB',
    scheduledDate: '2024-11-28',
    status: 'completed',
    driverId: 'user-4',
    driverName: 'James Wilson',
    scheduledBy: 'user-1',
    scheduledAt: '2024-11-20T10:00:00Z',
    collectedAt: '2024-11-28T12:00:00Z',
    sanitisedAt: '2024-11-29T09:00:00Z',
    gradedAt: '2024-11-30T11:00:00Z',
    completedAt: '2024-12-01T16:00:00Z',
    assets: [
      { categoryId: 'laptop', categoryName: 'Laptops', quantity: 45 },
      { categoryId: 'monitor', categoryName: 'Monitors', quantity: 30 },
      { categoryId: 'phone', categoryName: 'Mobile Phones', quantity: 25 },
    ],
    charityPercent: 10,
    estimatedCO2e: 26150,
    estimatedBuyback: 5875,
    createdAt: '2024-11-15',
    createdBy: 'user-2',
  },
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2024-00142',
    clientId: 'tenant-2',
    clientName: 'TechCorp Industries',
    jobId: 'job-001',
    jobNumber: 'ERP-2024-00142',
    issueDate: '2024-12-01',
    dueDate: '2024-12-31',
    amount: 5875,
    status: 'sent',
    items: [
      { description: 'Laptop Collection & Processing (45 units)', quantity: 45, unitPrice: 85, total: 3825 },
      { description: 'Monitor Collection & Processing (30 units)', quantity: 30, unitPrice: 25, total: 750 },
      { description: 'Phone Collection & Processing (25 units)', quantity: 25, unitPrice: 40, total: 1000 },
      { description: 'Data Wipe Service', quantity: 1, unitPrice: 300, total: 300 },
    ],
    subtotal: 5875,
    tax: 1175,
    total: 7050,
    downloadUrl: '#',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2024-00143',
    clientId: 'tenant-2',
    clientName: 'TechCorp Industries',
    jobId: 'job-002',
    jobNumber: 'ERP-2024-00143',
    issueDate: '2024-12-05',
    dueDate: '2025-01-04',
    amount: 1200,
    status: 'paid',
    items: [
      { description: 'Desktop Collection & Processing (20 units)', quantity: 20, unitPrice: 45, total: 900 },
      { description: 'Printer Collection & Processing (8 units)', quantity: 8, unitPrice: 15, total: 120 },
      { description: 'Data Wipe Service', quantity: 1, unitPrice: 180, total: 180 },
    ],
    subtotal: 1200,
    tax: 240,
    total: 1440,
    downloadUrl: '#',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2024-00144',
    clientId: 'tenant-2',
    clientName: 'TechCorp Industries',
    jobId: 'job-003',
    jobNumber: 'ERP-2024-00144',
    issueDate: '2024-12-10',
    dueDate: '2025-01-09',
    amount: 4000,
    status: 'sent',
    items: [
      { description: 'Server Collection & Processing (5 units)', quantity: 5, unitPrice: 250, total: 1250 },
      { description: 'Network Equipment Collection & Processing (12 units)', quantity: 12, unitPrice: 35, total: 420 },
      { description: 'Data Wipe Service', quantity: 1, unitPrice: 2330, total: 2330 },
    ],
    subtotal: 4000,
    tax: 800,
    total: 4800,
    downloadUrl: '#',
  },
];

// Mock Commission Records
export const mockCommissions: Commission[] = [
  {
    id: 'comm-001',
    resellerId: 'tenant-3',
    resellerName: 'Partner Solutions',
    clientId: 'tenant-4',
    clientName: 'Green Finance Ltd',
    jobId: 'job-004',
    jobNumber: 'ERP-2024-00145',
    bookingId: 'booking-003',
    bookingNumber: 'BK-2024-003',
    commissionPercent: 15,
    jobValue: 1200,
    commissionAmount: 180,
    status: 'approved',
    period: '2024-12',
    createdAt: '2024-12-15',
  },
  {
    id: 'comm-002',
    resellerId: 'tenant-3',
    resellerName: 'Partner Solutions',
    clientId: 'tenant-5',
    clientName: 'HealthFirst NHS Trust',
    jobId: 'job-005',
    jobNumber: 'ERP-2024-00146',
    bookingId: 'booking-004',
    bookingNumber: 'BK-2024-004',
    commissionPercent: 15,
    jobValue: 4000,
    commissionAmount: 600,
    status: 'paid',
    period: '2024-11',
    paidDate: '2024-12-01',
    createdAt: '2024-11-20',
  },
  {
    id: 'comm-003',
    resellerId: 'tenant-3',
    resellerName: 'Partner Solutions',
    clientId: 'tenant-4',
    clientName: 'Green Finance Ltd',
    jobId: 'job-010',
    jobNumber: 'ERP-2024-00151',
    bookingId: 'booking-003',
    bookingNumber: 'BK-2024-003',
    commissionPercent: 15,
    jobValue: 15000,
    commissionAmount: 2250,
    status: 'pending',
    period: '2024-12',
    createdAt: '2024-12-20',
  },
];

