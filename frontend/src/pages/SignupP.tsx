import { RoleRedirect } from "@/masterComponents/RoleRedirectM";
import { Signup } from "@/masterComponents/SignupM";
import { SignupForm } from "@/slaveComponents/SignupFormS";
import { LoadingSpinner } from "@/slaveComponents/LoadingSpinnerS";

export const SignupPage = (): JSX.Element => (
    <RoleRedirect LoadingComponent={<LoadingSpinner />}>
        <Signup Form={SignupForm} loginUrl="/login" />
    </RoleRedirect>
);
