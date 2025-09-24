import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Search,
  Filter,
  Download,
  Share2,
  Heart,
  MessageSquare,
  Eye,
  Plus,
  Grid,
  List,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';

interface ContentItem {
  _id: string;
  platform: string;
  type: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    verified: boolean;
  };
  content: {
    text: string;
    media: Array<{
      url: string;
      type: string;
      altText?: string;
    }>;
    links: Array<{
      url: string;
      title?: string;
      description?: string;
    }>;
  };
  metadata: {
    engagement: {
      likes: number;
      retweets: number;
      replies: number;
      views: number;
    };
    sentiment: {
      score: number;
      label: string;
    };
    topics: string[];
    hashtags: string[];
  };
  aiGenerated: boolean;
  tags: string[];
  collectedAt: string;
  isActive: boolean;
}

interface ContentFilters {
  platform?: string;
  type?: string;
  sentiment?: string;
  aiGenerated?: boolean;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

const ContentLibrary: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ContentFilters>({});
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Fetch content
  const { data: contentData, isLoading, refetch } = useQuery({
    queryKey: ['content-library', page, limit, filters, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.type) params.append('type', filters.type);
      if (filters.sentiment) params.append('sentiment', filters.sentiment);
      if (filters.aiGenerated !== undefined) params.append('aiGenerated', filters.aiGenerated.toString());
      if (filters.dateRange?.start) params.append('startDate', filters.dateRange.start);
      if (filters.dateRange?.end) params.append('endDate', filters.dateRange.end);

      const response = await api.get(`/content?${params}`);
      return response.data.data;
    },
  });

  const content: ContentItem[] = contentData?.content || [];
  const total = contentData?.total || 0;
  const hasMore = page * limit < total;

  const handleFilterChange = (key: keyof ContentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const handleExportSelected = async () => {
    if (selectedContent.length === 0) {
      toast.error('Please select content to export');
      return;
    }

    try {
      const response = await api.post('/content/export', {
        contentIds: selectedContent,
        format: 'json',
      });

      // Create download link
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Content exported successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Export failed');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedContent.length === 0) {
      toast.error('Please select content to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedContent.length} items?`)) {
      return;
    }

    try {
      await api.delete('/content', {
        data: { contentIds: selectedContent },
      });

      toast.success('Content deleted successfully');
      setSelectedContent([]);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const toggleContentSelection = (contentId: string) => {
    setSelectedContent(prev =>
      prev.includes(contentId)
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const selectAllContent = () => {
    if (selectedContent.length === content.length) {
      setSelectedContent([]);
    } else {
      setSelectedContent(content.map(item => item._id));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600">Manage and organize your collected content</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => handleFilterChange('aiGenerated', true)}>
                AI Generated
              </Button>
              <Button variant="outline" onClick={() => handleFilterChange('aiGenerated', false)}>
                Human Content
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.platform || ''}
              onChange={(e) => handleFilterChange('platform', e.target.value || undefined)}
            >
              <option value="">All Platforms</option>
              <option value="twitter">Twitter</option>
              <option value="xiaohongshu">Xiaohongshu</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
            >
              <option value="">All Types</option>
              <option value="tweet">Tweet</option>
              <option value="post">Post</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="story">Story</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.sentiment || ''}
              onChange={(e) => handleFilterChange('sentiment', e.target.value || undefined)}
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedContent.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {selectedContent.length} items selected
              </span>
              <Button variant="outline" size="sm" onClick={selectAllContent}>
                {selectedContent.length === content.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleExportSelected}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Content Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {content.map((item) => (
          <Card key={item._id} className="hover:shadow-md transition-shadow">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedContent.includes(item._id)}
                    onChange={() => toggleContentSelection(item._id)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <img
                    src={item.author.avatar || '/default-avatar.png'}
                    alt={item.author.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-gray-900">
                        {item.author.displayName}
                      </span>
                      {item.author.verified && (
                        <span className="text-blue-500">✓</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">@{item.author.username}</span>
                  </div>
                </div>
                <Badge variant={item.aiGenerated ? 'info' : 'secondary'}>
                  {item.aiGenerated ? 'AI Generated' : 'Original'}
                </Badge>
              </div>

              {/* Content */}
              <div className="mb-3">
                <p className="text-gray-700 text-sm line-clamp-3">
                  {item.content.text}
                </p>
                {item.content.media.length > 0 && (
                  <div className="mt-2">
                    <img
                      src={item.content.media[0].url}
                      alt={item.content.media[0].altText || 'Media'}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              {/* Engagement */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    {item.metadata.engagement.likes}
                  </span>
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4" />
                    {item.metadata.engagement.replies}
                  </span>
                  <span className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    {item.metadata.engagement.views}
                  </span>
                </div>
                <Badge variant={item.metadata.sentiment.label === 'positive' ? 'success' : item.metadata.sentiment.label === 'negative' ? 'error' : 'secondary'}>
                  {item.metadata.sentiment.label}
                </Badge>
              </div>

              {/* Tags and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {item.metadata.hashtags.slice(0, 2).map((hashtag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {hashtag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={isLoading}
          >
            Load More
          </Button>
        </div>
      )}

      {/* Empty State */}
      {content.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters to find content
            </p>
            <Button onClick={handleClearFilters}>Clear Filters</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ContentLibrary;