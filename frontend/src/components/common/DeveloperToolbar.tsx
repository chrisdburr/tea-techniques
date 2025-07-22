"use client";

import React, { useState } from "react";
import { getDataConfig } from "@/lib/config/dataConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Database,
  Globe,
  Cloud,
  Info,
  ExternalLink,
} from "lucide-react";

interface BuildInfo {
  mode: string;
  buildTime?: string;
  version?: string;
  basePath?: string;
  assetPrefix?: string;
}

/**
 * Enhanced developer toolbar showing current mode and build information
 */
export function DeveloperToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const config = getDataConfig();

  // Get build info from environment
  const buildInfo: BuildInfo = {
    mode: config.dataSource,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME,
    version: process.env.NEXT_PUBLIC_VERSION,
    basePath: process.env.NEXT_PUBLIC_BASE_PATH,
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  };

  const getModeIcon = () => {
    switch (config.dataSource) {
      case "static":
        return <Globe className="h-3 w-3" />;
      case "mock":
        return <Database className="h-3 w-3" />;
      case "api":
      default:
        return <Cloud className="h-3 w-3" />;
    }
  };

  const getModeColor = () => {
    switch (config.dataSource) {
      case "static":
        return "text-blue-600";
      case "mock":
        return "text-yellow-600";
      case "api":
      default:
        return "text-green-600";
    }
  };

  const getModeDescription = () => {
    switch (config.dataSource) {
      case "static":
        return "Running with pre-generated static data files";
      case "mock":
        return "Running with mock API endpoints and simulated delays";
      case "api":
      default:
        return "Connected to live Django REST API backend";
    }
  };

  const getFeatureStatus = () => {
    return [
      { name: "Authentication", enabled: config.features.enableAuth },
      { name: "Editing", enabled: config.features.enableEditing },
      { name: "Submission", enabled: config.features.enableSubmission },
    ];
  };

  const switchMode = (newMode: string) => {
    // Show instructions for switching modes
    const instructions = {
      static: "Run: pnpm dev:static",
      mock: "Run: pnpm dev:mock",
      api: "Run: pnpm dev:api",
    };

    alert(
      `To switch to ${newMode} mode:\n\n${
        instructions[newMode as keyof typeof instructions]
      }\n\nThen refresh the page.`,
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`flex items-center gap-2 ${getModeColor()}`}
          >
            {getModeIcon()}
            <span className="text-xs font-medium">
              {config.dataSource.toUpperCase()} Mode
            </span>
            <Settings className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            {/* Mode Information */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Info className="h-4 w-4" />
                Current Mode
              </h4>
              <Card className="p-3 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getModeIcon()}
                    <span className={`font-semibold ${getModeColor()}`}>
                      {config.dataSource.toUpperCase()}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {config.dataSource}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getModeDescription()}
                </p>
              </Card>
            </div>

            <Separator />

            {/* Feature Status */}
            <div>
              <h4 className="font-medium mb-2">Feature Status</h4>
              <div className="space-y-1">
                {getFeatureStatus().map((feature) => (
                  <div
                    key={feature.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{feature.name}</span>
                    <Badge
                      variant={feature.enabled ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {feature.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Build Information */}
            {(buildInfo.buildTime || buildInfo.version) && (
              <>
                <div>
                  <h4 className="font-medium mb-2">Build Information</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {buildInfo.version && (
                      <div>Version: {buildInfo.version}</div>
                    )}
                    {buildInfo.buildTime && (
                      <div>Built: {buildInfo.buildTime}</div>
                    )}
                    {buildInfo.basePath && (
                      <div>Base Path: {buildInfo.basePath}</div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Mode Switcher */}
            <div>
              <h4 className="font-medium mb-2">Switch Mode</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={
                    config.dataSource === "static" ? "default" : "outline"
                  }
                  onClick={() => switchMode("static")}
                  className="text-xs"
                >
                  Static
                </Button>
                <Button
                  size="sm"
                  variant={config.dataSource === "mock" ? "default" : "outline"}
                  onClick={() => switchMode("mock")}
                  className="text-xs"
                >
                  Mock
                </Button>
                <Button
                  size="sm"
                  variant={config.dataSource === "api" ? "default" : "outline"}
                  onClick={() => switchMode("api")}
                  className="text-xs"
                >
                  API
                </Button>
              </div>
            </div>

            <Separator />

            {/* Links */}
            <div className="flex items-center justify-between text-xs">
              <a
                href="/api/techniques.json"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                View API Data
                <ExternalLink className="h-3 w-3" />
              </a>
              {config.dataSource === "static" && (
                <span className="text-muted-foreground">
                  Serving from /public/api
                </span>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
