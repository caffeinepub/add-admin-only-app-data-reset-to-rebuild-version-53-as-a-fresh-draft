# Specification

## Summary
**Goal:** Allow admins to reset all persisted app domain data to return the application to a fresh-draft (empty) state.

**Planned changes:**
- Add a shared backend admin-only reset method (using existing AccessControl admin check) that clears all persisted agents, properties, inquiries, and user profiles.
- Ensure existing backend query methods return empty results/null as appropriate after a reset and reject non-admin reset attempts with an unauthorized error.
- Add an admin-only frontend control to trigger the reset with a destructive confirmation flow.
- On successful reset, refresh/clear React Query caches so all relevant screens reflect the empty state without a hard reload, and surface errors to users via existing UI patterns.

**User-visible outcome:** Admin users can explicitly confirm and trigger a full app data reset; afterward the UI updates to show no agents/properties/inquiries and no user profile data, while non-admin users cannot access the reset action.
