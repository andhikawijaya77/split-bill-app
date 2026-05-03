import { create } from 'zustand';
import type { Session, ItemSelection, PersonTotal } from '@/types';

interface SessionState {
  session: Session | null;
  selections: ItemSelection[];
  currentPersonId: string | null;
  
  setSession: (session: Session | null) => void;
  setSelections: (selections: ItemSelection[]) => void;
  setCurrentPersonId: (personId: string | null) => void;
  
  // Computed values
  getPersonTotal: (personId: string) => number;
  getPersonTotals: () => PersonTotal[];
  getRemainingQuantity: (itemId: string) => number;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  selections: [],
  currentPersonId: null,
  
  setSession: (session) => set({ session }),
  setSelections: (selections) => set({ selections }),
  setCurrentPersonId: (personId) => set({ currentPersonId }),
  
  getPersonTotal: (personId: string): number => {
    const { selections } = get();
    return selections
      .filter(s => s.personId === personId)
      .reduce((sum, s) => sum + s.amount, 0);
  },
  
  getPersonTotals: (): PersonTotal[] => {
    const { session, selections } = get();
    if (!session) return [];
    
    return session.people.map(person => {
      const personSelections = selections.filter(s => s.personId === person.id);
      
      const breakdown = session.receipts.map(receipt => {
        const receiptItems = receipt.items.map(item => item.id);
        const receiptSelections = personSelections.filter(s => receiptItems.includes(s.itemId));
        const amount = receiptSelections.reduce((sum, s) => sum + s.amount, 0);
        
        return {
          receiptId: receipt.id,
          receiptName: receipt.name,
          amount,
        };
      }).filter(b => b.amount > 0);
      
      const total = breakdown.reduce((sum, b) => sum + b.amount, 0);
      
      return {
        personId: person.id,
        personName: person.name,
        total,
        breakdown,
      };
    });
  },
  
  getRemainingQuantity: (itemId: string): number => {
    const { session, selections } = get();
    if (!session) return 0;
    
    // Find the item
    let item;
    for (const receipt of session.receipts) {
      item = receipt.items.find(i => i.id === itemId);
      if (item) break;
    }
    
    if (!item) return 0;
    
    // Calculate total percentage claimed
    const totalPercentage = selections
      .filter(s => s.itemId === itemId)
      .reduce((sum, s) => sum + s.percentage, 0);
    
    // Remaining percentage (in terms of quantity)
    const remainingPercentage = (item.quantity * 100) - totalPercentage;
    return Math.max(0, remainingPercentage / 100);
  },
}));
