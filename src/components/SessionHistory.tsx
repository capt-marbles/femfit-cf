

import { Trash2, Calendar } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useWorkout } from '../context/WorkoutContext';

export function SessionHistory() {
  const { sessions, deleteSession } = useWorkout();

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-1 font-medium text-foreground">No logged sessions yet</p>
          <p className="text-sm">Sessions you log will show up here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const totalSets = s.exercises.reduce((n, ex) => n + ex.sets.length, 0);
        const volume = s.exercises.reduce(
          (v, ex) => v + ex.sets.reduce((sv, set) => sv + set.weight * set.reps, 0),
          0
        );
        return (
          <Card key={s.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{s.dayName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(s.date).toLocaleDateString()}
                    </Badge>
                  </div>
                  {s.routineName && (
                    <p className="text-xs text-muted-foreground mt-1">{s.routineName}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.exercises.length} exercises · {totalSets} sets
                    {volume > 0 ? ` · ${volume.toLocaleString()} lb volume` : ''}
                  </p>
                  {s.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">"{s.notes}"</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteSession(s.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 grid gap-1">
                {s.exercises.map((ex, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex justify-between gap-2">
                    <span className="truncate">{ex.name}</span>
                    <span className="flex-shrink-0">
                      {ex.sets.map((set) => (set.weight > 0 ? `${set.weight}×${set.reps}` : `${set.reps}`)).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
