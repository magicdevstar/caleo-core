import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGeolocation } from "react-use";
// map
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { Map as MapLibreMap } from "maplibre-gl";
import Map, { MapRef } from "react-map-gl/maplibre";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { SxProps, Theme } from "@mui/material/styles";
// utils
import { DEFAULT_MAP_TILES } from "src/config-global";
import { getCenterOfPolygon } from "src/utils/get-location";
import { useBoolean } from "src/hooks/use-boolean";
import MapControl from "./map-control";
import { styles } from "./polygon/styles";
import {
  DEFAULT_VIEW,
  ensureClosedRing,
  normalizeRing,
  ringsEqual,
  stripClosingCoord,
} from "./polygon/utils";
import { ExpandMapControl, MapExpandDialog } from "./map-expand-control";
import { PinControl } from "./map-pin-control";
import MapMarker from "./map-marker";
import { StyledMapContainer } from './styles'


export type PolygonDrawMapProps = {
  /** Array of [lng, lat] pairs (ring will be auto-closed internally). */
  initialPolygon?: number[][] | null;
  /** Fires whenever the polygon is created, updated, or deleted. */
  onPolygonChange?: (polygon: number[][] | null) => void;
  /** Initial pin location [lng, lat] */
  initialPin?: [number, number] | null;
  /** Fires whenever the pin is created, updated, or deleted. */
  onPinChange?: (pin: [number, number] | null) => void;
  /** Map style URL */
  mapStyle?: string;
  /** Initial view */
  initialViewState?: { longitude: number; latitude: number; zoom?: number };
  /** Disable all editing & hide controls */
  disabled?: boolean;
  hideExpandControl?: boolean;
  hideAttributionControl?: boolean;
  /** Container sizing */
  sx?: SxProps<Theme>;
};

export default function PolygonDrawMap({
  initialPolygon,
  onPolygonChange,
  initialPin,
  onPinChange,
  mapStyle = DEFAULT_MAP_TILES,
  initialViewState = DEFAULT_VIEW,
  disabled = false,
  hideExpandControl,
  hideAttributionControl,
  sx,
}: PolygonDrawMapProps) {
  const location = useGeolocation();
  const center = useMemo(
    () => (initialPolygon ? getCenterOfPolygon(initialPolygon as any) : null),
    [initialPolygon],
  );
  const mapRef = useRef<MapRef | null>(null);
  const drawRef = useRef<any>(null);
  const loadedRef = useRef(false);
  const controlAddedRef = useRef<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const disabledRef = useRef<boolean>(disabled);
  const syncingRef = useRef<boolean>(false);
  const lastEmittedRef = useRef<string>(JSON.stringify(initialPolygon ?? null));
  const dialogOpen = useBoolean<any>();
  
  // Pin state
  const [pin, setPin] = useState<[number, number] | null>(initialPin || null);
  const [pinMode, setPinMode] = useState(false);

  const handleOpenDialog = useCallback(() => {
    dialogOpen.onTrue(initialPolygon);
  }, [dialogOpen, initialPolygon]);

  const handlePinToggle = useCallback(() => {
    if (disabled) return;
    setPinMode(!pinMode);
  }, [pinMode, disabled]);

  const handleDeletePin = useCallback(() => {
    if (disabled) return;
    setPin(null);
    setPinMode(false);
  }, [disabled]);

  // Effect to sync pin state with prop
  useEffect(() => {
    if (JSON.stringify(initialPin) === JSON.stringify(pin)) return;
    setPin(initialPin || null);
  }, [initialPin, pin]);

  // Effect to emit pin changes
  useEffect(() => {
    onPinChange?.(pin);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

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
    try {
      draw.deleteAll();
    } catch {
      /* noop */
    }
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
    } else if (typeof res === "string") {
      id = res;
    } else {
      id = null;
    }
    // Defer un-suppress to next tick so draw.create handlers are skipped
    try {
      lastEmittedRef.current = JSON.stringify(normalizeRing(closed));
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      syncingRef.current = false;
    }, 0);
    return id;
  };

  // Initialize Draw control after the map has loaded
  useEffect(() => {
    if (!mapLoaded) return;
    const map = getMapboxMap();
    if (!map) return;

    // Ensure MapboxDraw uses MapLibre class names
    (MapboxDraw.constants.classes as any).CANVAS = "maplibregl-canvas";
    (MapboxDraw.constants.classes as any).CONTROL_BASE = "maplibregl-ctrl";
    (MapboxDraw.constants.classes as any).CONTROL_PREFIX = "maplibregl-ctrl-";
    (MapboxDraw.constants.classes as any).CONTROL_GROUP = "maplibregl-ctrl-group";
    (MapboxDraw.constants.classes as any).ATTRIBUTION = "maplibregl-ctrl-attrib";

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      touchEnabled: !disabled,
      boxSelect: !disabled,
      keybindings: !disabled,
      clickBuffer: disabled ? 0 : 2,
      controls: disabled
        ? {}
        : {
            polygon: true,
            trash: true,
          },
      defaultMode: "simple_select",
      styles,
    });
    drawRef.current = draw;

    // Always add the control so polygons render even when disabled
    try {
      map.addControl(draw as any, "top-right");
      controlAddedRef.current = true;
    } catch {
      /* ignore */
    }

    const onChange = () => {
      if (!syncingRef.current) emitPolygon(getCurrentPolygon());
    };

    const ensureSinglePolygon = (keepId?: string) => {
      const d = drawRef.current;
      try {
        syncingRef.current = true;
        const polys = (d?.getAll().features || []).filter(
          (f: any) => f.geometry?.type === "Polygon",
        );
        polys.forEach((f: any) => {
          if (!keepId || f.id !== keepId) {
            d?.delete(f.id);
          }
        });
        setTimeout(() => {
          syncingRef.current = false;
        }, 0);
      } catch {
        /* ignore */
      }
    };

    const onCreate = (e: any) => {
      if (syncingRef.current) return;
      const createdId = e?.features?.[0]?.id;
      ensureSinglePolygon(createdId);
      emitPolygon(getCurrentPolygon());
      if (!disabledRef.current) {
        try {
          drawRef.current?.changeMode("simple_select");
        } catch {
          /* ignore */
        }
      }
    };

    const onDelete = () => {
      if (!syncingRef.current) emitPolygon(null);
      const d = drawRef.current;
      try {
        if (!disabledRef.current) {
          d?.changeMode("draw_polygon");
        } else {
          d?.changeMode("static");
        }
      } catch {
        /* ignore */
      }
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
          map.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            { padding: 40, animate: false },
          );
        } catch {
          /* ignore */
        }
        // If enabled and a polygon exists, use simple_select without preselecting
        if (!disabled) {
          try {
            draw.changeMode("simple_select");
          } catch {
            /* ignore */
          }
        }
      }
    }

    map.on("draw.create" as any, onCreate);
    map.on("draw.update" as any, onChange);
    map.on("draw.delete" as any, onDelete);

    // Keep listeners minimal to avoid unnecessary loops
    // eslint-disable-next-line consistent-return
    return () => {
      map.off("draw.create" as any, onCreate);
      map.off("draw.update" as any, onChange);
      map.off("draw.delete" as any, onDelete);
      // removed extra listeners
      try {
        if (controlAddedRef.current) map.removeControl(draw as any);
      } catch {
        /* ignore */
      }
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
        draw.changeMode("static");
      } else {
        const hasPoly = !!getCurrentPolygon();
        if (hasPoly) {
          draw.changeMode("simple_select");
        } else {
          draw.changeMode("draw_polygon");
        }
      }
    } catch {
      /* ignore */
    }
  }, [disabled, getCurrentPolygon]);

  // Handle map clicks for pin placement
  const handleMapClick = useCallback((event: any) => {
    if (!pinMode || disabled) return;
    
    const { lngLat } = event;
    const newPin: [number, number] = [lngLat.lng, lngLat.lat];
    setPin(newPin);
    setPinMode(false); // Exit pin mode after placing pin
  }, [pinMode, disabled]);

  // Handle pin drag
  const handlePinDrag = useCallback((event: any) => {
    if (disabled) return;
    const { lngLat } = event;
    const newPin: [number, number] = [lngLat.lng, lngLat.lat];
    setPin(newPin);
  }, [disabled]);

  // Respond to external initialPolygon changes after mount
  useEffect(() => {
    if (mapLoaded) {
      // If incoming polygon equals current polygon, do nothing
      try {
        const current = getCurrentPolygon();
        if (ringsEqual(current ?? null, initialPolygon ?? null)) return;
      } catch {
        /* ignore */
      }
      const id = upsertPolygonFromProp(initialPolygon);
      const draw = drawRef.current;
      if (!disabled) {
        try {
          const featureId =
            id ??
            (draw?.getAll().features.find((f: any) => f.geometry?.type === "Polygon") as any)?.id;
          if (featureId) {
            draw.changeMode("simple_select");
          } else {
            // No polygon present: go to draw mode
            draw.changeMode("draw_polygon");
          }
        } catch {
          /* ignore */
        }
      } else {
        try {
          draw?.changeMode("static");
        } catch {
          /* ignore */
        }
      }
    }
  }, [initialPolygon, disabled, getCurrentPolygon, mapLoaded]);

  return (
    <>
      <StyledMapContainer
        data-disabled={disabled ? "true" : "false"}
        sx={{ mt: disabled ? 0 : 2, ...(sx || {}) }}
      >
        <Map
          ref={mapRef}
          onLoad={() => setMapLoaded(true)}
          onClick={handleMapClick}
          mapStyle={mapStyle}
          initialViewState={{
            ...initialViewState,
            latitude: center?.[1] || location.latitude || initialViewState.latitude,
            longitude: center?.[0] || location.longitude || initialViewState.longitude,
          }}
          style={{ width: "100%", height: "100%" }}
          attributionControl={!hideAttributionControl as any}
          cursor={pinMode ? "crosshair" : "default"}
        >
          <MapControl
            hideScaleControl={disabled}
            hideNavigationnControl={disabled}
            hideFullscreenControl
          />
          {!hideExpandControl && <ExpandMapControl onClick={handleOpenDialog} />}
          {!disabled && (
            <PinControl 
              onAddPin={handlePinToggle} 
              onDeletePin={handleDeletePin}
              disabled={disabled} 
              hasPin={!!pin}
            />
          )}
          {pin && (
            <MapMarker
              longitude={pin[0]}
              latitude={pin[1]}
              draggable={!disabled}
              onDrag={handlePinDrag}
              onDragEnd={handlePinDrag}
            />
          )}
        </Map>
      </StyledMapContainer>
      <MapExpandDialog dialogOpen={dialogOpen} />
    </>
  );
}
