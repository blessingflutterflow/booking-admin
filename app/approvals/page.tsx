'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Accommodation } from '@/types';
import { Sidebar } from '../components/Sidebar';
import {
  HouseLine,
  CheckCircle,
  XCircle,
  Clock,
  MagnifyingGlass,
  MapPin,
  Tag,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react';

type Filter = 'pending' | 'approved' | 'all';

interface ListingWithHost extends Accommodation {
  hostName?: string;
  hostEmail?: string;
}

export default function ApprovalsPage() {
  const [listings, setListings] = useState<ListingWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'accommodations'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || null,
        })) as ListingWithHost[];
        setListings(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, []);

  const filtered = listings.filter((l) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && !l.isApproved) ||
      (filter === 'approved' && l.isApproved);

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      l.title?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const stats = {
    pending: listings.filter((l) => !l.isApproved).length,
    approved: listings.filter((l) => l.isApproved).length,
    total: listings.length,
  };

  const toggleApproval = async (listing: ListingWithHost, approve: boolean) => {
    setProcessing(listing.id);
    try {
      await updateDoc(doc(db, 'accommodations', listing.id), {
        isApproved: approve,
      });
    } catch (err) {
      alert('Error: ' + err);
    } finally {
      setProcessing(null);
    }
  };

  const filterTabs: { label: string; value: Filter; count?: number }[] = [
    { label: 'Pending', value: 'pending', count: stats.pending },
    { label: 'Approved', value: 'approved', count: stats.approved },
    { label: 'All', value: 'all', count: stats.total },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Listing Approvals</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {stats.pending} pending · {stats.approved} approved · {stats.total} total
            </p>
          </div>

          {/* Filter tabs + search */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    filter === tab.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                        filter === tab.value
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, location, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <HouseLine className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No listings found</h3>
              <p className="text-sm text-gray-500 mt-1">
                {filter === 'pending' ? 'No listings awaiting approval.' : 'Nothing matches your search.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((listing) => {
                const isApproved = listing.isApproved ?? false;
                const isBusy = processing === listing.id;

                return (
                  <div
                    key={listing.id}
                    className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border transition-shadow hover:shadow-md ${
                      isApproved
                        ? 'border-gray-200 dark:border-gray-700'
                        : 'border-orange-200 dark:border-orange-800'
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-44 bg-gray-100 dark:bg-gray-700">
                      {listing.imageUrls?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.imageUrls[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HouseLine className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {/* Status badge */}
                      <div
                        className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isApproved
                            ? 'bg-green-500 text-white'
                            : 'bg-orange-500 text-white'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" weight="fill" />
                        )}
                        {isApproved ? 'APPROVED' : 'PENDING'}
                      </div>
                      {/* Suspended badge */}
                      {listing.isSuspended && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                          <EyeSlash className="w-3 h-3" weight="fill" />
                          HIDDEN
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                        {listing.title}
                      </h3>

                      <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs text-gray-500">
                        {listing.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[160px]">{listing.location}</span>
                          </span>
                        )}
                        {listing.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            {listing.category}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {listing.description || 'No description provided.'}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          R{listing.price?.toLocaleString()} / night
                        </span>
                        {listing.createdAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        {!isApproved ? (
                          <>
                            <button
                              onClick={() => toggleApproval(listing, true)}
                              disabled={isBusy}
                              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-60"
                            >
                              <CheckCircle className="w-4 h-4" weight="fill" />
                              {isBusy ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => toggleApproval(listing, false)}
                              disabled={isBusy}
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-red-50 hover:text-red-600 text-gray-600 dark:text-gray-300 text-sm font-semibold transition disabled:opacity-60"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 text-sm font-semibold">
                              <CheckCircle className="w-4 h-4" weight="fill" />
                              Live
                            </div>
                            <button
                              onClick={() => toggleApproval(listing, false)}
                              disabled={isBusy}
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-red-50 hover:text-red-600 text-gray-500 text-sm font-semibold transition disabled:opacity-60"
                              title="Revoke approval"
                            >
                              <Eye className="w-4 h-4" />
                              Revoke
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
