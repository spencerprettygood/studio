import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { PromptForm } from '../PromptForm';
import { generateMockPrompt } from '@/test/test-utils';

// Mock Firebase operations
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn().mockResolvedValue({ id: 'new-prompt-id' }),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  collection: vi.fn(),
  doc: vi.fn(),
  Timestamp: {
    now: vi.fn().mockReturnValue({ toDate: () => new Date() }),
  },
}));

describe('PromptForm', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter);
  });

  describe('Create Mode', () => {
    it('renders empty form in create mode', () => {
      render(<PromptForm />);

      expect(screen.getByText('Create New Prompt')).toBeInTheDocument();
      expect(screen.getByLabelText(/Prompt Name/i)).toHaveValue('');
      expect(screen.getByLabelText(/Description/i)).toHaveValue('');
      expect(screen.getByLabelText(/Prompt Template/i)).toHaveValue('');
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      render(<PromptForm />);

      const submitButton = screen.getByRole('button', { name: /Create Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('validates field lengths', async () => {
      const user = userEvent.setup();
      render(<PromptForm />);

      const nameInput = screen.getByLabelText(/Prompt Name/i);
      const descInput = screen.getByLabelText(/Description/i);
      const templateInput = screen.getByLabelText(/Prompt Template/i);

      await user.type(nameInput, 'ab'); // Too short
      await user.type(descInput, 'short'); // Too short
      await user.type(templateInput, 'tiny'); // Too short

      const submitButton = screen.getByRole('button', { name: /Create Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 3 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/Description must be at least 10 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/Prompt template must be at least 10 characters/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      const { addDoc } = await import('firebase/firestore');
      
      render(<PromptForm />);

      await user.type(screen.getByLabelText(/Prompt Name/i), 'Test Prompt Name');
      await user.type(screen.getByLabelText(/Description/i), 'This is a test description for the prompt');
      await user.type(screen.getByLabelText(/Prompt Template/i), 'This is a test template with {{variable}}');
      await user.type(screen.getByLabelText(/Tags/i), 'test, automation, vitest');

      const submitButton = screen.getByRole('button', { name: /Create Prompt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(addDoc).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith('/prompts');
      });
    });

    it('handles tags input correctly', async () => {
      const user = userEvent.setup();
      render(<PromptForm />);

      const tagsInput = screen.getByLabelText(/Tags/i);
      await user.type(tagsInput, 'tag1, tag2, tag3');

      expect(tagsInput).toHaveValue('tag1, tag2, tag3');
    });

    it('opens optimizer dialog when button clicked', async () => {
      const user = userEvent.setup();
      render(<PromptForm />);

      // First add some template text
      const templateInput = screen.getByLabelText(/Prompt Template/i);
      await user.type(templateInput, 'This is a template to optimize');

      const optimizeButton = screen.getByRole('button', { name: /Optimize with AI/i });
      await user.click(optimizeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('disables optimize button when template is empty', () => {
      render(<PromptForm />);

      const optimizeButton = screen.getByRole('button', { name: /Optimize with AI/i });
      expect(optimizeButton).toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    const mockPrompt = generateMockPrompt();

    it('renders form with existing data in edit mode', () => {
      render(<PromptForm initialData={mockPrompt} isEditing={true} />);

      expect(screen.getByText('Edit Prompt')).toBeInTheDocument();
      expect(screen.getByLabelText(/Prompt Name/i)).toHaveValue(mockPrompt.name);
      expect(screen.getByLabelText(/Description/i)).toHaveValue(mockPrompt.description);
      expect(screen.getByLabelText(/Prompt Template/i)).toHaveValue(mockPrompt.template);
    });

    it('updates existing prompt', async () => {
      const user = userEvent.setup();
      const { updateDoc } = await import('firebase/firestore');
      
      render(<PromptForm initialData={mockPrompt} isEditing={true} />);

      const nameInput = screen.getByLabelText(/Prompt Name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Prompt Name');

      const submitButton = screen.getByRole('button', { name: /Save Changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith('/prompts');
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<PromptForm />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('navigates back when back link is clicked', async () => {
      const user = userEvent.setup();
      render(<PromptForm />);

      const backButton = screen.getByRole('button', { name: /Back to Library/i });
      await user.click(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('Category Selection', () => {
    it('allows category selection', async () => {
      const user = userEvent.setup();
      render(<PromptForm />);

      const categorySelect = screen.getByRole('combobox');
      await user.click(categorySelect);

      await waitFor(() => {
        expect(screen.getByText('Marketing')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Marketing'));
      expect(categorySelect).toHaveTextContent('Marketing');
    });
  });

  describe('Loading States', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      const { addDoc } = await import('firebase/firestore');
      
      // Make addDoc take longer
      vi.mocked(addDoc).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 'test' } as any), 100))
      );
      
      render(<PromptForm />);

      await user.type(screen.getByLabelText(/Prompt Name/i), 'Test Prompt');
      await user.type(screen.getByLabelText(/Description/i), 'Test description for the prompt');
      await user.type(screen.getByLabelText(/Prompt Template/i), 'Test template content here');
      await user.type(screen.getByLabelText(/Tags/i), 'test');

      const submitButton = screen.getByRole('button', { name: /Create Prompt/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();
    });
  });
});