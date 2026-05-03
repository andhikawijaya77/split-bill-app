'use client';

import { useState } from 'react';
import type { Session } from '@/types';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface SessionHeaderProps {
  session: Session;
  currentPersonId: string;
}

export default function SessionHeader({ session, currentPersonId }: SessionHeaderProps) {
  const [showShareCode, setShowShareCode] = useState(false);
  const currentPerson = session.people.find(p => p.id === currentPersonId);

  const copyShareCode = () => {
    navigator.clipboard.writeText(session.shareCode);
    setShowShareCode(true);
    setTimeout(() => setShowShareCode(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{session.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex -space-x-2">
                {session.people.map(person => (
                  <div
                    key={person.id}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: person.color }}
                    title={person.name}
                  >
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {session.people.length} {session.people.length === 1 ? 'person' : 'people'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={copyShareCode}
              className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors font-semibold text-sm"
            >
              {showShareCode ? '✓ Copied!' : `🔗 ${session.shareCode}`}
            </button>
          </div>
        </div>
        
        {currentPerson && (
          <div className="mt-3 inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: currentPerson.color }}
            ></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              You: {currentPerson.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
