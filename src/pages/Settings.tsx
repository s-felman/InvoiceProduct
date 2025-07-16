import React, { useState, useEffect } from 'react';
import { Save, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { AISettings } from '../types';

const Settings: React.FC = () => {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState<AISettings>(state.aiSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setFormData(state.aiSettings);
  }, [state.aiSettings]);

  const handleProviderChange = (provider: 'openai' | 'azure' | 'gemini' | 'none') => {
    setFormData(prev => ({ ...prev, provider }));
  };

  const handleInputChange = (field: keyof AISettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Save to database
      const { error } = await supabase
        .from('ai_settings')
        .upsert({
          id: '1', // Use a single row for settings
          provider: formData.provider,
          openai_api_key: formData.openaiApiKey || null,
          azure_api_key: formData.azureApiKey || null,
          azure_endpoint: formData.azureEndpoint || null,
          azure_deployment_name: formData.azureDeploymentName || null,
          gemini_api_key: formData.geminiApiKey || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      dispatch({ type: 'SET_AI_SETTINGS', payload: formData });
      
      setSaveMessage({ type: 'success', message: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ 
        type: 'error', 
        message: 'Failed to save settings. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (formData.provider === 'none') return;
    
    setIsSaving(true);
    setSaveMessage(null);

    try {
      if (formData.provider === 'gemini' && formData.geminiApiKey) {
        const key = formData.geminiApiKey.trim();
        
        // Validate API key format without making actual API calls
        if (!key) {
          setSaveMessage({ type: 'error', message: '❌ API key is required' });
        } else if (!key.startsWith('AIza')) {
          setSaveMessage({ type: 'error', message: '❌ Invalid Gemini API key format. Should start with "AIza"' });
        } else if (key.length < 30) {
          setSaveMessage({ type: 'error', message: '❌ API key appears too short' });
        } else {
          setSaveMessage({ 
            type: 'success', 
            message: '✅ Gemini API key format looks valid! Save settings to use it.' 
          });
        }
      } else if (formData.provider === 'openai' && formData.openaiApiKey) {
        const key = formData.openaiApiKey.trim();
        
        if (!key) {
          setSaveMessage({ type: 'error', message: '❌ API key is required' });
        } else if (!key.startsWith('sk-')) {
          setSaveMessage({ type: 'error', message: '❌ Invalid OpenAI API key format. Should start with "sk-"' });
        } else if (key.length < 40) {
          setSaveMessage({ type: 'error', message: '❌ API key appears too short' });
        } else {
          setSaveMessage({ 
            type: 'success', 
            message: '✅ OpenAI API key format looks valid! Save settings to use it.' 
          });
        }
      } else if (formData.provider === 'azure' && formData.azureApiKey && formData.azureEndpoint) {
        const key = formData.azureApiKey.trim();
        const endpoint = formData.azureEndpoint.trim();
        const deployment = formData.azureDeploymentName?.trim();
        
        if (!key || !endpoint || !deployment) {
          setSaveMessage({ type: 'error', message: '❌ All Azure fields are required' });
        } else if (!endpoint.startsWith('https://')) {
          setSaveMessage({ type: 'error', message: '❌ Azure endpoint should start with "https://"' });
        } else if (!endpoint.includes('.openai.azure.com')) {
          setSaveMessage({ type: 'error', message: '❌ Azure endpoint should contain ".openai.azure.com"' });
        } else {
          setSaveMessage({ 
            type: 'success', 
            message: '✅ Azure configuration looks valid! Save settings to use it.' 
          });
        }
      } else {
        setSaveMessage({ type: 'error', message: '❌ Please fill in all required fields' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', message: '❌ Validation failed' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure AI providers to enhance invoice parsing capabilities
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Key className="h-5 w-5 mr-2" />
            AI Provider Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Choose and configure an AI provider to improve parsing accuracy for low-quality invoices
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              AI Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { value: 'none', label: 'None', description: 'Basic OCR only' },
                { value: 'gemini', label: 'Google Gemini', description: 'Free AI parsing (Recommended)' },
                { value: 'openai', label: 'OpenAI', description: 'GPT-powered parsing' },
                { value: 'azure', label: 'Azure OpenAI', description: 'Enterprise OpenAI' }
              ].map(({ value, label, description }) => (
                <div key={value}>
                  <label className="relative flex cursor-pointer rounded-lg border p-4 focus:outline-none">
                    <input
                      type="radio"
                      name="provider"
                      value={value}
                      checked={formData.provider === value}
                      onChange={(e) => handleProviderChange(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{label}</div>
                        <div className={`ml-auto h-4 w-4 rounded-full border-2 ${
                          formData.provider === value
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {formData.provider === value && (
                            <div className="h-2 w-2 rounded-full bg-white m-0.5"></div>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{description}</div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* OpenAI Configuration */}
          {formData.provider === 'openai' && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">OpenAI Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={formData.openaiApiKey || ''}
                  onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get your API key from{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                    OpenAI Dashboard
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Google Gemini Configuration */}
          {formData.provider === 'gemini' && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Google Gemini Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={formData.geminiApiKey || ''}
                  onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get your free API key from{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                    Google AI Studio
                  </a>
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Recommended Choice
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        Google Gemini offers generous free usage limits and excellent performance for invoice parsing.
                        No billing setup required!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Azure OpenAI Configuration */}
          {formData.provider === 'azure' && (
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Azure OpenAI Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.azureApiKey || ''}
                    onChange={(e) => handleInputChange('azureApiKey', e.target.value)}
                    placeholder="Your Azure API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endpoint
                  </label>
                  <input
                    type="url"
                    value={formData.azureEndpoint || ''}
                    onChange={(e) => handleInputChange('azureEndpoint', e.target.value)}
                    placeholder="https://your-resource.openai.azure.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deployment Name
                </label>
                <input
                  type="text"
                  value={formData.azureDeploymentName || ''}
                  onChange={(e) => handleInputChange('azureDeploymentName', e.target.value)}
                  placeholder="your-deployment-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Save Message */}
          {saveMessage && (
            <div className={`flex items-center p-3 rounded-md ${
              saveMessage.type === 'success' 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {saveMessage.type === 'success' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              {saveMessage.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <button
              onClick={testConnection}
              disabled={formData.provider === 'none' || isSaving}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Test Connection
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Processing Logs */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Processing Logs</h2>
          <p className="mt-1 text-sm text-gray-600">
            Recent processing activity and system messages
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {state.processingLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">No logs available</p>
            ) : (
              state.processingLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    log.type === 'success' ? 'bg-green-500' :
                    log.type === 'error' ? 'bg-red-500' :
                    log.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{log.message}</p>
                    <p className="text-xs text-gray-500">
                      {log.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;