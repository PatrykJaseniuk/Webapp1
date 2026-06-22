import { RoleRedirect } from "@/masterComponents/RoleRedirect";
import { Login } from "@/masterComponents/Login";
import { LoginForm } from "@/slaveComponents/LoginForm";
import { LoadingSpinner } from "@/slaveComponents/LoadingSpinner";

export const LoginPage = (): JSX.Element => (
    <RoleRedirect LoadingComponent={<LoadingSpinner />}>
        <Login Form={LoginForm} />
    </RoleRedirect>
);
