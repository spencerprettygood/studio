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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import type { PromptFormData } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Brain, Save, Download, Lightbulb, Trash2 } from "lucide-react";
import { useState } from "react";
import { PromptOptimizerDialog } from "./PromptOptimizerDialog";
import { mockCategories } from "@/lib/mockPrompts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const promptFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }).max(100),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(500),
  template: z.string().min(10, { message: "Prompt template must be at least 10 characters." }),
  tags: z.string().refine(value => {
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    return tags.length > 0;
  }, { message: "Please enter at least one tag." }),
  category: z.string().optional(),
});

type PromptFormValues = z.infer<typeof promptFormSchema>;

interface PromptFormProps {
  initialData?: PromptFormData;
  isEditing?: boolean;
  // onSubmit: (data: PromptFormValues) => Promise<void>; // Replace with actual save logic
}

export function PromptForm({ initialData, isEditing = false }: PromptFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);

  const defaultValues = initialData ? {
    ...initialData,
    tags: initialData.tags?.join(', ') || '',
  } : {
    name: "",
    description: "",
    template: "",
    tags: "",
    category: "",
  };

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const currentPromptTemplate = form.watch("template");

  async function onSubmit(data: PromptFormValues) {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Form submitted:", data);
    // Here you would typically call an API to save the prompt
    // For now, just show a toast and redirect

    toast({
      title: isEditing ? "Prompt Updated!" : "Prompt Created!",
      description: `The prompt "${data.name}" has been ${isEditing ? 'updated' : 'saved'} successfully.`,
    });
    router.push("/prompts"); // Redirect to prompts list page
    setIsSubmitting(false);
  }

  const handleExport = () => {
    const values = form.getValues();
    if (!values.name || !values.template) {
      toast({ title: "Cannot Export", description: "Please provide a name and template before exporting.", variant: "destructive" });
      return;
    }
    const promptToExport = {
      id: initialData?.id || crypto.randomUUID(), // Use existing ID or generate new for export
      name: values.name,
      description: values.description,
      template: values.template,
      tags: values.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      category: values.category,
      createdAt: initialData?.id ? new Date().toISOString() : new Date().toISOString(), // Simplified
      updatedAt: new Date().toISOString(),
    };
    const jsonString = `data:text/json;charset=utf-f,${encodeURIComponent(
      JSON.stringify(promptToExport, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${values.name.toLowerCase().replace(/\s+/g, '_')}_prompt.json`;
    link.click();
    toast({
      title: "Prompt Exported",
      description: `${values.name} has been prepared for download as JSON.`,
    });
  };
  
  const handleApplyOptimizedPrompt = (optimizedPrompt: string) => {
    form.setValue("template", optimizedPrompt, { shouldValidate: true, shouldDirty: true });
    toast({ title: "Prompt Updated", description: "Optimized prompt has been applied to the editor." });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground">
                {isEditing ? "Edit Prompt" : "Create New Prompt"}
              </CardTitle>
              <CardDescription>
                {isEditing ? "Modify the details of your existing prompt." : "Craft a new prompt template for your AI workflows."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-6">
                <Button type="button" variant="outline" onClick={handleExport} disabled={isSubmitting}>
                  <Download className="mr-2 h-4 w-4" /> Export to JSON
                </Button>
              <div className="flex gap-2">
                {isEditing && (
                  <Button type="button" variant="destructive" onClick={() => router.push('/prompts')} disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete (Mock)
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting ? <Brain className="mr-2 h-4 w-4 animate-pulse" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEditing ? "Save Changes" : "Create Prompt"}
                </Button>
              </div>
            </CardFooter>
          </Card>
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
