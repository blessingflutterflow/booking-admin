'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sidebar } from '../../components/Sidebar';
import { 
  ArrowLeft, 
  Save, 
  Plus,
  X,
  MapPin,
  DollarSign,
  Users,
  Home,
  Clock,
  Tag,
  Star
} from 'lucide-react';
import Link from 'next/link';

const categories = ['Guesthouse', 'Apartment', 'House', 'Villa', 'Hotel', 'B&B', 'Hostel', 'Cottage'];
const commonAmenities = ['WiFi', 'Parking', 'Kitchen', 'Pool', 'AC', 'Fan', 'Breakfast', 'TV', 'Washer', 'Dryer', 'Gym', 'Spa'];

export default function NewPropertyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'Guesthouse',
    price: 0,
    hourlyRate: null as number | null,
    supportsHourly: false,
    guests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    totalRooms: 1,
    amenities: [] as string[],
    imageUrls: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
    acceptPayOnSite: false,
    payOnSiteTimeLimitHours: 2,
    discountPercentage: null as number | null,
    discountValidUntil: null as Date | null,
    discountCode: '',
    isPromoted: false,
    acceptsReservations: true,
    hostId: 'admin',
    createdAt: new Date(),
    isFullyBooked: false,
    bookedDates: [],
  });
  const [newAmenity, setNewAmenity] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleSave = async () => {
    if (!formData.title || !formData.location) {
      alert('Please fill in at least title and location');
      return;
    }

    setSaving(true);
    try {
      const propertyData = {
        ...formData,
        price: Number(formData.price),
        guests: Number(formData.guests),
        bedrooms: Number(formData.bedrooms),
        beds: Number(formData.beds),
        bathrooms: Number(formData.bathrooms),
        totalRooms: Number(formData.totalRooms),
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'accommodations'), propertyData);
      router.push(`/properties/${docRef.id}`);
    } catch (error) {
      alert('Failed to create: ' + error);
      setSaving(false);
    }
  };

  const addAmenity = () => {
    if (newAmenity && !formData.amenities.includes(newAmenity)) {
      setFormData(prev => ({ ...prev, amenities: [...prev.amenities, newAmenity] }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity) }));
  };

  const addImage = () => {
    if (newImageUrl && !formData.imageUrls.includes(newImageUrl)) {
      setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, newImageUrl] }));
      setNewImageUrl('');
    }
  };

  const removeImage = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter(u => u !== url) }));
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/properties" className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Property</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create a new accommodation listing</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-indigo-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Luxury Guesthouse in Sandton"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe the property..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Sandton, Johannesburg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Pricing & Payment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price per Night (R) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.acceptPayOnSite}
                    onChange={(e) => setFormData({ ...formData, acceptPayOnSite: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Accept pay on site</span>
                </label>
              </div>
              {formData.acceptPayOnSite && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arrival Time Limit (hours)</label>
                  <input
                    type="number"
                    value={formData.payOnSiteTimeLimitHours}
                    onChange={(e) => setFormData({ ...formData, payOnSiteTimeLimitHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Capacity
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guests</label>
                <input type="number" value={formData.guests} onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bedrooms</label>
                <input type="number" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beds</label>
                <input type="number" value={formData.beds} onChange={(e) => setFormData({ ...formData, beds: Number(e.target.value) })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bathrooms</label>
                <input type="number" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Rooms</label>
                <input type="number" value={formData.totalRooms} onChange={(e) => setFormData({ ...formData, totalRooms: Number(e.target.value) })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg" />
              </div>
            </div>
          </div>

          {/* Discount & Promo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" />
              Discount & Promotion
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
                <input type="number" value={formData.discountPercentage || ''} onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valid Until</label>
                <input type="date" value={formData.discountValidUntil ? new Date(formData.discountValidUntil).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, discountValidUntil: e.target.value ? new Date(e.target.value) : null })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="isPromoted" checked={formData.isPromoted} onChange={(e) => setFormData({ ...formData, isPromoted: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="isPromoted" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" /> Promote this property
                </label>
              </div>
            </div>
          </div>

          {/* Coordinates */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              Map Coordinates (Optional)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                <input type="number" step="any" value={formData.latitude || ''} onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg" placeholder="-26.2041" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                <input type="number" step="any" value={formData.longitude || ''} onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg" placeholder="28.0473" />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Amenities</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.amenities.map((amenity) => (
                <span key={amenity} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-sm">
                  {amenity}
                  <button onClick={() => removeAmenity(amenity)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg">
                <option value="">Select amenity...</option>
                {commonAmenities.filter(a => !formData.amenities.includes(a)).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <button onClick={addAmenity} disabled={!newAmenity} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={url} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(url)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="url" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="Enter image URL..." className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg" />
              <button onClick={addImage} disabled={!newImageUrl} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
