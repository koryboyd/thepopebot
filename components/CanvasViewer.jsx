'use client';

import { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

export default function CanvasViewer() {
  const [data, setData] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    fetch('/canvas-state.json')
      .then(r => r.ok ? r.json() : {})
      .then(d => setData({ nodes: d.nodes || [], edges: d.edges || [] }))
      .catch(() => {});
  }, []);

  return (
    <div style={{ height: '500px', border: '1px solid #ddd', borderRadius: '8px', margin: '1rem 0' }}>
      <ReactFlow nodes={data.nodes} edges={data.edges} fitView>
        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}