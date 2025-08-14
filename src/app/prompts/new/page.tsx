
"use client";

import { PromptForm } from '@/components/PromptForm';
import type { PromptFormData } from '@/lib/types';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function NewPromptContent() {
  const [initialData, setInitialData] = useState<PromptFormData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for data passed via localStorage from PromptProcessorPage
    const pendingDataString = localStorage.getItem('pendingPromptData');
    if (pendingDataString) {
      try {
        const pendingData: PromptFormData = JSON.parse(pendingDataString);
        setInitialData(pendingData);
        localStorage.removeItem('pendingPromptData'); // Clear after use
      } catch (error) {
        console.error("Error parsing pending prompt data from localStorage:", error);
        // Optionally, clear the invalid item
        localStorage.removeItem('pendingPromptData');
      }
    }
    
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <PromptForm initialData={initialData} />
    </div>
  );
}

export default function NewPromptPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <NewPromptContent />
    </Suspense>
  );
}
