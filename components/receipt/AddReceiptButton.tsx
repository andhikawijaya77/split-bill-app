'use client';

import { useState } from 'react';
import AddReceiptModal from './AddReceiptModal';

interface AddReceiptButtonProps {
  sessionId: string;
}

export default function AddReceiptButton({ sessionId }: AddReceiptButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center gap-2"
      >
        <span className="text-2xl">+</span>
        <span>Add Receipt</span>
      </button>

      {showModal && (
        <AddReceiptModal
          sessionId={sessionId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
