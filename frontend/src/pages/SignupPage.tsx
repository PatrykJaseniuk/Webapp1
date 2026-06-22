import { RoleRedirect } from "@/masterComponents/RoleRedirect";
import { Signup } from "@/masterComponents/Signup";
import { SignupForm } from "@/slaveComponents/SignupForm";

export const SignupPage = (): JSX.Element => (
    <RoleRedirect>
        <Signup Form={SignupForm} />
    </RoleRedirect>
);
