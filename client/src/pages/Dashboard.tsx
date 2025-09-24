import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  MessageSquare,
  Heart,
  Share,
  Zap,
  Plus,
  Calendar,
  BarChart3,
  Activity,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { formatNumber, formatDate } from '@/lib/utils';

interface DashboardStats {
  totalPosts: number;
  totalEngagement: number;
  followersGrowth: number;
  aiGenerations: number;
}

interface RecentActivity {
  id: string;
  type: 'post' | 'generation' | 'engagement';
  title: string;
  description: string;
  timestamp: string;
  data?: any;
}

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Mock data fetching - replace with actual API calls
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', timeRange],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        totalPosts: 156,
        totalEngagement: 12450,
        followersGrowth: 12.5,
        aiGenerations: 89,
      } as DashboardStats;
    },
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return [
        {
          id: '1',
          type: 'generation',
          title: 'AI Content Generated',
          description: 'Generated 5 tweet variations about AI trends',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          type: 'post',
          title: 'Post Published',
          description: 'Successfully posted to Twitter',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'engagement',
          title: 'High Engagement',
          description: 'Your latest post got 250 likes and 50 retweets',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ] as RecentActivity[];
    },
  });

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, icon, color }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {change >= 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  const ActivityItem: React.FC<{ activity: RecentActivity }> = ({ activity }) => {
    const getActivityIcon = (type: RecentActivity['type']) => {
      switch (type) {
        case 'post':
          return <MessageSquare className="w-5 h-5 text-blue-600" />;
        case 'generation':
          return <Zap className="w-5 h-5 text-purple-600" />;
        case 'engagement':
          return <Heart className="w-5 h-5 text-red-600" />;
        default:
          return <Activity className="w-5 h-5 text-gray-600" />;
      }
    };

    const getActivityBadge = (type: RecentActivity['type']) => {
      switch (type) {
        case 'post':
          return <Badge variant="secondary">Post</Badge>;
        case 'generation':
          return <Badge variant="default">AI Generated</Badge>;
        case 'engagement':
          return <Badge variant="success">Engagement</Badge>;
        default:
          return <Badge variant="outline">Activity</Badge>;
      }
    };

    return (
      <div className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex-shrink-0 mt-1">
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {activity.title}
            </h4>
            <div className="flex items-center space-x-2">
              {getActivityBadge(activity.type)}
              <span className="text-xs text-gray-500">
                {formatDate(activity.timestamp)}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back, {user?.profile?.firstName || user?.email}!
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button variant="primary" asChild>
              <Link to="/ai-generation">
                <Plus className="w-4 h-4 mr-2" />
                Generate Content
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <LoadingSpinner />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Posts"
              value={stats?.totalPosts || 0}
              change={8.2}
              icon={<MessageSquare className="w-6 h-6 text-white" />}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Engagement"
              value={formatNumber(stats?.totalEngagement || 0)}
              change={15.3}
              icon={<Heart className="w-6 h-6 text-white" />}
              color="bg-red-500"
            />
            <StatCard
              title="Followers Growth"
              value={`${stats?.followersGrowth || 0}%`}
              change={stats?.followersGrowth || 0}
              icon={<Users className="w-6 h-6 text-white" />}
              color="bg-green-500"
            />
            <StatCard
              title="AI Generations"
              value={stats?.aiGenerations || 0}
              change={23.1}
              icon={<Zap className="w-6 h-6 text-white" />}
              color="bg-purple-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Your latest content generation and posting activity
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {activityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner text="Loading activity..." />
                  </div>
                ) : recentActivity?.length ? (
                  <div className="space-y-2">
                    {recentActivity.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks you might want to perform
                </CardDescription>
              </CardHeader>
              <CardBody className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/ai-generation">
                    <Zap className="w-4 h-4 mr-3" />
                    Generate AI Content
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/collection">
                    <Search className="w-4 h-4 mr-3" />
                    Collect Content
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/library">
                    <BookOpen className="w-4 h-4 mr-3" />
                    View Library
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/topics">
                    <Target className="w-4 h-4 mr-3" />
                    Manage Topics
                  </Link>
                </Button>
              </CardBody>
            </Card>

            {/* Upcoming Content */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Scheduled Content</CardTitle>
                <CardDescription>
                  Content scheduled for posting
                </CardDescription>
              </CardHeader>
              <CardBody>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No scheduled content</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/ai-generation">Schedule Content</Link>
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;