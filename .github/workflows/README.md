# CI/CD Workflows Documentation

This document describes the CI/CD pipeline for the WebApp project.

## Overview

The CI/CD pipeline consists of three workflows:

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | [`ci.yaml`](./workflows/ci.yaml) | PR, Push to main/develop | Run tests and validations |
| Staging | [`staging.yaml`](./workflows/staging.yaml) | Push to develop | Deploy to staging environment |
| Production | [`production.yaml`](./workflows/production.yaml) | Push to main | Deploy to production environment |

## Workflow Details

### CI Workflow

Runs on every Pull Request and push to main/develop branches.

**Jobs:**

1. **db-test** - Database testing
   - Starts local Supabase instance
   - Runs database linting
   - Executes database tests

2. **db-dryrun** - Migration validation
   - Links to remote Supabase project
   - Performs dry-run of migrations (validates without applying)

3. **frontend-build** - Frontend validation
   - Installs npm dependencies
   - Runs TypeScript type checking
   - Builds the Next.js application

### Staging Workflow

Deploys to staging environment when code is pushed to the `develop` branch.

**Jobs:**

1. **migrate** - Database migration
   - Links to staging Supabase project
   - Pushes pending migrations

2. **deploy** - Frontend deployment
   - Builds Next.js with staging configuration
   - Deploys to GitHub Pages at `/staging/` path

### Production Workflow

Deploys to production environment when code is pushed to the `main` branch.

**Jobs:**

1. **migrate** - Database migration
   - Links to production Supabase project
   - Pushes pending migrations

2. **deploy** - Frontend deployment
   - Builds Next.js with production configuration
   - Deploys to GitHub Pages at root path

## Required GitHub Secrets

Configure these secrets in your repository settings (Settings → Secrets and variables → Actions):

| Secret | Description | How to Obtain |
|--------|-------------|---------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token | [Supabase Account Settings](https://supabase.com/dashboard/account/tokens) |
| `STAGING_PROJECT_ID` | Staging project reference ID | Found in Project Settings → General → Reference ID |
| `STAGING_DB_PASSWORD` | Staging database password | Set during project creation or reset in Database Settings |
| `PRODUCTION_PROJECT_ID` | Production project reference ID | Found in Project Settings → General → Reference ID |
| `PRODUCTION_DB_PASSWORD` | Production database password | Set during project creation or reset in Database Settings |

## GitHub Pages Configuration

### Initial Setup

1. Go to repository **Settings** → **Pages**
2. Under "Build and deployment", select **Source: GitHub Actions**
3. Save the configuration

### Environment Protection Rules

#### Production Environment

1. Go to **Settings** → **Environments**
2. Click on `production`
3. Configure protection rules:
   - **Required reviewers**: Add team members who must approve deployments
   - **Wait timer**: Optional delay before deployments
   - **Deployment branches**: Limit to `main` branch

#### Staging Environment

Staging typically has fewer restrictions:
- No required reviewers (optional)
- Limited to `develop` branch

## Branch Strategy

```
main (production)
  ↑
  └── develop (staging)
        ↑
        └── feature/* (CI only)
```

| Branch | CI | Staging Deploy | Production Deploy |
|--------|----|----------------|-------------------|
| `feature/*` | ✅ | ❌ | ❌ |
| `develop` | ✅ | ✅ | ❌ |
| `main` | ✅ | ❌ | ✅ |

## Deployment URLs

After successful deployments:

- **Production**: `https://<owner>.github.io/<repo>/`
- **Staging**: `https://<owner>.github.io/<repo>/staging/`

## Manual Deployment

Both staging and production workflows can be triggered manually:

1. Go to **Actions** tab
2. Select the workflow (Deploy Staging or Deploy Production)
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## Troubleshooting

### Database Migration Fails

1. Check that the `SUPABASE_DB_PASSWORD` is correct
2. Verify the project ID matches the intended environment
3. Review migration files for syntax errors
4. Check Supabase dashboard for any ongoing maintenance

### Frontend Build Fails

1. Check TypeScript errors in the build log
2. Verify all dependencies are properly installed
3. Ensure environment variables are set correctly

### GitHub Pages Deployment Fails

1. Verify GitHub Pages is enabled and set to GitHub Actions source
2. Check that the `GITHUB_TOKEN` has write permissions
3. Review the deployment logs for specific errors

### CI Fails on PR from Fork

For security reasons, secrets are not available to workflows triggered by PRs from forks. The `db-dryrun` job may fail. Consider:

1. Using pull_request_target event (with caution)
2. Requiring maintainers to create branches in the main repo
3. Using environment secrets with approval requirements

## Adding New Migrations

1. Create a new migration file in `database/supabase/migrations/`
2. Follow the naming convention: `YYYYMMDDHHMMSS_description.sql`
3. Test locally with `supabase db reset`
4. Create a PR to trigger CI validation
5. Merge to `develop` for staging deployment
6. Test in staging environment
7. Merge to `main` for production deployment

## Monitoring

- **Workflow Status**: Check the Actions tab in GitHub
- **Deployment History**: Settings → Environments → [environment] → Deployment history
- **Supabase Logs**: Supabase Dashboard → Logs
