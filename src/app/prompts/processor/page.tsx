
"use client";

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { processUnstructuredPrompts } from '@/ai/flows/process-unstructured-prompts';
import type { ProcessedPromptData } from '@/lib/types';
import { ProcessedPromptCard } from '@/components/ProcessedPromptCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, AlertTriangle, Search } from 'lucide-react';
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
    <div className="container max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Wand2 className="h-8 w-8 text-primary" /> AI Prompt Processor
        </h1>
        <p className="text-muted-foreground">
          Paste your unorganized notes below. The AI will analyze, structure, and provide feedback for each identified prompt.
        </p>
      </div>

      <div className="space-y-4">
        <ScrollArea className="h-[250px] w-full border rounded-md">
          <Textarea
            placeholder="Paste your raw, unorganized prompts here... The AI will try to separate and understand them."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="h-full w-full text-sm font-mono border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
          />
        </ScrollArea>
        <Button onClick={handleProcessPrompts} disabled={isLoading || !inputText.trim()} size="lg" className="w-full sm:w-auto">
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-5 w-5" />
          )}
          Process with AI
        </Button>
      </div>


      {isLoading && (
        <div className="flex flex-col items-center justify-center p-10 bg-card rounded-lg shadow-sm border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">AI is analyzing your notes... please wait.</p>
        </div>
      )}

      {error && !isLoading && (
         <div className="p-4 border-l-4 border-destructive bg-destructive/10 rounded-r-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> 
            <h3 className="text-lg font-semibold text-destructive">Error Processing Prompts</h3>
          </div>
          <p className="text-destructive/90 ml-7">{error}</p>
        </div>
      )}

      {!isLoading && processedPrompts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Analysis Results:</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {processedPrompts.map((prompt, index) => (
              <ProcessedPromptCard key={index} processedPrompt={prompt} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && processedPrompts.length === 0 && inputText && (
         <div className="text-center py-12 border-2 border-dashed rounded-lg col-span-full">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-xl font-semibold text-foreground">No Prompts Identified</h3>
            <p className="mt-2 text-muted-foreground">
              The AI didn't find any distinct prompts in your input. Try rephrasing or adding more content.
            </p>
          </div>
      )}
    </div>
  );
}
