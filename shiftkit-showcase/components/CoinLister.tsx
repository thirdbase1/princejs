// shiftkit-showcase/components/CoinLister.tsx
import { useState, useEffect } from 'react';
import type { Coin } from '../lib/types';

export const CoinLister = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/shiftkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getCoins' }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch coins');
      }
      const data = await response.json();
      setCoins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-4 border rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center">Supported Coins</h2>
      <button
        onClick={fetchCoins}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Loading...' : 'Fetch Supported Coins'}
      </button>

      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

      {coins.length > 0 && (
        <div className="mt-4 max-h-96 overflow-y-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left"></th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Symbol</th>
                <th className="px-4 py-2 text-left">Networks</th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin) => (
                <tr key={coin.coin} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <img src={coin.logo} alt={`${coin.name} logo`} className="h-6 w-6" />
                  </td>
                  <td className="px-4 py-2 font-medium">{coin.name}</td>
                  <td className="px-4 py-2 uppercase font-mono text-sm">{coin.coin}</td>
                  <td className="px-4 py-2 text-xs text-gray-600">{coin.networks.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
