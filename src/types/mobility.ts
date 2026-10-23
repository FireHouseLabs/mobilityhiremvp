export type EquipmentCategory = 
  | 'All'
  | 'Wheelchairs' 
  | 'Mobility Scooters' 
  | 'Walking Aids' 
  | 'Home Care & Beds' 
  | 'Bathroom & Hygiene' 
  | 'Ramps & Access';

export type UnitStatus = 'Available' | 'Reserved' | 'On Hire' | 'Overdue' | 'In Maintenance' | 'Cleaning';

export type BookingStatus = 'Confirmed' | 'Active' | 'Overdue' | 'Returned' | 'Cancelled';

export type PaymentMethod = 'Credit Card' | 'NDIS Plan Managed' | 'Home Care Package' | 'Pay on Pickup / Invoice';

export interface EquipmentModel {
  id: string;
  name: string;
  category: EquipmentCategory;
  shortDesc: string;
  image: string;
  dailyRate: number;
  weeklyRate: number;
  minHireDays: number;
  deposit: number;
  weightCapacityKg: number;
  itemWeightKg: number;
  keyFeatures: string[];
  dimensions: string;
  suitability: string;
  inclusions: string[];
}

export interface InventoryUnit {
  assetTag: string; // e.g. WH-101
  modelId: string;
  modelName: string;
  category: EquipmentCategory;
  serialNumber: string;
  status: UnitStatus;
  currentBookingId?: string;
  currentHirerName?: string;
  currentHirerPhone?: string;
  dueDate?: string; // YYYY-MM-DD
  notes?: string;
  location: 'Shop Showroom' | 'Main Warehouse' | 'On Customer Site' | 'Workshop';
  lastInspectedDate: string;
}

export interface RentalBooking {
  id: string; // e.g. MOB-8492
  createdAt: string;
  source: 'Online Public' | 'Shop Counter / Manual';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  ndisParticipantNumber?: string;
  modelId: string;
  modelName: string;
  assetTag: string; // Assigned unit tag
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  deliveryType: 'Shop Collection' | 'Home Delivery & Setup';
  deliveryFee: number;
  rentalFee: number;
  depositFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Pending Invoice' | 'Deposit Held';
  status: BookingStatus;
  notes?: string;
  overdueDays?: number;
  lastContactNote?: string;
  returnCondition?: 'Good - Clean' | 'Needs Cleaning' | 'Minor Wear' | 'Damaged / Repaired';
  returnProcessedDate?: string;
  checkedOutDate?: string;
}
