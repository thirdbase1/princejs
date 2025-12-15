// shiftkit-showcase/pages/index.tsx
import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { CoinLister } from '../components/CoinLister';
import { SwapForm } from '../components/SwapForm';
import { StatusTracker } from '../components/StatusTracker';
import { WebhookLogger } from '../components/WebhookLogger';
import { Card } from '../components/Card';
import { VariableShiftForm } from '../components/VariableShiftForm';
import { CheckoutForm } from '../components/CheckoutForm';
import type { Shift } from '../lib/types';

const HomePage: NextPage = () => {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  const handleSwapCreated = (shift: Shift) => {
    setActiveShift(shift);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Head>
        <title>ShiftKit Showcase</title>
        <meta name="description" content="Live demonstration of the ShiftKit SDK for SideShift.ai" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 text-gray-900">
          🚀 ShiftKit SDK Showcase
        </h1>
        <p className="text-xl text-gray-600">
          The production-ready toolkit for integrating SideShift in minutes.
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          <Card title="Fixed-Rate Swap (for precise amounts)">
            <SwapForm onSwapCreated={handleSwapCreated} />
          </Card>
          {activeShift && (
            <Card title="Live Shift Tracker">
              <StatusTracker initialShift={activeShift} />
            </Card>
          )}
          <Card title="Variable-Rate Swap (more flexible)">
            <VariableShiftForm onShiftCreated={handleSwapCreated} />
          </Card>
          <Card title="Merchant Checkout (for invoicing)">
            <CheckoutForm />
          </Card>
        </div>
        <div className="space-y-8">
          <Card title="Real-Time Webhook Event Log">
            <WebhookLogger />
          </Card>
          <Card title="All Supported Coins & Networks">
            <CoinLister />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
