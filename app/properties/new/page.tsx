'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sidebar } from '../../components/Sidebar';
import { 
  ArrowLeft, 
  FloppyDisk, 
  Plus,
  X,
  MapPin,
  Bed,
  Users,
  House,
  Clock,
  Star,
  Hoodie,
  Sun,
  Moon,
  Champagne,
  CheckCircle,
  Gear
} from '@phosphor-icons/react';
import Link from 'next/link';
import { RoomType } from '@/types';

const categories = ['Guesthouse', 'Apartment', 'House', 'Villa', 'Hotel', 'B&B', 'Hostel', 'Cottage'];
const roomAmenities = ['Queen Bed', 'King Bed', 'Twin Beds', 'TV', 'Bar Fridge', 'Microwave', 'Fan', 'AC', 'Private Bathroom', 'Couch', 'Desk', 'Safe', 'WiFi', 'Bath Tub', 'Shower'];

const defaultRoomType: RoomType = {
  id: '',
  name: '',
  description: '',
  category: 'standard',
  totalUnits: 1,
  amenities: [],
  images: [],
  bookingOptions: {
    nightly: { enabled: true, price: 350 },
    dayUse: { enabled: true, price: 350, startTime: '10:00', endTime: '17:30' },
    hourly: { enabled: true, rates: [
      { hours: 1, price: 100 },
      { hours: 2, price: 150 },
      { hours: 3, price: 250 }
    ]},
    event: { enabled: false, packages: [] }
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

export default function NewPropertyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'rooms'>('details');
  
  // Property-level data
  const [propertyData, setPropertyData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'Guesthouse',
    imageUrls: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
    checkInTime: '14:00',
    checkOutTime: '11:00',
    acceptPayOnSite: false,
    payOnSiteTimeLimitHours: 2,
    isPromoted: false,
    hostId: 'admin',
  });
  
  // Room types
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([{
    ...defaultRoomType,
    id: crypto.randomUUID(),
    name: 'Standard Room',
    description: 'Comfortable room with essential amenities'
  }]);
  
  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleSave = async () => {
    if (!propertyData.title || !propertyData.location) {
      alert('Please fill in property title and location');
      return;
    }
    
    if (roomTypes.length === 0) {
      alert('Please add at least one room type');
      return;
    }

    setSaving(true);
    try {
      // Calculate totals from room types
      const totalRooms = roomTypes.reduce((sum, rt) => sum + rt.totalUnits, 0);
      const defaultPrice = roomTypes[0]?.bookingOptions.nightly.price || 0;
      
      const accommodationData = {
        ...propertyData,
        roomTypes,
        price: defaultPrice,
        totalRooms,
        guests: Math.max(...roomTypes.map(() => 2)), // Estimate
        bedrooms: totalRooms,
        beds: totalRooms,
        bathrooms: totalRooms,
        createdAt: new Date(),
        isFullyBooked: false,
        bookedDates: [],
        acceptsReservations: true,
        supportsHourly: roomTypes.some(rt => rt.bookingOptions.hourly.enabled),
        hourlyRate: null,
        discountPercentage: null,
        discountValidUntil: null,
        discountCode: null,
        amenities: [...new Set(roomTypes.flatMap(rt => rt.amenities))],
      };

      const docRef = await addDoc(collection(db, 'accommodations'), accommodationData);
      router.push(`/properties/${docRef.id}`);
    } catch (error) {
      alert('Failed to create: ' + error);
      setSaving(false);
    }
  };

  const addRoomType = () => {
    const newRoom: RoomType = {
      ...defaultRoomType,
      id: crypto.randomUUID(),
      name: '',
      description: ''
    };
    setEditingRoom(newRoom);
    setShowRoomModal(true);
  };

  const editRoomType = (room: RoomType) => {
    setEditingRoom({ ...room });
    setShowRoomModal(true);
  };

  const saveRoomType = () => {
    if (!editingRoom?.name) {
      alert('Room type name is required');
      return;
    }
    
    const existingIndex = roomTypes.findIndex(rt => rt.id === editingRoom.id);
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...roomTypes];
      updated[existingIndex] = { ...editingRoom, updatedAt: new Date() };
      setRoomTypes(updated);
    } else {
      // Add new
      setRoomTypes([...roomTypes, { ...editingRoom, createdAt: new Date(), updatedAt: new Date() }]);
    }
    setShowRoomModal(false);
    setEditingRoom(null);
  };

  const deleteRoomType = (id: string) => {
    if (confirm('Delete this room type?')) {
      setRoomTypes(roomTypes.filter(rt => rt.id !== id));
    }
  };

  const addPropertyImage = () => {
    if (newImageUrl && !propertyData.imageUrls.includes(newImageUrl)) {
      setPropertyData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, newImageUrl] }));
      setNewImageUrl('');
    }
  };

  const removePropertyImage = (url: string) => {
    setPropertyData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter(u => u !== url) }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'standard': return <Bed className="w-5 h-5" />;
      case 'vip': return <Star className="w-5 h-5" />;
      case 'vipEvent': return <Champagne className="w-5 h-5" />;
      default: return <Bed className="w-5 h-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'standard': return 'Standard';
      case 'vip': return 'VIP';
      case 'vipEvent': return 'VIP Event';
      default: return category;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/properties" className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Property</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create a new accommodation with room types</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <FloppyDisk className="w-4 h-4" />
              {saving ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 border-b-2 font-medium text-sm ${
                activeTab === 'details' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Property Details
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`py-3 border-b-2 font-medium text-sm ${
                activeTab === 'rooms' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Room Types ({roomTypes.length})
            </button>
          </div>
        </div>

        <div className="p-6 max-w-5xl mx-auto">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <House className="w-5 h-5 text-indigo-600" />
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property Title *</label>
                    <input
                      type="text"
                      value={propertyData.title}
                      onChange={(e) => setPropertyData({ ...propertyData, title: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Luxury Guesthouse in Sandton"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={propertyData.description}
                      onChange={(e) => setPropertyData({ ...propertyData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Describe your property..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
                    <input
                      type="text"
                      value={propertyData.location}
                      onChange={(e) => setPropertyData({ ...propertyData, location: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Sandton, Johannesburg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select
                      value={propertyData.category}
                      onChange={(e) => setPropertyData({ ...propertyData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={propertyData.acceptPayOnSite}
                        onChange={(e) => setPropertyData({ ...propertyData, acceptPayOnSite: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Accept pay on site</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Check In/Out Times */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Check In/Out Times
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Check-in Time</label>
                    <input
                      type="time"
                      value={propertyData.checkInTime}
                      onChange={(e) => setPropertyData({ ...propertyData, checkInTime: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Check-out Time</label>
                    <input
                      type="time"
                      value={propertyData.checkOutTime}
                      onChange={(e) => setPropertyData({ ...propertyData, checkOutTime: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
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
                    <input
                      type="number"
                      step="any"
                      value={propertyData.latitude || ''}
                      onChange={(e) => setPropertyData({ ...propertyData, latitude: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="-26.2041"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={propertyData.longitude || ''}
                      onChange={(e) => setPropertyData({ ...propertyData, longitude: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="28.0473"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Images</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {propertyData.imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={url} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removePropertyImage(url)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL..."
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={addPropertyImage}
                    disabled={!newImageUrl}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Room Types List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Hoodie className="w-5 h-5 text-indigo-600" />
                    Room Types
                  </h2>
                  <button
                    onClick={addRoomType}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Room Type
                  </button>
                </div>

                {roomTypes.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <Hoodie className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No room types yet</p>
                    <button
                      onClick={addRoomType}
                      className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Add your first room type
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {roomTypes.map((room) => (
                      <div
                        key={room.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${
                              room.category === 'vip' ? 'bg-amber-100 text-amber-700' :
                              room.category === 'vipEvent' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {getCategoryIcon(room.category)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{room.name}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  room.category === 'vip' ? 'bg-amber-100 text-amber-700' :
                                  room.category === 'vipEvent' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {getCategoryLabel(room.category)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{room.description}</p>
                              <div className="flex items-center gap-4 mt-3 text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                  <Users className="w-4 h-4 inline mr-1" />
                                  {room.totalUnits} units
                                </span>
                                {room.bookingOptions.nightly.enabled && (
                                  <span className="text-green-600 dark:text-green-400">
                                    <Moon className="w-4 h-4 inline mr-1" />
                                    R{room.bookingOptions.nightly.price}/night
                                  </span>
                                )}
                                {room.bookingOptions.dayUse.enabled && (
                                  <span className="text-amber-600 dark:text-amber-400">
                                    <Sun className="w-4 h-4 inline mr-1" />
                                    R{room.bookingOptions.dayUse.price} day use
                                  </span>
                                )}
                                {room.bookingOptions.hourly.enabled && (
                                  <span className="text-blue-600 dark:text-blue-400">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    From R{room.bookingOptions.hourly.rates[0]?.price}/hr
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => editRoomType(room)}
                              className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteRoomType(room.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Room Type Modal */}
      {showRoomModal && editingRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {roomTypes.find(rt => rt.id === editingRoom.id) ? 'Edit Room Type' : 'Add Room Type'}
                </h3>
                <button onClick={() => setShowRoomModal(false)} className="p-2 text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Room Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Name *</label>
                  <input
                    type="text"
                    value={editingRoom.name}
                    onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                    placeholder="e.g., Standard Room"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={editingRoom.category}
                    onChange={(e) => setEditingRoom({ ...editingRoom, category: e.target.value as 'standard' | 'vip' | 'vipEvent' })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="vip">VIP</option>
                    <option value="vipEvent">VIP Event</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={editingRoom.description}
                    onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                    placeholder="Describe this room type..."
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Units</label>
                  <input
                    type="number"
                    min={1}
                    value={editingRoom.totalUnits}
                    onChange={(e) => setEditingRoom({ ...editingRoom, totalUnits: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room Amenities</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editingRoom.amenities.map((amenity) => (
                    <span key={amenity} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-full text-sm">
                      {amenity}
                      <button
                        onClick={() => setEditingRoom({ ...editingRoom, amenities: editingRoom.amenities.filter(a => a !== amenity) })}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !editingRoom.amenities.includes(e.target.value)) {
                      setEditingRoom({ ...editingRoom, amenities: [...editingRoom.amenities, e.target.value] });
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Add amenity...</option>
                  {roomAmenities.filter(a => !editingRoom.amenities.includes(a)).map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Pricing Options */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Pricing Options</h4>
                
                {/* Overnight */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Overnight Stays</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRoom.bookingOptions.nightly.enabled}
                        onChange={(e) => setEditingRoom({
                          ...editingRoom,
                          bookingOptions: {
                            ...editingRoom.bookingOptions,
                            nightly: { ...editingRoom.bookingOptions.nightly, enabled: e.target.checked }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {editingRoom.bookingOptions.nightly.enabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Price per night:</span>
                      <span className="text-gray-900 dark:text-white font-medium">R</span>
                      <input
                        type="number"
                        value={editingRoom.bookingOptions.nightly.price}
                        onChange={(e) => setEditingRoom({
                          ...editingRoom,
                          bookingOptions: {
                            ...editingRoom.bookingOptions,
                            nightly: { ...editingRoom.bookingOptions.nightly, price: Number(e.target.value) }
                          }
                        })}
                        className="w-24 px-3 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Day Use */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-amber-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Day Use</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRoom.bookingOptions.dayUse.enabled}
                        onChange={(e) => setEditingRoom({
                          ...editingRoom,
                          bookingOptions: {
                            ...editingRoom.bookingOptions,
                            dayUse: { ...editingRoom.bookingOptions.dayUse, enabled: e.target.checked }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {editingRoom.bookingOptions.dayUse.enabled && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Price</label>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-900 dark:text-white font-medium">R</span>
                          <input
                            type="number"
                            value={editingRoom.bookingOptions.dayUse.price}
                            onChange={(e) => setEditingRoom({
                              ...editingRoom,
                              bookingOptions: {
                                ...editingRoom.bookingOptions,
                                dayUse: { ...editingRoom.bookingOptions.dayUse, price: Number(e.target.value) }
                              }
                            })}
                            className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={editingRoom.bookingOptions.dayUse.startTime}
                          onChange={(e) => setEditingRoom({
                            ...editingRoom,
                            bookingOptions: {
                              ...editingRoom.bookingOptions,
                              dayUse: { ...editingRoom.bookingOptions.dayUse, startTime: e.target.value }
                            }
                          })}
                          className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Time</label>
                        <input
                          type="time"
                          value={editingRoom.bookingOptions.dayUse.endTime}
                          onChange={(e) => setEditingRoom({
                            ...editingRoom,
                            bookingOptions: {
                              ...editingRoom.bookingOptions,
                              dayUse: { ...editingRoom.bookingOptions.dayUse, endTime: e.target.value }
                            }
                          })}
                          className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Hourly */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Short Stay (Hourly)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRoom.bookingOptions.hourly.enabled}
                        onChange={(e) => setEditingRoom({
                          ...editingRoom,
                          bookingOptions: {
                            ...editingRoom.bookingOptions,
                            hourly: { ...editingRoom.bookingOptions.hourly, enabled: e.target.checked }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {editingRoom.bookingOptions.hourly.enabled && (
                    <div className="space-y-2">
                      {editingRoom.bookingOptions.hourly.rates.map((rate, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-20">{rate.hours} hour{rate.hours > 1 ? 's' : ''}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-900 dark:text-white font-medium">R</span>
                            <input
                              type="number"
                              value={rate.price}
                              onChange={(e) => {
                                const newRates = [...editingRoom.bookingOptions.hourly.rates];
                                newRates[index] = { ...rate, price: Number(e.target.value) };
                                setEditingRoom({
                                  ...editingRoom,
                                  bookingOptions: {
                                    ...editingRoom.bookingOptions,
                                    hourly: { ...editingRoom.bookingOptions.hourly, rates: newRates }
                                  }
                                });
                              }}
                              className="w-24 px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Event Packages */}
                {editingRoom.category === 'vipEvent' && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Champagne className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-900 dark:text-white">VIP Event Packages</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingRoom.bookingOptions.event.enabled}
                          onChange={(e) => setEditingRoom({
                            ...editingRoom,
                            bookingOptions: {
                              ...editingRoom.bookingOptions,
                              event: { ...editingRoom.bookingOptions.event, enabled: e.target.checked }
                            }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    {editingRoom.bookingOptions.event.enabled && (
                      <div className="space-y-3">
                        {editingRoom.bookingOptions.event.packages.map((pkg, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Package name"
                                value={pkg.name}
                                onChange={(e) => {
                                  const newPackages = [...editingRoom.bookingOptions.event.packages];
                                  newPackages[index] = { ...pkg, name: e.target.value };
                                  setEditingRoom({
                                    ...editingRoom,
                                    bookingOptions: {
                                      ...editingRoom.bookingOptions,
                                      event: { ...editingRoom.bookingOptions.event, packages: newPackages }
                                    }
                                  });
                                }}
                                className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-gray-900 dark:text-white font-medium">R</span>
                                <input
                                  type="number"
                                  placeholder="Price"
                                  value={pkg.price}
                                  onChange={(e) => {
                                    const newPackages = [...editingRoom.bookingOptions.event.packages];
                                    newPackages[index] = { ...pkg, price: Number(e.target.value) };
                                    setEditingRoom({
                                      ...editingRoom,
                                      bookingOptions: {
                                        ...editingRoom.bookingOptions,
                                        event: { ...editingRoom.bookingOptions.event, packages: newPackages }
                                      }
                                    });
                                  }}
                                  className="w-20 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => setEditingRoom({
                            ...editingRoom,
                            bookingOptions: {
                              ...editingRoom.bookingOptions,
                              event: {
                                ...editingRoom.bookingOptions.event,
                                packages: [...editingRoom.bookingOptions.event.packages, { name: '', price: 0, duration: 4, maxGuests: 2, includes: [] }]
                              }
                            }
                          })}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          + Add Event Package
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowRoomModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveRoomType}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Room Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
