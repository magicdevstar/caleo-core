# RHFMapWithBoundingBox Component (Now Supports Any Polygon Shape)

## Overview
The `RHFMapWithBoundingBox` component is a React Hook Form integration that allows users to draw custom polygon shapes on a map, not just rectangular bounding boxes. It automatically handles form state management for polygon coordinate data.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **Required** | The name of the form field |
| `mapProps` | `MapBoxProps` | `undefined` | Additional props for the Mapbox map |
| `helperText` | `string` | `undefined` | Helper text to display below the map |

## Usage Examples

### Basic Usage
```tsx
import { useForm } from 'react-hook-form';
import { FormProvider } from 'src/components/hook-form';
import { RHFMapWithBoundingBox } from 'src/components/map';

function MyForm() {
  const methods = useForm({
    defaultValues: {
      geofenceArea: null, // Will store the polygon coordinates
    }
  });

  const onSubmit = (data) => {
    // data.geofenceArea will be: [[lng1, lat1], [lng2, lat2], ...] or null
  };

  return (
    <FormProvider methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      <RHFMapWithBoundingBox 
        name="geofenceArea"
        helperText="Draw any polygon shape to define the geofence area"
      />
      <button type="submit">Submit</button>
    </FormProvider>
  );
}
```

### With Initial Polygon
```tsx
import { useForm } from 'react-hook-form';
import { FormProvider } from 'src/components/hook-form';
import { RHFMapWithBoundingBox } from 'src/components/map';

function EditGeofenceForm({ initialData }) {
  const methods = useForm({
    defaultValues: {
      geofenceArea: initialData?.polygonCoords || null,
    }
  });

  return (
    <FormProvider methods={methods}>
      <RHFMapWithBoundingBox 
        name="geofenceArea"
        helperText="Modify the existing polygon or draw a new one"
      />
    </FormProvider>
  );
}
```

### With Validation
```tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { FormProvider } from 'src/components/hook-form';
import { RHFMapWithBoundingBox } from 'src/components/map';

const schema = Yup.object().shape({
  geofenceArea: Yup.array()
    .nullable()
    .required('Please draw a polygon for the geofence area')
    .test('valid-polygon', 'Polygon must have at least 3 points', (value) => {
      if (!value) return false;
      return Array.isArray(value) && value.length >= 3 &&
             value.every(coord => Array.isArray(coord) && coord.length === 2);
    }),
});

function ValidatedForm() {
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      geofenceArea: null,
    }
  });

  return (
    <FormProvider methods={methods}>
      <RHFMapWithBoundingBox 
        name="geofenceArea"
        helperText="Draw a polygon with at least 3 points"
      />
    </FormProvider>
  );
}
```

## Data Format
The component now stores and expects polygon data in the following format:
```typescript
// Null when no polygon is drawn
null

// Or an array of coordinate pairs representing polygon vertices
[
  [longitude1, latitude1],  // First vertex
  [longitude2, latitude2],  // Second vertex
  [longitude3, latitude3],  // Third vertex
  // ... more vertices as needed
]

// Example triangle:
[
  [-122.4376, 37.7577],
  [-122.4276, 37.7677], 
  [-122.4176, 37.7577]
]

// Example complex polygon:
[
  [-122.4376, 37.7577],
  [-122.4276, 37.7677],
  [-122.4176, 37.7677],
  [-122.4076, 37.7577],
  [-122.4176, 37.7477]
]
```

## Key Features

### 🎯 **Flexible Polygon Drawing**
- Draw triangles, rectangles, pentagons, or any custom shape
- No limitation to 4-cornered shapes
- Supports complex polygons with many vertices

### 🔧 **Smart Coordinate Handling**
- Automatically handles polygon closing (doesn't duplicate first/last points)
- Validates minimum vertex count (at least 3 points for a valid polygon)
- Preserves vertex order for proper polygon rendering

### 📊 **Enhanced Display**
- Shows vertex count in the UI
- Displays coordinate information for all vertices
- Visual feedback during drawing process

### ✅ **Form Integration**
- Seamless React Hook Form integration
- Automatic validation support
- Error display and helper text

## UI Changes
- Button text changed from "Draw Bounding Box" to "Draw Polygon"
- Coordinate display shows vertex count and all coordinates
- Clear button labeled as "Clear Area"

## Backward Compatibility
- The component name `RHFMapWithBoundingBox` is maintained for backward compatibility
- Existing forms will continue to work
- Data format is now more flexible (supports both simple rectangles and complex polygons)

## Migration Guide
If you were previously using rectangular bounding boxes:

```tsx
// Old rectangular format (still supported):
[[lng_sw, lat_sw], [lng_ne, lat_ne]]

// New polygon format (recommended):
[
  [lng_sw, lat_sw],     // Southwest corner
  [lng_se, lat_se],     // Southeast corner  
  [lng_ne, lat_ne],     // Northeast corner
  [lng_nw, lat_nw]      // Northwest corner
]
```

The component will handle both formats seamlessly!
