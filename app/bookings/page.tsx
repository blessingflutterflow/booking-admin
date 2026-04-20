'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BookingStatus } from '@/types';
import { Sidebar } from '../components/Sidebar';
import { 
  CalendarBlank, 
  MagnifyingGlass, 
  Faders,
  CheckCircle,
  XCircle,
  Clock,
  SignOut,
  CurrencyDollar,
  User,
  MapPin,
  Eye,
  X
} from '@phosphor-icons/react';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';

const statusConfig: Record<BookingStatus, { color: string; bg: string; icon: any; label: string }> = {
  pending: { color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock, label: 'Pending' },
  confirmed: { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle, label: 'Confirmed' },
  cancelled: { color: 'text-red-700', bg: 'bg-red-100', icon: XCircle, label: 'Cancelled' },
  checkedOut: { color: 'text-blue-700', bg: 'bg-blue-100', icon: SignOut, label: 'Checked Out' },
  expired: { color: 'text-gray-700', bg: 'bg-gray-100', icon: Clock, label: 'Expired' },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          checkIn: d.checkIn?.toDate() || new Date(),
          checkOut: d.checkOut?.toDate() || new Date(),
          createdAt: d.createdAt?.toDate() || null,
          arrivalDeadline: d.arrivalDeadline?.toDate() || null,
          checkedOutAt: d.checkedOutAt?.toDate() || null,
        } as Booking;
      });
      setBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status,
        ...(status === 'checkedOut' ? { checkedOutAt: new Date(), hostReviewed: true } : {}),
      });
    } catch (error) {
      alert('Failed to update: ' + error);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      b.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.accommodationTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    revenue: bookings.filter(b => ['confirmed', 'checkedOut'].includes(b.status)).reduce((sum, b) => sum + (b.total || 0), 0),
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.total} total • {stats.pending} pending • {stats.confirmed} confirmed
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by guest, property, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checkedOut">Checked Out</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarBlank className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No bookings found</h3>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredBookings.map((booking) => {
                    const status = statusConfig[booking.status];
                    const StatusIcon = status.icon;
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={booking.accommodationImageUrl || 'https://via.placeholder.com/100'}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{booking.accommodationTitle}</p>
                              <p className="text-xs text-gray-500">{booking.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">{booking.guestName}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{booking.adults} adults, {booking.children} children</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <CalendarBlank className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{booking.nights} nights</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(booking.total)}</p>
                          <p className="text-xs text-gray-500">{booking.paymentMethod === 'payOnSite' ? 'Pay on site' : 'Online payment'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(booking.id, 'confirmed')}
                                  className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateStatus(booking.id, 'cancelled')}
                                  className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => updateStatus(booking.id, 'checkedOut')}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                              >
                                Check Out
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedBooking.accommodationImageUrl || 'https://via.placeholder.com/100'}
                  alt=""
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{selectedBooking.accommodationTitle}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedBooking.accommodationLocation}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Guest</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.guestName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Booking ID</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check In</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(selectedBooking.checkIn)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check Out</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(selectedBooking.checkOut)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Guests</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedBooking.adults} adults, {selectedBooking.children} children</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedBooking.paymentMethod}</p>
                </div>
              </div>

              {selectedBooking.specialRequests && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Special Requests</p>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Price ({selectedBooking.nights} nights × {formatCurrency(selectedBooking.pricePerNight)})</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(selectedBooking.pricePerNight * selectedBooking.nights)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Service Fee</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(selectedBooking.serviceFee)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Taxes</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(selectedBooking.taxes)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-indigo-600">{formatCurrency(selectedBooking.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
