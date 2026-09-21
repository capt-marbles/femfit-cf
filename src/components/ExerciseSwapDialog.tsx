import { Repeat, Info, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { getSubstitutes, Equipment, SubstituteChoice } from '../lib/substitutions';

const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  band: 'Band',
  bodyweight: 'Bodyweight',
};

interface ExerciseSwapDialogProps {
  exerciseName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (choice: SubstituteChoice) => void;
}

export function ExerciseSwapDialog({
  exerciseName,
  open,
  onOpenChange,
  onSelect,
}: ExerciseSwapDialogProps) {
  const result = exerciseName ? getSubstitutes(exerciseName) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Repeat className="h-4 w-4 text-primary" />
            Swap {exerciseName}
          </DialogTitle>
          {result && (
            <DialogDescription className="text-left">
              Alternatives for{' '}
              <span className="font-medium text-foreground">{result.group.label}</span>.
            </DialogDescription>
          )}
        </DialogHeader>

        {!result ? (
          <p className="text-sm text-muted-foreground py-4">
            No substitutes known for this movement. It doesn't map to one of the
            program's tracked patterns, so swapping it could change your weekly volume
            in ways the dashboard won't reflect.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2 rounded-md bg-muted/50 border border-border p-3">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{result.group.why}</p>
            </div>

            {result.choices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No other options in this group.
              </p>
            ) : (
              <div className="space-y-2">
                {result.choices.map((choice) => (
                  <button
                    key={choice.name}
                    onClick={() => {
                      onSelect(choice);
                      onOpenChange(false);
                    }}
                    className="w-full text-left rounded-md border border-border hover:border-primary hover:bg-muted/40 transition-colors p-3 min-h-[52px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{choice.name}</span>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {EQUIPMENT_LABEL[choice.equipment]}
                      </Badge>
                    </div>
                    {choice.note && (
                      <p className="text-xs text-muted-foreground mt-1">{choice.note}</p>
                    )}
                    {choice.widensShoulders && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        Widens the shoulder line — keep the volume low.
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
