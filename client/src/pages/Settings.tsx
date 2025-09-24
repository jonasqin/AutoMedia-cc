import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Bell,
  Shield,
  Key,
  Globe,
  Database,
  Zap,
  Smartphone,
  CreditCard,
  Users,
  Palette,
  Save,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const Settings: React.FC = () => {
  const { user, updateSettings } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    twitter: '',
    google: '',
    deepseek: '',
    claude: '',
  });

  // Update API keys mutation
  const updateApiKeysMutation = useMutation({
    mutationFn: async (keys: typeof apiKeys) => {
      const response = await api.post('/users/api-keys', keys);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success('API keys updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update API keys');
    },
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/users/export-data', {
        responseType: 'blob',
      });
      return response.data;
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automedia-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Data exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to export data');
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/users/account');
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      // Redirect to login or home page
      window.location.href = '/login';
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    },
  });

  const handleApiKeysSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiKeysMutation.mutate(apiKeys);
  };

  const handleExportData = () => {
    exportDataMutation.mutate();
  };

  const handleDeleteAccount = () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('Please type "DELETE" to confirm account deletion:')) {
      return;
    }

    deleteAccountMutation.mutate();
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Palette },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'api-keys', name: 'API Keys', icon: Key },
    { id: 'integrations', name: 'Integrations', icon: Zap },
    { id: 'data', name: 'Data Management', icon: Database },
    { id: 'billing', name: 'Billing', icon: CreditCard },
  ];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <Card>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Language</label>
                        <p className="text-sm text-gray-500">Interface language</p>
                      </div>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue={user.profile.preferences.language}
                      >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Theme</label>
                        <p className="text-sm text-gray-500">Application appearance</p>
                      </div>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue={user.settings.theme}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Timezone</label>
                        <p className="text-sm text-gray-500">Your local timezone</p>
                      </div>
                      <Badge variant="outline">
                        {user.profile.preferences.timezone}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                        <p className="text-sm text-gray-500">Receive email notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={user.profile.preferences.notifications}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                        <p className="text-sm text-gray-500">Browser push notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Content Updates</label>
                        <p className="text-sm text-gray-500">Notifications for new content</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">AI Generation Complete</label>
                        <p className="text-sm text-gray-500">Notifications when AI generation finishes</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Change Password
                      </label>
                      <div className="space-y-3">
                        <Input
                          type="password"
                          placeholder="Current password"
                        />
                        <Input
                          type="password"
                          placeholder="New password"
                        />
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                        />
                        <Button>Update Password</Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Two-Factor Authentication</h4>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                        <Button variant="outline">Enable 2FA</Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Active Sessions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Current Session</p>
                            <p className="text-xs text-gray-500">Chrome on Windows • Now</p>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'api-keys' && (
            <Card>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure your API keys for various services. Your keys are encrypted and stored securely.
                  </p>

                  <form onSubmit={handleApiKeysSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OpenAI API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={apiKeys.openai}
                        onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="Twitter API key"
                        value={apiKeys.twitter}
                        onChange={(e) => setApiKeys({ ...apiKeys, twitter: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Google API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="Google API key"
                        value={apiKeys.google}
                        onChange={(e) => setApiKeys({ ...apiKeys, google: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DeepSeek API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="DeepSeek API key"
                        value={apiKeys.deepseek}
                        onChange={(e) => setApiKeys({ ...apiKeys, deepseek: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Claude API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="Claude API key"
                        value={apiKeys.claude}
                        onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={updateApiKeysMutation.isPending}
                      >
                        {updateApiKeysMutation.isPending ? 'Saving...' : 'Save API Keys'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Integrations</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Telegram Bot</h4>
                          <p className="text-xs text-gray-500">Receive notifications via Telegram</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Zap className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Webhooks</h4>
                          <p className="text-xs text-gray-500">Send data to external services</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Slack Integration</h4>
                          <p className="text-xs text-gray-500">Connect to your Slack workspace</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'data' && (
            <Card>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>

                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="text-sm font-medium text-gray-900">Export Your Data</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Download all your data including content, topics, and settings.
                      </p>
                      <Button
                        onClick={handleExportData}
                        disabled={exportDataMutation.isPending}
                        icon={<Download className="h-4 w-4" />}
                      >
                        {exportDataMutation.isPending ? 'Exporting...' : 'Export Data'}
                      </Button>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="text-sm font-medium text-gray-900">Import Data</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Import data from another AutoMedia account or backup.
                      </p>
                      <Button
                        variant="outline"
                        icon={<Upload className="h-4 w-4" />}
                      >
                        Import Data
                      </Button>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="text-sm font-medium text-gray-900">Data Retention</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Automatically delete old data to manage storage.
                      </p>
                      <select className="px-3 py-2 border border-gray-300 rounded-md">
                        <option value="never">Never delete</option>
                        <option value="30">After 30 days</option>
                        <option value="90">After 90 days</option>
                        <option value="180">After 6 months</option>
                        <option value="365">After 1 year</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteAccountMutation.isPending}
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing & Subscription</h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-900">Current Plan</h4>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 mb-1">Free Plan</p>
                      <p className="text-sm text-blue-700 mb-3">
                        Limited features and usage caps
                      </p>
                      <Button>Upgrade Plan</Button>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Statistics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-2xl font-bold text-gray-900">1,234</p>
                          <p className="text-sm text-gray-600">Content Items</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-2xl font-bold text-gray-900">56</p>
                          <p className="text-sm text-gray-600">AI Generations</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-2xl font-bold text-gray-900">12</p>
                          <p className="text-sm text-gray-600">Topics</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-2xl font-bold text-gray-900">3</p>
                          <p className="text-sm text-gray-600">API Keys</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Method</h4>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm text-gray-600">No payment method on file</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Add Payment Method
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Billing History</h4>
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No billing history available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;