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

/**
 * Calculate round trip distance from collection site to warehouse
 */
export function calculateRoundTripDistance(
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

export function calculateBuybackEstimate(
  assets: { categoryId: string; quantity: number }[],
  categories: AssetCategory[]
): number {
  return assets.reduce((total, asset) => {
    const category = categories.find(c => c.id === asset.categoryId);
    return total + (category?.avgBuybackValue || 0) * asset.quantity;
  }, 0);
}

