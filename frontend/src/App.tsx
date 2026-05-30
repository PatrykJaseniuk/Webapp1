import { RouterProvider, createHashRouter, Navigate } from 'react-router-dom';

const router = createHashRouter([
  {
    path: '/',
    element: (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">WebApp1</h1>
      </div>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export const App = (): JSX.Element => (
  <RouterProvider router={router} />
);