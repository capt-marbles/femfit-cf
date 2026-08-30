

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { GeneratedRoutine, RoutineWarning } from '../types/workout';
import { cn } from '../lib/utils';

const EQUIPMENT_OPTIONS = [
  'Dumbbells',
  'Barbell',
  'Cables',
  'Machines',
  'Resistance Bands',
  'Kettlebells',
  'Bodyweight',
  'Pull-up Bar',
  'Bench',
  'Squat Rack',
];

const FOCUS_AREAS = [
  'Glutes',
  'Legs',
  'Posture',
  'Core Definition',
  'Hip Width',
  'Flexibility',
];

interface RoutineGeneratorProps {
  onGenerate: (routine: GeneratedRoutine, warnings: RoutineWarning[]) => void;
}

export function RoutineGenerator({ onGenerate }: RoutineGeneratorProps) {
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(['Dumbbells', 'Bodyweight']);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(['Glutes', 'Legs']);
  const [limitations, setLimitations] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEquipment = (equipment: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(equipment)
        ? prev.filter((e) => e !== equipment)
        : [...prev, equipment]
    );
  };

  const toggleFocusArea = (area: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daysPerWeek,
          equipment: selectedEquipment,
          experienceLevel,
          focusAreas: selectedFocusAreas,
          limitations: limitations || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate routine');
      }

      const data = await response.json();

      // The AI returns name/description/days/cardio/generalNotes.
      // Merge in the request params + metadata the UI needs to render.
      const routine: GeneratedRoutine = {
        id: crypto.randomUUID(),
        daysPerWeek,
        experienceLevel,
        equipment: selectedEquipment,
        createdAt: new Date(),
        generalNotes: [],
        ...data.routine,
      };

      onGenerate(routine, (data.warnings as RoutineWarning[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate routine');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate Routine
        </CardTitle>
        <CardDescription>
          Create a personalized feminization-focused workout program
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Days per week */}
        <div className="space-y-2">
          <Label htmlFor="days">Workout Days per Week</Label>
          <Select
            value={daysPerWeek.toString()}
            onValueChange={(value) => setDaysPerWeek(parseInt(value))}
          >
            <SelectTrigger id="days" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 days</SelectItem>
              <SelectItem value="4">4 days (Recommended)</SelectItem>
              <SelectItem value="5">5 days</SelectItem>
              <SelectItem value="6">6 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience level */}
        <div className="space-y-2">
          <Label htmlFor="experience">Experience Level</Label>
          <Select
            value={experienceLevel}
            onValueChange={(value) =>
              setExperienceLevel(value as 'beginner' | 'intermediate' | 'advanced')
            }
          >
            <SelectTrigger id="experience" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
              <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
              <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Equipment selection */}
        <div className="space-y-2">
          <Label>Available Equipment</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Select all equipment you have access to
          </p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((equipment) => (
              <Badge
                key={equipment}
                variant={selectedEquipment.includes(equipment) ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-colors min-h-[32px] px-3',
                  selectedEquipment.includes(equipment)
                    ? 'bg-primary hover:bg-primary/90'
                    : 'hover:bg-muted'
                )}
                onClick={() => toggleEquipment(equipment)}
              >
                {equipment}
              </Badge>
            ))}
          </div>
        </div>

        {/* Focus areas */}
        <div className="space-y-2">
          <Label>Focus Areas (Optional)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Emphasize specific goals in your program
          </p>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREAS.map((area) => (
              <Badge
                key={area}
                variant={selectedFocusAreas.includes(area) ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-colors min-h-[32px] px-3',
                  selectedFocusAreas.includes(area)
                    ? 'bg-primary hover:bg-primary/90'
                    : 'hover:bg-muted'
                )}
                onClick={() => toggleFocusArea(area)}
              >
                {area}
              </Badge>
            ))}
          </div>
        </div>

        {/* Limitations */}
        <div className="space-y-2">
          <Label htmlFor="limitations">Physical Limitations (Optional)</Label>
          <Input
            id="limitations"
            placeholder="e.g., knee injury, lower back issues..."
            value={limitations}
            onChange={(e) => setLimitations(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || selectedEquipment.length === 0}
          className="w-full min-h-[48px] text-base"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Generating Routine...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate {daysPerWeek}-Day Program
            </>
          )}
        </Button>

        {isGenerating && (
          <p className="text-xs text-muted-foreground text-center">
            This may take a moment. Creating your personalized routine...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
