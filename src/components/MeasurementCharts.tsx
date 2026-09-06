

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useWorkout } from '../context/WorkoutContext';
import { ChevronDown, ChevronUp, Target } from 'lucide-react';
import { cn } from '../lib/utils';

const CHART_COLORS = {
  weight: '#ef4444',
  waist: '#22c55e',
  hips: '#3b82f6',
  thigh: '#f59e0b',
  bust: '#8b5cf6',
};

interface CollapsibleChartProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleChart({ title, children, defaultOpen = true }: CollapsibleChartProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-8 w-8 p-0"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          'transition-all duration-200 overflow-hidden',
          isOpen ? 'opacity-100' : 'max-h-0 py-0 opacity-0 md:max-h-none md:py-6 md:opacity-100'
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}

export function WeightChart() {
  const { measurements, measurementSettings } = useWorkout();
  const isImperial = measurementSettings.unit === 'imperial';
  const unit = isImperial ? 'lbs' : 'kg';

  const chartData = measurements
    .filter((m) => m.weight !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      weight: m.weight,
    }));

  if (chartData.length === 0) {
    return (
      <CollapsibleChart title="Weight Over Time">
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No weight data available
        </div>
      </CollapsibleChart>
    );
  }

  return (
    <CollapsibleChart title="Weight Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ left: 0, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => [`${value} ${unit}`, 'Weight']}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke={CHART_COLORS.weight}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </CollapsibleChart>
  );
}

export function BodyMeasurementsChart() {
  const { measurements, measurementSettings } = useWorkout();
  const isImperial = measurementSettings.unit === 'imperial';
  const unit = isImperial ? 'in' : 'cm';

  const chartData = measurements
    .filter((m) => m.waist || m.hips || m.thighLeft || m.thighRight || m.bust)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      date: new Date(m.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      waist: m.waist,
      hips: m.hips,
      thigh: m.thighLeft && m.thighRight
        ? (m.thighLeft + m.thighRight) / 2
        : m.thighLeft || m.thighRight,
      bust: m.bust,
    }));

  if (chartData.length === 0) {
    return (
      <CollapsibleChart title="Body Measurements" defaultOpen={false}>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No measurement data available
        </div>
      </CollapsibleChart>
    );
  }

  return (
    <CollapsibleChart title="Body Measurements" defaultOpen={false}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ left: 0, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value, name) => [`${value} ${unit}`, name]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="waist"
            name="Waist"
            stroke={CHART_COLORS.waist}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="hips"
            name="Hips"
            stroke={CHART_COLORS.hips}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="thigh"
            name="Thigh (avg)"
            stroke={CHART_COLORS.thigh}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="bust"
            name="Bust"
            stroke={CHART_COLORS.bust}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.waist }} />
          <span>Waist</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.hips }} />
          <span>Hips</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.thigh }} />
          <span>Thigh</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.bust }} />
          <span>Bust</span>
        </div>
      </div>
    </CollapsibleChart>
  );
}

export function GoalProgressChart() {
  const { measurements, measurementGoals, measurementSettings, setMeasurementGoals } = useWorkout();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [tempGoals, setTempGoals] = useState(measurementGoals || {});

  const isImperial = measurementSettings.unit === 'imperial';
  const weightUnit = isImperial ? 'lbs' : 'kg';
  const lengthUnit = isImperial ? 'in' : 'cm';

  const latestMeasurement = measurements[0];

  const handleSaveGoals = () => {
    setMeasurementGoals(tempGoals);
    setShowGoalForm(false);
  };

  if (!measurementGoals || Object.keys(measurementGoals).every(k => measurementGoals[k as keyof typeof measurementGoals] === undefined)) {
    return (
      <CollapsibleChart title="Goal Progress" defaultOpen={false}>
        <div className="space-y-4">
          {!showGoalForm ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Target className="h-12 w-12 mb-4 opacity-50" />
              <p>No goals set yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowGoalForm(true)}
              >
                Set Goals
              </Button>
            </div>
          ) : (
            <GoalForm
              goals={tempGoals}
              setGoals={setTempGoals}
              onSave={handleSaveGoals}
              onCancel={() => setShowGoalForm(false)}
              weightUnit={weightUnit}
              lengthUnit={lengthUnit}
            />
          )}
        </div>
      </CollapsibleChart>
    );
  }

  const progressData = [];

  if (measurementGoals.weight && latestMeasurement?.weight) {
    progressData.push({
      name: 'Weight',
      current: latestMeasurement.weight,
      goal: measurementGoals.weight,
      unit: weightUnit,
      color: CHART_COLORS.weight,
    });
  }

  if (measurementGoals.waist && latestMeasurement?.waist) {
    progressData.push({
      name: 'Waist',
      current: latestMeasurement.waist,
      goal: measurementGoals.waist,
      unit: lengthUnit,
      color: CHART_COLORS.waist,
    });
  }

  if (measurementGoals.hips && latestMeasurement?.hips) {
    progressData.push({
      name: 'Hips',
      current: latestMeasurement.hips,
      goal: measurementGoals.hips,
      unit: lengthUnit,
      color: CHART_COLORS.hips,
    });
  }

  if (measurementGoals.thigh && (latestMeasurement?.thighLeft || latestMeasurement?.thighRight)) {
    const currentThigh = latestMeasurement.thighLeft && latestMeasurement.thighRight
      ? (latestMeasurement.thighLeft + latestMeasurement.thighRight) / 2
      : latestMeasurement.thighLeft || latestMeasurement.thighRight;
    progressData.push({
      name: 'Thigh',
      current: currentThigh,
      goal: measurementGoals.thigh,
      unit: lengthUnit,
      color: CHART_COLORS.thigh,
    });
  }

  if (measurementGoals.bust && latestMeasurement?.bust) {
    progressData.push({
      name: 'Bust',
      current: latestMeasurement.bust,
      goal: measurementGoals.bust,
      unit: lengthUnit,
      color: CHART_COLORS.bust,
    });
  }

  if (progressData.length === 0) {
    return (
      <CollapsibleChart title="Goal Progress" defaultOpen={false}>
        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
          <p>Log measurements to see progress towards your goals</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setShowGoalForm(true)}
          >
            Edit Goals
          </Button>
        </div>
      </CollapsibleChart>
    );
  }

  return (
    <CollapsibleChart title="Goal Progress" defaultOpen={false}>
      {showGoalForm ? (
        <GoalForm
          goals={tempGoals}
          setGoals={setTempGoals}
          onSave={handleSaveGoals}
          onCancel={() => setShowGoalForm(false)}
          weightUnit={weightUnit}
          lengthUnit={lengthUnit}
        />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={progressData} layout="vertical" margin={{ left: 60, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                formatter={(value, name, props) => [
                  `${value} ${props.payload.unit}`,
                  name === 'current' ? 'Current' : 'Goal',
                ]}
              />
              <Legend />
              <Bar dataKey="current" name="Current" radius={[0, 4, 4, 0]}>
                {progressData.map((entry, index) => (
                  <Cell key={`cell-current-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="goal" name="Goal" fill="var(--muted-foreground)" opacity={0.5} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTempGoals(measurementGoals);
                setShowGoalForm(true);
              }}
            >
              Edit Goals
            </Button>
          </div>
        </>
      )}
    </CollapsibleChart>
  );
}

interface GoalFormProps {
  goals: Partial<{
    weight?: number;
    waist?: number;
    hips?: number;
    thigh?: number;
    bust?: number;
  }>;
  setGoals: (goals: Partial<{
    weight?: number;
    waist?: number;
    hips?: number;
    thigh?: number;
    bust?: number;
  }>) => void;
  onSave: () => void;
  onCancel: () => void;
  weightUnit: string;
  lengthUnit: string;
}

function GoalForm({ goals, setGoals, onSave, onCancel, weightUnit, lengthUnit }: GoalFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="goal-weight">Weight Goal ({weightUnit})</Label>
          <Input
            id="goal-weight"
            type="number"
            step="0.1"
            value={goals.weight || ''}
            onChange={(e) => setGoals({ ...goals, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
        <div>
          <Label htmlFor="goal-waist">Waist Goal ({lengthUnit})</Label>
          <Input
            id="goal-waist"
            type="number"
            step="0.1"
            value={goals.waist || ''}
            onChange={(e) => setGoals({ ...goals, waist: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
        <div>
          <Label htmlFor="goal-hips">Hips Goal ({lengthUnit})</Label>
          <Input
            id="goal-hips"
            type="number"
            step="0.1"
            value={goals.hips || ''}
            onChange={(e) => setGoals({ ...goals, hips: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
        <div>
          <Label htmlFor="goal-bust">Bust Goal ({lengthUnit})</Label>
          <Input
            id="goal-bust"
            type="number"
            step="0.1"
            value={goals.bust || ''}
            onChange={(e) => setGoals({ ...goals, bust: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
        <div>
          <Label htmlFor="goal-thigh">Thigh Goal ({lengthUnit})</Label>
          <Input
            id="goal-thigh"
            type="number"
            step="0.1"
            value={goals.thigh || ''}
            onChange={(e) => setGoals({ ...goals, thigh: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} className="flex-1">
          Save Goals
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function MeasurementCharts() {
  return (
    <div className="space-y-6">
      <WeightChart />
      <BodyMeasurementsChart />
      <GoalProgressChart />
    </div>
  );
}
