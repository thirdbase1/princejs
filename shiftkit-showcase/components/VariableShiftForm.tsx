// shiftkit-showcase/components/VariableShiftForm.tsx
import { useState } from 'react';
import type { Shift } from '../lib/types';

interface VariableShiftFormProps {
  onShiftCreated: (shift: Shift) => void;
}

export const VariableShiftForm = ({ onShiftCreated }: VariableShiftFormProps) => {
  const [formData, setFormData] = useState({
    depositCoin: 'xmr',
    settleCoin: 'btc',
    settleAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!formData.settleAddress) {
      setError('Please enter a valid settlement address.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/shiftkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createVariableShift',
          params: formData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create variable shift.');
      }
      setSuccess('Variable shift created! Waiting for deposit...');
      onShiftCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="depositCoin" value={formData.depositCoin} onChange={handleChange} placeholder="Deposit Coin (e.g., xmr)" className="p-2 border rounded" />
        <input name="settleCoin" value={formData.settleCoin} onChange={handleChange} placeholder="Settle Coin (e.g., btc)" className="p-2 border rounded" />
      </div>
      <input name="settleAddress" value={formData.settleAddress} onChange={handleChange} placeholder="Your Settlement Address" className="w-full p-2 border rounded" />
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center"
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {loading ? 'Creating Shift...' : 'Create Variable Shift'}
      </button>
      {error && <p className="text-red-500 text-center">{error}</p>}
      {success && <p className="text-green-500 text-center">{success}</p>}
    </form>
  );
};
