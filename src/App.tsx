import React, { useState, useEffect } from 'react';
import { MobilityStoreProvider, useMobilityStore } from './context/MobilityStore';
import { Header } from './components/Header';
import { CatalogueView } from './components/customer/CatalogueView';
import { EquipmentBookingModal } from './components/customer/EquipmentBookingModal';
import { LookupBookingModal } from './components/customer/LookupBookingModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ManualHireModal } from './components/admin/ManualHireModal';
import { EquipmentFleetView } from './components/admin/EquipmentFleetView';
import { OverdueRentalsView } from './components/admin/OverdueRentalsView';
import { AllBookingsView } from './components/admin/AllBookingsView';
import { ReturnCheckInModal } from './components/admin/ReturnCheckInModal';
import { CheckoutModal } from './components/admin/CheckoutModal';
import { EquipmentModel } from './types/mobility';

function MainApp() {
  const { activeView, adminTab, setAdminTab, notice, notify } = useMobilityStore();

  // Modals state
  const [selectedBookingModel, setSelectedBookingModel] = useState<EquipmentModel | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isManualHireOpen, setIsManualHireOpen] = useState(false);
  const [returnCheckInAssetTag, setReturnCheckInAssetTag] = useState<string | null>(null);

  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const modalOpen = !!(selectedBookingModel || isLookupOpen || isManualHireOpen || returnCheckInAssetTag || checkoutId);
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea, [tabindex="0"]') || []).filter(el => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedBookingModel(null); setIsLookupOpen(false); setIsManualHireOpen(false); setReturnCheckInAssetTag(null); setCheckoutId(null); }
      if (e.key === 'Tab') { const items = focusable(); const first = items[0]; const last = items.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    document.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', handler); previous?.focus(); };
  }, [modalOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation & View Switcher */}
      <Header
        onOpenLookup={() => setIsLookupOpen(true)}
        onOpenManualHire={() => setIsManualHireOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeView === 'customer' ? (
          <CatalogueView
            onSelectModel={(model) => setSelectedBookingModel(model)}
            onOpenLookup={() => setIsLookupOpen(true)}
          />
        ) : (
          <div className="space-y-6">
            {adminTab === 'dashboard' && (
              <AdminDashboard
                onOpenManualHire={() => setIsManualHireOpen(true)}
                onOpenCheckout={setCheckoutId}
                onOpenReturnCheckIn={(assetTag) => setReturnCheckInAssetTag(assetTag)}
              />
            )}

            {adminTab === 'fleet' && (
              <EquipmentFleetView
                onOpenReturnCheckIn={(assetTag) => setReturnCheckInAssetTag(assetTag)}
                onOpenManualHire={() => setIsManualHireOpen(true)}
              />
            )}

            {adminTab === 'overdue' && (
              <OverdueRentalsView
                onOpenReturnCheckIn={(assetTag) => setReturnCheckInAssetTag(assetTag)}
              />
            )}

            {adminTab === 'all-bookings' && (
              <AllBookingsView
                onOpenCheckout={setCheckoutId}
                onOpenReturnCheckIn={(assetTag) => setReturnCheckInAssetTag(assetTag)}
                onOpenManualHire={() => setIsManualHireOpen(true)}
              />
            )}

            {adminTab === 'manual-hire' && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
                <h3 className="text-base font-bold text-slate-900">Manual Hire Counter Form</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click the button below to open the dedicated shop counter hire tool for phone and walk-in rentals.
                </p>
                <button
                  onClick={() => setIsManualHireOpen(true)}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Open Manual Hire Entry Modal
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-xs text-slate-500 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MobilityHire Platform</span>
            <span>·</span>
            <span>Equipment hire & loan management demo</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Depot: 142 Mobility Way, Central Depot</span>
            <span>·</span>
            <span>Tel: (03) 9820 1200</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedBookingModel && <EquipmentBookingModal
        model={selectedBookingModel}
        onClose={() => setSelectedBookingModel(null)}
      />}

      {isLookupOpen && <LookupBookingModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
      />}

      {isManualHireOpen && <ManualHireModal
        isOpen={isManualHireOpen}
        onClose={() => {
          setIsManualHireOpen(false);
          setAdminTab('all-bookings');
        }}
      />}

      {checkoutId && <CheckoutModal bookingId={checkoutId} onClose={() => setCheckoutId(null)} />}
      {notice && <div role="status" className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-md z-[70] bg-slate-900 text-white rounded-xl shadow-lg px-5 py-4 text-sm flex gap-4 items-start">{notice}<button onClick={() => notify('')} aria-label="Dismiss notification">✕</button></div>}

      {returnCheckInAssetTag && (
        <ReturnCheckInModal
          targetAssetTag={returnCheckInAssetTag}
          onClose={() => setReturnCheckInAssetTag(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <MobilityStoreProvider>
      <MainApp />
    </MobilityStoreProvider>
  );
}
