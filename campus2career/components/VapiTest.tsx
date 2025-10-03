"use client";

import { useState } from 'react';
import { vapiMCP } from '@/lib/vapi-mcp';

export default function VapiTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runVapiTests = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      // Test 1: Check environment variables
      results.envVars = {
        apiKey: process.env.NEXT_PUBLIC_VAPI_API_KEY ? '✅ Set' : '❌ Missing',
        assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ? '✅ Set' : '❌ Missing',
        workflowId: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID ? '✅ Set' : '❌ Missing',
      };

      // Test 2: Get Assistant details
      if (process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID) {
        const assistant = await vapiMCP.getAssistant(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);
        results.assistant = assistant ? '✅ Found' : '❌ Not found';
        results.assistantDetails = assistant;
      }

      // Test 3: Get Workflow details
      if (process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
        const workflow = await vapiMCP.getWorkflow(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID);
        results.workflow = workflow ? '✅ Found' : '❌ Not found';
        results.workflowDetails = workflow;
      }

      // Test 4: Try to connect assistant to workflow
      if (process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID && process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
        const connected = await vapiMCP.connectAssistantToWorkflow(
          process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
          process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID
        );
        results.connection = connected ? '✅ Connected' : '⚠️ Connection not required (new architecture)';
      }

      // Test 5: Test workflow triggering (most important)
      if (process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID && process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID) {
        console.log('Testing workflow trigger with:', {
          workflowId: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID,
          assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
        });
        
        const callId = await vapiMCP.triggerWorkflow({
          workflowId: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID,
          assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
          variableValues: {
            username: 'test_user',
            userid: 'test_id'
          }
        });
        
        console.log('Workflow trigger result:', callId);
        results.workflowTrigger = callId ? `✅ Triggered (Call ID: ${callId})` : '❌ Failed to trigger';
        results.triggerDetails = { callId, workflowId: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID, assistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID };
      }

    } catch (error) {
      results.error = error;
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Vapi Setup Test</h2>
      
      <button
        onClick={runVapiTests}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Run Vapi Tests'}
      </button>

      {testResults && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
          
          <div className="space-y-2">
            <div><strong>Environment Variables:</strong></div>
            <ul className="ml-4">
              <li>API Key: {testResults.envVars?.apiKey}</li>
              <li>Assistant ID: {testResults.envVars?.assistantId}</li>
              <li>Workflow ID: {testResults.envVars?.workflowId}</li>
            </ul>

            <div><strong>Assistant:</strong> {testResults.assistant}</div>
            <div><strong>Workflow:</strong> {testResults.workflow}</div>
            <div><strong>Connection:</strong> {testResults.connection}</div>
            <div><strong>Workflow Trigger:</strong> {testResults.workflowTrigger}</div>

            {testResults.error && (
              <div className="text-red-500">
                <strong>Error:</strong> {JSON.stringify(testResults.error)}
              </div>
            )}
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">Detailed Results</summary>
            <pre className="mt-2 p-2 bg-gray-200 rounded text-sm overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
