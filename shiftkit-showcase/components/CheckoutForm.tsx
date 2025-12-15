// shiftkit-showcase/components/CheckoutForm.tsx
import { useState } from 'react';
import type { Checkout } from '../lib/types';

export const CheckoutForm = () => {
  const [formData, setFormData] = useState({
    depositCoin: 'ltc',
    settleCoin: 'usdc',
    settleAmount: '100', // e.g., for a $100 invoice
  });
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCheckout(null);

    try {
      const response = await fetch('/api/shiftkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createCheckout',
          params: formData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout.');
      }
      setCheckout(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="depositCoin" value={formData.depositCoin} onChange={handleChange} placeholder="Deposit Coin (e.g., ltc)" className="p-2 border rounded" />
          <input name="settleCoin" value={formData.settleCoin} onChange={handleChange} placeholder="Settle Coin (e.g., usdc)" className="p-2 border rounded" />
        </div>
        <input name="settleAmount" value={formData.settleAmount} onChange={handleChange} placeholder="Settle Amount (e.g., 100)" className="w-full p-2 border rounded" />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? 'Creating Checkout...' : 'Create Merchant Checkout'}
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </form>

      {checkout && (
        <div className="p-4 bg-gray-100 rounded-lg text-center">
          <p className="font-semibold">Checkout Created!</p>
          <a href={checkout.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
            {checkout.url}
          </a>
        </div>
      )}
    </div>
  );
};
