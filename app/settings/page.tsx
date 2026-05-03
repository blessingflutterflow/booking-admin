'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sidebar } from '../components/Sidebar';
import {
  Gear,
  WhatsappLogo,
  CheckCircle,
  FloppyDisk,
  WarningCircle,
} from '@phosphor-icons/react';

export default function SettingsPage() {
  const [adminWhatsappNumber, setAdminWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'app_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAdminWhatsappNumber(docSnap.data().adminWhatsappNumber || '');
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await setDoc(doc(db, 'settings', 'app_config'), {
        adminWhatsappNumber: adminWhatsappNumber.trim(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <Gear size={24} weight="bold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Configure global platform settings
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Contact Information Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <WhatsappLogo className="text-[#25D366]" size={24} weight="fill" />
                      Contact Information
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Used for vendor support and account issues
                    </p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Admin WhatsApp Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-sm">+</span>
                        </div>
                        <input
                          type="text"
                          placeholder="27812345678"
                          value={adminWhatsappNumber.replace('+', '')}
                          onChange={(e) => setAdminWhatsappNumber('+' + e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-7 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Vendors will see this number when their account is suspended or subscription expires.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {success && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-xl border border-green-100 dark:border-green-800">
                    <CheckCircle weight="fill" size={20} />
                    <span className="text-sm font-medium">Settings saved successfully!</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-100 dark:border-red-800">
                    <WarningCircle weight="fill" size={20} />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FloppyDisk size={20} weight="bold" />
                    )}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
