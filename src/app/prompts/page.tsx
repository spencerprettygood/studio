
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, deleteDoc, doc, query, where, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Prompt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromptCard } from '@/components/PromptCard';
import { mockCategories } from '@/lib/mockPrompts';
import { PlusCircle, Search, XCircle, Loader2 } from 'lucide-react';
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

const ALL_CATEGORIES_SENTINEL = "__ALL_CATEGORIES_SENTINEL__";

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
    });
};

export default function PromptsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  const { data: prompts = [], isLoading } = useQuery<Prompt[]>({
    queryKey: ['prompts'],
    queryFn: fetchPrompts,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDoc(doc(db, "prompts", id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: "Prompt Deleted",
        description: "The prompt has been successfully deleted.",
      });
      setPromptToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error Deleting Prompt",
        description: error.message,
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

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    prompts.forEach(p => p.tags?.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const matchesSearchTerm = 
        prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? prompt.category === selectedCategory : true;
      const matchesTag = selectedTag ? prompt.tags?.includes(selectedTag) : true;
      return matchesSearchTerm && matchesCategory && matchesTag;
    });
  }, [prompts, searchTerm, selectedCategory, selectedTag]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedTag('');
  };
  
  const hasActiveFilters = searchTerm || selectedCategory || selectedTag;

  if (isLoading) {
    return (
       <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">Prompt Dashboard</h1>
        <Button asChild size="lg">
          <Link href="/prompts/new">
            <PlusCircle className="mr-2 h-5 w-5" /> New Prompt
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Filter Prompts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              value={selectedCategory} 
              onValueChange={(value) => {
                setSelectedCategory(value === ALL_CATEGORIES_SENTINEL ? '' : value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES_SENTINEL}>All Categories</SelectItem>
                {mockCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={selectedTag} 
              onValueChange={(value) => setSelectedTag(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
             <Button variant="ghost" onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground">
                <XCircle className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
      
      {filteredPrompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPrompts.map(prompt => (
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
        <Card className="text-center py-12 shadow-sm">
          <CardContent className="space-y-4">
            <Search className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold text-foreground">No Prompts Found</h3>
            <p className="text-muted-foreground">
              {hasActiveFilters ? "Try adjusting your search or filter criteria." : "Create a new prompt to get started!"}
            </p>
            {!hasActiveFilters && (
                 <Button asChild className="mt-4">
                    <Link href="/prompts/new">
                        <PlusCircle className="mr-2 h-5 w-5" /> Create New Prompt
                    </Link>
                </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
