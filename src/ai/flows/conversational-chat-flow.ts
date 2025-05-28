
'use server';
/**
 * @fileOverview A conversational AI flow that can also process unstructured prompts.
 *
 * - conversationalChat - Handles user input, either generating an AI response or processing prompts.
 * - ConversationalChatInput - The input type for the flow.
 * - ConversationalChatOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { processUnstructuredPrompts, type ProcessUnstructuredPromptsOutput } from '@/ai/flows/process-unstructured-prompts';
import { generatePromptTemplate, type GeneratePromptTemplateOutput } from '@/ai/flows/generate-prompt-template-flow';
import { mockPrompts, addMockPrompt } from '@/lib/mockPrompts';
import type { Prompt, ProcessedPromptData } from '@/lib/types';
import { getPromptsTool } from '@/ai/tools/promptLibraryTool';


const ConversationalChatInputSchema = z.object({
  userInput: z.string().describe('The text input from the user.'),
});
export type ConversationalChatInput = z.infer<typeof ConversationalChatInputSchema>;

const PromptToSaveDataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  template: z.string(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const ConversationalChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI-generated response to the user input.'),
  action: z.enum(['save_prompt', 'list_prompts', 'generate_prompt_template_form', 'confirm_prompt_template_generation']).optional(),
  promptToSaveData: PromptToSaveDataSchema.optional().describe('Data for a prompt to be saved if the action is save_prompt.'),
  // for generate_prompt_template_form action
  promptGenerationFormFields: z.array(z.object({name: z.string(), label: z.string(), type: z.string() })).optional(),
});
export type ConversationalChatOutput = z.infer<typeof ConversationalChatOutputSchema>;


// Thresholds for detecting if input is a batch of prompts
const PROMPT_BATCH_MIN_LENGTH = 200;
const PROMPT_BATCH_MIN_NEWLINES = 1;

function formatProcessedPromptsForChat(processedPrompts: ProcessedPromptData[]): string {
  if (!processedPrompts || processedPrompts.length === 0) {
    return "I tried to process the text you sent, but I couldn't identify any distinct prompts. You can try rephrasing or adding more details. Or, ask me to create a new prompt!";
  }

  let response = `I've analyzed your text and found ${processedPrompts.length} potential prompt(s):\n\n`;
  processedPrompts.forEach((prompt, index) => {
    response += `📝 **Prompt ${index + 1}: ${prompt.generatedTitle}**\n`;
    response += `   Identified Text: "${prompt.identifiedPrompt}"\n`;
    response += `   Description: ${prompt.description}\n`;
    response += `   Category: ${prompt.suggestedCategory}\n`;
    response += `   Tags: ${prompt.suggestedTags.join(', ')}\n`;
    response += `   💡 Quality & Suggestions: ${prompt.qualityAnalysis}\n`;
    if (prompt.followUpPromptSuggestion) {
      response += `   🔗 Follow-up Idea: ${prompt.followUpPromptSuggestion}\n`;
    }
    response += `\n`;
  });
  response += "Let me know if you'd like to save any of these or refine them further!";
  return response;
}

export async function conversationalChat(input: ConversationalChatInput): Promise<ConversationalChatOutput> {
  const containsNewlines = (input.userInput.match(/\n/g) || []).length >= PROMPT_BATCH_MIN_NEWLINES;

  if (input.userInput.length > PROMPT_BATCH_MIN_LENGTH && containsNewlines) {
    try {
      const processingResult: ProcessUnstructuredPromptsOutput = await processUnstructuredPrompts({ unstructuredPrompts: input.userInput });
      const formattedResponse = formatProcessedPromptsForChat(processingResult.processedPrompts);
      return { aiResponse: formattedResponse };
    } catch (error) {
      console.error("Error calling processUnstructuredPrompts flow from conversationalChat:", error);
      if (error instanceof Error && error.message.includes('503')) {
        return { aiResponse: "roFl's AI brain (Gemini) is a bit busy right now. Please try again in a moment!" };
      }
      return { aiResponse: "I encountered an error while trying to process your prompts. Please try again, or ask me something else." };
    }
  } else {
    // Regular conversational input or command to generate/save prompt
    try {
        const result = await conversationalChatFlow(input);
        // If the AI decided to save a prompt, it will have populated promptToSaveData
        // We then call addMockPrompt here.
        if (result.action === 'save_prompt' && result.promptToSaveData) {
            const { name, description, template, tags, category } = result.promptToSaveData;
            if (name && template) { // Ensure essential fields are present
                const newPrompt = addMockPrompt({
                    name,
                    description: description || `Generated by roFl on ${new Date().toLocaleDateString()}`,
                    template,
                    tags: tags || [],
                    category: category || 'Uncategorized'
                });
                // Return the full newPrompt object, including id and timestamps
                return { ...result, promptToSaveData: newPrompt };
            } else {
                // AI decided to save, but didn't provide enough info. Fallback.
                return {aiResponse: "I was about to save that, but I'm missing some key details. Could you clarify the prompt name and template?"};
            }
        }
        return result;
    } catch (error) {
        console.error("Error in conversationalChatFlow or subsequent processing:", error);
        if (error instanceof Error && error.message.includes('503')) {
          return { aiResponse: "roFl's AI brain (Gemini) is a bit busy right now. Please try again in a moment!" };
        }
        return { aiResponse: "I'm having a little trouble thinking right now. Please try again in a moment." };
    }
  }
}

const llmPrompt = ai.definePrompt({
  name: 'conversationalChatPrompt',
  input: {schema: ConversationalChatInputSchema},
  output: {schema: ConversationalChatOutputSchema},
  tools: [getPromptsTool, generatePromptTemplate],
  prompt: `You are roFl, a witty, highly intelligent, and slightly irreverent AI assistant for managing and optimizing LLM prompts. Your primary goal is to help users create, refine, organize, and find prompts.

  Conversation Style:
  - Be friendly, engaging, and concise.
  - Use your "roFl" persona: intelligent, a bit cheeky, but always helpful.
  - Keep responses focused on the user's prompt-related tasks.

  Core Capabilities:
  1.  **Conversational Interaction:** Engage in general conversation about prompts.
  2.  **Prompt Generation:**
      *   If the user expresses a need for a new prompt (e.g., "help me make a prompt to write emails," "I need a prompt for X"), initiate a process to help them.
      *   Ask clarifying questions to understand:
          *   The *purpose* of the prompt.
          *   The key *inputs* or `{{variables}}` it will need.
          *   A description of the *desired output*.
          *   Any other `additionalContext` (e.g., tone, audience, specific constraints).
      *   Once you have sufficient details, call the 'generatePromptTemplate' tool with this information.
      *   Present the generated template, suggested name, and explanation clearly to the user.
      *   Example: "Alright, based on what you told me, here's a draft: [template] - I've called it '[suggestedName]'. It's designed to [explanation]. What do you think? Shall I save it?"
  3.  **Saving Prompts:**
      *   If the user asks to save a prompt (either one you just generated, one they typed, or one from a processed batch):
          *   Confirm the prompt template text and a name for it.
          *   If not already clear, ask for a brief description, a category (e.g., "Writing", "Marketing", "Code", "Business", "Personal", or suggest a new one), and a few comma-separated tags.
          *   Then, set the 'action' field in your output to 'save_prompt' and populate the 'promptToSaveData' object with all these details (name, template, description, tags, category).
          *   Your 'aiResponse' string should confirm the action, e.g., "Okay, I've saved '[Prompt Name]' to your library under '[Category]' with tags: [tags]."
  4.  **Listing/Suggesting Prompts:**
      *   If the user asks to see their prompts (e.g., "show my prompts," "list marketing prompts," "find prompts for email"), use the 'getPromptsTool'. You can filter by category or tags.
      *   Format the list of prompts nicely in your 'aiResponse'. For each prompt, include its name, description, and perhaps its category and main tags.
      *   **Proactive Suggestions:** If the user describes a task (e.g., "I need to summarize a long document"), consider using 'getPromptsTool' to find relevant existing prompts. If you find good matches, suggest them, e.g., "I found a prompt called 'Meeting Summary Generator' that might be useful for summarizing. Would you like to see it?"
  5.  **Batch Prompt Processing:** (This is handled by the calling function if the input is very long and multi-line. You don't need to explicitly trigger this here, but be aware it's a capability of the system.)

  User's current input:
  {{userInput}}
  `,
});

const conversationalChatFlow = ai.defineFlow(
  {
    name: 'conversationalChatFlowInternal',
    inputSchema: ConversationalChatInputSchema,
    outputSchema: ConversationalChatOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await llmPrompt(input);
      if (!output) {
          return { aiResponse: "Hmm, my circuits are a bit tangled right now. Try that again?" };
      }
      return output;
    } catch (error) {
      console.error("Error in conversationalChatFlowInternal (llmPrompt call):", error);
      // Check if the error message indicates a 503 or similar network/overload issue from Google
      if (error instanceof Error && (error.message.includes('503') || error.message.toLowerCase().includes('service unavailable') || error.message.toLowerCase().includes('model is overloaded'))) {
        return { aiResponse: "roFl's AI brain (Gemini) seems to be overwhelmed or taking a quick nap. Please try your request again in a moment!" };
      }
      // For other errors, provide a more generic message
      return { aiResponse: "I hit a snag trying to process that. Could you try rephrasing or asking again in a bit?" };
    }
  }
);
