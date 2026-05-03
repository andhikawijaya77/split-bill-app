'use client';

import { useSessionStore } from '@/lib/stores/sessionStore';
import { calculateSettlements, formatSettlementSummary, getWhatsAppShareUrl, getTelegramShareUrl } from '@/lib/utils/settlements';
import { markReceiptPaid } from '@/lib/firebase/sessions';
import { useState } from 'react';

interface PersonTotalsProps {
  onClose: () => void;
  currentPersonId: string;
}

export default function PersonTotals({ onClose, currentPersonId }: PersonTotalsProps) {
  const { getPersonTotals, session } = useSessionStore();
  const totals = getPersonTotals();
  const [activeTab, setActiveTab] = useState<'totals' | 'settlements'>('totals');
  const [updatingReceipt, setUpdatingReceipt] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const currentPersonTotal = totals.find(t => t.personId === currentPersonId);
  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);
  const settlements = session ? calculateSettlements(session, totals) : [];

  const handleMarkPaid = async (receiptId: string, personId: string | null) => {
    setUpdatingReceipt(receiptId);
    try {
      await markReceiptPaid(receiptId, personId);
    } catch (err) {
      console.error('Error marking receipt as paid:', err);
      alert('Failed to update payment. Please try again.');
    } finally {
      setUpdatingReceipt(null);
    }
  };

  const handleShare = (platform: 'whatsapp' | 'telegram' | 'copy') => {
    if (!session) return;
    
    const summaryText = formatSettlementSummary(session, totals, settlements);
    
    if (platform === 'whatsapp') {
      window.open(getWhatsAppShareUrl(summaryText), '_blank');
    } else if (platform === 'telegram') {
      window.open(getTelegramShareUrl(summaryText), '_blank');
    } else {
      navigator.clipboard.writeText(summaryText);
      alert('Summary copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">📊 Bill Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('totals')}
            className={`flex-1 py-3 font-semibold transition-colors ${
              activeTab === 'totals'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Individual Costs
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex-1 py-3 font-semibold transition-colors ${
              activeTab === 'settlements'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Settlements
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'totals' ? (
            <>
              {/* Current Person's Total */}
              {currentPersonTotal && (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-6">
                  <h3 className="text-lg font-semibold mb-2">Your Total</h3>
                  <div className="text-4xl font-bold mb-4">
                    {formatCurrency(currentPersonTotal.total)}
                  </div>
                  {currentPersonTotal.breakdown.length > 0 && (
                    <div className="space-y-1 opacity-90">
                      {currentPersonTotal.breakdown.map(b => (
                        <div key={b.receiptId} className="flex justify-between text-sm">
                          <span>{b.receiptName}</span>
                          <span>{formatCurrency(b.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Everyone's Totals */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Everyone's Share</h3>
              <div className="space-y-3">
                {totals.map(personTotal => {
                  const person = session?.people.find(p => p.id === personTotal.personId);
                  const isCurrentPerson = personTotal.personId === currentPersonId;

                  return (
                    <div
                      key={personTotal.personId}
                      className={`rounded-lg p-4 ${
                        isCurrentPerson
                          ? 'bg-indigo-50 border-2 border-indigo-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: person?.color || '#999' }}
                          >
                            {person?.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {person?.name}
                              {isCurrentPerson && (
                                <span className="ml-2 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {personTotal.breakdown.length} receipt(s)
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-800">
                            {formatCurrency(personTotal.total)}
                          </div>
                        </div>
                      </div>

                      {personTotal.breakdown.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                          {personTotal.breakdown.map(b => (
                            <div key={b.receiptId} className="flex justify-between text-sm text-gray-600">
                              <span>{b.receiptName}</span>
                              <span className="font-medium">{formatCurrency(b.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grand Total */}
              <div className="mt-6 pt-6 border-t-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Grand Total</span>
                  <span className="text-2xl font-bold text-gray-800">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Payment Tracking */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💳 Who Paid?</h3>
              <div className="space-y-3 mb-6">
                {session?.receipts.map(receipt => (
                  <div key={receipt.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{receipt.name}</h4>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(receipt.total)}
                        </div>
                      </div>
                      {receipt.paidBy && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                            style={{ backgroundColor: session.people.find(p => p.id === receipt.paidBy)?.color }}
                          >
                            {session.people.find(p => p.id === receipt.paidBy)?.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-600">paid</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {session.people.map(person => (
                        <button
                          key={person.id}
                          onClick={() => handleMarkPaid(receipt.id, receipt.paidBy === person.id ? null : person.id)}
                          disabled={updatingReceipt === receipt.id}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            receipt.paidBy === person.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                          style={
                            receipt.paidBy === person.id
                              ? { backgroundColor: person.color }
                              : undefined
                          }
                        >
                          {person.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Settlements */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💸 Who Owes Whom</h3>
              {settlements.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {settlements.map((settlement, idx) => {
                    const fromPerson = session?.people.find(p => p.id === settlement.from);
                    const toPerson = session?.people.find(p => p.id === settlement.to);
                    
                    return (
                      <div key={idx} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                              style={{ backgroundColor: fromPerson?.color }}
                            >
                              {fromPerson?.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">
                                {settlement.fromName}
                                {settlement.from === currentPersonId && (
                                  <span className="ml-2 text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">owes</div>
                            </div>
                          </div>
                          
                          <div className="text-center mx-4">
                            <div className="text-2xl">→</div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-semibold text-gray-800 text-right">
                                {settlement.toName}
                                {settlement.to === currentPersonId && (
                                  <span className="ml-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xl font-bold text-orange-600 text-right">
                                {formatCurrency(settlement.amount)}
                              </div>
                            </div>
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                              style={{ backgroundColor: toPerson?.color }}
                            >
                              {toPerson?.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✅</div>
                  <div className="text-xl font-semibold text-gray-800 mb-2">All Settled Up!</div>
                  <div className="text-gray-600">
                    {session?.receipts.some(r => r.paidBy)
                      ? 'Everyone has paid their fair share.'
                      : 'Mark who paid to see settlements.'}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Share Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Share Summary:</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleShare('whatsapp')}
                className="bg-emerald-500 text-white py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => handleShare('telegram')}
                className="bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <span>Telegram</span>
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
