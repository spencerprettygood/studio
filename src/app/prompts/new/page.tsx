
"use client";

import { PromptForm } from '@/components/PromptForm';
import type { PromptFormData } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter

export default function NewPromptPage() {
  const [initialData, setInitialData] = useState<PromptFormData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

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
    // Fallback or direct query param handling (if you decide to use query params for simple fields)
    // Example: const name = searchParams.get('name'); if (name) { setInitialData(prev => ({...prev, name}));}
    
    setIsLoading(false);
  }, [searchParams]); // searchParams dependency for potential future query param use

  if (isLoading) {
    // You can add a skeleton loader here if needed
    return <div className="max-w-4xl mx-auto"><p>Loading form...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PromptForm initialData={initialData} />
    </div>
  );
}
