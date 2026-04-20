'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Accommodation } from '@/types';
import { MapWrapper } from '../components/MapWrapper';
import { Sidebar } from '../components/Sidebar';
import { Search, Filter, MapPin, List } from 'lucide-react';

export default function MapPage() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'accommodations'), (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate() || null,
          nextAvailableDate: d.nextAvailableDate?.toDate() || null,
          discountValidUntil: d.discountValidUntil?.toDate() || null,
        } as Accommodation;
      });
      setAccommodations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredAccommodations = accommodations.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Map View</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredAccommodations.length} properties on map
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => setShowList(!showList)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  showList
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <List className="w-5 h-5" />
                {showList ? 'Hide List' : 'Show List'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map */}
          <div className={`flex-1 p-4 ${showList ? 'w-2/3' : 'w-full'}`}>
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <MapWrapper
                accommodations={filteredAccommodations}
                selectedId={selectedId}
                onMarkerClick={setSelectedId}
                height="100%"
              />
            )}
          </div>

          {/* Side List */}
          {showList && (
            <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
              <div className="p-4 space-y-3">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Properties ({filteredAccommodations.length})
                </h2>
                {filteredAccommodations.map((accommodation) => (
                  <div
                    key={accommodation.id}
                    onClick={() => setSelectedId(accommodation.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedId === accommodation.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {accommodation.imageUrls[0] && (
                      <img
                        src={accommodation.imageUrls[0]}
                        alt={accommodation.title}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {accommodation.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {accommodation.location}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-indigo-600">
                        R{accommodation.price}/night
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        accommodation.isFullyBooked
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {accommodation.isFullyBooked ? 'Full' : 'Available'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
