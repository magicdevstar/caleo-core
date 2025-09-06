import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import Map from 'react-map-gl';
import { useGeolocation } from 'react-use';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { Feature, Polygon } from 'geojson';
import { useFormContext, Controller } from 'react-hook-form';
// @mui
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styled, SxProps, Theme } from "@mui/material/styles";
// components
import { MapBoxProps, MapControl } from "src/components/map";
import { MAPBOX_API } from 'src/config-global';
import { getCenterOfPolygon } from 'src/utils/get-location';

interface Props {
  mapProps?: MapBoxProps;
  onPolygonChange?: (polygon: number[][] | null) => void;
  initialPolygon?: number[][];
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

function MapWithPolygon({
  mapProps,
  onPolygonChange,
  initialPolygon,
  disabled = false,
  sx,
}: Props) {
  const center = useMemo(() => initialPolygon ? getCenterOfPolygon(initialPolygon as any) : null, [initialPolygon]);
  const state = useGeolocation();
  const mapRef = useRef<any>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygon, setPolygon] = useState<number[][] | null>(initialPolygon || null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleDrawCreate = useCallback((e: any) => {
    const feature = e.features[0] as Feature<Polygon>;
    if (feature && feature.geometry.coordinates[0]) {
      const coords = feature.geometry.coordinates[0];
      // Remove the last coordinate if it's a duplicate of the first (closing the polygon)
      const polygonCoords = coords.length > 0 && 
        coords[0][0] === coords[coords.length - 1][0] && 
        coords[0][1] === coords[coords.length - 1][1] 
        ? coords.slice(0, -1) 
        : coords;
      
      setPolygon(polygonCoords);
      onPolygonChange?.(polygonCoords);
    }
    setIsDrawing(false);
  }, [onPolygonChange]);

  const handleDrawUpdate = useCallback((e: any) => {
    if (disabled) return;
    const feature = e.features[0] as Feature<Polygon>;
    if (feature && feature.geometry.coordinates[0]) {
      const coords = feature.geometry.coordinates[0];
      // Remove the last coordinate if it's a duplicate of the first (closing the polygon)
      const polygonCoords = coords.length > 0 && 
        coords[0][0] === coords[coords.length - 1][0] && 
        coords[0][1] === coords[coords.length - 1][1] 
        ? coords.slice(0, -1) 
        : coords;
      
      setPolygon(polygonCoords);
      onPolygonChange?.(polygonCoords);
    }
  }, [disabled, onPolygonChange]);

  const handleDrawDelete = useCallback(() => {
    setPolygon(null);
    onPolygonChange?.(null);
  }, [onPolygonChange]);

  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  // Cleanup function to remove all draw-related sources and layers
  const cleanupDrawSources = useCallback((mapInstance: any) => {
    try {
      // Remove any existing draw control first
      const controls = mapInstance._controls || [];
      controls.forEach((control: any) => {
        if (control instanceof MapboxDraw) {
          try {
            mapInstance.removeControl(control);
          } catch (error) {
            console.warn('Error removing existing draw control:', error);
          }
        }
      });

      // Get all layers and remove draw-related ones
      const style = mapInstance.getStyle();
      if (style && style.layers) {
        const layersToRemove: string[] = [];
        style.layers.forEach((layer: any) => {
          if (layer.source === 'mapbox-gl-draw-cold' || 
              layer.source === 'mapbox-gl-draw-hot' ||
              layer.id.includes('gl-draw')) {
            layersToRemove.push(layer.id);
          }
        });
        
        layersToRemove.forEach(layerId => {
          try {
            if (mapInstance.getLayer(layerId)) {
              mapInstance.removeLayer(layerId);
            }
          } catch (error) {
            // Layer might not exist, continue
          }
        });
      }

      // Remove draw sources
      ['mapbox-gl-draw-cold', 'mapbox-gl-draw-hot'].forEach(sourceId => {
        try {
          if (mapInstance.getSource(sourceId)) {
            mapInstance.removeSource(sourceId);
          }
        } catch (error) {
          // Source might not exist, continue
        }
      });
    } catch (error) {
      console.warn('Error during draw cleanup:', error);
    }
  }, []);

  // Initialize MapboxDraw with proper cleanup
  useEffect(() => {
    if (!mapLoaded) return;

    const mapInstance = mapRef.current?.getMap?.() || mapRef.current;
    if (!mapInstance || typeof mapInstance.addControl !== 'function') return;

    // Always cleanup first to handle reuseMaps
    cleanupDrawSources(mapInstance);

    // Wait a bit for cleanup to complete
    const initTimeout = setTimeout(() => {
      try {
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          touchEnabled: !disabled,
          boxSelect: !disabled,
          keybindings: !disabled,
          clickBuffer: disabled ? 0 : 2,
          controls: disabled ? {} : {
            polygon: true,
            trash: true,
          },
          defaultMode: 'simple_select',
          styles: [
            // Polygon fill
            {
              'id': 'gl-draw-polygon-fill-inactive',
              'type': 'fill',
              'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              'paint': {
                'fill-color': '#3bb2d0',
                'fill-outline-color': '#3bb2d0',
                'fill-opacity': 0.1
              }
            },
            {
              'id': 'gl-draw-polygon-fill-active',
              'type': 'fill',
              'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
              'paint': {
                'fill-color': disabled ? '#3bb2d0' : '#fbb03b',
                'fill-outline-color': disabled ? '#3bb2d0' : '#fbb03b',
                'fill-opacity': 0.1
              }
            },
            // Polygon outline
            {
              'id': 'gl-draw-polygon-stroke-inactive',
              'type': 'line',
              'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              'layout': {
                'line-cap': 'round',
                'line-join': 'round'
              },
              'paint': {
                'line-color': '#3bb2d0',
                'line-width': 2
              }
            },
            {
              'id': 'gl-draw-polygon-stroke-active',
              'type': 'line',
              'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
              'layout': {
                'line-cap': 'round',
                'line-join': 'round'
              },
              'paint': {
                'line-color': disabled ? '#3bb2d0' : '#fbb03b',
                'line-width': 2
              }
            },
            // Vertex points (hidden when disabled)
            {
              'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
              'type': 'circle',
              'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
              'paint': {
                'circle-radius': disabled ? 0 : 5,
                'circle-color': '#fff'
              }
            },
            {
              'id': 'gl-draw-polygon-and-line-vertex-inactive',
              'type': 'circle',
              'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
              'paint': {
                'circle-radius': disabled ? 0 : 3,
                'circle-color': '#fbb03b'
              }
            }
          ]
        });

        mapInstance.addControl(draw);
        drawRef.current = draw;

        // Add initial polygon if provided
        if (initialPolygon && initialPolygon.length >= 3) {
          // Close the polygon by adding the first point at the end if not already closed
          const coords = initialPolygon[0][0] === initialPolygon[initialPolygon.length - 1][0] &&
                        initialPolygon[0][1] === initialPolygon[initialPolygon.length - 1][1]
                        ? initialPolygon
                        : [...initialPolygon, initialPolygon[0]];
          
          const p = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [coords]
            }
          };
          draw.add(p as Feature);
        }

        // Event listeners
        if (!disabled) {
          mapInstance.on('draw.create', handleDrawCreate);
          mapInstance.on('draw.update', handleDrawUpdate);
          mapInstance.on('draw.delete', handleDrawDelete);
        }
      } catch (error) {
        console.error('Error initializing MapboxDraw:', error);
      }
    }, 50);

    // eslint-disable-next-line consistent-return
    return () => {
      clearTimeout(initTimeout);
      if (mapInstance && drawRef.current) {
        try {
          mapInstance.off('draw.create', handleDrawCreate);
          mapInstance.off('draw.update', handleDrawUpdate);
          mapInstance.off('draw.delete', handleDrawDelete);
          mapInstance.removeControl(drawRef.current);
        } catch (error) {
          console.warn('Error cleaning up draw control:', error);
        }
        drawRef.current = null;
      }
    };
  }, [mapLoaded, disabled, initialPolygon, handleDrawCreate, handleDrawUpdate, handleDrawDelete, cleanupDrawSources]);

  const startDrawing = useCallback(() => {
    if (drawRef.current) {
      try {
        // Clear existing features
        drawRef.current.deleteAll();
        // Change to polygon drawing mode
        drawRef.current.changeMode('draw_polygon');
        setIsDrawing(true);
      } catch (error) {
        console.error('Error starting drawing:', error);
        setIsDrawing(false);
      }
    }
  }, []);

  const clearPolygon = useCallback(() => {
    if (drawRef.current) {
      drawRef.current.deleteAll();
      setPolygon(null);
      onPolygonChange?.(null);
    }
  }, [onPolygonChange]);

  if(state.loading) {
    return null;
  }

  return (
    <>
      {!disabled && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={startDrawing}
            disabled={isDrawing}
          >
            {isDrawing ? 'Drawing...' : 'Draw Polygon'}
          </Button>
          {polygon && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={clearPolygon}
            >
              Clear Area
            </Button>
          )}
        </Box>
      )}

      <StyledMapContainer sx={{ mt: disabled ? 0 : 2, ...(sx || {}) }}>
        <Map
          ref={mapRef}
          reuseMaps
          onLoad={handleMapLoad}
          initialViewState={{
            zoom: 15,
            latitude: center?.[1] || state.latitude || 37.7577,
            longitude: center?.[0] || state.longitude || -122.4376,
          }}
          {...({
            ...(mapProps || {}),
            ...baseSettings,
          })}
        >
          <MapControl hideScaleControl={disabled} hideNavigationnControl={disabled} />
        </Map>
      </StyledMapContainer>
    </>
  )

}

const THEMES = {
  streets: 'mapbox://styles/mapbox/streets-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v11',
  light: 'mapbox://styles/mapbox/light-v10',
  dark: 'mapbox://styles/mapbox/dark-v10',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11',
};

const baseSettings = {
  mapboxAccessToken: MAPBOX_API,
  minZoom: 1,
  mapStyle: THEMES.dark,
};

const StyledMapContainer = styled('div')(({ theme }) => ({
  zIndex: 0,
  height: 400,
  overflow: 'hidden',
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  '& .mapboxgl-ctrl-logo, .mapboxgl-ctrl-bottom-right': {
    display: 'none',
  },
  '& .mapbox-gl-draw_ctrl-draw-btn': {
    display: 'none',
  },
}));


export default MapWithPolygon;

// Keep the old name for backward compatibility
export const MapWithBoundingBox = MapWithPolygon;

// ----------------------------------------------------------------------

interface RHFMapWithPolygonProps {
  name: string;
  mapProps?: MapBoxProps;
  helperText?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
}

export function RHFMapWithBoundingBox({
  name,
  mapProps,
  helperText,
  disabled = false,
  sx,
}: RHFMapWithPolygonProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box>
          <MapWithPolygon
            sx={sx}
            mapProps={mapProps}
            initialPolygon={field.value}
            disabled={disabled}
            onPolygonChange={(polygon: number[][] | null) => {
              field.onChange(polygon);
            }}
          />
          {(error || helperText) && (
            <Typography
              variant="caption"
              color={error ? 'error' : 'text.secondary'}
              sx={{ mt: 1, display: 'block' }}
            >
              {error?.message || helperText}
            </Typography>
          )}
        </Box>
      )}
    />
  );
}