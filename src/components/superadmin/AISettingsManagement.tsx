import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiSettingsApi } from '@/lib/api/aiSettings.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Eye, EyeOff, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AISettingsManagement = () => {
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    aiProvider: 'lovable' as 'lovable' | 'openai' | 'google' | 'custom',
    apiKey: '',
    apiEndpoint: '',
    modelName: '',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const response = await aiSettingsApi.getAISettings();
      if (!response.success) throw new Error(response.message || 'Failed to fetch AI settings');
      return response.data;
    },
  });

  // Populate form when settings are loaded
  useEffect(() => {
    if (settings && !formData.apiKey) {
      setFormData({
        aiProvider: settings.aiProvider,
        apiKey: '', // Don't populate API key for security
        apiEndpoint: settings.apiEndpoint || '',
        modelName: settings.modelName || '',
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await aiSettingsApi.updateAISettings({
        aiProvider: data.aiProvider,
        apiKey: data.apiKey,
        apiEndpoint: data.apiEndpoint || undefined,
        modelName: data.modelName || undefined,
      });
      if (!response.success) throw new Error(response.message || 'Failed to update AI settings');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      toast.success('AI settings updated successfully');
      setFormData(prev => ({ ...prev, apiKey: '' })); // Clear API key after save
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update AI settings');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await aiSettingsApi.deleteAISettings();
      if (!response.success) throw new Error(response.message || 'Failed to delete AI settings');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      toast.success('AI settings deleted successfully');
      setFormData({
        aiProvider: 'lovable',
        apiKey: '',
        apiEndpoint: '',
        modelName: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete AI settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apiKey.trim()) {
      toast.error('API key is required');
      return;
    }
    updateMutation.mutate(formData);
  };

  const getDefaultModel = (provider: string) => {
    switch (provider) {
      case 'lovable':
        return 'google/gemini-2.5-flash';
      case 'openai':
        return 'gpt-4-vision-preview';
      case 'google':
        return 'gemini-2.0-flash-exp';
      default:
        return '';
    }
  };

  const getDefaultEndpoint = (provider: string) => {
    switch (provider) {
      case 'lovable':
        return 'https://ai.gateway.lovable.dev/v1/chat/completions';
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'google':
        return '';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Model Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure AI API settings for medical report analysis. The AI will analyze uploaded medical reports and extract key findings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Settings Status */}
              {settings && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">AI Settings Configured</p>
                        <p className="text-sm text-muted-foreground">
                          Provider: <Badge variant="outline">{settings.aiProvider}</Badge> | 
                          Model: {settings.modelName} | 
                          API Key: {settings.apiKeyPreview || 'Not configured'}
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!settings && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    AI settings not configured. Please configure your AI API key to enable medical report analysis.
                  </AlertDescription>
                </Alert>
              )}

              {/* Configuration Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="aiProvider">AI Provider *</Label>
                  <Select
                    value={formData.aiProvider}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        aiProvider: value as any,
                        modelName: getDefaultModel(value),
                        apiEndpoint: getDefaultEndpoint(value),
                      });
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lovable">Lovable AI Gateway (Recommended)</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="google">Google Gemini</SelectItem>
                      <SelectItem value="custom">Custom API</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formData.aiProvider === 'lovable' && 'Uses Google Gemini 2.5 Flash via Lovable Gateway'}
                    {formData.aiProvider === 'openai' && 'Uses OpenAI GPT-4 Vision'}
                    {formData.aiProvider === 'google' && 'Uses Google Gemini API directly'}
                    {formData.aiProvider === 'custom' && 'Use your own AI API endpoint'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="apiKey">API Key *</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      placeholder={settings ? 'Enter new API key to update' : 'Enter your AI API key'}
                      className="h-11 rounded-xl pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formData.aiProvider === 'lovable' && 'Get your API key from: https://lovable.dev'}
                    {formData.aiProvider === 'openai' && 'Get your API key from: https://platform.openai.com/api-keys'}
                    {formData.aiProvider === 'google' && 'Get your API key from: https://makersuite.google.com/app/apikey'}
                    {formData.aiProvider === 'custom' && 'Enter your custom API key'}
                  </p>
                </div>

                {(formData.aiProvider === 'custom' || formData.aiProvider === 'google') && (
                  <div>
                    <Label htmlFor="apiEndpoint">
                      API Endpoint {formData.aiProvider === 'custom' ? '*' : '(Optional)'}
                    </Label>
                    <Input
                      id="apiEndpoint"
                      type="text"
                      value={formData.apiEndpoint}
                      onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                      placeholder={
                        formData.aiProvider === 'google'
                          ? 'Leave empty to use default Google Gemini endpoint'
                          : 'https://your-api-endpoint.com/v1/analyze'
                      }
                      className="h-11 rounded-xl"
                      required={formData.aiProvider === 'custom'}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formData.aiProvider === 'google' && 'Default: Google Gemini API endpoint (auto-generated with API key)'}
                      {formData.aiProvider === 'custom' && 'Your custom AI API endpoint URL'}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input
                    id="modelName"
                    type="text"
                    value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    placeholder={getDefaultModel(formData.aiProvider)}
                    className="h-11 rounded-xl"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Model name to use for analysis. Default will be used if left empty.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="submit"
                    className="medical-btn-primary"
                    disabled={updateMutation.isPending || !formData.apiKey.trim()}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {settings ? 'Update' : 'Save'} AI Settings
                  </Button>

                  {settings && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete AI settings? This will disable medical report analysis.')) {
                          deleteMutation.mutate();
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Delete Settings'
                      )}
                    </Button>
                  )}
                </div>
              </form>

              {/* Instructions */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
                <h4 className="font-semibold text-sm">📝 Instructions:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>For <strong>Lovable AI Gateway</strong>: Sign up at lovable.dev and get your API key</li>
                  <li>For <strong>OpenAI</strong>: Get your API key from OpenAI Platform</li>
                  <li>For <strong>Google Gemini</strong>: Get your API key from Google AI Studio</li>
                  <li>For <strong>Custom API</strong>: Provide your own API endpoint and key</li>
                  <li>API key is stored securely and only used for medical report analysis</li>
                  <li>You can update the API key anytime without affecting existing reports</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettingsManagement;

