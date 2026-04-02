# TaskFlow

A Next.js task manager with:

- JWT auth
- Prisma + PostgreSQL/Neon
- Projects and sections
- Drag-and-drop task board
- Dashboard, task list, and calendar modal

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_REFRESH_SECRET="replace-with-another-long-random-secret"
```

3. Generate Prisma client and sync the schema:

```bash
npx prisma generate
npx prisma db push
```

4. Start development:

```bash
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```

## Notes

- `.env.local`, `.next`, and `node_modules` are ignored.
- The app auto-creates a personal workspace and default project for new users.
- Drag-and-drop is implemented with `@dnd-kit`.
