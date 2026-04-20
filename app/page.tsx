'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardStats } from '@/types';
import { Sidebar } from './components/Sidebar';
import { 
  Building2, 
  Calendar, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  LogOut,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    totalProperties: 0,
    totalUsers: 0,
    pendingBookings: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      // Get counts
      const bookingsSnapshot = await getCountFromServer(collection(db, 'bookings'));
      const propertiesSnapshot = await getCountFromServer(collection(db, 'accommodations'));
      const usersSnapshot = await getCountFromServer(collection(db, 'users'));
      
      const pendingQuery = query(collection(db, 'bookings'), where('status', '==', 'pending'));
      const pendingSnapshot = await getCountFromServer(pendingQuery);

      // Calculate revenue from confirmed bookings
      const bookingsQuery = query(collection(db, 'bookings'), where('status', 'in', ['confirmed', 'checkedOut']));
      const bookingsData = await new Promise<number>((resolve) => {
        const unsub = onSnapshot(bookingsQuery, (snapshot) => {
          let revenue = 0;
          snapshot.docs.forEach(doc => {
            revenue += doc.data().total || 0;
          });
          resolve(revenue);
          unsub();
        });
      });

      setStats({
        totalBookings: bookingsSnapshot.data().count,
        totalRevenue: bookingsData,
        totalProperties: propertiesSnapshot.data().count,
        totalUsers: usersSnapshot.data().count,
        pendingBookings: pendingSnapshot.data().count,
        todayCheckIns: 0, // Would calculate based on checkIn date
        todayCheckOuts: 0, // Would calculate based on checkOut date
      });
      setLoading(false);
    };

    loadStats();
  }, []);

  const statCards = [
    { name: 'Total Properties', value: stats.totalProperties, icon: Building2, color: 'bg-blue-500', trend: '+12%' },
    { name: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'bg-indigo-500', trend: '+8%' },
    { name: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-green-500', trend: '+15%' },
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-purple-500', trend: '+5%' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Welcome back! Here&apos;s what&apos;s happening today.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">admin@boobookings.com</p>
              </div>
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => (
              <div
                key={stat.name}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend.startsWith('+') ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.trend}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.name}</p>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {loading ? (
                      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      stat.value
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Bookings Alert */}
          {stats.pendingBookings > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    {stats.pendingBookings} Pending Booking{stats.pendingBookings !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Requires your approval
                  </p>
                </div>
              </div>
              <a
                href="/bookings"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Review Now
              </a>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <a
                  href="/properties/new"
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-gray-900 dark:text-white">Add Property</span>
                </a>
                <a
                  href="/bookings"
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-gray-900 dark:text-white">View Bookings</span>
                </a>
                <a
                  href="/map"
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-gray-900 dark:text-white">Map View</span>
                </a>
                <a
                  href="/users"
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-gray-900 dark:text-white">Manage Users</span>
                </a>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      New booking confirmed
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Guesthouse in Sandton - R850
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">2m ago</span>
                </div>
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Property updated
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Downtown Apartment pricing changed
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">15m ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      New review submitted
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      5-star review for Beach Villa
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">1h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
