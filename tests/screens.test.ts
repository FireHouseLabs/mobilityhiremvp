import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
import { MobilityStoreProvider } from '../src/context/MobilityStore';
import { INITIAL_EQUIPMENT_MODELS } from '../src/data/mockData';
import { freshDemo } from '../src/lib/rentals';
import App from '../src/App';
import { AdminDashboard } from '../src/components/admin/AdminDashboard';
import { AllBookingsView } from '../src/components/admin/AllBookingsView';
import { EquipmentFleetView } from '../src/components/admin/EquipmentFleetView';
import { OverdueRentalsView } from '../src/components/admin/OverdueRentalsView';
import { CheckoutModal } from '../src/components/admin/CheckoutModal';
import { ReturnCheckInModal } from '../src/components/admin/ReturnCheckInModal';
import { ManualHireModal } from '../src/components/admin/ManualHireModal';
import { EquipmentBookingModal } from '../src/components/customer/EquipmentBookingModal';
import { LookupBookingModal } from '../src/components/customer/LookupBookingModal';
const noop = () => {};
const h = React.createElement;
const wrap = (element: React.ReactElement) => renderToStaticMarkup(h(MobilityStoreProvider, { children: element }));

test('public entry renders without storage, a backend, or browser globals', () => {
  const html = renderToStaticMarkup(h(App));
  assert.ok(html.includes('The support you need'));
  assert.ok(html.includes('Book equipment'));
  assert.ok(html.includes('In-store management'));
  assert.ok(!html.includes('NaN'));
});
test('all staff screens and workflow dialogs render with consistent seed data', () => {
  const state = freshDemo();
  const loan = state.bookings.find(b => b.status === 'Active')!;
  const screens = [
    h(AdminDashboard, { onOpenManualHire: noop, onOpenReturnCheckIn: noop, onOpenCheckout: noop }),
    h(AllBookingsView, { onOpenManualHire: noop, onOpenReturnCheckIn: noop, onOpenCheckout: noop }),
    h(EquipmentFleetView, { onOpenManualHire: noop, onOpenReturnCheckIn: noop }),
    h(OverdueRentalsView, { onOpenReturnCheckIn: noop }),
    h(CheckoutModal, { bookingId: 'MOB-4001', onClose: noop }),
    h(ReturnCheckInModal, { targetAssetTag: loan.assetTag, onClose: noop }),
    h(ManualHireModal, { isOpen: true, onClose: noop }),
    h(EquipmentBookingModal, { model: INITIAL_EQUIPMENT_MODELS[0], onClose: noop }),
    h(LookupBookingModal, { isOpen: true, onClose: noop }),
  ];
  for (const screen of screens) {
    const html = wrap(screen);
    assert.ok(html.length > 500);
    assert.ok(!html.includes('NaN'));
    assert.ok(!html.includes('undefined'));
  }
});
test('every catalogue image is bundled locally for static hosting', () => {
  for (const model of INITIAL_EQUIPMENT_MODELS) assert.ok(existsSync(`public${model.image}`), `Missing image for ${model.name}`);
});
