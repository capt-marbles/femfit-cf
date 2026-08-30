

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { WorkoutEntry, ExerciseSubstitute } from '../types/workout';
import { muscleGroupLabels, muscleGroupColors } from '../lib/exercises';
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Dumbbell,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SubstituteModalProps {
  exercise: WorkoutEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EQUIPMENT_OPTIONS = [
  { value: 'all', label: 'All Equipment' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'cables', label: 'Cables' },
  { value: 'machines', label: 'Machines' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'resistance bands', label: 'Resistance Bands' },
  { value: 'kettlebells', label: 'Kettlebells' },
];

export function SubstituteModal({
  exercise,
  open,
  onOpenChange,
}: SubstituteModalProps) {
  const [alternatives, setAlternatives] = useState<ExerciseSubstitute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipment, setEquipment] = useState('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const fetchSubstitutes = useCallback(async () => {
    if (!exercise) return;

    setIsLoading(true);
    setError(null);
    setAlternatives([]);
    setExpandedIndex(null);

    try {
      const response = await fetch('/api/substitute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseName: exercise.exercise,
          muscleGroup: exercise.muscleGroup || 'unknown',
          equipment: equipment !== 'all' ? equipment : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get substitutes');
      }

      const data = await response.json();
      setAlternatives(data.alternatives || []);
    } catch (err) {
      console.error('Substitute error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alternatives');
    } finally {
      setIsLoading(false);
    }
  }, [exercise, equipment]);

  // Fetch on open or equipment change
  useEffect(() => {
    if (open && exercise) {
      fetchSubstitutes();
    }
  }, [open, exercise, fetchSubstitutes]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setAlternatives([]);
      setError(null);
      setEquipment('all');
      setExpandedIndex(null);
    }
  }, [open]);

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Substitutes for {exercise.exercise}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-2">
            {exercise.muscleGroup && (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: `${muscleGroupColors[exercise.muscleGroup]}20`,
                  color: muscleGroupColors[exercise.muscleGroup],
                }}
              >
                {muscleGroupLabels[exercise.muscleGroup]}
              </Badge>
            )}
            <span className="text-xs">
              Find feminization-friendly alternatives
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Equipment Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Label htmlFor="equipment-filter" className="whitespace-nowrap">
              Filter by equipment:
            </Label>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={equipment} onValueChange={setEquipment}>
                <SelectTrigger id="equipment-filter" className="w-full sm:w-[180px] min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={fetchSubstitutes}
                disabled={isLoading}
                className="gap-2 min-h-[44px] min-w-[44px]"
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Finding alternatives...</p>
              <p className="text-xs mt-1">Analyzing feminization compatibility</p>
            </div>
          )}

          {/* Alternatives List */}
          {!isLoading && alternatives.length > 0 && (
            <div className="space-y-3">
              {alternatives.map((alt, index) => (
                <Card
                  key={index}
                  className={cn(
                    'transition-colors',
                    expandedIndex === index && 'border-primary/50'
                  )}
                >
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold flex items-center gap-2">
                            {alt.name}
                            {alt.feminizationNote && (
                              <Sparkles className="h-4 w-4 text-primary" />
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alt.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 flex-shrink-0">
                          {alt.equipment?.map((eq) => (
                            <Badge key={eq} variant="outline" className="text-xs">
                              {eq}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Feminization note - always visible if present */}
                      {alt.feminizationNote && (
                        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-primary mb-1">
                              Feminization Note
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {alt.feminizationNote}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Expand/collapse for more details */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between min-h-[40px] text-muted-foreground"
                        onClick={() => toggleExpanded(index)}
                      >
                        <span className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Why this substitute?
                        </span>
                        {expandedIndex === index ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Expanded details */}
                      {expandedIndex === index && (
                        <div className="text-sm space-y-2 pt-2 border-t">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground">Muscle Group:</span>
                              <span className="ml-2 font-medium">
                                {muscleGroupLabels[alt.muscleGroup] || alt.muscleGroup}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Equipment:</span>
                              <span className="ml-2 font-medium">
                                {alt.equipment?.join(', ') || 'None'}
                              </span>
                            </div>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            This exercise targets the same muscle group as{' '}
                            <span className="font-medium">{exercise.exercise}</span>,
                            making it a suitable replacement while potentially offering
                            different benefits for your feminization goals.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && alternatives.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alternatives found</p>
              <p className="text-sm mt-1">Try changing the equipment filter</p>
            </div>
          )}

          {/* Tips */}
          {!isLoading && alternatives.length > 0 && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-medium mb-1">Tips for exercise substitution:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Choose exercises that match your available equipment</li>
                <li>For feminization, prefer lower body exercises that target glutes</li>
                <li>Upper body alternatives with higher reps (15-20) help avoid bulk</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
