

import { useState } from 'react';
import { Sparkles, History, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RoutineGenerator } from '../components/RoutineGenerator';
import { GeneratedRoutine } from '../components/GeneratedRoutine';
import { RoutineReview } from '../components/RoutineReview';
import { GeneratedRoutine as GeneratedRoutineType } from '../types/workout';
import { useWorkout } from '../context/WorkoutContext';

export default function GeneratePage() {
  const { generatedRoutines, saveRoutine, deleteRoutine } = useWorkout();
  const [currentRoutine, setCurrentRoutine] = useState<GeneratedRoutineType | null>(null);
  const [activeTab, setActiveTab] = useState<string>('generate');

  const handleGenerate = (routine: GeneratedRoutineType) => {
    setCurrentRoutine(routine);
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
                    <li>- 60-70% lower body focus (glutes, legs)</li>
                    <li>- Higher reps (15-20) for upper body to avoid bulk</li>
                    <li>- Exercises that build curves and improve posture</li>
                    <li>- Core work for waist definition</li>
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
