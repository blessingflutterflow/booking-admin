'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Accommodation } from '@/types';
import { Sidebar } from '../../components/Sidebar';
import { MapWrapper } from '../../components/MapWrapper';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  MapPin, 
  Star,
  Users,
  Bed,
  Bath,
  Home,
  DollarSign,
  Check,
  Tag,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Waves,
  Wind,
  Snowflake
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

const amenityIcons: Record<string, React.ComponentType<any>> = {
  'wifi': Wifi,
  'parking': Car,
  'kitchen': Utensils,
  'pool': Waves,
  'ac': Snowflake,
  'fan': Wind,
  'breakfast': Coffee,
};

function hasActiveDiscount(property: Accommodation): boolean {
  if (!property.discountPercentage || property.discountPercentage <= 0) return false;
  if (property.discountValidUntil && new Date() > property.discountValidUntil) return false;
  return true;
}

function calculateDiscountedPrice(property: Accommodation): number {
  if (!property.discountPercentage || property.discountPercentage <= 0) return property.price;
  if (property.discountValidUntil && new Date() > property.discountValidUntil) return property.price;
  return Math.round(property.price * (100 - property.discountPercentage) / 100);
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperty = async () => {
      if (!id) return;
      const docSnap = await getDoc(doc(db, 'accommodations', id as string));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProperty({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || null,
          nextAvailableDate: data.nextAvailableDate?.toDate() || null,
          discountValidUntil: data.discountValidUntil?.toDate() || null,
        } as Accommodation);
      }
      setLoading(false);
    };

    loadProperty();
  }, [id]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this property?')) {
      await deleteDoc(doc(db, 'accommodations', id as string));
      router.push('/properties');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Property not found</h2>
            <Link href="/properties" className="text-indigo-600 hover:underline mt-2 inline-block">
              Back to properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/properties"
                className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{property.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {property.location}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/properties/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="aspect-video rounded-xl overflow-hidden">
              <img
                src={property.imageUrls[0] || 'https://via.placeholder.com/800x400'}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {property.imageUrls.slice(1, 5).map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <img src={url} alt={`${property.title} ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {property.isPromoted && (
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Promoted
                  </span>
                )}
                {hasActiveDiscount(property) && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {property.discountPercentage}% OFF
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  property.isFullyBooked
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                }`}>
                  {property.isFullyBooked ? 'Fully Booked' : 'Available'}
                </span>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h2>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity.toLowerCase()] || Check;
                    return (
                      <span
                        key={amenity}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm flex items-center gap-1"
                      >
                        <Icon className="w-4 h-4" />
                        {amenity}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Map */}
              {typeof property.latitude === 'number' && typeof property.longitude === 'number' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Location</h2>
                  <div className="h-64 rounded-lg overflow-hidden">
                    <MapWrapper
                      accommodations={[property]}
                      height="100%"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Pricing */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Regular Price</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(property.price)}/night
                    </span>
                  </div>
                  {hasActiveDiscount(property) && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        Discounted Price ({property.discountPercentage}% OFF)
                      </span>
                      <span className="font-bold">
                        {formatCurrency(calculateDiscountedPrice(property))}/night
                      </span>
                    </div>
                  )}
                  {property.hourlyRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Hourly Rate</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(property.hourlyRate)}/hour
                      </span>
                    </div>
                  )}
                </div>
                {property.discountValidUntil && (
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Discount valid until {formatDate(property.discountValidUntil)}
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Details</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{property.guests} guests</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bed className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{property.bedrooms} bedrooms, {property.beds} beds</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bath className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{property.bathrooms} bathrooms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{property.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Pay on site: {property.acceptPayOnSite ? 'Accepted' : 'Not accepted'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Stats</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Total Rooms</span>
                    <span className="font-medium">{property.totalRooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Accepts Reservations</span>
                    <span className="font-medium">{property.acceptsReservations ? 'Yes' : 'No'}</span>
                  </div>
                  {property.nextAvailableDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Next Available</span>
                      <span className="font-medium">{formatDate(property.nextAvailableDate)}</span>
                    </div>
                  )}
                  {property.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Listed</span>
                      <span className="font-medium">{formatDate(property.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
