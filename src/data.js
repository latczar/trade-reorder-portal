// All data is made up. Company names, people and addresses are fictional.

export const CUSTOMER = {
  id: "C-1042",
  name: "Northgate Cafés Ltd",
  contact: "Sam Rivera",
  account: "NGC-1042",
  priceBand: "B",
  creditLimit: 5000,
  creditUsed: 1840.5,
  deliveryDays: [1, 3, 5], // Mon, Wed, Fri
  sites: ["Northgate Cafés, 14 Mill Lane", "Northgate Cafés, Unit 3 Riverside"],
};

export const CATEGORIES = ["Coffee & tea", "Disposables", "Cleaning", "Dairy & alternatives", "Bakery"];

// listPrice is per pack, excluding VAT. Band discounts apply on top.
export const PRODUCTS = [
  { sku: "CT-101", name: "House espresso beans", pack: "6 x 1 kg", category: "Coffee & tea", listPrice: 84.0, stock: 120, minQty: 1, vat: 0 },
  { sku: "CT-104", name: "Decaf espresso beans", pack: "2 x 1 kg", category: "Coffee & tea", listPrice: 32.5, stock: 18, minQty: 1, vat: 0 },
  { sku: "CT-210", name: "English breakfast tea bags", pack: "1,100 bags", category: "Coffee & tea", listPrice: 21.9, stock: 64, minQty: 1, vat: 0 },
  { sku: "CT-305", name: "Hot chocolate powder", pack: "6 x 1 kg", category: "Coffee & tea", listPrice: 41.0, stock: 0, minQty: 1, vat: 0 },
  { sku: "DS-001", name: "8oz double-wall cups", pack: "500 cups", category: "Disposables", listPrice: 38.75, stock: 300, minQty: 2, vat: 20 },
  { sku: "DS-002", name: "12oz double-wall cups", pack: "500 cups", category: "Disposables", listPrice: 44.2, stock: 260, minQty: 2, vat: 20 },
  { sku: "DS-010", name: "Sip lids, 8oz", pack: "1,000 lids", category: "Disposables", listPrice: 19.4, stock: 410, minQty: 1, vat: 20 },
  { sku: "DS-011", name: "Sip lids, 12oz", pack: "1,000 lids", category: "Disposables", listPrice: 21.1, stock: 9, minQty: 1, vat: 20 },
  { sku: "DS-040", name: "Kraft napkins", pack: "4,000 napkins", category: "Disposables", listPrice: 27.0, stock: 75, minQty: 1, vat: 20 },
  { sku: "CL-200", name: "Food-safe surface sanitiser", pack: "2 x 5 L", category: "Cleaning", listPrice: 23.6, stock: 52, minQty: 1, vat: 20 },
  { sku: "CL-210", name: "Espresso machine cleaning tablets", pack: "100 tablets", category: "Cleaning", listPrice: 17.8, stock: 33, minQty: 1, vat: 20 },
  { sku: "CL-300", name: "Blue centrefeed rolls", pack: "6 rolls", category: "Cleaning", listPrice: 15.2, stock: 140, minQty: 1, vat: 20 },
  { sku: "DA-001", name: "Whole milk", pack: "6 x 2 L", category: "Dairy & alternatives", listPrice: 9.6, stock: 200, minQty: 2, vat: 0 },
  { sku: "DA-020", name: "Oat drink, barista", keywords: "oat milk", pack: "6 x 1 L", category: "Dairy & alternatives", listPrice: 13.9, stock: 88, minQty: 1, vat: 0 },
  { sku: "BK-100", name: "All-butter croissants, frozen", pack: "60 pieces", category: "Bakery", listPrice: 36.4, stock: 40, minQty: 1, vat: 0 },
  { sku: "BK-120", name: "Pain au chocolat, frozen", pack: "50 pieces", category: "Bakery", listPrice: 34.9, stock: 22, minQty: 1, vat: 0 },
];

export const BAND_DISCOUNT = { A: 0.12, B: 0.08, C: 0.04, D: 0 };

// Seed order history. Channel shows how the order arrived, which feeds the digital-share figure.
export const SEED_ORDERS = [
  { id: "SO-20481", date: "2026-10-20", po: "NG-0931", site: 0, channel: "portal", status: "Delivered", erp: "synced",
    lines: [{ sku: "CT-101", qty: 2 }, { sku: "DS-002", qty: 4 }, { sku: "DS-011", qty: 2 }, { sku: "DA-001", qty: 6 }] },
  { id: "SO-20377", date: "2026-10-13", po: "NG-0918", site: 0, channel: "email", status: "Delivered", erp: "synced",
    lines: [{ sku: "CT-101", qty: 2 }, { sku: "DS-002", qty: 4 }, { sku: "CL-200", qty: 1 }, { sku: "DA-020", qty: 3 }] },
  { id: "SO-20290", date: "2026-10-06", po: "NG-0902", site: 1, channel: "phone", status: "Delivered", erp: "synced",
    lines: [{ sku: "BK-100", qty: 2 }, { sku: "BK-120", qty: 1 }, { sku: "DS-040", qty: 1 }] },
  { id: "SO-20201", date: "2026-09-29", po: "NG-0889", site: 0, channel: "portal", status: "Delivered", erp: "synced",
    lines: [{ sku: "CT-101", qty: 2 }, { sku: "DS-001", qty: 2 }, { sku: "DS-010", qty: 1 }, { sku: "DA-001", qty: 6 }] },
];

// Account-wide order counts by channel for the insight page (all customers, this month).
export const CHANNEL_MIX = { portal: 612, email: 241, phone: 118, rep: 54 };
export const DIGITAL_TARGET = 0.9;
