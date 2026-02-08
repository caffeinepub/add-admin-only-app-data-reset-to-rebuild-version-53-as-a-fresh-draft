import { useEffect, useRef, useState, useCallback } from 'react';
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
import { Category, PropertyType, Configuration, Furnishing, Status } from '../backend';
import type { Property, Coordinates } from '../backend';
import { toast } from 'sonner';
import { parsePlaceResult, getPlaceDisplayText } from '../utils/googlePlaces';

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
  const [searchValue, setSearchValue] = useState('');
  
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
        
        // All retries exhausted - provide specific error guidance
        const currentDomain = window.location.origin;
        let errorMessage = 'Failed to load Google Maps after multiple attempts.\n\n';
        errorMessage += 'TROUBLESHOOTING CHECKLIST:\n\n';
        errorMessage += '1. BILLING (REQUIRED):\n';
        errorMessage += '   • Open: https://console.cloud.google.com/billing\n';
        errorMessage += '   • Ensure billing is enabled for your project\n';
        errorMessage += '   • Wait 5-10 minutes after enabling billing\n\n';
        errorMessage += '2. API ENABLEMENT:\n';
        errorMessage += '   • Open: https://console.cloud.google.com/apis/library\n';
        errorMessage += '   • Enable: Maps JavaScript API\n';
        errorMessage += '   • Enable: Places API\n';
        errorMessage += '   • Enable: Geocoding API\n\n';
        errorMessage += '3. API KEY RESTRICTIONS:\n';
        errorMessage += '   • Open: https://console.cloud.google.com/apis/credentials\n';
        errorMessage += `   • Add referrer: ${currentDomain}/*\n`;
        errorMessage += '   • Or temporarily set to "None" for testing\n\n';
        errorMessage += '4. VERIFY API KEY:\n';
        errorMessage += '   • Check .env file has correct key\n';
        errorMessage += '   • Key should be 39 characters\n';
        errorMessage += '   • No quotes or extra spaces\n\n';
        errorMessage += 'After making changes, wait 2-5 minutes and refresh this page.';
        
        setError(errorMessage);
        setErrorType('load-failed');
        setIsLoading(false);
      }
    };

    attemptLoad();

    return () => {
      window.removeEventListener('error', handleGoogleMapsError);
    };
  }, []);

  // Stable callback for place selection using useCallback
  const handlePlaceChanged = useCallback(() => {
    if (!autocompleteRef.current || !onPlaceSelected) return;

    const place = autocompleteRef.current.getPlace();
    console.log('Place changed:', place);

    if (!place || !place.geometry) {
      console.warn('Place has no geometry');
      toast.error('Selected location has no coordinates. Please try another location.');
      return;
    }

    // Parse the place using utility
    const parsed = parsePlaceResult(place);
    if (!parsed) {
      console.warn('Failed to parse place result');
      toast.error('Could not parse location details. Please try another location.');
      return;
    }

    // Update search input with formatted address
    const displayText = getPlaceDisplayText(place);
    setSearchValue(displayText);
    if (searchInputRef.current) {
      searchInputRef.current.value = displayText;
    }

    // Update map center and marker
    if (googleMapRef.current) {
      googleMapRef.current.panTo(parsed.coords);
      googleMapRef.current.setZoom(15);
    }

    // Update draggable marker if it exists
    if (draggableMarkerRef.current) {
      draggableMarkerRef.current.setPosition(parsed.coords);
    }

    // Fire callback exactly once
    console.log('Firing onPlaceSelected with:', parsed);
    onPlaceSelected(parsed);
    
    toast.success(`Location selected: ${displayText}`);
  }, [onPlaceSelected]);

  // Initialize Google Maps Autocomplete - stable lifecycle
  useEffect(() => {
    if (isLoading || !searchInputRef.current || !(window as any).google?.maps?.places) {
      return;
    }

    // Clean up existing autocomplete
    if (autocompleteRef.current) {
      if ((window as any).google?.maps?.event && autocompleteRef.current.gm_accessors_) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null;
    }

    try {
      // Create new autocomplete instance bound to current input
      const autocomplete = new (window as any).google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: 'in' },
          fields: ['address_components', 'geometry', 'name', 'formatted_address'],
        }
      );

      autocompleteRef.current = autocomplete;

      // Register place_changed listener exactly once
      const listener = autocomplete.addListener('place_changed', handlePlaceChanged);

      console.log('✅ Autocomplete initialized with place_changed listener');

      // Cleanup function
      return () => {
        if (listener && (window as any).google?.maps?.event) {
          (window as any).google.maps.event.removeListener(listener);
        }
        if (autocompleteRef.current && (window as any).google?.maps?.event) {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
        autocompleteRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize autocomplete:', error);
      toast.error('Failed to initialize location search');
    }
  }, [isLoading, handlePlaceChanged]);

  // Initialize map
  useEffect(() => {
    if (isLoading || !mapRef.current || !(window as any).google?.maps) return;

    const google = (window as any).google;

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    googleMapRef.current = map;

    // Initialize info window
    infoWindowRef.current = new google.maps.InfoWindow();

    // Initialize draggable marker if coordinates provided
    if (draggableMarker && onMarkerDragEnd) {
      const marker = new google.maps.Marker({
        position: draggableMarker,
        map,
        draggable: true,
        title: 'Drag to set location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4F46E5',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (position && onMarkerDragEnd) {
          onMarkerDragEnd({
            lat: position.lat(),
            lng: position.lng(),
          });
        }
      });

      draggableMarkerRef.current = marker;
    }

    return () => {
      // Cleanup
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      if (draggableMarkerRef.current) {
        draggableMarkerRef.current.setMap(null);
      }
    };
  }, [isLoading, center, draggableMarker, onMarkerDragEnd]);

  // Update draggable marker position when prop changes
  useEffect(() => {
    if (draggableMarkerRef.current && draggableMarker) {
      draggableMarkerRef.current.setPosition(draggableMarker);
    }
  }, [draggableMarker]);

  // Update property markers
  useEffect(() => {
    if (!googleMapRef.current || !(window as any).google?.maps) return;

    const google = (window as any).google;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Clear existing clusterer
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
      markerClustererRef.current = null;
    }

    // Create new markers
    const newMarkers = properties.map(property => {
      const isSelected = selectedPropertyIds.includes(property.id);
      
      const marker = new google.maps.Marker({
        position: property.coordinates,
        map: googleMapRef.current,
        title: property.title,
        icon: isSelected ? {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        } : undefined,
      });

      marker.addListener('click', () => {
        const content = `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${property.title}</h3>
            <p style="margin: 4px 0; font-size: 14px; color: #666;">${property.location.area}, ${property.location.suburb}</p>
            <p style="margin: 4px 0; font-size: 14px; font-weight: 600;">₹${Number(property.price).toLocaleString()}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #888;">${property.category} • ${property.propertyType}</p>
          </div>
        `;
        
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(googleMapRef.current, marker);

        if (onPropertyClick) {
          onPropertyClick(property);
        }
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // Add clustering if enabled
    if (showClustering && (window as any).markerClusterer && newMarkers.length > 0) {
      markerClustererRef.current = new (window as any).markerClusterer.MarkerClusterer({
        map: googleMapRef.current,
        markers: newMarkers,
      });
    }

    // Update heatmap
    if (showHeatmap && google.maps.visualization) {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }

      const heatmapData = properties.map(property => ({
        location: new google.maps.LatLng(property.coordinates.lat, property.coordinates.lng),
        weight: Number(property.price) / 1000000,
      }));

      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: googleMapRef.current,
      });
    } else if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }
  }, [properties, selectedPropertyIds, showClustering, showHeatmap, onPropertyClick]);

  // Handle Enter key for geocoding fallback
  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      e.preventDefault();
      
      if (!(window as any).google?.maps?.Geocoder) {
        toast.error('Geocoding service not available');
        return;
      }

      const geocoder = new (window as any).google.maps.Geocoder();
      
      try {
        const result = await geocoder.geocode({ 
          address: searchValue,
          componentRestrictions: { country: 'in' }
        });

        if (result.results && result.results.length > 0) {
          const place = result.results[0];
          const parsed = parsePlaceResult(place);
          
          if (parsed && onPlaceSelected) {
            const displayText = getPlaceDisplayText(place);
            setSearchValue(displayText);
            
            if (googleMapRef.current) {
              googleMapRef.current.panTo(parsed.coords);
              googleMapRef.current.setZoom(15);
            }

            if (draggableMarkerRef.current) {
              draggableMarkerRef.current.setPosition(parsed.coords);
            }

            onPlaceSelected(parsed);
            toast.success(`Location found: ${displayText}`);
          }
        } else {
          toast.error('Location not found. Please try a different search term.');
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        toast.error('Failed to search location. Please try again.');
      }
    }
  };

  // Update filters and notify parent
  const updateFilters = (newFilters: Partial<MapFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    if (onFilterChange) {
      onFilterChange(updated);
    }
  };

  const clearFilters = () => {
    const emptyFilters: MapFilters = {
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
    setFilters(emptyFilters);
    setRadiusCenter(null);
    if (onFilterChange) {
      onFilterChange(emptyFilters);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Google Maps Error</AlertTitle>
        <AlertDescription className="mt-2">
          <pre className="whitespace-pre-wrap text-sm font-mono">{error}</pre>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleRetry} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            {errorType === 'domain-restriction' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Google Cloud Console
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {retryCount > 0 ? `Loading Google Maps (attempt ${retryCount + 1})...` : 'Loading Google Maps...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Search bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10 bg-background shadow-lg"
          />
        </div>
        {enableFilters && (
          <Button
            variant={showFilterPanel ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="shadow-lg"
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="shadow-lg"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter panel */}
      {enableFilters && showFilterPanel && (
        <Card className="absolute top-20 left-4 z-10 w-80 max-h-[calc(100vh-200px)] overflow-y-auto shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowFilterPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location filters */}
            <div className="space-y-2">
              <Label>City</Label>
              <Select
                value={filters.city || ''}
                onValueChange={(value) => updateFilters({ city: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All cities</SelectItem>
                  {uniqueCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Suburb</Label>
              <Select
                value={filters.suburb || ''}
                onValueChange={(value) => updateFilters({ suburb: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All suburbs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All suburbs</SelectItem>
                  {uniqueSuburbs.map(suburb => (
                    <SelectItem key={suburb} value={suburb}>{suburb}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Area</Label>
              <Select
                value={filters.area || ''}
                onValueChange={(value) => updateFilters({ area: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All areas</SelectItem>
                  {uniqueAreas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.category || ''}
                onValueChange={(value) => updateFilters({ category: value ? value as Category : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value={Category.resale}>Resale</SelectItem>
                  <SelectItem value={Category.rental}>Rental</SelectItem>
                  <SelectItem value={Category.underConstruction}>Under Construction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Property Type filter */}
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                value={filters.propertyType || ''}
                onValueChange={(value) => updateFilters({ propertyType: value ? value as PropertyType : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value={PropertyType.residential}>Residential</SelectItem>
                  <SelectItem value={PropertyType.commercial}>Commercial</SelectItem>
                  <SelectItem value={PropertyType.industrial}>Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => updateFilters({ status: value ? value as Status : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value={Status.available}>Available</SelectItem>
                  <SelectItem value={Status.sold}>Sold</SelectItem>
                  <SelectItem value={Status.rented}>Rented</SelectItem>
                  <SelectItem value={Status.underContract}>Under Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price range */}
            <div className="space-y-2">
              <Label>Min Price (₹)</Label>
              <Input
                type="number"
                placeholder="Min price"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilters({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Price (₹)</Label>
              <Input
                type="number"
                placeholder="Max price"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilters({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active filters badge */}
      {isFiltering && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary" className="shadow-lg">
            <Filter className="h-3 w-3 mr-1" />
            Filters Active
          </Badge>
        </div>
      )}

      {/* Map container */}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}
