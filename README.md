# MobilityHire demo

A static, browser-only equipment booking and in-store loan management demo. No backend, API key, payment gateway, email service, or database is required.

## Run and publish

- `npm install`
- `npm run dev` for local development
- `npm run lint`, `npm test`, and `npm run build` to validate
- Publish the contents of `dist/` to a static host (Netlify, Vercel, Cloudflare Pages, or similar). Use `npm run build` as the build command and `dist` as the output directory. This build uses root-relative asset URLs; host it at a domain root.

## Suggested client walkthrough

1. Browse the public catalogue, filter equipment, and select **Book equipment**.
2. Choose dates and collection/delivery. Continue, use the sample customer, accept the terms, and confirm. Card payment is simulated; invoice and care-funding bookings remain pending payment.
3. Switch to **In-store management**. The online reservation appears under **Online bookings to fulfil**. Open checkout, confirm the equipment and handover checks, and record demo payment or leave for invoicing.
4. Create a **New counter loan** for a walk-in. It checks equipment out immediately, with today's start date.
5. Open **Loans & bookings** to inspect an agreement, extend an active loan, cancel a reservation, or check in equipment.
6. Check a returned item into cleaning or maintenance. In **Equipment pool**, mark it available after cleaning/repair to make it bookable again.
7. Use **Overdue** to log notes, simulate an SMS reminder, extend a loan, or process its return.
8. Use **Find my booking** on the public view with a reference, exact phone number, or email. Customers can cancel reservations awaiting handover.

Changes persist locally in this browser. Separate browsers/devices have separate demos; there is no shared account or login. The demo opens on the public catalogue. **Reset demo** restores sample data with dates relative to the current Melbourne date, including a reservation ready for checkout. Existing v1 prototype browser data is deliberately not imported.

Availability is conservative: a reservation holds one physical unit immediately until checkout or cancellation, including future reservations. It does not schedule multiple future bookings against a single unit. Return dates are exclusive: a 7-day loan starting on the 1st is due on the 8th. Minimum loan periods are enforced; weekly rates cap daily charges where cheaper.

Payments, invoice creation, refunds, and SMS are simulations only. No email or text is sent, and no funds are moved. Printing uses the browser's print/save-as-PDF dialog.
