// ══════════════════════════════════════════════════════════════
// ROUTE_TREE — single source of truth
// ══════════════════════════════════════════════════════════════

import { AdminDashboardPage } from "@/pages/AdminDashboardP";
import { LandlordDashboardPage } from "@/pages/LandlordDashboardP";
import { TenantDashboardPage } from "@/pages/TenantDashboardP";
import { LoginPage } from "@/pages/LoginP";
import { SignupPage } from "@/pages/SignupP";
import { NotFoundPage } from "@/pages/NotFoundP";
import { ErrorPage } from "@/pages/ErrorP";
import { AdminLayoutPage } from "@/pages/AdminLayoutP";
import { LandlordLayoutPage } from "@/pages/LandlordLayoutP";
import { TenantLayoutPage } from "@/pages/TenantLayoutP";
import { PropertiesListPage } from "@/pages/PropertiesP";
import { PropertyDetailPage } from "@/pages/PropertyP";
import { TenantsListPage } from "@/pages/TenantsP";
import { TenantDetailPage } from "@/pages/TenantP";
import { LeaseAgreementsListPage } from "@/pages/LeaseAgreementsP";
import { LeaseAgreementDetailPage } from "@/pages/LeaseAgreementP";
import { TransactionDetailPage } from "@/pages/TransactionPage";
import { TransactionsListPage } from "@/pages/TransactionsP";
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
                  path: ':id',
                  Component: PropertyDetailPage,
                },
              ],
            },
            {
              path: 'tenants',
              children: [
                {
                  index: true,
                  Component: TenantsListPage,
                },
                {
                  path: ':id',
                  Component: TenantDetailPage,
                },
              ],
            },
            {
              path: 'leases',
              children: [
                {
                  index: true,
                  Component: LeaseAgreementsListPage,
                },
                {
                  path: ':id',
                  Component: LeaseAgreementDetailPage,
                },
              ],
            },
            {
              path: 'transactions',
              children: [
                {
                  index: true,
                  Component: TransactionsListPage,
                },
                {
                  path: ':id',
                  Component: TransactionDetailPage,
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
                  path: ':id',
                  Component: PropertyDetailPage,
                },
              ],
            },
            {
              path: 'tenants',
              children: [
                {
                  index: true,
                  Component: TenantsListPage,
                },
                {
                  path: ':id',
                  Component: TenantDetailPage,
                },
              ],
            },
            {
              path: 'leases',
              children: [
                {
                  index: true,
                  Component: LeaseAgreementsListPage,
                },
                {
                  path: ':id',
                  Component: LeaseAgreementDetailPage,
                },
              ],
            },
            {
              path: 'transactions',
              children: [
                {
                  index: true,
                  Component: TransactionsListPage,
                },
                {
                  path: ':id',
                  Component: TransactionDetailPage,
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
      v7_relativeSplatPath: true,
    },
  },
);