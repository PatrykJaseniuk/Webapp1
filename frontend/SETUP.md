# Web App Setup Guide

## Overview

This Next.js application is configured to work with Supabase as the backend database with full TypeScript type safety. The app uses:

- **Next.js 16** with App Router
- **TypeScript** for full type safety
- **Supabase** for database and authentication
- **react-use** library (`useAsync` and `useAsyncFn`) for handling async operations
- **Functional programming style** (immutable data patterns)
- **Static Site Generation (SSG)** capabilities

## Architecture

```
App (Next.js/React)  <---> API (Supabase Client) <---> DataBase (Supabase)
     Multiple instances                                    Single instance
```

- Multiple App instances can communicate with the single DataBase instance
- All authentication is handled by Supabase
- Communication is fully typed through TypeScript
- App instances do NOT communicate with each other, only with DataBase

## Setup Instructions

### 1. Configure Supabase

#### Option A: Use Supabase Cloud

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from Project Settings → API

#### Option B: Use Local Supabase (from DataBase directory)

```bash
cd ../DataBase
npx supabase start
```

This will output your local Supabase credentials.

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Usage Patterns

### Pattern 1: Fetching Data with `useAsync`

Use `useAsync` for data fetching that happens on component mount or when dependencies change:

```typescript
'use client';

import { useAsync } from 'react-use';
import { supabase } from '@/lib/supabase/api';

export function MyComponent({ userId }: { userId: string }) {
    const state = useAsync(async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    }, [userId]); // Re-fetch when userId changes

    if (state.loading) return <div>Loading...</div>;
    if (state.error) return <div>Error: {state.error.message}</div>;
    if (!state.value) return <div>No data</div>;

    return <div>User: {state.value.email}</div>;
}
```

### Pattern 2: Mutations with `useAsyncFn`

Use `useAsyncFn` for operations triggered by user actions (create, update, delete):

```typescript
'use client';

import { useAsyncFn } from 'react-use';
import { supabase } from '@/lib/supabase/api';

export function CreateForm() {
    const [state, createItem] = useAsyncFn(async (email: string) => {
        const { data, error } = await supabase
            .from('users')
            .insert({ email })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }, []);

    return (
        <div>
            <button 
                onClick={() => createItem('user@example.com')}
                disabled={state.loading}
            >
                {state.loading ? 'Creating...' : 'Create User'}
            </button>
            {state.error && <div>Error: {state.error.message}</div>}
            {state.value && <div>Created: {state.value.email}</div>}
        </div>
    );
}
```

### Pattern 3: Authentication

```typescript
'use client';

import { useAsync, useAsyncFn } from 'react-use';
import { supabase } from '@/lib/supabase/api';

export function AuthComponent() {
    // Check current session
    const sessionState = useAsync(async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    }, []);

    // Sign in action
    const [signInState, signIn] = useAsyncFn(async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    }, []);

    // Use the states...
}
```

## Example Components

See the `/src/components/examples/` directory for complete examples:

- **UserList.tsx** - Fetching and displaying data with `useAsync`
- **CreateUserForm.tsx** - Creating data with `useAsyncFn`
- **AuthExample.tsx** - Complete authentication flow

## Type Safety

### Database Types

Update `/src/lib/supabase/database.types.ts` with your database schema:

```typescript
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    created_at?: string
                }
            }
        }
        // ... other tables
    }
}
```

You can auto-generate these types from your Supabase schema:
```bash
npx supabase gen types typescript --project-id "your-project-id" > src/lib/supabase/database.types.ts
```

## Functional Programming Principles

This app follows functional programming principles:

1. **Immutability** - Data is never mutated, only replaced with new values
2. **Pure Functions** - API calls are wrapped in functions that don't mutate external state
3. **Declarative** - Components describe what to render, not how to render it
4. **Type Safety** - Full TypeScript typing throughout

## Static Site Generation (SSG)

To build the app as a fully static site:

```bash
npm run build
```

This creates an optimized production build with static HTML files.

## Project Structure

```
app/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   └── examples/     # Example components
│   └── lib/              # Library code
│       └── supabase/     # Supabase configuration
│           ├── client.ts          # Supabase client instance
│           ├── api.ts             # API exports
│           └── database.types.ts  # TypeScript types
├── public/               # Static assets
├── .env.local           # Environment variables (create from .env.local.example)
└── package.json         # Dependencies
```

## Next Steps

1. Set up your Supabase database schema
2. Update `database.types.ts` with your schema types
3. Create your components using the patterns shown in examples
4. Configure authentication providers in Supabase dashboard if needed
5. Build and deploy your static app

## Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm start                # Start production server

# Type checking
npm run lint             # Run ESLint

# Supabase (from DataBase directory)
cd ../DataBase
npx supabase start       # Start local Supabase
npx supabase stop        # Stop local Supabase
npx supabase status      # Check status
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [react-use Documentation](https://github.com/streamich/react-use)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
