

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { useWorkout } from '../context/WorkoutContext';
import { ColumnMapping } from '../types/workout';
import { ArrowRight, Check } from 'lucide-react';

const REQUIRED_COLUMNS = ['date', 'exercise'] as const;
const OPTIONAL_COLUMNS = ['sets', 'reps', 'weight', 'notes'] as const;
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as const;

const COLUMN_LABELS: Record<string, string> = {
  date: 'Date',
  exercise: 'Exercise Name',
  sets: 'Sets',
  reps: 'Reps',
  weight: 'Weight',
  notes: 'Notes',
};

export function ColumnMapper() {
  const navigate = useNavigate();
  const { parsedData, processData } = useWorkout();
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: null,
    exercise: null,
    sets: null,
    reps: null,
    weight: null,
    notes: null,
  });

  // Initialize mapping from auto-detected values
  useEffect(() => {
    if (parsedData?.suggestedMapping) {
      setMapping(parsedData.suggestedMapping);
    }
  }, [parsedData]);

  if (!parsedData) {
    return null;
  }

  const { headers, rows } = parsedData;
  const previewRows = rows.slice(0, 5);

  const handleColumnChange = (column: keyof ColumnMapping, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [column]: value === 'none' ? null : value,
    }));
  };

  const isValid =
    mapping.date !== null && mapping.exercise !== null;

  const handleSubmit = () => {
    if (isValid) {
      processData(mapping);
      navigate('/dashboard');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Map Your Columns</CardTitle>
        <CardDescription>
          Tell us which columns contain your workout data. Required columns are marked with *.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Column Mapping Selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_COLUMNS.map((column) => {
            const isRequired = REQUIRED_COLUMNS.includes(column as typeof REQUIRED_COLUMNS[number]);
            return (
              <div key={column} className="space-y-2">
                <Label htmlFor={column}>
                  {COLUMN_LABELS[column]}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Select
                  value={mapping[column] || 'none'}
                  onValueChange={(value) => handleColumnChange(column, value)}
                >
                  <SelectTrigger id={column}>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Not mapped --</SelectItem>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        {/* Data Preview */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Data Preview</h4>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.slice(0, 6).map((header) => (
                    <TableHead key={header} className="whitespace-nowrap">
                      {header}
                      {Object.entries(mapping).some(
                        ([, v]) => v === header
                      ) && (
                        <Check className="inline-block ml-1 h-3 w-3 text-green-500" />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index}>
                    {headers.slice(0, 6).map((header) => (
                      <TableCell key={header} className="whitespace-nowrap">
                        {String(row[header] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing first {previewRows.length} of {rows.length} rows
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="gap-2"
          >
            Continue to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
