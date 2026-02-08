import type { Coordinates } from '../backend';

export interface ParsedPlace {
  city: string;
  suburb: string;
  area: string;
  roadName: string;
  coords: Coordinates;
}

/**
 * Parse a Google Places PlaceResult into normalized location fields
 * with best-effort matching and empty-string defaults for missing values
 */
export function parsePlaceResult(place: any): ParsedPlace | null {
  // Extract coordinates
  const coords = extractCoordinates(place);
  if (!coords) {
    return null;
  }

  // Parse address components
  const addressComponents = place.address_components || [];
  
  let city = '';
  let suburb = '';
  let area = '';
  let roadName = '';

  // Best-effort matching for address components
  for (const component of addressComponents) {
    const types = component.types;
    
    // City: locality or administrative_area_level_2
    if (types.includes('locality')) {
      city = component.long_name;
    } else if (!city && types.includes('administrative_area_level_2')) {
      city = component.long_name;
    }
    
    // Suburb: sublocality_level_1 or neighborhood
    if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
      suburb = component.long_name;
    } else if (!suburb && types.includes('neighborhood')) {
      suburb = component.long_name;
    }
    
    // Area: sublocality_level_2 or sublocality_level_3
    if (types.includes('sublocality_level_2')) {
      area = component.long_name;
    } else if (!area && types.includes('sublocality_level_3')) {
      area = component.long_name;
    }
    
    // Road name: route or street_address
    if (types.includes('route')) {
      roadName = component.long_name;
    } else if (!roadName && types.includes('street_address')) {
      roadName = component.long_name;
    }
  }

  // Fallback: use formatted_address or name if specific fields are missing
  if (!roadName && place.name) {
    roadName = place.name;
  }

  return {
    city: city || '',
    suburb: suburb || '',
    area: area || '',
    roadName: roadName || '',
    coords,
  };
}

/**
 * Extract coordinates from a PlaceResult
 */
export function extractCoordinates(place: any): Coordinates | null {
  if (!place.geometry?.location) {
    return null;
  }

  const location = place.geometry.location;
  
  // Handle both LatLng object and LatLngLiteral
  const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
  const lng = typeof location.lng === 'function' ? location.lng() : location.lng;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  return { lat, lng };
}

/**
 * Get display text for a place (for updating the search input)
 */
export function getPlaceDisplayText(place: any): string {
  return place.formatted_address || place.name || '';
}
