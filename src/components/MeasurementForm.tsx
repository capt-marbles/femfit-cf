

import { useState } from 'react';
import { todayISO, fromDateInput } from '../lib/dates';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useWorkout } from '../context/WorkoutContext';
import { BodyMeasurement } from '../types/workout';
import { Plus } from 'lucide-react';

interface MeasurementFormProps {
  editingMeasurement?: BodyMeasurement | null;
  onCancel?: () => void;
  onSave?: () => void;
}

export function MeasurementForm({ editingMeasurement, onCancel, onSave }: MeasurementFormProps) {
  const { addMeasurement, updateMeasurement, measurementSettings, setMeasurementSettings } = useWorkout();

  const [date, setDate] = useState(
    editingMeasurement
      ? todayISO(new Date(editingMeasurement.date))
      : todayISO()
  );
  const [weight, setWeight] = useState(editingMeasurement?.weight?.toString() || '');
  const [waist, setWaist] = useState(editingMeasurement?.waist?.toString() || '');
  const [hips, setHips] = useState(editingMeasurement?.hips?.toString() || '');
  const [thighLeft, setThighLeft] = useState(editingMeasurement?.thighLeft?.toString() || '');
  const [thighRight, setThighRight] = useState(editingMeasurement?.thighRight?.toString() || '');
  const [bust, setBust] = useState(editingMeasurement?.bust?.toString() || '');
  const [notes, setNotes] = useState(editingMeasurement?.notes || '');

  const isImperial = measurementSettings.unit === 'imperial';
  const weightUnit = isImperial ? 'lbs' : 'kg';
  const lengthUnit = isImperial ? 'in' : 'cm';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const measurement: BodyMeasurement = {
      id: editingMeasurement?.id || `measurement-${Date.now()}`,
      date: fromDateInput(date),
      weight: weight ? parseFloat(weight) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      hips: hips ? parseFloat(hips) : undefined,
      thighLeft: thighLeft ? parseFloat(thighLeft) : undefined,
      thighRight: thighRight ? parseFloat(thighRight) : undefined,
      bust: bust ? parseFloat(bust) : undefined,
      notes: notes || undefined,
    };

    if (editingMeasurement) {
      updateMeasurement(editingMeasurement.id, measurement);
    } else {
      addMeasurement(measurement);
    }

    // Reset form if not editing
    if (!editingMeasurement) {
      setWeight('');
      setWaist('');
      setHips('');
      setThighLeft('');
      setThighRight('');
      setBust('');
      setNotes('');
      setDate(todayISO());
    }

    onSave?.();
  };

  const toggleUnit = () => {
    setMeasurementSettings({
      unit: isImperial ? 'metric' : 'imperial',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {editingMeasurement ? 'Edit Measurement' : 'Log New Measurement'}
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleUnit}
          >
            {isImperial ? 'Imperial' : 'Metric'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Weight ({weightUnit})</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder={`e.g., ${isImperial ? '150' : '68'}`}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="waist">Waist ({lengthUnit})</Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                placeholder={`e.g., ${isImperial ? '30' : '76'}`}
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="hips">Hips ({lengthUnit})</Label>
              <Input
                id="hips"
                type="number"
                step="0.1"
                placeholder={`e.g., ${isImperial ? '38' : '96'}`}
                value={hips}
                onChange={(e) => setHips(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="bust">Bust ({lengthUnit})</Label>
              <Input
                id="bust"
                type="number"
                step="0.1"
                placeholder={`e.g., ${isImperial ? '36' : '91'}`}
                value={bust}
                onChange={(e) => setBust(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="thighLeft">Left Thigh ({lengthUnit})</Label>
              <Input
                id="thighLeft"
                type="number"
                step="0.1"
                placeholder={`e.g., ${isImperial ? '22' : '56'}`}
                value={thighLeft}
                onChange={(e) => setThighLeft(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="thighRight">Right Thigh ({lengthUnit})</Label>
              <Input
                id="thighRight"
                type="number"
                step="0.1"
                placeholder={`e.g., ${isImperial ? '22' : '56'}`}
                value={thighRight}
                onChange={(e) => setThighRight(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Any notes about this measurement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              {editingMeasurement ? 'Update' : 'Add'} Measurement
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
