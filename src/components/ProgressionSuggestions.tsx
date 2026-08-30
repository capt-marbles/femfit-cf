

import { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUp,
  Minus,
  Dumbbell,
  Info,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useWorkout } from '../context/WorkoutContext';
import { getProgressionSuggestions } from '../lib/progression';
import { ProgressionAction, ProgressionCategory } from '../types/workout';

const ACTION_META: Record<
  ProgressionAction,
  { label: string; icon: typeof TrendingUp; className: string }
> = {
  'increase-weight': { label: 'Add weight', icon: TrendingUp, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  'increase-reps': { label: 'Add reps', icon: ArrowUp, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  hold: { label: 'Hold', icon: Minus, className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  deload: { label: 'Deload', icon: TrendingDown, className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  maintain: { label: 'Maintain', icon: Minus, className: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
};

const CATEGORY_META: Record<ProgressionCategory, { label: string; className: string }> = {
  lower: { label: 'Lower body — build', className: 'text-primary' },
  upper: { label: 'Upper body — maintain', className: 'text-amber-600' },
  core: { label: 'Core — posture', className: 'text-blue-600' },
  cardio: { label: 'Cardio', className: 'text-red-600' },
};

export function ProgressionSuggestions() {
  const { sessions } = useWorkout();

  const suggestions = useMemo(() => getProgressionSuggestions(sessions), [sessions]);

  const grouped = useMemo(() => {
    const g: Record<ProgressionCategory, typeof suggestions> = {
      lower: [], upper: [], core: [], cardio: [],
    };
    for (const s of suggestions) g[s.category].push(s);
    return g;
  }, [suggestions]);

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-1 font-medium text-foreground">No sessions logged yet</p>
          <p className="text-sm">
            Log a workout on the Log tab and your next-session targets will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Strategy explainer */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          Progression here is <span className="font-medium text-foreground">asymmetric</span>: push
          load on <span className="font-medium text-foreground">lower body</span> to build glutes and
          legs, while <span className="font-medium text-foreground">upper body</span> is held at high
          reps to maintain without bulk. Targets come from your logged sets.
        </p>
      </div>

      {(['lower', 'upper', 'core'] as ProgressionCategory[]).map((cat) =>
        grouped[cat].length > 0 ? (
          <div key={cat} className="space-y-2">
            <h3 className={`text-sm font-semibold ${CATEGORY_META[cat].className}`}>
              {CATEGORY_META[cat].label}
            </h3>
            {grouped[cat].map((s) => {
              const meta = ACTION_META[s.action];
              const Icon = meta.icon;
              return (
                <Card key={s.exercise}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{s.exercise}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last: {s.lastWeight > 0 ? `${s.lastWeight} lb × ` : ''}
                          {s.lastReps} reps
                          {s.sessionsLogged > 1 ? ` · ${s.sessionsLogged} sessions` : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className={`flex-shrink-0 gap-1 ${meta.className}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Next:</span>
                      <span className="font-semibold">
                        {s.suggestedWeight > 0 ? `${s.suggestedWeight} lb × ` : ''}
                        {s.suggestedReps} reps
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{s.rationale}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null
      )}
    </div>
  );
}
