import { RoleRedirect } from "@/masterComponents/RoleRedirectM";
import { Login } from "@/masterComponents/LoginM";
import { LoginForm } from "@/slaveComponents/LoginFormS";
import { LoadingSpinner } from "@/slaveComponents/LoadingSpinnerS";

export const LoginPage = (): JSX.Element => (
    <RoleRedirect LoadingComponent={<LoadingSpinner />}>
        <Login SlaveComponent={LoginForm} />
    </RoleRedirect>
);