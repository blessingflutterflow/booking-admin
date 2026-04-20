'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SquaresFour,
  MapTrifold,
  Buildings,
  CalendarBlank,
  Users,
  Tag,
  Gear,
  SignOut,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: SquaresFour },
  { name: 'Map View', href: '/map', icon: MapTrifold },
  { name: 'Properties', href: '/properties', icon: Buildings },
  { name: 'Bookings', href: '/bookings', icon: CalendarBlank },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Promotions', href: '/promotions', icon: Tag },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div 
      className="flex flex-col h-full w-64 border-r"
      style={{ 
        background: 'var(--white)',
        borderColor: 'var(--border-color)'
      }}
    >
      {/* Logo */}
      <div 
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--airtable-blue)' }}
        >
          <span className="text-white font-bold text-xl">B</span>
        </div>
        <div>
          <h1 
            className="font-bold"
            style={{ color: 'var(--deep-navy)' }}
          >
            Boo Bookings
          </h1>
          <p 
            className="text-xs"
            style={{ color: 'var(--text-weak)' }}
          >
            Admin Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'sidebar-link',
                isActive && 'active'
              )}
            >
              <item.icon className="w-5 h-5 ph-icon" weight={isActive ? 'fill' : 'regular'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div 
        className="p-4 border-t space-y-1"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <button 
          className="sidebar-link w-full text-left"
          style={{ color: 'var(--text-weak)' }}
        >
          <Gear className="w-5 h-5 ph-icon" />
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left"
          style={{ color: '#dc2626' }}
        >
          <SignOut className="w-5 h-5 ph-icon" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
