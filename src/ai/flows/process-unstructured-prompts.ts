
'use server';
/**
 * @fileOverview An AI agent to process and structure a batch of unorganized prompts.
 *
 * - processUnstructuredPrompts - A function that takes a block of text, identifies individual prompts,
 *   and enriches them with titles, descriptions, categories, tags, quality analysis, and follow-up suggestions.
 * - ProcessUnstructuredPromptsInput - The input type for the function.
 * - ProcessUnstructuredPromptsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';


// Dynamically fetch categories from Firestore to provide to the AI.
async function getAvailableCategories(): Promise<string[]> {
    const promptsCollection = collection(db, 'prompts');
    const snapshot = await getDocs(promptsCollection);
    const categories = new Set<string>();
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
            categories.add(data.category);
        }
    });
    // Add some default categories in case the library is empty
    const defaultCategories = ["Writing", "Marketing", "Development", "Business", "Personal", "Uncategorized"];
    defaultCategories.forEach(cat => categories.add(cat));
    return Array.from(categories);
}


const ProcessUnstructuredPromptsInputSchema = z.object({
  unstructuredPrompts: z.string().describe('A block of text containing one or more unorganized prompts.'),
  availableCategories: z.array(z.string()).describe('A list of existing categories to guide AI suggestions.'),
});
export type ProcessUnstructuredPromptsInput = z.infer<typeof ProcessUnstructuredPromptsInputSchema>;

const ProcessedPromptSchema = z.object({
  generatedTitle: z.string().describe('Generated concise and descriptive title for the prompt (max 10 words).'),
  identifiedPrompt: z.string().describe('The extracted core prompt text.'),
  description: z.string().describe('A short description of the prompt (1-2 sentences) explaining its purpose.'),
  suggestedCategory: z.string().describe('Suggested relevant category for the prompt.'),
  suggestedTags: z.array(z.string()).describe('3-5 relevant lowercase tags.'),
  qualityAnalysis: z.string().describe('Qualitative grade (e.g., "Excellent", "Good", "Fair", "Needs Improvement") and 2-3 specific, actionable improvement suggestions.'),
  followUpPromptSuggestion: z.string().optional().describe('Optional: Suggestion for a follow-up prompt or system connection if applicable.'),
});

const ProcessUnstructuredPromptsOutputSchema = z.object({
  processedPrompts: z.array(ProcessedPromptSchema).describe('An array of processed prompt objects.'),
});
export type ProcessUnstructuredPromptsOutput = z.infer<typeof ProcessUnstructuredPromptsOutputSchema>;

export async function processUnstructuredPrompts(input: { unstructuredPrompts: string }): Promise<ProcessUnstructuredPromptsOutput> {
  const availableCategories = await getAvailableCategories();
  return processUnstructuredPromptsFlow({ unstructuredPrompts: input.unstructuredPrompts, availableCategories });
}

const prompt = ai.definePrompt({
  name: 'processUnstructuredPromptsPrompt',
  input: {schema: ProcessUnstructuredPromptsInputSchema},
  output: {schema: ProcessUnstructuredPromptsOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing and structuring LLM prompts.
The user has provided a block of text containing one or more unorganized prompts. Your primary task is to find and extract text that is clearly intended to be a prompt for an AI. Ignore conversational text, notes, or meta-commentary. A prompt is a direct instruction to an AI.

Your task is to process this text and for each distinct prompt you identify:
1.  Extract the core prompt text. A prompt is an instruction intended for an LLM. It often contains placeholders like {{variable}}.
2.  Generate a concise and descriptive title for the prompt (max 10 words).
3.  Generate a brief description for the prompt (1-2 sentences) explaining its purpose.
4.  Suggest a relevant category for the prompt. You can use one from the provided available categories if it fits well, or suggest a new single-word category. Available categories: {{#each availableCategories}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}.
5.  Suggest 3-5 relevant tags (lowercase).
6.  Provide a quality analysis:
    *   Assign a qualitative grade (e.g., "Excellent", "Good", "Fair", "Needs Improvement").
    *   Offer 2-3 specific, actionable suggestions for how the prompt could be improved for clarity, effectiveness, or to get better results from an LLM. Combine the grade and suggestions into a single string.
7.  If the prompt seems like it could be part of a sequence or system with other prompts (either in the input or as a logical follow-up), briefly suggest a potential follow-up prompt or how it could connect to a larger system. If not applicable, make this field empty or omit it.

Input Text:
{{{unstructuredPrompts}}}

Return your response as a JSON object containing a key "processedPrompts" which is an array of objects. Each object in the array represents a processed prompt and follows this structure:
{
  "generatedTitle": "Generated title for the prompt",
  "identifiedPrompt": "The extracted prompt text",
  "description": "A short description of the prompt",
  "suggestedCategory": "Suggested category",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "qualityAnalysis": "Grade: [Your Grade]. Suggestions: [Suggestion 1]. [Suggestion 2].",
  "followUpPromptSuggestion": "Optional: Suggestion for a follow-up prompt or system connection."
}

Ensure that only text that looks like an actual command or instruction to an LLM is extracted. If the input text is empty or contains no discernible prompts, return an empty array for "processedPrompts".
Focus on extracting and improving actual prompts. Ignore any surrounding text that is not part of a prompt.
Be careful with escaping characters in the JSON output, especially within the prompt texts.
`,
});

const processUnstructuredPromptsFlow = ai.defineFlow(
  {
    name: 'processUnstructuredPromptsFlow',
    inputSchema: ProcessUnstructuredPromptsInputSchema,
    outputSchema: ProcessUnstructuredPromptsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
        // Handle cases where the model might return nothing or an unexpected format
        // For now, return an empty array, but consider more robust error handling or logging
        return { processedPrompts: [] };
    }
    // Ensure the output structure matches, especially if the AI might omit processedPrompts for empty results.
    return output.processedPrompts ? output : { processedPrompts: [] };
  }
);
