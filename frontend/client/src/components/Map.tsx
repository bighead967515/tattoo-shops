/**
 * MAPTILER CLOUD FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * import { Map } from '@maptiler/sdk';
 * const mapRef = useRef<Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map;
 *   }}
 * />
 *
 * ======
 * Available Features:
 * -------------------------------
 * 📍 MARKERS
 * import { Marker } from '@maptiler/sdk';
 * new Marker({ color: "#FF0000" })
 *   .setLngLat([lng, lat])
 *   .addTo(map);
 *
 * -------------------------------
 * 🏢 GEOCODING
 * import * as maptilersdk from '@maptiler/sdk';
 * const result = await maptilersdk.geocoding.forward("New York");
 * map.flyTo({ center: result.features[0].center });
 *
 * -------------------------------
 * 🔍 SEARCH / PLACES
 * const places = await maptilersdk.geocoding.forward("coffee shop", {
 *   proximity: [lng, lat],
 *   types: ["poi"]
 * });
 *
 * -------------------------------
 * 🛣️ NAVIGATION / ROUTING
 * const route = await maptilersdk.routing.route([
 *   [startLng, startLat],
 *   [endLng, endLat]
 * ]);
 * // Add route as GeoJSON layer
 *
 * -------------------------------
 * 🗺️ MAP STYLES
 * - maptilersdk.MapStyle.STREETS
 * - maptilersdk.MapStyle.SATELLITE
 * - maptilersdk.MapStyle.HYBRID
 * - maptilersdk.MapStyle.OUTDOOR
 * - maptilersdk.MapStyle.DARK
 * - maptilersdk.MapStyle.LIGHT
 *
 * -------------------------------
 * 📐 CONTROLS
 * import { NavigationControl, GeolocateControl, ScaleControl } from '@maptiler/sdk';
 * map.addControl(new NavigationControl());
 * map.addControl(new GeolocateControl());
 * map.addControl(new ScaleControl());
 *
 * -------------------------------
 * 🎨 POPUPS
 * import { Popup } from '@maptiler/sdk';
 * new Popup()
 *   .setLngLat([lng, lat])
 *   .setHTML("<h3>Title</h3><p>Description</p>")
 *   .addTo(map);
 */

import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { useEffect, useRef } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

// Set the MapTiler API key globally
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
if (MAPTILER_API_KEY) {
  maptilersdk.config.apiKey = MAPTILER_API_KEY;
}

// Re-export commonly used types for convenience
export type { Map, Marker, Popup, LngLatLike } from "@maptiler/sdk";
export { maptilersdk };

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  mapStyle?: maptilersdk.MapStyleVariant | string;
  onMapReady?: (map: maptilersdk.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  mapStyle = maptilersdk.MapStyle.STREETS,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);

  const init = usePersistFn(() => {
    if (!MAPTILER_API_KEY) {
      console.error("MapTiler API key not configured. Set VITE_MAPTILER_API_KEY in your environment.");
      return;
    }

    if (!mapContainer.current) {
      console.error("Map container not found");
      return;
    }

    // Prevent double initialization
    if (map.current) {
      return;
    }

    try {
      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialZoom,
        navigationControl: true,
        geolocateControl: true,
      });

      map.current.on("load", () => {
        if (onMapReady && map.current) {
          onMapReady(map.current);
        }
      });
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  });

  useEffect(() => {
    init();

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [init]);

  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
  );
}
