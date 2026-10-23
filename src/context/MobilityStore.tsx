import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { EquipmentModel, InventoryUnit, RentalBooking, UnitStatus, PaymentMethod } from '../types/mobility';
import { INITIAL_EQUIPMENT_MODELS } from '../data/mockData';

import { DemoState, freshDemo, refreshOverdue, todayDate, checkout, cancel, checkIn, extend, createLoan } from '../lib/rentals';
const STORAGE_KEY = 'mobility_demo_v2';

export type AdminTab = 'dashboard' | 'manual-hire' | 'fleet' | 'overdue' | 'all-bookings';

interface MobilityStoreContextType {
  models: EquipmentModel[];
  inventory: InventoryUnit[];
  bookings: RentalBooking[];
  activeView: 'customer' | 'admin';
  setActiveView: (view: 'customer' | 'admin') => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  
  // Helpers
  getAvailableCount: (modelId: string) => number;
  getAvailableUnitsForModel: (modelId: string) => InventoryUnit[];
  getAllAvailableUnits: () => InventoryUnit[];
  getModelById: (modelId: string) => EquipmentModel | undefined;

  // Actions
  createPublicBooking: (params: {
    modelId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress?: string;
    ndisParticipantNumber?: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    deliveryType: 'Shop Collection' | 'Home Delivery & Setup';
    deliveryFee: number;
    rentalFee: number;
    depositFee: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => RentalBooking;

  createManualHire: (params: {
    modelId: string;
    assetTag: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress?: string;
    ndisParticipantNumber?: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    deliveryType: 'Shop Collection' | 'Home Delivery & Setup';
    deliveryFee: number;
    rentalFee: number;
    depositFee: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: 'Paid' | 'Pending Invoice' | 'Deposit Held';
    notes?: string;
  }) => RentalBooking;

  processReturn: (
    bookingId: string, 
    assetTag: string, 
    condition: 'Good - Clean' | 'Needs Cleaning' | 'Minor Wear' | 'Damaged / Repaired',
    nextStatus: 'Available' | 'Cleaning' | 'In Maintenance',
    notes?: string
  ) => void;

  extendBooking: (bookingId: string, additionalDays: number) => void;
  updateUnitStatus: (assetTag: string, status: UnitStatus, notes?: string) => void;
  updateContactNote: (bookingId: string, note: string) => void;
  resetDemoData: () => void;
  checkoutBooking: (id: string, tag: string, paid: boolean) => void;
  cancelBooking: (id: string) => void;
  notice: string;
  notify: (message: string) => void;
}

const MobilityStoreContext = createContext<MobilityStoreContextType | null>(null);
export const MobilityStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DemoState>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.version === 2 && Array.isArray(saved.inventory) && Array.isArray(saved.bookings) && saved.inventory.every((u: InventoryUnit) => typeof u.assetTag === 'string' && typeof u.modelId === 'string') && saved.bookings.every((b: RentalBooking) => typeof b.id === 'string' && typeof b.endDate === 'string' && Number.isFinite(b.totalAmount))) return refreshOverdue(saved);
    } catch { /* Start a fresh demo if browser data is unavailable. */ }
    return freshDemo();
  });
  const current = useRef(state);
  const [notice, notify] = useState('');
  const [activeView, setActiveView] = useState<'customer' | 'admin'>('customer');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const commit = (next: DemoState) => { current.current = next; setState(next); };
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: 2 })); }
    catch { notify('Browser storage is unavailable. Your demo works until this page is refreshed.'); }
  }, [state]);
  useEffect(() => {
    const refresh = () => commit(refreshOverdue(current.current));
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  useEffect(() => { if (notice) { const timer = setTimeout(() => notify(''), 6000); return () => clearTimeout(timer); } }, [notice]);
  const models = INITIAL_EQUIPMENT_MODELS;
  const getModelById = (id: string) => models.find(m => m.id === id);
  const getAvailableUnitsForModel = (id: string) => state.inventory.filter(u => u.modelId === id && u.status === 'Available');
  const create = (params: Parameters<MobilityStoreContextType['createManualHire']>[0] | Parameters<MobilityStoreContextType['createPublicBooking']>[0], manual: boolean): RentalBooking => {
    const { state: next, booking } = createLoan(current.current, params, manual);
    commit(next);
    notify(manual ? `${booking.id}: ${booking.assetTag} checked out to ${booking.customerName}.` : `${booking.id}: equipment reserved for ${booking.customerName}.`);
    return booking;
  };
  const safe = (action: () => DemoState, message: string) => { try { commit(action()); notify(message); } catch (error) { notify((error as Error).message); } };
  return <MobilityStoreContext.Provider value={{
    models, ...state, activeView, setActiveView, adminTab, setAdminTab, notice, notify,
    getModelById, getAvailableUnitsForModel,
    getAvailableCount: id => getAvailableUnitsForModel(id).length,
    getAllAvailableUnits: () => state.inventory.filter(u => u.status === 'Available'),
    createPublicBooking: p => create(p, false), createManualHire: p => create(p, true),
    checkoutBooking: (id, tag, paid) => { commit(checkout(current.current, id, tag, paid)); notify(`${tag} checked out. Loan is now active.`); },
    cancelBooking: id => safe(() => cancel(current.current, id), `${id} cancelled. Reserved equipment is available again.`),
    processReturn: (id, tag, condition, next, notes) => { commit(checkIn(current.current, id, tag, condition, next, notes)); notify(`${tag} checked in. Equipment is now ${next.toLowerCase()}. Deposit action recorded (simulated).`); },
    extendBooking: (id, days) => safe(() => extend(current.current, id, days), `${id} extended by ${days} days. Hire total updated; additional fees are simulated.`),
    updateUnitStatus: (tag, status, notes) => {
      const unit = current.current.inventory.find(u => u.assetTag === tag);
      if (!unit || unit.currentBookingId || !['Available', 'Cleaning', 'In Maintenance'].includes(status)) { notify('Use checkout or check-in to change equipment linked to a loan.'); return; }
      commit({ ...current.current, inventory: current.current.inventory.map(u => u.assetTag === tag ? { ...u, status, notes: notes ?? u.notes, location: status === 'In Maintenance' ? 'Workshop' : 'Shop Showroom', lastInspectedDate: todayDate() } : u) });
      notify(`${tag} is now ${status.toLowerCase()}.`);
    },
    updateContactNote: (id, note) => { commit({ ...current.current, bookings: current.current.bookings.map(b => b.id === id ? { ...b, lastContactNote: note } : b) }); notify('Contact note saved in this demo.'); },
    resetDemoData: () => { commit(freshDemo()); setAdminTab('dashboard'); notify('Demo reset. Sample bookings and equipment restored.'); }
  }}>{children}</MobilityStoreContext.Provider>;
};
export const useMobilityStore = () => {
  const context = useContext(MobilityStoreContext);
  if (!context) throw new Error('useMobilityStore must be used within MobilityStoreProvider');
  return context;
};
