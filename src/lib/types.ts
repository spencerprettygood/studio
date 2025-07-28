
import { z } from 'zod';

export interface Prompt {
  id: string;
  name: string;
  description: string;
  template: string; 
  tags: string[];
  createdAt: string; 
  updatedAt: string;
  category?: string;
}

export const PromptSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  template: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string().describe("ISO date string for when the prompt was created."),
  updatedAt: z.string().describe("ISO date string for when the prompt was last updated."),
  category: z.string().optional(),
});

export type PromptFormData = Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'tags'> & { id?: string, tags?: string | string[] };


export interface ProcessedPromptData {
  generatedTitle: string;
  identifiedPrompt: string;
  description: string;
  suggestedCategory: string;
  suggestedTags: string[];
  qualityAnalysis: string;
  followUpPromptSuggestion?: string;
}
