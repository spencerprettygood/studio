
"use client";

import type { ProcessedPromptData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface ProcessedPromptCardProps {
  processedPrompt: ProcessedPromptData;
}

export function ProcessedPromptCard({ processedPrompt }: ProcessedPromptCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleSaveAsNewPrompt = () => {
    try {
      localStorage.setItem('pendingPromptData', JSON.stringify({
        name: processedPrompt.generatedTitle,
        description: processedPrompt.description,
        template: processedPrompt.identifiedPrompt,
        tags: processedPrompt.suggestedTags.join(', '),
        category: processedPrompt.suggestedCategory,
      }));
      router.push('/prompts/new');
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      toast({
        title: "Error",
        description: "Could not prepare prompt for saving. LocalStorage might be full or disabled.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary-foreground_real_primary_if_primary_is_light_else_text_primary">
          {processedPrompt.generatedTitle}
        </CardTitle>
        {processedPrompt.description && (
          <CardDescription className="text-sm text-muted-foreground">
            {processedPrompt.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">Identified Prompt:</h4>
          <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap font-mono">
            {processedPrompt.identifiedPrompt}
          </p>
        </div>
        
        {processedPrompt.suggestedCategory && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Suggested Category:</h4>
            <Badge variant="outline">{processedPrompt.suggestedCategory}</Badge>
          </div>
        )}

        {processedPrompt.suggestedTags && processedPrompt.suggestedTags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Suggested Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {processedPrompt.suggestedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h4 className="text-sm font-medium text-foreground mb-1 flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
            Quality Analysis:
            </h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 border rounded-md bg-card">
            {processedPrompt.qualityAnalysis}
          </p>
        </div>

        {processedPrompt.followUpPromptSuggestion && (
           <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Follow-up Suggestion:</h4>
            <p className="text-sm text-muted-foreground italic p-3 border border-dashed rounded-md bg-card">
              {processedPrompt.followUpPromptSuggestion}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end pt-4 border-t">
        <Button onClick={handleSaveAsNewPrompt}>
          <Save className="h-4 w-4 mr-2" />
          Save as New Prompt
        </Button>
      </CardFooter>
    </Card>
  );
}
