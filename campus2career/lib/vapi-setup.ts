// Vapi Setup - Initialize assistant-workflow connections
import { vapiMCP } from './vapi-mcp';

export async function initializeVapiConnections() {
  try {
    // Connect your main assistant to the main workflow
    const mainConnected = await vapiMCP.connectAssistantToWorkflow(
      process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
      process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!
    );

    // Connect your assistant to the custom interview workflow (if different)
    const customConnected = await vapiMCP.connectAssistantToWorkflow(
      process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!,
      process.env.NEXT_PUBLIC_VAPI_CUSTOM_INTERVIEW_WORKFLOW_ID!
    );

    console.log('Vapi connections initialized:', {
      mainWorkflow: mainConnected,
      customWorkflow: customConnected
    });

    return {
      mainWorkflow: mainConnected,
      customWorkflow: customConnected
    };
  } catch (error) {
    console.error('Failed to initialize Vapi connections:', error);
    return {
      mainWorkflow: false,
      customWorkflow: false
    };
  }
}

// Call this when your app starts
export function setupVapi() {
  // Only run on client side
  if (typeof window !== 'undefined') {
    initializeVapiConnections();
  }
}
