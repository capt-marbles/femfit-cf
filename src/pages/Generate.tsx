

import { useState } from 'react';
import { Sparkles, History, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RoutineGenerator } from '../components/RoutineGenerator';
import { GeneratedRoutine } from '../components/GeneratedRoutine';
import { RoutineReview } from '../components/RoutineReview';
import { GeneratedRoutine as GeneratedRoutineType, RoutineWarning } from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';

export default function GeneratePage() {
  const { generatedRoutines, saveRoutine, deleteRoutine } = useWorkout();
  const [currentRoutine, setCurrentRoutine] = useState<GeneratedRoutineType | null>(null);
  const [warnings, setWarnings] = useState<RoutineWarning[]>([]);
  const [activeTab, setActiveTab] = useState<string>('generate');

  const handleGenerate = (routine: GeneratedRoutineType, routineWarnings: RoutineWarning[]) => {
    setCurrentRoutine(routine);
    setWarnings(routineWarnings);
    setActiveTab('result');
  };

  const handleSave = (routine: GeneratedRoutineType) => {
    saveRoutine(routine);
    setCurrentRoutine(null);
    setActiveTab('saved');
  };

  const handleDelete = (routineId: string) => {
    deleteRoutine(routineId);
    if (currentRoutine?.id === routineId) {
      setCurrentRoutine(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Routine Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Create personalized feminization-focused workout programs
        </p>
      </div>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 min-h-[44px]">
          <TabsTrigger value="generate" className="min-h-[40px]">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="result" className="min-h-[40px]" disabled={!currentRoutine}>
            Result
          </TabsTrigger>
          <TabsTrigger value="saved" className="min-h-[40px]">
            <History className="h-4 w-4 mr-2" />
            Saved ({generatedRoutines.length})
          </TabsTrigger>
        </TabsList>

        {/* Generate tab */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <RoutineGenerator onGenerate={handleGenerate} />

            {/* How it works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Configure Your Program</p>
                      <p>Select how many days per week, your available equipment, and experience level.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">AI Generates Your Routine</p>
                      <p>Our AI creates a complete program optimized for feminization goals with lower body emphasis.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Review & Save</p>
                      <p>Review the exercises, save your favorite routines, and share them as text.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-foreground mb-2">Feminization Principles</h4>
                  <ul className="space-y-1">
                    <li>- Hip abduction is the priority: 6-9 sets/week drives hip width</li>
                    <li>- Glutes and hamstrings loaded heavy (6-10 reps), not high-rep</li>
                    <li>- Rows and face pulls kept in — posture shapes the torso</li>
                    <li>- No loaded oblique work; thicker obliques widen the waist</li>
                    <li>- Size is controlled by set volume, not by lifting lighter</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Result tab */}
        <TabsContent value="result">
          {currentRoutine ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Generated routine - Save it to keep it, or generate a new one.
                </p>
                <Button variant="outline" onClick={() => setActiveTab('generate')}>
                  Generate New
                </Button>
              </div>
              {warnings.length > 0 && (
                <Card className="border-amber-500/50 bg-amber-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Fix before you start ({warnings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {warnings.map((w, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span
                          className={
                            w.severity === 'high'
                              ? 'flex-shrink-0 font-semibold text-destructive'
                              : 'flex-shrink-0 font-semibold text-amber-600'
                          }
                        >
                          {w.severity === 'high' ? 'HIGH' : 'MED'}
                        </span>
                        <span className="text-muted-foreground">
                          {w.day && (
                            <span className="text-foreground font-medium">{w.day}: </span>
                          )}
                          {w.message}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <GeneratedRoutine
                routine={currentRoutine}
                onSave={handleSave}
                isSaved={false}
              />
              <RoutineReview routine={currentRoutine} />
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No routine generated yet.</p>
                <Button
                  variant="link"
                  onClick={() => setActiveTab('generate')}
                  className="mt-2"
                >
                  Generate a routine
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Saved tab */}
        <TabsContent value="saved" className="space-y-4">
          {generatedRoutines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved routines yet.</p>
                <p className="text-sm mt-1">
                  Generate a routine and save it to see it here.
                </p>
                <Button
                  variant="link"
                  onClick={() => setActiveTab('generate')}
                  className="mt-2"
                >
                  Generate your first routine
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {generatedRoutines.length} saved routine
                  {generatedRoutines.length !== 1 ? 's' : ''} (max 10)
                </p>
              </div>
              {generatedRoutines.map((routine) => (
                <GeneratedRoutine
                  key={routine.id}
                  routine={routine}
                  onDelete={handleDelete}
                  isSaved={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
