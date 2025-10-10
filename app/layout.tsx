import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProviders";
import MainWrapper from "@/components/wrappers/MainWrapper";
import { Toaster } from "@/components/ui/sonner";

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
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                >
                    <MainWrapper>{children}</MainWrapper>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
