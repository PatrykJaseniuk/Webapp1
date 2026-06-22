
// ══════════════════════════════════════════════════════════════
// ROUTE_TREE — single source of truth
// ══════════════════════════════════════════════════════════════

import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { LandlordDashboardPage } from "@/pages/LandlordDashboardPage";
import { TenantDashboardPage } from "@/pages/TenantDashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ErrorPage } from "@/pages/ErrorPage";
import { createHashRouter, Navigate } from "react-router-dom";

export const router = createHashRouter([
  {
    path: '/',
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'admin',
        Component: AdminDashboardPage
      },
      {
        path: 'landlord',
        Component: LandlordDashboardPage,
      },
      {
        path: 'tenant',
        Component: TenantDashboardPage,
      },
      {
        path: 'login',
        Component: LoginPage,
      },
      {
        path: 'signup',
        Component: SignupPage,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

