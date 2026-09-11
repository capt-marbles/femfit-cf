import { useState, useMemo, useEffect, useRef } from 'react';
import { Dumbbell, Save, Check, ChevronRight, Sparkles, Flame, Wind } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { getProgressionSuggestions } from '../lib/progression';
import {
  GeneratedRoutine,
  LoggedSet,
  WorkoutSession,
  WarmupRoutine,
  CooldownRoutine,
  StretchExercise,
  ProgressionSuggestion,
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

function parseRepRange(reps: string): string {
  // Return just the target string for use as a placeholder, e.g. "8-12"
  return reps?.trim() || '';
}

function getWarmupExercises(warmup: string | WarmupRoutine | undefined): StretchExercise[] {
  if (!warmup || typeof warmup === 'string') return [];
  return warmup.exercises || [];
}

function getCooldownStretches(cooldown: string | CooldownRoutine | undefined): StretchExercise[] {
  if (!cooldown || typeof cooldown === 'string') return [];
  return cooldown.stretches || [];
}

interface ChecklistSectionProps {
  title: string;
  icon: React.ReactNode;
  items: StretchExercise[];
  checked: boolean[];
  onToggle: (i: number) => void;
  emptyLabel?: string;
}

function ChecklistSection({ title, icon, items, checked, onToggle, emptyLabel }: ChecklistSectionProps) {
  if (items.length === 0 && !emptyLabel) return null;
  const doneCount = checked.filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {doneCount}/{items.length} done
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && emptyLabel ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item, i) => (
            <label
              key={i}
              className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                checked[i] ? 'bg-muted/50' : 'hover:bg-muted/30'
              }`}
            >
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked[i] || false}
                  onChange={() => onToggle(i)}
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  checked[i]
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/40'
                }`}>
                  {checked[i] && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium ${checked[i] ? 'line-through text-muted-foreground' : ''}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{item.duration}</span>
                </div>
                {item.instructions && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.instructions}</p>
                )}
              </div>
            </label>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ProgressionChip({ suggestion }: { suggestion: ProgressionSuggestion }) {
  const { action, suggestedWeight, suggestedReps, lastWeight, lastReps } = suggestion;

  let icon = '';
  let label = '';
  let classes = '';

  if (action === 'increase-weight') {
    icon = '↑';
    label = `Try ${suggestedWeight} lb × ${suggestedReps}`;
    classes = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  } else if (action === 'increase-reps') {
    icon = '↑';
    label = `Push for ${suggestedReps} reps at ${lastWeight} lb`;
    classes = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  } else if (action === 'deload') {
    icon = '↓';
    label = `Deload to ${suggestedWeight} lb`;
    classes = 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
  } else if (action === 'hold') {
    icon = '→';
    label = `Hold at ${lastWeight} lb`;
    classes = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
  } else {
    // maintain
    icon = '→';
    label = `Maintain current load`;
    classes = 'bg-muted/60 text-muted-foreground border-border';
  }

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs font-medium ${classes}`}>
      <span className="text-sm leading-none">{icon}</span>
      <span>{label}</span>
      {lastReps && (
        <span className="ml-auto opacity-60 font-normal">last: {lastReps}</span>
      )}
    </div>
  );
}

export function SessionLogger() {
  const { generatedRoutines, sessions, saveSession } = useWorkout();

  const [routineId, setRoutineId] = useState<string>('');
  const [dayIndex, setDayIndex] = useState<number>(0);
  const [date, setDate] = useState<string>(todayISO());
  const [logs, setLogs] = useState<Record<number, SetInput[]>>({});
  const [warmupChecked, setWarmupChecked] = useState<boolean[]>([]);
  const [cooldownChecked, setCooldownChecked] = useState<boolean[]>([]);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const routine: GeneratedRoutine | undefined = useMemo(
    () => generatedRoutines.find((r) => r.id === routineId),
    [generatedRoutines, routineId]
  );
  const day = routine?.days[dayIndex];

  const warmupItems = useMemo(() => getWarmupExercises(day?.warmup), [day]);
  const cooldownItems = useMemo(() => getCooldownStretches(day?.cooldown), [day]);

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

  const progressionMap = useMemo(() => {
    const suggestions = getProgressionSuggestions(sessions);
    return new Map<string, ProgressionSuggestion>(
      suggestions.map((s) => [s.exercise.trim().toLowerCase(), s])
    );
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
    setWarmupChecked(Array(getWarmupExercises(d.warmup).length).fill(false));
    setCooldownChecked(Array(getCooldownStretches(d.cooldown).length).fill(false));
    setSaved(false);
  };

  // Deep link from the dashboard: /log?routine=<id>&day=<index>. Routines
  // arrive asynchronously from KV, so wait until the referenced one exists.
  const [searchParams] = useSearchParams();
  const initialisedFromUrl = useRef(false);
  useEffect(() => {
    if (initialisedFromUrl.current) return;
    const rid = searchParams.get('routine');
    if (!rid) return;
    const r = generatedRoutines.find((x) => x.id === rid);
    if (!r) return;
    const requested = parseInt(searchParams.get('day') ?? '0', 10) || 0;
    const idx = Math.min(Math.max(requested, 0), r.days.length - 1);
    setRoutineId(rid);
    setDayIndex(idx);
    initLogs(r, idx);
    initialisedFromUrl.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedRoutines, searchParams]);

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
    () => Object.values(logs).flat().filter((s) => s.reps.trim() !== '').length,
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
      {/* Session setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="h-5 w-5 text-primary" />
            Log a Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2">
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
          {/* Warmup */}
          <ChecklistSection
            title="Warm-up"
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            items={warmupItems}
            checked={warmupChecked}
            onToggle={(i) => setWarmupChecked((prev) => prev.map((v, idx) => idx === i ? !v : v))}
            emptyLabel={typeof day.warmup === 'string' ? day.warmup : undefined}
          />

          {/* Main exercises */}
          {day.exercises.map((ex, exIdx) => {
            const targetReps = parseRepRange(ex.reps);
            const progression = progressionMap.get(ex.name.trim().toLowerCase());
            return (
              <Card key={exIdx}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{ex.name}</CardTitle>
                      {ex.notes && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-prose">
                          {ex.notes}
                        </p>
                      )}
                      {ex.feminizationNote && (
                        <p className="text-xs text-muted-foreground/70 mt-1 max-w-prose italic">
                          {ex.feminizationNote}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {ex.sets} × {ex.reps}
                      </span>
                      {ex.rest && (
                        <p className="text-xs text-muted-foreground">{ex.rest} rest</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {progression && <ProgressionChip suggestion={progression} />}
                  <div className="grid grid-cols-[2rem_1fr_1fr_1fr] gap-2 text-xs text-muted-foreground px-1">
                    <span>#</span>
                    <span>Weight (lb)</span>
                    <span>Reps (target: {targetReps})</span>
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
                        placeholder={targetReps || '0'}
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
            );
          })}

          {/* Cooldown */}
          <ChecklistSection
            title="Cool-down & Stretches"
            icon={<Wind className="h-4 w-4 text-blue-500" />}
            items={cooldownItems}
            checked={cooldownChecked}
            onToggle={(i) => setCooldownChecked((prev) => prev.map((v, idx) => idx === i ? !v : v))}
            emptyLabel={typeof day.cooldown === 'string' ? day.cooldown : undefined}
          />

          {/* Save */}
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
