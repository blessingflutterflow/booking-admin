'use client';

import dynamic from 'next/dynamic';
import { Accommodation } from '@/types';

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('./Map').then(mod => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  ),
});

interface MapWrapperProps {
  accommodations: Accommodation[];
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
  height?: string;
}

export function MapWrapper(props: MapWrapperProps) {
  return <Map {...props} />;
}
