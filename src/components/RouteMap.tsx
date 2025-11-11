import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayerGroup } from 'react-leaflet';
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

  const center: [number, number] = volunteerLat && volunteerLng
    ? [(donorLat + volunteerLat) / 2, (donorLng + volunteerLng) / 2]
    : [donorLat, donorLng];

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
          <MapContainer
            center={center}
            zoom={volunteerLat && volunteerLng ? 12 : 14}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <LayerGroup>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              <Marker position={[donorLat, donorLng]} icon={DonorIcon}>
                <Popup>
                  <div className="p-2">
                    <p className="font-semibold">Pickup Location</p>
                    <p className="text-sm text-muted-foreground">{donorAddress}</p>
                  </div>
                </Popup>
              </Marker>

              {volunteerLat && volunteerLng ? (
                <Marker position={[volunteerLat, volunteerLng]} icon={VolunteerIcon}>
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold">{volunteerName || 'Volunteer'}</p>
                      <p className="text-sm text-muted-foreground">Current Location</p>
                    </div>
                  </Popup>
                </Marker>
              ) : null}

              {route.length > 0 ? (
                <Polyline
                  positions={route}
                  color="#0ea5e9"
                  weight={4}
                  opacity={0.7}
                />
              ) : null}
            </LayerGroup>
          </MapContainer>
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