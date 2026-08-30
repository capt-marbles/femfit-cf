

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useWorkout } from '../context/WorkoutContext';
import { getFeminizationScore } from '../lib/analyzer';
import {
  Calendar,
  Dumbbell,
  TrendingUp,
  Target,
  Sparkles,
} from 'lucide-react';

export function StatCards() {
  const { stats, muscleData } = useWorkout();
  const feminizationScore = getFeminizationScore(muscleData);

  if (!stats) {
    return null;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const cards = [
    {
      title: 'Total Workouts',
      value: stats.totalWorkouts.toString(),
      subtitle: `${stats.dateRange.start.toLocaleDateString()} - ${stats.dateRange.end.toLocaleDateString()}`,
      icon: Calendar,
    },
    {
      title: 'Total Volume',
      value: formatNumber(stats.totalVolume) + ' lbs',
      subtitle: `Avg ${formatNumber(stats.averageVolume)} per workout`,
      icon: Dumbbell,
    },
    {
      title: 'Favorite Exercise',
      value: stats.favoriteExercise,
      subtitle: 'Most performed',
      icon: TrendingUp,
    },
    {
      title: 'Feminization Score',
      value: feminizationScore.score.toString() + '/100',
      subtitle: feminizationScore.feedback,
      icon: Sparkles,
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className={card.highlight ? 'border-primary/50 bg-primary/5' : ''}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon
                className={`h-4 w-4 ${
                  card.highlight ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold truncate ${
                  card.highlight ? 'text-primary' : ''
                }`}
                title={card.value}
              >
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
