// shiftkit-showcase/components/SwapForm.tsx
import { useState } from 'react';
import type { Shift } from '../lib/types';

interface SwapFormProps {
  onSwapCreated: (shift: Shift) => void;
}

export const SwapForm = ({ onSwapCreated }: SwapFormProps) => {
  const [formData, setFormData] = useState({
    depositCoin: 'btc',
    depositNetwork: 'mainnet',
    settleCoin: 'eth',
    settleNetwork: 'mainnet',
    settleAmount: '0.01',
    settleAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          action: 'performFixedSwap',
          params: formData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create swap.');
      }
      onSwapCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-4 border rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center">Create a Swap</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="depositCoin" value={formData.depositCoin} onChange={handleChange} placeholder="Deposit Coin (e.g., btc)" className="p-2 border rounded" />
          <input name="depositNetwork" value={formData.depositNetwork} onChange={handleChange} placeholder="Deposit Network (e.g., mainnet)" className="p-2 border rounded" />
          <input name="settleCoin" value={formData.settleCoin} onChange={handleChange} placeholder="Settle Coin (e.g., eth)" className="p-2 border rounded" />
          <input name="settleNetwork" value={formData.settleNetwork} onChange={handleChange} placeholder="Settle Network (e.g., mainnet)" className="p-2 border rounded" />
        </div>
        <input name="settleAmount" value={formData.settleAmount} onChange={handleChange} placeholder="Settle Amount (e.g., 0.01)" className="w-full p-2 border rounded" />
        <input name="settleAddress" value={formData.settleAddress} onChange={handleChange} placeholder="Your Settlement Address" className="w-full p-2 border rounded" />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? 'Creating Swap...' : 'Create Swap'}
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </form>
    </div>
  );
};
