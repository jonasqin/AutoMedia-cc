import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Twitter,
  Search,
  TrendingUp,
  Users,
  BarChart3,
  Plus,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';

interface CollectionStats {
  stats: {
    totalContent: number;
    totalTopics: number;
    recentContentCount: number;
  };
  recentContent: any[];
  topTopics: any[];
}

interface TwitterStatus {
  isConnected: boolean;
  rateLimit: {
    remaining: number;
    reset: Date;
  };
  lastChecked: Date;
}

const DataCollection: React.FC = () => {
  const [monitorUsers, setMonitorUsers] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('1');
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Fetch collection statistics
  const { data: stats, refetch: refetchStats } = useQuery<CollectionStats>({
    queryKey: ['collection-stats'],
    queryFn: async () => {
      const response = await api.get('/collection/status');
      return response.data.data;
    },
  });

  // Fetch Twitter status
  const { data: twitterStatus, refetch: refetchTwitterStatus } = useQuery<TwitterStatus>({
    queryKey: ['twitter-status'],
    queryFn: async () => {
      const response = await api.get('/collection/twitter/status');
      return response.data.data;
    },
  });

  // Handle user monitoring
  const handleMonitorUsers = async () => {
    if (!monitorUsers.trim()) {
      toast.error('Please enter usernames to monitor');
      return;
    }

    setIsMonitoring(true);
    try {
      const usernames = monitorUsers.split(',').map(u => u.trim()).filter(u => u);
      const response = await api.post('/collection/twitter/users', {
        usernames,
      });

      toast.success(`Successfully processed ${usernames.length} users`);
      setMonitorUsers('');
      refetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to monitor users');
    } finally {
      setIsMonitoring(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      const response = await api.get('/collection/twitter/search', {
        params: {
          q: searchQuery,
          limit: 20,
          language: 'en',
        },
      });

      toast.success(`Found ${response.data.data.totalResults} tweets`);
      refetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Search failed');
    }
  };

  // Handle refresh trends
  const handleRefreshTrends = async () => {
    try {
      await api.get('/collection/trends', {
        params: {
          location: selectedLocation,
        },
      });
      toast.success('Trends refreshed');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to refresh trends');
    }
  };

  if (!stats || !twitterStatus) {
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
          <h1 className="text-2xl font-bold text-gray-900">Data Collection</h1>
          <p className="text-gray-600">Monitor Twitter accounts and collect relevant content</p>
        </div>
        <Button
          onClick={() => refetchStats()}
          icon={<RefreshCw className="h-4 w-4" />}
          variant="outline"
        >
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.stats.totalContent.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Topics</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.stats.totalTopics}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Twitter className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Twitter Status</p>
              <Badge variant={twitterStatus.isConnected ? 'success' : 'error'}>
                {twitterStatus.isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Monitoring */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Monitor Users</h3>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">
              Add Twitter usernames to monitor their content and activities
            </p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Enter usernames (comma-separated)"
                value={monitorUsers}
                onChange={(e) => setMonitorUsers(e.target.value)}
              />
              <Button
                onClick={handleMonitorUsers}
                disabled={isMonitoring || !monitorUsers.trim()}
                className="w-full"
                icon={<Plus className="h-4 w-4" />}
              >
                {isMonitoring ? 'Monitoring...' : 'Monitor Users'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Search Tweets */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Search Tweets</h3>
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">
              Search for tweets based on keywords, hashtags, or topics
            </p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              >
                Search
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Topics */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Top Topics</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.topTopics.map((topic, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h4 className="font-medium text-gray-900">{topic.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {topic.contentCount} content items
                </p>
                <div className="flex flex-wrap gap-1">
                  {topic.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Content */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Content</h3>
            <Download className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats.recentContent.map((content, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <img
                        src={content.author.avatar || '/default-avatar.png'}
                        alt={content.author.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-medium text-gray-900">
                        {content.author.displayName}
                      </span>
                      <span className="text-gray-500">@{content.author.username}</span>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-3">
                      {content.content.text}
                    </p>
                  </div>
                  <div className="ml-4 text-xs text-gray-500">
                    {new Date(content.collectedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DataCollection;