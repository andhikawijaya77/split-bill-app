'use client';

import type { Receipt } from '@/types';
import ReceiptCard from './ReceiptCard';

interface ReceiptListProps {
  receipts: Receipt[];
  currentPersonId: string;
  sessionId: string;
}

export default function ReceiptList({ receipts, currentPersonId, sessionId }: ReceiptListProps) {
  return (
    <div className="space-y-6">
      {receipts.map(receipt => (
        <ReceiptCard
          key={receipt.id}
          receipt={receipt}
          currentPersonId={currentPersonId}
          sessionId={sessionId}
        />
      ))}
    </div>
  );
}
