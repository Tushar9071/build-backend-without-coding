import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, addEdge, type Connection, type Node, type Edge, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../store/workflowStore';
import { Save, Play, X, Terminal, Loader2, CheckCircle2, AlertTriangle, Undo, Redo } from 'lucide-react';
import { ApiNode } from '../components/nodes/ApiNode';
import { FunctionNode } from '../components/nodes/FunctionNode';
import { LogicNode } from '../components/nodes/LogicNode';
import { VariableNode } from '../components/nodes/VariableNode';
import { ResponseNode } from '../components/nodes/ResponseNode';
import { InterfaceNode } from '../components/nodes/InterfaceNode';
import { LoopNode } from '../components/nodes/LoopNode';
import { MathNode } from '../components/nodes/MathNode';
import { DataNode } from '../components/nodes/DataNode';
import { NodesToolbar } from '../components/ui/NodesToolbar';
import { toast } from 'react-hot-toast';
import useUndoRedo from '../hooks/useUndoRedo'; // We will create this hook

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { undo, redo, canUndo, canRedo, takeSnapshot } = useUndoRedo();


  const { id } = useParams<{ id: string }>();
  const { loadWorkflow, saveWorkflow, runWorkflow, currentWorkflow } = useWorkflowStore();

  // Run Modal State
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [inputJson, setInputJson] = useState('{\n  "key": "value"\n}');
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'logs'>('input');

  const nodeTypes = useMemo(() => ({
    api: ApiNode,
    function: FunctionNode,
    logic: LogicNode,
    variable: VariableNode,
    response: ResponseNode,
    interface: InterfaceNode,
    loop: LoopNode,
    math: MathNode,
    data_op: DataNode,
  }), []);

  useEffect(() => {
    if (id) {
      loadWorkflow(id);
    }
  }, [id, loadWorkflow]);

  // Load initial workflow into state
  useEffect(() => {
    if (currentWorkflow) {
      setNodes(currentWorkflow.nodes || []);
      setEdges(currentWorkflow.edges || []);
    }
  }, [currentWorkflow, setNodes, setEdges]);

  // Register initial snapshot
  useEffect(() => {
    if (currentWorkflow?.nodes && currentWorkflow.nodes.length > 0) {
      takeSnapshot({ nodes: currentWorkflow.nodes, edges: currentWorkflow.edges || [] });
    }
  }, [currentWorkflow, takeSnapshot]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(params, eds);
        takeSnapshot({ nodes, edges: newEdges });
        return newEdges;
      });
    },
    [setEdges, takeSnapshot, nodes],
  );

  // _onNodesChange removed (unused)

  // Wrap node changes to capture drag end or delete
  // handleNodesChange removed (unused)

  // Effect to capture state changes for undo/redo
  // This is a naive implementation. For robust undo/redo with React Flow, usually we throttle updates.
  useEffect(() => {
    const handler = setTimeout(() => {
      // This runs on every render/update, causing too many snapshots.
      // We should manually call takeSnapshot on user actions (add, delete, connect, dragEnd)
    }, 500);
    return () => clearTimeout(handler);
  }, [nodes, edges]);


  const handleAddNode = (type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 500 + 100
      },
      data: { label: `New ${type}` },
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    takeSnapshot({ nodes: newNodes, edges });
  };

  const handleSave = async () => {
    if (id) {
      await saveWorkflow(id, nodes, edges);
    }
  };

  const handleRun = async () => {
    if (!id) return;
    setIsRunning(true);
    setExecutionResult(null);

    try {
      const parsedInput = JSON.parse(inputJson);
      // Auto-save before running to ensure latest version is executed
      await saveWorkflow(id, nodes, edges);

      const result = await runWorkflow(id, parsedInput);
      setExecutionResult(result);
      if (result.status === 'success') {
        setActiveTab('output');
        toast.success('Workflow executed successfully');
      } else {
        setActiveTab('logs');
        toast.error('Workflow execution failed');
      }
    } catch (err) {
      console.error(err);
      if (err instanceof SyntaxError) {
        toast.error('Invalid JSON input');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const onRestore = useCallback((state: { nodes: Node[], edges: Edge[] }) => {
    setNodes(state.nodes);
    setEdges(state.edges);
  }, [setNodes, setEdges]);

  // Bind undo/redo to hook
  useEffect(() => {
    // We pass the set functions to the hook or handle it here?
    // Actually the hook usually returns current state. 
    // Let's refactor `useUndoRedo` to manage the history internally and return a function to restore.

    // SEE implementation of useUndoRedo below
  }, []);

  const handleUndo = () => {
    const previous = undo();
    if (previous) onRestore(previous);
  }

  const handleRedo = () => {
    const next = redo();
    if (next) onRestore(next);
  }


  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Save: Ctrl + S
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }

      // Undo: Ctrl + Z
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) handleUndo();
      }

      // Redo: Ctrl + Y or Ctrl + Shift + Z
      if (((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        if (canRedo) handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleUndo, handleRedo, canUndo, canRedo]);


  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center z-20 relative shadow-md">
        <div>
          <h1 className="text-xl font-bold text-white">Workflow Editor</h1>
          <p className="text-xs text-slate-400">Editing: {currentWorkflow?.name || 'Untitled Workflow'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 rounded-lg p-1 mr-2 border border-slate-700">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-colors ${!canUndo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-colors ${!canRedo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsRunModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700"
          >
            <Play className="w-4 h-4 text-green-400" />
            Run
          </button>
          <button
            onClick={handleSave}
            title="Save (Ctrl+S)"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 relative">
        <NodesToolbar onAddNode={handleAddNode} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            // Simple heuristic: if change is 'dimensions' (resize) we ignore, 
            // if it is drag stop (type=position, dragging=false) we snapshot
            // DELETEs are type='remove'
            if (changes.some((c: any) => c.type === 'remove' || (c.type === 'position' && c.dragging === false) || c.type === 'add')) {
              // We need to wait for state update? No, use functional update or current nodes if possible.
              // Actually 'nodes' here might be stale closure. 
              // Better to rely on a debounce effect on 'nodes' from parent
            }
          }}
          onNodeDragStop={() => takeSnapshot({ nodes, edges })}
          onEdgesChange={(changes) => {
            onEdgesChange(changes);
            if (changes.some((c: any) => c.type === 'remove' || c.type === 'add')) {
              takeSnapshot({ nodes, edges }); // Rough approximation, might need fixing
            }
          }}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Control', 'Meta', 'Shift']}
          selectionKeyCode={['Shift']}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e293b" gap={16} />
          <Controls className="bg-slate-800 border-slate-700 fill-white" />
        </ReactFlow>
      </div>

      {/* Run Modal */}
      {isRunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl h-[600px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white">Test Workflow</h3>
              </div>
              <button onClick={() => setIsRunModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex flex-col p-0">
              {/* Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-900/50">
                <button
                  onClick={() => setActiveTab('input')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'input' ? 'border-indigo-500 text-white bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Input (JSON)
                </button>
                <button
                  onClick={() => setActiveTab('output')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'output' ? 'border-green-500 text-white bg-green-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Output
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-orange-500 text-white bg-orange-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  Execution Logs
                </button>
              </div>

              {/* Tab Panels */}
              <div className="flex-1 p-4 overflow-hidden relative">
                {activeTab === 'input' && (
                  <div className="h-full flex flex-col">
                    <label className="text-xs font-semibold text-slate-500 mb-2">Request Body</label>
                    <textarea
                      value={inputJson}
                      onChange={(e) => setInputJson(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                      placeholder='{ "key": "value" }'
                      spellCheck={false}
                    />
                  </div>
                )}

                {activeTab === 'output' && (
                  <div className="h-full flex flex-col">
                    {executionResult ? (
                      <>
                        <div className={`flex items-center gap-2 mb-2 text-sm font-semibold ${executionResult.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                          {executionResult.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          {executionResult.status === 'success' ? 'Success' : 'Error'}
                        </div>
                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-auto">
                          <pre>{JSON.stringify(executionResult.response || executionResult.error || executionResult, null, 2)}</pre>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-2">
                        <Play className="w-10 h-10 opacity-20" />
                        <p>Run the workflow to see output</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'logs' && (
                  <div className="h-full flex flex-col">
                    {executionResult?.logs ? (
                      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-400 overflow-auto space-y-1">
                        {executionResult.logs.map((log: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-slate-600 select-none">[{i + 1}]</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-2">
                        <Terminal className="w-10 h-10 opacity-20" />
                        <p>No logs available yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                Endpoint: <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400">POST /api/v1/workflows/{id}/run</span>
              </div>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-green-900/20 active:scale-95"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Run Workflow
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  )
}
