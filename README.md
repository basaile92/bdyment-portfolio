# bdyment-portfolio

Monorepo for Basile Dyment's portfolio (bdyment.com).

## Layout

- `front/` — React app (former `bdyment-portfolio-front`)
- `back/` — GraphQL Lambda handler (former `bdyment-portfolio-back`)
- `infra/` — AWS CDK stacks (former `bdyment-portfolio-infra`)

## CI

`.github/workflows/ci.yml` runs `front`, `back`, and `infra-test` in parallel.
Path filters skip untouched projects on PRs. On push to `main`, the `deploy`
job downloads the build artifacts and runs `cdk deploy --all`.

## Required repo secrets

- `AWS_ACCESS_KEY`
- `AWS_SECRET_KEY`
- `AWS_REGION`

## Local dev

Each subdir is a standalone Node project — `cd front && npm install` etc.
