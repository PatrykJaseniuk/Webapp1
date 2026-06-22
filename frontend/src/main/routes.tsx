
// ══════════════════════════════════════════════════════════════
// ROUTE_TREE — single source of truth
// ══════════════════════════════════════════════════════════════

import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { LandlordDashboardPage } from "@/pages/LandlordDashboardPage";
import { TenantDashboardPage } from "@/pages/TenantDashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { createHashRouter } from "react-router-dom";

export const router = createHashRouter([
  {
    path: '/',
    Component: AdminDashboardPage
  },
  {
    path: '/landlord',
    Component: LandlordDashboardPage,
  },
  {
    path: '/tenant',
    Component: TenantDashboardPage,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/signup',
    Component: SignupPage,
  },
])

