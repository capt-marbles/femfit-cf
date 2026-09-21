import { useState } from 'react';
import { BookOpen, Sparkles, Undo2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { GeneratedRoutine } from '../components/GeneratedRoutine';
import { ExerciseSwapDialog } from '../components/ExerciseSwapDialog';
import { useWorkout } from '../context/WorkoutContext';
import { getActiveRoutine } from '../lib/dashboard';
import { GeneratedRoutine as RoutineType } from '../types/workout';
import { SubstituteChoice } from '../lib/substitutions';

interface SwapTarget {
  dayIndex: number;
  exerciseIndex: number;
  name: string;
}

interface LastSwap {
  dayIndex: number;
  exerciseIndex: number;
  from: string;
  to: string;
  /** Notes as they were before the swap, so undo restores them too. */
  fromNotes?: string;
}

export default function Program() {
  const { generatedRoutines, sessions, updateRoutine, deleteRoutine } = useWorkout();
  const routine = getActiveRoutine(generatedRoutines, sessions);

  const [swapTarget, setSwapTarget] = useState<SwapTarget | null>(null);
  const [lastSwap, setLastSwap] = useState<LastSwap | null>(null);

  const applySwap = (
    r: RoutineType,
    dayIndex: number,
    exerciseIndex: number,
    name: string,
    notes?: string
  ) => {
    const next: RoutineType = {
      ...r,
      days: r.days.map((day, di) =>
        di !== dayIndex
          ? day
          : {
              ...day,
              exercises: day.exercises.map((ex, ei) =>
                ei !== exerciseIndex ? ex : { ...ex, name, notes }
              ),
            }
      ),
    };
    updateRoutine(next);
  };

  const handleSelect = (choice: SubstituteChoice) => {
    if (!routine || !swapTarget) return;
    const { dayIndex, exerciseIndex, name } = swapTarget;
    const current = routine.days[dayIndex].exercises[exerciseIndex];

    // Sets, reps, rest and the RIR guidance in notes are prescriptions for the
    // movement pattern, which the swap preserves — so they carry over. The
    // substitute's own constraint (lat pulldowns stay light, good mornings stay
    // seated) is appended rather than replacing them.
    const merged =
      choice.note && !current.notes?.includes(choice.note)
        ? [current.notes, choice.note].filter(Boolean).join(' ')
        : current.notes;

    applySwap(routine, dayIndex, exerciseIndex, choice.name, merged);
    setLastSwap({
      dayIndex,
      exerciseIndex,
      from: name,
      to: choice.name,
      fromNotes: current.notes,
    });
    setSwapTarget(null);
  };

  const handleUndo = () => {
    if (!routine || !lastSwap) return;
    applySwap(
      routine,
      lastSwap.dayIndex,
      lastSwap.exerciseIndex,
      lastSwap.from,
      lastSwap.fromNotes
    );
    setLastSwap(null);
  };

  if (!routine) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Program
        </h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium text-foreground mb-1">No program saved yet</p>
            <p className="text-sm mb-4">Generate a routine and save it to view it here.</p>
            <Button asChild>
              <Link to="/generate" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate a Routine
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Program
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tap the swap icon beside any exercise to change it.
        </p>
      </div>

      {lastSwap && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
          <p className="text-sm text-emerald-700 dark:text-emerald-400 min-w-0">
            Swapped <span className="font-medium">{lastSwap.from}</span> →{' '}
            <span className="font-medium">{lastSwap.to}</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            className="flex-shrink-0 h-8 text-emerald-700 dark:text-emerald-400"
          >
            <Undo2 className="h-3.5 w-3.5 mr-1" />
            Undo
          </Button>
        </div>
      )}

      <GeneratedRoutine
        routine={routine}
        onDelete={deleteRoutine}
        isSaved={true}
        onSwapExercise={(dayIndex, exerciseIndex) =>
          setSwapTarget({
            dayIndex,
            exerciseIndex,
            name: routine.days[dayIndex].exercises[exerciseIndex].name,
          })
        }
      />

      <ExerciseSwapDialog
        exerciseName={swapTarget?.name ?? null}
        open={swapTarget !== null}
        onOpenChange={(o) => !o && setSwapTarget(null)}
        onSelect={handleSelect}
      />
    </div>
  );
}
