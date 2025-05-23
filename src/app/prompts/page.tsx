"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromptCard } from '@/components/PromptCard';
import type { Prompt } from '@/lib/types';
import { mockPrompts, mockCategories } from '@/lib/mockPrompts';
import { PlusCircle, Search, XCircle } from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      setPrompts(mockPrompts);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleDeletePrompt = (id: string) => {
    setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== id));
    toast({
      title: "Prompt Deleted",
      description: "The prompt has been successfully deleted.",
      variant: "default",
    });
    setPromptToDelete(null);
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
    prompts.forEach(p => p.tags.forEach(tag => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const matchesSearchTerm = 
        prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? prompt.category === selectedCategory : true;
      const matchesTag = selectedTag ? prompt.tags.includes(selectedTag) : true;
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">Prompt Dashboard</h1>
          <Button disabled size="lg">
            <PlusCircle className="mr-2 h-5 w-5" /> New Prompt
          </Button>
        </div>
         <Card>
          <CardHeader><CardTitle>Filter Prompts</CardTitle></CardHeader>
          <CardContent className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded-md"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-10 bg-muted rounded-md"></div>
              <div className="h-10 bg-muted rounded-md"></div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-6 w-3/4 bg-muted rounded"></div><div className="h-4 w-1/2 bg-muted rounded mt-2"></div></CardHeader>
              <CardContent><div className="h-12 bg-muted rounded"></div><div className="flex gap-2 mt-3"><div className="h-6 w-16 bg-muted rounded-full"></div><div className="h-6 w-20 bg-muted rounded-full"></div></div></CardContent>
              <CardFooter><div className="h-10 w-full bg-muted rounded"></div></CardFooter>
            </Card>
          ))}
        </div>
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {mockCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
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
                    <AlertDialogAction onClick={() => handleDeletePrompt(prompt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
