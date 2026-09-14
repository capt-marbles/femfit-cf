

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { MeasurementForm } from '../components/MeasurementForm';
import { MeasurementCharts } from '../components/MeasurementCharts';
import { MeasurementHistory } from '../components/MeasurementHistory';
import { ReminderSettings, TodayWeightNudge } from '../components/ReminderSettings';
import { ClipboardList, LineChart, History } from 'lucide-react';

export default function MeasurementsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Body Measurements</h1>
        <p className="text-muted-foreground">
          Track your body measurements and visualize your progress over time
        </p>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="log" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Log</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-6">
          <TodayWeightNudge />
          <MeasurementForm />
          <ReminderSettings />
        </TabsContent>

        <TabsContent value="charts">
          <MeasurementCharts />
        </TabsContent>

        <TabsContent value="history">
          <MeasurementHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
