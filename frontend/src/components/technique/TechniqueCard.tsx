"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Technique } from "@/lib/types";
import GoalIcon from "./GoalIcon";

interface TechniqueCardProps {
  technique: Technique;
}

const TechniqueCard = ({ technique }: TechniqueCardProps): JSX.Element => {
  // Format the title to display name with acronym if available
  const formatTitle = (name: string, acronym?: string) => {
    // If we have an acronym, show it in parentheses
    if (acronym) {
      return `${name} (${acronym})`;
    }
    return name;
  };

  // Truncate description for display and add ellipsis if needed
  const truncateDescription = (description: string, maxLength = 180) => {
    if (description.length <= maxLength) return description;

    // Find the last space before the maxLength to avoid cutting words
    let cutoff = description.lastIndexOf(" ", maxLength);
    if (cutoff === -1) cutoff = maxLength;

    return description.substring(0, cutoff) + "...";
  };

  return (
    <Link
      href={`/techniques/${technique.slug}`}
      className="block h-full transition-transform hover:scale-[1.01]"
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
          <CardTitle
            className="line-clamp-1 text-base sm:text-lg"
            title={formatTitle(technique.name, technique.acronym)}
          >
            {formatTitle(technique.name, technique.acronym)}
          </CardTitle>

          {/* Assurance goal icons moved to replace model/data type tags */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-1">
            {technique.assurance_goals.map((goal) => (
              <div
                key={goal.id}
                className="p-1 sm:p-1.5 rounded-full flex items-center bg-secondary"
                title={goal.name}
              >
                <GoalIcon goalName={goal.name} size={14} />
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-0 px-4 sm:px-6 flex-grow flex flex-col">
          {/* Expanded description with more space */}
          <p
            className="text-xs sm:text-sm text-foreground mb-3 flex-grow"
            title={technique.description}
          >
            {truncateDescription(technique.description)}
          </p>
        </CardContent>

        <CardFooter className="pt-3 pb-4 px-4 sm:px-6 sm:pt-4">
          <Button
            variant="default"
            size="sm"
            className="w-full text-xs sm:text-sm"
            onClick={(e) => e.preventDefault()} // Prevent navigation since the card handles it
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default TechniqueCard;
