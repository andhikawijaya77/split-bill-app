'use client';

import type { Receipt } from '@/types';
import ItemRow from './ItemRow';

interface ReceiptCardProps {
  receipt: Receipt;
  currentPersonId: string;
  sessionId: string;
}

export default function ReceiptCard({ receipt, currentPersonId, sessionId }: ReceiptCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
        <h3 className="text-white font-semibold text-lg">{receipt.name}</h3>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-indigo-100 text-sm">
            {receipt.items.length} items
          </span>
          {receipt.taxRate && (
            <span className="text-indigo-100 text-sm">
              Tax: {(receipt.taxRate * 100).toFixed(0)}%
            </span>
          )}
          {receipt.serviceRate && (
            <span className="text-indigo-100 text-sm">
              Service: {(receipt.serviceRate * 100).toFixed(0)}%
            </span>
          )}
        </div>
        <div className="mt-2 text-white font-bold text-xl">
          {formatCurrency(receipt.total)}
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {receipt.items.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            receiptId={receipt.id}
            sessionId={sessionId}
            currentPersonId={currentPersonId}
          />
        ))}
      </div>
    </div>
  );
}
