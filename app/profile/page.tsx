import { Suspense } from "react";
import ProfilePage from "@/components/pages/ProfilePage";
import { LoadingSpinner } from "@/components/shadcn/loading-spinner";

export default function Page() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center w-full h-full">
                    <LoadingSpinner size="lg" />
                </div>
            }
        >
            <ProfilePage />
        </Suspense>
    );
}
