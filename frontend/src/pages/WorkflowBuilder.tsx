import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, addEdge, type Connection, type Node, type Edge, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../store/workflowStore';
import { Save, Play, X, Terminal, Loader2, CheckCircle2, AlertTriangle, Undo, Redo, Github } from 'lucide-react';
import { ApiNode } from '../components/nodes/ApiNode';
import { FunctionNode } from '../components/nodes/FunctionNode';
import { LogicNode } from '../components/nodes/LogicNode';
import { VariableNode } from '../components/nodes/VariableNode';
import { ResponseNode } from '../components/nodes/ResponseNode';
import { InterfaceNode } from '../components/nodes/InterfaceNode';
import { LoopNode } from '../components/nodes/LoopNode';
import { MathNode } from '../components/nodes/MathNode';
import { DataNode } from '../components/nodes/DataNode';
import { DatabaseNode } from '../components/nodes/DatabaseNode';
import { NodesToolbar } from '../components/ui/NodesToolbar';
import { DeployModal } from '../components/ui/DeployModal';
import { toast } from 'react-hot-toast';
import useUndoRedo from '../hooks/useUndoRedo'; // We will create this hook
import { useThemeStore } from '../store/themeStore';

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { undo, redo, canUndo, canRedo, takeSnapshot } = useUndoRedo();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const connectingNodeId = useRef<any>(null);

  const { theme } = useThemeStore();

  const [connectionMenu, setConnectionMenu] = useState<{ x: number; y: number; source: string; sourceHandle: string | null } | null>(null);

  const { id } = useParams<{ id: string }>();
  const { loadWorkflow, saveWorkflow, runWorkflow, currentWorkflow } = useWorkflowStore();

  // ... (rest of run modal state) ...

  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
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
    database: DatabaseNode,
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
      connectingNodeId.current = null;
      setEdges((eds) => {
        const newEdges = addEdge(params, eds);
        takeSnapshot({ nodes, edges: newEdges });
        return newEdges;
      });
    },
    [setEdges, takeSnapshot, nodes],
  );

  const onConnectStart = useCallback((_: any, { nodeId, handleId }: { nodeId: string | null; handleId: string | null }) => {
    connectingNodeId.current = { nodeId, handleId };
  }, []);

  const onConnectEnd = useCallback(
    (event: any) => {
      if (!connectingNodeId.current) return;

      const targetIsPane = event.target.classList.contains('react-flow__pane');

      if (targetIsPane && reactFlowWrapper.current) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const { top, left } = reactFlowWrapper.current.getBoundingClientRect();
        const id = connectingNodeId.current.nodeId;
        const handle = connectingNodeId.current.handleId;

        // Set menu state to show popup at this location
        // We use screen coordinates for the menu position (fixed/absolute overlay)
        setConnectionMenu({
          x: event.clientX - left,
          y: event.clientY - top,
          source: id,
          sourceHandle: handle
        });
      }
    },
    [],
  );

  // _onNodesChange removed (unused)
  // handleNodesChange removed (unused)

  // Effect to capture state changes for undo/redo
  // This is a naive implementation.
  useEffect(() => {
    const handler = setTimeout(() => {
    }, 500);
    return () => clearTimeout(handler);
  }, [nodes, edges]);


  const handleAddNode = (type: string, position?: { x: number, y: number }, connection?: { source: string, sourceHandle: string | null }) => {
    // If called from connection menu, project position to Flow coordinates
    let projectedPos = null;

    if (position && reactFlowWrapper.current) {
      // position is container relative (from onConnectEnd)
      // We need to convert this to Flow Coords (taking zoom/pan into account)
      // screenToFlowPosition takes Screen Coords (ClientX/Y)
      // So we reconstruct Screen Coords:
      const { left, top } = reactFlowWrapper.current.getBoundingClientRect();
      projectedPos = screenToFlowPosition({
        x: position.x + left,
        y: position.y + top
      });
    }

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: projectedPos || {
        x: Math.random() * 500 + 100,
        y: Math.random() * 500 + 100
      },
      data: { label: `New ${type}` },
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);

    // If connecting
    let newEdges = edges;
    if (connection) {
      const newEdge: Edge = {
        id: `e${connection.source}-${newNode.id}`,
        source: connection.source,
        sourceHandle: connection.sourceHandle,
        target: newNode.id,
        targetHandle: null // auto connect to default/appropriate handle? 
        // Most nodes have 'target' or similar id. Or logic has 'true'/'false'.
      };
      newEdges = addEdge(newEdge, edges);
    }

    setEdges(newEdges);
    takeSnapshot({ nodes: newNodes, edges: newEdges });
    setConnectionMenu(null);
  };

  const handleSave = async () => {
    if (id) {
      await saveWorkflow(id, nodes, edges);
    }
  };

  // API Nodes for selection
  const apiNodes = useMemo(() =>
    nodes.filter(n => n.type === 'api'),
    [nodes]
  );

  const [selectedApiNodeId, setSelectedApiNodeId] = useState<string>('');

  // Auto-select first API node if available and selection is invalid
  useEffect(() => {
    if (apiNodes.length > 0) {
      if (!selectedApiNodeId || !apiNodes.find(n => n.id === selectedApiNodeId)) {
        setSelectedApiNodeId(apiNodes[0].id);
      }
    } else {
      setSelectedApiNodeId('');
    }
  }, [apiNodes, selectedApiNodeId]);

  const handleRunningParams = useMemo(() => {
    // Logic to show which endpoint is selected
    if (!selectedApiNodeId) return null;
    const n = nodes.find(x => x.id === selectedApiNodeId);
    if (!n) return null;
    return {
      method: n.data.method || 'GET',
      path: n.data.path || '/'
    }
  }, [selectedApiNodeId, nodes]);

  const handleRun = async () => {
    if (!id) return;
    setIsRunning(true);
    setExecutionResult(null);

    try {
      const parsedInput = JSON.parse(inputJson);

      // Inject selected API node ID if available
      if (selectedApiNodeId) {
        parsedInput.start_node_id = selectedApiNodeId;
      }

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
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-20 relative shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Workflow Editor</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Editing: {currentWorkflow?.name || 'Untitled Workflow'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-colors ${!canUndo ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-colors ${!canRedo ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Github className="w-4 h-4 text-slate-700 dark:text-white" />
            Deploy
          </button>

          <button
            onClick={() => setIsRunModalOpen(true)}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Play className="w-4 h-4 text-green-500 dark:text-green-400" />
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

      <div className="flex-1 bg-slate-50 dark:bg-slate-950 relative" ref={reactFlowWrapper}>
        <NodesToolbar onAddNode={handleAddNode} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            if (changes.some((c: any) => c.type === 'remove' || (c.type === 'position' && c.dragging === false) || c.type === 'add')) {
              // snapshot logic
            }
          }}
          onNodeDragStop={() => takeSnapshot({ nodes, edges })}
          onEdgesChange={(changes) => {
            onEdgesChange(changes);
            if (changes.some((c: any) => c.type === 'remove' || c.type === 'add')) {
              takeSnapshot({ nodes, edges });
            }
          }}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          nodeTypes={nodeTypes}
          fitView
          colorMode={theme as 'dark' | 'light'}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Control', 'Meta', 'Shift']}
          selectionKeyCode={['Shift']}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={theme === 'dark' ? '#1e293b' : '#cbd5e1'} gap={16} />
          <Controls className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 fill-slate-500 dark:fill-white" />
        </ReactFlow>

        {/* Connection Context Menu */}
        {connectionMenu && (
          <div
            className="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2 flex flex-col gap-1 w-48 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: connectionMenu.y, left: connectionMenu.x }}
          >
            <div className="text-xs font-semibold text-slate-500 px-2 py-1">Add Node & Connect</div>
            {['api', 'function', 'logic', 'variable', 'response', 'interface', 'loop', 'math', 'data_op', 'database'].map((type) => (
              <button
                key={type}
                onClick={() => handleAddNode(type, { x: connectionMenu.x, y: connectionMenu.y }, { source: connectionMenu.source, sourceHandle: connectionMenu.sourceHandle })}
                className="text-left px-2 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors capitalize"
              >
                {type.replace('_', ' ')}
              </button>
            ))}
            <button
              onClick={() => setConnectionMenu(null)}
              className="text-left px-2 py-1.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md transition-colors border-t border-slate-100 dark:border-slate-800 mt-1"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <DeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        workflowId={id || ''}
      />

      {/* Run Modal */}
      {isRunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-2xl h-[600px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white">Test Workflow</h3>
              </div>
              <button onClick={() => setIsRunModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex flex-col p-0">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <button
                  onClick={() => setActiveTab('input')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'input' ? 'border-indigo-500 text-indigo-600 dark:text-white bg-indigo-50 dark:bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Input (JSON)
                </button>
                <button
                  onClick={() => setActiveTab('output')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'output' ? 'border-green-500 text-green-600 dark:text-white bg-green-50 dark:bg-green-500/5' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Output
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-orange-500 text-orange-600 dark:text-white bg-orange-50 dark:bg-orange-500/5' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Execution Logs
                </button>
              </div>

              {/* Tab Panels */}
              <div className="flex-1 p-4 overflow-hidden relative bg-white dark:bg-slate-900">
                {activeTab === 'input' && (
                  <div className="h-full flex flex-col">
                    {/* API Selector */}
                    {apiNodes.length > 1 && (
                      <div className="mb-4">
                        <label className="text-xs font-semibold text-slate-500 mb-2 block">Entry Point</label>
                        <select
                          value={selectedApiNodeId}
                          onChange={e => setSelectedApiNodeId(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-900 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                        >
                          {apiNodes.map(node => (
                            <option key={node.id} value={node.id}>
                              {(node.data.label as string) || 'API Node'} ({(node.data.method as string) || 'GET'} {(node.data.path as string) || '/'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <label className="text-xs font-semibold text-slate-500 mb-2">Request Body</label>
                    <textarea
                      value={inputJson}
                      onChange={(e) => setInputJson(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500 resize-none selection:bg-indigo-100 dark:selection:bg-indigo-900"
                      placeholder='{ "key": "value" }'
                      spellCheck={false}
                    />
                  </div>
                )}

                {activeTab === 'output' && (
                  <div className="h-full flex flex-col">
                    {executionResult ? (
                      <>
                        <div className={`flex items-center gap-2 mb-2 text-sm font-semibold ${executionResult.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {executionResult.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          {executionResult.status === 'success' ? 'Success' : 'Error'}
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-800 dark:text-slate-300 overflow-auto">
                          <pre>{JSON.stringify(executionResult.response || executionResult.error || executionResult, null, 2)}</pre>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 flex-col gap-2">
                        <Play className="w-10 h-10 opacity-20" />
                        <p>Run the workflow to see output</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'logs' && (
                  <div className="h-full flex flex-col">
                    {executionResult?.logs ? (
                      <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-600 dark:text-slate-400 overflow-auto space-y-1">
                        {executionResult.logs.map((log: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-slate-400 dark:text-slate-600 select-none">[{i + 1}]</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 flex-col gap-2">
                        <Terminal className="w-10 h-10 opacity-20" />
                        <p>No logs available yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <div className="text-xs text-slate-500">
                Endpoint: <span className="font-mono bg-slate-200 dark:bg-slate-900 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                  {handleRunningParams ? `${handleRunningParams.method} /api/v1/invoke${handleRunningParams.path}` : 'No API Node Selected'}
                </span>
              </div>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-green-500/20 dark:shadow-green-900/20 active:scale-95"
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
