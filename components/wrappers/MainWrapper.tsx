export default function MainWrapper({
    children,
    className = "",
}: Readonly<{
    children: React.ReactNode;
    className?: string;
}>) {
    return (
        <main className={`flex flex-col gap-2 ${className}`.trim()}>
            {children}
        </main>
    );
}
