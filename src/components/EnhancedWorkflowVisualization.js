import React from 'react';
import ReactFlow, { Background, addEdge } from 'react-flow-renderer';

const EnhancedWorkflowVisualization = ({ workflow, setWorkflow }) => {
  const onConnect = (params) => setWorkflow((prev) => addEdge(params, prev));

  return (
    <ReactFlow
      elements={workflow}
      onConnect={onConnect}
      style={{ width: '100%', height: '400px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
    >
      <Background gap={16} />
    </ReactFlow>
  );
};

export default EnhancedWorkflowVisualization;
