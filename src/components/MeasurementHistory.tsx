

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useWorkout } from '../context/WorkoutContext';
import { BodyMeasurement } from '../types/workout';
import { MeasurementForm } from './MeasurementForm';
import { Pencil, Trash2, History } from 'lucide-react';

export function MeasurementHistory() {
  const { measurements, deleteMeasurement, measurementSettings } = useWorkout();
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isImperial = measurementSettings.unit === 'imperial';
  const weightUnit = isImperial ? 'lbs' : 'kg';
  const lengthUnit = isImperial ? 'in' : 'cm';

  const formatValue = (value: number | undefined, unit: string) => {
    if (value === undefined) return '-';
    return `${value} ${unit}`;
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteMeasurement(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  if (measurements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Measurement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <History className="h-12 w-12 mb-4 opacity-50" />
            <p>No measurements recorded yet</p>
            <p className="text-sm mt-2">Add your first measurement in the Log tab</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (editingMeasurement) {
    return (
      <MeasurementForm
        editingMeasurement={editingMeasurement}
        onCancel={() => setEditingMeasurement(null)}
        onSave={() => setEditingMeasurement(null)}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Measurement History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Waist</TableHead>
                  <TableHead className="text-right">Hips</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Thigh L</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Thigh R</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Bust</TableHead>
                  <TableHead className="hidden lg:table-cell">Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurements.map((measurement) => (
                  <TableRow key={measurement.id}>
                    <TableCell className="font-medium">
                      {new Date(measurement.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatValue(measurement.weight, weightUnit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatValue(measurement.waist, lengthUnit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatValue(measurement.hips, lengthUnit)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatValue(measurement.thighLeft, lengthUnit)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatValue(measurement.thighRight, lengthUnit)}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {formatValue(measurement.bust, lengthUnit)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[150px] truncate">
                      {measurement.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingMeasurement(measurement)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirmId(measurement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile-friendly card view for small screens */}
          <div className="sm:hidden mt-4 space-y-4">
            {measurements.map((measurement) => (
              <Card key={measurement.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">
                    {new Date(measurement.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setEditingMeasurement(measurement)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => setDeleteConfirmId(measurement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Weight:</span>{' '}
                    {formatValue(measurement.weight, weightUnit)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Waist:</span>{' '}
                    {formatValue(measurement.waist, lengthUnit)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hips:</span>{' '}
                    {formatValue(measurement.hips, lengthUnit)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bust:</span>{' '}
                    {formatValue(measurement.bust, lengthUnit)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Thigh L:</span>{' '}
                    {formatValue(measurement.thighLeft, lengthUnit)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Thigh R:</span>{' '}
                    {formatValue(measurement.thighRight, lengthUnit)}
                  </div>
                </div>
                {measurement.notes && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {measurement.notes}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Measurement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this measurement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
