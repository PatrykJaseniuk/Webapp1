# How to Obtain GitHub Secrets for CI/CD

This guide explains how to obtain each secret required for the CI/CD pipeline.

## Required Secrets Overview

| Secret | Source | Description |
|--------|--------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard | Personal access token for API authentication |
| `SUPABASE_URL` | Supabase Dashboard | Project URL for frontend connection |
| `SUPABASE_ANON_KEY` | Supabase Dashboard | Anonymous key for frontend API access |
| `STAGING_PROJECT_ID` | Supabase Dashboard | Staging project reference ID |
| `STAGING_DB_PASSWORD` | Supabase Dashboard | Staging database password |
| `PRODUCTION_PROJECT_ID` | Supabase Dashboard | Production project reference ID |
| `PRODUCTION_DB_PASSWORD` | Supabase Dashboard | Production database password |

---

## 1. SUPABASE_ACCESS_TOKEN

This is a personal access token that allows the CI/CD pipeline to authenticate with Supabase.

### Steps to obtain:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your **profile icon** (top right corner)
3. Select **Account Settings**
4. In the left sidebar, click **Access Tokens**
5. Click **Generate new token**
6. Enter a name (e.g., "GitHub Actions CI/CD")
7. Click **Generate token**
8. **Copy the token immediately** - it won't be shown again!

```
Example token format: sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 2. SUPABASE_URL and SUPABASE_ANON_KEY

These are required for the frontend application to connect to Supabase. You only need one set (they're the same for both staging and production if using the same project).

### Steps to obtain:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Project Settings** (gear icon in left sidebar)
4. Click **API** under Settings
5. Find the following values:

**SUPABASE_URL:**
- Look for **Project URL** field
- Copy the URL (format: `https://xxxxxxxxxxxxx.supabase.co`)

**SUPABASE_ANON_KEY:**
- Look for **Project API keys** section
- Find **anon public** key
- Click the copy icon to copy the key

```
Example URL format: https://abcdefghijklmnop.supabase.co
Example anon key format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. STAGING_PROJECT_ID and PRODUCTION_PROJECT_ID

The Project ID (also called Reference ID) uniquely identifies your Supabase project.

### Steps to obtain:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **Staging** project (or create one if needed)
3. Click **Project Settings** (gear icon in left sidebar)
4. Click **General** under Settings
5. Find **Reference ID** - this is your Project ID

```
Example format: abcdefghijklmnop
```

**Repeat for Production project to get PRODUCTION_PROJECT_ID**

### Creating Projects (if needed)

If you don't have staging/production projects:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose organization
4. Enter project name (e.g., "myapp-staging", "myapp-production")
5. Set a strong database password (save this!)
6. Select a region close to your users
7. Click **Create new project**

---

## 4. STAGING_DB_PASSWORD and PRODUCTION_DB_PASSWORD

This is the password you set when creating the project. If you forgot it, you can reset it.

### If you remember the password:
Use the password you set during project creation.

### If you forgot the password:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Project Settings** (gear icon)
4. Click **Database** under Settings
5. Scroll to **Connection string** section
6. Click **Reset database password**
7. Enter a new strong password
8. **Save the password securely!**

---

## Adding Secrets to GitHub Repository

Once you have all the values, add them to your GitHub repository:

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, expand **Secrets and variables**
4. Click **Actions**
5. Click **New repository secret**
6. Enter the secret name (exactly as shown in the table above)
7. Paste the secret value
8. Click **Add secret**
9. Repeat for each secret

### Screenshot Reference:

```
Repository → Settings → Secrets and variables → Actions

┌─────────────────────────────────────────────────┐
│ Actions secrets / New secret                     │
├─────────────────────────────────────────────────┤
│ Name:  SUPABASE_ACCESS_TOKEN                    │
│                                                 │
│ Secret: sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx      │
│                                                 │
│           [Add secret]                          │
└─────────────────────────────────────────────────┘
```

---

## Verification

After adding all secrets, verify they work:

1. Go to **Actions** tab in your repository
2. Select **CI** workflow
3. Click **Run workflow**
4. Select a branch and run
5. Check if the workflow completes successfully

---

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Use different projects for staging and production**
3. **Rotate access tokens periodically**
4. **Use environment protection rules** for production:
   - Settings → Environments → production
   - Add required reviewers
   - Restrict to `main` branch

---

## Quick Reference

| Secret | Where to Find | URL |
|--------|---------------|-----|
| `SUPABASE_ACCESS_TOKEN` | Account Settings → Access Tokens | https://supabase.com/dashboard/account/tokens |
| `SUPABASE_URL` | Project Settings → API | https://supabase.com/dashboard/project/_/settings/api |
| `SUPABASE_ANON_KEY` | Project Settings → API | https://supabase.com/dashboard/project/_/settings/api |
| `*_PROJECT_ID` | Project Settings → General | https://supabase.com/dashboard/project/_/settings/general |
| `*_DB_PASSWORD` | Project Settings → Database | https://supabase.com/dashboard/project/_/settings/database |

Replace `_` in URLs with your actual project reference ID.
