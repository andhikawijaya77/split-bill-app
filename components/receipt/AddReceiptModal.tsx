'use client';

import { useState } from 'react';
import { addReceipt } from '@/lib/firebase/sessions';
import type { ReceiptItem } from '@/types';
import CameraCapture from './CameraCapture';
import { processImageWithTesseract, parseReceiptText, validateOCRResult, type OCRResult } from '@/lib/ocr/processor';

interface AddReceiptModalProps {
  sessionId: string;
  onClose: () => void;
}

interface ItemInput {
  id: string;
  name: string;
  quantity: string;
  unitPrice: string;
}

type ModalMode = 'choose' | 'camera' | 'manual' | 'ocr-processing' | 'ocr-review';

export default function AddReceiptModal({ sessionId, onClose }: AddReceiptModalProps) {
  const [mode, setMode] = useState<ModalMode>('choose');
  const [receiptName, setReceiptName] = useState('');
  const [taxRate, setTaxRate] = useState('10');
  const [serviceRate, setServiceRate] = useState('0');
  const [items, setItems] = useState<ItemInput[]>([
    { id: '1', name: '', quantity: '1', unitPrice: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [rawOcrText, setRawOcrText] = useState('');

  const addItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      name: '', 
      quantity: '1', 
      unitPrice: '' 
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ItemInput, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateFinalPrice = (unitPrice: number): number => {
    const tax = parseFloat(taxRate) / 100;
    const service = parseFloat(serviceRate) / 100;
    return unitPrice * (1 + tax + service);
  };

  const handleCameraCapture = async (file: File) => {
    setMode('ocr-processing');
    setOcrProgress(0);

    try {
      // Process image with OCR
      const text = await processImageWithTesseract(file, (progress) => {
        setOcrProgress(progress);
      });

      setRawOcrText(text);

      // Parse OCR text
      const result = parseReceiptText(text);
      const validated = validateOCRResult(result);

      setOcrResult(validated);

      // Pre-fill form
      if (validated.items.length > 0) {
        setItems(validated.items.map((item, idx) => ({
          id: Date.now().toString() + idx,
          name: item.name,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
        })));
      }

      if (validated.taxRate !== undefined) {
        setTaxRate((validated.taxRate * 100).toString());
      }

      if (validated.serviceRate !== undefined) {
        setServiceRate((validated.serviceRate * 100).toString());
      }

      setMode('ocr-review');
    } catch (err) {
      console.error('OCR error:', err);
      alert('Failed to process receipt image. Please try again or enter manually.');
      setMode('choose');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!receiptName.trim()) {
      alert('Please enter receipt name');
      return;
    }

    const validItems = items.filter(item => 
      item.name.trim() && item.quantity && item.unitPrice
    );

    if (validItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setSaving(true);

    try {
      const receiptItems: Omit<ReceiptItem, 'id'>[] = validItems.map(item => {
        const qty = parseFloat(item.quantity);
        const unitPrice = parseFloat(item.unitPrice);
        const finalUnitPrice = calculateFinalPrice(unitPrice);
        const totalPrice = finalUnitPrice * qty;

        return {
          name: item.name,
          quantity: qty,
          unitPrice,
          finalUnitPrice,
          totalPrice,
        };
      });

      await addReceipt(
        sessionId,
        receiptName,
        receiptItems,
        parseFloat(taxRate) / 100 || undefined,
        parseFloat(serviceRate) / 100 || undefined
      );

      onClose();
    } catch (err) {
      console.error('Error adding receipt:', err);
      alert('Failed to add receipt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {mode === 'choose' && 'Add Receipt'}
            {mode === 'camera' && 'Scan Receipt'}
            {mode === 'manual' && 'Manual Entry'}
            {mode === 'ocr-processing' && 'Processing...'}
            {mode === 'ocr-review' && 'Review & Edit'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {mode === 'choose' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('camera')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <span className="text-3xl">📸</span>
                <div className="text-left">
                  <div className="text-lg">Scan Receipt</div>
                  <div className="text-sm opacity-90">Auto-extract items with OCR</div>
                </div>
              </button>
              
              <button
                onClick={() => setMode('manual')}
                className="w-full bg-gray-600 text-white py-6 rounded-xl font-semibold hover:bg-gray-700 transition-colors shadow-lg flex items-center justify-center gap-3"
              >
                <span className="text-3xl">✍️</span>
                <div className="text-left">
                  <div className="text-lg">Enter Manually</div>
                  <div className="text-sm opacity-90">Type items yourself</div>
                </div>
              </button>

              <button
                onClick={onClose}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mt-4"
              >
                Cancel
              </button>
            </div>
          )}

          {mode === 'camera' && (
            <CameraCapture
              onCapture={handleCameraCapture}
              onCancel={() => setMode('choose')}
            />
          )}

          {mode === 'ocr-processing' && (
            <div className="py-12 text-center">
              <div className="text-6xl mb-4 animate-pulse">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Processing Receipt...
              </h3>
              <div className="max-w-xs mx-auto mb-4">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {Math.round(ocrProgress)}%
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Using AI to read your receipt...
              </p>
            </div>
          )}

          {(mode === 'manual' || mode === 'ocr-review') && (
            <div className="space-y-4">
              {mode === 'ocr-review' && ocrResult && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">✅</div>
                    <div className="flex-1 text-sm text-green-800 dark:text-green-300">
                      <p className="font-semibold mb-1">
                        OCR completed! Found {ocrResult.items.length} items.
                      </p>
                      <p>Review and edit the items below before saving.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Receipt Name
                </label>
                <input
                  type="text"
                  value={receiptName}
                  onChange={(e) => setReceiptName(e.target.value)}
                  placeholder="e.g., Padang Restaurant"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Tax & Service */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tax (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service (%)
                  </label>
                  <input
                    type="number"
                    value={serviceRate}
                    onChange={(e) => setServiceRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Items</label>
                  <button
                    onClick={addItem}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold text-sm"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          placeholder="Item name"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          placeholder="Qty"
                          min="0.1"
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Total */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Estimated Total:</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(
                    items.reduce((sum, item) => {
                      const qty = parseFloat(item.quantity) || 0;
                      const price = parseFloat(item.unitPrice) || 0;
                      return sum + (calculateFinalPrice(price) * qty);
                    }, 0)
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setMode('choose')}
                  disabled={saving}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Receipt'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
