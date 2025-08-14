"use client";

import { useState, useEffect } from 'react';
import { optimizePrompt, OptimizePromptInput, OptimizePromptOutput } from '@/ai/flows/optimize-prompt';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface PromptOptimizerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrompt: string;
  onApplyOptimizedPrompt: (optimizedPrompt: string) => void;
}

export function PromptOptimizerDialog({ isOpen, onOpenChange, currentPrompt, onApplyOptimizedPrompt }: PromptOptimizerDialogProps) {
  const [promptToOptimize, setPromptToOptimize] = useState(currentPrompt);
  const [context, setContext] = useState('');
  // const [successfulPrompts, setSuccessfulPrompts] = useState(''); // For simplicity, not including this field in UI for now
  const [optimizationResult, setOptimizationResult] = useState<OptimizePromptOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleOptimize = async () => {
    setIsLoading(true);
    setOptimizationResult(null);
    try {
      const input: OptimizePromptInput = {
        prompt: promptToOptimize,
        context: context || undefined,
        // successfulPrompts: successfulPrompts ? successfulPrompts.split('\n').filter(Boolean) : undefined,
      };
      const result = await optimizePrompt(input);
      setOptimizationResult(result);
    } catch (error) {
      console.error("Error optimizing prompt:", error);
      toast({
        title: "Optimization Failed",
        description: "Could not optimize the prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (optimizationResult?.optimizedPrompt) {
      navigator.clipboard.writeText(optimizationResult.optimizedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard!"});
    }
  };

  const handleApply = () => {
    if (optimizationResult?.optimizedPrompt) {
      onApplyOptimizedPrompt(optimizationResult.optimizedPrompt);
      onOpenChange(false); // Close dialog
    }
  };

  // Reset state when dialog is opened with a new prompt
  useEffect(() => {
    if (isOpen) {
      setPromptToOptimize(currentPrompt);
      setContext('');
      setOptimizationResult(null);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Prompt Optimizer</DialogTitle>
          <DialogDescription>
            Refine your prompt for better results. Provide your current prompt and optional context.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6"> {/* pr-6 -mr-6 to account for scrollbar */}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="prompt-to-optimize">Your Prompt</Label>
              <Textarea
                id="prompt-to-optimize"
                value={promptToOptimize}
                onChange={(e) => setPromptToOptimize(e.target.value)}
                rows={5}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prompt-context">Context (Optional)</Label>
              <Textarea
                id="prompt-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Provide any relevant background or context for your prompt..."
                rows={3}
                className="min-h-[70px]"
              />
            </div>
            {/* <div className="grid gap-2">
              <Label htmlFor="successful-prompts">Successful Examples (Optional, one per line)</Label>
              <Textarea
                id="successful-prompts"
                value={successfulPrompts}
                onChange={(e) => setSuccessfulPrompts(e.target.value)}
                placeholder="List some examples of prompts that worked well for similar tasks..."
                rows={3}
              />
            </div> */}

            {isLoading && (
              <div className="flex items-center justify-center p-6 bg-muted rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Optimizing your prompt...</p>
              </div>
            )}

            {optimizationResult && !isLoading && (
              <div className="space-y-4 p-4 border bg-card rounded-md">
                <div>
                  <Label className="text-base font-semibold">Optimized Prompt:</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md relative group">
                    <p className="text-sm whitespace-pre-wrap">{optimizationResult.optimizedPrompt}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 opacity-50 group-hover:opacity-100"
                      onClick={handleCopyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      <span className="sr-only">Copy</span>
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-base font-semibold">Explanation:</Label>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{optimizationResult.explanation}</p>
                </div>
                <Button onClick={handleApply} className="w-full mt-2">
                  Apply Optimized Prompt
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {!optimizationResult && (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleOptimize} disabled={isLoading || !promptToOptimize.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Optimize with AI
            </Button>
          </DialogFooter>
        )}
        {optimizationResult && (
           <DialogFooter>
             <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
           </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
