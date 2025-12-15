// shiftkit-showcase/components/WebhookLogger.tsx
import { useState, useEffect } from 'react';

interface WebhookEvent {
  id: string;
  data: any;
  receivedAt: string;
}

export const WebhookLogger = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/webhook');
        if (!response.ok) {
          throw new Error('Failed to fetch webhook events');
        }
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };

    const intervalId = setInterval(fetchEvents, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-4 border rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-center">Real-Time Webhook Events</h2>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center">No webhook events received yet...</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="p-2 border rounded bg-gray-50">
              <p className="text-sm text-gray-500">Received at: {new Date(event.receivedAt).toLocaleTimeString()}</p>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
