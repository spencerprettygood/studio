
"use client";

import { PromptForm } from '@/components/PromptForm';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Prompt, PromptFormData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const fetchPrompt = async (id: string): Promise<Prompt | null> => {
    const promptDoc = await getDoc(doc(db, 'prompts', id));
    if (!promptDoc.exists()) {
        return null;
    }
    const data = promptDoc.data() as DocumentData;
    return {
        id: promptDoc.id,
        name: data.name,
        description: data.description,
        template: data.template,
        tags: data.tags || [],
        category: data.category,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
    };
};

export default function EditPromptPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: promptData, isLoading, error } = useQuery<Prompt | null>({
    queryKey: ['prompt', id],
    queryFn: () => fetchPrompt(id),
    enabled: !!id, // Only run query if id is available
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
       <div className="max-w-4xl mx-auto p-4">
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not load prompt data. {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!promptData) {
     return (
       <div className="max-w-4xl mx-auto p-4">
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Sorry, we couldn't find the prompt you're looking for. Would you like to <a href="/prompts" className="underline text-primary">go back to all prompts</a>?</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Adapt the Prompt type to PromptFormData
  const initialFormData: PromptFormData = {
    ...promptData,
    tags: promptData.tags.join(', '),
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <PromptForm initialData={initialFormData} isEditing={true} />
    </div>
  );
}
