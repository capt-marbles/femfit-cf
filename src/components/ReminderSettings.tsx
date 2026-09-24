import { useEffect, useState } from 'react';
import { Bell, BellOff, AlertCircle, Check, Loader2, Share } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useWorkout } from '../context/WorkoutContext';
import { isSameLocalDay } from '../lib/dates';
import {
  isPushSupported,
  needsHomeScreenInstall,
  getPermission,
  getSavedHour,
  getExistingSubscription,
  enableReminders,
  disableReminders,
} from '../lib/push';

function formatHour(h: number): string {
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${suffix}`;
}

/** Banner shown when today has no weight entry yet. */
export function TodayWeightNudge() {
  const { measurements } = useWorkout();
  const today = new Date();

  const loggedToday = measurements.some(
    (m) => m.weight !== undefined && isSameLocalDay(m.date, today)
  );

  if (loggedToday) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400 mb-4">
        <Check className="h-4 w-4 flex-shrink-0" />
        Weight logged today.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-700 dark:text-amber-400 mb-4">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      No weight logged today yet.
    </div>
  );
}

export function ReminderSettings() {
  const [supported] = useState(isPushSupported);
  const [needsInstall] = useState(needsHomeScreenInstall);
  const [permission, setPermission] = useState<NotificationPermission>(getPermission);
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(getSavedHour);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!supported) {
      setChecking(false);
      return;
    }
    getExistingSubscription()
      .then((sub) => setEnabled(!!sub))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [supported]);

  const handleEnable = async (targetHour: number) => {
    setBusy(true);
    setError(null);
    try {
      await enableReminders(targetHour);
      setEnabled(true);
      setHour(targetHour);
      setPermission(getPermission());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not enable reminders.');
      setPermission(getPermission());
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setError(null);
    try {
      await disableReminders();
      setEnabled(false);
    } catch {
      setError('Could not turn reminders off.');
    } finally {
      setBusy(false);
    }
  };

  const handleHourChange = (v: string) => {
    const h = parseInt(v, 10);
    setHour(h);
    if (enabled) handleEnable(h);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {enabled ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          Daily weight reminder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!supported ? (
          <p className="text-sm text-muted-foreground">
            This browser doesn't support notifications.
          </p>
        ) : needsInstall ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              On iPhone, reminders only work once the app is on your home screen.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              Tap <Share className="h-3.5 w-3.5 inline" /> Share → Add to Home Screen, then
              open FemFit from there and come back here.
            </p>
          </div>
        ) : permission === 'denied' ? (
          <p className="text-sm text-muted-foreground">
            Notifications are blocked for this app. Re-enable them in your device settings,
            then reload.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Remind me at</Label>
              <Select value={String(hour)} onValueChange={handleHourChange} disabled={busy}>
                <SelectTrigger className="w-full min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, h) => (
                    <SelectItem key={h} value={String(h)}>
                      {formatHour(h)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => (enabled ? handleDisable() : handleEnable(hour))}
              disabled={busy || checking}
              variant={enabled ? 'outline' : 'default'}
              className="w-full min-h-[44px]"
            >
              {busy || checking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : enabled ? (
                <BellOff className="h-4 w-4 mr-2" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              {checking
                ? 'Checking…'
                : enabled
                  ? 'Turn reminders off'
                  : 'Turn reminders on'}
            </Button>

            {enabled && !busy && (
              <p className="text-xs text-muted-foreground text-center">
                You'll be reminded at {formatHour(hour)} on days you haven't logged a weight.
              </p>
            )}
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
