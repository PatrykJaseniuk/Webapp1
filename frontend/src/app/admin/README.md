# Admin Module

Complete admin interface for managing users and system settings in the Rental Management Application.

## 📁 Structure

```
admin/
├── layout.tsx                      # Admin-only layout with ProtectedRoute
├── dashboard/
│   ├── page.tsx                   # Dashboard with metrics and recent signups
│   └── page.module.css
├── users/
│   ├── page.tsx                   # User list with search and filters
│   ├── page.module.css
│   └── [id]/
│       ├── page.tsx               # User detail wrapper
│       ├── client.tsx             # User detail/edit client component
│       └── page.module.css
└── settings/
    ├── page.tsx                   # System settings (utility prices)
    └── page.module.css
```

## 🎯 Features

### 1. Admin Dashboard (`/admin/dashboard`)
- **Metrics Display:**
  - Total users count
  - Users by role (admin, landlord, tenant)
  - Visual stat cards with icons
- **Recent Signups:**
  - Last 10 registered users
  - Shows user ID, role, and creation date
  - Role badges with color coding

### 2. User Management (`/admin/users`)
- **User List:**
  - Display all users from user_roles table
  - Search by user ID
  - Filter by role (all/admin/landlord/tenant)
  - Click row to view details
- **User Details (`/admin/users/detail?id={userId}`):**
  - View user information (ID, role, timestamps)
  - Change user role (dropdown with instant update)
  - Delete user with confirmation modal
  - Success/error notifications
  - **Note:** Uses query parameters instead of dynamic routes for static export compatibility

### 3. System Settings (`/admin/settings`)
- **Utility Price Management:**
  - View all utility prices with history
  - Add new utility prices (electricity, water, gas, heating)
  - Specify price per unit and effective date
  - Historical prices preserved
  - Table display with formatted dates

## 🔒 Security

- All routes protected by `ProtectedRoute` with `allowedRoles={['admin']}`
- RLS policies enforce admin-only access at database level
- Uses `is_admin()` helper function for database queries

## 🧩 Components Used

### Reusable Components
- `StatCard` - Metric display cards
- `Table` - Generic data table with custom renderers
- `Modal` - Confirmation dialogs
- `SuccessBanner` - Success message display
- `ErrorBanner` - Error message display
- `Loading` - Loading state indicator
- `Button` - Styled action buttons
- `FormInput` - Form input fields
- `Card` - Content wrapper cards

## 🎨 Styling

- CSS Modules for scoped styling
- Consistent color scheme:
  - Admin role: Purple (#7c3aed)
  - Landlord role: Orange (#c2410c)
  - Tenant role: Green (#065f46)
- Responsive design (mobile-friendly)
- Hover effects and smooth transitions

## 📊 Data Fetching

Uses `react-use` hooks for data management:

```typescript
// Read data
const state = useAsync(async () => {
  const { data, error } = await database
    .from('table_name')
    .select('*');
  return { data, error };
}, []);

// Write data
const [actionState, handleAction] = useAsyncFn(async () => {
  const { error } = await database
    .from('table_name')
    .update({ ... });
  return { error };
}, [dependencies]);
```

## 🔄 State Management

- Local state with `useState` for form inputs
- Loading states for async operations
- Success/error message display with auto-dismiss
- Form validation before submission

## 🚀 Usage

### Access Admin Panel
1. Sign in with an admin account
2. Navigate to `/admin/dashboard`
3. Use header navigation to access different sections

### Manage Users
1. Go to "Users" page
2. Search or filter users
3. Click on a user to view/edit details
4. Change role or delete user as needed

### Configure Utility Prices
1. Go to "Settings" page
2. Click "Add New Price"
3. Select utility type, enter price, and set effective date
4. Submit to add price to history

## 📝 Notes

- All timestamps are formatted in user-friendly format
- Null values handled gracefully with "N/A" display
- Confirmation required for destructive actions (delete user)
- Success messages auto-dismiss after 3 seconds
- Page refreshes after adding utility prices to show updated data
