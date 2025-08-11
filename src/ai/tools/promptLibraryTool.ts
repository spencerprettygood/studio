
'use server';
/**
 * @fileOverview Tools for interacting with the prompt library.
 * - getPromptsTool - Fetches prompts from Firestore, optionally filtered.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { PromptSchema, type Prompt } from '@/lib/types';

export const getPromptsTool = ai.defineTool(
  {
    name: 'getPromptsTool',
    description:
      'Retrieves a list of saved prompts from the Firestore database. Can be filtered by category or tags. Use this to show the user their existing prompts or to find relevant prompts for a task they are describing.',
    inputSchema: z.object({
      category: z.string().optional().describe("The category to filter prompts by."),
      tags: z.array(z.string()).optional().describe("A list of tags to filter prompts by. Prompts must include all specified tags."),
    }),
    outputSchema: z.array(PromptSchema).describe("An array of prompt objects that match the criteria."),
  },
  async (input) => {
    const { category, tags } = input;
    
    // Base query for the 'prompts' collection
    let promptsQuery = query(collection(db, "prompts"));

    // Apply filters
    if (category) {
      promptsQuery = query(promptsQuery, where("category", "==", category));
    }
    if (tags && tags.length > 0) {
      // Firestore's 'array-contains-all' is not available, so we use 'array-contains' for each tag.
      // This is a limitation; for complex queries, a more advanced data structure or third-party search service would be needed.
      // For now, we'll filter post-query for simplicity, or apply one tag filter if possible.
      // A single 'array-contains' is efficient. Multiple requires post-filtering.
      promptsQuery = query(promptsQuery, where("tags", "array-contains", tags[0]));
    }

    const querySnapshot = await getDocs(promptsQuery);
    let prompts: Prompt[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        const prompt: Prompt = {
            id: doc.id,
            name: data.name,
            description: data.description,
            template: data.template,
            tags: data.tags,
            category: data.category,
            // Convert Firestore Timestamps to ISO strings
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
        };
        prompts.push(prompt);
    });

    // If multiple tags were provided, perform secondary filtering in memory
    if (tags && tags.length > 1) {
        prompts = prompts.filter(p => tags.every(tag => p.tags.includes(tag)));
    }

    return prompts;
  }
);
