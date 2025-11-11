import { useEffect, useRef, useState } from 'react';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, MapPin } from 'lucide-react';

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const VolunteerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const DonorIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RouteMapProps {
  donorLat: number;
  donorLng: number;
  volunteerLat?: number;
  volunteerLng?: number;
  donorAddress: string;
  volunteerName?: string;
}


export default function RouteMap({
  donorLat,
  donorLng,
  volunteerLat,
  volunteerLng,
  donorAddress,
  volunteerName
}: RouteMapProps) {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');

  useEffect(() => {
    if (volunteerLat && volunteerLng) {
      fetchRoute();
    }
  }, [donorLat, donorLng, volunteerLat, volunteerLng]);

  const fetchRoute = async () => {
    if (!volunteerLat || !volunteerLng) return;

    try {
      // Using OpenRouteService for routing (free alternative to Google Maps)
      // You can also use OSRM: http://router.project-osrm.org/route/v1/driving/
      const url = `https://router.project-osrm.org/route/v1/driving/${volunteerLng},${volunteerLat};${donorLng},${donorLat}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map((coord: number[]) => [
          coord[1],
          coord[0]
        ]);
        setRoute(coords);

        // Calculate distance and duration
        const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
        const durationMin = Math.round(data.routes[0].duration / 60);
        setDistance(`${distanceKm} km`);
        setDuration(`${durationMin} min`);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // Leaflet map refs and layers
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const donorMarkerRef = useRef<L.Marker | null>(null);
  const volunteerMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const center: [number, number] = volunteerLat && volunteerLng
    ? [(donorLat + volunteerLat) / 2, (donorLng + volunteerLng) / 2]
    : [donorLat, donorLng];
  const zoom = volunteerLat && volunteerLng ? 12 : 14;

  // Initialize map and update view
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(center, zoom);
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      mapRef.current = map;
    } else {
      mapRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Update markers and route polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    donorMarkerRef.current?.remove();
    volunteerMarkerRef.current?.remove();
    routeLayerRef.current?.remove();

    donorMarkerRef.current = L.marker([donorLat, donorLng], { icon: DonorIcon })
      .bindPopup(`<div><strong>Pickup Location</strong><br/><span style="font-size:12px;opacity:0.8;">${donorAddress}</span></div>`)
      .addTo(map);

    if (volunteerLat && volunteerLng) {
      volunteerMarkerRef.current = L.marker([volunteerLat, volunteerLng], { icon: VolunteerIcon })
        .bindPopup(`<div><strong>${volunteerName || 'Volunteer'}</strong><br/><span style="font-size:12px;opacity:0.8;">Current Location</span></div>`)
        .addTo(map);
    }

    if (route.length > 0) {
      routeLayerRef.current = L.polyline(route, { color: '#0ea5e9', weight: 4, opacity: 0.7 }).addTo(map);
    }
  }, [donorLat, donorLng, volunteerLat, volunteerLng, donorAddress, volunteerName, route]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      donorMarkerRef.current = null;
      volunteerMarkerRef.current = null;
      routeLayerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Pickup Location & Route
        </CardTitle>
      </CardHeader>
      <CardContent>
        {volunteerLat && volunteerLng && (
          <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Route to Pickup</span>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              {distance && <span>{distance}</span>}
              {duration && <span>~{duration}</span>}
            </div>
          </div>
        )}
        
        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-border">
          <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        </div>

        {!volunteerLat && !volunteerLng && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Route will be displayed once a volunteer is assigned
          </p>
        )}
      </CardContent>
    </Card>
  );
}