import { addDays, todayDate, quote } from '../../lib/rentals';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { EquipmentModel, RentalBooking, PaymentMethod } from '../../types/mobility';
import { useMobilityStore } from '../../context/MobilityStore';
import { 
  X, 
  Calendar, 
  Truck, 
  Store, 
  CreditCard, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  ChevronRight, 
  Info,
  Clock,
  Weight,
  Layers,
  FileText,
  Printer
} from 'lucide-react';

interface EquipmentBookingModalProps {
  model: EquipmentModel;
  onClose: () => void;
}

export const EquipmentBookingModal: React.FC<EquipmentBookingModalProps> = ({ model, onClose }) => {
  const { createPublicBooking, getAvailableUnitsForModel } = useMobilityStore();

  const [error, setError] = useState('');
  const [step, setStep] = useState<'configure' | 'checkout' | 'confirmed'>('configure');
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [step]);
  
  // Dates
  const todayStr = useMemo(() => todayDate(), []);
  const defaultEndStr = useMemo(() => addDays(todayStr, 7), [todayStr]);

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [deliveryType, setDeliveryType] = useState<'Shop Collection' | 'Home Delivery & Setup'>('Shop Collection');

  // Customer Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [ndisNumber, setNdisNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Result
  const [createdBooking, setCreatedBooking] = useState<RentalBooking | null>(null);



  const availableUnits = getAvailableUnitsForModel(model.id);

  const dateError = !startDate || startDate < todayStr ? 'Choose today or a future start date.' : !endDate || endDate < addDays(startDate, model.minHireDays) ? `Minimum hire is ${model.minHireDays} days. Choose a later return date.` : '';
  const { durationDays, rentalFee, deliveryFee, depositFee, totalAmount } = useMemo(() => {
    try { return quote(model, startDate, endDate, deliveryType); }
    catch { return { durationDays: 0, rentalFee: 0, deliveryFee: 0, depositFee: model.deposit, totalAmount: 0 }; }
  }, [model, startDate, endDate, deliveryType]);
  const calculationNote = 'Weekly rate applied where it saves you money';

  const handleProceedToCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('checkout');
  };

  const handleCompleteBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !email) {
      alert('Please fill in your name, phone number, and email.');
      return;
    }

    setError('');
    if (dateError || !agreedToTerms) { setError(dateError || 'Please accept the hire terms.'); return; }
    try {
    const newBooking = createPublicBooking({
      modelId: model.id,
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      customerAddress: streetAddress,
      ndisParticipantNumber: paymentMethod === 'NDIS Plan Managed' ? ndisNumber : undefined,
      startDate,
      endDate,
      durationDays,
      deliveryType,
      deliveryFee,
      rentalFee,
      depositFee,
      totalAmount,
      paymentMethod,
      notes: notes || undefined
    });

    setCreatedBooking(newBooking);
    setStep('confirmed');
    } catch (e) { setError((e as Error).message); }
  };

  const handleTestAutofill = () => {
    setFullName('Claire Henderson');
    setPhone('0419 283 711');
    setEmail('claire.henderson@example.com');
    setStreetAddress('48 Barkly Street, St Kilda VIC 3182');
    setNotes('Please ensure footrests are set for 165cm height.');
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Book equipment" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div ref={scrollRef} className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-teal-600 tracking-wider">
                Hire Booking
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                Step {step === 'configure' ? '1 of 2' : step === 'checkout' ? '2 of 2' : 'Confirmed'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {model.name}
            </h3>
          </div>

          <button
            aria-label="Close dialog" onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p role="alert" className="mx-5 mt-4 text-sm text-red-700">{error}</p>}
        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {step === 'configure' && (
            <div className="space-y-6">
              {/* Image & Quick Specs banner */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={model.image}
                  alt={model.name}
                  className="w-full sm:w-36 h-28 object-contain p-2 bg-white rounded-lg border border-slate-200 shrink-0"
                />
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">{model.suitability}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                    <div>
                      <span className="text-slate-400">Max User Weight: </span>
                      <strong className="text-slate-800">{model.weightCapacityKg}kg</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Item Weight: </span>
                      <strong className="text-slate-800">{model.itemWeightKg}kg</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Dimensions: </span>
                      <span className="text-slate-700">{model.dimensions}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-emerald-700 font-medium">
                      ✓ {availableUnits.length} physical units currently ready in depot
                    </span>
                  </div>
                </div>
              </div>

              {/* Hire Dates Configuration */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Select Hire Duration
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="field-EquipmentBookingModal-1" className="block text-xs font-medium text-slate-700 mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input id="field-EquipmentBookingModal-1"
                        type="date"
                        min={todayStr}
                        value={startDate}
                        onInput={(e) => { const value = e.currentTarget.value; setStartDate(value); if(value && endDate < addDays(value, model.minHireDays)) setEndDate(addDays(value, model.minHireDays)); }}
                        onChange={(e) => { setStartDate(e.target.value); if(e.target.value && endDate < addDays(e.target.value, model.minHireDays)) setEndDate(addDays(e.target.value, model.minHireDays)); }}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="field-EquipmentBookingModal-2" className="block text-xs font-medium text-slate-700 mb-1">
                      Return Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input id="field-EquipmentBookingModal-2"
                        type="date"
                        min={addDays(startDate, model.minHireDays)}
                        value={endDate}
                        onInput={(e) => setEndDate(e.currentTarget.value)}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                  <span>Minimum Hire: {model.minHireDays} days</span>
                  <span className="font-semibold text-slate-800">
                    Calculated: {durationDays} Days ({calculationNote})
                  </span>
                </div>
              </div>

              {/* Delivery Option */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Collection or Delivery
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" aria-pressed={deliveryType === 'Shop Collection'}
                    onClick={() => setDeliveryType('Shop Collection')}
                    className={`text-left p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      deliveryType === 'Shop Collection'
                        ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-900">Shop Collection</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700">FREE</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Collect from 142 Mobility Way, Central Depot. Open Mon-Sat 8:30am - 5pm.
                    </p>
                  </button>

                  <button type="button" aria-pressed={deliveryType === 'Home Delivery & Setup'}
                    onClick={() => setDeliveryType('Home Delivery & Setup')}
                    className={`text-left p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      deliveryType === 'Home Delivery & Setup'
                        ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-bold text-slate-900">Van Delivery & Setup</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900">+$35.00</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Professional delivery technician unpacks, fits, and demonstrates safe operation.
                    </p>
                  </button>
                </div>
              </div>

              {/* Inclusions List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Included with Rental
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  {model.inclusions.map((inc, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Equipment Hire Fee ({durationDays} days):</span>
                  <span>${rentalFee.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Specialist Van Delivery & Demonstration:</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1">
                    <span>Refundable Security Deposit:</span>
                    <span title="Returned immediately upon return inspection">
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                  </span>
                  <span>${depositFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="text-sm font-semibold text-white">Total Amount Due</span>
                    <p className="text-[10px] text-teal-300">
                      Deposit is 100% refunded when equipment is returned in safe condition.
                    </p>
                  </div>
                  <span className="text-xl font-bold text-teal-400">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {dateError && <p role="alert" className="text-sm text-amber-800">{dateError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!!dateError || availableUnits.length === 0}
                  onClick={() => { setError(''); setStep('checkout'); }}
                  className="px-5 py-2.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2"
                >
                  <span>Continue to Hirer Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'checkout' && (
            <form onSubmit={handleCompleteBooking} className="space-y-6">
              {/* Autofill Demo Button */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Try a sample customer</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestAutofill}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Autofill Sample Customer
                </button>
              </div>

              {/* Customer Contact */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Hirer & Contact Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="field-EquipmentBookingModal-3" className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input id="field-EquipmentBookingModal-3"
                      type="text"
                      required
                      placeholder="e.g. Eleanor Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="field-EquipmentBookingModal-4" className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Phone *
                    </label>
                    <input id="field-EquipmentBookingModal-4"
                      type="tel"
                      required
                      placeholder="e.g. 0412 883 912"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="field-EquipmentBookingModal-5" className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input id="field-EquipmentBookingModal-5"
                      type="email"
                      required
                      placeholder="e.g. name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {deliveryType === 'Home Delivery & Setup' && (
                    <div className="sm:col-span-2">
                      <label htmlFor="field-EquipmentBookingModal-6" className="block text-xs font-medium text-slate-700 mb-1">
                        Delivery Address *
                      </label>
                      <input id="field-EquipmentBookingModal-6"
                        type="text"
                        required
                        placeholder="Street address, suburb, postcode"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label htmlFor="field-EquipmentBookingModal-7" className="block text-xs font-medium text-slate-700 mb-1">
                      Specific Notes / Medical Requirements (optional)
                    </label>
                    <input id="field-EquipmentBookingModal-7"
                      type="text"
                      placeholder="e.g. Lift access on 2nd floor, extra leg rest..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Online Payment & Funding
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Credit Card')}
                    className={`p-3 rounded-lg border text-left text-xs font-medium transition-colors ${
                      paymentMethod === 'Credit Card'
                        ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600 font-bold text-slate-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Credit / Debit Card
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('NDIS Plan Managed')}
                    className={`p-3 rounded-lg border text-left text-xs font-medium transition-colors ${
                      paymentMethod === 'NDIS Plan Managed'
                        ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600 font-bold text-slate-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    NDIS / Plan Managed
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Pay on Pickup / Invoice')}
                    className={`p-3 rounded-lg border text-left text-xs font-medium transition-colors ${
                      paymentMethod === 'Pay on Pickup / Invoice'
                        ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600 font-bold text-slate-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Pay at Counter / Invoice
                  </button>
                </div>

                {paymentMethod === 'Credit Card' && <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">Demo card · Visa ending 4242<br /><span className="text-xs">Payment is simulated. No card details are needed and no money is charged.</span></div>}
                <button type="button" onClick={() => setPaymentMethod('Home Care Package')} className={`px-4 py-2 rounded-lg border text-xs ${paymentMethod === 'Home Care Package' ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}>Home Care Package</button>
                {paymentMethod !== 'Credit Card' && <p className="text-xs text-slate-500">Your booking will be reserved with payment pending. Staff can record payment at handover or leave it for invoicing.</p>}

                {paymentMethod === 'NDIS Plan Managed' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <label htmlFor="field-EquipmentBookingModal-8" className="block text-slate-700 font-medium">NDIS Participant Number *</label>
                    <input id="field-EquipmentBookingModal-8"
                      type="text"
                      placeholder="e.g. NDIS-430981920"
                      value={ndisNumber}
                      onChange={(e) => setNdisNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      required
                    />
                    <p className="text-[11px] text-slate-500">
                      Funding is recorded for staff invoicing. No invoice is sent in this demo.
                    </p>
                  </div>
                )}
              </div>

              {/* Agreement checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  required
                />
                <span>
                  I agree to the standard Mobility Hire terms, safe operational guidelines, and understand the <strong>${depositFee} security deposit</strong> will be released immediately upon equipment return inspection.
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep('configure')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900"
                >
                  ← Back to Dates
                </button>

                <button
                  type="submit"
                  disabled={!agreedToTerms}
                  className="px-6 py-2.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm demo booking (${totalAmount.toFixed(2)})</span>
                </button>
              </div>
            </form>
          )}

          {step === 'confirmed' && createdBooking && (
            <div className="space-y-6 py-2">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Rental Confirmed!</h4>
                <p className="text-xs text-slate-500">
                  Your equipment is reserved and awaiting collection or delivery. No email is sent in this demo.
                </p>
              </div>

              {/* Booking Voucher / Receipt Card */}
              <div className="print-area p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[11px] text-slate-400">Booking Reference</span>
                    <p className="text-base font-extrabold text-slate-900 font-mono">
                      {createdBooking.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Asset Allocated</span>
                    <p className="text-xs font-bold text-teal-700 font-mono">
                      {createdBooking.assetTag}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block">Equipment Model:</span>
                    <strong className="text-slate-900">{createdBooking.modelName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hirer Name:</span>
                    <strong className="text-slate-900">{createdBooking.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hire Period:</span>
                    <span>{createdBooking.startDate} to {createdBooking.endDate} ({createdBooking.durationDays} days)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Fulfillment:</span>
                    <span>{createdBooking.deliveryType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Payment Method:</span>
                    <span>{createdBooking.paymentMethod} · {createdBooking.paymentStatus} (demo)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Booking Total:</span>
                    <strong className="text-slate-900">${createdBooking.totalAmount.toFixed(2)}</strong> (inc ${createdBooking.depositFee} deposit)
                  </div>
                </div>

                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-[11px] space-y-1">
                  <p className="font-semibold">Next Steps:</p>
                  <p>
                    {createdBooking.deliveryType === 'Shop Collection'
                      ? 'You can collect your sanitized equipment from 142 Mobility Way, Central Depot. Please bring photo ID.'
                      : `Our dispatch driver will deliver the equipment to ${createdBooking.customerAddress || 'your address'} on ${createdBooking.startDate}.`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-400">
                  Tip: Switch to <strong>In-store management</strong> to fulfil this reservation from the daily overview.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print booking</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
