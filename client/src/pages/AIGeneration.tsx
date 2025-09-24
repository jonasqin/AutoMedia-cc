import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Send,
  Copy,
  Download,
  Share2,
  MessageSquare,
  Hash,
  Image as ImageIcon,
  Calendar,
  Sparkles,
  BarChart3,
  RefreshCw,
  Save,
  Trash2,
  Heart,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardBody, CardTitle, CardDescription } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown';
import { useAuthStore } from '@/store/authStore';

interface GenerationOptions {
  model: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
  includeHashtags: boolean;
  includeEmojis: boolean;
  targetAudience: string;
}

interface GeneratedContent {
  id: string;
  content: string;
  tone: string;
  model: string;
  createdAt: string;
  engagement?: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'informative', label: 'Informative' },
  { value: 'promotional', label: 'Promotional' },
];

const modelOptions = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'claude-3', label: 'Claude 3' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'mixtral', label: 'Mixtral' },
];

const AIGeneration: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<GenerationOptions>({
    model: 'gpt-4',
    tone: 'professional',
    length: 'medium',
    includeHashtags: true,
    includeEmojis: true,
    targetAudience: 'general',
  });
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);

  // Mock generation mutation
  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; options: GenerationOptions }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock generated content based on prompt
      const mockContent = [
        `🚀 Exciting news in the world of ${data.prompt}! The latest developments are reshaping how we approach innovation. #TechTrends #Innovation`,
        `Just exploring some fascinating ideas about ${data.prompt}. The potential applications are incredible! What are your thoughts? ${data.options.includeHashtags ? '#Discussion' : ''}`,
        `Breaking down the complexities of ${data.prompt} into actionable insights. This could be a game-changer for many industries. ${data.options.includeEmojis ? '🎯' : ''}`,
      ];

      return mockContent.map((content, index) => ({
        id: `${Date.now()}-${index}`,
        content,
        tone: data.options.tone,
        model: data.options.model,
        createdAt: new Date().toISOString(),
        engagement: {
          likes: Math.floor(Math.random() * 100),
          retweets: Math.floor(Math.random() * 50),
          replies: Math.floor(Math.random() * 20),
        },
      }));
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generateMutation.mutate({ prompt, options });
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleSaveContent = (content: GeneratedContent) => {
    // Implement save functionality
    console.log('Saving content:', content);
  };

  const handlePostToTwitter = (content: string) => {
    // Implement Twitter posting
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
    window.open(twitterUrl, '_blank');
  };

  const promptExamples = [
    "Write about the future of AI in social media",
    "Create engaging content about remote work tips",
    "Generate a tweet about sustainable technology",
    "Write about the latest trends in digital marketing",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Content Generation</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create engaging Twitter content with AI assistance
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Badge variant="default" className="bg-purple-100 text-purple-800">
              <Sparkles className="w-4 h-4 mr-1" />
              AI Powered
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Content Generator</CardTitle>
                <CardDescription>
                  Describe what you want to write about
                </CardDescription>
              </CardHeader>
              <CardBody className="space-y-6">
                {/* Prompt Input */}
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                    What do you want to write about?
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your topic, audience, and goal..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={4}
                    disabled={generateMutation.isPending}
                  />
                </div>

                {/* Quick Examples */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Quick Examples</p>
                  <div className="space-y-2">
                    {promptExamples.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(example)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 hover:text-gray-900 transition-colors"
                        disabled={generateMutation.isPending}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Model
                    </label>
                    <select
                      value={options.model}
                      onChange={(e) => setOptions(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      disabled={generateMutation.isPending}
                    >
                      {modelOptions.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tone
                    </label>
                    <select
                      value={options.tone}
                      onChange={(e) => setOptions(prev => ({ ...prev, tone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      disabled={generateMutation.isPending}
                    >
                      {toneOptions.map((tone) => (
                        <option key={tone.value} value={tone.value}>
                          {tone.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Length
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['short', 'medium', 'long'] as const).map((length) => (
                        <button
                          key={length}
                          onClick={() => setOptions(prev => ({ ...prev, length }))}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            options.length === length
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          disabled={generateMutation.isPending}
                        >
                          {length.charAt(0).toUpperCase() + length.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={options.includeHashtags}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeHashtags: e.target.checked }))}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        disabled={generateMutation.isPending}
                      />
                      <span className="ml-2 text-sm text-gray-700">Include hashtags</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={options.includeEmojis}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeEmojis: e.target.checked }))}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        disabled={generateMutation.isPending}
                      />
                      <span className="ml-2 text-sm text-gray-700">Include emojis</span>
                    </label>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" color="white" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Generated Content */}
              {generatedContent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Generated Content</h2>
                    <Badge variant="success">
                      {generatedContent.length} variations
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {generatedContent.map((content) => (
                      <Card key={content.id} className="hover:shadow-md transition-shadow">
                        <CardBody>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{content.model}</Badge>
                              <Badge variant="secondary">{content.tone}</Badge>
                            </div>
                            <Dropdown
                              trigger={
                                <Button variant="ghost" size="sm">
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              }
                              items={[
                                {
                                  id: 'copy',
                                  name: 'Copy to clipboard',
                                  icon: <Copy className="w-4 h-4" />,
                                  action: () => handleCopyContent(content.content),
                                },
                                {
                                  id: 'save',
                                  name: 'Save to library',
                                  icon: <Save className="w-4 h-4" />,
                                  action: () => handleSaveContent(content),
                                },
                                {
                                  id: 'post',
                                  name: 'Post to Twitter',
                                  icon: <Send className="w-4 h-4" />,
                                  action: () => handlePostToTwitter(content.content),
                                },
                              ]}
                              align="right"
                            />
                          </div>

                          <p className="text-gray-900 mb-4 leading-relaxed">
                            {content.content}
                          </p>

                          {/* Engagement Preview */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Heart className="w-4 h-4 mr-1" />
                                {content.engagement?.likes || 0}
                              </div>
                              <div className="flex items-center">
                                <Share2 className="w-4 h-4 mr-1" />
                                {content.engagement?.retweets || 0}
                              </div>
                              <div className="flex items-center">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                {content.engagement?.replies || 0}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyContent(content.content)}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handlePostToTwitter(content.content)}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Post
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {generatedContent.length === 0 && !generateMutation.isPending && (
                <Card>
                  <CardBody className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ready to create content?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Enter your prompt and let AI generate engaging Twitter content for you
                    </p>
                  </CardBody>
                </Card>
              )}

              {/* Generating State */}
              {generateMutation.isPending && (
                <Card>
                  <CardBody className="text-center py-12">
                    <LoadingSpinner size="lg" text="Generating content..." />
                    <p className="text-gray-600 mt-4">
                      Our AI is crafting engaging content based on your prompt...
                    </p>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGeneration;