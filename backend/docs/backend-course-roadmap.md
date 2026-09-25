# Backend Course Portfolio Roadmap

## Understanding summary

- Build a portfolio-quality REST API for a recipe application.
- Use Express, Prisma, PostgreSQL, JWT, Zod, and a watchlist feature.
- Use Next.js as the future frontend.
- Deploy the frontend and API on Vercel without buying a domain initially.
- Use Supabase as the production PostgreSQL provider.
- Work milestone by milestone and stop after each milestone for code review.

## Assumptions

- The project is a personal portfolio application, not a high-scale production system.
- JWT authentication remains application-managed rather than migrating to Supabase Auth.
- The API remains REST-based.
- Database schema changes use Prisma migrations.
- Supabase connection pooling is used for deployed environments.
- The initial deployment uses Vercel-provided domains.

## Milestones

1. **Foundation:** project structure, scripts, environment configuration, app/server separation.
2. **Database:** schema cleanup, watchlist relations, migrations, repeatable seed data.
3. **API foundation:** `/api/v1`, consistent responses, 404/error handling, recipe/category CRUD.
4. **Authentication:** registration, login, logout, current user, JWT middleware, ownership checks.
5. **Watchlist:** add, remove, list, duplicate protection, ownership rules.
6. **Validation and testing:** Zod validation and tests for auth, recipes, and watchlist.
7. **Deployment:** Supabase production database, Vercel API/frontend, CORS, auth configuration, health check, README, and API documentation.

## Milestone workflow

For each milestone: inspect current state, define scope, implement only that scope, run proportionate checks, report changed files and results, then stop for user review. Continue only after explicit confirmation.

## Risks

- Vercel runs Express as a serverless function rather than a permanently running process.
- Supabase connection limits require appropriate Prisma pooling configuration.
- JWT cookies across separate Vercel projects require careful CORS and credential configuration.
- The current schema and naming need cleanup before adding watchlist behavior.
- Existing controllers need centralized error handling.

## Decision log

| Decision | Alternatives | Reason |
| --- | --- | --- |
| Organize work by product milestones | Course order, vertical slices | Easier progress checks and stronger portfolio outcome |
| Deploy Next.js and Express on Vercel | Hostinger, mixed hosting | No upfront hosting/domain cost and good Next.js workflow |
| Use Supabase PostgreSQL | Hostinger database, local-only database | Managed PostgreSQL suitable for Prisma and deployment |
| Keep JWT managed by the API | Supabase Auth | Preserves the course learning goals |
| Use Vercel-provided domains initially | Buy a custom domain | Avoid unnecessary cost before the portfolio is ready |
