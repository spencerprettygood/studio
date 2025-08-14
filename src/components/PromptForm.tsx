
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PromptFormData } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Brain, Save, Lightbulb, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { PromptOptimizerDialog } from "./PromptOptimizerDialog";
import { mockCategories } from "@/lib/mockPrompts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, updateDoc, Timestamp } from "firebase/firestore";

const promptFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }).max(100),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(500),
  template: z.string().min(10, { message: "Prompt template must be at least 10 characters." }),
  tags: z.string().refine(value => value.split(',').map(tag => tag.trim()).filter(Boolean).length > 0, {
    message: "Please enter at least one tag."
  }),
  category: z.string().optional(),
});

type PromptFormValues = z.infer<typeof promptFormSchema>;

interface PromptFormProps {
  initialData?: PromptFormData;
  isEditing?: boolean;
}

export function PromptForm({ initialData, isEditing = false }: PromptFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      name: "",
      description: "",
      template: "",
      tags: "",
      category: "",
    },
    mode: "onChange",
  });
  
  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags,
      });
    }
  }, [initialData, form]);

  const mutation = useMutation({
    mutationFn: async (data: PromptFormValues) => {
        const processedData = {
          ...data,
          tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          updatedAt: Timestamp.now(),
        };

        if (isEditing && initialData?.id) {
            const promptRef = doc(db, 'prompts', initialData.id);
            await updateDoc(promptRef, processedData);
        } else {
            await addDoc(collection(db, 'prompts'), {
                ...processedData,
                createdAt: Timestamp.now(),
            });
        }
    },
    onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['prompts'] });
        toast({
            title: isEditing ? "Prompt Updated!" : "Prompt Created!",
            description: `The prompt "${variables.name}" has been ${isEditing ? 'updated' : 'saved'} successfully.`,
        });
        router.push("/prompts");
    },
    onError: (error) => {
        toast({
            title: "Something went wrong",
            description: error.message,
            variant: "destructive",
        });
    }
  });


  const currentPromptTemplate = form.watch("template");
  
  const handleApplyOptimizedPrompt = (optimizedPrompt: string) => {
    form.setValue("template", optimizedPrompt, { shouldValidate: true, shouldDirty: true });
    toast({ title: "Prompt Updated", description: "Optimized prompt has been applied to the editor." });
  };

  return (
    <>
      <div className="space-y-2 mb-8">
         <Button variant="ghost" onClick={() => router.back()} className="px-2 h-auto text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isEditing ? "Edit Prompt" : "Create New Prompt"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? "Modify the details of your existing prompt template." : "Craft a new reusable prompt template for your AI workflows."}
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(mutation.mutate)} className="space-y-8">
            <div className="space-y-6 p-6 border rounded-lg bg-card">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Creative Story Idea Generator" {...field} />
                    </FormControl>
                    <FormDescription>A concise and descriptive name for your prompt.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly explain what this prompt does and its purpose..."
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>A short summary of the prompt's function and use case.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Prompt Template</FormLabel>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsOptimizerOpen(true)}
                        disabled={!currentPromptTemplate || currentPromptTemplate.trim().length < 10}
                      >
                        <Lightbulb className="mr-2 h-4 w-4" /> Optimize with AI
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your prompt template here. Use {{variables}} for placeholders..."
                        className="resize-y min-h-[200px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The core content of your prompt. You can use double curly braces for dynamic variables, e.g., `{{topic}}`.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., creative, marketing, code (comma-separated)" {...field} />
                      </FormControl>
                      <FormDescription>Assign relevant tags for easier filtering and organization.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {mockCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Group your prompt into a specific category.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={mutation.isPending}>
                    Cancel
                </Button>
              
              <Button type="submit" disabled={mutation.isPending} size="lg">
                {mutation.isPending ? <Brain className="mr-2 h-4 w-4 animate-pulse" /> : <Save className="mr-2 h-4 w-4" />}
                {isEditing ? "Save Changes" : "Create Prompt"}
              </Button>
            </div>
        </form>
      </Form>
      <PromptOptimizerDialog 
        isOpen={isOptimizerOpen}
        onOpenChange={setIsOptimizerOpen}
        currentPrompt={currentPromptTemplate}
        onApplyOptimizedPrompt={handleApplyOptimizedPrompt}
      />
    </>
  );
}
