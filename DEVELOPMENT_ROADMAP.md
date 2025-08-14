# roFl: Comprehensive Development Roadmap

This document outlines the strategic development plan for **roFl**, from its current state (MVP) to a feature-rich, production-ready application. It details the user journey, features, deliverables, completion status, and concrete steps required for implementation.

---

## 1. Product Vision & Core User Journey

**Product Description:** roFl is an intelligent, conversational workspace that captures, refines, and organizes unstructured ideas—from fleeting notes and chat logs to complex brainstorms—transforming them into structured, actionable, and visually connected knowledge.

### Core User Journey (The "Aha!" Moment)

1.  **Capture (Frictionless Input):** A user, Sarah, finishes a long chat session with an AI, resulting in a dozen scattered but valuable ideas for a new marketing campaign. Instead of copy-pasting snippets, she simply uploads the entire chat export file to roFl.
2.  **Analyze (Automated Structuring):** roFl's AI gets to work. It automatically identifies and extracts distinct items from the chat:
    *   **3 fully-formed prompts** for generating ad copy.
    *   **5 core product ideas** mentioned in the conversation.
    *   **4 key action items** for her team.
    *   It intelligently tags and categorizes everything (e.g., "Q3 Campaign," "Social Media," "Urgent").
3.  **Interact (Conversational Refinement):** Sarah reviews the extracted items in the chat UI. She tells roFl, "Combine the first two prompts and make the tone more professional." The AI merges them instantly. She then asks, "For the product ideas, generate a mind map showing how they relate to each other."
4.  **Visualize (Connected Knowledge):** An interactive mind map appears, with the central campaign idea at its core and the product ideas branching off. The prompts are linked to the relevant product idea nodes. Sarah can click any node to see the associated prompt or action item.
5.  **Organize & Act (The Library):** All structured assets (prompts, ideas, notes, mind maps) are now neatly organized and searchable in her library, ready to be edited, shared, or exported. The chaos of her raw notes has become a clear, actionable plan.

---

## 2. Development Phases & Feature Implementation

### Phase 1: MVP (85% Complete)

*   **Description:** An AI-powered, single-user tool for generating, analyzing, and managing a personal library of prompts. All data is stored in a persistent Firestore database.
*   **Status:** Most core features are implemented. The main remaining tasks are bug fixes, UI polish, and ensuring seamless state management.

| Feature                                | Status (Complete) | Files & Deliverables                                                                                                                                                                | Next Steps (to reach 100%)                                                                                                                                                 |
| -------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Conversational AI Assistant**        | 95%               | `/chat/page.tsx`, `ai/flows/conversational-chat-flow.ts`                                                                                                                            | Resolve any remaining serialization or chunking errors. Ensure all AI actions (`confirm_save`, etc.) are robustly handled by the client.                                    |
| **Batch Prompt Processor**             | 90%               | `/prompts/processor/page.tsx`, `ai/flows/process-unstructured-prompts.ts`                                                                                                           | Improve accuracy of prompt identification. Finalize UI for displaying results and saving them.                                                                             |
| **Interactive Prompt Generation**      | 90%               | `ai/flows/generate-prompt-template-flow.ts`, Integrated into `conversational-chat-flow.ts`                                                                                            | Refine the AI's ability to ask clarifying questions. Test and improve the quality of generated templates.                                                                  |
| **Prompt Library Dashboard**           | 80%               | `/prompts/**`, `components/PromptCard.tsx`, `components/PromptForm.tsx`                                                                                                               | **Critical:** Fix all state synchronization issues with `react-query`. Ensure UI is polished, responsive, and all filters work flawlessly. Complete navigation from the menu. |
| **AI Prompt Optimizer**                | 90%               | `/prompts/[id]/edit/page.tsx`, `components/PromptOptimizerDialog.tsx`, `ai/flows/optimize-prompt.ts`                                                                                    | Test with a wide variety of prompts to ensure suggestions are consistently high-quality.                                                                                   |
| **Firebase Firestore Integration**     | 75%               | `lib/firebase.ts`, `ai/tools/promptLibraryTool.ts`, all pages/components that interact with prompts.                                                                                  | **Critical:** Audit all Firestore queries for efficiency and security. Implement proper indexing. Replace *all* remaining uses of `mockPrompts.ts`.                        |
| **Frameless/Asymmetric UI**            | 85%               | `/chat/page.tsx`, `globals.css`, `Header.tsx`, `NavMenu.tsx`                                                                                                                        | Polish all pages (`/prompts`, `/prompts/new`, etc.) to match the frameless aesthetic for a cohesive experience. Ensure it is fully responsive.                               |
| **Global Navigation**                  | 70%               | `components/NavMenu.tsx`, `components/Header.tsx`, `app/layout.tsx`                                                                                                                 | Fully implement the menu functionality with correct links and state management.                                                                                          |

---

### Phase 2: Production-Ready Platform (0% Complete)

*   **Description:** A robust, secure, and multi-tenant web application that allows individual users to create and manage their own private knowledge libraries, with new import capabilities.
*   **Goal:** Move from a single-user tool to a professional-grade personal workspace.

| Feature                        | Status (Complete) | Files & Deliverables (New or Heavily Modified)                                                                                                                  | Implementation Steps                                                                                                                                                                                                    |
| ------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Firebase Authentication**      | 0%                | `hooks/use-auth.ts`, `app/login/page.tsx`, updates to `lib/firebase.ts` and all data-accessing components.                                                       | 1. Implement email/password and Google Sign-In. <br> 2. Create a protected route middleware. <br> 3. Update all Firestore security rules to be user-specific (`allow read, write: if request.auth.uid == resource.data.userId;`). |
| **Unified Knowledge Schema**     | 0%                | `lib/types.ts`, `lib/firebase.ts`                                                                                                                               | 1. Evolve the `Prompt` type into a generic `KnowledgeAsset` type. <br> 2. Add a `type` field (e.g., 'prompt', 'note', 'idea'). <br> 3. Update Firestore structure to store these unified assets in a single collection.         |
| **Apple Notes Importer**         | 0%                | `app/import/page.tsx`, `ai/flows/import-notes-flow.ts`, `components/ImportManager.tsx`                                                                          | 1. Design a UI for uploading `.zip` exports from Apple Notes. <br> 2. Create a Genkit flow to parse the HTML/text content. <br> 3. Use `processUnstructuredPrompts` logic to extract, title, and categorize each note. |
| **AI Chat Export Importer**      | 0%                | `app/import/page.tsx`, `ai/flows/import-chat-flow.ts`                                                                                                           | 1. Extend the importer to handle various chat formats (JSON, TXT). <br> 2. Create a new Genkit flow specifically trained to identify different conversational elements (prompts, questions, ideas, action items).        |

---

### Phase 3: The Intelligent Workspace (0% Complete)

*   **Description:** A collaborative, intelligent workspace for individuals and teams to build, share, and visualize interconnected knowledge systems, enhanced with AI-powered discovery and generation tools.
*   **Goal:** Evolve from a personal tool into a category-defining knowledge platform.

| Feature                           | Status (Complete) | Files & Deliverables (New or Heavily Modified)                                                                                                         | Implementation Steps                                                                                                                                                                                                                     |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AI-Generated Mind Maps**          | 0%                | `components/MindMap.tsx` (using a library like `react-flow`), `ai/flows/generate-mind-map-flow.ts`, new UI in chat and library to trigger generation.     | 1. Create a Genkit flow that takes a topic or set of assets and outputs a JSON structure representing a mind map (nodes, edges). <br> 2. Implement the `MindMap` component to render this JSON interactively. <br> 3. Save maps to Firestore. |
| **Semantic & Vector Search**        | 0%                | `ai/flows/generate-embeddings-flow.ts`, integration with a vector database service (e.g., Pinecone or Firestore Vector Search extension).                 | 1. Create a flow to generate vector embeddings for all knowledge assets. <br> 2. Set up a cloud function to automatically create embeddings for new/updated assets. <br> 3. Implement a search UI that queries the vector DB.  |
| **Team Workspaces & Collaboration** | 0%                | New Firestore collections for `workspaces` and `permissions`. UI for inviting members and managing roles.                                            | 1. Design the data model for shared libraries. <br> 2. Implement role-based access control (RBAC) in Firestore security rules. <br> 3. Build UI for creating workspaces and inviting users.                                      |
| **Prompt A/B Testing Module**       | 0%                | `app/testing/page.tsx`, `components/TestResultChart.tsx`, `ai/flows/run-prompt-test-flow.ts`                                                          | 1. Design a UI to input two prompt variants and a set of test inputs. <br> 2. Create a flow that runs both prompts against the LLM and asks the LLM to score the outputs based on given criteria. <br> 3. Visualize results.  |
| **Community Marketplace**           | 0%                | `app/marketplace/**`, new Firestore collections for `published_prompts`.                                                                               | 1. Build functionality to "publish" a prompt from a user's library. <br> 2. Create a public-facing marketplace to browse, search, and "fork" prompts into one's own library. <br> 3. Add voting and commenting features.      |
