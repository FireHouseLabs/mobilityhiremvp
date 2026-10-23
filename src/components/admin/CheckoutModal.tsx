import React, { useState } from 'react';
import { useMobilityStore } from '../../context/MobilityStore';
import { todayDate } from '../../lib/rentals';
export function CheckoutModal({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { bookings, inventory, checkoutBooking } = useMobilityStore();
  const booking = bookings.find(b => b.id === bookingId)!;
  const [tag, setTag] = useState(booking.assetTag);
  const [checked, setChecked] = useState(false);
  const [paid, setPaid] = useState(booking.paymentStatus === 'Paid');
  const [error, setError] = useState('');
  const units = inventory.filter(u => u.modelId === booking.modelId && (u.status === 'Available' || u.currentBookingId === booking.id));
  const future = booking.startDate > todayDate();
  return <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="Check out reservation" className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
    <div className="flex justify-between items-center"><h2 className="text-lg font-semibold">{booking.deliveryType === 'Shop Collection' ? 'Check out for collection' : 'Dispatch delivery'}</h2><button onClick={onClose} aria-label="Close checkout">✕</button></div>
    <p className="text-sm text-slate-600">{booking.customerName} · {booking.id}<br />{booking.modelName}<br />{booking.startDate} → {booking.endDate}</p>
    {booking.deliveryType === 'Home Delivery & Setup' && booking.customerAddress && <p className="text-sm">Delivery to: {booking.customerAddress}</p>}
    <label className="block text-sm font-medium">Assign equipment unit<select className="mt-2 w-full border border-slate-300 rounded-lg p-2.5" value={tag} onChange={e => setTag(e.target.value)}>{units.map(u => <option key={u.assetTag} value={u.assetTag}>{u.assetTag} · {u.location}</option>)}</select></label>
    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">Payment: {booking.paymentStatus} · ${booking.totalAmount.toFixed(2)}<br /><span className="text-xs">{booking.paymentMethod}. Payment collection is simulated.</span></div>
    <label className="flex gap-3 text-sm"><input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} />Payment collected (demo). Leave unchecked for an invoice.</label>
    <label className="flex gap-3 text-sm"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />Equipment inspected, sanitised, and all accessories included. Customer handover complete.</label>
    {future && <p className="text-sm text-amber-800">This booking starts on {booking.startDate}. Checkout becomes available on that day.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-sm">Cancel</button><button disabled={!checked || future} className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40" onClick={() => { try { checkoutBooking(booking.id, tag, paid); onClose(); } catch(e) { setError((e as Error).message); } }}>Confirm checkout</button></div>
  </section></div>;
}
