
'use server';
/**
 * @fileOverview Tools for interacting with the prompt library.
 * - getPromptsTool - Fetches prompts, optionally filtered by category or tags.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {mockPrompts} from '@/lib/mockPrompts'; // Import only mockPrompts from here
import { PromptSchema, type Prompt } from '@/lib/types'; // Import PromptSchema and Prompt type from here


export const getPromptsTool = ai.defineTool(
  {
    name: 'getPromptsTool',
    description:
      'Retrieves a list of saved prompts. Can be filtered by category or tags. Use this to show the user their existing prompts or to find relevant prompts for a task they are describing.',
    inputSchema: z.object({
      category: z.string().optional().describe("The category to filter prompts by. If omitted, prompts from all categories are considered."),
      tags: z.array(z.string()).optional().describe("A list of tags to filter prompts by. Prompts must include all specified tags. If omitted, tags are not used for filtering."),
    }),
    outputSchema: z.array(PromptSchema).describe("An array of prompt objects that match the criteria."),
  },
  async (input) => {
    // Direct property access to avoid potential enumeration issues with Next.js `params`-like objects
    const category = input.category;
    const tags = input.tags;

    let filteredPrompts: Prompt[] = mockPrompts;

    if (category) {
      filteredPrompts = filteredPrompts.filter(p => p.category === category);
    }

    // Ensure tags is an array and has elements before using array methods
    if (Array.isArray(tags) && tags.length > 0) {
      filteredPrompts = filteredPrompts.filter(p =>
        p.tags && tags.every(tag => p.tags.includes(tag))
      );
    }
    
    // Return copies to prevent accidental mutation of the mockPrompts array if it were more complex
    return filteredPrompts.map(p => ({...p}));
  }
);

