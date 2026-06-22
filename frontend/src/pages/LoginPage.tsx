import { RoleRedirect } from "@/masterComponents/RoleRedirect";
import { Login } from "@/masterComponents/Login";
import { LoginForm } from "@/slaveComponents/LoginForm";

export const LoginPage = (): JSX.Element => (
    <RoleRedirect>
        <Login Form={LoginForm} />
    </RoleRedirect>
);
