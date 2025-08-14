## PROMPT 3: Prompt Generator for Feature Implementation

This file contains a series of comprehensive prompts for implementing specific features in the "roFl" Firebase platform. Each prompt is designed to be given to Claude Code to generate the necessary code and configuration.

---

### **1. User Profile Edit**

**TITLE**: User Profile Edit Implementation Prompt

**EXACT DELIVERABLES**:
*   A new page at `/app/profile/page.tsx` for users to edit their profile.
*   A new reusable component `/src/components/ProfileForm.tsx`.
*   Server-side functions in `/src/lib/firebase.ts` to get and update user data.
*   Updated Firestore Security Rules in `firestore.rules` to protect user data.
*   A new data type `UserProfile` defined in `/src/lib/types.ts`.

**SUCCESS METRICS**:
*   **Functional**: An authenticated user can navigate to the profile page, view their current data, update their display name and bio, and see the changes persist after a page refresh.
*   **Security**: A user can only read and write their own profile data. Unauthorized attempts are blocked by Firestore rules.
*   **Quality**: The form includes validation (e.g., display name is required) and provides clear feedback for errors and successful updates. Zero TypeScript errors.

**PROMPT TEMPLATE**:

ROLE: Senior Full-Stack Engineer, Firebase Specialist

CONTEXT:
You are adding a user profile editing feature to "roFl", a Next.js 15 application. The app uses Firebase Firestore for the database, Firebase Authentication, and shadcn/ui for components. State management is handled with React Query.

DEVELOPMENT STANDARDS:
*   Language: TypeScript with strict mode.
*   UI: Use existing shadcn/ui components (`Input`, `Label`, `Button`, `Card`).
*   State: Use React Query for fetching and mutations, with optimistic updates for a better user experience.
*   Database: Firestore, with data structured in a `users` collection.
*   Auth: Assume Firebase Auth is configured and a user is signed in.
*   Forms: Use `react-hook-form` with `Zod` for validation.

IMPLEMENTATION STRATEGY:

1.  **Foundation Setup**
    *   In `/src/lib/types.ts`, define a `UserProfile` type with `uid` (string), `displayName` (string), `email` (string), and `bio` (optional string).
    *   In `/src/lib/firebase.ts`, create two functions:
        *   `getUserProfile(uid: string): Promise<UserProfile>`
        *   `updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void>`

2.  **Core Implementation**
    *   Create `/src/components/ProfileForm.tsx`. This component will:
        *   Use `react-hook-form` and a Zod schema for validation.
        *   Accept the user's current profile data as a prop.
        *   Use `useMutation` from React Query to call the `updateUserProfile` function.
        *   Display a loading state on the button while submitting.
        *   Use the `use-toast` hook to show a success or error message.
    *   Create the page `/src/app/profile/page.tsx`. This page will:
        *   Be a client component (`'use client'`).
        *   Get the current user's UID from the Firebase Auth context.
        *   Use `useQuery` from React Query to fetch the user's profile with `getUserProfile`.
        *   Display a skeleton loader while the data is being fetched.
        *   Render the `ProfileForm` component with the fetched data.

3.  **Firebase Integration**
    *   Update `firestore.rules` to add rules for the `users` collection:
        ```rules
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        ```

SECURITY CHECKLIST:
*   [ ] Firebase security rules restrict access to the authenticated user.
*   [ ] Input sanitization is handled by Firestore's client library.
*   [ ] The user's UID is sourced from the server-side auth context, not from the client.

SELF-VALIDATION PROTOCOL:
1.  Navigate to the `/profile` page and confirm the form loads with the user's data.
2.  Successfully update the display name and bio.
3.  Attempt to submit the form with an empty display name and confirm validation works.
4.  Use the Firestore Rules Emulator to verify that a user cannot read or write another user's profile.

---

### **2. Chat Message with RAG**

**TITLE**: Chat Message with RAG Implementation Prompt

**EXACT DELIVERABLES**:
*   A new Genkit flow `/src/ai/flows/rag-chat-flow.ts` that performs Retrieval-Augmented Generation.
*   Modifications to the chat page at `/src/app/chat/page.tsx` to use the new flow.
*   A Cloud Function to generate embeddings for new prompts added to the library.
*   A Firestore vector index configuration in `firestore.indexes.json`.

**SUCCESS METRICS**:
*   **Functional**: When a user asks a question in the chat, the system finds relevant prompts from their library and uses them as context to provide a more accurate and informed answer.
*   **Performance**: The RAG process (embedding, search, and generation) completes in under 3 seconds.
*   **Quality**: Answers generated with RAG are demonstrably more relevant to the user's stored prompts than answers from the non-RAG chat flow.

**PROMPT TEMPLATE**:

ROLE: Senior AI Engineer, Firebase Specialist

CONTEXT:
You are upgrading the existing chat feature in "roFl" to use RAG. The goal is to make the chat context-aware by retrieving relevant information from the user's saved prompts in Firestore. The project uses Genkit for AI flows and Firebase Firestore for data, which supports vector search.

DEVELOPMENT STANDARDS:
*   Language: TypeScript with strict mode.
*   AI: Use Google's `text-embedding-004` for embeddings and `gemini-1.5-flash` for generation within Genkit.
*   Database: Use Firebase Firestore with its native vector search capabilities.
*   Dependencies: `firebase-functions`, `firebase-admin`, `@google-cloud/firestore`.

IMPLEMENTATION STRATEGY:

1.  **Foundation Setup (Firebase)**
    *   In a new file, `/src/ai/embed.ts`, create a Cloud Function (`onPromptWritten`) triggered by `onWrite` on documents in the `prompts` collection.
    *   This function will:
        *   Initialize the `VertexAI` client.
        *   Get the text content from the prompt document.
        *   Generate a vector embedding for the content using the embedding model.
        *   Write the embedding back to the prompt document in a field named `embedding`.
    *   In `firestore.indexes.json`, define a vector index for the `prompts` collection on the `embedding` field.

2.  **Core Implementation (Genkit Flow)**
    *   Create the file `/src/ai/flows/rag-chat-flow.ts`.
    *   Define a new Genkit flow `ragChatFlow`. This flow will:
        *   Accept a user's query (string) and `uid` (string) as input.
        *   Generate an embedding for the user's query.
        *   Query the `prompts` collection in Firestore, filtering by the user's `uid`, and use the `findNearest` vector search operator to find the top 3 most relevant prompts.
        *   Construct a new context string containing the user's query and the content of the retrieved prompts.
        *   Call the Gemini model with a system prompt instructing it to answer the query based on the provided context.
        *   Return the model's response.

3.  **Frontend Integration**
    *   In `/src/app/chat/page.tsx`:
        *   Modify the form submission handler to call the new `ragChatFlow` instead of the old `conversational-chat-flow`.
        *   Pass the user's query and UID to the flow.

SECURITY CHECKLIST:
*   [ ] The Cloud Function only processes prompts for the authenticated user context if applicable.
*   [ ] Firestore security rules for the `prompts` collection must prevent users from reading each other's prompts.
*   [ ] The vector search query in the Genkit flow must be filtered by the current user's `uid`.

SELF-VALIDATION PROTOCOL:
1.  Add a few distinct prompts to your library. Deploy the `onPromptWritten` function and verify in the Firestore console that the `embedding` field is populated for each.
2.  Ask a question in the chat that is directly related to one of your saved prompts.
3.  Verify that the answer is context-aware and incorporates information from the relevant prompt.
4.  Ask a generic question and verify the flow still provides a coherent answer.

---

### **3. Prompt Versioning**

**TITLE**: Prompt Versioning Implementation Prompt

**EXACT DELIVERABLES**:
*   Modifications to the prompt creation/editing logic to support versioning.
*   A new sub-collection `versions` for each prompt document in Firestore.
*   A new UI component `/src/components/PromptVersionHistory.tsx` to display the version history.
*   An API route or server action to revert a prompt to a previous version.

**SUCCESS METRICS**:
*   **Functional**: Every time a user saves a change to a prompt, a new version is created. Users can view a list of all previous versions and revert the prompt to any selected version.
*   **Data Integrity**: Reverting to an old version does not delete the version history. It creates a new version based on the old one.
*   **Quality**: The UI for version history is clear and easy to navigate.

**PROMPT TEMPLATE**:

ROLE: Senior Full-Stack Engineer

CONTEXT:
You are adding a version history feature to the prompt editing process in "roFl". Currently, saving a prompt overwrites the existing data. The new implementation should preserve a log of all changes in a sub-collection in Firestore.

DEVELOPMENT STANDARDS:
*   Language: TypeScript with strict mode.
*   Database: Firestore. The data model will change to support versions.
*   UI: Use shadcn/ui components (`Dialog`, `Table`, `Button`) to build the history viewer.
*   State: Use React Query to fetch version history.

IMPLEMENTATION STRATEGY:

1.  **Firestore Data Model**
    *   The top-level `prompts` document will always contain the *latest* version of the prompt for fast reads.
    *   A new sub-collection, `prompts/{promptId}/versions`, will store historical versions. Each document in this collection will have a `versionNumber`, `createdAt` timestamp, and the full prompt data for that version.

2.  **Backend Logic (Firebase Service)**
    *   In `/src/lib/firebase.ts`, modify the `updatePrompt` function.
    *   The function should now use a Firestore transaction:
        1.  Read the current prompt document to get the current `versionNumber`.
        2.  Create a new document in the `versions` sub-collection with the *current* data and the incremented version number.
        3.  Update the main `prompts` document with the *new* data and the incremented version number.
    *   Create a new function `getPromptVersions(promptId: string)` that retrieves all documents from the `versions` sub-collection.
    *   Create a `revertToVersion(promptId: string, versionId: string)` function that reads a specific version, and then calls `updatePrompt` with that old data, creating a new version.

3.  **Frontend Implementation**
    *   Create `/src/components/PromptVersionHistory.tsx`. This component will:
        *   Take a `promptId` as a prop.
        *   Use `useQuery` to fetch the version history using `getPromptVersions`.
        *   Display the versions in a table with columns for version number, creation date, and a "Revert" button.
        *   When "Revert" is clicked, it will call a mutation that executes the `revertToVersion` function.
    *   In the prompt editing page (`/src/app/prompts/[id]/edit/page.tsx`), add a "History" button that opens the `PromptVersionHistory` component in a dialog.

SECURITY CHECKLIST:
*   [ ] Firestore security rules must ensure that a user can only write to the `versions` sub-collection of prompts they own.
*   [ ] Reverting a prompt must also be protected by the same ownership rules.

SELF-VALIDATION PROTOCOL:
1.  Edit and save a prompt multiple times.
2.  Open the version history and verify that a new version was created for each save.
3.  Revert the prompt to a previous version.
4.  Verify that the main prompt content is updated and that a *new* version (a copy of the old one) has been added to the history.
