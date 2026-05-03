import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { db } from './config';
import type {
  Session,
  SessionDoc,
  Person,
  PersonDoc,
  Receipt,
  ReceiptDoc,
  ReceiptItem,
  ItemDoc,
  ItemSelection,
  SelectionDoc,
} from '@/types';

// Generate random share code
export function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate random color for person
export function generatePersonColor(): string {
  const colors = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Create new session
export async function createSession(name: string, creatorName: string): Promise<string> {
  const sessionId = doc(collection(db, 'sessions')).id;
  const shareCode = generateShareCode();
  
  const sessionData: SessionDoc = {
    name,
    createdAt: Date.now(),
    createdBy: sessionId, // First person ID = session ID for simplicity
    shareCode,
  };
  
  await setDoc(doc(db, 'sessions', sessionId), sessionData);
  
  // Add creator as first person
  const personData: PersonDoc = {
    sessionId,
    name: creatorName,
    color: generatePersonColor(),
    joinedAt: Date.now(),
  };
  
  await setDoc(doc(db, 'people', sessionId), personData);
  
  return sessionId;
}

// Join session by share code
export async function joinSession(shareCode: string, personName: string): Promise<string | null> {
  const sessionsRef = collection(db, 'sessions');
  const q = query(sessionsRef, where('shareCode', '==', shareCode.toUpperCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const sessionId = querySnapshot.docs[0].id;
  const personId = doc(collection(db, 'people')).id;
  
  const personData: PersonDoc = {
    sessionId,
    name: personName,
    color: generatePersonColor(),
    joinedAt: Date.now(),
  };
  
  await setDoc(doc(db, 'people', personId), personData);
  
  return sessionId;
}

// Get session by ID
export async function getSession(sessionId: string): Promise<Session | null> {
  const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
  
  if (!sessionDoc.exists()) {
    return null;
  }
  
  const sessionData = sessionDoc.data() as SessionDoc;
  
  // Get all people in session
  const peopleRef = collection(db, 'people');
  const peopleQuery = query(peopleRef, where('sessionId', '==', sessionId));
  const peopleSnapshot = await getDocs(peopleQuery);
  
  const people: Person[] = peopleSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as Omit<PersonDoc, 'sessionId' | 'joinedAt'>
  }));
  
  // Get all receipts in session
  const receiptsRef = collection(db, 'receipts');
  const receiptsQuery = query(receiptsRef, where('sessionId', '==', sessionId));
  const receiptsSnapshot = await getDocs(receiptsQuery);
  
  const receipts: Receipt[] = await Promise.all(
    receiptsSnapshot.docs.map(async (receiptDoc) => {
      const receiptData = receiptDoc.data() as ReceiptDoc;
      
      // Get items for this receipt
      const itemsRef = collection(db, 'items');
      const itemsQuery = query(itemsRef, where('receiptId', '==', receiptDoc.id));
      const itemsSnapshot = await getDocs(itemsQuery);
      
      const items: ReceiptItem[] = itemsSnapshot.docs.map(itemDoc => ({
        id: itemDoc.id,
        ...itemDoc.data() as Omit<ItemDoc, 'receiptId' | 'order'>
      }));
      
      return {
        id: receiptDoc.id,
        name: receiptData.name,
        createdAt: receiptData.createdAt,
        items,
        taxRate: receiptData.taxRate,
        serviceRate: receiptData.serviceRate,
        total: receiptData.total,
        imageUrl: receiptData.imageUrl,
        paidBy: receiptData.paidBy,
      };
    })
  );
  
  return {
    id: sessionId,
    name: sessionData.name,
    createdAt: sessionData.createdAt,
    createdBy: sessionData.createdBy,
    people,
    receipts,
    shareCode: sessionData.shareCode,
  };
}

// Subscribe to session updates
export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void
): Unsubscribe {
  const sessionRef = doc(db, 'sessions', sessionId);
  
  return onSnapshot(sessionRef, async () => {
    const session = await getSession(sessionId);
    callback(session);
  });
}

// Add receipt to session
export async function addReceipt(
  sessionId: string,
  name: string,
  items: Omit<ReceiptItem, 'id'>[],
  taxRate?: number,
  serviceRate?: number
): Promise<string> {
  const receiptId = doc(collection(db, 'receipts')).id;
  
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  const receiptData: ReceiptDoc = {
    sessionId,
    name,
    createdAt: Date.now(),
    taxRate,
    serviceRate,
    total,
  };
  
  await setDoc(doc(db, 'receipts', receiptId), receiptData);
  
  // Add items
  for (let i = 0; i < items.length; i++) {
    const itemId = doc(collection(db, 'items')).id;
    const itemData: ItemDoc = {
      receiptId,
      ...items[i],
      order: i,
    };
    await setDoc(doc(db, 'items', itemId), itemData);
  }
  
  return receiptId;
}

// Mark who paid for a receipt
export async function markReceiptPaid(
  receiptId: string,
  personId: string | null
): Promise<void> {
  const receiptRef = doc(db, 'receipts', receiptId);
  await updateDoc(receiptRef, {
    paidBy: personId || null,
  });
}

// Add/update item selection
export async function updateSelection(
  sessionId: string,
  receiptId: string,
  itemId: string,
  personId: string,
  percentage: number,
  amount: number
): Promise<void> {
  // Use composite key for selection ID
  const selectionId = `${personId}_${itemId}`;
  
  if (percentage === 0 || amount === 0) {
    // Remove selection if percentage/amount is 0
    const selectionRef = doc(db, 'selections', selectionId);
    const selectionDoc = await getDoc(selectionRef);
    if (selectionDoc.exists()) {
      await updateDoc(selectionRef, {
        percentage: 0,
        amount: 0,
        timestamp: Date.now(),
      });
    }
    return;
  }
  
  const selectionData: SelectionDoc = {
    sessionId,
    receiptId,
    itemId,
    personId,
    percentage,
    amount,
    timestamp: Date.now(),
  };
  
  await setDoc(doc(db, 'selections', selectionId), selectionData);
}

// Get selections for a session
export async function getSelections(sessionId: string): Promise<ItemSelection[]> {
  const selectionsRef = collection(db, 'selections');
  const q = query(selectionsRef, where('sessionId', '==', sessionId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => {
      const data = doc.data() as SelectionDoc;
      return {
        itemId: data.itemId,
        personId: data.personId,
        percentage: data.percentage,
        amount: data.amount,
      };
    })
    .filter(s => s.percentage > 0 && s.amount > 0); // Filter out removed selections
}

// Subscribe to selections updates
export function subscribeToSelections(
  sessionId: string,
  callback: (selections: ItemSelection[]) => void
): Unsubscribe {
  const selectionsRef = collection(db, 'selections');
  const q = query(selectionsRef, where('sessionId', '==', sessionId));
  
  return onSnapshot(q, (snapshot) => {
    const selections = snapshot.docs
      .map(doc => {
        const data = doc.data() as SelectionDoc;
        return {
          itemId: data.itemId,
          personId: data.personId,
          percentage: data.percentage,
          amount: data.amount,
        };
      })
      .filter(s => s.percentage > 0 && s.amount > 0); // Filter out removed selections
    callback(selections);
  });
}
