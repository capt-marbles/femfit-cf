

import { useState } from 'react';
import {
  Dumbbell,
  Clock,
  ChevronDown,
  ChevronUp,
  Save,
  Share2,
  Trash2,
  Info,
  Sparkles,
  Flame,
  Wind,
  Heart,
  Timer,
  Repeat,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './ui/card';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  GeneratedRoutine as GeneratedRoutineType,
  GeneratedWorkoutDay,
  WarmupRoutine,
  CooldownRoutine,
  WeeklyCardio,
} from '../types/workout';
import { cn } from '../lib/utils';

interface GeneratedRoutineProps {
  routine: GeneratedRoutineType;
  onSave?: (routine: GeneratedRoutineType) => void;
  onDelete?: (routineId: string) => void;
  isSaved?: boolean;
  /** When provided, each exercise gets a swap control. */
  onSwapExercise?: (dayIndex: number, exerciseIndex: number) => void;
}

export function GeneratedRoutine({
  routine,
  onSave,
  onDelete,
  isSaved = false,
  onSwapExercise,
}: GeneratedRoutineProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const [showCardio, setShowCardio] = useState(true);

  const toggleDay = (index: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedDays(new Set(routine.days.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  const handleShare = async () => {
    const text = formatRoutineAsText(routine);
    if (navigator.share) {
      try {
        await navigator.share({
          title: routine.name,
          text: text,
        });
      } catch {
        copyToClipboard(text);
      }
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Routine copied to clipboard!');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {routine.name}
            </CardTitle>
            <CardDescription className="text-sm">
              {routine.description}
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {onSave && !isSaved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSave(routine)}
                className="min-h-[40px]"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="min-h-[40px]"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            {onDelete && isSaved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(routine.id)}
                className="min-h-[40px] text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Routine metadata */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary">
            {routine.daysPerWeek} days/week
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {routine.experienceLevel}
          </Badge>
          {routine.cardio && (
            <Badge variant="secondary" className="bg-red-500/10 text-red-600">
              <Heart className="h-3 w-3 mr-1" />
              {routine.cardio.sessionsPerWeek}x cardio
            </Badge>
          )}
          {routine.equipment.slice(0, 3).map((eq) => (
            <Badge key={eq} variant="outline">
              {eq}
            </Badge>
          ))}
          {routine.equipment.length > 3 && (
            <Badge variant="outline">+{routine.equipment.length - 3} more</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Expand/Collapse controls */}
        <div className="flex justify-end gap-2 p-4 border-b">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>

        {/* Workout days */}
        <div className="divide-y">
          {routine.days.map((day, index) => (
            <WorkoutDayCard
              key={index}
              day={day}
              dayNumber={index + 1}
              isExpanded={expandedDays.has(index)}
              onToggle={() => toggleDay(index)}
              onSwapExercise={
                onSwapExercise
                  ? (exIndex: number) => onSwapExercise(index, exIndex)
                  : undefined
              }
            />
          ))}
        </div>

        {/* Cardio Section */}
        {routine.cardio && (
          <div className="border-t">
            <button
              onClick={() => setShowCardio(!showCardio)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors min-h-[56px] touch-manipulation"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-600">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Weekly Cardio Plan</p>
                  <p className="text-xs text-muted-foreground">
                    {routine.cardio.sessionsPerWeek} sessions - {routine.cardio.totalMinutes}
                  </p>
                </div>
              </div>
              {showCardio ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {showCardio && <CardioSection cardio={routine.cardio} />}
          </div>
        )}

        {/* General notes */}
        {routine.generalNotes && routine.generalNotes.length > 0 && (
          <div className="p-4 bg-muted/30 border-t">
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <Info className="h-4 w-4" />
              Program Notes
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {routine.generalNotes.map((note, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1">-</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CardioSectionProps {
  cardio: WeeklyCardio;
}

function CardioSection({ cardio }: CardioSectionProps) {
  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Cardio sessions */}
      <div className="grid gap-3 sm:grid-cols-2">
        {cardio.sessions.map((session, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border bg-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h5 className="font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  {session.name}
                </h5>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {session.duration}
                  </span>
                  <span>{session.intensity}</span>
                </div>
              </div>
            </div>
            {session.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                {session.notes}
              </p>
            )}
            {session.feminizationNote && (
              <p className="text-xs text-primary mt-2 flex items-start gap-1">
                <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {session.feminizationNote}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Cardio notes */}
      {cardio.notes && cardio.notes.length > 0 && (
        <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/20">
          <h5 className="font-medium text-sm flex items-center gap-2 mb-2 text-red-600">
            <Info className="h-4 w-4" />
            Cardio Guidelines
          </h5>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {cardio.notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500">-</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface WorkoutDayCardProps {
  day: GeneratedWorkoutDay;
  dayNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSwapExercise?: (exerciseIndex: number) => void;
}

function WorkoutDayCard({
  day,
  dayNumber,
  isExpanded,
  onToggle,
  onSwapExercise,
}: WorkoutDayCardProps) {
  const warmup = day.warmup;
  const cooldown = day.cooldown;
  const isDetailedWarmup = warmup && typeof warmup === 'object';
  const isDetailedCooldown = cooldown && typeof cooldown === 'object';

  return (
    <div>
      {/* Day header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors min-h-[56px] touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {dayNumber}
          </div>
          <div className="text-left">
            <p className="font-medium">{day.name}</p>
            <p className="text-xs text-muted-foreground">{day.focus}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {day.exercises.length} exercises
          </Badge>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Day content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Warmup Section */}
          {warmup && (
            isDetailedWarmup ? (
              <DetailedWarmupSection warmup={warmup as WarmupRoutine} />
            ) : (
              <div className="text-sm bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                <span className="font-medium flex items-center gap-2 text-orange-600">
                  <Flame className="h-4 w-4" />
                  Warmup
                </span>
                <p className="mt-1 text-muted-foreground">{warmup as string}</p>
              </div>
            )
          )}

          {/* Exercises table */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Exercise</TableHead>
                    <TableHead className="w-[80px]">Sets</TableHead>
                    <TableHead className="w-[80px]">Reps</TableHead>
                    <TableHead className="w-[100px]">Rest</TableHead>
                    <TableHead className="hidden md:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {day.exercises.map((exercise, exIndex) => (
                    <TableRow key={exIndex}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">{exercise.name}</span>
                            {onSwapExercise && (
                              <button
                                onClick={() => onSwapExercise(exIndex)}
                                title={`Swap ${exercise.name}`}
                                aria-label={`Swap ${exercise.name}`}
                                className="flex-shrink-0 p-1.5 -m-0.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                              >
                                <Repeat className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          {exercise.feminizationNote && (
                            <p className="text-xs text-primary mt-1 ml-6">
                              {exercise.feminizationNote}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{exercise.sets}</TableCell>
                      <TableCell>{exercise.reps}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {exercise.rest}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {exercise.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile notes view */}
          <div className="md:hidden space-y-2">
            {day.exercises
              .filter((ex) => ex.notes)
              .map((exercise, i) => (
                <div key={i} className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  <span className="font-medium">{exercise.name}:</span> {exercise.notes}
                </div>
              ))}
          </div>

          {/* Cooldown Section */}
          {cooldown && (
            isDetailedCooldown ? (
              <DetailedCooldownSection cooldown={cooldown as CooldownRoutine} />
            ) : (
              <div className="text-sm bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <span className="font-medium flex items-center gap-2 text-blue-600">
                  <Wind className="h-4 w-4" />
                  Cooldown & Stretching
                </span>
                <p className="mt-1 text-muted-foreground">{cooldown as string}</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function DetailedWarmupSection({ warmup }: { warmup: WarmupRoutine }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-orange-500/10 rounded-lg border border-orange-500/20 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-orange-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-600" />
          <span className="font-medium text-orange-600">Warmup</span>
          <span className="text-xs text-muted-foreground">({warmup.duration})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-orange-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-orange-600" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {warmup.description && (
            <p className="text-sm text-muted-foreground">{warmup.description}</p>
          )}
          <div className="space-y-2">
            {warmup.exercises.map((ex, i) => (
              <div key={i} className="bg-background/50 p-2 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{ex.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {ex.duration}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-orange-600">{ex.targetArea}</span> - {ex.instructions}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailedCooldownSection({ cooldown }: { cooldown: CooldownRoutine }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-blue-500/10 rounded-lg border border-blue-500/20 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-blue-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-600">Cooldown & Stretching</span>
          <span className="text-xs text-muted-foreground">({cooldown.duration})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-600" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {cooldown.description && (
            <p className="text-sm text-muted-foreground">{cooldown.description}</p>
          )}
          <div className="space-y-2">
            {cooldown.stretches.map((stretch, i) => (
              <div key={i} className="bg-background/50 p-2 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stretch.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {stretch.duration}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-blue-600">{stretch.targetArea}</span> - {stretch.instructions}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to format routine as shareable text
function formatRoutineAsText(routine: GeneratedRoutineType): string {
  let text = `${routine.name}\n`;
  text += `${routine.description}\n\n`;
  text += `${routine.daysPerWeek} days/week | ${routine.experienceLevel}\n`;
  text += `Equipment: ${routine.equipment.join(', ')}\n\n`;

  routine.days.forEach((day, i) => {
    text += `=== Day ${i + 1}: ${day.name} (${day.focus}) ===\n\n`;

    // Warmup
    if (day.warmup) {
      if (typeof day.warmup === 'object') {
        const warmup = day.warmup as WarmupRoutine;
        text += `WARMUP (${warmup.duration}):\n`;
        text += `${warmup.description}\n`;
        warmup.exercises.forEach((ex) => {
          text += `- ${ex.name} (${ex.duration}) - ${ex.targetArea}\n`;
          text += `  ${ex.instructions}\n`;
        });
      } else {
        text += `Warmup: ${day.warmup}\n`;
      }
      text += '\n';
    }

    // Main exercises
    text += `MAIN WORKOUT:\n`;
    day.exercises.forEach((ex) => {
      text += `- ${ex.name}: ${ex.sets} x ${ex.reps} (rest: ${ex.rest})\n`;
      if (ex.notes) text += `  Note: ${ex.notes}\n`;
      if (ex.feminizationNote) text += `  Feminization: ${ex.feminizationNote}\n`;
    });
    text += '\n';

    // Cooldown
    if (day.cooldown) {
      if (typeof day.cooldown === 'object') {
        const cooldown = day.cooldown as CooldownRoutine;
        text += `COOLDOWN & STRETCHING (${cooldown.duration}):\n`;
        text += `${cooldown.description}\n`;
        cooldown.stretches.forEach((stretch) => {
          text += `- ${stretch.name} (${stretch.duration}) - ${stretch.targetArea}\n`;
          text += `  ${stretch.instructions}\n`;
        });
      } else {
        text += `Cooldown: ${day.cooldown}\n`;
      }
    }
    text += '\n';
  });

  // Cardio section
  if (routine.cardio) {
    text += `=== WEEKLY CARDIO PLAN ===\n`;
    text += `${routine.cardio.sessionsPerWeek} sessions/week - ${routine.cardio.totalMinutes}\n\n`;

    routine.cardio.sessions.forEach((session) => {
      text += `- ${session.name} (${session.duration})\n`;
      text += `  Intensity: ${session.intensity}\n`;
      if (session.notes) text += `  ${session.notes}\n`;
      if (session.feminizationNote) text += `  Feminization: ${session.feminizationNote}\n`;
    });
    text += '\n';

    if (routine.cardio.notes && routine.cardio.notes.length > 0) {
      text += `Cardio Notes:\n`;
      routine.cardio.notes.forEach((note) => {
        text += `- ${note}\n`;
      });
      text += '\n';
    }
  }

  if (routine.generalNotes.length > 0) {
    text += `=== Program Notes ===\n`;
    routine.generalNotes.forEach((note) => {
      text += `- ${note}\n`;
    });
  }

  text += `\nGenerated by FemFit Analyzer`;
  return text;
}
