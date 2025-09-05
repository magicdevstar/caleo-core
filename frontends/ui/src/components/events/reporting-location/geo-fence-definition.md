# GeoFenceDefinition Component

## Overview
The `GeoFenceDefinition` component is an enhanced map component that allows users to draw bounding boxes for geographical fence definitions. It integrates with Mapbox GL Draw to provide interactive drawing capabilities.

## Features
- Interactive map with Mapbox GL
- Draw bounding boxes (rectangular areas) on the map
- User's current location detection
- Real-time bounding box coordinates display
- Clear and redraw functionality
- Form integration with React Hook Form

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checkName` | `string` | `"allowOfficerCheckIn"` | Name for the RHF switch control |
| `checkLabel` | `string` | `"Allow Officer Check-In"` | Label for the RHF switch control |
| `disabled` | `boolean` | `false` | Disables all interactive elements |
| `mapProps` | `MapBoxProps` | `undefined` | Additional props for the Mapbox map |
| `onBoundingBoxChange` | `(boundingBox: number[][] \| null) => void` | `undefined` | Callback when bounding box is drawn, updated, or cleared |
| `initialBoundingBox` | `number[][]` | `undefined` | Initial bounding box to display on map load |

## Bounding Box Format
The bounding box is represented as an array of two coordinate pairs:
```typescript
[
  [longitude_southwest, latitude_southwest],  // Southwest corner
  [longitude_northeast, latitude_northeast]   // Northeast corner
]
```

## Usage Examples

### Basic Usage
```tsx
import GeoFenceDefinition from 'src/components/events/geo-fence-definition';

function MyComponent() {
  return (
    <GeoFenceDefinition 
      onBoundingBoxChange={(bbox) => {
        if (bbox) {
          console.log('Bounding box:', bbox);
        } else {
          console.log('Bounding box cleared');
        }
      }}
    />
  );
}
```

### With Initial Bounding Box
```tsx
import GeoFenceDefinition from 'src/components/events/geo-fence-definition';

function MyComponent() {
  const initialBbox = [
    [-122.4376, 37.7577], // Southwest (San Francisco area)
    [-122.4276, 37.7677]  // Northeast
  ];

  return (
    <GeoFenceDefinition 
      initialBoundingBox={initialBbox}
      onBoundingBoxChange={(bbox) => {
        // Handle bounding box changes
      }}
    />
  );
}
```

### In a Form Context
```tsx
import { useForm } from 'react-hook-form';
import { FormProvider } from 'src/components/hook-form';
import GeoFenceDefinition from 'src/components/events/geo-fence-definition';

function EventForm() {
  const methods = useForm({
    defaultValues: {
      allowOfficerCheckIn: false,
      boundingBox: null,
    }
  });

  return (
    <FormProvider methods={methods}>
      <GeoFenceDefinition 
        checkName="allowOfficerCheckIn"
        checkLabel="Enable Geofencing"
        onBoundingBoxChange={(bbox) => {
          methods.setValue('boundingBox', bbox);
        }}
      />
    </FormProvider>
  );
}
```

## User Interactions

1. **Draw Bounding Box**: Click the "Draw Bounding Box" button and then click on the map to start drawing a polygon
2. **Edit Bounding Box**: Click and drag the vertices of an existing bounding box to modify it
3. **Clear Bounding Box**: Click the "Clear Area" button to remove the current bounding box
4. **Map Navigation**: Use standard map controls (zoom, pan, etc.)

## Dependencies
- `@mapbox/mapbox-gl-draw` - For drawing functionality
- `react-map-gl` - React wrapper for Mapbox GL
- `mapbox-gl` - Mapbox GL JS library
- Material-UI components for the interface

## Notes
- Requires a valid Mapbox API token to be configured in `MAPBOX_API`
- The component will attempt to get user's current location for initial map positioning
- Falls back to San Francisco coordinates if geolocation is unavailable
- The drawing tools allow creating polygons, but the component automatically converts them to bounding boxes (rectangular areas)
