import { AISettings } from '../types';

export const enhanceInvoiceParsingWithAI = async (
  ocrText: string,
  settings: AISettings
): Promise<any> => {
  if (settings.provider === 'none' || !ocrText) {
    return null;
  }
  
  const prompt = `
    You are an expert invoice parser. Extract the following information from this invoice text:
    - Invoice Number
    - Date
    - Vendor/Company Name
    - Total Amount
    - Line Items (description, quantity, price, total)
    
    Invoice Text:
    ${ocrText}
    
    Please respond with a JSON object containing the extracted information.
  `;
  
  try {
    if (settings.provider === 'openai' && settings.openaiApiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an expert invoice parser.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    }
    
    if (settings.provider === 'azure' && settings.azureApiKey) {
      const response = await fetch(`${settings.azureEndpoint}/openai/deployments/${settings.azureDeploymentName}/chat/completions?api-version=2023-05-15`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': settings.azureApiKey
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are an expert invoice parser.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        throw new Error(`Azure OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    }
  } catch (error) {
    console.error('AI parsing error:', error);
    return null;
  }
  
  return null;
};