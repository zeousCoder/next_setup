# Next Setup

Starter project built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, Zod, and MySQL.

## Project Setup

```bash
npx create-next-app@latest ./ --typescript --tailwind --react-compiler --app --src-dir --import-alias "@/*" --use-npm --yes --no-eslint

npx shadcn@latest init --preset b4BmfG6j0S
```

To add more shadcn components later:

```bash
npx shadcn@latest add 

--- after this ---

press {a} for all and than enter
```

## Install and Run

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

## Environment Setup

You already have `.env.example`. Create `.env` from it before running DB APIs.

PowerShell:

```powershell
Copy-Item .env.example .env
```

Then ensure `.env` has:

```env
MYSQL_URL=mysql://root:root@127.0.0.1:3306/portal1
MYSQL_URL_1=mysql://root:root@127.0.0.2:3306/portal
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production server

## Folder Structure

```text
next_setup/
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  └─ users/route.ts
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  └─ sign-up/page.tsx
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ Header.tsx
│  │  │  └─ Footer.tsx
│  │  └─ ui/
│  ├─ constants/
│  │  ├─ httpStatus.ts
│  │  ├─ pageRoutes.ts
│  │  └─ globalConstants.ts
│  ├─ lib/
│  │  ├─ api/
│  │  │  ├─ apiFetcher.ts
│  │  │  ├─ apiResponse.ts
│  │  │  └─ apiHandler.ts
│  │  ├─ db/
│  │  │  ├─ mysql.ts
│  │  │  └─ sql_log.sql
│  │  └─ utils.ts
│  ├─ providers/
│  │  └─ ThemeProvider.tsx
│  ├─ schemas/
│  │  └─ auth/index.ts
│  └─ types/
│     └─ auth/index.ts
├─ public/
├─ .env.example
├─ .env
├─ next.config.ts
├─ package.json
└─ tsconfig.json
```
