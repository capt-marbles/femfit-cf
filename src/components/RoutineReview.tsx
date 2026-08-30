

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { GeneratedRoutine } from '../types/workout';
import { ClipboardCheck, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface RoutineReviewProps {
  routine: GeneratedRoutine;
}

export function RoutineReview({ routine }: RoutineReviewProps) {
  const [review, setReview] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runReview = async () => {
    setIsReviewing(true);
    setError(null);
    setReview('');

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routine }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Review failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setReview(fullText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review routine');
    } finally {
      setIsReviewing(false);
    }
  };

  const formatContent = (content: string) =>
    content.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="text-base font-semibold mt-5 mb-2 text-primary">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="text-sm font-medium mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={index} className="mb-2">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-semibold">{part}</strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={index} className="ml-4 mb-1 list-disc list-inside">
            {line.slice(2)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={index} className="ml-4 mb-1 list-decimal list-inside">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      if (line.trim() === '') return <div key={index} className="h-2" />;
      return <p key={index} className="mb-2">{line}</p>;
    });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Routine Review
        </CardTitle>
        <Button onClick={runReview} disabled={isReviewing} size="sm" className="gap-2">
          {isReviewing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reviewing...
            </>
          ) : review ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Re-review
            </>
          ) : (
            <>
              <ClipboardCheck className="h-4 w-4" />
              Review This Routine
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Review Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {!review && !isReviewing && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="mb-1">Get a second opinion before you save.</p>
            <p className="text-sm">
              An AI coach scores this routine against feminization principles and flags what to fix.
            </p>
          </div>
        )}

        {(review || isReviewing) && (
          <div className="text-sm leading-relaxed">
            {formatContent(review)}
            {isReviewing && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
