# Frontend

React + TypeScript storefront. Browser requests use the relative prefix
`/api/v1`; the `api-gateway` service routes them to the backend services.

## Local development

```bash
npm install
npm run dev
```

The Vite development server runs at `http://localhost:5173` and proxies `/api` to a gateway running at `http://localhost:8080`.

## Verification

```bash
npm run typecheck
npm run test:run
npm run build
```

## Container

```bash
docker build -t frontend .
```

The production NGINX container exposes `GET /health` with `status`, `service`
and the deployed `version`. Set `APP_VERSION` at runtime; it defaults to
`1.0.0` for local runs.
