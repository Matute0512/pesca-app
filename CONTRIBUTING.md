# Contribuyendo a PescaBA

Gracias por querer aportar. Estas son las convenciones del proyecto.

## Puesta en marcha

Seguí la guía completa en [docs/SETUP.md](docs/SETUP.md). En resumen:

```bash
pnpm install
docker compose up -d
cp .env.example .env
cp apps/api/.env.example apps/api/.env
pnpm db:migrate && pnpm db:seed
```

## Commits (Conventional Commits)

Usamos **Conventional Commits** (`type(scope): descripción`). Tipos principales:

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio de código sin cambiar comportamiento |
| `docs` | Documentación |
| `test` | Tests |
| `chore` | Tareas de mantenimiento (deps, CI, config) |
| `perf` | Mejoras de rendimiento |

Ejemplos:

```
feat(sites): agregar filtro por especies en la búsqueda
fix(auth): manejar refresh token expirado
docs(api): documentar /v1/sites/nearby
```

Reglas:
- La descripción en inglés o español (consistencia: preferentemente inglés para el código).
- Sin referencias a issues en el subject; ir en el body.
- Si el commit cambia el comportamiento de la API o la DB, documentarlo en el body.

## Ramas y PRs

- Ramas de trabajo: `feat/`, `fix/`, `docs/`, `chore/` (`feat/nearby-radius`).
- La rama principal es `main`. Para integrar cambios: **PR con squash**.
- Un PR debe pasar CI: lint, typecheck, tests unitarios y e2e.
- Preferir PRs pequeños y enfocados.

## Código y estilo

- TypeScript estricto en todos los workspaces.
- Formato: Prettier (`pnpm exec prettier --write .`).
- Lint: ESLint (`pnpm lint`).
- No hardcodear secrets; todo por variables de entorno (`docs/ENV.md`).
- Comentarios y doc en español (producto); identificadores en inglés.
- Los paquetes compartidos se compilan antes que las apps:
  `pnpm --filter @pescaba/shared --filter @pescaba/geo build`.

## Tests

- Unit: `pnpm test` (geo, shared, api).
- E2E (requiere PostGIS + Redis): `pnpm test:e2e`.
- Antes de abrir un PR: `pnpm lint && pnpm typecheck && pnpm test`.

## Cambios de esquema

- Editar `apps/api/prisma/schema.prisma` y generar una migración con
  `pnpm db:migrate:dev` (revisar el SQL generado).
- Mantener las convenciones geoespaciales de `docs/DATABASE.md` (expresión index GiST).
