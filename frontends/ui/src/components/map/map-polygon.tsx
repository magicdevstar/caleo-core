import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGeolocation } from "react-use";
// map
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import type { Map as MapLibreMap } from "maplibre-gl";
import Map, { MapRef, useControl } from "react-map-gl/maplibre";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { styled, SxProps, Theme } from "@mui/material/styles";
// @mui
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
// utils
import { DEFAULT_MAP_TILES } from "src/config-global";
import { getCenterOfPolygon } from "src/utils/get-location";
import { useBoolean, UseBooleanReturnType } from "src/hooks/use-boolean";
import MapControl from "./map-control";
import Iconify from "../iconify";

const styles = [{'id': 'gl-draw-polygon-fill-inactive','type': 'fill','filter': ['all',['==', 'active', 'false'],['==', '$type', 'Polygon'],['!=', 'mode', 'static']],'paint': {'fill-color': '#3bb2d0','fill-outline-color': '#3bb2d0','fill-opacity': 0.1}},{'id': 'gl-draw-polygon-fill-active','type': 'fill','filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],'paint': {'fill-color': '#fbb03b','fill-outline-color': '#fbb03b','fill-opacity': 0.1}},{'id': 'gl-draw-polygon-midpoint','type': 'circle','filter': ['all',['==', '$type', 'Point'],['==', 'meta', 'midpoint']],'paint': {'circle-radius': 3,'circle-color': '#fbb03b'}},{'id': 'gl-draw-polygon-stroke-inactive','type': 'line','filter': ['all',['==', 'active', 'false'],['==', '$type', 'Polygon'],['!=', 'mode', 'static']],'layout': {'line-cap': 'round','line-join': 'round'},'paint': {'line-color': '#3bb2d0','line-width': 2}},{'id': 'gl-draw-polygon-stroke-active','type': 'line','filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],'layout': {'line-cap': 'round','line-join': 'round'},'paint': {'line-color': '#fbb03b','line-dasharray': [0.2, 2],'line-width': 2}},{'id': 'gl-draw-line-inactive','type': 'line','filter': ['all',['==', 'active', 'false'],['==', '$type', 'LineString'],['!=', 'mode', 'static']],'layout': {'line-cap': 'round','line-join': 'round'},'paint': {'line-color': '#3bb2d0','line-width': 2}},{'id': 'gl-draw-line-active','type': 'line','filter': ['all',['==', '$type', 'LineString'],['==', 'active', 'true']],'layout': {'line-cap': 'round','line-join': 'round'},'paint': {'line-color': '#fbb03b','line-dasharray': [0.2, 2],'line-width': 2}},{'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive','type': 'circle','filter': ['all',['==', 'meta', 'vertex'],['==', '$type', 'Point'],['!=', 'mode', 'static']],'paint': {'circle-radius': 5,'circle-color': '#fff'}},{'id': 'gl-draw-polygon-and-line-vertex-inactive','type': 'circle','filter': ['all',['==', 'meta', 'vertex'],['==', '$type', 'Point'],['!=', 'mode', 'static']],'paint': {'circle-radius': 3,'circle-color': '#fbb03b'}},{'id': 'gl-draw-point-point-stroke-inactive','type': 'circle','filter': ['all',['==', 'active', 'false'],['==', '$type', 'Point'],['==', 'meta', 'feature'],['!=', 'mode', 'static']],'paint': {'circle-radius': 5,'circle-opacity': 1,'circle-color': '#fff'}},{'id': 'gl-draw-point-inactive','type': 'circle','filter': ['all',['==', 'active', 'false'],['==', '$type', 'Point'],['==', 'meta', 'feature'],['!=', 'mode', 'static']],'paint': {'circle-radius': 3,'circle-color': '#3bb2d0'}},{'id': 'gl-draw-point-stroke-active','type': 'circle','filter': ['all',['==', '$type', 'Point'],['==', 'active', 'true'],['!=', 'meta', 'midpoint']],'paint': {'circle-radius': 7,'circle-color': '#fff'}},{'id': 'gl-draw-point-active','type': 'circle','filter': ['all',['==', '$type', 'Point'],['!=', 'meta', 'midpoint'],['==', 'active', 'true']],'paint': {'circle-radius': 5,'circle-color': '#fbb03b'}},{'id': 'gl-draw-polygon-fill-static','type': 'fill','filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],'paint': {'fill-color': '#404040','fill-outline-color': '#404040','fill-opacity': 0.1}},{'id': 'gl-draw-polygon-stroke-static','type': 'line','filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],'layout': {'line-cap': 'round','line-join': 'round'},'paint': {'line-color': '#404040','line-width': 2}},{'id': 'gl-draw-line-static','type': 'line','filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],'layout': {'line-cap': 'round','line-join': 'round'},'paint': {'line-color': '#404040','line-width': 2}},{'id': 'gl-draw-point-static','type': 'circle','filter': ['all', ['==', 'mode', 'static'], ['==', '$type', 'Point']],'paint': {'circle-radius': 5,'circle-color': '#404040'}}];

export type PolygonDrawMapProps = {
  /** Array of [lng, lat] pairs (ring will be auto-closed internally). */
  initialPolygon?: number[][] | null;
  /** Fires whenever the polygon is created, updated, or deleted. */
  onPolygonChange?: (polygon: number[][] | null) => void;
  /** Map style URL */
  mapStyle?: string;
  /** Initial view */
  initialViewState?: { longitude: number; latitude: number; zoom?: number };
  /** Disable all editing & hide controls */
  disabled?: boolean;
  hideExpandControl?: boolean;
  /** Container sizing */
  sx?: SxProps<Theme>;
};

const DEFAULT_VIEW = { longitude: -96.9, latitude: 37.6, zoom: 15 };

function ensureClosedRing(ring: number[][]): number[][] {
  if (!ring || ring.length === 0) return ring;
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx === lx && fy === ly) return ring;
  return [...ring, [fx, fy]];
}

function stripClosingCoord(ring: number[][]): number[][] {
  if (ring.length < 2) return ring;
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  return fx === lx && fy === ly ? ring.slice(0, -1) : ring;
}

// Normalize a ring for equality checks: remove closing coord, round values, and rotate to stable start
function normalizeRing(ring?: number[][] | null): number[][] | null {
  if (!ring || ring.length < 3) return null;
  const open = stripClosingCoord(ring);
  const rounded = open.map(([x, y]) => [Number(x.toFixed(6)), Number(y.toFixed(6))]);
  // Find stable start by lexicographic min
  let start = 0;
  for (let i = 1; i < rounded.length; i += 1) {
    const [ax, ay] = rounded[i];
    const [bx, by] = rounded[start];
    if (ax < bx || (ax === bx && ay < by)) start = i;
  }
  return [...rounded.slice(start), ...rounded.slice(0, start)];
}

function ringsEqual(a?: number[][] | null, b?: number[][] | null): boolean {
  const na = normalizeRing(a);
  const nb = normalizeRing(b);
  return JSON.stringify(na) === JSON.stringify(nb);
}

function ExpandMapControl({ onClick }: { onClick: () => void }) {
  useControl(
    () => {
      const control = {
        onAdd: (map: any): HTMLElement => {
          // Check if our custom control already exists
          const existingControl = document.querySelector('.expand-map-control') as HTMLElement;
          if (existingControl) {
            // Update the click handler for the existing control
            const button = existingControl.querySelector('button');
            if (button) {
              // Remove old event listeners
              const newButton = button.cloneNode(true) as HTMLButtonElement;
              button.parentNode?.replaceChild(newButton, button);
              // Add new event listener
              newButton.addEventListener('click', onClick);
            }
            return existingControl;
          }

          const container = document.createElement('div');
          container.className = 'maplibregl-ctrl maplibregl-ctrl-group expand-map-control';
          
          const button = document.createElement('button');
          button.className = 'maplibregl-ctrl-icon';
          button.type = 'button';
          button.title = 'Expand Map';
          button.setAttribute('aria-label', 'Expand Map');
          
          // Create icon using Material Icons font or SVG
          button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          `;
          
          button.style.border = 'none';
          button.style.background = 'none';
          button.style.cursor = 'pointer';
          button.style.display = 'flex';
          button.style.alignItems = 'center';
          button.style.justifyContent = 'center';
          
          button.addEventListener('click', onClick);
          
          container.appendChild(button);
          return container;
        },
        onRemove: () => {
          // Don't remove the control when component unmounts with reuseMaps
          // It will be reused by the next component instance
        }
      };
      return control;
    },
    {
      position: 'top-left'
    }
  );

  return null;
}

export default function PolygonDrawMap({
  initialPolygon,
  onPolygonChange,
  mapStyle = DEFAULT_MAP_TILES,
  initialViewState = DEFAULT_VIEW,
  disabled = false,
  hideExpandControl,
  sx,
}: PolygonDrawMapProps) {
  const location = useGeolocation();
  const center = useMemo(() => initialPolygon ? getCenterOfPolygon(initialPolygon as any) : null, [initialPolygon]);
  const mapRef = useRef<MapRef | null>(null);
  const drawRef = useRef<any>(null);
  const loadedRef = useRef(false);
  const controlAddedRef = useRef<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const disabledRef = useRef<boolean>(disabled);
  const syncingRef = useRef<boolean>(false);
  const lastEmittedRef = useRef<string>(JSON.stringify(initialPolygon ?? null));
  const dialogOpen = useBoolean<any>();

  const handleOpenDialog = useCallback(() => {
    dialogOpen.onTrue(initialPolygon);
  }, [dialogOpen, initialPolygon]);

  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  const emitPolygon = (poly: number[][] | null) => {
    const key = JSON.stringify(normalizeRing(poly));
    if (key === lastEmittedRef.current) return;
    lastEmittedRef.current = key;
    onPolygonChange?.(poly);
  };

  const getMapboxMap = (): MapLibreMap | null => mapRef.current?.getMap() ?? null;

  const getCurrentPolygon = useCallback((): number[][] | null => {
    const draw = drawRef.current;
    const map = getMapboxMap();
    if (!draw || !map) return null;
    const fc = draw.getAll();
    if (!fc?.features?.length) return null;
    const poly = fc.features.find((f: any) => f.geometry?.type === "Polygon");
    if (!poly) return null;
    const ring: number[][] = poly.geometry.coordinates?.[0] ?? [];
    const final = (stripClosingCoord(ring) || [])?.filter(Boolean);
    return final.length === 0 ? null : final;
  }, []);

  const upsertPolygonFromProp = (coords: number[][] | null | undefined): string | null => {
    const draw = drawRef.current;
    if (!draw) return null;
    syncingRef.current = true;
    try { draw.deleteAll(); } catch {/* noop */}
    if (!coords || coords.length < 3) return null;
    const closed = ensureClosedRing(coords);
  const res = draw.add({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [closed] },
    });
    // MapboxDraw.add returns the created feature id or array of ids
    let id: string | null = null;
    if (Array.isArray(res)) {
      id = res[0] ?? null;
    } else if (typeof res === 'string') {
      id = res;
    } else {
      id = null;
    }
    // Defer un-suppress to next tick so draw.create handlers are skipped
  try { lastEmittedRef.current = JSON.stringify(normalizeRing(closed)); } catch {/* ignore */}
    setTimeout(() => { syncingRef.current = false; }, 0);
    return id;
  };

  // Initialize Draw control after the map has loaded
  useEffect(() => {
    if (!mapLoaded) return;
    const map = getMapboxMap();
    if (!map) return;

    // Ensure MapboxDraw uses MapLibre class names
    (MapboxDraw.constants.classes as any).CANVAS = 'maplibregl-canvas';
    (MapboxDraw.constants.classes as any).CONTROL_BASE = 'maplibregl-ctrl';
    (MapboxDraw.constants.classes as any).CONTROL_PREFIX = 'maplibregl-ctrl-';
    (MapboxDraw.constants.classes as any).CONTROL_GROUP = 'maplibregl-ctrl-group';
    (MapboxDraw.constants.classes as any).ATTRIBUTION = 'maplibregl-ctrl-attrib';


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
      styles,
    });
    drawRef.current = draw;

    // Always add the control so polygons render even when disabled
    try {
      map.addControl(draw as any, 'top-right');
      controlAddedRef.current = true;
    } catch { /* ignore */ }

  const onChange = () => { if (!syncingRef.current) emitPolygon(getCurrentPolygon()); };
  const ensureSinglePolygon = (keepId?: string) => {
      const d = drawRef.current;
      try {
    syncingRef.current = true;
        const polys = (d?.getAll().features || []).filter((f: any) => f.geometry?.type === 'Polygon');
        polys.forEach((f: any) => {
          if (!keepId || f.id !== keepId) {
            d?.delete(f.id);
          }
        });
    setTimeout(() => { syncingRef.current = false; }, 0);
      } catch {/* ignore */}
    };
    const onCreate = (e: any) => {
      if (syncingRef.current) return;
      const createdId = e?.features?.[0]?.id;
      ensureSinglePolygon(createdId);
      emitPolygon(getCurrentPolygon());
      if (!disabledRef.current) {
        try { drawRef.current?.changeMode('simple_select'); } catch {/* ignore */}
      }
    };
    const onDelete = () => {
      if (!syncingRef.current) emitPolygon(null);
      const d = drawRef.current;
      try {
        if (!disabledRef.current) {
          d?.changeMode('draw_polygon');
        } else {
          d?.changeMode('static');
        }
      } catch {/* ignore */}
    };

    // Seed from initial polygon and fit view
    if (!loadedRef.current) {
      loadedRef.current = true;
      if (initialPolygon && initialPolygon.length >= 3) {
        try {
          const closed = ensureClosedRing(initialPolygon);
          const lngs = closed.map((c) => c[0]);
          const lats = closed.map((c) => c[1]);
          const minLng = Math.min(...lngs);
          const minLat = Math.min(...lats);
          const maxLng = Math.max(...lngs);
          const maxLat = Math.max(...lats);
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 40, animate: false });
        } catch {/* ignore */}
        // If enabled and a polygon exists, use simple_select without preselecting
        if (!disabled) {
          try { draw.changeMode('simple_select'); } catch {/* ignore */}
        }
      }
    }

    map.on('draw.create' as any, onCreate);
    map.on('draw.update' as any, onChange);
    map.on('draw.delete' as any, onDelete);
  // Keep listeners minimal to avoid unnecessary loops
    // eslint-disable-next-line consistent-return
    return () => {
      map.off('draw.create' as any, onCreate);
      map.off('draw.update' as any, onChange);
      map.off('draw.delete' as any, onDelete);
  // removed extra listeners
      try { if (controlAddedRef.current) map.removeControl(draw as any); } catch {/* ignore */}
      drawRef.current = null;
      controlAddedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  // Toggle editability when `disabled` changes (keep control mounted so features render)
  useEffect(() => {
    const map = getMapboxMap();
    const draw = drawRef.current;
    if (!map || !draw) return;

    // Toggle interaction mode only
    try {
      if (disabled) {
        draw.changeMode('static');
      } else {
        const hasPoly = !!getCurrentPolygon();
        if (hasPoly) {
          draw.changeMode('simple_select');
        } else {
          draw.changeMode('draw_polygon');
        }
      }
    } catch {/* ignore */}
  }, [disabled, getCurrentPolygon]);

  // Respond to external initialPolygon changes after mount
  useEffect(() => {
    setTimeout(() => {
      // const now = JSON.stringify(initialPolygon ?? null);
      // if (now === lastInitialPolyRef.current) return;
      // lastInitialPolyRef.current = now;
      if (loadedRef.current) {
        // If incoming polygon equals current polygon, do nothing
        try {
          const current = getCurrentPolygon();
          if (ringsEqual(current ?? null, initialPolygon ?? null)) return;
        } catch {/* ignore */}
        const id = upsertPolygonFromProp(initialPolygon);
        const draw = drawRef.current;
        if (!disabled) {
          try {
            const featureId = id ?? (draw?.getAll().features.find((f: any) => f.geometry?.type === 'Polygon') as any)?.id;
            if (featureId) {
              draw.changeMode('simple_select');
            } else {
              // No polygon present: go to draw mode
              draw.changeMode('draw_polygon');
            }
          } catch {/* ignore */}
        } else {
          try { draw?.changeMode('static'); } catch {/* ignore */}
        }
      }
    }, 250);
  }, [initialPolygon, disabled, getCurrentPolygon]);

  return (
    <>
      <StyledMapContainer data-disabled={disabled ? 'true' : 'false'} sx={{ mt: disabled ? 0 : 2, ...(sx || {}) }}>
        <Map
          reuseMaps
          ref={mapRef}
          onLoad={() => setMapLoaded(true)}
          mapStyle={mapStyle}
          initialViewState={{
            ...initialViewState,
            latitude: center?.[1] || location.latitude || initialViewState.latitude,
            longitude: center?.[0] || location.longitude || initialViewState.longitude,
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <MapControl hideScaleControl={disabled} hideNavigationnControl={disabled} hideFullscreenControl />
          {!hideExpandControl && <ExpandMapControl onClick={handleOpenDialog} />}
        </Map>
      </StyledMapContainer>
      <MapExpandDialog dialogOpen={dialogOpen} />
    </>
  );
}

const StyledMapContainer = styled('div')(({ theme }) => ({
  zIndex: 0,
  height: 400,
  overflow: 'hidden',
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  ...(theme.palette.mode === 'dark' ? {
    '& .maplibregl-canvas': {
      filter: 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)',
    },
  } : {}),
}));

interface IMapExpandDialogProps {
  dialogOpen: UseBooleanReturnType<any>;
}

export function MapExpandDialog({
  dialogOpen,
}: IMapExpandDialogProps) {
  return (
    <Dialog 
      open={dialogOpen.value} 
      onClose={dialogOpen.onFalse}
      maxWidth={false}
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: '90vw',
          height: '90vh',
          maxWidth: 'none',
          maxHeight: 'none',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Map View</Typography>
        <IconButton onClick={dialogOpen.onFalse} size="small">
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        { dialogOpen.attribute && (
          <PolygonDrawMap sx={{ height: '100%' }} disabled hideExpandControl initialPolygon={dialogOpen.attribute} />
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={dialogOpen.onFalse} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
