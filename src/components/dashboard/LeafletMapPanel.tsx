import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, Rectangle, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { LocateFixed, Loader2, Maximize2, Minimize2, Minus, Plus, Layers3 } from "lucide-react";
import { reverseGeocode, type GeocodedLocation } from "@/lib/geocode";
import "leaflet/dist/leaflet.css";

export interface LeafletMapPanelProps {
  lat: number;
  lng: number;
  locationName?: string;
  onLocationChange?: (location: GeocodedLocation) => void;
  onLocationError?: (message: string) => void;
}

const locationMarker = L.divIcon({
  className: "satellite-location-marker",
  html: '<span class="satellite-marker-drop"><span class="satellite-marker-pulse"></span><span class="satellite-marker-dot"></span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

type BaseLayer = "Satellite" | "Street" | "Terrain";
type MapCoordinates = { lat: number; lng: number } | null;

const mapControlClass = "flex h-9 w-9 items-center justify-center rounded-control border border-white/10 bg-[#111827]/85 text-slate-100 shadow-elevation-2 backdrop-blur-md transition hover:border-primary/50 hover:bg-[#1b2638] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function ScaleControl() {
  const map = useMap();
  useEffect(() => {
    const scale = L.control.scale({ position: "bottomright", imperial: false, metric: true, maxWidth: 110 });
    scale.addTo(map);
    return () => { scale.remove(); };
  }, [map]);
  return null;
}

function CoordinateTracker({ onMove }: { onMove: (coordinates: MapCoordinates) => void }) {
  useMapEvents({
    mousemove: ({ latlng }) => onMove({ lat: latlng.lat, lng: latlng.lng }),
  });
  return null;
}

function MapOverlayControls({
  activeLayer,
  onLayerChange,
  onLayerError,
  fullscreen,
  onToggleFullscreen,
}: {
  activeLayer: BaseLayer;
  onLayerChange: (layer: BaseLayer) => void;
  onLayerError: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const map = useMap();
  const layers: { name: BaseLayer; title: string }[] = [
    { name: "Satellite", title: "Satellite imagery" },
    { name: "Street", title: "OpenStreetMap street map" },
    { name: "Terrain", title: "OpenTopoMap terrain" },
  ];

  return <>
    {activeLayer === "Satellite" ? <TileLayer
      key="satellite"
      className="map-layer-fade map-layer-satellite"
      attribution='Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      maxZoom={19}
      eventHandlers={{ tileerror: onLayerError }}
    /> : activeLayer === "Terrain" ? <TileLayer
      key="terrain"
      className="map-layer-fade map-layer-terrain"
      attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
      url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      maxNativeZoom={17}
      maxZoom={19}
      eventHandlers={{ tileerror: onLayerError }}
    /> : <TileLayer
      key="street"
      className="map-layer-fade map-layer-street"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
    />}
    <ScaleControl />
    <div className="absolute left-3 top-3 z-[500] flex flex-col gap-2" aria-label="Map controls" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex flex-col overflow-hidden rounded-control border border-white/10 bg-[#111827]/85 shadow-elevation-2 backdrop-blur-md">
      <button type="button" aria-label="Zoom in" data-tooltip="Zoom in" onClick={() => map.zoomIn()} className={`dashboard-tooltip ${mapControlClass} rounded-none border-0 bg-transparent`}><Plus size={17}/></button>
        <span className="mx-2 border-t border-white/10" />
        <button type="button" aria-label="Zoom out" data-tooltip="Zoom out" onClick={() => map.zoomOut()} className={`dashboard-tooltip ${mapControlClass} rounded-none border-0 bg-transparent`}><Minus size={17}/></button>
      </div>
      <button type="button" aria-label={fullscreen ? "Exit fullscreen map" : "Open fullscreen map"} data-tooltip={fullscreen ? "Exit fullscreen" : "Fullscreen map"} onClick={onToggleFullscreen} className={`dashboard-tooltip ${mapControlClass}`}>
        {fullscreen ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
      </button>
    </div>
    <div className="absolute right-3 top-3 z-[500] w-[132px] rounded-card border border-white/10 bg-[#111827]/85 p-1.5 shadow-elevation-2 backdrop-blur-md" role="group" aria-label="Map layer" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
      <p className="flex items-center gap-1.5 px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><Layers3 size={12}/> Map layers</p>
      {layers.map(({ name, title }) => <button
        key={name}
        type="button"
        title={title}
        data-tooltip={title}
        aria-pressed={activeLayer === name}
        onClick={() => onLayerChange(name)}
        className={`dashboard-tooltip w-full rounded-control px-2.5 py-1.5 text-left text-meta transition-[color,background-color,transform] duration-200 ${activeLayer === name ? "bg-primary/20 text-blue-200" : "text-slate-300 hover:translate-x-0.5 hover:bg-white/[0.06] hover:text-white"}`}
      >{name}</button>)}
    </div>
    <div className="absolute bottom-16 right-3 z-[500] rounded-control border border-white/10 bg-[#111827]/80 px-2.5 py-2 text-[10px] leading-5 text-slate-200 shadow-elevation-2 backdrop-blur-md" aria-label="Map legend">
      <p className="flex items-center gap-2"><span className="relative h-2.5 w-2.5 rounded-full border border-white bg-blue-500"><span className="absolute -inset-1 rounded-full border border-blue-300/70"/></span> Marker</p>
      <p className="flex items-center gap-2"><span className="h-2.5 w-3 border border-dashed border-blue-300 bg-blue-400/20"/> Analysis Area</p>
    </div>
  </>;
}

function MapBehaviors({ lat, lng, onLocationChange, onLocationError, onMapSelection }: LeafletMapPanelProps & { onMapSelection?: () => void }) {
  const map = useMap();
  const clickSequence = useRef(0);

  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 1.2 });
  }, [lat, lng, map]);

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  useMapEvents({
    click: ({ latlng }) => {
      const requestId = ++clickSequence.current;
      const selected = { lat: latlng.lat, lng: latlng.lng, name: "Selected location" };
      onMapSelection?.();
      onLocationChange?.(selected);
      void reverseGeocode(latlng.lat, latlng.lng)
        .then((result) => { if (requestId === clickSequence.current) onLocationChange?.(result); })
        .catch(() => { if (requestId === clickSequence.current) onLocationError?.("Could not identify this map location. Coordinates are still selected."); });
    },
  });

  return null;
}

function CurrentLocationControl({ onLocationChange, onLocationError }: LeafletMapPanelProps) {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  function locate() {
    if (!navigator.geolocation) {
      onLocationError?.("Location services are not available in this browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude, name: "Current location" };
        onLocationChange?.(point);
        map.flyTo([point.lat, point.lng], 13, { duration: 1.2 });
        setIsLocating(false);
        void reverseGeocode(point.lat, point.lng)
          .then((result) => onLocationChange?.(result))
          .catch(() => onLocationError?.("Current location selected. Place name could not be loaded."));
      },
      (error) => {
        setIsLocating(false);
        onLocationError?.(error.code === error.PERMISSION_DENIED
          ? "Location permission was denied. You can still search for a place."
          : "Could not access your current location. Please try again or search for a place.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => { event.stopPropagation(); locate(); }}
      onMouseDown={(event) => event.stopPropagation()}
      disabled={isLocating}
      aria-label="Use my current location"
      className="absolute right-3 top-32 z-[500] inline-flex h-9 items-center gap-2 rounded-control border border-hairline-strong bg-[#111827]/90 px-3 text-meta text-text-primary shadow-elevation-2 backdrop-blur transition-[color,background-color,border-color,transform,box-shadow] duration-200 hover:-translate-y-px hover:border-primary/40 hover:bg-[#1b2638] disabled:opacity-70"
    >
      {isLocating ? <Loader2 className="h-4 w-4 animate-spin"/> : <LocateFixed className="h-4 w-4"/>}
      <span>Use My Location</span>
    </button>
  );
}

export default function LeafletMapPanel({ lat, lng, locationName = "Selected location", onLocationChange, onLocationError }: LeafletMapPanelProps) {
  const markerRef = useRef<L.Marker>(null);
  const mapShellRef = useRef<HTMLDivElement>(null);
  const [activeLayer, setActiveLayer] = useState<BaseLayer>("Satellite");
  const [coordinates, setCoordinates] = useState<MapCoordinates>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreenState = () => {
      if (document.fullscreenElement) setFullscreen(document.fullscreenElement === mapShellRef.current);
    };
    const exitFallbackOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", syncFullscreenState);
    window.addEventListener("keydown", exitFallbackOnEscape);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      window.removeEventListener("keydown", exitFallbackOnEscape);
    };
  }, []);

  // A compact illustrative AOI centered on the resolved search coordinates.
  // Adjust longitude span by latitude so the rectangle remains geographically balanced.
  const latitudeSpan = 0.012;
  const longitudeSpan = latitudeSpan / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  const analysisBounds: L.LatLngBoundsExpression = [
    [lat - latitudeSpan, lng - longitudeSpan],
    [lat + latitudeSpan, lng + longitudeSpan],
  ];

  const openMarkerPopup = () => window.setTimeout(() => markerRef.current?.openPopup(), 0);
  const handleLayerError = () => setActiveLayer("Street");
  const handleLayerChange = (layer: BaseLayer) => setActiveLayer(layer);
  const handleToggleFullscreen = () => {
    const shell = mapShellRef.current;
    if (fullscreen && !document.fullscreenElement) {
      setFullscreen(false);
      return;
    }
    if (document.fullscreenElement === shell) {
      void document.exitFullscreen().catch(() => setFullscreen(false));
      return;
    }
    if (shell?.requestFullscreen) {
      void shell.requestFullscreen().then(() => setFullscreen(true)).catch(() => setFullscreen((value) => !value));
      return;
    }
    setFullscreen((value) => !value);
  };

  return (
    <div ref={mapShellRef} className={`relative h-full w-full overflow-hidden ${fullscreen ? "fixed inset-0 z-[2000] h-screen w-screen rounded-none" : "rounded-card"}`}>
      <style>{`
        .satellite-location-marker { background: transparent; border: 0; }
        .satellite-marker-drop { position: relative; display: block; width: 28px; height: 28px; animation: satellite-marker-drop 420ms cubic-bezier(.2,.8,.25,1.2) both; }
        .satellite-marker-dot { position: absolute; left: 7px; top: 7px; width: 14px; height: 14px; border: 3px solid #fff; border-radius: 50%; background: #2563eb; box-shadow: 0 1px 10px rgba(37,99,235,.9); }
        .satellite-marker-pulse { position: absolute; inset: 2px; border: 1px solid rgba(96,165,250,.9); border-radius: 50%; animation: satellite-marker-pulse 1.8s ease-out infinite; }
        .analysis-aoi { filter: drop-shadow(0 0 5px rgba(59,130,246,.72)); animation: analysis-aoi-dash 18s linear infinite; }
        .map-layer-fade { animation: map-layer-fade-in 420ms ease-out both; }
        .leaflet-control-scale-line { border-color: rgba(203,213,225,.9) !important; background: rgba(17,24,39,.78) !important; color: #e2e8f0 !important; text-shadow: none !important; backdrop-filter: blur(8px); }
        @keyframes satellite-marker-drop { from { opacity: 0; transform: translateY(-24px) scale(.72); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes satellite-marker-pulse { 0% { transform: scale(.55); opacity: .9; } 100% { transform: scale(1.55); opacity: 0; } }
        @keyframes analysis-aoi-dash { to { stroke-dashoffset: -100; } }
        @keyframes map-layer-fade-in { from { opacity: .35; } to { opacity: 1; } }
      `}</style>
    <MapContainer
      center={[lat, lng]}
      zoom={12}
      minZoom={2}
      maxZoom={19}
      scrollWheelZoom
      keyboard
      zoomControl={false}
      style={{ width: "100%", height: "100%" }}
      aria-label="Interactive satellite analysis map"
    >
      <MapBehaviors lat={lat} lng={lng} onLocationChange={onLocationChange} onLocationError={onLocationError} onMapSelection={openMarkerPopup}/>
      <CurrentLocationControl lat={lat} lng={lng} onLocationChange={onLocationChange} onLocationError={onLocationError}/>
      <CoordinateTracker onMove={setCoordinates}/>
      <MapOverlayControls activeLayer={activeLayer} onLayerChange={handleLayerChange} onLayerError={handleLayerError} fullscreen={fullscreen} onToggleFullscreen={handleToggleFullscreen}/>
      <Rectangle
        bounds={analysisBounds}
        pathOptions={{ className: "analysis-aoi", color: "#60a5fa", weight: 2, opacity: 0.88, fillColor: "#3b82f6", fillOpacity: 0.055, dashArray: "8 8", lineCap: "round" }}
      />
      <Marker key={`${lat}:${lng}`} ref={markerRef} position={[lat, lng]} icon={locationMarker}>
        <Popup>
          <strong>{locationName}</strong><br/>
          Latitude: {lat.toFixed(5)}<br/>
          Longitude: {lng.toFixed(5)}
        </Popup>
      </Marker>
    </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-control border border-white/10 bg-[#111827]/85 px-3 py-2 font-mono text-[10px] text-slate-200 shadow-elevation-2 backdrop-blur-md" aria-live="polite" aria-label="Cursor coordinates">
        {coordinates ? `${coordinates.lat.toFixed(5)}°, ${coordinates.lng.toFixed(5)}°` : `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`}
      </div>
    </div>
  );
}
