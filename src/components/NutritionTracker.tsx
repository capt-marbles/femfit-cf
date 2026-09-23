import { useMemo, useState } from 'react';
import { Check, Flame, Target, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useWorkout } from '../context/WorkoutContext';
import { energyBalance, proteinRead, detectConfound } from '../lib/nutrition';
import { DailyNutrition } from '../types/workout';

function todayISO(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const num = (v: string): number | undefined => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
};

export function NutritionTracker() {
  const {
    nutrition,
    upsertNutrition,
    deleteNutrition,
    measurements,
    sessions,
  } = useWorkout();

  const [date, setDate] = useState(todayISO());
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saved, setSaved] = useState(false);

  const existing = useMemo(
    () => nutrition.find((n) => new Date(n.date).toISOString().slice(0, 10) === date),
    [nutrition, date]
  );

  // Loading a date that already has an entry should show it, not a blank form.
  const loadDate = (d: string) => {
    setDate(d);
    setSaved(false);
    const found = nutrition.find((n) => new Date(n.date).toISOString().slice(0, 10) === d);
    setCalories(found?.calories != null ? String(found.calories) : '');
    setProtein(found?.protein != null ? String(found.protein) : '');
    setCarbs(found?.carbs != null ? String(found.carbs) : '');
    setFat(found?.fat != null ? String(found.fat) : '');
  };

  const handleSave = () => {
    const entry: DailyNutrition = {
      id: existing?.id ?? `nutrition-${Date.now()}`,
      date: new Date(`${date}T12:00:00`),
      calories: num(calories),
      protein: num(protein),
      carbs: num(carbs),
      fat: num(fat),
    };
    if (entry.calories === undefined && entry.protein === undefined) return;
    upsertNutrition(entry);
    setSaved(true);
  };

  const balance = useMemo(() => energyBalance(nutrition, measurements), [nutrition, measurements]);
  const protein14 = useMemo(() => proteinRead(nutrition, measurements), [nutrition, measurements]);
  const confound = useMemo(() => detectConfound(nutrition, sessions), [nutrition, sessions]);

  const recent = useMemo(
    () =>
      [...nutrition]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 14),
    [nutrition]
  );

  return (
    <div className="space-y-4">
      {confound && (
        <div className="flex gap-2 rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">{confound.message}</p>
        </div>
      )}

      {/* Daily entry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4 text-primary" />
            Daily totals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => loadDate(e.target.value)}
              className="min-h-[44px]"
            />
            {existing && (
              <p className="text-xs text-muted-foreground">
                This day already has an entry — saving replaces it.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Calories</Label>
              <Input type="number" inputMode="numeric" placeholder="2180" value={calories}
                onChange={(e) => { setCalories(e.target.value); setSaved(false); }} className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Protein (g)</Label>
              <Input type="number" inputMode="numeric" placeholder="170" value={protein}
                onChange={(e) => { setProtein(e.target.value); setSaved(false); }} className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Carbs (g)</Label>
              <Input type="number" inputMode="numeric" placeholder="200" value={carbs}
                onChange={(e) => { setCarbs(e.target.value); setSaved(false); }} className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fat (g)</Label>
              <Input type="number" inputMode="numeric" placeholder="70" value={fat}
                onChange={(e) => { setFat(e.target.value); setSaved(false); }} className="min-h-[44px]" />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full min-h-[48px]"
            disabled={!calories.trim() && !protein.trim()}>
            {saved ? <><Check className="h-4 w-4 mr-2" />Saved</> : 'Save day'}
          </Button>
        </CardContent>
      </Card>

      {/* Energy balance */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Energy balance
            </CardTitle>
            <Badge
              variant={balance.confidence === 'good' ? 'default' : 'secondary'}
              className="text-xs capitalize"
            >
              {balance.confidence === 'none' ? 'no data' : `${balance.confidence} confidence`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {balance.estimatedTDEE === null ? (
            <p className="text-sm text-muted-foreground">
              {balance.caveat ?? 'Not enough data yet.'}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Estimated maintenance</p>
                  <p className="text-xl font-semibold">{balance.estimatedTDEE}<span className="text-sm font-normal text-muted-foreground"> kcal</span></p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Mean intake</p>
                  <p className="text-xl font-semibold">{balance.meanCalories}<span className="text-sm font-normal text-muted-foreground"> kcal</span></p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Weight trend</p>
                  <p className={`text-xl font-semibold ${(balance.trendLbPerWeek ?? 0) <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {balance.trendLbPerWeek! >= 0 ? '+' : ''}{balance.trendLbPerWeek!.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground"> lb/wk</span>
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Daily balance</p>
                  <p className="text-xl font-semibold">
                    {balance.impliedDailyBalance! >= 0 ? '+' : ''}{balance.impliedDailyBalance}
                    <span className="text-sm font-normal text-muted-foreground"> kcal</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Maintenance is derived from your own intake and weight trend, not a formula —
                it already accounts for how much you actually move and train.
              </p>
            </>
          )}
          {balance.caveat && balance.estimatedTDEE !== null && (
            <div className="flex gap-2 rounded-md bg-muted/50 border border-border p-3">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{balance.caveat}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Protein */}
      {protein14.gramsPerLb !== null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Protein</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">14-day average</span>
              <span className="text-lg font-semibold">
                {protein14.meanProtein} g
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}({protein14.gramsPerLb.toFixed(2)} g/lb)
                </span>
              </span>
            </div>
            <p className={`text-xs ${
              protein14.verdict === 'low'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {protein14.verdict === 'low'
                ? `Below ${protein14.band.low} g/lb. In a deficit that is where lean mass starts getting spent alongside fat.`
                : protein14.verdict === 'ample'
                  ? `Above ${protein14.band.ample} g/lb — more than needed, though nothing is lost by it.`
                  : `Inside the ${protein14.band.low}-${protein14.band.ample} g/lb target band.`}
            </p>
            <div className="flex gap-2 rounded-md bg-muted/50 border border-border p-2.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                This band sits higher than the usual 0.7-1.1 g/lb advice. Anabolic resistance at
                58 and reduced androgen signalling both mean more protein is needed to hold the
                same muscle, and a deficit raises it again.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {recent.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent days</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium p-2 pl-4">Date</th>
                    <th className="text-right text-xs text-muted-foreground font-medium p-2">kcal</th>
                    <th className="text-right text-xs text-muted-foreground font-medium p-2">P</th>
                    <th className="text-right text-xs text-muted-foreground font-medium p-2">C</th>
                    <th className="text-right text-xs text-muted-foreground font-medium p-2">F</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recent.map((n) => (
                    <tr key={n.id}>
                      <td className="p-2 pl-4 whitespace-nowrap">
                        {new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="text-right p-2 font-medium">{n.calories ?? '—'}</td>
                      <td className="text-right p-2 text-muted-foreground">{n.protein ?? '—'}</td>
                      <td className="text-right p-2 text-muted-foreground">{n.carbs ?? '—'}</td>
                      <td className="text-right p-2 text-muted-foreground">{n.fat ?? '—'}</td>
                      <td className="p-2 pr-3">
                        <button
                          onClick={() => deleteNutrition(n.id)}
                          aria-label={`Delete ${new Date(n.date).toDateString()}`}
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
