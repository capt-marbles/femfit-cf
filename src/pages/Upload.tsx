

import { useNavigate, Link } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { useWorkout } from '../context/WorkoutContext';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function HomePage() {
  const navigate = useNavigate();
  const { workouts, workoutDays, isLoading, hasStoredData, lastUpdated } = useWorkout();

  // Show loading state while hydrating from localStorage
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading saved data...</p>
      </div>
    );
  }

  const hasData = workouts.length > 0;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold">FemFit Analyzer</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload your workout data and get AI-powered analysis tailored for
          feminizing fitness goals. Optimize your routine for the physique you want.
        </p>
      </div>

      {/* Existing Data Banner */}
      {hasData && (
        <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="font-medium">
                  {workoutDays.length > 0
                    ? `${workoutDays.length} workout day${workoutDays.length !== 1 ? 's' : ''} loaded`
                    : 'Workout data loaded'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {workouts.length} exercises
                  {lastUpdated && ` - Last saved ${lastUpdated.toLocaleDateString()}`}
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard')} className="gap-2 min-h-[44px]">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <div className="max-w-2xl mx-auto space-y-6">
        <FileUpload />
      </div>

      {/* Info Section - only show if no data */}
      {!hasData && (
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <InfoCard
              title="Upload Data"
              description="Import your Trainerize exports or custom workout files"
            />
            <InfoCard
              title="Get Analysis"
              description="AI analyzes your routine for feminization goals"
            />
            <InfoCard
              title="Generate Routines"
              description="Create new feminization-focused workout programs"
            />
          </div>
        </div>
      )}

      {/* Quick actions when data exists */}
      {hasData && (
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate('/generate')}
            >
              <CardContent className="py-4 text-center">
                <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary" />
                <h3 className="font-medium">Generate New Routine</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create AI-powered workout programs
                </p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate('/dashboard')}
            >
              <CardContent className="py-4 text-center">
                <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary" />
                <h3 className="font-medium">Analyze Current Data</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View charts and AI recommendations
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-lg border bg-card text-center">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
