import { AppRole, useAuth } from "@/hooks/AuthContext"
import { type ReactNode } from "react"
import { Navigate } from "react-router-dom"

const DEFAULT_REDIRECT_MAP: Readonly<Record<AppRole, string>> = Object.freeze({
    admin: '/admin',
    landlord: '/landlord',
    tenant: '/tenant',
});

type Props = {
    readonly children: ReactNode,
    readonly redirectMap?: Record<AppRole, string>,
    readonly LoadingComponent: ReactNode
}

export const RoleRedirect = ({
    children,
    redirectMap = DEFAULT_REDIRECT_MAP,
    LoadingComponent,
}: Props) => {

    const auth = useAuth()

    return auth.tag === 'loading' ?
        <>{LoadingComponent}</> :
        auth.tag === 'unauthenticated' ?
            <>{children}</> :
            <Navigate to={redirectMap[auth.role]} replace />

}