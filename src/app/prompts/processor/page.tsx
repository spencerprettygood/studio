
"use client";

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { processUnstructuredPrompts } from '@/ai/flows/process-unstructured-prompts';
import type { ProcessedPromptData } from '@/lib/types';
import { ProcessedPromptCard } from '@/components/ProcessedPromptCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PromptProcessorPage() {
  const [inputText, setInputText] = useState('');
  const [processedPrompts, setProcessedPrompts] = useState<ProcessedPromptData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleProcessPrompts = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please paste your prompts into the textarea.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    setProcessedPrompts([]);

    try {
      const result = await processUnstructuredPrompts({ unstructuredPrompts: inputText });
      if (result.processedPrompts && result.processedPrompts.length > 0) {
        setProcessedPrompts(result.processedPrompts);
        toast({
          title: "Processing Complete!",
          description: `Found and analyzed ${result.processedPrompts.length} prompt(s).`,
        });
      } else {
         setProcessedPrompts([]); // Explicitly set to empty array
        toast({
          title: "No Prompts Found",
          description: "The AI could not identify distinct prompts in your input, or the input was empty.",
          variant: "default",
        });
      }
    } catch (err) {
      console.error("Error processing prompts:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to process prompts: ${errorMessage}`);
      toast({
        title: "Processing Error",
        description: `An error occurred: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground flex items-center">
            <Wand2 className="h-6 w-6 mr-3 text-primary" /> AI Prompt Processor
          </CardTitle>
          <CardDescription>
            Paste your unorganized prompts below. The AI will analyze, structure, and provide feedback for each identified prompt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[250px] w-full">
            <Textarea
              placeholder="Paste your raw, unorganized prompts here... The AI will try to separate and understand them."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[200px] text-sm font-mono"
              disabled={isLoading}
            />
          </ScrollArea>
          <Button onClick={handleProcessPrompts} disabled={isLoading || !inputText.trim()} size="lg" className="w-full sm:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            Process Prompts with AI
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-10 bg-card rounded-lg shadow-md">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">AI is analyzing your prompts... please wait.</p>
        </div>
      )}

      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/10 shadow-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" /> Error Processing Prompts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && processedPrompts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Processed Prompts:</h2>
          {processedPrompts.map((prompt, index) => (
            <ProcessedPromptCard key={index} processedPrompt={prompt} />
          ))}
        </div>
      )}
       {!isLoading && !error && processedPrompts.length === 0 && inputText && !isLoading && (
        <Card className="text-center py-12 shadow-sm">
          <CardContent className="space-y-4">
            <Wand2 className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold text-foreground">No Prompts Identified</h3>
            <p className="text-muted-foreground">
              The AI didn't find any distinct prompts in your input. Try rephrasing or adding more content.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
