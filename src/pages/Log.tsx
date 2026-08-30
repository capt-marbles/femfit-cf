

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SessionLogger } from '../components/SessionLogger';
import { ProgressionSuggestions } from '../components/ProgressionSuggestions';
import { SessionHistory } from '../components/SessionHistory';
import { Dumbbell, TrendingUp, History } from 'lucide-react';

export default function LogPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Track & Progress</h1>
        <p className="text-muted-foreground">
          Log your sessions and get progression targets tuned for feminization goals
        </p>
      </div>

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="log" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Log</span>
          </TabsTrigger>
          <TabsTrigger value="progression" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Progression</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <SessionLogger />
        </TabsContent>

        <TabsContent value="progression">
          <ProgressionSuggestions />
        </TabsContent>

        <TabsContent value="history">
          <SessionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
