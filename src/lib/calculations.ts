// Calculation utilities
// These are pure calculation functions, not data access
// Note: These functions accept category data as parameters to avoid direct mock data access

import type { AssetCategory } from '@/types/jobs';

// Vehicle emissions in kg CO2 per km (one way)
export const vehicleEmissions: Record<string, number> = {
  petrol: 0.21, // kg CO2 per km (average petrol vehicle)
  diesel: 0.19, // kg CO2 per km (average diesel vehicle)
  electric: 0.0, // kg CO2 per km (fully electric, zero tailpipe emissions)
  // Legacy support
  car: 0.17,
  van: 0.24,
  truck: 0.89,
};

// Warehouse location (RM13 8BT coordinates - Rainham, London)
export const WAREHOUSE_POSTCODE = 'RM13 8BT';
export const WAREHOUSE_COORDINATES = {
  lat: 51.5174, // Coordinates for RM13 8BT area
  lng: 0.1904,
};

/**
 * Geocode a postcode to get coordinates (using OpenStreetMap Nominatim)
 * This is a utility function for future use if we need to geocode the warehouse dynamically
 */
export async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postcode)}&limit=1&countrycodes=gb`
    );
    const data = await response.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Import road distance function
import { calculateRoundTripRoadDistance } from './routing';

/**
 * Calculate round trip road distance from collection site to warehouse
 * Note: This is now async and uses road distance instead of straight-line
 * For synchronous fallback, use calculateRoundTripDistanceSync
 */
export async function calculateRoundTripDistance(
  collectionLat: number,
  collectionLng: number
): Promise<number> {
  return calculateRoundTripRoadDistance(
    collectionLat,
    collectionLng,
    WAREHOUSE_COORDINATES.lat,
    WAREHOUSE_COORDINATES.lng
  );
}

/**
 * Calculate round trip distance using straight-line (synchronous fallback)
 * Use this only when you need synchronous calculation
 */
export function calculateRoundTripDistanceSync(
  collectionLat: number,
  collectionLng: number
): number {
  const oneWay = calculateDistance(
    collectionLat,
    collectionLng,
    WAREHOUSE_COORDINATES.lat,
    WAREHOUSE_COORDINATES.lng
  );
  return oneWay * 2; // Round trip
}

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

/**
 * Calculate travel emissions for a specific vehicle type
 * Returns emissions in kg CO2e
 */
export function calculateTravelEmissions(distanceKm: number, vehicleType: string): number {
  // Electric vehicles always have zero emissions
  if (vehicleType === 'electric') {
    return 0;
  }
  const emissionsPerKm = vehicleEmissions[vehicleType] || vehicleEmissions.petrol;
  return Math.round(distanceKm * emissionsPerKm * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate travel emissions for all vehicle types
 */
export function calculateAllVehicleEmissions(distanceKm: number): {
  petrol: number;
  diesel: number;
  electric: number;
} {
  return {
    petrol: calculateTravelEmissions(distanceKm, 'petrol'),
    diesel: calculateTravelEmissions(distanceKm, 'diesel'),
    electric: 0, // Electric vehicles always have zero emissions
  };
}

export function calculateReuseCO2e(
  assets: { categoryId: string; quantity: number }[],
  categories: AssetCategory[]
): number {
  return assets.reduce((total, asset) => {
    const category = categories.find(c => c.id === asset.categoryId);
    return total + (category?.co2ePerUnit || 0) * asset.quantity;
  }, 0);
}

/**
 * Conservative buyback calculator constants
 * Based on baseline: 3-year-old equipment, Grade B condition, bulk volumes
 */

// Average RRP values by category (GBP)
const categoryAvgRRP: Record<string, number> = {
  'Networking': 2000,
  'Laptop': 1000,
  'Server': 5000,
  'Smart Phones': 700,
  'Smartphone': 700,
  'Smartphones': 700,
  'Desktop': 900,
  'Storage': 6000,
  'Tablets': 600,
  'Tablet': 600,
};

// Low residual percentages @ 3 years (R^c_low) - conservative bottom-quartile values
const categoryResidualLow: Record<string, number> = {
  'Networking': 0.15,    // 15%
  'Laptop': 0.18,        // 18%
  'Server': 0.08,        // 8%
  'Smart Phones': 0.17,  // 17%
  'Smartphone': 0.17,
  'Smartphones': 0.17,
  'Desktop': 0.09,       // 9%
  'Storage': 0.05,       // 5%
  'Tablets': 0.17,       // 17%
  'Tablet': 0.17,
};

// Volume factor based on quantity (muted upside)
function getVolumeFactor(quantity: number): number {
  if (quantity >= 200) return 1.10;
  if (quantity >= 50) return 1.06;
  if (quantity >= 10) return 1.03;
  return 1.00; // 1-9 items
}

// Floor and cap values by category (GBP)
const categoryFloors: Record<string, number> = {
  'Networking': 30,
  'Laptop': 30,
  'Server': 50,
  'Smart Phones': 10,
  'Smartphone': 10,
  'Smartphones': 10,
  'Desktop': 10,
  'Storage': 50,
  'Tablets': 15,
  'Tablet': 15,
};

const categoryCaps: Record<string, number> = {
  'Networking': 2000,
  'Laptop': 600,
  'Server': 2500,
  'Smart Phones': 450,
  'Smartphone': 450,
  'Smartphones': 450,
  'Desktop': 250,
  'Storage': 3000,
  'Tablets': 400,
  'Tablet': 400,
};

/**
 * Normalize category name for lookup
 */
function normalizeCategoryName(categoryName: string | undefined): string {
  if (!categoryName) {
    return '';
  }
  const normalized = categoryName.trim();
  // Try exact match first
  if (categoryAvgRRP[normalized]) return normalized;
  
  // Try case-insensitive match
  for (const key in categoryAvgRRP) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return key;
    }
  }
  
  // Try partial match
  const normalizedLower = normalized.toLowerCase();
  for (const key in categoryAvgRRP) {
    if (normalizedLower.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedLower)) {
      return key;
    }
  }
  
  return normalized;
}

/**
 * Calculate conservative low-end buyback estimate per unit
 * 
 * Formula: buyback = (RRP × residual_low %) × volume_factor × condition_factor × age_factor × market_factor
 * 
 * Fixed values:
 * - Age: 3 years (36 months) → age_factor = 1.0
 * - Grade: B → condition_factor = 1.0
 * - Market: default → market_factor = 1.0
 * 
 * Client inputs: category and quantity only
 */
function calculateBuybackPerUnit(
  categoryName: string,
  quantity: number
): number {
  // Normalize category name
  const normalizedCategory = normalizeCategoryName(categoryName);
  
  // Get RRP and residual percentage
  const avgRRP = categoryAvgRRP[normalizedCategory] || 0;
  const residualLow = categoryResidualLow[normalizedCategory] || 0;
  
  if (avgRRP === 0 || residualLow === 0) {
    // Fallback: return 0 if category not recognized
    return 0;
  }
  
  // Base buyback = RRP × residual_low %
  const baseBuyback = avgRRP * residualLow;
  
  // Fixed factors (all 1.0 due to fixed conditions)
  const ageFactor = 1.0;        // Fixed at 3 years
  const conditionFactor = 1.0;  // Fixed at Grade B
  const marketFactor = 1.0;     // Default market index
  const specFactor = 1.0;       // Optional, default to 1.0 for conservative estimate
  
  // Variable factor
  const volumeFactor = getVolumeFactor(quantity);
  
  // Calculate raw buyback value
  const rawBuyback = baseBuyback * ageFactor * conditionFactor * volumeFactor * marketFactor * specFactor;
  
  // Apply floor and cap
  const floor = categoryFloors[normalizedCategory] || 0;
  const cap = categoryCaps[normalizedCategory] || Infinity;
  
  return Math.max(floor, Math.min(cap, rawBuyback));
}

export function calculateBuybackEstimate(
  assets: { categoryId: string; quantity: number }[],
  categories: AssetCategory[]
): number {
  return assets.reduce((total, asset) => {
    const category = categories.find(c => c.id === asset.categoryId);
    if (!category) return total;
    
    const buybackPerUnit = calculateBuybackPerUnit(category.name, asset.quantity);
    return total + buybackPerUnit * asset.quantity;
  }, 0);
}

