

import { useState, useMemo } from 'react';
import { Dumbbell, Save, Check, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useWorkout } from '../context/WorkoutContext';
import {
  GeneratedRoutine,
  LoggedSet,
  WorkoutSession,
} from '../types/workout';

interface SetInput {
  weight: string;
  reps: string;
  rpe: string;
}

function todayISO(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 10);
}

export function SessionLogger() {
  const { generatedRoutines, sessions, saveSession } = useWorkout();

  const [routineId, setRoutineId] = useState<string>('');
  const [dayIndex, setDayIndex] = useState<number>(0);
  const [date, setDate] = useState<string>(todayISO());
  const [logs, setLogs] = useState<Record<number, SetInput[]>>({});
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const routine: GeneratedRoutine | undefined = useMemo(
    () => generatedRoutines.find((r) => r.id === routineId),
    [generatedRoutines, routineId]
  );
  const day = routine?.days[dayIndex];

  // Last logged values per exercise name → smart defaults for fast entry
  const lastByExercise = useMemo(() => {
    const map = new Map<string, LoggedSet[]>();
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    for (const s of sorted) {
      for (const ex of s.exercises) {
        const key = ex.name.trim().toLowerCase();
        if (!map.has(key) && ex.sets.length) map.set(key, ex.sets);
      }
    }
    return map;
  }, [sessions]);

  const initLogs = (r: GeneratedRoutine, dIdx: number) => {
    const d = r.days[dIdx];
    if (!d) return;
    const next: Record<number, SetInput[]> = {};
    d.exercises.forEach((ex, i) => {
      const prior = lastByExercise.get(ex.name.trim().toLowerCase());
      const count = ex.sets || 3;
      next[i] = Array.from({ length: count }, (_, si) => {
        const p = prior?.[si] ?? prior?.[prior.length - 1];
        return {
          weight: p ? String(p.weight) : '',
          reps: p ? String(p.reps) : '',
          rpe: '',
        };
      });
    });
    setLogs(next);
    setSaved(false);
  };

  const handleRoutineChange = (id: string) => {
    setRoutineId(id);
    setDayIndex(0);
    const r = generatedRoutines.find((x) => x.id === id);
    if (r) initLogs(r, 0);
  };

  const handleDayChange = (idx: number) => {
    setDayIndex(idx);
    if (routine) initLogs(routine, idx);
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetInput, value: string) => {
    setLogs((prev) => {
      const rows = [...(prev[exIdx] || [])];
      rows[setIdx] = { ...rows[setIdx], [field]: value };
      return { ...prev, [exIdx]: rows };
    });
    setSaved(false);
  };

  const addSet = (exIdx: number) => {
    setLogs((prev) => {
      const rows = [...(prev[exIdx] || [])];
      const last = rows[rows.length - 1];
      rows.push({ weight: last?.weight ?? '', reps: '', rpe: '' });
      return { ...prev, [exIdx]: rows };
    });
  };

  const loggedSetCount = useMemo(
    () =>
      Object.values(logs)
        .flat()
        .filter((s) => s.reps.trim() !== '').length,
    [logs]
  );

  const handleSave = () => {
    if (!routine || !day) return;

    const exercises = day.exercises
      .map((ex, i) => {
        const rows = (logs[i] || [])
          .filter((s) => s.reps.trim() !== '')
          .map<LoggedSet>((s) => ({
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps, 10) || 0,
            ...(s.rpe.trim() !== '' ? { rpe: parseFloat(s.rpe) } : {}),
          }));
        return {
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          targetSets: ex.sets,
          targetReps: ex.reps,
          sets: rows,
        };
      })
      .filter((ex) => ex.sets.length > 0);

    if (exercises.length === 0) return;

    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      date: new Date(`${date}T12:00:00`),
      routineId: routine.id,
      routineName: routine.name,
      dayName: day.name,
      exercises,
      notes: notes.trim() || undefined,
    };

    saveSession(session);
    setSaved(true);
    setNotes('');
  };

  if (generatedRoutines.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2 font-medium text-foreground">No routines to log against yet</p>
          <p className="text-sm mb-4">
            Generate a routine and save it, then come back here to log your sessions.
          </p>
          <Button asChild>
            <Link to="/generate" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate a Routine
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5 text-primary" />
            Log a Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label>Routine</Label>
              <Select value={routineId} onValueChange={handleRoutineChange}>
                <SelectTrigger className="w-full min-h-[44px]">
                  <SelectValue placeholder="Choose a routine" />
                </SelectTrigger>
                <SelectContent>
                  {generatedRoutines.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label>Day</Label>
              <Select
                value={String(dayIndex)}
                onValueChange={(v) => handleDayChange(parseInt(v, 10))}
                disabled={!routine}
              >
                <SelectTrigger className="w-full min-h-[44px]">
                  <SelectValue placeholder="Choose a day" />
                </SelectTrigger>
                <SelectContent>
                  {routine?.days.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {day && (
        <>
          {day.exercises.map((ex, exIdx) => (
            <Card key={exIdx}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{ex.name}</CardTitle>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    target {ex.sets} × {ex.reps}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 text-xs text-muted-foreground px-1">
                  <span>Set</span>
                  <span>Weight (lb)</span>
                  <span>Reps</span>
                  <span>RPE</span>
                </div>
                {(logs[exIdx] || []).map((row, setIdx) => (
                  <div key={setIdx} className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 items-center">
                    <span className="text-sm text-muted-foreground text-center">{setIdx + 1}</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={row.weight}
                      onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                      className="min-h-[44px]"
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={row.reps}
                      onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                      className="min-h-[44px]"
                    />
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="—"
                      value={row.rpe}
                      onChange={(e) => updateSet(exIdx, setIdx, 'rpe', e.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addSet(exIdx)}
                  className="text-xs text-muted-foreground"
                >
                  + Add set
                </Button>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-notes">Session Notes (optional)</Label>
                <Input
                  id="session-notes"
                  placeholder="How did it feel?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={loggedSetCount === 0}
                className="w-full min-h-[48px] text-base"
              >
                {saved ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Session Saved
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Session ({loggedSetCount} set{loggedSetCount !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
              {saved && (
                <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-1">
                  Check the Progression tab for your next targets
                  <ChevronRight className="h-4 w-4" />
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
