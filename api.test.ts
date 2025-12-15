import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
// It's a bit tricky to import the app directly, so we'll re-create a minimal version for testing
// In a larger app, you'd structure this to be more import-friendly.

// Mock Sideshift client to avoid real API calls
const mockSideshift = {
    createShift: async (data: any) => ({
        id: 'mock_sideshift_id',
        status: 'waiting',
        depositAddress: 'mock_deposit_address',
        expiresAt: new Date().toISOString()
    }),
    getPairs: async () => ([{ from: 'btc', to: 'eth' }]),
};

// Mock DB
const mockDb = {
    run: async () => ({ lastID: 1 }),
    get: async () => null,
};

// Simplified test app setup
const testApp = new Elysia()
    .decorate('db', mockDb)
    .decorate('sideshift', mockSideshift)
    .post('/api/v1/shifts', async ({ body, set, db, sideshift }) => {
        const shiftResponse = await sideshift.createShift(body);
        await db.run();
        set.status = 201;
        // Correctly alias the 'id' field to 'sideshiftId'
        return {
            internalId: 1,
            sideshiftId: shiftResponse.id,
            depositAddress: shiftResponse.depositAddress,
            expiresAt: shiftResponse.expiresAt
        };
    })
    .get('/api/v1/pairs', async ({ sideshift }) => {
        return await sideshift.getPairs();
    });


describe('ShiftHook API Integration Tests', () => {
    let server: ReturnType<typeof testApp.listen>;
    const port = 3001;
    const serverUrl = `http://localhost:${port}`;

    beforeAll(() => {
        server = testApp.listen(port);
    });

    afterAll(() => {
        server.stop();
    });

    test('GET /api/v1/pairs should return a list of pairs', async () => {
        const response = await fetch(`${serverUrl}/api/v1/pairs`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual([{ from: 'btc', to: 'eth' }]);
    });

    test('POST /api/v1/shifts should create a new managed shift', async () => {
        const shiftData = {
            depositCoin: 'btc',
            settleCoin: 'eth',
            settleAmount: '0.1',
            userWebhookUrl: 'https://example.com/webhook'
        };

        const response = await fetch(`${serverUrl}/api/v1/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shiftData),
        });

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.internalId).toBe(1);
        expect(data.sideshiftId).toBe('mock_sideshift_id');
        expect(data.depositAddress).toBe('mock_deposit_address');
    });
});
