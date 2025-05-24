
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
import type { ProcessedPromptData } from '@/lib/types'; // Ensure this type is imported if not already

const ConversationalChatInputSchema = z.object({
  userInput: z.string().describe('The text input from the user.'),
});
export type ConversationalChatInput = z.infer<typeof ConversationalChatInputSchema>;

const ConversationalChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI-generated response to the user input.'),
});
export type ConversationalChatOutput = z.infer<typeof ConversationalChatOutputSchema>;

// Thresholds for detecting if input is a batch of prompts
const PROMPT_BATCH_MIN_LENGTH = 200; // Adjusted min characters
const PROMPT_BATCH_MIN_NEWLINES = 1; // Minimum newline characters

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
    // Likely a batch of prompts, attempt to process them
    try {
      const processingResult: ProcessUnstructuredPromptsOutput = await processUnstructuredPrompts({ unstructuredPrompts: input.userInput });
      const formattedResponse = formatProcessedPromptsForChat(processingResult.processedPrompts);
      return { aiResponse: formattedResponse };
    } catch (error) {
      console.error("Error calling processUnstructuredPrompts flow from conversationalChat:", error);
      return { aiResponse: "I encountered an error while trying to process your prompts. Please try again, or ask me something else." };
    }
  } else {
    // Regular conversational input
    return conversationalChatFlow(input);
  }
}

const llmPrompt = ai.definePrompt({
  name: 'conversationalChatPrompt',
  input: {schema: ConversationalChatInputSchema},
  output: {schema: ConversationalChatOutputSchema},
  prompt: `You are roFl, a witty and highly intelligent assistant for managing and optimizing LLM prompts.
Engage in a friendly, slightly irreverent, yet helpful conversation. Assist the user with their prompt-related tasks.
Keep your responses concise, insightful, and embody the 'roFl' persona.
The user said: {{userInput}}`,
});

const conversationalChatFlow = ai.defineFlow(
  {
    name: 'conversationalChatFlowInternal',
    inputSchema: ConversationalChatInputSchema,
    outputSchema: ConversationalChatOutputSchema,
  },
  async (input) => {
    const {output} = await llmPrompt(input);
    if (!output) {
        return { aiResponse: "Hmm, my circuits are a bit tangled right now. Try that again?" };
    }
    return output;
  }
);
