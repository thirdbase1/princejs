# ShiftKit: The Production-Ready Toolkit for Integrating SideShift in Minutes.

ShiftKit is a robust, lightweight, and fully-typed TypeScript SDK designed to provide the ultimate developer experience for the SideShift.ai API. It's paired with a live, interactive Next.js showcase application that serves as both a powerful demonstration and a sandbox for the SDK's features.

**Our goal:** To create a toolkit so powerful and easy to use that it becomes the undisputed choice for any developer working with SideShift.

---

## 🚀 Live Interactive Sandbox

Actions speak louder than words. Our showcase application isn't just a demo; it's a live laboratory for the SDK.

**[Link to Live Demo Coming Soon]**

---

## ✨ Why ShiftKit is the Superior Choice

*   **Unmatched Developer Experience:** The interactive showcase provides instant, tangible feedback, making development faster and more intuitive.
*   **Rock-Solid Security:** Built with a secure backend-for-frontend (BFF) pattern in Next.js, our architecture ensures your API keys are never exposed on the client-side.
*   **Intelligent High-Level Abstractions:** We provide powerful workflow accelerators like `performFixedSwap` and `waitForShift` that go far beyond simple API wrappers, saving you time and reducing complexity.
*   **Real-Time Event Handling:** Our SDK includes a secure, easy-to-configure webhook handler to confirm shifts with cryptographic certainty, a feature essential for production applications.

---

## 🛠️ The 2-Minute Quick Start

### 1. Set Up Environment Variables

Copy the `.env.example` file to a new file named `.env.local` and add your SideShift API credentials.

```bash
cp .env.example .env.local
```

```
# .env.local
SIDESHIFT_SECRET="YOUR_SIDESHIFT_SECRET"
SIDESHIFT_AFFILIATE_ID="YOUR_SIDESHIFT_AFFILIATE_ID"
```

### 2. Install Dependencies & Run

```bash
npm install
npm run dev
```

Your showcase application will be running at `http://localhost:3000`.

---

## 📚 SDK Usage & API

The core `ShiftKit` SDK is located in the `lib/` directory and can be easily integrated into any Node.js or Bun project.

### Initialization

```typescript
import { ShiftKit } from './lib/shiftkit';

const shiftKit = new ShiftKit({
  secret: 'YOUR_SIDESHIFT_SECRET',
  affiliateId: 'YOUR_SIDESHIFT_AFFILIATE_ID',
});
```

### Core Methods

*   `getCoins(): Promise<Coin[]>`
*   `getPairs(): Promise<Pair[]>`
*   `requestQuote(...): Promise<Quote>`
*   `createFixedShift(...): Promise<Shift>`
*   `getShift(id): Promise<Shift>`

### High-Level Abstractions

*   `performFixedSwap(...): Promise<Shift>`: Executes a full fixed-rate swap in a single call.
*   `waitForShift(id, options): Promise<Shift>`: Polls for a shift's status and provides real-time updates.

---

## 🖥️ The Next.js Showcase App

This repository is a live Next.js application that serves as a demonstration and interactive sandbox for the ShiftKit SDK. It's the best way to see the SDK in action!

### Key Components:

*   **Coin Lister:** Fetches and displays all supported coins.
*   **Interactive Swap Form:** A user-friendly form to create new swaps.
*   **Real-Time Status Tracker:** Monitors and displays the status of active swaps.
*   **Webhook Event Log:** [Coming Soon] Displays incoming webhook events for real-time confirmation.
