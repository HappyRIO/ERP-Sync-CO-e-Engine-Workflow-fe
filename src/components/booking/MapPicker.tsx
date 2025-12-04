import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in React/Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapPickerProps {
  position: { lat: number; lng: number } | null;
  onPositionChange: (position: { lat: number; lng: number } | null) => void;
  onAddressChange?: (address: string) => void;
  height?: string;
}

// Component to handle map clicks
function MapClickHandler({
  onPositionChange,
}: {
  onPositionChange: (position: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click: (e) => {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function MapPicker({
  position,
  onPositionChange,
  onAddressChange,
  height = "400px",
}: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const defaultCenter: [number, number] = [51.5074, -0.1278]; // London default

  // Geocoding function (using Nominatim OpenStreetMap API)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        const newPosition = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
        onPositionChange(newPosition);
        if (onAddressChange) {
          onAddressChange(result.display_name);
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const currentCenter: [number, number] = position
    ? [position.lat, position.lng]
    : defaultCenter;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search for an address or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          className="flex-1"
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          type="button"
        >
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div style={{ height, width: "100%" }}>
            <MapContainer
              center={currentCenter}
              zoom={position ? 15 : 10}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onPositionChange={onPositionChange} />
              {position && (
                <Marker position={[position.lat, position.lng]} />
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Position Info */}
      {position && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </span>
        </div>
      )}

      {!position && (
        <p className="text-sm text-muted-foreground text-center">
          Click on the map or search for an address to select a location
        </p>
      )}
    </div>
  );
}

