# Specification

## Summary
**Goal:** Fix Google Maps Places Autocomplete selection so selecting a suggestion reliably updates the search input, recenters the map, moves the marker, and updates the property form via the existing callback.

**Planned changes:**
- Update `frontend/src/components/PropertyMap.tsx` so selecting a Places Autocomplete suggestion sets the input value to the selected place text and re-centers the map to the selected coordinates.
- Ensure the selected-location marker updates/moves to the selected place coordinates after each selection.
- Make `onPlaceSelected` fire reliably exactly once per selection with `{ city, suburb, area, roadName, coords }`, using empty strings for missing address fields, so `frontend/src/pages/PropertiesPage.tsx` continues to populate form fields and coordinates.
- Add regression-proof Autocomplete wiring: bind the Autocomplete instance to the correct input element, register the `place_changed` listener exactly once, and clean up properly on unmount/re-init to prevent “suggestions appear but click does nothing” issues and listener accumulation.

**User-visible outcome:** Users can click an autocomplete suggestion and immediately see the search input update, the map jump to the chosen location, the marker move to it, and the property form fields/coordinates update consistently across repeated selections and navigation without console errors.
