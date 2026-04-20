'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import Link from 'next/link';
import { Accommodation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Building2, MapPin, Eye, Edit } from 'lucide-react';

// Fix default marker icon issue with webpack
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapProps {
  accommodations: Accommodation[];
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
  height?: string;
}

function MapController({ selectedId, accommodations }: { selectedId?: string | null; accommodations: Accommodation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedId) {
      const accommodation = accommodations.find(a => a.id === selectedId);
      if (accommodation) {
        map.setView([accommodation.latitude, accommodation.longitude], 16, {
          animate: true,
          duration: 0.5,
        });
      }
    }
  }, [selectedId, accommodations, map]);
  
  return null;
}

export function Map({ accommodations, selectedId, onMarkerClick, height = "600px" }: MapProps) {
  // Filter out accommodations with invalid coordinates
  const validAccommodations = accommodations.filter(
    a => typeof a.latitude === 'number' && typeof a.longitude === 'number' && 
         !isNaN(a.latitude) && !isNaN(a.longitude)
  );

  // Calculate center from accommodations or default to South Africa
  const center = validAccommodations.length > 0
    ? [
        validAccommodations.reduce((sum, a) => sum + a.latitude, 0) / validAccommodations.length,
        validAccommodations.reduce((sum, a) => sum + a.longitude, 0) / validAccommodations.length,
      ]
    : [-26.2041, 28.0473]; // Johannesburg default

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={10}
      scrollWheelZoom={true}
      style={{ height, width: '100%', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController selectedId={selectedId} accommodations={validAccommodations} />
      {validAccommodations.map((accommodation) => (
        <Marker
          key={accommodation.id}
          position={[accommodation.latitude, accommodation.longitude]}
          icon={selectedId === accommodation.id ? selectedIcon : defaultIcon}
          eventHandlers={{
            click: () => onMarkerClick?.(accommodation.id),
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              {accommodation.imageUrls[0] && (
                <img
                  src={accommodation.imageUrls[0]}
                  alt={accommodation.title}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
              )}
              <h3 className="font-bold text-gray-900">{accommodation.title}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {accommodation.location}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold text-indigo-600">
                  {formatCurrency(accommodation.price)}
                </span>
                <span className="text-xs text-gray-500">/night</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                <Building2 className="w-3 h-3" />
                {accommodation.category}
                <span className={`ml-auto px-2 py-0.5 rounded-full ${
                  accommodation.isFullyBooked
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {accommodation.isFullyBooked ? 'Fully Booked' : 'Available'}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Link
                  href={`/properties/${accommodation.id}`}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                >
                  <Eye className="w-3 h-3" />
                  View
                </Link>
                <Link
                  href={`/properties/${accommodation.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
