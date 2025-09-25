import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ContentCard } from '@/components/content/ContentCard';
import { useAuth } from '@/hooks/useAuth';
import { useContent } from '@/hooks/useContent';
import { toast } from 'react-hot-toast';

// Mock the hooks and dependencies
vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useContent');
vi.mock('react-hot-toast');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseContent = useContent as jest.MockedFunction<typeof useContent>;

const mockContent = {
  _id: 'content123',
  platform: 'twitter',
  type: 'tweet',
  author: {
    id: 'author123',
    username: 'techguru',
    displayName: 'Tech Guru',
    verified: true,
    avatar: 'https://example.com/avatar.jpg',
  },
  content: {
    text: 'Just discovered an amazing AI tool that revolutionizes content creation! 🤖 #AI #Tech',
    media: [
      {
        url: 'https://example.com/image.jpg',
        type: 'image',
        altText: 'AI tool screenshot',
      },
    ],
    links: [],
  },
  metadata: {
    engagement: {
      likes: 150,
      retweets: 45,
      replies: 12,
      views: 2500,
    },
    sentiment: {
      score: 0.8,
      label: 'positive',
    },
    topics: ['AI', 'Technology'],
    hashtags: ['#AI', '#Tech'],
    mentions: [],
    language: 'en',
  },
  aiGenerated: false,
  tags: ['AI', 'Technology', 'Tools'],
  collections: [],
  publishedAt: '2024-01-15T10:30:00Z',
  collectedAt: '2024-01-15T10:30:00Z',
  isActive: true,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

describe('ContentCard', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockDeleteContent = vi.fn();
  const mockUpdateContent = vi.fn();
  const mockAddToCollection = vi.fn();
  const mockShareContent = vi.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      isLoading: false,
      error: null,
      logout: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
    });

    mockUseContent.mockReturnValue({
      contents: [],
      loading: false,
      error: null,
      deleteContent: mockDeleteContent,
      updateContent: mockUpdateContent,
      addContent: vi.fn(),
      getContents: vi.fn(),
      searchContents: vi.fn(),
      addToCollection: mockAddToCollection,
      shareContent: mockShareContent,
    });

    vi.clearAllMocks();
  });

  it('renders content card correctly', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    expect(screen.getByText('Tech Guru')).toBeInTheDocument();
    expect(screen.getByText('@techguru')).toBeInTheDocument();
    expect(screen.getByText(/just discovered an amazing ai tool/i)).toBeInTheDocument();
    expect(screen.getByText('#AI')).toBeInTheDocument();
    expect(screen.getByText('#Tech')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows verified badge for verified users', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('verified-badge')).toBeInTheDocument();
  });

  it('does not show verified badge for unverified users', () => {
    const unverifiedContent = {
      ...mockContent,
      author: {
        ...mockContent.author,
        verified: false,
      },
    };

    render(
      <BrowserRouter>
        <ContentCard content={unverifiedContent} />
      </BrowserRouter>
    );

    expect(screen.queryByTestId('verified-badge')).not.toBeInTheDocument();
  });

  it('displays sentiment indicator with positive sentiment', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('sentiment-positive')).toBeInTheDocument();
  });

  it('displays sentiment indicator with negative sentiment', () => {
    const negativeContent = {
      ...mockContent,
      metadata: {
        ...mockContent.metadata,
        sentiment: {
          score: -0.8,
          label: 'negative',
        },
      },
    };

    render(
      <BrowserRouter>
        <ContentCard content={negativeContent} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('sentiment-negative')).toBeInTheDocument();
  });

  it('displays AI-generated badge for AI content', () => {
    const aiContent = {
      ...mockContent,
      aiGenerated: true,
    };

    render(
      <BrowserRouter>
        <ContentCard content={aiContent} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('ai-generated-badge')).toBeInTheDocument();
  });

  it('does not show AI-generated badge for non-AI content', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    expect(screen.queryByTestId('ai-generated-badge')).not.toBeInTheDocument();
  });

  it('displays media preview when media is present', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    expect(screen.getByAltText('AI tool screenshot')).toBeInTheDocument();
  });

  it('formats relative time correctly', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    expect(screen.getByText(/ago/i)).toBeInTheDocument();
  });

  it('handles content deletion confirmation', async () => {
    window.confirm = vi.fn(() => true);

    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this content?');

    await waitFor(() => {
      expect(mockDeleteContent).toHaveBeenCalledWith('content123');
      expect(toast.success).toHaveBeenCalledWith('Content deleted successfully');
    });
  });

  it('handles content deletion cancellation', async () => {
    window.confirm = vi.fn(() => false);

    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this content?');

    await waitFor(() => {
      expect(mockDeleteContent).not.toHaveBeenCalled();
    });
  });

  it('handles content sharing', async () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShareContent).toHaveBeenCalledWith('content123');
      expect(toast.success).toHaveBeenCalledWith('Content shared successfully');
    });
  });

  it('handles content adding to collection', async () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const addToCollectionButton = screen.getByRole('button', { name: /add to collection/i });
    fireEvent.click(addToCollectionButton);

    await waitFor(() => {
      expect(mockAddToCollection).toHaveBeenCalledWith('content123', expect.any(String));
      expect(toast.success).toHaveBeenCalledWith('Added to collection');
    });
  });

  it('shows action buttons only for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: vi.fn(),
      isLoading: false,
      error: null,
      logout: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to collection/i })).not.toBeInTheDocument();
  });

  it('handles content click navigation', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const contentLink = screen.getByText(/just discovered an amazing ai tool/i);
    fireEvent.click(contentLink);

    expect(window.location.pathname).toBe('/content/content123');
  });

  it('handles author click navigation', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const authorLink = screen.getByText('Tech Guru');
    fireEvent.click(authorLink);

    expect(window.location.pathname).toBe('/author/author123');
  });

  it('handles hashtag click navigation', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const hashtagLink = screen.getByText('#AI');
    fireEvent.click(hashtagLink);

    expect(window.location.pathname).toBe('/search/AI');
  });

  it('shows loading state during content operations', async () => {
    mockUseContent.mockReturnValue({
      contents: [],
      loading: true,
      error: null,
      deleteContent: mockDeleteContent,
      updateContent: mockUpdateContent,
      addContent: vi.fn(),
      getContents: vi.fn(),
      searchContents: vi.fn(),
      addToCollection: mockAddToCollection,
      shareContent: mockShareContent,
    });

    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeDisabled();
  });

  it('handles error states gracefully', async () => {
    mockDeleteContent.mockRejectedValue(new Error('Failed to delete content'));
    window.confirm = vi.fn(() => true);

    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete content');
    });
  });

  it('handles keyboard navigation', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const contentCard = screen.getByTestId('content-card');

    // Test Enter key on content card
    fireEvent.keyDown(contentCard, { key: 'Enter' });

    // Should navigate to content detail
    expect(window.location.pathname).toBe('/content/content123');
  });

  it('truncates long text content', () => {
    const longTextContent = {
      ...mockContent,
      content: {
        ...mockContent.content,
        text: 'This is a very long text content that should be truncated when displayed in the content card. ' +
              'It contains multiple sentences and should be properly truncated with an ellipsis at the end.',
      },
    };

    render(
      <BrowserRouter>
        <ContentCard content={longTextContent} />
      </BrowserRouter>
    );

    const textContent = screen.getByText(/this is a very long text content/i);
    expect(textContent).toBeInTheDocument();
    // Check if truncation is applied (text should be shorter than original)
    expect(textContent.textContent?.length).toBeLessThan(200);
  });

  it('displays engagement metrics with proper formatting', () => {
    const highEngagementContent = {
      ...mockContent,
      metadata: {
        ...mockContent.metadata,
        engagement: {
          likes: 1500000,
          retweets: 450000,
          replies: 120000,
          views: 25000000,
        },
      },
    };

    render(
      <BrowserRouter>
        <ContentCard content={highEngagementContent} />
      </BrowserRouter>
    );

    expect(screen.getByText(/1.5m/i)).toBeInTheDocument();
    expect(screen.getByText(/450k/i)).toBeInTheDocument();
    expect(screen.getByText(/120k/i)).toBeInTheDocument();
    expect(screen.getByText(/25m/i)).toBeInTheDocument();
  });

  it('handles empty engagement metrics', () => {
    const noEngagementContent = {
      ...mockContent,
      metadata: {
        ...mockContent.metadata,
        engagement: {
          likes: 0,
          retweets: 0,
          replies: 0,
          views: 0,
        },
      },
    };

    render(
      <BrowserRouter>
        <ContentCard content={noEngagementContent} />
      </BrowserRouter>
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('is accessible with proper ARIA attributes', () => {
    render(
      <BrowserRouter>
        <ContentCard content={mockContent} />
      </BrowserRouter>
    );

    const contentCard = screen.getByTestId('content-card');
    expect(contentCard).toHaveAttribute('role', 'article');
    expect(contentCard).toHaveAttribute('aria-labelledby', 'content-title-content123');

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toHaveAttribute('aria-label', 'Delete content');
  });
});