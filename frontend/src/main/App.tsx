import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/hooks/AuthContext';
import { router } from './routes';

export const App = (): JSX.Element => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);