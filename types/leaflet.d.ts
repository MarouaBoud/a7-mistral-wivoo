// Type declarations for Leaflet CSS imports
// This allows TypeScript to understand side-effect CSS imports from leaflet
declare module 'leaflet/dist/leaflet.css' {
  // Side-effect only module - no exports
}

// Declare other Leaflet CSS files that might be imported
declare module 'leaflet/dist/*.css' {
  // Side-effect only module - no exports
}
