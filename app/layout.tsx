
import "./globals.css";

import type { Metadata } from "next";

import { ThemeProvider } from "@/components/providers/ThemeProviders";
import { CookieConsentProvider } from "@/components/providers/CookieConsentProvider";
import MainWrapper from "@/components/wrappers/MainWrapper";
import { Toaster } from "@/components/shadcn/sonner";
import StoreProvider from "@/lib/redux/provider/StoreProvider";
import { CookieBanner } from "@/components/cookie/CookieBanner";

export const metadata: Metadata = {
    title: "E2C",
    description: "",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body>
                <StoreProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        enableSystem={false}
                    >
                        <CookieConsentProvider>
                            <MainWrapper>{children}</MainWrapper>
                            <CookieBanner />
                        </CookieConsentProvider>
                        <Toaster />
                    </ThemeProvider>
                </StoreProvider>
            </body>
        </html>
    );
}
