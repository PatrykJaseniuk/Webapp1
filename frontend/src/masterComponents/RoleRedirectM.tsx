import { type ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/hooks/AuthContext"

type Props = {
    readonly children: ReactNode,
    readonly LoadingComponent: ReactNode
}

export const RoleRedirect = ({
    children,
    LoadingComponent,
}: Props): JSX.Element => {
    const auth = useAuth()
    const navigate = useNavigate()

    return auth.tag === 'loading' ?
        <>{LoadingComponent}</> :
        auth.tag === 'unauthenticated' ?
            <>{children}</> :
            (() => {
                navigate({ to: '/app', replace: true });
                return <>{LoadingComponent}</>;
            })()
}
