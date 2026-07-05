"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** MapLibre stays out of the initial bundle — loaded only when this renders. */
export const DivisionMapLazy = dynamic(() => import("./division-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[480px] w-full rounded-lg" />,
});
