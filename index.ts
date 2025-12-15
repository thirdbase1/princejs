import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { rateLimit } from 'elysia-rate-limit';
import { getDb, initDb } from './db';
import {
    CreateManagedShiftSchema,
    SideShiftWebhookSchema,
    CreateQuoteSchema,
    CreateCheckoutSchema
} from './types';
import * as sideshift from './sideshift';

const app = new Elysia()
    .use(swagger())
    .use(rateLimit({
        duration: 60000, // 1 minute
        max: 30, // 30 requests per minute
    }))
    .onError(({ code, error, set }) => {
        console.error(`Error ${code}: ${error.message}`);
        return new Response(error.toString(), { status: 500 });
    })
    .group('/api/v1', (app) => app
        // --- Core Managed Shift Feature ---
        .post('/shifts', async ({ body, set }) => {
            try {
                const { userWebhookUrl, userIp, ...shiftData } = body;
                const shiftResponse = await sideshift.createShift(
                    { ...shiftData, userIp },
                    process.env.SIDESHIFT_AFFILIATE_ID!
                );

                if (!shiftResponse || !shiftResponse.id) {
                    set.status = 500;
                    return { error: "Failed to create shift with SideShift" };
                }

                const db = await getDb();
                const result = await db.run(
                    'INSERT INTO managed_shifts (sideshift_id, status, user_webhook_url, settle_address) VALUES (?, ?, ?, ?)',
                    shiftResponse.id,
                    shiftResponse.status || 'waiting',
                    userWebhookUrl,
                    shiftResponse.settleAddress
                );

                const internalId = result.lastID;
                console.log(`[Shift Created] Internal ID: ${internalId}, SideShift ID: ${shiftResponse.id}`);

                set.status = 201;
                return {
                    internalId,
                    sideshiftId: shiftResponse.id,
                    depositAddress: shiftResponse.depositAddress,
                    depositMemo: shiftResponse.depositMemo,
                    expiresAt: shiftResponse.expiresAt
                };
            } catch (error: any) {
                set.status = 500;
                return { error: error.message };
            }
        }, { body: CreateManagedShiftSchema })

        // --- SideShift Webhook Listener ---
        .post('/sideshift-webhook', async ({ body, set }) => {
            const { id: sideshift_id, status } = body;
            console.log(`[Webhook Received] SideShift ID: ${sideshift_id}, Status: ${status}`);
            const db = await getDb();
            const shift = await db.get('SELECT * FROM managed_shifts WHERE sideshift_id = ?', sideshift_id);

            if (!shift) {
                return { message: "Shift not found, but webhook acknowledged." };
            }

            await db.run('UPDATE managed_shifts SET status = ? WHERE id = ?', status, shift.id);

            if (status === 'complete' || status === 'failed' || status === 'refunded') {
                console.log(`[Forwarding Webhook] Notifying user at ${shift.user_webhook_url} for shift ${shift.id}`);
                fetch(shift.user_webhook_url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        internalId: shift.id,
                        sideshiftId: shift.sideshift_id,
                        status: status,
                        finalData: body
                    }),
                }).catch(err => console.error(`[Webhook Forward Failed]`, err));
            }

            return { message: 'Webhook processed' };
        }, { body: SideShiftWebhookSchema })

        // --- Feature Parity Proxy Endpoints ---
        .post('/quotes', async ({ body }) => sideshift.createQuote(body), { body: CreateQuoteSchema })
        .post('/checkouts', async ({ body }) => {
            const { userIp, ...checkoutData } = body;
            return sideshift.createCheckout({ ...checkoutData, userIp }, process.env.SIDESHIFT_AFFILIATE_ID!);
        }, { body: CreateCheckoutSchema })
        // --- Caching Layer for Performance ---
        .state('cache', { pairs: null, coins: null, lastFetch: 0 })
        .get('/pairs', async ({ query, store }) => {
            const now = Date.now();
            if (!store.cache.pairs || now - store.cache.lastFetch > 60000) { // 1 minute cache
                console.log("CACHE MISS: Fetching pairs from SideShift");
                store.cache.pairs = await sideshift.getPairs();
                store.cache.lastFetch = now;
            }
            let pairs = store.cache.pairs as any[];
            if (query.from) pairs = pairs.filter(p => p.from === query.from);
            if (query.to) pairs = pairs.filter(p => p.to === query.to);
            return pairs;
        }, {
            query: t.Object({ from: t.Optional(t.String()), to: t.Optional(t.String()) })
        })
        .get('/coins', async ({ store }) => {
            const now = Date.now();
            if (!store.cache.coins || now - store.cache.lastFetch > 60000) { // 1 minute cache
                console.log("CACHE MISS: Fetching coins from SideShift");
                store.cache.coins = await sideshift.getCoins();
                store.cache.lastFetch = now;
            }
            return store.cache.coins;
        })
        .get('/coins/:id/icon', async ({ params, set, store }) => {
            const now = Date.now();
            if (!store.cache.coins || now - store.cache.lastFetch > 60000) {
                console.log("CACHE MISS: Fetching coins for icon lookup from SideShift");
                store.cache.coins = await sideshift.getCoins();
                store.cache.lastFetch = now;
            }
            const coin = (store.cache.coins as any[]).find((c: any) => c.id === params.id || c.coin === params.id);
            if (!coin || !coin.svg) {
                set.status = 404;
                return { error: 'Coin or icon not found' };
            }
            const response = await fetch(coin.svg);
            set.headers['Content-Type'] = 'image/svg+xml';
            set.headers['Cache-Control'] = 'public, max-age=86400';
            return response.text();
        })
    );

const startServer = async () => {
    try {
        await initDb();

        // Re-enable webhook registration
        const webhookUrl = `${process.env.SERVER_PUBLIC_URL}/api/v1/sideshift-webhook`;
        if (process.env.SERVER_PUBLIC_URL) {
            console.log(`Attempting to register webhook: ${webhookUrl}`);
            await sideshift.setupWebhook(webhookUrl);
            console.log("✅ Webhook registered with SideShift successfully.");
        } else {
            console.warn("⚠️ SERVER_PUBLIC_URL is not set. Skipping webhook registration.");
        }

        app.listen(3000);
        console.log(`🦊 ShiftHook server running at http://${app.server?.hostname}:${app.server?.port}`);
        console.log("🔥 Swagger documentation available at http://localhost:3000/swagger");
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
