import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import type { MapIssue } from '@/types';
import { priorityColor } from '@/utils/formatters';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badges';
import { prefersReducedMotion } from '@/utils/motion';

interface MapComponentProps {
  issues: MapIssue[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (issue: MapIssue) => void;
  selectedId?: string | null;
  height?: string;
  userLocation?: [number, number];
}

function ScrollController({ enabled }: { enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (enabled) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [enabled, map]);
  return null;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

function SelectedPulse({ center, color }: { center: [number, number]; color: string }) {
  const [radius, setRadius] = useState(14);
  const [opacity, setOpacity] = useState(0.5);

  useEffect(() => {
    if (prefersReducedMotion) return;
    let raf = 0;
    let start = performance.now();
    const duration = 1500;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = (elapsed % duration) / duration;
      setRadius(14 + progress * 18);
      setOpacity(0.5 * (1 - progress));
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <CircleMarker
      center={center}
      radius={radius}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0,
        weight: 2,
        opacity,
      }}
    />
  );
}

export function MapComponent({
  issues,
  center = [33.6844, 73.0479],
  zoom = 12,
  onMarkerClick,
  selectedId,
  height = '100%',
  userLocation,
}: MapComponentProps) {
  const [hovered, setHovered] = useState(false);
  const sortedIssues = useMemo(
    () =>
      [...issues].sort((a, b) => {
        // Draw selected marker last so it sits on top
        if (a.id === selectedId) return 1;
        if (b.id === selectedId) return -1;
        return 0;
      }),
    [issues, selectedId]
  );

  return (
    <div
      style={{ height, width: '100%' }}
      className="relative rounded-xl overflow-hidden border border-slate-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
      >
        <ScrollController enabled={hovered} />
        <ChangeView center={center} zoom={zoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {userLocation && (
          <>
            <SelectedPulse center={userLocation} color="#3b82f6" />
            <CircleMarker
              center={userLocation}
              radius={8}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs font-medium text-navy-900">Your location</div>
              </Popup>
            </CircleMarker>
          </>
        )}
        {sortedIssues.map((issue) => {
          const color = priorityColor(issue.priority);
          const isSelected = selectedId === issue.id;
          return (
            <div key={issue.id}>
              {isSelected && <SelectedPulse center={[issue.latitude, issue.longitude]} color={color} />}
              <CircleMarker
                center={[issue.latitude, issue.longitude]}
                radius={isSelected ? 13 : 8}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.85 : 0.7,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onMarkerClick?.(issue),
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-navy-900 text-sm">{issue.ticketId}</span>
                      <StatusBadge status={issue.status} size="sm" />
                    </div>
                    <p className="text-sm font-medium text-navy-700 mb-1">{issue.category}</p>
                    <p className="text-xs text-slate-500 mb-2">{issue.location}</p>
                    <div className="mb-3">
                      <PriorityBadge priority={issue.priority} size="sm" />
                    </div>
                    {onMarkerClick && (
                      <button
                        onClick={() => onMarkerClick(issue)}
                        className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        View Details →
                      </button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}
      </MapContainer>

      {/* Scroll hint */}
      <AnimatePresence>
        {!hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] pointer-events-none"
          >
            <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg text-xs font-medium text-slate-600">
              Hover map to zoom with scroll
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
