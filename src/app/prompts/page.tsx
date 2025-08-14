
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, deleteDoc, doc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Prompt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PromptCard } from '@/components/PromptCard';
import { PlusCircle, Search, Loader2, Bot, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { categorizePromptsByUsecase } from '@/ai/flows/categorize-prompts-flow';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';


const fetchPrompts = async (): Promise<Prompt[]> => {
    const promptsCollection = collection(db, 'prompts');
    const snapshot = await getDocs(promptsCollection);
    return snapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
            id: doc.id,
            name: data.name,
            description: data.description,
            template: data.template,
            tags: data.tags || [],
            category: data.category,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
        };
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export default function PromptsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const { data: prompts, isLoading: isLoadingPrompts, error: promptsError } = useQuery({
    queryKey: ['prompts'],
    queryFn: fetchPrompts,
  });

  const { data: aiCategories, isLoading: isLoadingCategories, error: categoriesError } = useQuery({
    queryKey: ['aiCategories', prompts],
    queryFn: () => categorizePromptsByUsecase({ prompts: prompts || [] }),
    enabled: !!prompts && prompts.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDoc(doc(db, "prompts", id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['aiCategories'] });
      toast({
        title: "Prompt Deleted",
        description: "The prompt has been successfully deleted.",
      });
      setPromptToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error Deleting Prompt",
        description: (error as Error).message,
        variant: "destructive",
      });
      setPromptToDelete(null);
    }
  });

  const handleDeletePrompt = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleExportPrompt = (prompt: Prompt) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(prompt, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${prompt.name.toLowerCase().replace(/\s+/g, '_')}_prompt.json`;
    link.click();
    toast({
      title: "Prompt Exported",
      description: `${prompt.name} has been exported as JSON.`,
    });
  };

  const displayedPrompts = useMemo(() => {
    if (selectedCategory === 'All' || !aiCategories) {
      return prompts || [];
    }
    const category = aiCategories.categories.find(c => c.name === selectedCategory);
    if (!category) return prompts || []; // Fallback if category not found
    const promptIds = new Set(category.promptIds || []);
    return (prompts || []).filter(p => promptIds.has(p.id));
  }, [prompts, selectedCategory, aiCategories]);

  const isLoading = isLoadingPrompts || (!!prompts && prompts.length > 0 && isLoadingCategories);
  const error = promptsError || categoriesError;

  if (isLoading) {
    return (
       <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading and categorizing prompts...</p>
        </div>
    );
  }

  if (error) {
     return (
       <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="mt-10 border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/> Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Could not load prompts. {(error as Error).message}</p>
            <Button onClick={() => queryClient.invalidateQueries({queryKey: ['prompts']})} className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Prompt Library</h1>
          <p className="text-muted-foreground">Browse, manage, and organize all of your saved prompts.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/prompts/new">
            <PlusCircle className="mr-2 h-5 w-5" /> New Prompt
          </Link>
        </Button>
      </div>

      {aiCategories && aiCategories.categories.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>AI-Powered Use Cases</span>
          </h2>
          <p className="text-muted-foreground mb-4 text-sm">The AI has analyzed your library and grouped your prompts. Click one to filter.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
             <button
              onClick={() => setSelectedCategory('All')}
              className={cn(
                "p-4 rounded-lg border text-left transition-all duration-200 hover:border-primary/80",
                selectedCategory === 'All' ? 'bg-primary/10 border-primary shadow-md' : 'bg-card border-border hover:bg-muted/50'
              )}
            >
              <h3 className="font-semibold text-foreground">All Prompts</h3>
              <p className="text-sm text-muted-foreground">{prompts?.length || 0} total</p>
            </button>
            {aiCategories.categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                    "p-4 rounded-lg border text-left transition-all duration-200 hover:border-primary/80",
                    selectedCategory === cat.name ? 'bg-primary/10 border-primary shadow-md' : 'bg-card border-border hover:bg-muted/50'
                )}
              >
                <h3 className="font-semibold text-foreground">{cat.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        (!prompts || prompts.length === 0) ? null : <Separator />
      )}
      
      {aiCategories && aiCategories.categories.length > 0 && <Separator />}


      {displayedPrompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedPrompts.map(prompt => (
            <AlertDialog key={prompt.id}>
              <PromptCard 
                prompt={prompt} 
                onDelete={() => setPromptToDelete(prompt.id)} 
                onExport={handleExportPrompt} 
              />
              {promptToDelete === prompt.id && (
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the prompt "{prompt.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPromptToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDeletePrompt(prompt.id)} 
                      disabled={deleteMutation.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              )}
            </AlertDialog>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg col-span-full">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-xl font-semibold text-foreground">No Prompts Found</h3>
            <p className="mt-2 text-muted-foreground">
              {prompts && prompts.length > 0 ? "No prompts match the selected category." : "Your prompt library is empty."}
            </p>
            {(!prompts || prompts.length === 0) && (
                 <Button asChild className="mt-6">
                    <Link href="/prompts/new">
                        <PlusCircle className="mr-2 h-5 w-5" /> Create Your First Prompt
                    </Link>
                </Button>
            )}
        </div>
      )}
    </div>
  );
}
