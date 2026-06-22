import { RoleRedirect } from "@/masterComponents/RoleRedirect";
import { Signup } from "@/masterComponents/Signup";
import { SignupForm } from "@/slaveComponents/SignupForm";
import { LoadingSpinner } from "@/slaveComponents/LoadingSpinner";

export const SignupPage = (): JSX.Element => (
    <RoleRedirect LoadingComponent={<LoadingSpinner />}>
        <Signup Form={SignupForm} />
    </RoleRedirect>
);
