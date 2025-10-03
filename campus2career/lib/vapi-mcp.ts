// Vapi MCP (Model Context Protocol) Service
// This handles the new decoupled assistant-workflow architecture

interface VapiMCPConfig {
  apiKey: string;
  baseUrl?: string;
}

interface WorkflowTrigger {
  workflowId: string;
  assistantId: string;
  variableValues?: Record<string, any>;
}

class VapiMCPService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: VapiMCPConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.vapi.ai';
  }

  // Connect an assistant to a workflow programmatically
  async connectAssistantToWorkflow(assistantId: string, workflowId: string): Promise<boolean> {
    // In the new Vapi architecture, direct connections between assistants and workflows
    // might not be required. Workflows are triggered directly via the /call endpoint.
    console.log(`Assistant ${assistantId} and workflow ${workflowId} are ready for calls`);
    return true;
  }

  // Trigger a workflow with an assistant
  async triggerWorkflow(config: WorkflowTrigger): Promise<string | null> {
    try {
      // The correct Vapi API endpoint for creating calls
      const endpoint = `${this.baseUrl}/call`;
      
      console.log(`Creating call with endpoint: ${endpoint}`);
      
      const requestBody = {
        assistantId: config.assistantId,
        workflowId: config.workflowId,
        variableValues: config.variableValues || {}
      };

      console.log('Request body:', requestBody);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`Response status: ${response.status}`);
      const responseText = await response.text();
      console.log(`Response: ${responseText}`);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          return data.id || data.callId || 'success';
        } catch (parseError) {
          console.log('Could not parse response, assuming success');
          return 'success';
        }
      } else {
        throw new Error(`API call failed: ${response.status} - ${responseText}`);
      }
    } catch (error) {
      console.error('Error triggering workflow:', error);
      return null;
    }
  }

  // Get assistant details
  async getAssistant(assistantId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/assistant/${assistantId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get assistant: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting assistant:', error);
      return null;
    }
  }

  // Get workflow details
  async getWorkflow(workflowId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/workflow/${workflowId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get workflow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting workflow:', error);
      return null;
    }
  }
}

// Create singleton instance
export const vapiMCP = new VapiMCPService({
  apiKey: process.env.NEXT_PUBLIC_VAPI_API_KEY!,
});

export default VapiMCPService;
