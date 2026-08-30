

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useWorkout } from '../context/WorkoutContext';
import { Brain, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export function AIFeedback() {
  const { workouts, muscleData, aiAnalysis, setAiAnalysis, isAnalyzing, setIsAnalyzing } =
    useWorkout();
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (workouts.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setAiAnalysis('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workouts, muscleData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setAiAnalysis(fullText);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze workout data');
    } finally {
      setIsAnalyzing(false);
    }
  }, [workouts, muscleData, setAiAnalysis, setIsAnalyzing]);

  // Format markdown-like content for display
  const formatContent = (content: string) => {
    // Split by headers and format
    return content.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-primary">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="text-base font-medium mt-4 mb-2">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Bold text with **
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={index} className="mb-2">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-semibold">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={index} className="ml-4 mb-1 list-disc list-inside">
            {line.slice(2)}
          </li>
        );
      }
      // Numbered items
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={index} className="ml-4 mb-1 list-decimal list-inside">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      // Regular paragraphs
      return (
        <p key={index} className="mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Analysis
        </CardTitle>
        <Button
          onClick={runAnalysis}
          disabled={isAnalyzing || workouts.length === 0}
          size="sm"
          className="gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : aiAnalysis ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Re-analyze
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze Routine
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Analysis Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {!aiAnalysis && !isAnalyzing && !error && (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">
              Get AI-powered analysis of your workout routine
            </p>
            <p className="text-sm">
              Receive personalized recommendations for achieving your feminization goals
            </p>
          </div>
        )}

        {(aiAnalysis || isAnalyzing) && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="text-sm leading-relaxed">
              {formatContent(aiAnalysis || '')}
              {isAnalyzing && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
