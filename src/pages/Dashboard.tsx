import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Sparkles,
  Dumbbell,
  Play,
  TrendingUp,
  TrendingDown,
  Ruler,
  CalendarCheck,
  Flame,
  ChevronRight,
  Loader2,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useWorkout } from '../context/WorkoutContext';
import { getProgressionSuggestions } from '../lib/progression';
import {
  getActiveRoutine,
  getNextSession,
  sessionsThisWeek,
  weekStreak,
  weeklyVolume,
  keyLiftTrends,
  measurementSnapshot,
  VolumeBucket,
} from '../lib/dashboard';

// ---------------------------------------------------------------------------

function SectionTitle({ icon, children, to, cta }: { icon: React.ReactNode; children: React.ReactNode; to?: string; cta?: string }) {
  return (
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2 text-base">
        {icon}
        {children}
      </CardTitle>
      {to && (
        <Link to={to} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
          {cta ?? 'View all'}
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function VolumeBar({ b }: { b: VolumeBucket }) {
  // Scale the bar to the top of the target range plus headroom so "above"
  // visibly overshoots rather than clipping.
  const scaleMax = b.max * 1.4;
  const fill = Math.min(100, (b.sets / scaleMax) * 100);
  const minPct = (b.min / scaleMax) * 100;
  const maxPct = (b.max / scaleMax) * 100;

  const colour =
    b.status === 'on' ? 'bg-green-500' : b.status === 'above' ? 'bg-amber-500' : 'bg-zinc-400 dark:bg-zinc-600';

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{b.label}</span>
        <span className="tabular-nums text-muted-foreground">
          <span className={b.status === 'on' ? 'text-green-600 font-semibold' : b.status === 'above' ? 'text-amber-600 font-semibold' : 'text-foreground font-semibold'}>
            {b.sets}
          </span>
          {' '}/ {b.min}–{b.max}
        </span>
      </div>
      <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
        {/* target band */}
        <div
          className="absolute inset-y-0 bg-green-500/15"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
        />
        <div className={`absolute inset-y-0 left-0 rounded-full transition-all ${colour}`} style={{ width: `${fill}%` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Delta({ value, invert = false, unit = '' }: { value?: number; invert?: boolean; unit?: string }) {
  if (value === undefined || value === 0) return <span className="text-xs text-muted-foreground">—</span>;
  // invert: for waist and W:H, down is good.
  const good = invert ? value < 0 : value > 0;
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${good ? 'text-green-600' : 'text-amber-600'}`}>
      <Icon className="h-3 w-3" />
      {value > 0 ? '+' : ''}{value}{unit}
    </span>
  );
}

// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { generatedRoutines, sessions, measurements, measurementSettings, isLoading } = useWorkout();

  const routine = useMemo(() => getActiveRoutine(generatedRoutines, sessions), [generatedRoutines, sessions]);
  const next = useMemo(() => (routine ? getNextSession(routine, sessions) : null), [routine, sessions]);
  const week = useMemo(() => sessionsThisWeek(sessions), [sessions]);
  const streak = useMemo(() => weekStreak(sessions), [sessions]);
  const volume = useMemo(() => weeklyVolume(week), [week]);
  const trends = useMemo(() => keyLiftTrends(sessions), [sessions]);
  const snapshot = useMemo(() => measurementSnapshot(measurements), [measurements]);

  const targets = useMemo(() => {
    const all = getProgressionSuggestions(sessions);
    return all.filter((s) => s.action === 'increase-weight' || s.action === 'deload').slice(0, 4);
  }, [sessions]);

  const lengthUnit = measurementSettings.unit === 'imperial' ? 'in' : 'cm';
  const weightUnit = measurementSettings.unit === 'imperial' ? 'lb' : 'kg';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const hasRoutine = routine !== null;
  const hasSessions = sessions.length > 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {hasRoutine ? routine.name : 'Your training at a glance'}
        </p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Next session — the hero. One tap into the gym page.             */}
      {/* ---------------------------------------------------------------- */}
      {!hasRoutine ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-8 text-center">
            <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary" />
            <p className="font-medium text-lg mb-1">No routine yet</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Generate a program built on the feminization principles, save it, and this page
              becomes your training home.
            </p>
            <Button asChild size="lg" className="min-h-[48px]">
              <Link to="/generate" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate a routine
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : next && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  {next.lastSessionDate ? 'Next up' : 'Start here'}
                </p>
                <p className="font-semibold text-lg leading-tight truncate">{next.dayName}</p>
                {next.focus && <p className="text-sm text-muted-foreground">{next.focus}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  {next.exerciseCount} exercises
                  {next.daysSinceLast !== null && (
                    <> · last session {next.daysSinceLast === 0 ? 'today' : next.daysSinceLast === 1 ? 'yesterday' : `${next.daysSinceLast} days ago`}</>
                  )}
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0 min-h-[48px]">
                <Link to={`/log?routine=${encodeURIComponent(routine.id)}&day=${next.dayIndex}`} className="gap-2">
                  <Play className="h-4 w-4" />
                  Start
                </Link>
              </Button>
            </div>

            {/* Skipping a day? Every other day is one tap away. */}
            {routine.days.length > 1 && (
              <div className="mt-4 pt-3 border-t border-primary/15">
                <p className="text-xs text-muted-foreground mb-2">Or start a different day</p>
                <div className="flex flex-wrap gap-2">
                  {routine.days.map((d, i) =>
                    i === next.dayIndex ? null : (
                      <Link
                        key={i}
                        to={`/log?routine=${encodeURIComponent(routine.id)}&day=${i}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full border border-border bg-background text-sm hover:border-primary hover:text-primary transition-colors"
                      >
                        <span className="font-medium">{d.name}</span>
                        {d.focus && <span className="text-xs text-muted-foreground hidden sm:inline">· {d.focus}</span>}
                      </Link>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* This week + weekly volume                                        */}
      {/* ---------------------------------------------------------------- */}
      {hasRoutine && (
        <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <Card>
            <CardHeader className="pb-3">
              <SectionTitle icon={<CalendarCheck className="h-4 w-4 text-primary" />}>This week</SectionTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold tabular-nums leading-none">{week.length}</span>
                <span className="text-muted-foreground pb-1">/ {routine.daysPerWeek} sessions</span>
              </div>
              <div className="flex gap-1.5 mb-3">
                {Array.from({ length: routine.daysPerWeek }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${i < week.length ? 'bg-primary' : 'bg-muted'}`}
                  />
                ))}
              </div>
              {streak > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {streak}-week streak
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <SectionTitle icon={<Target className="h-4 w-4 text-primary" />}>
                Weekly sets vs. targets
              </SectionTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {volume.map((b) => (
                <VolumeBar key={b.key} b={b} />
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                Counted from sets you logged this week, against the program's own targets. Green band is the range.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Next targets                                                     */}
      {/* ---------------------------------------------------------------- */}
      {hasSessions && (
        <Card>
          <CardHeader className="pb-3">
            <SectionTitle icon={<TrendingUp className="h-4 w-4 text-primary" />} to="/log" cta="All progression">
              Next targets
            </SectionTitle>
          </CardHeader>
          <CardContent>
            {targets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing to change yet — keep pushing toward the top of each rep range with 1-2 in reserve.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {targets.map((t) => (
                  <li key={t.exercise} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{t.exercise}</p>
                      <p className="text-xs text-muted-foreground">
                        Last {t.lastWeight > 0 ? `${t.lastWeight} lb × ` : ''}{t.lastReps}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="outline"
                        className={t.action === 'deload'
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : 'bg-green-500/10 text-green-600 border-green-500/20'}
                      >
                        {t.action === 'deload' ? 'Deload' : 'Add weight'}
                      </Badge>
                      <p className="text-sm font-semibold mt-1 tabular-nums">
                        {t.suggestedWeight > 0 ? `${t.suggestedWeight} lb × ` : ''}{t.suggestedReps}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Key lift trends                                                  */}
      {/* ---------------------------------------------------------------- */}
      {hasSessions && (
        <Card>
          <CardHeader className="pb-3">
            <SectionTitle icon={<Dumbbell className="h-4 w-4 text-primary" />}>Key lifts</SectionTitle>
          </CardHeader>
          <CardContent>
            {trends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Log a hip thrust or Romanian deadlift session and the working-weight trend appears here.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {trends.map((t) => {
                  const first = t.points[0]?.weight ?? 0;
                  const last = t.points[t.points.length - 1]?.weight ?? 0;
                  const change = last - first;
                  return (
                    <div key={t.name}>
                      <div className="flex items-baseline justify-between mb-1">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-sm tabular-nums">
                          <span className="font-semibold">{last} lb</span>
                          {t.points.length > 1 && (
                            <span className={`ml-2 text-xs ${change > 0 ? 'text-green-600' : change < 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              {change > 0 ? '+' : ''}{change}
                            </span>
                          )}
                        </p>
                      </div>
                      {t.points.length < 2 ? (
                        <p className="text-xs text-muted-foreground h-[140px] flex items-center">
                          One session logged — the trend line needs two.
                        </p>
                      ) : (
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={t.points} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} width={44} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: 12,
                              }}
                              formatter={(v, _n, p) => [`${v} lb · top set ${(p.payload as { topReps: number }).topReps} reps`, 'Working weight']}
                            />
                            <Line type="monotone" dataKey="weight" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Measurements                                                     */}
      {/* ---------------------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-3">
          <SectionTitle icon={<Ruler className="h-4 w-4 text-primary" />} to="/measurements" cta={snapshot ? 'Charts' : 'Log'}>
            Measurements
          </SectionTitle>
        </CardHeader>
        <CardContent>
          {!snapshot ? (
            <p className="text-sm text-muted-foreground">
              Log a first set of measurements and hips, waist and the waist-to-hip ratio will track here.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Hips</p>
                  <p className="text-xl font-bold tabular-nums">
                    {snapshot.hips.now ?? '—'}<span className="text-xs font-normal text-muted-foreground ml-0.5">{snapshot.hips.now !== undefined ? lengthUnit : ''}</span>
                  </p>
                  <Delta value={snapshot.hips.delta} />
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Waist</p>
                  <p className="text-xl font-bold tabular-nums">
                    {snapshot.waist.now ?? '—'}<span className="text-xs font-normal text-muted-foreground ml-0.5">{snapshot.waist.now !== undefined ? lengthUnit : ''}</span>
                  </p>
                  <Delta value={snapshot.waist.delta} invert />
                </div>
                <div className="rounded-lg bg-muted/50 p-3 ring-1 ring-primary/30">
                  <p className="text-xs text-muted-foreground">Waist : hip</p>
                  <p className="text-xl font-bold tabular-nums">{snapshot.whr.now?.toFixed(2) ?? '—'}</p>
                  <Delta value={snapshot.whr.delta} invert />
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="text-xl font-bold tabular-nums">
                    {snapshot.weight.now ?? '—'}<span className="text-xs font-normal text-muted-foreground ml-0.5">{snapshot.weight.now !== undefined ? weightUnit : ''}</span>
                  </p>
                  <Delta value={snapshot.weight.delta} invert />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {snapshot.count === 1
                  ? `One entry (${new Date(snapshot.latest.date).toLocaleDateString()}). Changes show from the second.`
                  : `Change since ${new Date(snapshot.earliest.date).toLocaleDateString()} · ${snapshot.count} entries`}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
