# Microservices E-Commerce Platform

Four TypeScript/Node services are fronted by an API gateway: authentication, catalog/inventory, orders, and payments. Docker Compose also starts an isolated PostgreSQL container for each service.

## Prerequisites

- Docker Desktop with Docker Compose v2
- Node 22+ only when running the optional host-side integration script

## Start the complete platform

```bash
cp .env.example .env # replace placeholders for non-development use
docker compose up -d --build
docker compose ps
```

Wait for all nine containers to report `healthy` (normally under a minute):

```bash
docker compose ps
curl http://localhost:8080/health
```

Gateway: `http://localhost:8080`. The services are intentionally not published on host ports; access them through the gateway.

## Verify the API manually

1. Get a user token:

```bash
curl -X POST http://localhost:8080/api/auth/token -H "Content-Type: application/json" -d '{"email":"buyer@example.com","name":"Buyer","provider":"google","providerId":"buyer-1"}'
```

2. Set the returned token in your shell and create a product:

```bash
export TOKEN='<accessToken>'
curl -X POST http://localhost:8080/api/products -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Keyboard","description":"Mechanical","price":99.99,"stock":10}'
```

3. Create an authenticated order using the returned product id, then post a successful Stripe-shaped webhook:

```bash
curl -X POST http://localhost:8080/api/orders -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "X-Request-ID: demo-order-001" -d '{"items":[{"productId":"<product-id>","quantity":2}]}'
curl -X POST http://localhost:8080/api/payments/webhooks/stripe -H "Content-Type: application/json" -d '{"type":"charge.succeeded","data":{"object":{"metadata":{"orderId":"<order-id>"}}}}'
```

The seeded administrator is `admin@example.com`; requesting a token for that email gives an ADMIN claim. `GET /api/admin/summary` accepts that token and rejects USER tokens with 403.

## Main flow

Create products at `POST /api/products`; submit an authenticated order to `POST /api/orders`; then post a `charge.succeeded` event to `POST /api/payments/webhooks/stripe`. Product stock is reserved atomically by the product service; failed multi-item reservations are compensated before an order is written.

All backend calls require the gateway-injected `X-Internal-Service-Key`. Every request carries `X-Request-ID`, which is included as `correlationId` in JSON logs.

## Automated tests and coverage

```bash
docker compose run --rm auth-service npm run test:coverage
docker compose run --rm product-service npm run test:coverage
docker compose run --rm order-service npm run test:coverage
docker compose run --rm payment-service npm run test:coverage
```

Each command prints a Vitest coverage summary. Integration scenarios are in `integration-tests/critical-flows.mjs` and can run against a started stack with `node integration-tests/critical-flows.mjs`.

Run the critical integration scenario after the stack is healthy:

```bash
node integration-tests/critical-flows.mjs
```

It proves successful order creation and inventory deduction, verifies insufficient-stock rejection without a second deduction, and processes the payment webhook.

## Operational checks

```bash
# All containers, including four databases, must say healthy
docker compose ps

# Trace an order across gateway, order, and product logs
docker compose logs api-gateway order-service product-service | grep 'demo-order-001'

# Stop without erasing databases; use -v only when intentionally resetting data
docker compose down
```

The gateway enforces 20 requests per minute per IP and returns 429 plus rate-limit headers on request 21. It validates protected JWTs by calling `auth-service /auth/validate`; it does not merely decode them. The gateway adds `X-Internal-Service-Key` to every upstream request, while product/order/payment reject direct requests missing that key. `X-Request-ID` is forwarded through service-to-service calls and emitted as `correlationId` in structured JSON logs.
