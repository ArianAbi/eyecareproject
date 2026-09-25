# Eyecare project

Persian RTL optical ordering application with a customer area and admin panel, built with Next.js App Router, Prisma/PostgreSQL and local shadcn/Base UI components.

## Documentation

- [Implementation and LLM guide](docs/PROJECT_GUIDE.md): architecture, routes, forms, actions, UI contracts, data model, setup, and extending or repurposing the admin panel.
- [Bugs and design findings](docs/PROJECT_FINDINGS.md): evidence, impact, confidence and verification steps.
- [Improvement suggestions](docs/PROJECT_IMPROVEMENTS.md): priorities and completion criteria.
- [Daily order management](doc/order-management.md): grouped orders, history and daily fees.
- [Image uploads](docs/image-uploads.md): private assets, quota, ownership and cleanup.
- [F-01?F-18 deployment](docs/hardening-deployment.md): required migration/configuration and validation limits.
- [Payment recovery](docs/payment-recovery.md): attempts, reconciliation and delayed credit.

Read [AGENTS.md](AGENTS.md) before changing code. Start with the implementation guide rather than assuming older Next.js or shadcn/Radix conventions.

## Development

Install using `npm ci`, configure environment/database as described in the guide, generate Prisma Client with `npx prisma generate`, and run `npm run dev`.

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

On Windows PowerShell, use `npm.cmd` and `npx.cmd` if execution policy blocks `.ps1` launchers. Build generates Prisma Client but does not apply migrations. `npm run prisma` runs **db push**, which changes the database; it is not a read-only validation command.
