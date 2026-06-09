import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/volatile1/auth';
import { router } from '@/volatile1/routes';

export const App = (): JSX.Element => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);