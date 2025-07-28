# Project Documentation: roFl - AI Prompt Engineering Assistant

## 1. User Flow

The user flow is centered around two primary activities: conversational interaction with the AI and direct management of the prompt library.

**Flow 1: Conversational Prompt Creation & Management (Primary)**

1.  **Start:** User lands on the `/chat` page.
2.  **Greet:** The AI ("roFl") sends a welcome message.
3.  **Interaction (User's Choice):**
    *   **List Prompts:** User asks to see existing prompts (e.g., "show my prompts"). The AI uses a tool to fetch and display them.
    *   **Generate New Prompt:** User asks for help creating a prompt (e.g., "I need a prompt for writing blog posts").
        *   The AI asks clarifying questions (purpose, inputs, output).
        *   User provides answers.
        *   The AI uses a tool (`generatePromptTemplate`) to create a template and suggests it to the user.
    *   **Process Unstructured Text:** User pastes a block of raw notes or ideas.
        *   The AI detects the long-form input and triggers the `processUnstructuredPrompts` flow.
        *   The AI returns a structured analysis of each potential prompt found in the text.
    *   **Save Prompt:** Following a generation or analysis, the user asks to save a prompt.
        *   The AI confirms the details (name, category, tags).
        *   The AI uses its internal logic to save the prompt to the mock library.
        *   The AI confirms the save action to the user.
4.  **Loop:** The user can continue the conversation, seamlessly moving between these actions.

**Flow 2: Direct Library Management**

1.  **Navigate:** User (potentially through a link not yet present in the chat UI) navigates to `/prompts`.
2.  **View:** User sees a dashboard of all saved prompts.
3.  **Filter/Search:** User uses UI controls to find specific prompts.
4.  **Actions:**
    *   **Create:** User clicks "New Prompt" and is taken to `/prompts/new` to fill out a form.
    *   **Edit:** User clicks "Edit" on a prompt card and is taken to `/prompts/[id]/edit`.
        *   On this page, the user can use the "Optimize with AI" feature.
    *   **Delete:** User clicks "Delete" on a prompt card, confirms in a dialog, and the prompt is removed.
    *   **Export:** User clicks "Export" to download a JSON file of the prompt.

## 2. Information Architecture

The IA is simple, with two main sections reflecting the user flows.

-   **/chat:** The conversational hub. All primary AI-driven interactions happen here. It's the core of the application experience.
-   **/prompts:** The library management hub.
    -   `/prompts`: The main dashboard view.
    -   `/prompts/new`: The creation form.
    -   `/prompts/[id]/edit`: The editing form.
    -   `/prompts/processor`: A utility page for batch processing, whose logic is also integrated into the main chat flow.

## 3. Tech Stack

-   **Framework:** Next.js (with App Router)
-   **Language:** TypeScript
-   **UI Library:** React
-   **Styling:** Tailwind CSS
-   **UI Components:** ShadCN/UI
-   **AI/Generative Toolkit:** Genkit
-   **Backend AI Model:** Google Gemini (specifically `gemini-2.0-flash`)
-   **Icons:** `lucide-react`
-   **Forms:** `react-hook-form` with `zod` for validation.

## 4. Project Structure & File Use

```
.
├── src
│   ├── ai
│   │   ├── flows/
│   │   │   ├── conversational-chat-flow.ts   # Core logic for the main AI chat assistant.
│   │   │   ├── generate-prompt-template-flow.ts # Genkit flow to generate new prompt templates.
│   │   │   ├── optimize-prompt.ts            # Genkit flow to optimize an existing prompt.
│   │   │   └── process-unstructured-prompts.ts # Genkit flow to analyze and structure raw text.
│   │   ├── tools/
│   │   │   └── promptLibraryTool.ts          # Genkit tool for the AI to fetch prompts from the library.
│   │   ├── dev.ts                            # Entry point for running Genkit in development.
│   │   └── genkit.ts                         # Genkit configuration and initialization.
│   ├── app
│   │   ├── chat/
│   │   │   └── page.tsx                      # The main chat interface component.
│   │   ├── prompts
│   │   │   ├── [id]/edit/page.tsx            # Edit page for a single prompt.
│   │   │   ├── new/page.tsx                  # Creation page for a new prompt.
│   │   │   ├── processor/page.tsx            # Standalone UI for the prompt processor.
│   │   │   └── page.tsx                      # The prompt library dashboard page.
│   │   ├── globals.css                       # Global styles and ShadCN theme variables.
│   │   ├── layout.tsx                        # Root layout for the application.
│   │   └── page.tsx                          # Root page, redirects to /chat.
│   ├── components
│   │   ├── ui/                               # ShadCN UI components (button, card, etc.). Unlisted for brevity.
│   │   ├── MobileHeader.tsx                  # (No use) Relic from a previous layout. Can be deleted.
│   │   ├── ProcessedPromptCard.tsx           # UI card to display a single analyzed prompt from the processor.
│   │   ├── PromptCard.tsx                    # UI card to display a single library prompt on the dashboard.
│   │   ├── PromptForm.tsx                    # The main form component for creating/editing prompts.
│   │   └── PromptOptimizerDialog.tsx         # Dialog component for the AI prompt optimization feature.
│   ├── hooks
│   │   ├── use-mobile.tsx                    # (No use) Relic from a previous layout.
│   │   └── use-toast.ts                      # Hook for managing and displaying toast notifications.
│   └── lib
│       ├── mockPrompts.ts                    # **(Mock Code)** In-memory "database" for prompts.
│       ├── types.ts                          # Core TypeScript types and Zod schemas.
│       └── utils.ts                          # Utility functions (e.g., `cn` for Tailwind class merging).
└── tailwind.config.ts                        # Tailwind CSS configuration.
```

## 5. Mock or Pseudo Code Identification

-   **`src/lib/mockPrompts.ts`:** This is the most significant piece of non-production code. It acts as a temporary, in-memory database. In a production application, this would be replaced with a real database service (e.g., Firestore) to persist user data. All functions that rely on this file (`getPromptsTool`, `addMockPrompt`) are therefore not fully production-ready.
-   **Client-side State Management in `/prompts/page.tsx` and `/chat/page.tsx`:** The prompt data is fetched once and then managed in React state. A production app would use a more robust data-fetching and caching strategy (like React Query or SWR) connected to a real backend.

## 6. Potential Development Problems

1.  **Data Persistence:** The biggest issue. Without a real database, all created prompts are lost when the server restarts. The top priority for "productionizing" this app is to integrate a database like Firestore.
2.  **Authentication:** There is currently no user authentication. All users share the same prompt library. Implementing Firebase Auth is a critical next step to create a multi-tenant application.
3.  **State Synchronization:** The `/chat` page and the `/prompts` dashboard do not share state. If you save a prompt in the chat and then navigate to the dashboard, you won't see the new prompt without a page refresh. A shared state management solution or a robust data-fetching library is needed.
4.  **No Navigational Links:** There is no easy way to navigate between the `/chat` interface and the `/prompts` dashboard. A navigation bar or sidebar is required for better usability.
