import test from 'node:test';
import assert from 'node:assert/strict';
import { freshDemo, quote, createLoan, checkout, checkIn, cancel, extend, refreshOverdue, addDays, todayDate } from '../src/lib/rentals';
import { INITIAL_EQUIPMENT_MODELS } from '../src/data/mockData';
const today = '2026-10-21';
const model = INITIAL_EQUIPMENT_MODELS[0];
const input = { modelId: model.id, customerName: 'Demo hirer', customerEmail: 'demo@example.com', customerPhone: '0400 123 456', startDate: today, endDate: addDays(today, 7), deliveryType: 'Shop Collection' as const, paymentMethod: 'Credit Card' as const };

test('seed data has linked contracts, ready stock, and a reservation ready to fulfil', () => {
  for (const date of [today, '2027-03-01', '2028-02-29']) {
    const state = freshDemo(date);
    assert.equal(new Set(state.inventory.map(u => u.assetTag)).size, state.inventory.length);
    assert.equal(new Set(state.bookings.map(b => b.id)).size, state.bookings.length);
    for (const unit of state.inventory.filter(u => u.currentBookingId)) {
      const b = state.bookings.find(b => b.id === unit.currentBookingId);
      assert.ok(b, `Missing booking for ${unit.assetTag}`);
      assert.equal(b.assetTag, unit.assetTag);
      assert.equal(b.endDate, unit.dueDate);
      assert.equal(b.customerName, unit.currentHirerName);
    }
    assert.ok(state.inventory.some(u => u.modelId === model.id && u.status === 'Available'));
    assert.ok(state.bookings.some(b => b.status === 'Confirmed' && b.startDate === date));
    assert.ok(state.bookings.some(b => b.status === 'Overdue'));
  }
});
test('rental quote enforces dates and minimum periods and caps at weekly rate', () => {
  assert.throws(() => quote(model, today, today, 'Shop Collection'));
  assert.throws(() => quote(model, today, '2026-10-20', 'Shop Collection'));
  assert.throws(() => quote(model, '', '', 'Shop Collection'));
  assert.equal(quote(model, today, addDays(today, 6), 'Shop Collection').rentalFee, model.weeklyRate);
  const q = quote(model, today, addDays(today, 7), 'Home Delivery & Setup');
  assert.equal(q.durationDays, 7);
  assert.equal(q.totalAmount, model.weeklyRate + model.deposit + 35);
});
test('online reservation, checkout, check-in and rehire remain in sync', () => {
  const created = createLoan(freshDemo(today), input, false, today);
  const b = created.booking;
  assert.equal(b.status, 'Confirmed');
  assert.equal(created.state.inventory.find(u => u.assetTag === b.assetTag)?.status, 'Reserved');
  let state = checkout(created.state, b.id, b.assetTag, true, today);
  assert.equal(state.bookings[0].status, 'Active');
  assert.equal(state.inventory.find(u => u.assetTag === b.assetTag)?.location, 'On Customer Site');
  assert.throws(() => checkout(state, b.id, b.assetTag, true, today));
  state = checkIn(state, b.id, b.assetTag, 'Good - Clean', 'Available', 'All accessories returned', today);
  assert.equal(state.bookings[0].status, 'Returned');
  assert.equal(state.inventory.find(u => u.assetTag === b.assetTag)?.currentBookingId, undefined);
  assert.throws(() => checkIn(state, b.id, b.assetTag, 'Good - Clean', 'Available', '', today));
  const rehired = createLoan(state, { ...input, assetTag: b.assetTag, paymentStatus: 'Deposit Held' }, true, today);
  assert.equal(rehired.booking.status, 'Active');
  assert.equal(rehired.booking.paymentStatus, 'Deposit Held');
  assert.notEqual(rehired.booking.id, b.id);
});
test('stock exhaustion blocks additional online and counter bookings', () => {
  const created = createLoan(freshDemo(today), input, false, today);
  assert.throws(() => createLoan(created.state, input, false, today), /No ready units/);
  assert.throws(() => createLoan(created.state, { ...input, assetTag: created.booking.assetTag }, true, today), /No ready units/);
});
test('cancelling a reservation releases its unit without touching another loan', () => {
  const created = createLoan(freshDemo(today), input, false, today);
  const state = cancel(created.state, created.booking.id);
  assert.equal(state.bookings[0].status, 'Cancelled');
  assert.equal(state.inventory.find(u => u.assetTag === created.booking.assetTag)?.status, 'Available');
  assert.throws(() => checkout(state, created.booking.id, created.booking.assetTag, true, today));
  assert.throws(() => cancel(state, created.booking.id));
});
test('checkout can reassign a ready unit and releases original reservation', () => {
  const state = freshDemo(today);
  const b = state.bookings.find(b => b.status === 'Confirmed')!;
  const unit = state.inventory.find(u => u.modelId === b.modelId && u.status === 'Available')!;
  const checked = checkout(state, b.id, unit.assetTag, false, today);
  assert.equal(checked.inventory.find(u => u.assetTag === b.assetTag)?.status, 'Available');
  assert.equal(checked.bookings.find(x => x.id === b.id)?.assetTag, unit.assetTag);
  assert.equal(checked.bookings.find(x => x.id === b.id)?.paymentStatus, 'Pending Invoice');
});
test('future and expired reservations cannot check out', () => {
  const created = createLoan(freshDemo(today), { ...input, startDate: addDays(today, 1), endDate: addDays(today, 8) }, false, today);
  assert.throws(() => checkout(created.state, created.booking.id, created.booking.assetTag, true, today), /future/);
  assert.throws(() => checkout(created.state, created.booking.id, created.booking.assetTag, true, addDays(today, 9)), /return date/);
});
test('funding methods leave online payment pending', () => {
  for (const paymentMethod of ['NDIS Plan Managed', 'Home Care Package', 'Pay on Pickup / Invoice'] as const) {
    const created = createLoan(freshDemo(today), { ...input, paymentMethod, ndisParticipantNumber: '123456789' }, false, today);
    assert.equal(created.booking.paymentStatus, 'Pending Invoice');
  }
});
test('customer, delivery, NDIS and counter-date validation prevents incomplete loans', () => {
  assert.throws(() => createLoan(freshDemo(today), { ...input, customerName: ' ' }, false, today));
  assert.throws(() => createLoan(freshDemo(today), { ...input, customerEmail: 'bad-email' }, false, today));
  assert.throws(() => createLoan(freshDemo(today), { ...input, deliveryType: 'Home Delivery & Setup' }, false, today), /address/);
  assert.throws(() => createLoan(freshDemo(today), { ...input, paymentMethod: 'NDIS Plan Managed' }, false, today), /NDIS/);
  assert.throws(() => createLoan(freshDemo(today), { ...input, startDate: addDays(today, 1) }, true, today), /today/);
});
test('extensions recalculate totals and resolve overdue unit and booking together', () => {
  const state = freshDemo(today);
  const b = state.bookings.find(b => b.status === 'Overdue')!;
  const next = extend(state, b.id, 14, today);
  const updated = next.bookings.find(x => x.id === b.id)!;
  assert.equal(updated.endDate, addDays(b.endDate, 14));
  assert.equal(updated.status, 'Active');
  assert.equal(updated.overdueDays, 0);
  assert.equal(updated.paymentStatus, 'Pending Invoice');
  assert.equal(updated.rentalFee, quote(model, updated.startDate, updated.endDate, updated.deliveryType).rentalFee);
  assert.equal(updated.totalAmount, updated.rentalFee + updated.depositFee + updated.deliveryFee);
  assert.equal(next.inventory.find(u => u.assetTag === b.assetTag)?.dueDate, updated.endDate);
  assert.equal(next.inventory.find(u => u.assetTag === b.assetTag)?.status, 'On Hire');
  assert.throws(() => extend(state, b.id, -1, today));
  const pending = state.bookings.find(b => b.status === 'Confirmed')!;
  assert.throws(() => extend(state, pending.id, 7, today));
});
test('dirty and damaged returns cannot become bookable before treatment', () => {
  const created = createLoan(freshDemo(today), { ...input, assetTag: 'WH-104' }, true, today);
  const b = created.booking;
  assert.throws(() => checkIn(created.state, b.id, b.assetTag, 'Damaged / Repaired', 'Available', '', today));
  assert.throws(() => checkIn(created.state, b.id, b.assetTag, 'Needs Cleaning', 'Available', '', today));
  const dirty = checkIn(created.state, b.id, b.assetTag, 'Needs Cleaning', 'Cleaning', '', today);
  assert.equal(dirty.inventory.find(u => u.assetTag === b.assetTag)?.status, 'Cleaning');
  const damaged = checkIn(created.state, b.id, b.assetTag, 'Damaged / Repaired', 'In Maintenance', '', today);
  assert.equal(damaged.inventory.find(u => u.assetTag === b.assetTag)?.location, 'Workshop');
});
test('overdue status follows Melbourne calendar dates and survives JSON persistence', () => {
  assert.match(todayDate(), /^\d{4}-\d{2}-\d{2}$/);
  const state = JSON.parse(JSON.stringify(freshDemo(today)));
  const b = state.bookings.find((b: { status: string }) => b.status === 'Active');
  const next = refreshOverdue(state, addDays(b.endDate, 1));
  assert.equal(next.bookings.find(x => x.id === b.id)?.overdueDays, 1);
  assert.equal(next.inventory.find(u => u.assetTag === b.assetTag)?.status, 'Overdue');
});
