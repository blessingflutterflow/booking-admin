'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  writeBatch,
  getDocs,
  where,
  Timestamp,
  deleteField,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sidebar } from '../components/Sidebar';
import {
  Users,
  MagnifyingGlass,
  DotsThreeVertical,
  Prohibit,
  Play,
  CreditCard,
  CheckCircle,
  CalendarPlus,
  WarningCircle,
  X,
  HouseLine,
} from '@phosphor-icons/react';

interface Vendor {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  role?: string;
  isSuspended?: boolean;
  suspensionReason?: string;
  hasActiveSubscription?: boolean;
  subscriptionExpiry?: Timestamp;
  createdAt?: Date | null;
}

type MenuAction = 'suspend' | 'unsuspend' | 'toggle_subscription' | 'grant_30_days' | null;

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Dialog state
  const [dialog, setDialog] = useState<{
    open: boolean;
    action: MenuAction;
    vendor: Vendor | null;
  }>({ open: false, action: null, vendor: null });
  const [suspensionReason, setSuspensionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // No orderBy here — avoids requiring a composite Firestore index
    const unsubscribe = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'host')),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || null,
        })) as Vendor[];
        // Sort client-side by createdAt descending
        data.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        setVendors(data);
        setLoading(false);
      },
      (err) => {
        console.error('Vendors query error:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.phone?.includes(q)
    );
  });

  const openDialog = (action: MenuAction, vendor: Vendor) => {
    setDialog({ open: true, action, vendor });
    setSuspensionReason('');
    setActiveMenu(null);
  };

  const closeDialog = () => {
    setDialog({ open: false, action: null, vendor: null });
    setSuspensionReason('');
  };

  const handleConfirm = async () => {
    if (!dialog.vendor) return;
    setProcessing(true);
    const vendorRef = doc(db, 'users', dialog.vendor.id);

    try {
      if (dialog.action === 'suspend') {
        await updateDoc(vendorRef, {
          isSuspended: true,
          suspensionReason: suspensionReason.trim() || 'No reason provided',
        });
        // Hide all their listings
        const listings = await getDocs(
          query(collection(db, 'accommodations'), where('hostId', '==', dialog.vendor.id))
        );
        const batch = writeBatch(db);
        listings.docs.forEach((d) => batch.update(d.ref, { isSuspended: true }));
        await batch.commit();
      } else if (dialog.action === 'unsuspend') {
        await updateDoc(vendorRef, {
          isSuspended: false,
          suspensionReason: deleteField(),
        });
        // Restore listings
        const listings = await getDocs(
          query(collection(db, 'accommodations'), where('hostId', '==', dialog.vendor.id))
        );
        const batch = writeBatch(db);
        listings.docs.forEach((d) => batch.update(d.ref, { isSuspended: false }));
        await batch.commit();
      } else if (dialog.action === 'toggle_subscription') {
        const newStatus = !dialog.vendor.hasActiveSubscription;
        await updateDoc(vendorRef, { hasActiveSubscription: newStatus });
        const listings = await getDocs(
          query(collection(db, 'accommodations'), where('hostId', '==', dialog.vendor.id))
        );
        const batch = writeBatch(db);
        listings.docs.forEach((d) => batch.update(d.ref, { isSuspended: !newStatus }));
        await batch.commit();
      } else if (dialog.action === 'grant_30_days') {
        const currentExpiry = dialog.vendor.subscriptionExpiry?.toDate();
        let newExpiry: Date;
        if (currentExpiry && currentExpiry > new Date()) {
          newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else {
          newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        await updateDoc(vendorRef, {
          hasActiveSubscription: true,
          subscriptionExpiry: Timestamp.fromDate(newExpiry),
          lastPaymentAt: Timestamp.now(),
        });
        const listings = await getDocs(
          query(collection(db, 'accommodations'), where('hostId', '==', dialog.vendor.id))
        );
        const batch = writeBatch(db);
        listings.docs.forEach((d) => batch.update(d.ref, { isSuspended: false }));
        await batch.commit();
      }
      closeDialog();
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      setProcessing(false);
    }
  };

  const formatExpiry = (ts?: Timestamp) => {
    if (!ts) return null;
    const d = ts.toDate();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const stats = {
    total: vendors.length,
    suspended: vendors.filter((v) => v.isSuspended).length,
    active: vendors.filter((v) => !v.isSuspended && v.hasActiveSubscription !== false).length,
    inactive: vendors.filter((v) => v.hasActiveSubscription === false).length,
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendors</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {stats.total} total · {stats.active} active · {stats.suspended} suspended · {stats.inactive} inactive subscription
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-red-500 font-medium">Failed to load vendors</p>
              <p className="text-sm text-gray-400 mt-1 max-w-sm">{error}</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Users className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No vendors found</h3>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery ? 'Try a different search term.' : 'No hosts have registered yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVendors.map((vendor) => {
                const isSuspended = vendor.isSuspended ?? false;
                const hasActiveSub = vendor.hasActiveSubscription !== false;
                const isExpired =
                  vendor.subscriptionExpiry &&
                  vendor.subscriptionExpiry.toDate() < new Date();
                const showSubWarning = !hasActiveSub || isExpired;

                return (
                  <div
                    key={vendor.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl p-5 border transition-shadow hover:shadow-md relative ${
                      isSuspended
                        ? 'border-red-200 dark:border-red-800'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {vendor.profilePicture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={vendor.profilePicture}
                              alt={vendor.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            vendor.name?.[0]?.toUpperCase() || 'V'
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {vendor.name || 'Unnamed Vendor'}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">{vendor.email}</p>
                        </div>
                      </div>

                      {/* Menu */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setActiveMenu(activeMenu === vendor.id ? null : vendor.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        >
                          <DotsThreeVertical className="w-5 h-5" />
                        </button>
                        {activeMenu === vendor.id && (
                          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 w-52">
                            <button
                              onClick={() => openDialog(isSuspended ? 'unsuspend' : 'suspend', vendor)}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                            >
                              {isSuspended ? (
                                <>
                                  <Play className="w-4 h-4 text-green-500" />
                                  <span className="text-green-600 font-medium">Unsuspend Vendor</span>
                                </>
                              ) : (
                                <>
                                  <Prohibit className="w-4 h-4 text-red-500" />
                                  <span className="text-red-600 font-medium">Suspend Vendor</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => openDialog('toggle_subscription', vendor)}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                            >
                              {hasActiveSub ? (
                                <>
                                  <CreditCard className="w-4 h-4 text-orange-500" />
                                  <span className="text-orange-600 font-medium">Deactivate Subscription</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-green-600 font-medium">Activate Subscription</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => openDialog('grant_30_days', vendor)}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                            >
                              <CalendarPlus className="w-4 h-4 text-blue-500" />
                              <span className="text-blue-600 font-medium">Grant 30 Days</span>
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                            <button
                              onClick={() => setActiveMenu(null)}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-gray-500"
                            >
                              <HouseLine className="w-4 h-4" />
                              <span>View Listings</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isSuspended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                          <Prohibit className="w-3 h-3" /> SUSPENDED
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                          showSubWarning
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {showSubWarning ? (
                          <WarningCircle className="w-3 h-3" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {showSubWarning ? 'Inactive' : 'Active Subscription'}
                      </span>
                    </div>

                    {/* Expiry */}
                    {vendor.subscriptionExpiry && (
                      <p className="mt-2 text-xs text-gray-400">
                        Expires: {formatExpiry(vendor.subscriptionExpiry)}
                      </p>
                    )}

                    {/* Suspension reason */}
                    {isSuspended && vendor.suspensionReason && (
                      <p className="mt-2 text-xs text-red-500 italic">
                        Reason: {vendor.suspensionReason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      {dialog.open && dialog.vendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {dialog.action === 'suspend' && 'Suspend Vendor'}
                {dialog.action === 'unsuspend' && 'Unsuspend Vendor'}
                {dialog.action === 'toggle_subscription' && (dialog.vendor.hasActiveSubscription ? 'Deactivate Subscription' : 'Activate Subscription')}
                {dialog.action === 'grant_30_days' && 'Grant 30 Days'}
              </h2>
              <button
                onClick={closeDialog}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {dialog.action === 'suspend' &&
                  `You are about to suspend ${dialog.vendor.name}. Their listings will be hidden and they will not be able to accept new bookings.`}
                {dialog.action === 'unsuspend' &&
                  `You are about to unsuspend ${dialog.vendor.name}. Their listings will be restored.`}
                {dialog.action === 'toggle_subscription' &&
                  (dialog.vendor.hasActiveSubscription
                    ? `Deactivating the subscription for ${dialog.vendor.name} will hide their listings.`
                    : `Activating the subscription for ${dialog.vendor.name} will restore their listings.`)}
                {dialog.action === 'grant_30_days' &&
                  `This will grant ${dialog.vendor.name} 30 days of active subscription${
                    dialog.vendor.subscriptionExpiry &&
                    dialog.vendor.subscriptionExpiry.toDate() > new Date()
                      ? ', added on top of their current expiry.'
                      : ', starting from today.'
                  }`}
              </p>

              {dialog.action === 'suspend' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Suspension Reason
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter reason for suspension (visible to vendor)..."
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={closeDialog}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing}
                className={`flex-1 py-2.5 rounded-xl font-medium text-sm text-white transition disabled:opacity-60 ${
                  dialog.action === 'suspend'
                    ? 'bg-red-600 hover:bg-red-700'
                    : dialog.action === 'unsuspend'
                    ? 'bg-green-600 hover:bg-green-700'
                    : dialog.action === 'toggle_subscription'
                    ? dialog.vendor.hasActiveSubscription
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-green-600 hover:bg-green-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close menu on outside click */}
      {activeMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
      )}
    </div>
  );
}
