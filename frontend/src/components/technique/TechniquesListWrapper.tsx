// TechniquesListWrapper.tsx - Wrapper to handle Suspense for useSearchParams in static builds
"use client";

import { Suspense } from "react";
import TechniquesList from "./TechniquesList";
import type { Technique, APIResponse, AssuranceGoal, Tag } from "@/lib/types";

interface TechniquesListWrapperProps {
  initialData?: APIResponse<Technique>;
  initialAssuranceGoals?: APIResponse<AssuranceGoal>;
  initialTags?: APIResponse<Tag>;
}

// Loading component
function LoadingState() {
  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <p className="text-lg text-muted-foreground">Loading techniques...</p>
    </div>
  );
}

export default function TechniquesListWrapper(
  props: TechniquesListWrapperProps,
) {
  return (
    <Suspense fallback={<LoadingState />}>
      <TechniquesList {...props} />
    </Suspense>
  );
}
