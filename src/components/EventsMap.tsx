import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Event } from '../types';
import { formatEventLocation, getEventCoordinates } from '../utils';
import 'leaflet/dist/leaflet.css';
import './EventsMap.css';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icon for selected event
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface EventsMapProps {
  events: Event[];
  selectedEventId?: number | string;
  onSelectEvent?: (id: number | string) => void;
}

interface EventWithCoords {
  event: Event;
  latitude: number;
  longitude: number;
}

// Component to handle map bounds fitting
function MapBoundsHandler({ eventsWithCoords }: { eventsWithCoords: EventWithCoords[] }) {
  const map = useMap();

  useEffect(() => {
    if (eventsWithCoords.length === 0) return;

    if (eventsWithCoords.length === 1) {
      const { latitude, longitude } = eventsWithCoords[0];
      map.setView([latitude, longitude], 16);
    } else {
      const bounds = L.latLngBounds(
        eventsWithCoords.map(({ latitude, longitude }) => [latitude, longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [eventsWithCoords, map]);

  return null;
}

// Component to center on selected event
function SelectedEventHandler({
  selectedEventId,
  eventsWithCoords,
}: {
  selectedEventId?: number | string;
  eventsWithCoords: EventWithCoords[];
}) {
  const map = useMap();
  const prevSelectedId = useRef<number | string | undefined>(undefined);

  useEffect(() => {
    if (selectedEventId && selectedEventId !== prevSelectedId.current) {
      const selected = eventsWithCoords.find((e) => e.event.id === selectedEventId);
      if (selected) {
        map.setView([selected.latitude, selected.longitude], map.getZoom(), {
          animate: true,
        });
      }
      prevSelectedId.current = selectedEventId;
    }
  }, [selectedEventId, eventsWithCoords, map]);

  return null;
}

export default function EventsMap({ events, selectedEventId, onSelectEvent }: EventsMapProps) {
  // Filter events to only those with coordinates
  const eventsWithCoords = useMemo(() => {
    const withCoords: EventWithCoords[] = [];
    for (const event of events) {
      const coords = getEventCoordinates(event);
      if (coords) {
        withCoords.push({
          event,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      }
    }
    return withCoords;
  }, [events]);

  // Default center (Boston area if no events with coords)
  const defaultCenter: [number, number] = [42.3601, -71.0589];

  if (eventsWithCoords.length === 0) {
    return (
      <div className="events-map-empty">
        <i className="bi bi-geo-alt"></i>
        <p>No events with location data to display on map</p>
      </div>
    );
  }

  const initialCenter: [number, number] =
    eventsWithCoords.length > 0
      ? [eventsWithCoords[0].latitude, eventsWithCoords[0].longitude]
      : defaultCenter;

  return (
    <div className="events-map-container">
      <MapContainer
        center={initialCenter}
        zoom={16}
        className="events-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsHandler eventsWithCoords={eventsWithCoords} />
        <SelectedEventHandler
          selectedEventId={selectedEventId}
          eventsWithCoords={eventsWithCoords}
        />
        {eventsWithCoords.map(({ event, latitude, longitude }) => {
          const isSelected = event.id === selectedEventId;
          return (
            <Marker
              key={event.id}
              position={[latitude, longitude]}
              icon={isSelected ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => {
                  onSelectEvent?.(event.id);
                },
              }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{event.title}</strong>
                  <div className="map-popup-location">{formatEventLocation(event)}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
