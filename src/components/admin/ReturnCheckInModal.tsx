import React, { useState } from 'react';
import { useMobilityStore } from '../../context/MobilityStore';
import { RentalBooking, InventoryUnit } from '../../types/mobility';
import { X, CheckCircle, AlertCircle, Sparkles, Wrench, ShieldCheck } from 'lucide-react';

interface ReturnCheckInModalProps {
  booking?: RentalBooking;
  unit?: InventoryUnit;
  targetAssetTag?: string;
  onClose: () => void;
}

export const ReturnCheckInModal: React.FC<ReturnCheckInModalProps> = ({ booking, unit, targetAssetTag, onClose }) => {
  const { processReturn, bookings, inventory } = useMobilityStore();

  // Resolve matching booking or unit
  const effectiveTag = targetAssetTag || unit?.assetTag || booking?.assetTag;
  const targetBooking = booking || bookings.find(b => b.assetTag === effectiveTag && (b.status === 'Active' || b.status === 'Overdue'));
  const targetUnit = unit || inventory.find(u => u.assetTag === effectiveTag);

  const [error, setError] = useState('');
  const [condition, setCondition] = useState<'Good - Clean' | 'Needs Cleaning' | 'Minor Wear' | 'Damaged / Repaired'>('Good - Clean');
  const [nextStatus, setNextStatus] = useState<'Available' | 'Cleaning' | 'In Maintenance'>('Available');
  const [depositAction, setDepositAction] = useState<'Refund 100%' | 'Deduct Cleaning Fee ($25)' | 'Hold for Damage Assessment'>('Refund 100%');
  const [notes, setNotes] = useState('');

  if (!targetUnit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bookingId = targetBooking ? targetBooking.id : 'MANUAL-RETURN';
    try {
    processReturn(
      bookingId,
      targetUnit.assetTag,
      condition,
      nextStatus,
      `${notes ? notes + ' | ' : ''}Deposit status: ${depositAction}`
    );
    onClose();
    } catch(e) { setError((e as Error).message); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Check in equipment" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
              Shop Staff Workflow
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Equipment Return & Inspection Check-In
            </h3>
          </div>
          <button
            aria-label="Close dialog" onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Target Asset Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 font-mono text-sm">{targetUnit.assetTag}</span>
              <span className="text-slate-500 font-mono">SN: {targetUnit.serialNumber}</span>
            </div>
            <p className="font-semibold text-slate-800">{targetUnit.modelName}</p>
            {targetBooking && (
              <p className="text-slate-500">
                Hirer: <strong className="text-slate-700">{targetBooking.customerName}</strong> ({targetBooking.customerPhone})
              </p>
            )}
          </div>

          {/* Condition Assessment */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">1. Physical & Operational Condition</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'Good - Clean', label: 'Good & Clean', sub: 'No damage, fully sanitised', targetStatus: 'Available' as const },
                { val: 'Needs Cleaning', label: 'Needs Sanitising', sub: 'Dirty wheels or upholstery', targetStatus: 'Cleaning' as const },
                { val: 'Minor Wear', label: 'Minor Scuffs', sub: 'Cosmetic wear within policy', targetStatus: 'Available' as const },
                { val: 'Damaged / Repaired', label: 'Damage Noted', sub: 'Requires technician repair', targetStatus: 'In Maintenance' as const },
              ].map(opt => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => {
                    setCondition(opt.val as any);
                    setNextStatus(opt.targetStatus);
                    setDepositAction(opt.val === 'Damaged / Repaired' ? 'Hold for Damage Assessment' : opt.val === 'Needs Cleaning' ? 'Deduct Cleaning Fee ($25)' : 'Refund 100%');
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    condition === opt.val
                      ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600 text-teal-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-bold">{opt.label}</p>
                  <p className="text-[10px] text-slate-500">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Next Unit Destination Status */}
          <div className="space-y-1.5">
            <label htmlFor="field-ReturnCheckInModal-1" className="block font-bold text-slate-700">2. Return Asset To Fleet Status</label>
            <select id="field-ReturnCheckInModal-1"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              <option disabled={condition === 'Needs Cleaning' || condition === 'Damaged / Repaired'} value="Available">Available (Ready for next customer rental)</option>
              <option disabled={condition === 'Damaged / Repaired'} value="Cleaning">Cleaning & Sanitization Bay</option>
              <option value="In Maintenance">Workshop / Mechanical Inspection</option>
            </select>
          </div>

          {/* Deposit Resolution */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">3. Security Deposit Action</label>
            <div className="space-y-1 text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="depositAction"
                  checked={depositAction === 'Refund 100%'}
                  onChange={() => setDepositAction('Refund 100%')}
                  className="text-teal-600"
                />
                <span>Refund 100% Full Security Deposit (${targetBooking?.depositFee || 50}) to customer card</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="depositAction"
                  checked={depositAction === 'Deduct Cleaning Fee ($25)'}
                  onChange={() => setDepositAction('Deduct Cleaning Fee ($25)')}
                  className="text-teal-600"
                />
                <span>Deduct $25 standard sanitization fee from deposit</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="depositAction"
                  checked={depositAction === 'Hold for Damage Assessment'}
                  onChange={() => setDepositAction('Hold for Damage Assessment')}
                  className="text-teal-600"
                />
                <span>Hold deposit pending repair assessment</span>
              </label>
            </div>
          </div>

          {/* Inspection Notes */}
          <div>
            <label htmlFor="field-ReturnCheckInModal-2" className="block font-bold text-slate-700 mb-1">Staff Check-in Notes</label>
            <input id="field-ReturnCheckInModal-2"
              type="text"
              placeholder="e.g. Battery charger and cushion returned together. All parts intact."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <p className="text-xs text-slate-500">Deposit actions are recorded for this demo. No funds are moved.</p>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Check-In & Finalize</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
