// Minimal Google Maps type declarations for PropertyMap component

declare global {
  interface Window {
    google: {
      maps: {
        Map: any;
        Marker: any;
        InfoWindow: any;
        LatLngBounds: any;
        SymbolPath: {
          CIRCLE: number;
        };
        places: {
          Autocomplete: any;
          AutocompleteService: any;
          PlacesServiceStatus: any;
        };
        Geocoder: any;
        GeocoderStatus: {
          OK: string;
          ZERO_RESULTS: string;
          OVER_QUERY_LIMIT: string;
          REQUEST_DENIED: string;
          INVALID_REQUEST: string;
          UNKNOWN_ERROR: string;
        };
        visualization: {
          HeatmapLayer: any;
        };
        event: {
          addListener: (instance: any, eventName: string, handler: (...args: any[]) => void) => any;
          removeListener: (listener: any) => void;
          clearInstanceListeners: (instance: any) => void;
        };
      };
    };
    markerClusterer: {
      MarkerClusterer: any;
    };
  }
}

export {};
