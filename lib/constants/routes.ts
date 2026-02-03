// Routes accessibles sans authentification
export const PUBLIC_ROUTES = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/privacy-policy",
] as const;

// Routes d'authentification (redirige vers / si déjà connecté)
export const AUTH_ROUTES = [
    "/login",
    "/register",
    "/forgot-password",
] as const;

export function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export function isAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}
