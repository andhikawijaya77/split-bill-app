// Core Types for Split Bill App

export interface Person {
  id: string;
  name: string;
  color: string; // For UI differentiation
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number; // Pre-tax unit price
  finalUnitPrice: number; // Post-tax unit price
  totalPrice: number; // Final total for this item
}

export interface ItemSelection {
  itemId: string;
  personId: string;
  percentage: number; // 10-100%
  amount: number; // Calculated contribution
}

export interface Receipt {
  id: string;
  name: string; // e.g., "Padang Restaurant"
  createdAt: number;
  items: ReceiptItem[];
  taxRate?: number; // e.g., 0.10 for 10%
  serviceRate?: number; // e.g., 0.05 for 5%
  total: number;
  imageUrl?: string; // OCR source image
  paidBy?: string; // Person ID who paid this receipt
}

export interface Session {
  id: string;
  name: string; // e.g., "Dinner with Friends"
  createdAt: number;
  createdBy: string; // Person ID
  people: Person[];
  receipts: Receipt[];
  shareCode: string; // Short code for easy sharing
}

export interface PersonTotal {
  personId: string;
  personName: string;
  total: number;
  breakdown: {
    receiptId: string;
    receiptName: string;
    amount: number;
  }[];
}

export interface Settlement {
  from: string; // Person ID
  fromName: string;
  to: string; // Person ID
  toName: string;
  amount: number;
}

// Firebase document types
export interface SessionDoc {
  name: string;
  createdAt: number;
  createdBy: string;
  shareCode: string;
}

export interface PersonDoc {
  sessionId: string;
  name: string;
  color: string;
  joinedAt: number;
}

export interface ReceiptDoc {
  sessionId: string;
  name: string;
  createdAt: number;
  taxRate?: number;
  serviceRate?: number;
  total: number;
  imageUrl?: string;
  paidBy?: string; // Person ID who paid
}

export interface ItemDoc {
  receiptId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  finalUnitPrice: number;
  totalPrice: number;
  order: number; // For display ordering
}

export interface SelectionDoc {
  sessionId: string;
  receiptId: string;
  itemId: string;
  personId: string;
  percentage: number;
  amount: number;
  timestamp: number;
}
