'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSession, subscribeToSession, subscribeToSelections } from '@/lib/firebase/sessions';
import { useSessionStore } from '@/lib/stores/sessionStore';
import SessionHeader from '@/components/session/SessionHeader';
import ReceiptList from '@/components/receipt/ReceiptList';
import PersonTotals from '@/components/session/PersonTotals';
import AddReceiptButton from '@/components/receipt/AddReceiptButton';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const { session, setSession, setSelections, setCurrentPersonId, currentPersonId } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [showTotals, setShowTotals] = useState(false);

  useEffect(() => {
    // Get current person ID from localStorage
    const personId = localStorage.getItem('currentPersonId');
    if (personId) {
      setCurrentPersonId(personId);
    }

    // Load session
    getSession(sessionId).then(sessionData => {
      if (!sessionData) {
        router.push('/');
        return;
      }
      setSession(sessionData);
      setLoading(false);
    });

    // Subscribe to real-time updates
    const unsubscribeSession = subscribeToSession(sessionId, (sessionData) => {
      if (sessionData) {
        setSession(sessionData);
      }
    });

    const unsubscribeSelections = subscribeToSelections(sessionId, (selections) => {
      setSelections(selections);
    });

    return () => {
      unsubscribeSession();
      unsubscribeSelections();
    };
  }, [sessionId, router, setSession, setSelections, setCurrentPersonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session || !currentPersonId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Session not found</p>
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SessionHeader session={session} currentPersonId={currentPersonId} />
      
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {session.receipts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧾</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No receipts yet</h3>
            <p className="text-gray-600 mb-6">Add your first receipt to get started</p>
            <AddReceiptButton sessionId={session.id} />
          </div>
        ) : (
          <>
            <ReceiptList 
              receipts={session.receipts} 
              currentPersonId={currentPersonId}
              sessionId={session.id}
            />
            <div className="mt-6">
              <AddReceiptButton sessionId={session.id} />
            </div>
          </>
        )}
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowTotals(true)}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
          >
            📊 View Totals
          </button>
        </div>
      </div>

      {/* Totals Modal */}
      {showTotals && (
        <PersonTotals 
          onClose={() => setShowTotals(false)}
          currentPersonId={currentPersonId}
        />
      )}
    </div>
  );
}
