import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { PromptCard } from '../PromptCard';
import { generateMockPrompt } from '@/test/test-utils';

describe('PromptCard', () => {
  const mockPrompt = generateMockPrompt();
  const mockOnDelete = vi.fn();
  const mockOnExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prompt information correctly', () => {
    render(
      <PromptCard 
        prompt={mockPrompt}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText(mockPrompt.name)).toBeInTheDocument();
    expect(screen.getByText(mockPrompt.description)).toBeInTheDocument();
    
    // Check tags are rendered
    mockPrompt.tags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('shows category badge when category exists', () => {
    const promptWithCategory = generateMockPrompt({ category: 'Marketing' });
    
    render(
      <PromptCard 
        prompt={promptWithCategory}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('opens dropdown menu on click', async () => {
    const user = userEvent.setup();
    
    render(
      <PromptCard 
        prompt={mockPrompt}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
      />
    );

    const menuButton = screen.getByRole('button', { name: /open menu/i });
    await user.click(menuButton);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onExport when export is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PromptCard 
        prompt={mockPrompt}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
      />
    );

    const menuButton = screen.getByRole('button', { name: /open menu/i });
    await user.click(menuButton);

    const exportButton = screen.getByText('Export');
    await user.click(exportButton);

    expect(mockOnExport).toHaveBeenCalledWith(mockPrompt);
    expect(mockOnExport).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PromptCard 
        prompt={mockPrompt}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
      />
    );

    const menuButton = screen.getByRole('button', { name: /open menu/i });
    await user.click(menuButton);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('navigates to edit page when edit is clicked', async () => {
    const user = userEvent.setup();
    const push = vi.fn();
    vi.mocked(require('next/navigation').useRouter).mockReturnValue({ push });
    
    render(
      <PromptCard 
        prompt={mockPrompt}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
      />
    );

    const menuButton = screen.getByRole('button', { name: /open menu/i });
    await user.click(menuButton);

    const editLink = screen.getByText('Edit').closest('a');
    expect(editLink).toHaveAttribute('href', `/prompts/${mockPrompt.id}/edit`);
  });

  it('displays formatted dates', () => {
    const prompt = generateMockPrompt({
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-16T14:45:00Z',
    });
    
    render(
      <PromptCard 
        prompt={prompt}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
      />
    );

    // The component should format dates - adjust based on actual formatting
    expect(screen.getByText(/Jan 16, 2024/)).toBeInTheDocument();
  });

  it('handles long descriptions with ellipsis', () => {
    const longDescription = 'Lorem ipsum '.repeat(50);
    const prompt = generateMockPrompt({ description: longDescription });
    
    render(
      <PromptCard 
        prompt={prompt}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
      />
    );

    const description = screen.getByText((content, element) => {
      return element?.classList.contains('line-clamp-3') || false;
    });
    
    expect(description).toBeInTheDocument();
  });

  it('applies hover styles', async () => {
    const user = userEvent.setup();
    
    const { container } = render(
      <PromptCard 
        prompt={mockPrompt}
        onDelete={mockOnDelete}
        onExport={mockOnExport}
      />
    );

    const card = container.querySelector('.group');
    expect(card).toHaveClass('hover:shadow-lg');
  });
});