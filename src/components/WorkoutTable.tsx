

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useWorkout } from '../context/WorkoutContext';
import { WorkoutEntry } from '../types/workout';
import { muscleGroupLabels, muscleGroupColors } from '../lib/exercises';
import { ChevronLeft, ChevronRight, RefreshCcw, ArrowRightLeft } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

interface WorkoutTableProps {
  onExerciseClick?: (exercise: WorkoutEntry) => void;
  showSubstituteButtons?: boolean;
}

export function WorkoutTable({
  onExerciseClick,
  showSubstituteButtons = true,
}: WorkoutTableProps) {
  const { workouts } = useWorkout();
  const [currentPage, setCurrentPage] = useState(1);

  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  const totalPages = Math.ceil(sortedWorkouts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedWorkouts = sortedWorkouts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSubstituteClick = (e: React.MouseEvent, workout: WorkoutEntry) => {
    e.stopPropagation();
    onExerciseClick?.(workout);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Workout History</CardTitle>
        <span className="text-sm text-muted-foreground">
          {workouts.length} exercises
        </span>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead className="hidden sm:table-cell">Muscle</TableHead>
                <TableHead className="text-right">Sets</TableHead>
                <TableHead className="text-right">Reps</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                {showSubstituteButtons && onExerciseClick && (
                  <TableHead className="w-[60px]"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedWorkouts.map((workout) => (
                <TableRow
                  key={workout.id}
                  className={onExerciseClick && !showSubstituteButtons ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => !showSubstituteButtons && onExerciseClick?.(workout)}
                >
                  <TableCell className="whitespace-nowrap">
                    {formatDate(workout.date)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {workout.exercise}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {workout.muscleGroup && (
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${muscleGroupColors[workout.muscleGroup]}20`,
                          color: muscleGroupColors[workout.muscleGroup],
                        }}
                      >
                        {muscleGroupLabels[workout.muscleGroup]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{workout.sets}</TableCell>
                  <TableCell className="text-right">{workout.reps}</TableCell>
                  <TableCell className="text-right">
                    {workout.weight > 0 ? `${workout.weight} lbs` : '-'}
                  </TableCell>
                  {showSubstituteButtons && onExerciseClick && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => handleSubstituteClick(e, workout)}
                        title="Find substitute"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {paginatedWorkouts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={showSubstituteButtons && onExerciseClick ? 7 : 6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No workout data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="min-h-[40px] min-w-[40px]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="min-h-[40px] min-w-[40px]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {showSubstituteButtons && onExerciseClick && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <ArrowRightLeft className="h-3 w-3" />
            Click the swap icon to find exercise substitutes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
