export interface Accommodation {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  price: number;
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
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'checkedOut' | 'expired';
export type BookingType = 'overnight' | 'hourly';
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
  hours?: number | null;
  paymentMethod: PaymentMethod;
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
