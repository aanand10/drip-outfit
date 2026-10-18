import { Suspense } from "react";
import { LookScreen } from "@/features/look/LookScreen";
import { LookSkeleton } from "@/features/look/LookSkeleton";

export default function LookPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense fallback={<LookSkeleton />}>
        <LookScreen />
      </Suspense>
    </main>
  );
}
