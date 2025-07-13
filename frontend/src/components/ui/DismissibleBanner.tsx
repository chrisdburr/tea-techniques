"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DismissibleBannerProps {
  message: string;
  id?: string; // For remembering dismissal in sessionStorage
}

export const DismissibleBanner = ({
  message,
  id = "tea-tech-banner",
}: DismissibleBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  // Check if banner was previously dismissed in this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem(id) === "dismissed";
    if (wasDismissed) {
      setIsVisible(false);
    }
  }, [id]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal in session storage
    sessionStorage.setItem(id, "dismissed");
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
      <div className="container mx-auto py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-amber-800 dark:text-amber-200 h-6 w-6 p-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DismissibleBanner;
