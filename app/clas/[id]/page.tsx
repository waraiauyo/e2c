import { ClasInfoPage } from "@/components/pages/ClasInfoPage";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <ClasInfoPage clasId={id} />;
}
