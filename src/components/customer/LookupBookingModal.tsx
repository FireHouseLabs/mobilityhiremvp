import React, { useState } from 'react';
import { useMobilityStore } from '../../context/MobilityStore';
import { RentalBooking } from '../../types/mobility';
import { X, Search, Calendar, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';

interface LookupBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LookupBookingModal: React.FC<LookupBookingModalProps> = ({ isOpen, onClose }) => {
  const { bookings, cancelBooking } = useMobilityStore();
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const result = bookings.find(b => b.id === resultId);
  const [matches, setMatches] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const cleaned = query.trim().toUpperCase();
    const phone = query.replace(/\D/g, '');
    const found = bookings.filter(b => b.id.toUpperCase() === cleaned || (phone.length >= 8 && b.customerPhone.replace(/\D/g, '') === phone) || b.customerEmail.toLowerCase() === query.trim().toLowerCase());
    setMatches(found.map(b => b.id));
    setResultId(found[0]?.id || null);
  };

  const sampleRefs = bookings.slice(0, 3).map(b => b.id);

  return (
    <div role="dialog" aria-modal="true" aria-label="Find my booking" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">Find Rental Booking</h3>
          </div>
          <button
            aria-label="Close dialog" onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Enter Booking Reference, Mobile, or Email
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. MOB-3012 or 0412 883 912"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setResultId(null); setSearched(false); setMatches([]); }}
                className="min-w-0 flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span>Try sample references:</span>
              {sampleRefs.map(ref => (
                <button
                  key={ref}
                  type="button"
                  onClick={() => { setQuery(ref); setSearched(false); setResultId(null); setMatches([]); }}
                  className="text-teal-600 hover:underline font-mono"
                >
                  {ref}
                </button>
              ))}
            </div>
          </form>

          {searched && !result && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
              No active or past booking found matching "{query}". Please verify the booking ID or contact shop support on (03) 9820 1200.

            </div>
          )}

          {matches.length > 1 && <div className="flex flex-wrap gap-2">{matches.map(id => <button key={id} onClick={() => setResultId(id)} className="text-xs border border-slate-300 rounded-lg px-3 py-2">{id}</button>)}</div>}
          {result && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-mono font-bold text-slate-900 text-sm">{result.id}</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  result.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                  result.status === 'Overdue' ? 'bg-amber-100 text-amber-900' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  Status: {result.status}
                </span>
              </div>

              <div className="space-y-1.5 text-slate-700">
                {result.status === 'Confirmed' && <p className="text-teal-800">Your equipment is reserved, awaiting collection or dispatch on {result.startDate}.</p>}
                <p><strong>Equipment:</strong> {result.modelName} (Asset Tag: <span className="font-mono text-teal-700">{result.assetTag}</span>)</p>
                <p><strong>Hirer:</strong> {result.customerName} ({result.customerPhone})</p>
                <p><strong>Hire Period:</strong> {result.startDate} to {result.endDate} ({result.durationDays} days)</p>
                <p><strong>Fulfillment:</strong> {result.deliveryType}</p>
                <p><strong>Booking total:</strong> ${result.totalAmount.toFixed(2)} ({result.paymentMethod} · {result.paymentStatus}, demo)</p>
                {result.status === 'Overdue' && (
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>This item was due for return on <strong>{result.endDate}</strong>. Please contact the depot or request an extension.</span>
                  </div>
                )}
              </div>
              {result.status === 'Confirmed' && <button onClick={() => { if(window.confirm(`Cancel ${result.id} and release the reserved equipment?`)) cancelBooking(result.id); }} className="mt-3 px-3 py-2 border border-slate-300 rounded-lg text-xs">Cancel reservation</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
