// Room Type - Individual room category within a property
export interface RoomType {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'vip' | 'vipEvent';
  totalUnits: number;
  amenities: string[];
  images: string[];
  
  // Booking options for this room type
  bookingOptions: {
    nightly: {
      enabled: boolean;
      price: number;
    };
    dayUse: {
      enabled: boolean;
      price: number;
      startTime: string;  // "10:00"
      endTime: string;    // "17:30"
    };
    hourly: {
      enabled: boolean;
      rates: {
        hours: number;    // 1, 2, or 3
        price: number;
      }[];
    };
    event: {
      enabled: boolean;
      packages: {
        name: string;
        price: number;
        duration: number;  // hours
        maxGuests: number;
        includes: string[];
      }[];
    };
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Availability tracking per room type per date
export interface RoomAvailability {
  roomTypeId: string;
  date: string;           // "2025-04-25"
  unitsBooked: number;
  unitsAvailable: number; // totalUnits - unitsBooked
  bookings: string[];     // booking IDs
}

export interface Accommodation {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  price: number;  // Legacy: default nightly price (kept for backward compatibility)
  imageUrls: string[];
  amenities: string[];
  hostId: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  latitude: number;
  longitude: number;
  createdAt: Date | null;
  
  // NEW: Room types within this property
  roomTypes: RoomType[];
  
  // Property-level settings
  checkInTime: string;    // "14:00"
  checkOutTime: string;   // "11:00"
  
  // Legacy fields (kept for backward compatibility)
  hourlyRate?: number | null;
  supportsHourly: boolean;
  acceptPayOnSite: boolean;
  payOnSiteTimeLimitHours?: number | null;
  discountPercentage?: number | null;
  discountValidUntil?: Date | null;
  discountCode?: string | null;
  isPromoted: boolean;
  totalRooms: number;
  acceptsReservations: boolean;
  isFullyBooked: boolean;
  nextAvailableDate?: Date | null;
  bookedDates: string[];
  isSuspended?: boolean;
  isApproved?: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'checkedOut' | 'expired';
export type BookingType = 'overnight' | 'dayUse' | 'hourly' | 'event';
export type PaymentMethod = 'online' | 'payOnSite';

export interface Booking {
  id: string;
  guestId: string;
  hostId: string;
  accommodationId: string;
  accommodationTitle: string;
  accommodationLocation: string;
  accommodationImageUrl: string;
  accommodationCategory: string;
  
  // NEW: Room type reference
  roomTypeId: string;
  roomTypeName: string;
  
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  pricePerNight: number;
  serviceFee: number;
  taxes: number;
  total: number;
  status: BookingStatus;
  specialRequests: string;
  createdAt: Date | null;
  guestName: string;
  bookingType: BookingType;
  hours?: number | null;           // For hourly bookings
  startTime?: string | null;      // "14:00" - for hourly/dayUse
  endTime?: string | null;        // "16:00" - calculated
  eventPackageName?: string | null; // For event bookings
  paymentMethod: PaymentMethod;
  paymentStatus: 'pendingPayment' | 'proofSubmitted' | 'paymentConfirmed';
  paymentProofUrl?: string | null;
  arrivalDeadline?: Date | null;
  isArrived: boolean;
  checkedOutAt?: Date | null;
  guestReviewed: boolean;
  hostReviewed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  role: 'guest' | 'host' | 'admin';
  createdAt: Date | null;
  isHost: boolean;
  isSuspended?: boolean;
}

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalProperties: number;
  totalUsers: number;
  pendingBookings: number;
  todayCheckIns: number;
  todayCheckOuts: number;
}
