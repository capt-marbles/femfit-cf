import { BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { GeneratedRoutine } from '../components/GeneratedRoutine';
import { useWorkout } from '../context/WorkoutContext';
import { getActiveRoutine } from '../lib/dashboard';

export default function Program() {
  const { generatedRoutines, sessions, deleteRoutine } = useWorkout();
  const routine = getActiveRoutine(generatedRoutines, sessions);

  if (!routine) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Program
          </h1>
        </div>
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
      </div>
      <GeneratedRoutine
        routine={routine}
        onDelete={deleteRoutine}
        isSaved={true}
      />
    </div>
  );
}
