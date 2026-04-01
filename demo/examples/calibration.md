# Calibration Examples

These examples calibrate CodeLens AI's output style and depth.

---

## Example 1 — Repo Explanation (Good)

**User:** Explain the expressjs/express repo.

**CodeLens AI:**

# Express.js — Repository Overview

## What It Does
Express is a minimal, unopinionated web framework for Node.js. It wraps Node's built-in `http` module with a routing system, middleware pipeline, and request/response helpers — making HTTP server development significantly less verbose while staying close to the Node.js primitives.

## Tech Stack
- **Language:** JavaScript (Node.js)
- **Core dependency:** Node.js `http` module (no external framework)
- **Test framework:** Mocha + Supertest
- **Build tools:** None (plain JS, no bundling)
- **Notable libraries:** `path-to-regexp` (route matching), `depd` (deprecation warnings), `debug` (logging)

## Project Structure
```
express/
├── lib/
│   ├── express.js          # Main export — factory function
│   ├── application.js      # App prototype — settings, middleware, routing
│   ├── request.js          # Extends Node's IncomingMessage with helpers
│   ├── response.js         # Extends Node's ServerResponse with helpers (res.json, res.send, etc.)
│   ├── router/
│   │   ├── index.js        # Core router — handles route matching and middleware dispatch
│   │   ├── route.js        # Individual route (GET/POST/etc. handlers per path)
│   │   └── layer.js        # A single middleware/route layer in the stack
│   └── middleware/
│       ├── init.js         # Initialization middleware (sets req.res, res.req, etc.)
│       └── query.js        # Parses query strings onto req.query
├── test/                   # Mocha test suite
└── index.js                # Entry point (just re-exports lib/express.js)
```

## How It Works — Main Flow

1. `require('express')` returns a factory function from `lib/express.js`
2. Calling `express()` creates an `app` function (a Node.js request handler)
3. `app.use()` / `app.get()` / etc. push handlers onto the router's middleware stack
4. When a request arrives, `app` calls the router, which walks the stack looking for matching layers
5. Each matching layer is called with `(req, res, next)` — calling `next()` advances to the next layer
6. `req` and `res` are prototype-extended versions of Node's built-in objects, adding Express's helper methods

## Key Design Decisions

1. **No classes — prototype extension.** Express extends Node's `IncomingMessage` and `ServerResponse` prototypes rather than wrapping them. Faster and closer to Node internals, but less idiomatic modern JS.
2. **Middleware is just functions.** The entire system is built on `(req, res, next)` functions. Routers are middleware. Error handlers are middleware. This uniformity is what makes the ecosystem composable.
3. **Minimal core, ecosystem for the rest.** Express ships with almost nothing — no ORM, no templating, no auth. Everything comes from middleware packages. Intentional design for flexibility.

## Entry Points for New Developers
1. Start at `lib/router/index.js` — this is the heart of Express
2. Then read `lib/application.js` to understand how the app is initialized
3. Then `lib/response.js` to see how `res.json()`, `res.send()` etc. work

## Potential Gotchas
- **Prototype mutation is global.** Express modifies Node's built-in prototypes. This is fine in practice but important to understand.
- **Error middleware must have 4 parameters:** `(err, req, res, next)`. Miss the `err` and it won't be called for errors.
- **`next()` vs `next(err)`.** Calling `next()` advances normally. Calling `next(err)` skips to the next error handler.

---

## Example 2 — Interview Question (Good)

**Q: Express's router uses a concept called "layers" to represent middleware. Looking at `lib/router/layer.js`, what is a Layer and why does Express use this abstraction instead of storing handler functions directly?**

📁 **Related to:** `lib/router/layer.js`, `lib/router/index.js`

💡 **Good answer looks like:**
- Recognizes that a Layer wraps both a route path pattern and a handler function
- Explains that Layer handles path matching (via `path-to-regexp`) alongside the handler
- Notes that Layer stores the parsed parameters extracted from the URL
- Strong answer mentions that this separation allows the router to test a layer's path without calling its handler — separating matching logic from execution logic

---

## Example 3 — Code Explanation (Good)

**User:** Explain the `finalhandler` usage in Express.

**CodeLens AI:**

## What It Does
`finalhandler` is a fallback request handler. It runs after all middleware has finished (or if none match) and is responsible for closing the HTTP response cleanly — either with a 404 "Not Found" or a 500 "Internal Server Error" depending on whether an error was passed.

## Why It Exists
Without a final handler, if no middleware sends a response, the HTTP request would hang forever — the client would wait indefinitely. `finalhandler` is the safety net that guarantees every request gets a response.

## How It Works
1. Express creates a `finalhandler(req, res)` at the start of each request
2. This handler is passed as the `done` callback to the router
3. If the router processes all layers without any of them ending the response, `done()` is called
4. `finalhandler` checks: was an error passed? → 500. No error? → 404.
5. It also handles cases where headers were already sent (can't send a second response)

## Watch Out For
- If you call `next()` after `res.send()`, Express will call finalhandler, which will try to send another response — and fail silently because headers are already sent. Always return after sending a response: `return res.send(...)`.