

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { StatCards } from '../components/StatCards';
import {
  MuscleRadarChart,
  CategoryPieChart,
  ExerciseFrequencyChart,
  VolumeOverTimeChart,
  MuscleGroupBarChart,
} from '../components/ProgressCharts';
import { WorkoutTable } from '../components/WorkoutTable';
import { AIFeedback } from '../components/AIFeedback';
import { SubstituteModal } from '../components/SubstituteModal';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { WorkoutEntry } from '../types/workout';
import { Upload, BarChart3, Brain, Dumbbell, Loader2 } from 'lucide-react';


export default function DashboardPage() {
  const navigate = useNavigate();
  const { workouts, workoutDays, clearData, isLoading } = useWorkout();
  const [selectedExercise, setSelectedExercise] = useState<WorkoutEntry | null>(
    null
  );
  const [substituteModalOpen, setSubstituteModalOpen] = useState(false);

  // Show loading state while hydrating from localStorage
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading workout data...</p>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">No workout data loaded</p>
        <Link to="/">
          <Button className="gap-2 min-h-[44px]">
            <Upload className="h-4 w-4" />
            Upload Data
          </Button>
        </Link>
      </div>
    );
  }

  const handleExerciseClick = (exercise: WorkoutEntry) => {
    setSelectedExercise(exercise);
    setSubstituteModalOpen(true);
  };

  const handleNewUpload = () => {
    clearData();
    navigate('/');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workout Analysis</h1>
          <p className="text-muted-foreground">
            {workoutDays.length > 0
              ? `${workoutDays.length} workout day${workoutDays.length !== 1 ? 's' : ''} - `
              : ''}
            {workouts.length} exercises analyzed
          </p>
        </div>
        <Button variant="outline" onClick={handleNewUpload} className="gap-2 min-h-[44px]">
          <Upload className="h-4 w-4" />
          New Upload
        </Button>
      </div>

      {/* Summary Stats */}
      <StatCards />

      {/* Tabs for different views */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] min-h-[44px]">
          <TabsTrigger value="charts" className="gap-2 min-h-[40px]">
            <BarChart3 className="h-4 w-4 hidden sm:block" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 min-h-[40px]">
            <Brain className="h-4 w-4 hidden sm:block" />
            AI Analysis
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2 min-h-[40px]">
            <Dumbbell className="h-4 w-4 hidden sm:block" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MuscleRadarChart />
            <CategoryPieChart />
            <ExerciseFrequencyChart />
            <VolumeOverTimeChart />
          </div>
          <MuscleGroupBarChart />
        </TabsContent>

        <TabsContent value="ai">
          <AIFeedback />
        </TabsContent>

        <TabsContent value="data">
          <WorkoutTable onExerciseClick={handleExerciseClick} />
        </TabsContent>
      </Tabs>

      {/* Substitute Modal */}
      <SubstituteModal
        exercise={selectedExercise}
        open={substituteModalOpen}
        onOpenChange={setSubstituteModalOpen}
      />
    </div>
  );
}
