import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import GoalIcon from '@/components/ui/goal-icon';
import type { Technique } from '@/lib/types';

interface TechniqueCardProps {
  technique: Technique;
}

const TechniqueCard = ({ technique }: TechniqueCardProps) => {
  // Truncate description for display and add ellipsis if needed
  const truncateDescription = (description: string, maxLength = 180) => {
    if (description.length <= maxLength) {
      return description;
    }

    // Find the last space before the maxLength to avoid cutting words
    let cutoff = description.lastIndexOf(' ', maxLength);
    if (cutoff === -1) {
      cutoff = maxLength;
    }

    return `${description.substring(0, cutoff)}...`;
  };

  return (
    <Link
      className="block h-full transition-transform hover:scale-[1.01]"
      href={`/techniques/${technique.slug}`}
    >
      <Card className="flex h-full cursor-pointer flex-col transition-shadow hover:shadow-lg">
        <CardHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <CardTitle
            className="line-clamp-1 text-base sm:text-lg"
            title={technique.name}
          >
            {technique.name}
          </CardTitle>

          {/* Assurance goal icons */}
          <div className="flex flex-wrap items-center gap-1 pt-1 sm:gap-2">
            {technique.assurance_goals?.map((goal) => (
              <div
                className="flex items-center rounded-full bg-secondary p-1 sm:p-1.5"
                key={goal}
                title={goal}
              >
                <GoalIcon goalName={goal} size={14} />
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex flex-grow flex-col px-4 pt-0 pb-0 sm:px-6">
          <p
            className="mb-3 flex-grow text-foreground text-xs sm:text-sm"
            title={technique.description}
          >
            {truncateDescription(technique.description)}
          </p>
        </CardContent>

        <CardFooter className="px-4 pt-3 pb-4 sm:px-6 sm:pt-4">
          <Button
            className="w-full text-xs sm:text-sm"
            size="sm"
            variant="default"
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default TechniqueCard;
