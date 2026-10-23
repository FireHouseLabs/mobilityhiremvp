import { INITIAL_BOOKINGS, INITIAL_EQUIPMENT_MODELS, INITIAL_INVENTORY_UNITS } from '../data/mockData';
import type { EquipmentModel, InventoryUnit, RentalBooking } from '../types/mobility';

export interface DemoState { inventory: InventoryUnit[]; bookings: RentalBooking[] }
export type LoanInput = Pick<RentalBooking, 'modelId' | 'customerName' | 'customerEmail' | 'customerPhone' | 'startDate' | 'endDate' | 'deliveryType' | 'paymentMethod'> & Partial<Pick<RentalBooking, 'customerAddress' | 'ndisParticipantNumber' | 'notes' | 'paymentStatus' | 'assetTag'>>;
export const todayDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
export const daysBetween = (start: string, end: string) => Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
export function quote(model: EquipmentModel, start: string, end: string, delivery: string) {
  const durationDays = daysBetween(start, end);
  if (!Number.isFinite(durationDays) || durationDays < model.minHireDays) throw new Error(`Choose a return date at least ${model.minHireDays} days after the start date.`);
  const rentalFee = Math.floor(durationDays / 7) * model.weeklyRate + Math.min((durationDays % 7) * model.dailyRate, model.weeklyRate);
  const deliveryFee = delivery === 'Home Delivery & Setup' ? 35 : 0;
  return { durationDays, rentalFee, deliveryFee, depositFee: model.deposit, totalAmount: rentalFee + deliveryFee + model.deposit };
}
export function createLoan(state: DemoState, params: LoanInput, manual = false, today = todayDate()) {
  const model = INITIAL_EQUIPMENT_MODELS.find(m => m.id === params.modelId);
  if (!model) throw new Error('Select an equipment model.');
  if (!params.customerName.trim() || !params.customerPhone.trim()) throw new Error('Enter the customer name and phone number.');
  if (!manual && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.customerEmail)) throw new Error('Enter a valid email address.');
  if (params.startDate < today) throw new Error('Choose today or a future start date.');
  if (manual && params.startDate !== today) throw new Error('Counter loans check out today. Use an online reservation for a future date.');
  if (params.deliveryType === 'Home Delivery & Setup' && !params.customerAddress?.trim()) throw new Error('Enter a delivery address.');
  if (!manual && params.paymentMethod === 'NDIS Plan Managed' && !params.ndisParticipantNumber?.trim()) throw new Error('Enter the NDIS participant number.');
  const pricing = quote(model, params.startDate, params.endDate, params.deliveryType);
  const unit = state.inventory.find(u => u.modelId === model.id && u.status === 'Available' && (!manual || u.assetTag === params.assetTag));
  if (!unit) throw new Error('No ready units remain for this equipment. Please choose another model.');
  const id = `MOB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const booking: RentalBooking = { ...params, ...pricing, id, createdAt: today, modelName: model.name, assetTag: unit.assetTag, source: manual ? 'Shop Counter / Manual' : 'Online Public', status: manual ? 'Active' : 'Confirmed', checkedOutDate: manual ? today : undefined, paymentStatus: manual ? params.paymentStatus || 'Paid' : params.paymentMethod === 'Credit Card' ? 'Paid' : 'Pending Invoice' };
  const next: DemoState = { bookings: [booking, ...state.bookings], inventory: state.inventory.map(u => u.assetTag === unit.assetTag ? { ...u, status: manual ? 'On Hire' : 'Reserved', currentBookingId: id, currentHirerName: booking.customerName, currentHirerPhone: booking.customerPhone, dueDate: booking.endDate, location: manual ? 'On Customer Site' : u.location } : u) };
  return { state: next, booking };
}
export function refreshOverdue(state: DemoState, today = todayDate()): DemoState {
  const bookings = state.bookings.map(b => b.status === 'Active' || b.status === 'Overdue' ? { ...b, status: b.endDate < today ? 'Overdue' as const : 'Active' as const, overdueDays: Math.max(0, daysBetween(b.endDate, today)) } : b);
  return { bookings, inventory: state.inventory.map(u => {
    const b = bookings.find(b => b.id === u.currentBookingId);
    return b && (b.status === 'Active' || b.status === 'Overdue') ? { ...u, status: b.status === 'Overdue' ? 'Overdue' as const : 'On Hire' as const, dueDate: b.endDate, currentHirerName: b.customerName, currentHirerPhone: b.customerPhone, location: 'On Customer Site' as const } : u;
  }) };
}
export function freshDemo(today = todayDate()): DemoState {
  const shift = (d: string) => addDays(d, daysBetween('2026-10-13', today));
  const bookings: RentalBooking[] = INITIAL_BOOKINGS.map(b => ({ ...b, createdAt: shift(b.createdAt), startDate: shift(b.startDate), endDate: shift(b.endDate), returnProcessedDate: b.returnProcessedDate ? shift(b.returnProcessedDate) : undefined }));
  const inventory = INITIAL_INVENTORY_UNITS.map(u => ({ ...u, lastInspectedDate: shift(u.lastInspectedDate), dueDate: u.dueDate ? shift(u.dueDate) : undefined }));
  // Every outstanding asset needs a contract so staff can check it back in.
  inventory.filter(u => u.currentBookingId && !bookings.some(b => b.id === u.currentBookingId)).forEach(u => {
    const model = INITIAL_EQUIPMENT_MODELS.find(m => m.id === u.modelId)!;
    const endDate = u.dueDate || addDays(today, 7);
    const startDate = addDays(endDate, -14);
    bookings.push({ id: u.currentBookingId!, createdAt: startDate, source: 'Shop Counter / Manual', customerName: u.currentHirerName || 'Demo customer', customerPhone: u.currentHirerPhone || '0400 000 000', customerEmail: 'customer@example.com', modelId: u.modelId, modelName: u.modelName, assetTag: u.assetTag, startDate, endDate, ...quote(model, startDate, endDate, 'Shop Collection'), deliveryType: 'Shop Collection', paymentMethod: 'Credit Card', paymentStatus: 'Paid', status: 'Active' });
  });
  const unit = inventory.find(u => u.status === 'Available')!;
  const model = INITIAL_EQUIPMENT_MODELS.find(m => m.id === unit.modelId)!;
  const pending: RentalBooking = { id: 'MOB-4001', createdAt: today, source: 'Online Public', customerName: 'Claire Henderson', customerEmail: 'claire.henderson@example.com', customerPhone: '0419 283 711', modelId: model.id, modelName: model.name, assetTag: unit.assetTag, startDate: today, endDate: addDays(today, 7), ...quote(model, today, addDays(today, 7), 'Shop Collection'), deliveryType: 'Shop Collection', paymentMethod: 'Pay on Pickup / Invoice', paymentStatus: 'Pending Invoice', status: 'Confirmed', notes: 'Online reservation awaiting collection.' };
  // Keep an immediately bookable unit in the first catalogue category.
  const other = inventory.find(u => u.modelId === model.id && u.status === 'Available' && u.assetTag !== unit.assetTag);
  if (!other) inventory.push({ ...unit, assetTag: 'WH-104', serialNumber: 'TW-DEMO-104', status: 'Available' });
  return refreshOverdue({ inventory: inventory.map(u => u.assetTag === unit.assetTag ? { ...u, status: 'Reserved', currentBookingId: pending.id, currentHirerName: pending.customerName, currentHirerPhone: pending.customerPhone, dueDate: pending.endDate } : u), bookings: [pending, ...bookings] }, today);
}
export function releaseUnit(u: InventoryUnit): InventoryUnit {
  return { ...u, status: 'Available', currentBookingId: undefined, currentHirerName: undefined, currentHirerPhone: undefined, dueDate: undefined, location: 'Shop Showroom' };
}
export function checkout(state: DemoState, id: string, tag: string, paid: boolean, today = todayDate()): DemoState {
  const b = state.bookings.find(b => b.id === id);
  const u = state.inventory.find(u => u.assetTag === tag);
  if (!b || b.status !== 'Confirmed') throw new Error('This reservation is no longer awaiting checkout.');
  if (b.startDate > today) throw new Error('This reservation starts in the future. Check out on its start date.');
  if (b.endDate <= today) throw new Error('The return date has passed. Cancel this reservation and create a new loan.');
  if (!u || u.modelId !== b.modelId || !(u.status === 'Available' || (u.status === 'Reserved' && u.currentBookingId === id))) throw new Error('Choose a ready unit for this equipment model.');
  return refreshOverdue({ bookings: state.bookings.map(x => x.id === id ? { ...x, assetTag: tag, status: 'Active', checkedOutDate: today, paymentStatus: paid ? 'Paid' : x.paymentStatus } : x), inventory: state.inventory.map(x => x.assetTag === tag ? { ...x, status: 'On Hire', currentBookingId: id, currentHirerName: b.customerName, currentHirerPhone: b.customerPhone, dueDate: b.endDate, location: 'On Customer Site' } : x.currentBookingId === id ? releaseUnit(x) : x) }, today);
}
export function cancel(state: DemoState, id: string): DemoState {
  const b = state.bookings.find(b => b.id === id);
  if (!b || b.status !== 'Confirmed') throw new Error('Only reservations awaiting checkout can be cancelled.');
  return { bookings: state.bookings.map(x => x.id === id ? { ...x, status: 'Cancelled', notes: `${x.notes || ''} | Reservation cancelled. Any payment refund is simulated.` } : x), inventory: state.inventory.map(u => u.currentBookingId === id ? releaseUnit(u) : u) };
}
export function extend(state: DemoState, id: string, days: number, today = todayDate()): DemoState {
  const b = state.bookings.find(b => b.id === id);
  if (!b || !['Active', 'Overdue'].includes(b.status) || !Number.isInteger(days) || days <= 0) throw new Error('Choose a positive number of days for an outstanding loan.');
  const model = INITIAL_EQUIPMENT_MODELS.find(m => m.id === b.modelId)!;
  const endDate = addDays(b.endDate, days);
  const pricing = quote(model, b.startDate, endDate, b.deliveryType);
  return refreshOverdue({ inventory: state.inventory, bookings: state.bookings.map(x => x.id === id ? { ...x, ...pricing, endDate, paymentStatus: pricing.rentalFee > b.rentalFee ? 'Pending Invoice' : x.paymentStatus, lastContactNote: `Extended by ${days} days on ${today}. Additional hire: $${(pricing.rentalFee - b.rentalFee).toFixed(2)} (demo invoice).` } : x) }, today);
}
export function checkIn(state: DemoState, id: string, tag: string, condition: NonNullable<RentalBooking['returnCondition']>, nextStatus: 'Available' | 'Cleaning' | 'In Maintenance', notes?: string, today = todayDate()): DemoState {
  const b = state.bookings.find(b => b.id === id);
  const u = state.inventory.find(u => u.assetTag === tag);
  if (!b || !['Active', 'Overdue'].includes(b.status) || b.assetTag !== tag || u?.currentBookingId !== id) throw new Error('This equipment is no longer on this loan.');
  if (condition === 'Damaged / Repaired' && nextStatus !== 'In Maintenance') throw new Error('Damaged equipment must go to the workshop.');
  if (condition === 'Needs Cleaning' && nextStatus === 'Available') throw new Error('Complete cleaning before making this equipment available.');
  return { bookings: state.bookings.map(x => x.id === id ? { ...x, status: 'Returned', overdueDays: 0, returnCondition: condition, returnProcessedDate: today, notes: `${x.notes || ''} | Return: ${notes || condition}` } : x), inventory: state.inventory.map(x => x.assetTag === tag ? { ...releaseUnit(x), status: nextStatus, lastInspectedDate: today, location: nextStatus === 'In Maintenance' ? 'Workshop' : 'Shop Showroom', notes: notes || condition } : x) };
}
