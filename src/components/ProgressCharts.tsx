

import { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useWorkout } from '../context/WorkoutContext';
import {
  getExerciseFrequency,
  getVolumeOverTime,
  getCategoryDistribution,
} from '../lib/analyzer';
import { muscleGroupColors } from '../lib/exercises';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  'Upper Body': '#ef4444',
  'Lower Body': '#22c55e',
  'Core': '#3b82f6',
  'Cardio': '#f59e0b',
};

// Collapsible chart wrapper for mobile
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

export function MuscleRadarChart() {
  const { muscleData } = useWorkout();

  // Normalize data for radar chart
  const maxVolume = Math.max(...muscleData.map((d) => d.volume), 1);
  const radarData = muscleData
    .filter((d) => d.volume > 0)
    .map((d) => ({
      muscle: d.label,
      volume: Math.round((d.volume / maxVolume) * 100),
      fullMark: 100,
    }));

  if (radarData.length === 0) {
    return (
      <CollapsibleChart title="Muscle Group Balance">
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </div>
      </CollapsibleChart>
    );
  }

  return (
    <CollapsibleChart title="Muscle Group Balance">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis
            dataKey="muscle"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
          />
          <Radar
            name="Volume"
            dataKey="volume"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </CollapsibleChart>
  );
}

export function CategoryPieChart() {
  const { muscleData } = useWorkout();
  const categoryData = getCategoryDistribution(muscleData);

  if (categoryData.every((d) => d.volume === 0)) {
    return (
      <CollapsibleChart title="Body Focus Distribution">
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </div>
      </CollapsibleChart>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (props: any) => {
    const { name, value } = props;
    return value > 0 ? `${name}: ${value}%` : '';
  };

  return (
    <CollapsibleChart title="Body Focus Distribution">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={categoryData}
            dataKey="percentage"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={renderLabel}
            labelLine={false}
          >
            {categoryData.map((entry) => (
              <Cell
                key={entry.category}
                fill={CATEGORY_COLORS[entry.category] || '#888'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${value}%`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {categoryData.map((item) => (
          <div key={item.category} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: CATEGORY_COLORS[item.category] || '#888',
              }}
            />
            <span>{item.category}</span>
          </div>
        ))}
      </div>
    </CollapsibleChart>
  );
}

export function ExerciseFrequencyChart() {
  const { workouts } = useWorkout();
  const frequencyData = getExerciseFrequency(workouts);

  if (frequencyData.length === 0) {
    return (
      <CollapsibleChart title="Top Exercises" defaultOpen={false}>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </div>
      </CollapsibleChart>
    );
  }

  return (
    <CollapsibleChart title="Top Exercises" defaultOpen={false}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={frequencyData.slice(0, 8)}
          layout="vertical"
          margin={{ left: 0, right: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis
            dataKey="exercise"
            type="category"
            width={120}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) =>
              value.length > 15 ? value.substring(0, 15) + '...' : value
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Bar
            dataKey="count"
            fill="hsl(var(--primary))"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </CollapsibleChart>
  );
}

export function VolumeOverTimeChart() {
  const { workouts } = useWorkout();
  const volumeData = getVolumeOverTime(workouts);

  if (volumeData.length === 0) {
    return (
      <CollapsibleChart title="Volume Over Time" defaultOpen={false}>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </div>
      </CollapsibleChart>
    );
  }

  // Format dates for display
  const formattedData = volumeData.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <CollapsibleChart title="Volume Over Time" defaultOpen={false}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData} margin={{ left: 0, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value) => [
              Number(value).toLocaleString() + ' lbs',
              'Volume',
            ]}
          />
          <Line
            type="monotone"
            dataKey="volume"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </CollapsibleChart>
  );
}

export function MuscleGroupBarChart() {
  const { muscleData } = useWorkout();

  const chartData = muscleData
    .filter((d) => d.count > 0)
    .map((d) => ({
      muscle: d.label,
      count: d.count,
      volume: d.volume,
      color: muscleGroupColors[d.muscleGroup],
    }))
    .sort((a, b) => b.volume - a.volume);

  if (chartData.length === 0) {
    return (
      <CollapsibleChart title="Muscle Group Volume" defaultOpen={false}>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </div>
      </CollapsibleChart>
    );
  }

  return (
    <CollapsibleChart title="Muscle Group Volume" defaultOpen={false}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ left: 0, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="muscle"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value) => [
              Number(value).toLocaleString() + ' lbs',
              'Volume',
            ]}
          />
          <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </CollapsibleChart>
  );
}
