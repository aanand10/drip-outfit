import { Suspense } from "react";
import { HomeScreen } from "@/features/home/HomeScreen";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense>
        <HomeScreen />
      </Suspense>
    </main>
  );
}
