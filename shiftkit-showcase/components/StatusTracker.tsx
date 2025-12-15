// shiftkit-showcase/components/StatusTracker.tsx
import { useEffect, useState } from 'react';
import type { Shift } from '../lib/types';

// Custom hook for polling the shift status
const useShiftTracker = (shiftId: string | null) => {
  const [shift, setShift] = useState<Shift | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shiftId) return;

    let isActive = true;
    const poll = async () => {
      try {
        const response = await fetch('/api/shiftkit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getShift', params: { id: shiftId } }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to fetch shift status');
        }

        const data: Shift = await response.json();

        if (isActive) {
          setShift(data);
          // If the shift is not in a terminal state, poll again
          if (!['settled', 'expired', 'refunded', 'failed'].includes(data.status)) {
            setTimeout(poll, 5000); // Poll every 5 seconds
          }
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
      }
    };

    poll();

    return () => {
      isActive = false; // Prevent state updates on unmounted component
    };
  }, [shiftId]);

  return { shift, error };
};

interface StatusTrackerProps {
  initialShift: Shift;
}

export const StatusTracker = ({ initialShift }: StatusTrackerProps) => {
  const { shift, error } = useShiftTracker(initialShift.id);
  const displayShift = shift || initialShift;

  const getStatusColor = (status: Shift['status']) => {
    switch (status) {
      case 'settled': return 'text-green-500';
      case 'failed':
      case 'expired': return 'text-red-500';
      case 'pending': return 'text-gray-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-4 border rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center">Swap Status</h2>
      <div className="space-y-2 text-left">
        <p><strong>Shift ID:</strong> {displayShift.id}</p>
        <p><strong>Deposit Address:</strong> <span className="font-mono bg-gray-100 p-1 rounded">{displayShift.depositAddress.address}</span></p>
        <p><strong>Status:</strong> <span className={`font-bold uppercase ${getStatusColor(displayShift.status)}`}>{displayShift.status}</span></p>
      </div>
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
    </div>
  );
};
