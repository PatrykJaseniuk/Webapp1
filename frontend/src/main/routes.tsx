
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
import { AdminLayoutPage } from "@/pages/AdminLayoutPage";
import { LandlordLayoutPage } from "@/pages/LandlordLayoutPage";
import { TenantLayoutPage } from "@/pages/TenantLayoutPage";
import { PropertiesListPage } from "@/pages/PropertiesListPage";
import { PropertiesFormPage } from "@/pages/PropertiesFormPage";
import { createHashRouter, Navigate } from "react-router-dom";

export const router = createHashRouter(
  [
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
          Component: AdminLayoutPage,
          children: [
            {
              index: true,
              Component: AdminDashboardPage,
            },
            {
              path: 'properties',
              children: [
                {
                  index: true,
                  Component: PropertiesListPage,
                },
                {
                  path: 'new',
                  Component: PropertiesFormPage,
                },
                {
                  path: ':id',
                  Component: PropertiesFormPage,
                },
              ],
            },
          ],
        },
        {
          path: 'landlord',
          Component: LandlordLayoutPage,
          children: [
            {
              index: true,
              Component: LandlordDashboardPage,
            },
            {
              path: 'properties',
              children: [
                {
                  index: true,
                  Component: PropertiesListPage,
                },
                {
                  path: 'new',
                  Component: PropertiesFormPage,
                },
                {
                  path: ':id',
                  Component: PropertiesFormPage,
                },
              ],
            },
          ],
        },
        {
          path: 'tenant',
          Component: TenantLayoutPage,
          children: [
            {
              index: true,
              Component: TenantDashboardPage,
            },
          ],
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
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
);

