'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Accommodation } from '@/types';
import { Sidebar } from '../components/Sidebar';
import { 
  Tag, 
  MagnifyingGlass, 
  Percent,
  Star,
  TrendUp,
  CalendarBlank,
  ArrowUpRight,
  X,
  PencilSimple,
  CheckCircle
} from '@phosphor-icons/react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function PromotionsPage() {
  const [properties, setProperties] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Accommodation | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'accommodations'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || null,
        nextAvailableDate: doc.data().nextAvailableDate?.toDate() || null,
        discountValidUntil: doc.data().discountValidUntil?.toDate() || null,
      })) as Accommodation[];
      setProperties(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updatePromotion = async (propertyId: string, updates: Partial<Accommodation>) => {
    try {
      await updateDoc(doc(db, 'accommodations', propertyId), updates);
      setSelectedProperty(null);
    } catch (error) {
      alert('Failed to update: ' + error);
    }
  };

  const hasActiveDiscount = (property: Accommodation) => {
    if (!property.discountPercentage || property.discountPercentage <= 0) return false;
    if (property.discountValidUntil && new Date() > property.discountValidUntil) return false;
    return true;
  };

  const calculateDiscountedPrice = (property: Accommodation) => {
    if (!hasActiveDiscount(property)) return property.price;
    return Math.round(property.price * (100 - property.discountPercentage!) / 100);
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const promotedProperties = filteredProperties.filter(p => p.isPromoted);
  const discountedProperties = filteredProperties.filter(p => hasActiveDiscount(p));
  const regularProperties = filteredProperties.filter(p => !p.isPromoted && !hasActiveDiscount(p));

  const stats = {
    promoted: promotedProperties.length,
    withDiscount: discountedProperties.length,
    totalSavings: discountedProperties.reduce((sum, p) => {
      const savings = (p.price - calculateDiscountedPrice(p)) * (p.bookedDates?.length || 0);
      return sum + savings;
    }, 0),
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promotions</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.promoted} promoted • {stats.withDiscount} with discounts
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                <span className="text-sm font-medium">Promoted</span>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.promoted}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                <span className="text-sm font-medium">With Discount</span>
              </div>
              <p className="text-3xl font-bold mt-2">{stats.withDiscount}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2">
                <TrendUp className="w-5 h-5" />
                <span className="text-sm font-medium">Est. Savings</span>
              </div>
              <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalSavings)}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md mt-4">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg"
            />
          </div>
        </div>

        {/* Properties Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Promoted Section */}
              {promotedProperties.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Promoted Properties
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {promotedProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        hasActiveDiscount={hasActiveDiscount(property)}
                        calculateDiscountedPrice={calculateDiscountedPrice}
                        onEdit={() => setSelectedProperty(property)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* With Discount Section */}
              {discountedProperties.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Percent className="w-5 h-5 text-green-500" />
                    Active Discounts
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {discountedProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        hasActiveDiscount={hasActiveDiscount(property)}
                        calculateDiscountedPrice={calculateDiscountedPrice}
                        onEdit={() => setSelectedProperty(property)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Properties */}
              {regularProperties.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-gray-400" />
                    Other Properties
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regularProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        hasActiveDiscount={hasActiveDiscount(property)}
                        calculateDiscountedPrice={calculateDiscountedPrice}
                        onEdit={() => setSelectedProperty(property)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Promotion</h2>
              <button onClick={() => setSelectedProperty(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Promoted Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Promote Property</span>
                </div>
                <button
                  onClick={() => updatePromotion(selectedProperty.id, { isPromoted: !selectedProperty.isPromoted })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    selectedProperty.isPromoted ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    selectedProperty.isPromoted ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Discount Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selectedProperty.discountPercentage || ''}
                  onChange={(e) => updatePromotion(selectedProperty.id, {
                    discountPercentage: e.target.value ? Number(e.target.value) : null
                  })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                />

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={selectedProperty.discountValidUntil ? new Date(selectedProperty.discountValidUntil).toISOString().split('T')[0] : ''}
                  onChange={(e) => updatePromotion(selectedProperty.id, {
                    discountValidUntil: e.target.value ? new Date(e.target.value) : null
                  })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                />

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Discount Code
                </label>
                <input
                  type="text"
                  value={selectedProperty.discountCode || ''}
                  onChange={(e) => updatePromotion(selectedProperty.id, { discountCode: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  placeholder="e.g., SUMMER2024"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Link
                  href={`/properties/${selectedProperty.id}/edit`}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-center font-medium hover:bg-gray-200"
                >
                  Full Edit
                </Link>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyCard({
  property,
  hasActiveDiscount,
  calculateDiscountedPrice,
  onEdit
}: {
  property: Accommodation;
  hasActiveDiscount: boolean;
  calculateDiscountedPrice: (p: Accommodation) => number;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={property.imageUrls?.[0] || 'https://via.placeholder.com/400x250'}
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        {property.isPromoted && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-white text-sm font-bold rounded-full flex items-center gap-1">
            <Star className="w-4 h-4" />
            PROMOTED
          </div>
        )}
        {hasActiveDiscount && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
            {property.discountPercentage}% OFF
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{property.title}</h3>
        <p className="text-sm text-gray-500 truncate">{property.location}</p>
        
        <div className="mt-3 flex items-end justify-between">
          <div>
            {hasActiveDiscount ? (
              <div>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(calculateDiscountedPrice(property))}</span>
                <span className="text-sm text-gray-400 line-through ml-2">{formatCurrency(property.price)}</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(property.price)}</span>
            )}
            <span className="text-sm text-gray-500">/night</span>
          </div>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <PencilSimple className="w-4 h-4" />
          </button>
        </div>

        {hasActiveDiscount && property.discountValidUntil && (
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <CalendarBlank className="w-3 h-3" />
            Valid until {formatDate(property.discountValidUntil)}
          </p>
        )}
      </div>
    </div>
  );
}
