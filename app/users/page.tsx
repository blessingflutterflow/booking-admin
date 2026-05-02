'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User as UserType, Booking } from '@/types';
import { Sidebar } from '../components/Sidebar';
import { 
  Users as UsersIcon, 
  MagnifyingGlass, 
  User,
  CalendarBlank,
  House,
  Envelope,
  Phone,
  Crown
} from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'guest' | 'host' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || null,
        })) as UserType[];
        setUsers(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadUserBookings = async (userId: string) => {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('guestId', '==', userId)
    );
    const snapshot = await getDocs(bookingsQuery);
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      checkIn: doc.data().checkIn?.toDate(),
      checkOut: doc.data().checkOut?.toDate(),
    })) as Booking[];
    setUserBookings(bookings);
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role,
        isHost: role === 'host' || role === 'admin',
      });
    } catch (error) {
      alert('Failed to update role: ' + error);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    guests: users.filter(u => u.role === 'guest' || !u.role).length,
    hosts: users.filter(u => u.role === 'host').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.total} total • {stats.guests} guests • {stats.hosts} hosts • {stats.admins} admins
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserType['role'] | 'all')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg"
            >
              <option value="all">All Roles</option>
              <option value="guest">Guests</option>
              <option value="host">Hosts</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Users Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No users found</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    loadUserBookings(user.id);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md cursor-pointer transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{user.name || 'Unnamed'}</h3>
                        <p className="text-xs text-gray-500 capitalize">{user.role || 'guest'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'host' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role || 'guest'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <Envelope className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{user.email || 'No email'}</span>
                    </p>
                    {user.phone && (
                      <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {user.phone}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs flex items-center gap-2">
                      <CalendarBlank className="w-3 h-3" />
                      Joined {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {selectedUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedUser.name || 'Unnamed'}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              {/* Role Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <div className="flex gap-2">
                  {(['guest', 'host', 'admin'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => updateUserRole(selectedUser.id, role)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${
                        selectedUser.role === role
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {role === 'admin' && <Crown className="w-4 h-4 inline mr-1" />}
                      {role === 'host' && <House className="w-4 h-4 inline mr-1" />}
                      {role === 'guest' && <User className="w-4 h-4 inline mr-1" />}
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-gray-500">User ID</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedUser.id.slice(0, 16)}...</p>
                </div>
                <div>
                  <p className="text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Host Status</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedUser.isHost ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Booking History */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Booking History ({userBookings.length})</h4>
                {userBookings.length === 0 ? (
                  <p className="text-gray-500 text-sm">No bookings found</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">{booking.accommodationTitle}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
