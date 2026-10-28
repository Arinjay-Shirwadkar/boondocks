import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Neo-Brutalist Map Pin
const brutalistIcon = L.divIcon({
  className: 'boondocks-map-pin',
  html: `
    <div style="
      background: #DC143C;
      border: 3px solid #FFFDD0;
      width: 26px;
      height: 26px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 3px 3px 0 #000000;
    "></div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26],
});

// Component to handle map clicks and reverse geocode
function LocationClickHandler({ onLocationSelect }) {
  useMapEvents({
    async click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      let address = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            // Pick a clean readable short address if possible
            const parts = data.display_name.split(', ');
            address = parts.slice(0, 3).join(', ');
          }
        }
      } catch (err) {
        console.warn('Reverse geocoding fetch failed, using coordinates:', err.message);
      }

      onLocationSelect([lng, lat], address);
    },
  });
  return null;
}

// Controller to fly map to new center
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({
  coordinates, // [lng, lat]
  address = '',
  radiusKm = 5,
  onChange,
  onRadiusChange,
  showRadius = true,
  height = '320px',
}) {
  // Default to Mumbai if no coordinates
  const defaultLng = 72.8777;
  const defaultLat = 19.0760;

  const validCoords =
    Array.isArray(coordinates) && coordinates.length === 2 && !isNaN(coordinates[0]) && !isNaN(coordinates[1]);

  const currentLng = validCoords ? coordinates[0] : defaultLng;
  const currentLat = validCoords ? coordinates[1] : defaultLat;
  const mapCenter = [currentLat, currentLng];

  const [geoLoading, setGeoLoading] = useState(false);

  const handleSelect = (newCoords, newAddr) => {
    if (onChange) {
      onChange({
        coordinates: newCoords, // [lng, lat]
        address: newAddr,
        radiusKm,
      });
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let addr = `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              addr = data.display_name.split(', ').slice(0, 3).join(', ');
            }
          }
        } catch {
          // fallback
        }
        handleSelect([lng, lat], addr);
        setGeoLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        alert('Could not detect your location. Click on the map to drop a pin.');
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-black uppercase text-[#FFFDD0]">
          Click map to drop pin &amp; select area:
        </label>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="btn-ghost text-xs py-1 px-3"
        >
          {geoLoading ? 'Detecting...' : '📍 Use My Location'}
        </button>
      </div>

      {/* Selected Address Display */}
      <div className="border-2 border-[#DC143C] bg-black p-2.5 text-xs text-[#FFFDD0] flex items-center justify-between gap-2">
        <span className="truncate">
          <strong className="text-[#DC143C] uppercase mr-1">Pin:</strong>
          {address || `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`}
        </span>
        <span className="chip text-[10px] py-0.5 px-2 shrink-0">
          {validCoords ? 'Pinned' : 'Click Map'}
        </span>
      </div>

      {/* Interactive Map */}
      <div
        className="w-full border-4 border-[#DC143C] shadow-[6px_6px_0_#8B0000] relative overflow-hidden z-10"
        style={{ height }}
      >
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', background: '#000000' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={mapCenter} />
          <LocationClickHandler onLocationSelect={handleSelect} />

          {/* Marker pin */}
          <Marker position={[currentLat, currentLng]} icon={brutalistIcon} />

          {/* Dynamic Search Radius Circle in Crimson */}
          {showRadius && radiusKm > 0 && (
            <Circle
              center={[currentLat, currentLng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#DC143C',
                fillColor: '#DC143C',
                fillOpacity: 0.22,
                weight: 3,
                dashArray: '6, 6',
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Radius Slider */}
      {showRadius && (
        <div className="border-4 border-[#DC143C] bg-black p-3">
          <div className="flex justify-between items-center text-sm font-black uppercase text-[#FFFDD0]">
            <span>Search Radius Circle</span>
            <span className="text-[#DC143C] text-base font-bold">{radiusKm} km</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={radiusKm}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (onRadiusChange) onRadiusChange(val);
              if (onChange) {
                onChange({
                  coordinates: [currentLng, currentLat],
                  address,
                  radiusKm: val,
                });
              }
            }}
            className="w-full mt-2 accent-crimson cursor-pointer"
          />
          <p className="text-[11px] font-bold text-[#FFFDD0]/60 mt-1">
            Properties within this crimson perimeter will be considered for proximity matching.
          </p>
        </div>
      )}
    </div>
  );
}

