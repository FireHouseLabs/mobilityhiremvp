import React, { useState } from 'react';
import { useMobilityStore } from '../../context/MobilityStore';
import { RentalBooking } from '../../types/mobility';
import { 
  AlertTriangle, 
  PhoneCall, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ArrowRight,
  UserCheck,
  Send
} from 'lucide-react';

interface OverdueRentalsViewProps {
  onOpenReturnCheckIn: (assetTag: string) => void;
}

export const OverdueRentalsView: React.FC<OverdueRentalsViewProps> = ({ onOpenReturnCheckIn }) => {
  const { bookings, extendBooking, updateContactNote } = useMobilityStore();

  const overdueBookings = bookings.filter(b => b.status === 'Overdue');
  
  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const handleStartEditNote = (b: RentalBooking) => {
    setEditingNoteId(b.id);
    setNoteText(b.lastContactNote || '');
  };

  const handleSaveNote = (bookingId: string) => {
    if (noteText.trim()) {
      updateContactNote(bookingId, noteText.trim());
    }
    setEditingNoteId(null);
  };

  const handleQuickSmsLog = (bookingId: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const autoNote = `Demo SMS reminder logged at ${time} requesting return or extension. No message sent.`;
    updateContactNote(bookingId, autoNote);
  };

  const handleExtend = (bookingId: string, days: number) => {
    if (window.confirm(`Extend rental by ${days} days? This will adjust the scheduled return date.`)) {
      extendBooking(bookingId, days);
    }
  };

  const totalLateDays = overdueBookings.reduce((sum, b) => sum + (b.overdueDays || 1), 0);
  const estimatedLateFees = totalLateDays * 20; // standard late fee rate

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Overdue Equipment Rentals</h2>
              <p className="text-xs text-slate-500">
                Track unreturned equipment, contact hirers, process extensions, or initiate returns.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-xs">
            <span className="text-slate-400 block text-[10px]">Overdue Units:</span>
            <strong className="text-amber-700 font-bold text-base">{overdueBookings.length}</strong>
          </div>
          <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-xs">
            <span className="text-slate-400 block text-[10px]">Cumulative Days Past Due:</span>
            <strong className="text-slate-900 font-bold text-base">{totalLateDays} days</strong>
          </div>
          <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-xs">
            <span className="text-slate-400 block text-[10px]">Potential Late Fees:</span>
            <strong className="text-slate-900 font-bold text-base">${estimatedLateFees}</strong>
          </div>
        </div>
      </div>

      {/* Main Overdue List */}
      {overdueBookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">All Rentals Are Up To Date</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no overdue equipment hires. All active rentals are within their scheduled lease dates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {overdueBookings.map((booking) => {
            const isEditing = editingNoteId === booking.id;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden transition-all hover:border-amber-300"
              >
                {/* Header bar */}
                <div className="bg-amber-50/70 px-4 py-3 border-b border-amber-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900">{booking.id}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-semibold text-slate-800">{booking.modelName}</span>
                    <span className="font-mono text-teal-800 font-bold bg-white px-2 py-0.5 rounded border border-amber-200">
                      Asset: {booking.assetTag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[11px]">
                      {booking.overdueDays || 1} DAYS OVERDUE
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      (Due return: <strong>{booking.endDate}</strong>)
                    </span>
                  </div>
                </div>

                {/* Body details */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                  {/* Col 1: Customer Contact Info */}
                  <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Hirer Details
                    </h4>
                    <p className="text-sm font-bold text-slate-900">{booking.customerName}</p>
                    <div className="space-y-1 text-slate-600">
                      <p className="flex items-center gap-1.5 font-medium text-slate-900">
                        <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                        <span>{booking.customerPhone}</span>
                      </p>
                      <p className="text-slate-500">{booking.customerEmail}</p>
                      {booking.customerAddress && (
                        <p className="text-slate-500 text-[11px]">{booking.customerAddress}</p>
                      )}
                      {booking.ndisParticipantNumber && (
                        <p className="text-teal-700 font-medium">NDIS: {booking.ndisParticipantNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Rental Terms & Financial Status */}
                  <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Hire Terms & Security
                    </h4>
                    <div className="space-y-1 text-slate-600">
                      <p>Duration: {booking.durationDays} days ({booking.startDate} to {booking.endDate})</p>
                      <p>Hire fee: ${booking.rentalFee.toFixed(2)} ({booking.paymentMethod})</p>
                      <p>Deposit Held: <strong className="text-slate-900">${booking.depositFee.toFixed(2)}</strong></p>
                      <p>Accrued Overdue Charge: <strong className="text-amber-800">${(booking.overdueDays || 1) * 20}</strong> ($20/day)</p>
                      {booking.notes && (
                        <p className="text-[11px] text-slate-500 italic">"{booking.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Col 3: Staff Log & Counter Actions */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                          Staff Contact Log
                        </h4>
                        {!isEditing && (
                          <button
                            onClick={() => handleStartEditNote(booking)}
                            className="text-[11px] text-teal-700 font-semibold hover:underline"
                          >
                            Update Note
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Enter call outcome or extension promise..."
                            rows={2}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveNote(booking.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-teal-600 text-white rounded"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                          {booking.lastContactNote ? (
                            <p className="leading-relaxed">"{booking.lastContactNote}"</p>
                          ) : (
                            <p className="text-slate-400 italic">No contact logged yet.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleQuickSmsLog(booking.id)}
                        className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold flex items-center gap-1 border border-slate-200"
                        title="Simulate sending SMS reminder"
                      >
                        <MessageSquare className="w-3 h-3 text-slate-500" />
                        <span>Simulate SMS reminder</span>
                      </button>

                      <button
                        onClick={() => handleExtend(booking.id, 3)}
                        className="px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-semibold flex items-center gap-1 border border-blue-200"
                      >
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span>Extend +3 Days</span>
                      </button>

                      <button
                        onClick={() => handleExtend(booking.id, 7)}
                        className="px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-semibold flex items-center gap-1 border border-blue-200"
                      >
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span>Extend +7 Days</span>
                      </button>

                      <button
                        onClick={() => onOpenReturnCheckIn(booking.assetTag)}
                        className="px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs ml-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Process Return</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
