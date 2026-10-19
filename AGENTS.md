# Project Overview

**bustit** is a browser-based multiplayer blackjack game for a closed circle of
friends. Players sit at shared tables, spectators watch and can bet on seated
players, and everyone plays with a play money balance.

## Functionality

**Closed group**
There is no open registration. New users join with an invite code issued by an
admin and choose their own username and password. There is no email, no OAuth
and no free text chat.

**Play money only**
The balance has no real-world value: it can't be bought, paid out or traded
for prizes. This keeps the game outside gambling regulation. Treat it as a hard
constraint and never add anything that would give the balance real value. If a
feature seems to need that, raise it rather than acting on it.

**Tables**
There are several tables, all of them public. Joining a table makes a user a
spectator, and taking a seat makes them a player. Spectators and players can
place backbets on other players' seats, but never on their own seat.

## Tech Stack

- **Runtime**: Node.js 24+, TypeScript 6
- **Monorepo**: npm workspaces
- **Server**: NestJS 12 (ESM) with Express, winston via `nest-winston`
- **Web**: Next.js 16 (App Router) with React 19, Tailwind CSS v4
- **Database**: PostgreSQL 18, Drizzle ORM 0.45 with `node-postgres` via
  `@nestjs/drizzle`, `drizzle-kit` for migrations
- **Validation**: Zod
- **Testing**: Vitest, Supertest, Testcontainers (Postgres)
- **Tooling**: ESLint 9 (flat config per package), Prettier (repository root)

## Project Structure

```
.
├── packages/
│   ├── engine/                 # @bustit/engine: blackjack rules as pure functions
│   │   ├── src/
│   │   │   ├── cards/          # Cards, hand values, shoe
│   │   │   ├── round/          # Round flow: start, actions, dealer, settlement, queries
│   │   │   ├── rng.ts          # Injectable, seedable randomness
│   │   │   └── rules.ts        # Table rules, fixed rules, payout
│   │   └── tests/              # Scenario, invariant and house edge tests mirroring src/
│   ├── shared/                 # @bustit/shared: Zod schemas and types for server and web
│   ├── server/                 # @bustit/server: NestJS game server
│   │   ├── src/
│   │   │   ├── infrastructure/ # Technical concerns: config, database, logging, health
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── drizzle/            # Generated migrations, committed
│   │   ├── drizzle.config.ts   # drizzle-kit config
│   │   └── tests/              # Unit tests mirroring src/, e2e tests at the top level
│   └── web/                    # @bustit/web: Next.js client, UI only
│       └── src/app/
├── tsconfig.base.json          # Shared compiler options for engine, shared and server
└── package.json                # Workspace scripts
```

## Design Decisions

- **Server is authoritative**: The server owns the deck, shuffle, rules and
  every balance change. Clients only send actions and never decide outcomes.
- **Game rules in `@bustit/engine`**: Blackjack logic is a set of pure
  functions with an injectable RNG, free of NestJS, I/O and timers. This keeps
  the rules deterministic and testable.
- **The engine is the dealer, the server is the casino**: The engine deals,
  plays the dealer and settles hands. It knows stakes per hand, because
  doubles and splits change them, but not whose money they are. A seat is just
  an index. Users, seating, spectators, balances, the ledger, betting, timers,
  backbets and side bets belong to the server.
- **Backbets settle outside the engine**: A backbet has no influence on the
  game. The server settles it with `payout`, the outcome of the seat's first
  hand and the backbet's own flat stake.
- **Rounds advance by decisions**: `startRound` and `applyAction` run on until
  the next player decision, including dealing, a split hand's second card,
  the dealer's play and the settlement. A timed-out player is sent `stand`.
  Each call returns a new round and the events of what happened, in order.
- **Immutable rounds as plain JSON**: Every call returns a new round and
  never changes the one passed in. Internally a call works on a mutable
  draft. The round holds no classes and no RNG, so it can be stored, logged
  and replayed.
- **Expected failures are values**: Invalid bets and actions return a
  `Result` with an error code. Exceptions are reserved for programming errors.
- **Nothing secret reaches clients**: Events never contain a face-down hole
  card and can be broadcast unchanged. Snapshots for clients go through
  `publicView`, which also drops the shoe, because its order reveals every card
  to come. `availableActions` tells the server what an action costs before it
  is applied, so the stake can be reserved first.
- **Rules as data, only where variants are realistic**: `TableRules` holds what
  may differ between tables or rounds, such as the blackjack payout or the
  hole card rule. Rules without a realistic variant are fixed in the code and
  listed on `TableRules`. A rule moves into `TableRules` once a feature needs
  it.
- **Stable hand indices**: A split appends the new hand to the seat, so hand
  indices never shift, and hands are played in index order.
- **Feature modules in the server**: Business features get their own folder
  directly under `src/`. Technical concerns that have no business meaning live
  in `src/infrastructure/`. There are no horizontal layers such as
  core/presentation, because the domain logic already lives in the engine.
- **Barrel exports per module**: Each module exposes its public API through
  `index.ts`. Nothing else is imported from outside the module.
- **Libraries are built, not transpiled by consumers**: `engine` and `shared`
  compile to `dist/` and are consumed from there. The root scripts build them
  before `dev`, `typecheck`, `lint` and `test`.
- **Tests next to `src/`, not inside it**: Each package keeps its tests in a
  `tests/` folder whose structure mirrors `src/`. Unit tests are named
  `*.spec.ts`, end-to-end tests `*.e2e-spec.ts`. Long-running simulations are
  named `*.sim.ts` and run only through `test:sim`, not with every `test`.
  The engine's house edge simulation plays millions of hands by basic strategy
  and checks the result against the published house edge for the rules, which
  catches rules that are wrong yet consistent.
- **ESM throughout**: All packages are `"type": "module"`. Relative imports in
  the Node packages carry the `.js` extension.
- **Same origin for web and server**: In production, a reverse proxy routes
  `/api` to the server on the same domain as the web app. In development,
  Next.js rewrites `/api` to the server instead. The client never needs a
  configurable API base URL.
- **Fail fast on config**: Environment variables are validated with Zod at
  startup. Invalid config stops the boot.
- **Structured logging with request ids**: Every HTTP request gets an id that
  is attached to all log records written while handling it and is returned as
  `X-Request-Id`. The console gets readable output, and the rotated files get
  JSON.
- **Postgres through Drizzle's query builder**: Queries use the query builder
  and plain SQL, not the relational query API (`db.query`), which changes with
  Drizzle 1.0. The database is injected with `@InjectDrizzle()` and typed as
  `Database`. Tables are declared in camelCase and stored in snake_case.
- **Tables live with their feature**: Each feature module declares its tables
  in `*.schema.ts` files next to its code. drizzle-kit collects them by that
  pattern.
- **Migrations are generated, committed and run before the start**: Schema
  changes go through `npm run db:generate -w @bustit/server`. Generated
  migrations are committed and never edited by hand. They are applied as a
  separate step before the server starts, never by the server itself.
- **Real Postgres in tests**: E2e tests run against a throwaway Postgres from
  Testcontainers instead of mocks. Local development uses the Postgres from
  `compose.dev.yaml`.

## Coding Principles

- **KISS**: Prefer the simplest solution that works. Avoid unnecessary abstractions – extract only after the third repetition (Rule of Three).
- **DRY**: Define logic once, import everywhere. Duplicated code is a maintenance liability.
- **YAGNI**: Don't build features or abstractions on speculation. Implement what's needed now.
- **Single Responsibility**: Each function, component, and module has one clear purpose.
- **Fail Fast**: Validate inputs early, throw meaningful errors immediately. Never swallow exceptions silently.
- **Guard Clauses over Nesting**: Prefer early returns over deeply nested `if/else` blocks.
- **Immutability by Default**: Use `const`, `readonly`, and spread operators. Avoid mutation unless there's a clear performance reason.
- **Explicit over Implicit**: Prefer explicit parameters and return types over hidden assumptions or side effects.
- **No Comment Spam**: Document _why_, not _what_. Docstrings on public APIs are welcome; `// increment counter` before `counter += 1` is not.

## General Instructions

- Never dig into node_modules – if you need to understand a dependency, read its docs or types, not its source. If something seems broken, check imports,
  versions, and your own code first. If you need still additional information just ask me.
- Prefer reading before writing – understand the existing structure before generating new files or refactoring. Don't assume conventions; verify them.
- Don't fix what you didn't break – scope changes strictly to what was asked. No opportunistic refactors, formatting fixes, or "while I'm here" changes. But if
  you find something feel free to tell me.
- One task at a time – complete and verify the current task before moving to the next. Don't batch unrelated changes in one go.
- Comments explain the code and the decisions behind it – why an approach was
  chosen over an alternative, what a non-obvious constraint is, what would break
  if it were done differently. They are not the place for business rationale,
  market reasoning, measurements, or the discussion that led to a change. Those
  belong in the commit message, the docs or the issue. In particular: do not
  carry justifications from our conversation into the code just because they
  were convincing at the time.
- Use npm, never pnpm or yarn.
- Local development and e2e tests need Docker. Start the development database
  with `npm run db:up` and stop it with `npm run db:down`.
- Verify changes with `npm run typecheck`, `npm run lint`, `npm run test` and
  `npm run format` before considering a task done.
