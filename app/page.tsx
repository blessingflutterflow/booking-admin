'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardStats } from '@/types';
import { Sidebar } from './components/Sidebar';
import { 
  Buildings, 
  CalendarBlank, 
  Users,
  CurrencyDollar,
  TrendUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  House,
  CheckCircle,
  Person,
  MapTrifold,
  Plus,
  Bell
} from '@phosphor-icons/react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

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
      const bookingsSnapshot = await getCountFromServer(collection(db, 'bookings'));
      const propertiesSnapshot = await getCountFromServer(collection(db, 'accommodations'));
      const usersSnapshot = await getCountFromServer(collection(db, 'users'));
      
      const pendingQuery = query(collection(db, 'bookings'), where('status', '==', 'pending'));
      const pendingSnapshot = await getCountFromServer(pendingQuery);

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
        todayCheckIns: 0,
        todayCheckOuts: 0,
      });
      setLoading(false);
    };

    loadStats();
  }, []);

  const statCards = [
    { 
      name: 'Total Properties', 
      value: stats.totalProperties, 
      icon: Buildings, 
      color: 'var(--airtable-blue)',
      bg: 'rgba(27, 97, 201, 0.08)',
      trend: '+12%' 
    },
    { 
      name: 'Total Bookings', 
      value: stats.totalBookings, 
      icon: CalendarBlank, 
      color: 'var(--success-green)',
      bg: 'rgba(0, 100, 0, 0.08)',
      trend: '+8%' 
    },
    { 
      name: 'Total Revenue', 
      value: formatCurrency(stats.totalRevenue), 
      icon: CurrencyDollar, 
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.08)',
      trend: '+15%' 
    },
    { 
      name: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.08)',
      trend: '+5%' 
    },
  ];

  return (
    <div className="flex h-screen" style={{ background: 'var(--light-surface)' }}>
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div 
          className="px-8 py-6 border-b"
          style={{ 
            background: 'var(--white)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-section-heading" style={{ color: 'var(--deep-navy)' }}>
                Dashboard
              </h1>
              <p className="text-body mt-1" style={{ color: 'var(--text-weak)' }}>
                Welcome back! Here's what's happening today.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                className="p-3 rounded-xl transition-colors"
                style={{ 
                  background: 'var(--light-surface)',
                  color: 'var(--text-weak)'
                }}
              >
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-medium" style={{ color: 'var(--deep-navy)' }}>Admin User</p>
                  <p className="text-caption" style={{ color: 'var(--text-weak)' }}>admin@boobookings.com</p>
                </div>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: 'var(--airtable-blue)' }}
                >
                  A
                </div>
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
                className="stat-card"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="p-3 rounded-xl"
                    style={{ background: stat.bg }}
                  >
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} weight="fill" />
                  </div>
                  <div 
                    className="flex items-center gap-1 text-sm"
                    style={{ color: stat.trend.startsWith('+') ? 'var(--success-green)' : '#dc2626' }}
                  >
                    {stat.trend.startsWith('+') ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.trend}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-caption" style={{ color: 'var(--text-weak)' }}>{stat.name}</p>
                  <div className="text-card-title mt-1" style={{ color: 'var(--deep-navy)' }}>
                    {loading ? (
                      <div 
                        className="h-8 w-24 rounded animate-pulse"
                        style={{ background: 'var(--light-surface)' }}
                      />
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
            <div 
              className="rounded-xl p-4 mb-8 flex items-center justify-between"
              style={{ 
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ background: 'rgba(245, 158, 11, 0.15)' }}
                >
                  <Clock className="w-5 h-5" style={{ color: '#b45309' }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: '#b45309' }}>
                    {stats.pendingBookings} Pending Booking{stats.pendingBookings !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm" style={{ color: '#d97706' }}>
                    Requires your approval
                  </p>
                </div>
              </div>
              <Link
                href="/bookings"
                className="btn-primary text-sm"
              >
                Review Now
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card p-6">
              <h2 className="text-card-title mb-4" style={{ color: 'var(--deep-navy)' }}>
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/properties/new"
                  className="flex items-center gap-3 p-4 rounded-xl transition-colors"
                  style={{ 
                    background: 'var(--light-surface)',
                    color: 'var(--deep-navy)'
                  }}
                >
                  <Plus className="w-5 h-5" style={{ color: 'var(--airtable-blue)' }} />
                  <span className="font-medium">Add Property</span>
                </Link>
                <Link
                  href="/bookings"
                  className="flex items-center gap-3 p-4 rounded-xl transition-colors"
                  style={{ 
                    background: 'var(--light-surface)',
                    color: 'var(--deep-navy)'
                  }}
                >
                  <CalendarBlank className="w-5 h-5" style={{ color: 'var(--airtable-blue)' }} />
                  <span className="font-medium">View Bookings</span>
                </Link>
                <Link
                  href="/map"
                  className="flex items-center gap-3 p-4 rounded-xl transition-colors"
                  style={{ 
                    background: 'var(--light-surface)',
                    color: 'var(--deep-navy)'
                  }}
                >
                  <MapTrifold className="w-5 h-5" style={{ color: 'var(--airtable-blue)' }} />
                  <span className="font-medium">Map View</span>
                </Link>
                <Link
                  href="/users"
                  className="flex items-center gap-3 p-4 rounded-xl transition-colors"
                  style={{ 
                    background: 'var(--light-surface)',
                    color: 'var(--deep-navy)'
                  }}
                >
                  <Users className="w-5 h-5" style={{ color: 'var(--airtable-blue)' }} />
                  <span className="font-medium">Manage Users</span>
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-card-title mb-4" style={{ color: 'var(--deep-navy)' }}>
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div 
                  className="flex items-center gap-3 pb-4"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'var(--success-green)' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--deep-navy)' }}>
                      New booking confirmed
                    </p>
                    <p className="text-caption" style={{ color: 'var(--text-weak)' }}>
                      Guesthouse in Sandton - R850
                    </p>
                  </div>
                  <span className="text-caption" style={{ color: 'var(--text-weak)' }}>2m ago</span>
                </div>
                <div 
                  className="flex items-center gap-3 pb-4"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'var(--airtable-blue)' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--deep-navy)' }}>
                      Property updated
                    </p>
                    <p className="text-caption" style={{ color: 'var(--text-weak)' }}>
                      Downtown Apartment pricing changed
                    </p>
                  </div>
                  <span className="text-caption" style={{ color: 'var(--text-weak)' }}>15m ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#f59e0b' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--deep-navy)' }}>
                      New review submitted
                    </p>
                    <p className="text-caption" style={{ color: 'var(--text-weak)' }}>
                      5-star review for Beach Villa
                    </p>
                  </div>
                  <span className="text-caption" style={{ color: 'var(--text-weak)' }}>1h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
