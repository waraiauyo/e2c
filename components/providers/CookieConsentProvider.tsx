"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    ReactNode,
} from "react";

const COOKIE_CONSENT_KEY = "e2c-cookie-consent";

export type CookieConsentStatus = "accepted" | "pending";

interface CookieConsentContextValue {
    status: CookieConsentStatus;
    isLoaded: boolean;
    isAccepted: boolean;
    isPending: boolean;
    isDismissed: boolean;
    showBanner: boolean;
    accept: () => void;
    dismiss: () => void;
    reset: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
    null
);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<CookieConsentStatus>("pending");
    const [isDismissed, setIsDismissed] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (stored === "accepted") {
            setStatus("accepted");
        } else {
            setStatus("pending");
        }
        setIsLoaded(true);
    }, []);

    const accept = useCallback(() => {
        localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
        setStatus("accepted");
        setIsDismissed(false);
    }, []);

    const dismiss = useCallback(() => {
        setIsDismissed(true);
    }, []);

    const reset = useCallback(() => {
        localStorage.removeItem(COOKIE_CONSENT_KEY);
        setStatus("pending");
        setIsDismissed(false);
    }, []);

    const value = useMemo<CookieConsentContextValue>(
        () => ({
            status,
            isLoaded,
            isAccepted: status === "accepted",
            isPending: status === "pending",
            isDismissed,
            showBanner: isLoaded && status === "pending" && !isDismissed,
            accept,
            dismiss,
            reset,
        }),
        [status, isLoaded, isDismissed, accept, dismiss, reset]
    );

    return (
        <CookieConsentContext.Provider value={value}>
            {children}
        </CookieConsentContext.Provider>
    );
}

export function useCookieConsent() {
    const context = useContext(CookieConsentContext);
    if (!context) {
        throw new Error(
            "useCookieConsent must be used within a CookieConsentProvider"
        );
    }
    return context;
}
