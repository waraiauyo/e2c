import type { Metadata } from "next";
import "./globals.css";

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
        <html lang="fr">
            <body>{children}</body>
        </html>
    );
}
