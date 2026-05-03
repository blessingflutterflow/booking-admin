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
  Storefront,
  ClipboardText,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: SquaresFour },
  { name: 'Map View', href: '/map', icon: MapTrifold },
  { name: 'Properties', href: '/properties', icon: Buildings },
  { name: 'Bookings', href: '/bookings', icon: CalendarBlank },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Vendors', href: '/vendors', icon: Storefront },
  { name: 'Approvals', href: '/approvals', icon: ClipboardText },
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
      className="flex flex-col h-full w-[280px] border-r flex-shrink-0"
      style={{ 
        background: '#ffffff',
        borderColor: '#e0e2e6'
      }}
    >
      {/* Logo */}
      <div 
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: '#e0e2e6' }}
      >
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: '#1b61c9' }}
        >
          <span className="text-white font-bold text-xl">B</span>
        </div>
        <div>
          <h1 className="font-bold text-[#181d26]">
            Boo Bookings
          </h1>
          <p className="text-xs text-[rgba(4,14,32,0.69)]">
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
              <item.icon className="w-5 h-5 flex-shrink-0" weight={isActive ? 'fill' : 'regular'} />
              <span className="whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div 
        className="p-4 border-t space-y-1"
        style={{ borderColor: '#e0e2e6' }}
      >
        <Link 
          href="/settings"
          className={cn(
            'sidebar-link w-full text-[rgba(4,14,32,0.69)]',
            pathname === '/settings' && 'active'
          )}
        >
          <Gear className="w-5 h-5 flex-shrink-0" weight={pathname === '/settings' ? 'fill' : 'regular'} />
          <span className="whitespace-nowrap">Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-left text-red-600"
        >
          <SignOut className="w-5 h-5 flex-shrink-0" />
          <span className="whitespace-nowrap">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
