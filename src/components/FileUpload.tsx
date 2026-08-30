

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, Trash2, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { parseFile, ParsedFileData, convertToWorkoutEntries } from '../lib/parser';
import { useWorkout } from '../context/WorkoutContext';
import { cn } from '../lib/utils';
import { WorkoutDay } from '../types/workout';

interface UploadedFile {
  file: File;
  parsedData: ParsedFileData;
  workoutDay: WorkoutDay;
}

export function FileUpload() {
  const {
    workoutDays,
    addWorkoutDay,
    removeWorkoutDay,
    clearWorkoutDays,
    processMultipleFiles,
    lastUpdated,
    hasStoredData,
    clearStoredData,
  } = useWorkout();

  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    setIsLoading(true);

    const fileArray = Array.from(files);
    const newUploadedFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!validTypes.includes(file.type) && !['csv', 'xlsx', 'xls'].includes(extension || '')) {
        setError(`Invalid file type: ${file.name}. Please upload CSV or Excel files.`);
        continue;
      }

      try {
        const parsedData = await parseFile(file);

        // Convert to workout entries using the suggested mapping
        const entries = convertToWorkoutEntries(
          parsedData.rows,
          parsedData.suggestedMapping
        );

        const workoutDay: WorkoutDay = {
          id: `day-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: parsedData.programName || extractDayName(file.name),
          fileName: file.name,
          entries,
          uploadedAt: new Date(),
        };

        newUploadedFiles.push({
          file,
          parsedData,
          workoutDay,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? `Error parsing ${file.name}: ${err.message}`
            : `Failed to parse ${file.name}`
        );
      }
    }

    if (newUploadedFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...newUploadedFiles]);
    }

    setIsLoading(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [handleFiles]
  );

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const processAllFiles = useCallback(() => {
    if (pendingFiles.length === 0) return;

    const days = pendingFiles.map((f) => f.workoutDay);

    // If we have existing workout days, add to them
    if (workoutDays.length > 0) {
      days.forEach((day) => addWorkoutDay(day));
    } else {
      processMultipleFiles(days);
    }

    setPendingFiles([]);
  }, [pendingFiles, workoutDays, addWorkoutDay, processMultipleFiles]);

  const clearAll = useCallback(() => {
    setPendingFiles([]);
    clearWorkoutDays();
    setError(null);
  }, [clearWorkoutDays]);

  const totalEntries = [
    ...workoutDays.flatMap((d) => d.entries),
    ...pendingFiles.flatMap((f) => f.workoutDay.entries),
  ].length;

  const allDays = [
    ...workoutDays,
    ...pendingFiles.map((f) => f.workoutDay),
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Upload Workout Files</CardTitle>
          {(workoutDays.length > 0 || hasStoredData) && (
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last saved: {lastUpdated.toLocaleDateString()}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearStoredData}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All Data
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            isLoading && 'pointer-events-none opacity-50'
          )}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />

          <div className="flex flex-col items-center gap-2">
            <Upload
              className={cn(
                'h-10 w-10',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <div>
              <p className="font-medium">
                Drop Trainerize exports or click to browse
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload multiple workout days at once
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports CSV, Excel (.xlsx, .xls)
            </p>
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Uploaded files list */}
        {allDays.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Workout Days ({allDays.length})
              </h3>
              <span className="text-xs text-muted-foreground">
                {totalEntries} total exercises
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Already processed workout days */}
              {workoutDays.map((day) => (
                <div
                  key={day.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{day.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {day.entries.length} exercises
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeWorkoutDay(day.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Pending files (not yet processed) */}
              {pendingFiles.map((uploadedFile, index) => (
                <div
                  key={`pending-${index}`}
                  className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {uploadedFile.workoutDay.name}
                        <span className="text-xs text-primary ml-2">(new)</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {uploadedFile.workoutDay.entries.length} exercises
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removePendingFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            {pendingFiles.length > 0 && (
              <div className="flex gap-2 pt-2">
                <Button onClick={processAllFiles} className="flex-1">
                  Process {pendingFiles.length} New File
                  {pendingFiles.length !== 1 ? 's' : ''}
                </Button>
                <Button variant="outline" onClick={() => setPendingFiles([])}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Extract a readable day name from filename
function extractDayName(fileName: string): string {
  const nameWithoutExt = fileName.replace(/\.(csv|xlsx|xls)$/i, '');
  const cleaned = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'Workout Day';
}
