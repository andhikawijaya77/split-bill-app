import type { Session, PersonTotal, Settlement } from '@/types';

/**
 * Calculate optimal settlements (who owes whom)
 * Uses greedy algorithm to minimize number of transactions
 */
export function calculateSettlements(
  session: Session,
  personTotals: PersonTotal[]
): Settlement[] {
  // Step 1: Calculate net balance for each person
  // Net balance = amount paid - amount owed
  
  const balances = new Map<string, { name: string; balance: number }>();
  
  // Initialize with what each person owes
  personTotals.forEach(pt => {
    balances.set(pt.personId, {
      name: pt.personName,
      balance: -pt.total, // Negative because they owe
    });
  });
  
  // Add what each person paid
  session.receipts.forEach(receipt => {
    if (receipt.paidBy) {
      const current = balances.get(receipt.paidBy);
      if (current) {
        current.balance += receipt.total; // Positive because they paid
      }
    }
  });
  
  // Step 2: Separate debtors and creditors
  const debtors: Array<{ id: string; name: string; amount: number }> = [];
  const creditors: Array<{ id: string; name: string; amount: number }> = [];
  
  balances.forEach((value, id) => {
    if (value.balance < -0.01) {
      // Owes money (allow 1 cent tolerance for rounding)
      debtors.push({ id, name: value.name, amount: Math.abs(value.balance) });
    } else if (value.balance > 0.01) {
      // Is owed money
      creditors.push({ id, name: value.name, amount: value.balance });
    }
  });
  
  // Step 3: Greedy matching - match largest debtor with largest creditor
  const settlements: Settlement[] = [];
  
  // Sort by amount (largest first)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  
  let i = 0; // Debtor index
  let j = 0; // Creditor index
  
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const amount = Math.min(debtor.amount, creditor.amount);
    
    settlements.push({
      from: debtor.id,
      fromName: debtor.name,
      to: creditor.id,
      toName: creditor.name,
      amount: Math.round(amount), // Round to nearest currency unit
    });
    
    debtor.amount -= amount;
    creditor.amount -= amount;
    
    if (debtor.amount < 0.01) i++; // Move to next debtor
    if (creditor.amount < 0.01) j++; // Move to next creditor
  }
  
  return settlements;
}

/**
 * Generate formatted settlement summary for sharing
 */
export function formatSettlementSummary(
  session: Session,
  personTotals: PersonTotal[],
  settlements: Settlement[],
  currency: string = 'IDR'
): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  let text = `💰 ${session.name}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Individual totals
  text += `📊 Individual Costs:\n`;
  personTotals.forEach(pt => {
    text += `  ${pt.personName}: ${formatCurrency(pt.total)}\n`;
  });
  
  const grandTotal = personTotals.reduce((sum, pt) => sum + pt.total, 0);
  text += `\n  Total: ${formatCurrency(grandTotal)}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Who paid
  text += `💳 Payments Made:\n`;
  const paidReceipts = session.receipts.filter(r => r.paidBy);
  if (paidReceipts.length > 0) {
    paidReceipts.forEach(receipt => {
      const payer = session.people.find(p => p.id === receipt.paidBy);
      text += `  ${payer?.name || 'Unknown'} paid ${formatCurrency(receipt.total)}\n`;
      text += `    (${receipt.name})\n`;
    });
  } else {
    text += `  No payments recorded yet\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Settlements
  if (settlements.length > 0) {
    text += `💸 Who Owes Whom:\n`;
    settlements.forEach(s => {
      text += `  ${s.fromName} → ${s.toName}\n`;
      text += `    ${formatCurrency(s.amount)}\n`;
    });
  } else {
    text += `✅ All settled up!\n`;
  }
  
  text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Split with Split Bill app 🚀`;
  
  return text;
}

/**
 * Generate WhatsApp share URL
 */
export function getWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Generate Telegram share URL
 */
export function getTelegramShareUrl(text: string): string {
  return `https://t.me/share/url?text=${encodeURIComponent(text)}`;
}
