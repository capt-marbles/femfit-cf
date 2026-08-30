import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ColumnMapping, ParsedData, WorkoutEntry, WorkoutDay } from '../types/workout';
import { getMuscleGroup } from './exercises';

// Extended ParsedData with program name for Trainerize files
export interface ParsedFileData extends ParsedData {
  programName?: string;  // e.g., "Workout 4: Push/Pull 2"
}

// Common column name patterns for auto-detection
const columnPatterns = {
  date: ['date', 'workout date', 'day', 'timestamp', 'when'],
  exercise: ['exercise', 'name', 'movement', 'lift', 'workout', 'exercise name'],
  sets: ['sets', 'set', 'set count', 'num sets'],
  reps: ['reps', 'rep', 'repetitions', 'rep count', 'num reps'],
  weight: ['weight', 'load', 'lbs', 'kg', 'pounds', 'kilograms', 'resistance'],
  notes: ['notes', 'note', 'comments', 'comment', 'memo'],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[_-]/g, ' ');
}

function detectColumn(
  headers: string[],
  patterns: string[]
): string | null {
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    for (const pattern of patterns) {
      if (normalized === pattern || normalized.includes(pattern)) {
        return header;
      }
    }
  }
  return null;
}

export function autoDetectColumns(headers: string[]): ColumnMapping {
  return {
    date: detectColumn(headers, columnPatterns.date),
    exercise: detectColumn(headers, columnPatterns.exercise),
    sets: detectColumn(headers, columnPatterns.sets),
    reps: detectColumn(headers, columnPatterns.reps),
    weight: detectColumn(headers, columnPatterns.weight),
    notes: detectColumn(headers, columnPatterns.notes),
  };
}

// Detect if file is Trainerize format
function isTrainerizeFormat(rawRows: string[][]): boolean {
  if (rawRows.length < 6) return false;

  // Check for typical Trainerize markers:
  // - Row 4 starts with "RPE"
  // - Row 5 starts with "Comments"
  // - Row 3 has date-like values in columns 3+
  const row4 = rawRows[3];
  const row5 = rawRows[4];

  if (row4 && row4[0]?.toString().toUpperCase().includes('RPE')) return true;
  if (row5 && row5[0]?.toString().toLowerCase().includes('comment')) return true;

  // Check if row 3 has date patterns (e.g., "22 Nov 2025")
  const row3 = rawRows[2];
  if (row3) {
    const datePattern = /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i;
    for (let i = 2; i < row3.length; i++) {
      if (row3[i] && datePattern.test(row3[i].toString())) {
        return true;
      }
    }
  }

  return false;
}

// Parse Trainerize date format "22 Nov 2025"
function parseTrainerizeDate(dateStr: string): Date {
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try manual parsing for "DD Mon YYYY" format
  const match = dateStr.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
  if (match) {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const day = parseInt(match[1]);
    const month = months[match[2].toLowerCase()];
    const year = parseInt(match[3]);
    return new Date(year, month, day);
  }

  return new Date();
}

// Parse Trainerize rep/weight format: "12 X 20 lbs" or "15" or "17 X - lbs"
function parseTrainerizeSet(value: string): { reps: number; weight: number } {
  if (!value || value.trim() === '') {
    return { reps: 0, weight: 0 };
  }

  const trimmed = value.trim();

  // Format: "12 X 20 lbs" or "12 X 20"
  const fullMatch = trimmed.match(/^(\d+)\s*[Xx]\s*(\d+)\s*(lbs|kg)?/i);
  if (fullMatch) {
    return {
      reps: parseInt(fullMatch[1]),
      weight: parseInt(fullMatch[2]),
    };
  }

  // Format: "17 X - lbs" (bodyweight/no weight)
  const noWeightMatch = trimmed.match(/^(\d+)\s*[Xx]\s*-/i);
  if (noWeightMatch) {
    return {
      reps: parseInt(noWeightMatch[1]),
      weight: 0,
    };
  }

  // Format: just "15" (reps only, bodyweight)
  const repsOnlyMatch = trimmed.match(/^(\d+)$/);
  if (repsOnlyMatch) {
    return {
      reps: parseInt(repsOnlyMatch[1]),
      weight: 0,
    };
  }

  return { reps: 0, weight: 0 };
}

// Extract program name from Trainerize format (Row 1, Column 0)
function extractTrainerizeProgramName(rawRows: string[][]): string | undefined {
  if (rawRows.length > 0 && rawRows[0] && rawRows[0][0]) {
    const name = rawRows[0][0].toString().trim();
    // Only return if it looks like a program name (not empty or a generic header)
    if (name && name.length > 0 && !name.toLowerCase().includes('exercise')) {
      return name;
    }
  }
  return undefined;
}

// Transform Trainerize pivoted format to standard rows
function transformTrainerizeData(rawRows: string[][]): {
  headers: string[];
  rows: Record<string, unknown>[];
  programName?: string;
} {
  // Extract program name from row 1
  const programName = extractTrainerizeProgramName(rawRows);

  // Row 3 (index 2) contains the dates
  const dateRow = rawRows[2] || [];
  const dates: string[] = [];

  // Extract dates from columns 3+ (index 2+)
  for (let i = 2; i < dateRow.length; i++) {
    const dateStr = dateRow[i]?.toString().trim();
    if (dateStr && dateStr !== 'false') {
      dates.push(dateStr);
    }
  }

  // Find exercise rows (starting from row 6, index 5)
  const standardRows: Record<string, unknown>[] = [];
  let currentExercise = '';

  for (let rowIdx = 5; rowIdx < rawRows.length; rowIdx++) {
    const row = rawRows[rowIdx];
    if (!row || row.length < 3) continue;

    // Column 0: Exercise name (only on first set, empty for subsequent sets)
    // Column 1: Set number (SET 1, SET 2, etc.)
    // Columns 2+: Data for each date

    const exerciseCell = row[0]?.toString().trim();
    const setCell = row[1]?.toString().trim();

    // Update current exercise if provided
    if (exerciseCell && exerciseCell !== '') {
      currentExercise = exerciseCell;
    }

    // Skip if no exercise name yet or not a SET row
    if (!currentExercise || !setCell?.toUpperCase().startsWith('SET')) {
      continue;
    }

    // Extract set number
    const setMatch = setCell.match(/SET\s*(\d+)/i);
    const setNumber = setMatch ? parseInt(setMatch[1]) : 1;

    // Process each date column
    for (let dateIdx = 0; dateIdx < dates.length; dateIdx++) {
      const colIdx = dateIdx + 2; // Data starts at column index 2
      const cellValue = row[colIdx]?.toString() || '';

      if (!cellValue || cellValue === 'false' || cellValue.trim() === '') {
        continue;
      }

      const { reps, weight } = parseTrainerizeSet(cellValue);

      if (reps > 0) {
        standardRows.push({
          Date: dates[dateIdx],
          Exercise: currentExercise,
          Set: setNumber,
          Reps: reps,
          Weight: weight,
        });
      }
    }
  }

  return {
    headers: ['Date', 'Exercise', 'Set', 'Reps', 'Weight'],
    rows: standardRows,
    programName,
  };
}

export function parseCSV(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false, // Parse without headers first to detect format
      skipEmptyLines: false,
      complete: (results) => {
        const rawRows = results.data as string[][];

        // Check if this is Trainerize format
        if (isTrainerizeFormat(rawRows)) {
          const { headers, rows, programName } = transformTrainerizeData(rawRows);
          resolve({
            headers,
            rows,
            suggestedMapping: {
              date: 'Date',
              exercise: 'Exercise',
              sets: 'Set',
              reps: 'Reps',
              weight: 'Weight',
              notes: null,
            },
            programName,
          });
          return;
        }

        // Standard CSV format - re-parse with headers
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (standardResults) => {
            const headers = standardResults.meta.fields || [];
            const rows = standardResults.data as Record<string, unknown>[];
            const suggestedMapping = autoDetectColumns(headers);

            resolve({
              headers,
              rows,
              suggestedMapping,
            });
          },
          error: (error) => {
            reject(new Error(`CSV parsing failed: ${error.message}`));
          },
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

export function parseExcel(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON without headers first
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        if (rawRows.length < 2) {
          reject(new Error('Excel file appears to be empty or has insufficient data'));
          return;
        }

        // Check if this is Trainerize format
        if (isTrainerizeFormat(rawRows)) {
          const { headers, rows, programName } = transformTrainerizeData(rawRows);
          resolve({
            headers,
            rows,
            suggestedMapping: {
              date: 'Date',
              exercise: 'Exercise',
              sets: 'Set',
              reps: 'Reps',
              weight: 'Weight',
              notes: null,
            },
            programName,
          });
          return;
        }

        // Standard format
        const headers = (rawRows[0] as string[]).map(String);
        const rows = rawRows.slice(1).map((row) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            obj[header] = (row as unknown[])[index];
          });
          return obj;
        });

        const suggestedMapping = autoDetectColumns(headers);

        resolve({
          headers,
          rows,
          suggestedMapping,
        });
      } catch (error) {
        reject(new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function parseFile(file: File): Promise<ParsedFileData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  } else {
    return Promise.reject(new Error(`Unsupported file type: ${extension}`));
  }
}

// Parse multiple files and combine into workout days
export async function parseMultipleFiles(
  files: File[],
  mapping: ColumnMapping
): Promise<WorkoutDay[]> {
  const workoutDays: WorkoutDay[] = [];

  for (const file of files) {
    try {
      const parsedData = await parseFile(file);
      const entries = convertToWorkoutEntries(parsedData.rows, {
        ...mapping,
        ...parsedData.suggestedMapping, // Use Trainerize mapping if detected
      });

      const workoutDay: WorkoutDay = {
        id: `day-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: parsedData.programName || extractDayNameFromFileName(file.name),
        fileName: file.name,
        entries,
        uploadedAt: new Date(),
      };

      workoutDays.push(workoutDay);
    } catch (error) {
      console.error(`Failed to parse file ${file.name}:`, error);
      throw new Error(
        `Failed to parse "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return workoutDays;
}

// Extract a readable day name from filename
function extractDayNameFromFileName(fileName: string): string {
  // Remove extension
  const nameWithoutExt = fileName.replace(/\.(csv|xlsx|xls)$/i, '');

  // Common patterns to clean up
  const cleaned = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Workout Day';
}

// Combine multiple workout days into a single array of entries
export function combineWorkoutDays(days: WorkoutDay[]): WorkoutEntry[] {
  return days.flatMap((day) => day.entries);
}

function parseDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Excel serial date
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 86400000);
  }
  if (typeof value === 'string') {
    // Try Trainerize format first
    const trainerizeDate = parseTrainerizeDate(value);
    if (!isNaN(trainerizeDate.getTime()) && trainerizeDate.getFullYear() > 1970) {
      return trainerizeDate;
    }

    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function parseNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (!isNaN(parsed)) return parsed;
  }
  return defaultValue;
}

export function convertToWorkoutEntries(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping
): WorkoutEntry[] {
  if (!mapping.date || !mapping.exercise) {
    throw new Error('Date and exercise columns are required');
  }

  return rows
    .filter((row) => row[mapping.exercise!] && String(row[mapping.exercise!]).trim())
    .map((row, index) => {
      const exerciseName = String(row[mapping.exercise!]).trim();
      const muscleInfo = getMuscleGroup(exerciseName);

      return {
        id: `workout-${index}-${Date.now()}`,
        date: parseDate(row[mapping.date!]),
        exercise: exerciseName,
        sets: mapping.sets ? parseNumber(row[mapping.sets], 1) : 1,
        reps: mapping.reps ? parseNumber(row[mapping.reps], 1) : 1,
        weight: mapping.weight ? parseNumber(row[mapping.weight], 0) : 0,
        muscleGroup: muscleInfo?.muscleGroup,
        notes: mapping.notes ? String(row[mapping.notes] || '') : undefined,
      };
    });
}
