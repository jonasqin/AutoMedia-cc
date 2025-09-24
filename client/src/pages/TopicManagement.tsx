import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  TrendingUp,
  Hash,
  Settings,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';

interface Topic {
  _id: string;
  name: string;
  description?: string;
  keywords: string[];
  weight: number;
  category?: string;
  isActive: boolean;
  lastUpdated: string;
  contentCount: number;
  settings: {
    updateFrequency: string;
    notificationEnabled: boolean;
    autoCollect: boolean;
  };
  priority: 'low' | 'medium' | 'high';
  emoji?: string;
  color?: string;
}

const TopicManagement: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState({
    name: '',
    description: '',
    keywords: [] as string[],
    weight: 1,
    category: '',
    priority: 'medium' as const,
    emoji: '',
    color: '#3B82F6',
    settings: {
      updateFrequency: '1hour',
      notificationEnabled: true,
      autoCollect: true,
    },
  });

  const [editForm, setEditForm] = useState<Partial<Topic>>({});
  const [keywordInput, setKeywordInput] = useState('');
  const [editKeywordInput, setEditKeywordInput] = useState('');

  const queryClient = useQueryClient();

  // Fetch topics
  const { data: topics, isLoading } = useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: async () => {
      const response = await api.get('/topics');
      return response.data.data;
    },
  });

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (topicData: typeof newTopic) => {
      const response = await api.post('/topics', topicData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      toast.success('Topic created successfully');
      setIsCreating(false);
      setNewTopic({
        name: '',
        description: '',
        keywords: [],
        weight: 1,
        category: '',
        priority: 'medium',
        emoji: '',
        color: '#3B82F6',
        settings: {
          updateFrequency: '1hour',
          notificationEnabled: true,
          autoCollect: true,
        },
      });
      setKeywordInput('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create topic');
    },
  });

  // Update topic mutation
  const updateTopicMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Topic> }) => {
      const response = await api.put(`/topics/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      toast.success('Topic updated successfully');
      setEditingTopic(null);
      setEditForm({});
      setEditKeywordInput('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update topic');
    },
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['topics']);
      toast.success('Topic deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete topic');
    },
  });

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !newTopic.keywords.includes(keywordInput.trim())) {
      setNewTopic(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setNewTopic(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleEditAddKeyword = () => {
    if (editKeywordInput.trim() && editForm.keywords && !editForm.keywords.includes(editKeywordInput.trim())) {
      setEditForm(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), editKeywordInput.trim()]
      }));
      setEditKeywordInput('');
    }
  };

  const handleEditRemoveKeyword = (keyword: string) => {
    setEditForm(prev => ({
      ...prev,
      keywords: (prev.keywords || []).filter(k => k !== keyword)
    }));
  };

  const handleCreateTopic = () => {
    if (!newTopic.name.trim() || newTopic.keywords.length === 0) {
      toast.error('Topic name and keywords are required');
      return;
    }

    createTopicMutation.mutate(newTopic);
  };

  const handleUpdateTopic = () => {
    if (!editingTopic || !editForm.name) return;

    updateTopicMutation.mutate({
      id: editingTopic,
      data: editForm,
    });
  };

  const handleDeleteTopic = (id: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    deleteTopicMutation.mutate(id);
  };

  const startEditing = (topic: Topic) => {
    setEditingTopic(topic._id);
    setEditForm({ ...topic });
  };

  const cancelEditing = () => {
    setEditingTopic(null);
    setEditForm({});
    setEditKeywordInput('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'realtime': return 'Real-time';
      case '5min': return '5 minutes';
      case '15min': return '15 minutes';
      case '30min': return '30 minutes';
      case '1hour': return '1 hour';
      case '3hours': return '3 hours';
      case '6hours': return '6 hours';
      case '12hours': return '12 hours';
      case 'daily': return 'Daily';
      default: return frequency;
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
          <h1 className="text-2xl font-bold text-gray-900">Topic Management</h1>
          <p className="text-gray-600">Create and manage topics for content collection</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Create Topic
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Hash className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Topics</p>
              <p className="text-2xl font-semibold text-gray-900">
                {topics?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-2xl font-semibold text-gray-900">
                {topics?.reduce((sum, topic) => sum + topic.contentCount, 0) || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Topics</p>
              <p className="text-2xl font-semibold text-gray-900">
                {topics?.filter(t => t.isActive).length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create Topic Form */}
      {isCreating && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New Topic</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreating(false)}
                icon={<X className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Topic name"
                value={newTopic.name}
                onChange={(e) => setNewTopic(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                type="text"
                placeholder="Category"
                value={newTopic.category}
                onChange={(e) => setNewTopic(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <Input
              type="text"
              placeholder="Description"
              value={newTopic.description}
              onChange={(e) => setNewTopic(prev => ({ ...prev, description: e.target.value }))}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Keywords</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add keyword"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
                <Button onClick={handleAddKeyword} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {newTopic.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveKeyword(keyword)}>
                    {keyword} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Weight</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={newTopic.weight}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newTopic.priority}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Update Frequency</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newTopic.settings.updateFrequency}
                  onChange={(e) => setNewTopic(prev => ({
                    ...prev,
                    settings: { ...prev.settings, updateFrequency: e.target.value }
                  }))}
                >
                  <option value="realtime">Real-time</option>
                  <option value="5min">5 minutes</option>
                  <option value="15min">15 minutes</option>
                  <option value="30min">30 minutes</option>
                  <option value="1hour">1 hour</option>
                  <option value="3hours">3 hours</option>
                  <option value="6hours">6 hours</option>
                  <option value="12hours">12 hours</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTopic}
                disabled={createTopicMutation.isPending}
              >
                {createTopicMutation.isPending ? 'Creating...' : 'Create Topic'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Topics List */}
      <div className="space-y-4">
        {topics?.map((topic) => (
          <Card key={topic._id}>
            <div className="p-6">
              {editingTopic === topic._id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      placeholder="Topic name"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      type="text"
                      placeholder="Category"
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>

                  <Input
                    type="text"
                    placeholder="Description"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Keywords</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Add keyword"
                        value={editKeywordInput}
                        onChange={(e) => setEditKeywordInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleEditAddKeyword()}
                      />
                      <Button onClick={handleEditAddKeyword} size="sm">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editForm.keywords?.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleEditRemoveKeyword(keyword)}>
                          {keyword} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={cancelEditing}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateTopic}
                      disabled={updateTopicMutation.isPending}
                    >
                      {updateTopicMutation.isPending ? 'Updating...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold" style={{ backgroundColor: topic.color || '#3B82F6' }}>
                        {topic.emoji || '📊'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{topic.name}</h3>
                        <p className="text-sm text-gray-600">{topic.description}</p>
                        {topic.category && (
                          <Badge variant="outline" className="mt-1">{topic.category}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => startEditing(topic)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTopic(topic._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Weight:</span>
                      <Badge>{topic.weight}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Priority:</span>
                      <Badge className={getPriorityColor(topic.priority)}>
                        {topic.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Update:</span>
                      <Badge variant="outline">{getFrequencyLabel(topic.settings.updateFrequency)}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Content:</span>
                      <span className="font-medium">{topic.contentCount}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {topic.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Last updated: {new Date(topic.lastUpdated).toLocaleDateString()}</span>
                      <Badge variant={topic.isActive ? 'success' : 'secondary'}>
                        {topic.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {topic.settings.notificationEnabled && (
                        <Badge variant="outline">Notifications</Badge>
                      )}
                      {topic.settings.autoCollect && (
                        <Badge variant="outline">Auto-collect</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!topics || topics.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Hash className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No topics yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first topic to start collecting relevant content
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Topic
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TopicManagement;