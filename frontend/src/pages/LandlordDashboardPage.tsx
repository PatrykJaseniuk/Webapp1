import { AuthorisationGuard } from "@/masterComponents/RoleGuard";
import { LandlordDashboard } from "@/slaveComponents/LandlordDashboard";
import { LoadingSpinner } from "@/slaveComponents/LoadingSpinner";
import { AccessDenied } from "@/slaveComponents/AccessDenied";

export const LandlordDashboardPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{
      isAuthenticated: true,
      roles: ['landlord']
    }}
    LoadingComponent={<LoadingSpinner />}
    AccessDeniedComponent={<AccessDenied />}
  >
    <LandlordDashboard />
  </AuthorisationGuard>
);
