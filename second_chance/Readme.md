# Second Chance: Performance without compromise.

[![npm version](https://badge.fury.io/js/second-chance.svg)](https://badge.fury.io/js/second-chance)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Second Chance** is a minimalist, modern, and extremely fast TypeScript backend framework for the Bun runtime. It is designed for developers who need world-class performance without sacrificing clean, modern syntax.

---

## 🚀 Performance

Second Chance is one of the fastest backend frameworks in the JavaScript ecosystem. Its speed comes from a minimalist design, a hyper-optimized Trie-based router, and running on the blazingly fast Bun runtime.

**Benchmark Results:**

| Framework | Avg. Reqs/sec |
| :--- | :--- |
| **Second Chance (with middleware)** | **~41,600** |
| PrinceJS | ~37,500 |
| Express.js | ~7,000 |

*Benchmarks were run on the same machine under identical load.*

**Reproduce the Benchmark:**
You can run the benchmark yourself to verify the speed:
```bash
# First, start the test server
bun run second_chance/test.ts

# In another terminal, run the benchmark
go install github.com/codesenberg/bombardier@latest
~/go/bin/bombardier -c 125 -d 10s http://localhost:3000/
```

---

## ✨ Quick Start

The API is designed to be simple, intuitive, and require minimal boilerplate.

```typescript
import { SecondChance } from './second_chance/index';

const app = new SecondChance();

app.get('/', () => {
  return { message: 'Hello from Second Chance!' };
});

app.listen(3000);
```

---

## Features

### Routing
Second Chance includes a powerful and fast router that supports:
- **Static routes:** `/`
- **Parameterized routes:** `/users/:id`
- **Wildcard routes:** `/files/*`

### Middleware
The framework has a flexible and high-performance middleware system.
```typescript
app.use(async (req, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  const response = await next(); // a next() call is required.
  return response;
});
```

### TypeScript First
The entire framework is written in TypeScript and is designed to provide a first-class developer experience with excellent type inference and autocompletion.

### Error Handling
A robust global error handler ensures that all errors are caught and can be handled gracefully.
```typescript
app.error((err, req) => {
  console.error(err);
  return app.json({ error: 'An error occurred' }, 500);
});

app.get('/oops', () => {
  throw new Error('Something went wrong!');
});
```

---

## 🛣️ Roadmap

Second Chance is just getting started. Based on the best ideas from modern frameworks, here is what's coming next:

- **Built-in Validation:** First-class support for Zod for request validation.
- **Nested Routers:** The ability to compose and mount routers.
- **File-based Routing:** An optional, Next.js-style file-based routing system.
- **Static File Server:** A simple and efficient static file server.

---

## Installation

```bash
# This is a conceptual package name, as it's not on npm yet.
npm install second-chance-framework
```
