import { todayDate, addDays, quote } from '../../lib/rentals';
import React, { useState, useMemo } from 'react';
import { useMobilityStore } from '../../context/MobilityStore';
import { PaymentMethod } from '../../types/mobility';
import { X, UserPlus, ShoppingBag, Calendar, CheckCircle2, Store, Truck, Sparkles } from 'lucide-react';

interface ManualHireModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualHireModal: React.FC<ManualHireModalProps> = ({ isOpen, onClose }) => {
  const { models, inventory, createManualHire } = useMobilityStore();

  const todayStr = useMemo(() => todayDate(), []);
  const defaultEndStr = useMemo(() => addDays(todayStr, 7), [todayStr]);

  const [error, setError] = useState('');
  // Form states
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id || '');
  const [selectedAssetTag, setSelectedAssetTag] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [ndisNumber, setNdisNumber] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [deliveryType, setDeliveryType] = useState<'Shop Collection' | 'Home Delivery & Setup'>('Shop Collection');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending Invoice' | 'Deposit Held'>('Paid');
  const [staffNotes, setStaffNotes] = useState('');

  // Find available units for selected model
  const availableUnitsForSelectedModel = useMemo(() => {
    return inventory.filter(u => u.modelId === selectedModelId && u.status === 'Available');
  }, [inventory, selectedModelId]);

  // Set default asset tag when model changes or available list changes
  React.useEffect(() => {
    if (availableUnitsForSelectedModel.length > 0) {
      setSelectedAssetTag(availableUnitsForSelectedModel[0].assetTag);
    } else {
      setSelectedAssetTag('');
    }
  }, [availableUnitsForSelectedModel]);

  const selectedModel = models.find(m => m.id === selectedModelId);

  const dateError = startDate !== todayStr ? 'Counter loans check out today. Use an online booking to reserve a future loan.' : !endDate || endDate < addDays(startDate, selectedModel?.minHireDays || 1) ? `Minimum hire is ${selectedModel?.minHireDays || 1} days.` : '';
  const { durationDays, rentalFee, deliveryFee, depositFee, totalAmount } = useMemo(() => {
    try { return quote(selectedModel!, startDate, endDate, deliveryType); }
    catch { return { durationDays: 0, rentalFee: 0, deliveryFee: 0, depositFee: 0, totalAmount: 0 }; }
  }, [selectedModel, startDate, endDate, deliveryType]);

  if (!isOpen) return null;

  const handleQuickFill = () => {
    setCustomerName('Robert Henderson');
    setCustomerPhone('0415 992 481');
    setCustomerEmail('robert.henderson@fastnet.com.au');
    setCustomerAddress('12 Kooyong Road, Caulfield North VIC');
    setStaffNotes('Driver license verified at shop counter. Extra seatbelt requested.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetTag) {
      alert('Please select an available equipment asset unit.');
      return;
    }
    if (!customerName || !customerPhone) {
      alert('Customer name and phone number are required.');
      return;
    }

    if(dateError) { setError(dateError); return; }
    try {
    createManualHire({
      modelId: selectedModelId,
      assetTag: selectedAssetTag,
      customerName,
      customerPhone,
      customerEmail: customerEmail || 'counter.walkin@mobilityhire.local',
      customerAddress: customerAddress || undefined,
      ndisParticipantNumber: ndisNumber || undefined,
      startDate,
      endDate,
      durationDays,
      deliveryType,
      deliveryFee,
      rentalFee,
      depositFee,
      totalAmount,
      paymentMethod,
      paymentStatus,
      notes: staffNotes || undefined
    });

    onClose();
    } catch(e) { setError((e as Error).message); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="New counter loan" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">
              Shop Staff Portal
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              New counter loan
            </h3>
          </div>
          <button
            aria-label="Close dialog" onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {error && <p role="alert" className="mx-5 mt-4 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs">
          {/* Quick sample populate */}
          <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-lg border border-slate-200">
            <span className="text-slate-600 font-medium">Demo customer</span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-100 text-teal-800 hover:bg-teal-200"
            >
              Autofill Walk-in Customer
            </button>
          </div>

          {/* Section 1: Equipment Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Select Equipment & Specific Inventory Asset
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="field-ManualHireModal-1" className="block text-xs font-medium text-slate-700 mb-1">
                  Equipment Model *
                </label>
                <select id="field-ManualHireModal-1"
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  {models.map(m => {
                    const avail = inventory.filter(u => u.modelId === m.id && u.status === 'Available').length;
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} ({avail} available)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assign Physical Asset Tag (Unit) *
                </label>
                {availableUnitsForSelectedModel.length === 0 ? (
                  <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                    No ready units currently available in depot.
                  </div>
                ) : (
                  <select
                    value={selectedAssetTag}
                    onChange={(e) => setSelectedAssetTag(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {availableUnitsForSelectedModel.map(u => (
                      <option key={u.assetTag} value={u.assetTag}>
                        {u.assetTag} (SN: {u.serialNumber} · Loc: {u.location})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Dates & Delivery */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Rental Duration & Fulfillment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="field-ManualHireModal-2" className="block text-xs font-medium text-slate-700 mb-1">
                  Hire Start Date *
                </label>
                <input id="field-ManualHireModal-2"
                  type="date"
                  min={todayStr}
                  max={todayStr}
                  value={startDate}
                  onInput={(e) => setStartDate(e.currentTarget.value)}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label htmlFor="field-ManualHireModal-3" className="block text-xs font-medium text-slate-700 mb-1">
                  Due Return Date *
                </label>
                <input id="field-ManualHireModal-3"
                  type="date"
                  min={addDays(startDate, selectedModel?.minHireDays || 1)}
                  value={endDate}
                  onInput={(e) => setEndDate(e.currentTarget.value)}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label htmlFor="field-ManualHireModal-4" className="block text-xs font-medium text-slate-700 mb-1">
                  Fulfillment Mode
                </label>
                <select id="field-ManualHireModal-4"
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Shop Collection">Shop Counter Collection (Free)</option>
                  <option value="Home Delivery & Setup">Van Delivery & Setup (+$35)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Customer Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Customer Information (Hirer)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="field-ManualHireModal-5" className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Full Name *
                </label>
                <input id="field-ManualHireModal-5"
                  type="text"
                  required
                  placeholder="e.g. Margaret Sullivan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label htmlFor="field-ManualHireModal-6" className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Phone Number *
                </label>
                <input id="field-ManualHireModal-6"
                  type="tel"
                  required
                  placeholder="e.g. 0412 345 678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label htmlFor="field-ManualHireModal-7" className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input id="field-ManualHireModal-7"
                  type="email"
                  placeholder="customer@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label htmlFor="field-ManualHireModal-8" className="block text-xs font-medium text-slate-700 mb-1">
                  NDIS Participant # (if applicable)
                </label>
                <input id="field-ManualHireModal-8"
                  type="text"
                  placeholder="e.g. NDIS-998822"
                  value={ndisNumber}
                  onChange={(e) => setNdisNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="field-ManualHireModal-9" className="block text-xs font-medium text-slate-700 mb-1">
                  {deliveryType === 'Home Delivery & Setup' ? 'Delivery address *' : 'Address (optional)'}
                </label>
                <input id="field-ManualHireModal-9"
                  type="text"
                  required={deliveryType === 'Home Delivery & Setup'}
                  placeholder="Street address, Suburb"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Payment & Accounting */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              4. Payment & Staff Notes
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="field-ManualHireModal-10" className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Method
                </label>
                <select id="field-ManualHireModal-10"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Credit Card">Credit / Debit Card EFTPOS</option>
                  <option value="NDIS Plan Managed">NDIS Plan Managed</option>
                  <option value="Home Care Package">Home Care Package Provider</option>
                  <option value="Pay on Pickup / Invoice">30-Day Commercial Invoice / Cash</option>
                </select>
              </div>

              <div>
                <label htmlFor="field-ManualHireModal-11" className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Status
                </label>
                <select id="field-ManualHireModal-11"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Paid">Paid in Full ($ {totalAmount.toFixed(2)})</option>
                  <option value="Deposit Held">Deposit Held Only ($ {depositFee})</option>
                  <option value="Pending Invoice">Pending Invoice / NDIS remittance</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="field-ManualHireModal-12" className="block text-xs font-medium text-slate-700 mb-1">
                  Staff Internal Rental Notes
                </label>
                <input id="field-ManualHireModal-12"
                  type="text"
                  placeholder="e.g. Identity ID checked, leg lifter accessory included free of charge"
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Calculation Strip */}
          <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-slate-400">Hire Fee: ${rentalFee.toFixed(2)} ({durationDays} days) · Bond: ${depositFee}</span>
              <p className="text-xs text-teal-300 font-semibold">Total Hire Value: ${totalAmount.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Assigned: {selectedAssetTag || 'None'}</span>
            </div>
          </div>

          {dateError && <p role="alert" className="text-sm text-amber-800">{dateError}</p>}
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedAssetTag || !!dateError}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg text-white shadow-sm flex items-center gap-1.5 ${
                selectedAssetTag
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Check Out Unit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
