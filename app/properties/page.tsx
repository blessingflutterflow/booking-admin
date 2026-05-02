'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Accommodation } from '@/types';
import { Sidebar } from '../components/Sidebar';
import { MapWrapper } from '../components/MapWrapper';
import { 
  MagnifyingGlass, 
  Plus, 
  PencilSimple, 
  Trash, 
  MapPin, 
  Star,
  SquaresFour,
  List,
  Eye,
  Buildings
} from '@phosphor-icons/react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

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
      setProperties(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'accommodations', id));
      } catch (error) {
        alert('Failed to delete property: ' + error);
      }
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(properties.map(p => p.category))];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredProperties.length} of {properties.length} properties
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMap(!showMap)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  showMap 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <MapPin className="w-4 h-4" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
              <Link
                href="/properties/new"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Add Property
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
              >
                <SquaresFour className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="h-96 border-b border-gray-200 dark:border-gray-700">
            <MapWrapper
              accommodations={filteredProperties}
              selectedId={selectedId}
              onMarkerClick={setSelectedId}
              height="100%"
            />
          </div>
        )}

        {/* Properties Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Buildings className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No properties found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  onDelete={handleDelete}
                  isSelected={selectedId === property.id}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProperties.map((property) => (
                <PropertyRow 
                  key={property.id} 
                  property={property} 
                  onDelete={handleDelete}
                  isSelected={selectedId === property.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions for Accommodation
function calculateDiscountedPrice(property: Accommodation): number {
  if (!property.discountPercentage || property.discountPercentage <= 0) return property.price;
  if (property.discountValidUntil && new Date() > property.discountValidUntil) return property.price;
  return Math.round(property.price * (100 - property.discountPercentage) / 100);
}

function hasActiveDiscount(property: Accommodation): boolean {
  if (!property.discountPercentage || property.discountPercentage <= 0) return false;
  if (property.discountValidUntil && new Date() > property.discountValidUntil) return false;
  return true;
}

function PropertyCard({ 
  property, 
  onDelete, 
  isSelected 
}: { 
  property: Accommodation; 
  onDelete: (id: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border transition-all ${
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="relative h-48">
        <img
          src={property.imageUrls[0] || 'https://via.placeholder.com/400x300'}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          {property.isPromoted && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1">
              <Star className="w-3 h-3" />
              PROMO
            </span>
          )}
          {hasActiveDiscount(property) && (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-lg">
              {property.discountPercentage}% OFF
            </span>
          )}
        </div>
        <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-lg text-xs font-bold ${
          property.isFullyBooked
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white'
        }`}>
          {property.isFullyBooked ? 'Fully Booked' : 'Available'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{property.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3" />
          {property.location}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div>
            {hasActiveDiscount(property) ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-indigo-600">
                  {formatCurrency(calculateDiscountedPrice(property))}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {formatCurrency(property.price)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-indigo-600">
                {formatCurrency(property.price)}
              </span>
            )}
            <span className="text-xs text-gray-500">/night</span>
          </div>
          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {property.category}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Link
            href={`/properties/${property.id}`}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg hover:bg-indigo-100"
          >
            <Eye className="w-4 h-4" />
            View
          </Link>
          <Link
            href={`/properties/${property.id}/edit`}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
          >
            <PencilSimple className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => onDelete(property.id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyRow({ 
  property, 
  onDelete, 
  isSelected 
}: { 
  property: Accommodation; 
  onDelete: (id: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div 
      className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border transition-all ${
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <img
        src={property.imageUrls[0] || 'https://via.placeholder.com/100'}
        alt={property.title}
        className="w-24 h-24 rounded-lg object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{property.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {property.location}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {property.isPromoted && (
              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg">
                PROMOTED
              </span>
            )}
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
              property.isFullyBooked
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {property.isFullyBooked ? 'Fully Booked' : 'Available'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{property.category}</span>
            <span>•</span>
            <span>{property.guests} guests</span>
            <span>•</span>
            <span>{property.bedrooms} bedrooms</span>
            <span>•</span>
            <span>{property.totalRooms} rooms</span>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveDiscount(property) ? (
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-600">
                  {formatCurrency(calculateDiscountedPrice(property))}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {formatCurrency(property.price)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-indigo-600">
                {formatCurrency(property.price)}
              </span>
            )}
            <span className="text-xs text-gray-500">/night</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/properties/${property.id}`}
          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <Eye className="w-4 h-4" />
        </Link>
        <Link
          href={`/properties/${property.id}/edit`}
          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <PencilSimple className="w-4 h-4" />
        </Link>
        <button
          onClick={() => onDelete(property.id)}
          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
