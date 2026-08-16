# Testing

## Unit tests

| Paquete | Qué cubre |
|---|---|
| `@pescaba/geo` | Haversine, radio, bounding box, validación de coordenadas |
| `@pescaba/shared` | Schemas zod (nearby, sugerencias), transformaciones |
| `apps/api` | Utilidades (duraciones JWT) y servicios |

```bash
pnpm --filter @pescaba/geo --filter @pescaba/shared --filter api test
```

## Tests e2e (requieren DB + Redis)

Cubren:
- Health.
- `/v1/sites/nearby` con PostGIS (orden por distancia).
- `/v1/sites/search` con tolerancia a acentos.
- `/v1/sites/autocomplete`.
- Registro, login, `/auth/me`.
- Favoritos (crear y listar).
- Sugerencias (público, queda pending).
- Reportes (autenticado).
- Protección de rutas admin (401 sin token, 403 con rol `user`).

```bash
docker compose up -d db redis
pnpm --filter api prisma:migrate        # contra la DB de test
pnpm --filter api test:e2e
```

El test usa `TEST_DATABASE_URL` (default `.../pesca_ba_test`) y `TEST_REDIS_URL`.

## En CI

GitHub Actions levanta PostgreSQL+PostGIS y Redis como servicios y corre
`lint → typecheck → unit → migraciones → e2e → build`.
