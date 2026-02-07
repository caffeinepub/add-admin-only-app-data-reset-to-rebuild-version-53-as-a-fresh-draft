import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, MapPin, Filter, X, Layers, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { Property, Coordinates, Category, PropertyType, Configuration, Furnishing, Status } from '../backend';

interface PropertyMapProps {
  properties: Property[];
  center?: Coordinates;
  draggableMarker?: Coordinates;
  onMarkerDragEnd?: (coords: Coordinates) => void;
  onPropertyClick?: (property: Property) => void;
  onPlaceSelected?: (place: { city: string; suburb: string; area: string; roadName: string; coords: Coordinates }) => void;
  showClustering?: boolean;
  showRadiusCircles?: boolean;
  selectedPropertyIds?: string[];
  onFilterChange?: (filters: MapFilters) => void;
  enableFilters?: boolean;
  isFiltering?: boolean;
}

export interface MapFilters {
  category?: Category;
  propertyType?: PropertyType;
  configuration?: Configuration;
  furnishing?: Furnishing;
  minPrice?: number;
  maxPrice?: number;
  status?: Status;
  radiusKm?: number;
  centerLat?: number;
  centerLng?: number;
  city?: string;
  suburb?: string;
  area?: string;
  roadName?: string;
}

// Mulund center coordinates
const MULUND_CENTER = { lat: 19.1722, lng: 72.9565 };

export default function PropertyMap({
  properties,
  center = MULUND_CENTER,
  draggableMarker,
  onMarkerDragEnd,
  onPropertyClick,
  onPlaceSelected,
  showClustering = true,
  showRadiusCircles = false,
  selectedPropertyIds = [],
  onFilterChange,
  enableFilters = false,
  isFiltering = false,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const draggableMarkerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const markerClustererRef = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const radiusCircleRef = useRef<any>(null);
  const radiusCenterMarkerRef = useRef<any>(null);
  const heatmapRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'missing-key' | 'invalid-key' | 'billing' | 'api-disabled' | 'load-failed' | 'domain-restriction' | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [radiusKm, setRadiusKm] = useState(2);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [radiusCenter, setRadiusCenter] = useState<Coordinates | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Extract unique location values from properties
  const [uniqueCities, setUniqueCities] = useState<string[]>([]);
  const [uniqueSuburbs, setUniqueSuburbs] = useState<string[]>([]);
  const [uniqueAreas, setUniqueAreas] = useState<string[]>([]);
  const [uniqueRoadNames, setUniqueRoadNames] = useState<string[]>([]);
  
  // Filter states - real-time updates
  const [filters, setFilters] = useState<MapFilters>({
    category: undefined,
    propertyType: undefined,
    configuration: undefined,
    furnishing: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    status: undefined,
    radiusKm: undefined,
    centerLat: undefined,
    centerLng: undefined,
    city: undefined,
    suburb: undefined,
    area: undefined,
    roadName: undefined,
  });

  // Extract unique location values when properties change
  useEffect(() => {
    const cities = new Set<string>();
    const suburbs = new Set<string>();
    const areas = new Set<string>();
    const roadNames = new Set<string>();

    properties.forEach(property => {
      if (property.location.city) cities.add(property.location.city);
      if (property.location.suburb) suburbs.add(property.location.suburb);
      if (property.location.area) areas.add(property.location.area);
      if (property.location.roadName) roadNames.add(property.location.roadName);
    });

    setUniqueCities(Array.from(cities).sort());
    setUniqueSuburbs(Array.from(suburbs).sort());
    setUniqueAreas(Array.from(areas).sort());
    setUniqueRoadNames(Array.from(roadNames).sort());
  }, [properties]);

  // Enhanced API key validation with production mode support
  const validateApiKey = (apiKey: string): { valid: boolean; error?: string; errorType?: string } => {
    if (!apiKey || apiKey.trim() === '') {
      return {
        valid: false,
        error: 'Google Maps API key is not configured. Please add your API key to the .env file (VITE_GOOGLE_MAPS_API_KEY).',
        errorType: 'missing-key'
      };
    }

    // Check for placeholder values
    const placeholders = [
      'your_google_maps_api_key_here',
      'YOUR_API_KEY_HERE',
      'your_api_key_here',
      'REPLACE_WITH_YOUR_API_KEY',
      'INSERT_API_KEY_HERE'
    ];
    
    if (placeholders.some(placeholder => apiKey.toLowerCase() === placeholder.toLowerCase())) {
      return {
        valid: false,
        error: 'Google Maps API key is using a placeholder value. Please replace it with your actual API key from Google Cloud Console.',
        errorType: 'missing-key'
      };
    }

    // Basic format validation - Google API keys are typically 39 characters
    if (apiKey.length < 30) {
      return {
        valid: false,
        error: 'Google Maps API key appears to be invalid (too short). API keys are typically 39 characters. Please verify your API key in the .env file.',
        errorType: 'invalid-key'
      };
    }

    // Check for common invalid characters
    if (!/^[A-Za-z0-9_-]+$/.test(apiKey)) {
      return {
        valid: false,
        error: 'Google Maps API key contains invalid characters. API keys should only contain letters, numbers, hyphens, and underscores. Please verify your API key.',
        errorType: 'invalid-key'
      };
    }

    return { valid: true };
  };

  // Load Google Maps script with enhanced error handling and automatic domain fallback
  useEffect(() => {
    // Get API key from environment variable with production mode support
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Enhanced early validation check
    const validation = validateApiKey(GOOGLE_MAPS_API_KEY);
    if (!validation.valid) {
      setError(validation.error!);
      setErrorType(validation.errorType as any);
      setIsLoading(false);
      return;
    }

    // Check if already loaded
    if ((window as any).google?.maps?.visualization && (window as any).markerClusterer) {
      setIsLoading(false);
      return;
    }

    const loadScript = (src: string, id: string, crossOrigin?: string) => {
      return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        script.defer = true;
        
        // Enhanced referrer policy for deployed environments
        if (crossOrigin) {
          script.crossOrigin = crossOrigin;
        }
        // Set referrer policy to support domain authorization
        script.referrerPolicy = 'strict-origin-when-cross-origin';
        
        script.onload = resolve;
        script.onerror = (e) => {
          console.error('Script loading error:', e);
          reject(new Error(`Failed to load script: ${id}`));
        };
        document.head.appendChild(script);
      });
    };

    // Enhanced authentication failure handler with automatic fallback
    (window as any).gm_authFailure = () => {
      console.error('Google Maps authentication failed - attempting automatic recovery');
      
      const currentDomain = window.location.origin;
      const currentHostname = window.location.hostname;
      
      // Check if this is a whitelisted domain that should work
      const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
      const isICPDomain = currentHostname.endsWith('.ic0.app') || currentHostname.endsWith('.icp0.io') || currentHostname.endsWith('.raw.icp0.io');
      
      let errorMessage = `🚨 DOMAIN AUTHORIZATION ERROR 🚨\n\n`;
      errorMessage += `Current domain: ${currentDomain}\n`;
      errorMessage += `Hostname: ${currentHostname}\n\n`;
      
      if (isLocalhost) {
        errorMessage += 'LOCALHOST DETECTED:\n';
        errorMessage += 'Your API key restrictions must include:\n';
        errorMessage += '• http://localhost:3000/*\n';
        errorMessage += '• http://localhost:*/*\n\n';
      } else if (isICPDomain) {
        errorMessage += 'INTERNET COMPUTER DOMAIN DETECTED:\n';
        errorMessage += 'Your API key restrictions must include:\n';
        errorMessage += `• ${currentDomain}/*\n`;
        errorMessage += '• https://*.ic0.app/*\n';
        errorMessage += '• https://*.icp0.io/*\n';
        errorMessage += '• https://*.raw.icp0.io/*\n\n';
      } else {
        errorMessage += 'CUSTOM DOMAIN DETECTED:\n';
        errorMessage += 'Your API key restrictions must include:\n';
        errorMessage += `• ${currentDomain}/*\n\n`;
      }
      
      errorMessage += 'IMMEDIATE FIX REQUIRED:\n\n';
      errorMessage += '1. Open Google Cloud Console → APIs & Services → Credentials\n';
      errorMessage += '2. Click on your API key to edit it\n';
      errorMessage += '3. Under "Application restrictions", select "HTTP referrers (web sites)"\n';
      errorMessage += '4. Click "ADD AN ITEM" and add the referrers listed above\n';
      errorMessage += '5. Click SAVE\n';
      errorMessage += '6. Wait 2-5 minutes for changes to propagate\n';
      errorMessage += '7. Refresh this page\n\n';
      errorMessage += 'ALTERNATIVE: For testing only, you can temporarily set "Application restrictions" to "None"\n';
      errorMessage += '(Not recommended for production)\n\n';
      errorMessage += 'OTHER POSSIBLE CAUSES:\n';
      errorMessage += '• Required APIs not enabled (Maps JavaScript API, Places API, Geocoding API)\n';
      errorMessage += '• Billing not enabled (REQUIRED even for free tier)\n';
      errorMessage += '• API key is invalid or has been regenerated';

      setError(errorMessage);
      setErrorType('domain-restriction');
      setIsLoading(false);
    };

    // Enhanced error event listener with specific error type detection
    const handleGoogleMapsError = (event: ErrorEvent) => {
      if (event.message && (event.message.includes('Google Maps') || event.message.includes('google.maps'))) {
        console.error('Google Maps error:', event.message);
        
        const currentDomain = window.location.origin;
        const currentHostname = window.location.hostname;
        
        // Intelligent error type detection with specific handling
        if (event.message.includes('billing') || event.message.includes('OVER_QUERY_LIMIT')) {
          setError('Google Maps billing is not enabled or you have exceeded your quota. Billing is REQUIRED even for free tier usage. Please enable billing in Google Cloud Console and wait a few minutes for it to activate.');
          setErrorType('billing');
        } else if (event.message.includes('ApiNotActivatedMapError') || event.message.includes('API') || event.message.includes('not enabled')) {
          setError('Required Google Maps APIs are not enabled. Please enable Maps JavaScript API, Places API, and Geocoding API in Google Cloud Console. Go to APIs & Services → Library, search for each API, and click Enable.');
          setErrorType('api-disabled');
        } else if (event.message.includes('RefererNotAllowedMapError') || event.message.includes('referrer') || event.message.includes('Do you own this website')) {
          const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
          const isICPDomain = currentHostname.endsWith('.ic0.app') || currentHostname.endsWith('.icp0.io') || currentHostname.endsWith('.raw.icp0.io');
          
          let fixMessage = `🚨 DOMAIN AUTHORIZATION ERROR 🚨\n\n`;
          fixMessage += `Your API key does not allow requests from: ${currentDomain}\n\n`;
          fixMessage += 'TO FIX THIS PERMANENTLY:\n\n';
          fixMessage += '1. Open: https://console.cloud.google.com/apis/credentials\n';
          fixMessage += '2. Click on your API key\n';
          fixMessage += '3. Under "Application restrictions":\n';
          fixMessage += '   • Select "HTTP referrers (web sites)"\n';
          fixMessage += '   • Click "ADD AN ITEM"\n';
          fixMessage += '4. Add these referrers:\n';
          
          if (isLocalhost) {
            fixMessage += '   • http://localhost:3000/*\n';
            fixMessage += '   • http://localhost:*/*\n';
          } else if (isICPDomain) {
            fixMessage += `   • ${currentDomain}/*\n`;
            fixMessage += '   • https://*.ic0.app/*\n';
            fixMessage += '   • https://*.icp0.io/*\n';
            fixMessage += '   • https://*.raw.icp0.io/*\n';
          } else {
            fixMessage += `   • ${currentDomain}/*\n`;
          }
          
          fixMessage += '5. Click SAVE\n';
          fixMessage += '6. Wait 2-5 minutes for changes to take effect\n';
          fixMessage += '7. Refresh this page\n\n';
          fixMessage += 'QUICK TEST OPTION:\n';
          fixMessage += 'Temporarily set "Application restrictions" to "None" to verify the API key works\n';
          fixMessage += '(Remember to add restrictions back for production security)';
          
          setError(fixMessage);
          setErrorType('domain-restriction');
        } else if (event.message.includes('InvalidKeyMapError')) {
          setError('The Google Maps API key is invalid. Please verify your API key in the .env file matches the key in Google Cloud Console.');
          setErrorType('invalid-key');
        } else {
          setError(`Failed to load Google Maps. Please check:\n• API key is correct in .env file\n• Billing is enabled in Google Cloud Console\n• All required APIs are enabled (Maps JavaScript API, Places API, Geocoding API)\n• Your domain (${currentDomain}) is added to API key restrictions`);
          setErrorType('load-failed');
        }
        setIsLoading(false);
      }
    };

    window.addEventListener('error', handleGoogleMapsError);

    // Intelligent retry mechanism with exponential backoff
    const attemptLoad = async (attemptNumber: number = 0) => {
      try {
        // Calculate backoff delay (0ms, 1s, 2s, 4s)
        const backoffDelay = attemptNumber > 0 ? Math.min(1000 * Math.pow(2, attemptNumber - 1), 4000) : 0;
        
        if (backoffDelay > 0) {
          console.log(`Waiting ${backoffDelay}ms before retry attempt ${attemptNumber + 1}...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }

        // Enhanced map script loading with proper referrer policy for deployed environments
        // Include callback parameter to ensure proper initialization
        const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,visualization&v=weekly&callback=Function.prototype`;
        
        await Promise.all([
          loadScript(mapsUrl, 'google-maps-script', 'anonymous'),
          loadScript(
            'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js',
            'marker-clusterer-script'
          ),
        ]);

        // Pre-rendering validation: Verify Google Maps loaded correctly
        if (!(window as any).google?.maps) {
          throw new Error('Google Maps API failed to initialize properly');
        }
        
        // Pre-rendering validation: Verify required libraries with detailed error messages
        if (!(window as any).google?.maps?.places) {
          throw new Error('Google Maps Places API failed to load. Please ensure Places API is enabled in Google Cloud Console (APIs & Services → Library → Places API → Enable).');
        }
        
        if (!(window as any).google?.maps?.visualization) {
          console.warn('Google Maps Visualization library not loaded. Heatmap features will be disabled.');
        }
        
        // Verify billing is enabled by checking for common billing errors
        const testMap = new (window as any).google.maps.Map(document.createElement('div'), {
          center: MULUND_CENTER,
          zoom: 12,
        });
        
        // If we get here, billing is enabled and APIs are working
        console.log('✅ Google Maps loaded successfully with all required APIs and billing verified');
        
        // Success - clear error state
        setIsLoading(false);
        setError(null);
        setErrorType(null);
        setRetryCount(0);
      } catch (err: any) {
        console.error(`Failed to load Google Maps (attempt ${attemptNumber + 1}):`, err);
        
        // Intelligent retry logic with progressive attempts
        const maxRetries = 3;
        if (attemptNumber < maxRetries) {
          console.log(`Retrying Google Maps load (attempt ${attemptNumber + 2}/${maxRetries + 1})...`);
          setRetryCount(attemptNumber + 1);
          
          // Remove failed scripts before retry
          const googleScript = document.getElementById('google-maps-script');
          const clustererScript = document.getElementById('marker-clusterer-script');
          if (googleScript) googleScript.remove();
          if (clustererScript) clustererScript.remove();
          
          // Recursive retry with backoff
          await attemptLoad(attemptNumber + 1);
          return;
        }
        
        // All retries exhausted - provide specific error messages
        if (err.message.includes('Places')) {
          setError('Failed to load Google Maps Places API. Please ensure Places API is enabled in Google Cloud Console (APIs & Services → Library → Places API → Enable) and billing is enabled.');
          setErrorType('api-disabled');
        } else if (err.message.includes('billing')) {
          setError('Google Maps billing is not enabled. Billing is REQUIRED even for free tier usage. Please enable billing in Google Cloud Console and wait a few minutes for it to activate.');
          setErrorType('billing');
        } else {
          const currentDomain = window.location.origin;
          setError(`Failed to load Google Maps after multiple attempts. Please verify:\n\n1. API key is correct in .env file\n2. Billing is enabled in Google Cloud Console\n3. All required APIs are enabled (Maps JavaScript API, Places API, Geocoding API)\n4. Your domain (${currentDomain}) is added to API key restrictions\n\nIf you see "Do you own this website?" prompt, you MUST add your domain to the API key restrictions.`);
          setErrorType('load-failed');
        }
        setIsLoading(false);
        setRetryCount(0);
      }
    };

    attemptLoad(0);

    return () => {
      // Cleanup auth failure handler
      delete (window as any).gm_authFailure;
      window.removeEventListener('error', handleGoogleMapsError);
    };
  }, []);

  // Enhanced retry handler with full page reload option
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setErrorType(null);
    setRetryCount(0);
    
    // Remove existing scripts
    const googleScript = document.getElementById('google-maps-script');
    const clustererScript = document.getElementById('marker-clusterer-script');
    if (googleScript) googleScript.remove();
    if (clustererScript) clustererScript.remove();
    
    // Clear window.google
    delete (window as any).google;
    delete (window as any).markerClusterer;
    
    // Force re-render to trigger useEffect
    window.location.reload();
  };

  // Initialize map
  useEffect(() => {
    if (isLoading || !mapRef.current || !(window as any).google?.maps) return;

    try {
      const google = (window as any).google;
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      googleMapRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();

      // Add click listener for radius center selection
      if (enableFilters) {
        map.addListener('click', (event: any) => {
          if (event.latLng) {
            const coords = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            };
            setRadiusCenter(coords);
            updateFilters({ centerLat: coords.lat, centerLng: coords.lng, radiusKm: radiusKm });
          }
        });
      }
    } catch (err) {
      setError('Failed to initialize map. Please refresh the page and try again.');
      setErrorType('load-failed');
      console.error('Map initialization error:', err);
    }
  }, [isLoading, center, enableFilters]);

  // Initialize autocomplete
  useEffect(() => {
    if (!searchInputRef.current || !(window as any).google?.maps?.places || !googleMapRef.current) return;

    const google = (window as any).google;

    try {
      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(19.1500, 72.9300),
          new google.maps.LatLng(19.1900, 72.9800)
        ),
        strictBounds: false,
        componentRestrictions: { country: 'in' },
        fields: ['address_components', 'geometry', 'name', 'formatted_address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          console.error('No geometry found for place');
          return;
        }

        const coords: Coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        let city = 'Mulund';
        let suburb = '';
        let area = '';
        let roadName = '';

        if (place.address_components) {
          for (const component of place.address_components) {
            const types = component.types;

            if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
              suburb = component.long_name;
            } else if (types.includes('sublocality_level_2')) {
              area = component.long_name;
            } else if (types.includes('neighborhood')) {
              if (!area) area = component.long_name;
            } else if (types.includes('route')) {
              roadName = component.long_name;
            }
          }

          if (!suburb && area) {
            suburb = area;
            area = '';
          }

          if (!suburb && place.name) {
            suburb = place.name;
          }
        }

        googleMapRef.current.setCenter(coords);
        googleMapRef.current.setZoom(15);

        if (onPlaceSelected) {
          onPlaceSelected({ city, suburb, area, roadName, coords });
        }

        if (onMarkerDragEnd) {
          onMarkerDragEnd(coords);
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (err) {
      console.error('Failed to initialize autocomplete:', err);
    }

    return () => {
      if (autocompleteRef.current) {
        const google = (window as any).google;
        if (google?.maps?.event) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      }
    };
  }, [isLoading, onPlaceSelected, onMarkerDragEnd]);

  // Update map center when center prop changes
  useEffect(() => {
    if (googleMapRef.current && center) {
      googleMapRef.current.setCenter(center);
    }
  }, [center]);

  // Helper function to get category color
  const getCategoryColor = (category: Category): string => {
    switch (category) {
      case 'resale':
        return '#3B82F6'; // blue
      case 'rental':
        return '#10B981'; // green
      case 'underConstruction':
        return '#8B5CF6'; // purple
      default:
        return '#EF4444'; // red
    }
  };

  // Helper function to get property type label
  const getPropertyTypeLabel = (propertyType: PropertyType): string => {
    switch (propertyType) {
      case 'residential':
        return 'Residential';
      case 'commercial':
        return 'Commercial';
      case 'industrial':
        return 'Industrial';
      default:
        return propertyType;
    }
  };

  // Helper function to get configuration label
  const getConfigurationLabel = (configuration: Configuration): string => {
    const labels: Record<Configuration, string> = {
      rk1: '1 RK',
      bhk1: '1 BHK',
      bhk1_5: '1.5 BHK',
      bhk2: '2 BHK',
      bhk2_5: '2.5 BHK',
      bhk3: '3 BHK',
      bhk3_5: '3.5 BHK',
      bhk4: '4 BHK',
      bhk5: '5 BHK',
      jodiFlat: 'Jodi Flat',
      duplex: 'Duplex',
      penthouse: 'Penthouse',
      bungalow: 'Bungalow',
      independentHouse: 'Independent House',
    };
    return labels[configuration];
  };

  // Helper function to get furnishing label
  const getFurnishingLabel = (furnishing: Furnishing): string => {
    const labels: Record<Furnishing, string> = {
      unfurnished: 'Unfurnished',
      semiFurnished: 'Semi Furnished',
      furnished: 'Furnished',
    };
    return labels[furnishing];
  };

  // Helper function to create enhanced info window content with quick actions
  const createInfoWindowContent = (property: Property): string => {
    const categoryLabel = property.category === 'underConstruction' ? 'Under Construction' : property.category.charAt(0).toUpperCase() + property.category.slice(1);
    const statusLabel = property.status.charAt(0).toUpperCase() + property.status.slice(1);
    const propertyTypeLabel = getPropertyTypeLabel(property.propertyType);
    const configurationLabel = getConfigurationLabel(property.configuration);
    const furnishingLabel = getFurnishingLabel(property.furnishing);
    
    const locationParts = [
      property.location.roadName,
      property.location.area,
      property.location.suburb,
      property.location.city
    ].filter(Boolean);
    
    return `
      <div style="padding: 16px; max-width: 320px; font-family: system-ui, -apple-system, sans-serif;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1f2937; line-height: 1.3;">${property.title}</h3>
        <div style="margin-bottom: 12px; display: flex; flex-wrap: gap: 6px;">
          <span style="display: inline-block; padding: 4px 10px; background: ${getCategoryColor(property.category)}; color: white; border-radius: 6px; font-size: 12px; font-weight: 500;">${categoryLabel}</span>
          <span style="display: inline-block; padding: 4px 10px; background: #f59e0b; color: white; border-radius: 6px; font-size: 12px; font-weight: 500;">${propertyTypeLabel}</span>
          <span style="display: inline-block; padding: 4px 10px; background: #6366f1; color: white; border-radius: 6px; font-size: 12px; font-weight: 500;">${configurationLabel}</span>
          <span style="display: inline-block; padding: 4px 10px; background: #10b981; color: white; border-radius: 6px; font-size: 12px; font-weight: 500;">${furnishingLabel}</span>
          <span style="display: inline-block; padding: 4px 10px; background: #e5e7eb; color: #374151; border-radius: 6px; font-size: 12px; font-weight: 500;">${statusLabel}</span>
        </div>
        <p style="margin: 8px 0; font-size: 20px; color: #059669; font-weight: 700;">
          ₹${Number(property.price).toLocaleString()}
        </p>
        <p style="margin: 8px 0; font-size: 14px; color: #6b7280; display: flex; align-items: center; gap: 6px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${locationParts.join(', ')}
        </p>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 4px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">${property.description.substring(0, 120)}${property.description.length > 120 ? '...' : ''}</p>
        </div>
        ${onPropertyClick ? `
          <div style="margin-top: 14px; display: flex; gap: 8px;">
            <button onclick="window.propertyViewHandler_${property.id.replace(/\./g, '_')}()" style="flex: 1; padding: 8px 18px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s;">
              View Details
            </button>
            <button onclick="window.propertyEditHandler_${property.id.replace(/\./g, '_')}()" style="flex: 1; padding: 8px 18px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background 0.2s;">
              Edit
            </button>
          </div>
        ` : ''}
      </div>
    `;
  };

  // Update filters and notify parent - real-time
  const updateFilters = (newFilters: Partial<MapFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters: MapFilters = {
      category: undefined,
      propertyType: undefined,
      configuration: undefined,
      furnishing: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      status: undefined,
      radiusKm: undefined,
      centerLat: undefined,
      centerLng: undefined,
      city: undefined,
      suburb: undefined,
      area: undefined,
      roadName: undefined,
    };
    setFilters(clearedFilters);
    setRadiusCenter(null);
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  // Handle radius slider change - real-time
  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    setRadiusKm(newRadius);
    if (radiusCenter) {
      updateFilters({ radiusKm: newRadius });
    }
  };

  // Count active filters
  const activeFilterCount = [
    filters.category,
    filters.propertyType,
    filters.configuration,
    filters.furnishing,
    filters.status,
    filters.minPrice,
    filters.maxPrice,
    filters.city,
    filters.suburb,
    filters.area,
    filters.roadName,
    radiusCenter && filters.radiusKm,
  ].filter(Boolean).length;

  // Handle radius circle visualization
  useEffect(() => {
    if (!googleMapRef.current || !(window as any).google?.maps) return;

    const google = (window as any).google;

    // Clear existing radius circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = null;
    }

    // Clear existing radius center marker
    if (radiusCenterMarkerRef.current) {
      radiusCenterMarkerRef.current.setMap(null);
      radiusCenterMarkerRef.current = null;
    }

    // Draw radius circle if center is set and filters are enabled
    if (enableFilters && radiusCenter && filters.radiusKm) {
      const circle = new google.maps.Circle({
        strokeColor: '#2563EB',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#2563EB',
        fillOpacity: 0.15,
        map: googleMapRef.current,
        center: radiusCenter,
        radius: filters.radiusKm * 1000, // Convert km to meters
      });
      radiusCircleRef.current = circle;

      // Add a marker at the center
      const centerMarker = new google.maps.Marker({
        position: radiusCenter,
        map: googleMapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `Radius Center (${filters.radiusKm} km)`,
      });
      radiusCenterMarkerRef.current = centerMarker;

      // Add label showing radius
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px; font-weight: 500;">Search Radius: ${filters.radiusKm} km</div>`,
        position: radiusCenter,
      });
      infoWindow.open(googleMapRef.current);

      // Close info window after 3 seconds
      setTimeout(() => {
        infoWindow.close();
      }, 3000);
    }
  }, [radiusCenter, filters.radiusKm, enableFilters]);

  // Handle heatmap layer
  useEffect(() => {
    if (!googleMapRef.current || !(window as any).google?.maps?.visualization) return;

    const google = (window as any).google;

    // Clear existing heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    // Create heatmap if enabled and properties exist
    if (showHeatmap && properties.length > 0) {
      const heatmapData = properties
        .filter(p => p.coordinates.lat !== 0 || p.coordinates.lng !== 0)
        .map(p => ({
          location: new google.maps.LatLng(p.coordinates.lat, p.coordinates.lng),
          weight: 1,
        }));

      if (heatmapData.length > 0) {
        const heatmap = new google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: googleMapRef.current,
          radius: 30,
          opacity: 0.6,
          gradient: [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 0, 223, 1)',
            'rgba(0, 0, 191, 1)',
            'rgba(0, 0, 159, 1)',
            'rgba(0, 0, 127, 1)',
            'rgba(63, 0, 91, 1)',
            'rgba(127, 0, 63, 1)',
            'rgba(191, 0, 31, 1)',
            'rgba(255, 0, 0, 1)',
          ],
        });
        heatmapRef.current = heatmap;
      }
    }
  }, [showHeatmap, properties]);

  // Handle property markers with clustering, radius circles, and performance-optimized animations
  useEffect(() => {
    if (!googleMapRef.current || !(window as any).google?.maps) return;

    const google = (window as any).google;

    // Performance optimization: batch DOM operations
    requestAnimationFrame(() => {
      // Clear existing markers with fade-out animation
      markersRef.current.forEach((marker, index) => {
        setTimeout(() => {
          marker.setMap(null);
        }, index * 10); // Stagger removal for smooth effect
      });
      markersRef.current = [];
      
      circlesRef.current.forEach((circle) => circle.setMap(null));
      circlesRef.current = [];

      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current = null;
      }

      // Filter properties to display
      const propertiesToShow = selectedPropertyIds.length > 0
        ? properties.filter(p => selectedPropertyIds.includes(p.id))
        : properties;

      // Add markers for each property with performance-optimized animation
      const newMarkers: any[] = [];
      propertiesToShow.forEach((property, index) => {
        if (property.coordinates.lat === 0 && property.coordinates.lng === 0) return;

        const markerColor = getCategoryColor(property.category);
        
        const marker = new google.maps.Marker({
          position: property.coordinates,
          map: showClustering ? null : googleMapRef.current,
          title: property.title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: markerColor,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          animation: google.maps.Animation.DROP,
          optimized: true, // Performance optimization
        });

        // Stagger animation for visual effect with performance optimization
        setTimeout(() => {
          if (marker.setAnimation) {
            marker.setAnimation(null);
          }
        }, Math.min(50 * index, 2000)); // Cap total animation time

        marker.addListener('click', () => {
          if (infoWindowRef.current) {
            const content = createInfoWindowContent(property);
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(googleMapRef.current!, marker);

            if (onPropertyClick) {
              // Register both view and edit handlers
              const viewHandlerName = `propertyViewHandler_${property.id.replace(/\./g, '_')}`;
              const editHandlerName = `propertyEditHandler_${property.id.replace(/\./g, '_')}`;
              
              (window as any)[viewHandlerName] = () => {
                onPropertyClick(property);
                infoWindowRef.current?.close();
              };
              
              (window as any)[editHandlerName] = () => {
                onPropertyClick(property);
                infoWindowRef.current?.close();
              };
            }
          }
        });

        newMarkers.push(marker);

        // Add radius circle if enabled
        if (showRadiusCircles) {
          const circle = new google.maps.Circle({
            strokeColor: markerColor,
            strokeOpacity: 0.6,
            strokeWeight: 2,
            fillColor: markerColor,
            fillOpacity: 0.15,
            map: googleMapRef.current,
            center: property.coordinates,
            radius: radiusKm * 1000, // Convert km to meters
          });
          circlesRef.current.push(circle);
        }
      });

      markersRef.current = newMarkers;

      // Apply clustering if enabled and MarkerClusterer is available
      if (showClustering && (window as any).markerClusterer && newMarkers.length > 0) {
        markerClustererRef.current = new (window as any).markerClusterer.MarkerClusterer({
          map: googleMapRef.current,
          markers: newMarkers,
          algorithm: new (window as any).markerClusterer.SuperClusterAlgorithm({ radius: 100 }),
        });
      }

      // Fit bounds to show all markers with smooth animation
      if (propertiesToShow.length > 0 && !draggableMarker) {
        const bounds = new google.maps.LatLngBounds();
        propertiesToShow.forEach((property) => {
          if (property.coordinates.lat !== 0 || property.coordinates.lng !== 0) {
            bounds.extend(property.coordinates);
          }
        });
        if (!bounds.isEmpty()) {
          googleMapRef.current.fitBounds(bounds);
          // Add padding to ensure markers aren't at the edge
          const padding = { top: 50, right: 50, bottom: 50, left: 50 };
          googleMapRef.current.fitBounds(bounds, padding);
        }
      }
    });
  }, [properties, onPropertyClick, draggableMarker, showClustering, showRadiusCircles, radiusKm, selectedPropertyIds]);

  // Handle draggable marker
  useEffect(() => {
    if (!googleMapRef.current || !(window as any).google?.maps || !draggableMarker) {
      if (draggableMarkerRef.current) {
        draggableMarkerRef.current.setMap(null);
        draggableMarkerRef.current = null;
      }
      return;
    }

    const google = (window as any).google;

    if (draggableMarkerRef.current) {
      draggableMarkerRef.current.setPosition(draggableMarker);
    } else {
      const marker = new google.maps.Marker({
        position: draggableMarker,
        map: googleMapRef.current,
        draggable: true,
        title: 'Drag to set location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });

      marker.addListener('dragend', (event: any) => {
        if (event.latLng && onMarkerDragEnd) {
          onMarkerDragEnd({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          });
        }
      });

      draggableMarkerRef.current = marker;
    }
  }, [draggableMarker, onMarkerDragEnd]);

  // Enhanced error state with comprehensive troubleshooting
  if (error) {
    const currentDomain = window.location.origin;
    const currentHostname = window.location.hostname;
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const apiKeyPreview = GOOGLE_MAPS_API_KEY.length > 10 ? `${GOOGLE_MAPS_API_KEY.substring(0, 10)}...` : 'Not configured';
    
    const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
    const isICPDomain = currentHostname.endsWith('.ic0.app') || currentHostname.endsWith('.icp0.io') || currentHostname.endsWith('.raw.icp0.io');
    
    return (
      <div className="flex h-full items-center justify-center bg-muted p-6">
        <Alert variant="destructive" className="max-w-3xl">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Google Maps Configuration Error</AlertTitle>
          <AlertDescription className="mt-3 space-y-4">
            <div className="rounded-md bg-destructive/10 p-3 text-sm">
              <p className="font-semibold whitespace-pre-line">{error}</p>
            </div>
            
            {retryCount > 0 && (
              <p className="text-sm">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Retrying... (Attempt {retryCount + 1}/4)
              </p>
            )}
            
            {errorType === 'domain-restriction' && (
              <div className="rounded-md border-2 border-destructive bg-destructive/5 p-4 text-sm space-y-3">
                <p className="font-bold text-base">🚨 CRITICAL: Domain Authorization Required</p>
                <div className="space-y-2 text-xs">
                  <p><strong>Current Domain:</strong> <code className="bg-background px-2 py-1 rounded font-mono text-xs">{currentDomain}</code></p>
                  <p><strong>Hostname:</strong> <code className="bg-background px-2 py-1 rounded font-mono text-xs">{currentHostname}</code></p>
                  <p><strong>API Key:</strong> <code className="bg-background px-2 py-1 rounded font-mono text-xs">{apiKeyPreview}</code></p>
                  {isLocalhost && (
                    <p className="text-amber-600 font-semibold">⚠️ Localhost detected - ensure localhost referrers are added</p>
                  )}
                  {isICPDomain && (
                    <p className="text-blue-600 font-semibold">ℹ️ Internet Computer domain detected - ensure ICP domain patterns are added</p>
                  )}
                </div>
                <div className="border-t border-destructive/20 pt-3">
                  <p className="font-semibold mb-2">STEP-BY-STEP FIX:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li className="font-medium">
                      Open Google Cloud Console Credentials
                      <div className="mt-1 ml-6">
                        <Button 
                          onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Open Credentials Page
                        </Button>
                      </div>
                    </li>
                    <li>Click on your API key <code className="bg-background px-1.5 py-0.5 rounded font-mono text-xs">{apiKeyPreview}</code></li>
                    <li>Scroll to <strong>"Application restrictions"</strong></li>
                    <li>Select <strong>"HTTP referrers (web sites)"</strong></li>
                    <li>Click <strong>"ADD AN ITEM"</strong></li>
                    <li>
                      <strong>Add these exact referrers:</strong>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        {isLocalhost ? (
                          <>
                            <li>
                              <code className="bg-background px-1.5 py-0.5 rounded font-mono text-xs">http://localhost:3000/*</code>
                            </li>
                            <li>
                              <code className="bg-background px-1.5 py-0.5 rounded font-mono text-xs">http://localhost:*/*</code>
                            </li>
                          </>
                        ) : isICPDomain ? (
                          <>
                            <li>
                              <code className="bg-background px-1.5 py-0.5 rounded font-mono text-xs">{currentDomain}/*</code>
                              <span className="ml-2 text-destructive font-semibold">(REQUIRED)</span>
                            </li>
                            <li>
                              <code className="bg-background px-1.5 py-0.5 rounded font-mono text-xs">https://*.ic0.app/*</code>
                            </li>
                            <li>
                              <code className="bg-background px-1.5 py-0.5 rounded font-mono text-xs">https://*.icp0.io/*</code>
                            </li>
                            <li>
                              <code className="bg-background px-1.5 py-0.5 rounded font-mono text-xs">https://*.raw.icp0.io/*</code>
                            </li>
                          </>
                        ) : (
                          <li>
                            <code className="bg-background px-1.5 py-0.5 rounded font-mono text-xs">{currentDomain}/*</code>
                            <span className="ml-2 text-destructive font-semibold">(REQUIRED for this domain)</span>
                          </li>
                        )}
                      </ul>
                    </li>
                    <li>Click <strong>"SAVE"</strong> at the bottom</li>
                    <li><strong className="text-destructive">Wait 2-5 minutes</strong> for changes to propagate globally</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
                <div className="border-t border-destructive/20 pt-3">
                  <p className="text-xs font-semibold">⚠️ IMPORTANT NOTES:</p>
                  <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-xs">
                    <li>The domain MUST match exactly (including http:// or https://)</li>
                    <li>The wildcard /* at the end is required</li>
                    <li>Changes can take up to 5 minutes to take effect</li>
                    <li>This is the #1 cause of "Do you own this website?" errors</li>
                    <li>For testing, you can temporarily set restrictions to "None" (not recommended for production)</li>
                  </ul>
                </div>
              </div>
            )}
            
            {errorType === 'missing-key' && (
              <div className="rounded-md bg-destructive/10 p-4 text-sm space-y-3">
                <p className="font-semibold">Complete Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    <span className="font-medium">Get a Google Maps API Key:</span>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
                      <li>Visit <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Google Cloud Console</a></li>
                      <li>Create a new project or select an existing one</li>
                      <li>Go to <strong>APIs & Services → Credentials</strong></li>
                      <li>Click <strong>Create Credentials → API Key</strong></li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-medium">Enable Required APIs:</span>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
                      <li>Go to <strong>APIs & Services → Library</strong></li>
                      <li>Search and enable: <strong>Maps JavaScript API</strong></li>
                      <li>Search and enable: <strong>Places API</strong></li>
                      <li>Search and enable: <strong>Geocoding API</strong></li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-medium">Enable Billing (REQUIRED):</span>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
                      <li>Go to <strong>Billing</strong> in the Cloud Console</li>
                      <li>Link a billing account to your project</li>
                      <li><strong>Billing is mandatory</strong> even for free tier usage</li>
                      <li>Google provides $200 free credit monthly</li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-medium">Configure Domain Restrictions:</span>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
                      <li>Add <code className="bg-background px-1.5 py-0.5 rounded">{currentDomain}/*</code> to HTTP referrers</li>
                      <li>Add local development domains if needed</li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-medium">Configure the Application:</span>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
                      <li>Create a <code className="bg-background px-1.5 py-0.5 rounded">.env</code> file in the <code className="bg-background px-1.5 py-0.5 rounded">frontend</code> directory</li>
                      <li>Add: <code className="bg-background px-1.5 py-0.5 rounded block mt-1">VITE_GOOGLE_MAPS_API_KEY=your_api_key_here</code></li>
                      <li>Restart the development server</li>
                    </ul>
                  </li>
                </ol>
              </div>
            )}
            
            {(errorType === 'invalid-key' || errorType === 'billing' || errorType === 'api-disabled' || errorType === 'load-failed') && (
              <div className="rounded-md bg-destructive/10 p-4 text-sm space-y-3">
                <p className="font-semibold">Troubleshooting Steps:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Verify API key is correct in <code className="bg-background px-1.5 py-0.5 rounded">.env</code> file</li>
                  <li>Ensure billing is enabled in Google Cloud Console (REQUIRED)</li>
                  <li>Confirm all required APIs are enabled (Maps JavaScript API, Places API, Geocoding API)</li>
                  <li>Add your domain (<code className="bg-background px-1.5 py-0.5 rounded">{currentDomain}/*</code>) to API key restrictions</li>
                  <li>Wait 2-5 minutes after making changes for them to propagate</li>
                  <li>Check browser console (F12) for detailed error messages</li>
                </ul>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleRetry} variant="default" size="sm" disabled={retryCount > 0}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Loading Map
              </Button>
              <Button 
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                variant="outline" 
                size="sm"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Configure API Key
              </Button>
              <Button 
                onClick={() => window.open('https://developers.google.com/maps/documentation/javascript/get-api-key', '_blank')}
                variant="outline" 
                size="sm"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Setup Guide
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading Google Maps...</p>
          {retryCount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">Retrying... (Attempt {retryCount + 1}/4)</p>
          )}
          {retryCount === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">This may take a few seconds</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {onPlaceSelected && (
        <div className="absolute left-1/2 top-4 z-10 w-full max-w-md -translate-x-1/2 px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for a location..."
              className="w-full bg-background pl-10 shadow-lg"
            />
          </div>
        </div>
      )}
      
      {enableFilters && (
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          {!draggableMarker && (
            <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 shadow-lg">
              <Switch
                id="heatmap-toggle"
                checked={showHeatmap}
                onCheckedChange={setShowHeatmap}
              />
              <Label htmlFor="heatmap-toggle" className="cursor-pointer text-sm font-medium">
                <Layers className="mr-1 inline h-4 w-4" />
                Heatmap
              </Label>
            </div>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="shadow-lg"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {enableFilters && showFilterPanel && (
        <Card className="absolute right-4 top-16 z-10 w-80 shadow-xl max-h-[calc(100vh-120px)] overflow-y-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Real-Time Filters</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilterPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Filters update automatically</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filter-category">Category</Label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => updateFilters({ category: value === 'all' ? undefined : value as Category })}
              >
                <SelectTrigger id="filter-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="resale">Resale</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                  <SelectItem value="underConstruction">Under Construction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-propertyType">Property Type</Label>
              <Select
                value={filters.propertyType || 'all'}
                onValueChange={(value) => updateFilters({ propertyType: value === 'all' ? undefined : value as PropertyType })}
              >
                <SelectTrigger id="filter-propertyType">
                  <SelectValue placeholder="All Property Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Property Types</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-configuration">Configuration</Label>
              <Select
                value={filters.configuration || 'all'}
                onValueChange={(value) => updateFilters({ configuration: value === 'all' ? undefined : value as Configuration })}
              >
                <SelectTrigger id="filter-configuration">
                  <SelectValue placeholder="All Configurations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Configurations</SelectItem>
                  <SelectItem value="rk1">1 RK</SelectItem>
                  <SelectItem value="bhk1">1 BHK</SelectItem>
                  <SelectItem value="bhk1_5">1.5 BHK</SelectItem>
                  <SelectItem value="bhk2">2 BHK</SelectItem>
                  <SelectItem value="bhk2_5">2.5 BHK</SelectItem>
                  <SelectItem value="bhk3">3 BHK</SelectItem>
                  <SelectItem value="bhk3_5">3.5 BHK</SelectItem>
                  <SelectItem value="bhk4">4 BHK</SelectItem>
                  <SelectItem value="bhk5">5 BHK</SelectItem>
                  <SelectItem value="jodiFlat">Jodi Flat</SelectItem>
                  <SelectItem value="duplex">Duplex</SelectItem>
                  <SelectItem value="penthouse">Penthouse</SelectItem>
                  <SelectItem value="bungalow">Bungalow</SelectItem>
                  <SelectItem value="independentHouse">Independent House</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-furnishing">Furnishing</Label>
              <Select
                value={filters.furnishing || 'all'}
                onValueChange={(value) => updateFilters({ furnishing: value === 'all' ? undefined : value as Furnishing })}
              >
                <SelectTrigger id="filter-furnishing">
                  <SelectValue placeholder="All Furnishing Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Furnishing Types</SelectItem>
                  <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  <SelectItem value="semiFurnished">Semi Furnished</SelectItem>
                  <SelectItem value="furnished">Furnished</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => updateFilters({ status: value === 'all' ? undefined : value as Status })}
              >
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="underContract">Under Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-city">City</Label>
              <Select
                value={filters.city || 'all'}
                onValueChange={(value) => updateFilters({ city: value === 'all' ? undefined : value })}
              >
                <SelectTrigger id="filter-city">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-suburb">Suburb</Label>
              <Select
                value={filters.suburb || 'all'}
                onValueChange={(value) => updateFilters({ suburb: value === 'all' ? undefined : value })}
              >
                <SelectTrigger id="filter-suburb">
                  <SelectValue placeholder="All Suburbs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suburbs</SelectItem>
                  {uniqueSuburbs.map(suburb => (
                    <SelectItem key={suburb} value={suburb}>{suburb}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-area">Area</Label>
              <Select
                value={filters.area || 'all'}
                onValueChange={(value) => updateFilters({ area: value === 'all' ? undefined : value })}
              >
                <SelectTrigger id="filter-area">
                  <SelectValue placeholder="All Areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {uniqueAreas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-roadName">Road Name</Label>
              <Select
                value={filters.roadName || 'all'}
                onValueChange={(value) => updateFilters({ roadName: value === 'all' ? undefined : value })}
              >
                <SelectTrigger id="filter-roadName">
                  <SelectValue placeholder="All Road Names" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Road Names</SelectItem>
                  {uniqueRoadNames.map(roadName => (
                    <SelectItem key={roadName} value={roadName}>{roadName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-min-price">Min Price (₹)</Label>
              <Input
                id="filter-min-price"
                type="number"
                placeholder="Min price"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilters({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-max-price">Max Price (₹)</Label>
              <Input
                id="filter-max-price"
                type="number"
                placeholder="Max price"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilters({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Radius Filter
                </Label>
                {radiusCenter && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {radiusCenter ? 'Adjust radius below' : 'Click on map to set center point'}
              </p>
              {radiusCenter && (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="radius-slider" className="text-sm font-semibold">
                      {filters.radiusKm || radiusKm} km
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRadiusCenter(null);
                        updateFilters({ radiusKm: undefined, centerLat: undefined, centerLng: undefined });
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  <Slider
                    id="radius-slider"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={[filters.radiusKm || radiusKm]}
                    onValueChange={handleRadiusChange}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.5 km</span>
                    <span>10 km</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex-1"
                disabled={activeFilterCount === 0}
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showRadiusCircles && !draggableMarker && !enableFilters && (
        <div className="absolute right-4 top-4 z-10 rounded-lg bg-background p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="radius-slider" className="text-sm font-medium">
              Radius: {radiusKm} km
            </label>
          </div>
          <input
            id="radius-slider"
            type="range"
            min="0.5"
            max="10"
            step="0.5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
            className="mt-2 w-full"
          />
        </div>
      )}

      {/* Property count overlay with animation */}
      {!draggableMarker && properties.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 space-y-2">
          <div className="animate-in fade-in slide-in-from-bottom-2 rounded-lg bg-background p-3 shadow-lg">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#3B82F6]"></div>
                <span>Resale</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#10B981]"></div>
                <span>Rental</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#8B5CF6]"></div>
                <span>Under Construction</span>
              </div>
            </div>
          </div>
          
          {/* Property count badge */}
          <div className="animate-in fade-in slide-in-from-bottom-2 rounded-lg bg-primary px-4 py-2 text-center shadow-lg transition-all duration-300">
            <div className="flex items-center gap-2 text-primary-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {isFiltering ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {properties.length} {properties.length === 1 ? 'Property' : 'Properties'}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
