import React, { useState, useMemo, useEffect } from 'react';
import { useMobilityStore } from '../../context/MobilityStore';
import { RentalBooking } from '../../types/mobility';
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Download, 
  Printer, 
  X,
  Store,
  Globe
} from 'lucide-react';

interface AllBookingsViewProps {
  onOpenCheckout: (id: string) => void;
  onOpenReturnCheckIn: (assetTag: string) => void;
  onOpenManualHire: () => void;
}

export const AllBookingsView: React.FC<AllBookingsViewProps> = ({ 
  onOpenCheckout,
  onOpenReturnCheckIn, 
  onOpenManualHire 
}) => {
  const { bookings, cancelBooking, extendBooking } = useMobilityStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | RentalBooking['status']>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedBooking = bookings.find(b => b.id === selectedId);

  useEffect(() => {
    if (!selectedId) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = document.querySelector('[role="dialog"]');
    const items = () => Array.from(dialog?.querySelectorAll<HTMLButtonElement>('button') || []);
    items()[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
      if (e.key === 'Tab') { const buttons = items(); const first = buttons[0]; const last = buttons.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    document.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', handler); previous?.focus(); };
  }, [selectedId]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchStatus = statusFilter === 'All' || b.status === statusFilter;
      const matchSearch = 
        b.id.toLowerCase().includes(search.toLowerCase()) ||
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.assetTag.toLowerCase().includes(search.toLowerCase()) ||
        b.modelName.toLowerCase().includes(search.toLowerCase()) ||
        b.customerPhone.includes(search);

      return matchStatus && matchSearch;
    });
  }, [bookings, search, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Loans & bookings</h2>
          <p className="text-xs text-slate-500">
            Manage reservations, fulfil online bookings, and track every loan.
          </p>
        </div>

        <button
          onClick={onOpenManualHire}
          className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs self-start sm:self-auto"
        >
          + New counter loan
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Reference, Hirer, Asset Tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {(['All', 'Confirmed', 'Active', 'Overdue', 'Returned', 'Cancelled'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st === 'Confirmed' ? 'Awaiting checkout' : st} ({st === 'All' ? bookings.length : bookings.filter(b => b.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Hirer & Phone</th>
                <th className="py-3 px-4">Equipment & Unit</th>
                <th className="py-3 px-4">Hire Dates</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Fees & Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No hire records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const isHired = b.status === 'Active' || b.status === 'Overdue';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Booking ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 text-xs block">
                          {b.id}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {b.createdAt}
                        </span>
                      </td>

                      {/* Hirer */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{b.customerName}</p>
                        <p className="text-[11px] text-slate-500">{b.customerPhone}</p>
                      </td>

                      {/* Equipment */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{b.modelName}</p>
                        <span className="font-mono text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.2 rounded">
                          Tag: {b.assetTag}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="text-slate-800">{b.startDate} → {b.endDate}</p>
                        <span className="text-[10px] text-slate-500">{b.durationDays} days</span>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                          {b.source === 'Online Public' ? (
                            <>
                              <Globe className="w-3 h-3 text-blue-500" />
                              <span>Public Web</span>
                            </>
                          ) : (
                            <>
                              <Store className="w-3 h-3 text-teal-600" />
                              <span>Shop Counter</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Fees & Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">${b.totalAmount.toFixed(2)}</p>
                        <span className={`inline-block px-2 py-0.2 rounded text-[10px] font-bold ${
                          b.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                          b.status === 'Overdue' ? 'bg-amber-100 text-amber-900' :
                          b.status === 'Returned' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => setSelectedId(b.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                        >
                          View Details
                        </button>

                        {b.status === 'Confirmed' && <>
                          <button onClick={() => onOpenCheckout(b.id)} className="px-2.5 py-1 rounded bg-teal-700 text-white text-xs">Check out</button>
                          <button onClick={() => { if(window.confirm(`Cancel ${b.id} and release its equipment?`)) cancelBooking(b.id); }} className="px-2.5 py-1 rounded border border-slate-300 text-xs">Cancel booking</button>
                        </>}
                        {isHired && <button onClick={() => { if(window.confirm('Extend this loan by 7 days and update the hire total?')) extendBooking(b.id, 7); }} className="px-2.5 py-1 rounded border border-slate-300 text-xs">Extend 7 days</button>}
                        {isHired && (
                          <button
                            onClick={() => onOpenReturnCheckIn(b.assetTag)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200"
                          >
                            Check-In
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Detail Modal */}
      {selectedBooking && (
        <div role="dialog" aria-modal="true" aria-label="Loan details" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="print-area bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-teal-700 font-bold block">
                  HIRE AGREEMENT #{selectedBooking.id}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Rental Agreement & Payment Record
                </h3>
              </div>
              <button
                aria-label="Close loan details"
                onClick={() => setSelectedId(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Equipment Item</span>
                  <strong className="text-slate-900">{selectedBooking.modelName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Asset Tag</span>
                  <strong className="text-teal-700 font-mono">{selectedBooking.assetTag}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Hirer</span>
                  <strong className="text-slate-900">{selectedBooking.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone</span>
                  <span className="text-slate-700">{selectedBooking.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Hire Period</span>
                  <span>{selectedBooking.startDate} to {selectedBooking.endDate} ({selectedBooking.durationDays}d)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Fulfillment</span>
                  <span>{selectedBooking.deliveryType}</span>
                </div>
              </div>

              {/* Financials breakdown */}
              <div className="space-y-1.5 p-3 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-700 text-[11px]">Financial Accounting</h4>
                <div className="flex justify-between text-slate-600">
                  <span>Equipment Hire Fee:</span>
                  <span>${selectedBooking.rentalFee.toFixed(2)}</span>
                </div>
                {selectedBooking.deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Van Delivery & Setup:</span>
                    <span>${selectedBooking.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100">
                  <span>Refundable Bond / Security Deposit:</span>
                  <span>${selectedBooking.depositFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1">
                  <span>Total Transaction:</span>
                  <span>${selectedBooking.totalAmount.toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Payment Method: <strong>{selectedBooking.paymentMethod}</strong> ({selectedBooking.paymentStatus})
                </div>
              </div>

              {selectedBooking.lastContactNote && <p className="text-xs text-slate-600">Staff log: {selectedBooking.lastContactNote}</p>}
              <p className="text-xs text-slate-500">Demo agreement. Payments, invoices, and deposit refunds are simulated.</p>
              {/* Notes or inspection condition */}
              {selectedBooking.returnCondition && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px]">
                  <strong>Return Inspection:</strong> {selectedBooking.returnCondition} (Processed on {selectedBooking.returnProcessedDate})
                </div>
              )}

              {selectedBooking.notes && (
                <p className="text-[11px] text-slate-600 italic">
                  Notes: "{selectedBooking.notes}"
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Agreement</span>
              </button>

              <button
                onClick={() => setSelectedId(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
