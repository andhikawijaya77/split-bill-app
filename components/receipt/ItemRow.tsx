'use client';

import { useState, useEffect } from 'react';
import type { ReceiptItem } from '@/types';
import { useSessionStore } from '@/lib/stores/sessionStore';
import { updateSelection } from '@/lib/firebase/sessions';

interface ItemRowProps {
  item: ReceiptItem;
  receiptId: string;
  sessionId: string;
  currentPersonId: string;
}

export default function ItemRow({ item, receiptId, sessionId, currentPersonId }: ItemRowProps) {
  const { selections, getRemainingQuantity, session } = useSessionStore();
  const [isSelecting, setIsSelecting] = useState(false);
  const [percentage, setPercentage] = useState(100);
  const [saving, setSaving] = useState(false);

  const mySelection = selections.find(
    s => s.itemId === item.id && s.personId === currentPersonId
  );

  const allSelectionsForItem = selections.filter(s => s.itemId === item.id);
  const remainingQty = getRemainingQuantity(item.id);
  const maxPercentage = Math.min(100, (remainingQty + (mySelection?.percentage || 0) / item.quantity) * 100);

  useEffect(() => {
    if (mySelection) {
      const pct = (mySelection.percentage / item.quantity) * 100;
      setPercentage(Math.round(pct));
    }
  }, [mySelection, item.quantity]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSave = async () => {
    setSaving(true);
    const actualPercentage = (percentage / 100) * item.quantity;
    const amount = (item.finalUnitPrice * actualPercentage);
    
    await updateSelection(
      sessionId,
      receiptId,
      item.id,
      currentPersonId,
      actualPercentage,
      amount
    );
    
    setSaving(false);
    setIsSelecting(false);
  };

  const handleRemove = async () => {
    setSaving(true);
    await updateSelection(sessionId, receiptId, item.id, currentPersonId, 0, 0);
    setSaving(false);
    setIsSelecting(false);
  };

  const calculatePreview = () => {
    const actualPercentage = (percentage / 100) * item.quantity;
    return item.finalUnitPrice * actualPercentage;
  };

  const getPersonColor = (personId: string) => {
    return session?.people.find(p => p.id === personId)?.color || '#999';
  };

  const getPersonInitial = (personId: string) => {
    return session?.people.find(p => p.id === personId)?.name.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{item.name}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-600">
              {item.quantity}x @ {formatCurrency(item.finalUnitPrice)}
            </span>
            <span className="text-sm font-semibold text-gray-800">
              = {formatCurrency(item.totalPrice)}
            </span>
          </div>
          
          {/* Show who's selected this item */}
          {allSelectionsForItem.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {allSelectionsForItem.map(sel => (
                <div
                  key={sel.personId}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white border-2 border-white shadow-sm"
                  style={{ backgroundColor: getPersonColor(sel.personId) }}
                  title={`${((sel.percentage / item.quantity) * 100).toFixed(0)}%`}
                >
                  {getPersonInitial(sel.personId)}
                </div>
              ))}
              {remainingQty > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  {remainingQty.toFixed(1)} left
                </span>
              )}
            </div>
          )}
        </div>

        {!isSelecting ? (
          <button
            onClick={() => setIsSelecting(true)}
            disabled={remainingQty === 0 && !mySelection}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              mySelection
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : remainingQty === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            {mySelection ? '✓ Selected' : remainingQty === 0 ? 'Full' : '+ Select'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsSelecting(false)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Selection Slider */}
      {isSelecting && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Your portion
              </span>
              <span className="text-lg font-bold text-indigo-600">
                {percentage}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max={maxPercentage}
              step="10"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>{maxPercentage}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Quantity:</span>
            <span className="font-semibold">
              {((percentage / 100) * item.quantity).toFixed(2)} of {item.quantity}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg">
            <span className="font-semibold text-gray-700">Your cost:</span>
            <span className="text-xl font-bold text-indigo-600">
              {formatCurrency(calculatePreview())}
            </span>
          </div>

          <div className="flex gap-2">
            {mySelection && (
              <button
                onClick={handleRemove}
                disabled={saving}
                className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-semibold hover:bg-red-200 disabled:opacity-50"
              >
                {saving ? 'Removing...' : 'Remove'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || percentage === 0}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : mySelection ? 'Update' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
