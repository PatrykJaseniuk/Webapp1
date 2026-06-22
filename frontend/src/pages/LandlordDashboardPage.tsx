import { AuthorisationGuard } from "@/masterComponents/RoleGuard";
import { LandlordDashboard } from "@/slaveComponents/LandlordDashboard";

export const LandlordDashboardPage = (): JSX.Element => (
  <AuthorisationGuard
    authoriseRequirement={{
      isAuthenticated: true,
      roles: ['landlord']
    }}>
    <LandlordDashboard />
  </AuthorisationGuard>
);