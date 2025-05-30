"use client"; // Required for useParams

import { PromptForm } from '@/components/PromptForm';
import { mockPrompts } from '@/lib/mockPrompts';
import type { PromptFormData } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditPromptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [promptData, setPromptData] = useState<PromptFormData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      // Simulate fetching data
      setIsLoading(true);
      setTimeout(() => {
        const foundPrompt = mockPrompts.find(p => p.id === id);
        if (foundPrompt) {
          setPromptData(foundPrompt);
        } else {
          setError("Prompt not found.");
          // Optionally redirect if not found after a delay, or show error prominently
          // router.push('/404'); 
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-6 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
       <div className="max-w-4xl mx-auto">
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error} Would you like to <a href="/prompts" className="underline text-primary">go back to all prompts</a>?</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!promptData) {
     // This case should ideally be handled by error state or redirect.
    return <div className="max-w-4xl mx-auto"><p>Prompt data could not be loaded.</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PromptForm initialData={promptData} isEditing={true} />
    </div>
  );
}
