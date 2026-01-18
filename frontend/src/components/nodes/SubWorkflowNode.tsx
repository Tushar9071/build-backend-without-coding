import { memo, useEffect, useState, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Component } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

interface Parameter {
    name: string;
    type: string;
    required: boolean;
}

export const SubWorkflowNode = memo(({ data, isConnectable }: NodeProps) => {
    const { workflows, fetchWorkflows } = useWorkflowStore();
    const [paramMappings, setParamMappings] = useState<Record<string, string>>(
        (data.paramMappings as Record<string, string>) || {}
    );

    useEffect(() => {
        if (workflows.length === 0) fetchWorkflows();
    }, [fetchWorkflows, workflows.length]);

    // Only show FUNCTION workflows in the dropdown (not routes or interfaces)
    const callableWorkflows = workflows.filter(w => w.category === 'function');
    const selectedFunctionId = data.functionId as string;

    // Find the selected function and extract its parameters from the FunctionStartNode
    const selectedFunction = useMemo(() => {
        return workflows.find(w => w.id === selectedFunctionId);
    }, [workflows, selectedFunctionId]);

    const functionParameters = useMemo((): Parameter[] => {
        if (!selectedFunction?.nodes) return [];

        // Find function_start node and get its parameters
        const startNode = selectedFunction.nodes.find((n: any) => n.type === 'function_start');
        if (startNode?.data?.parameters) {
            return startNode.data.parameters as Parameter[];
        }
        return [];
    }, [selectedFunction]);

    const handleFunctionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        data.functionId = val;
        // Reset mappings when function changes
        setParamMappings({});
        data.paramMappings = {};
    };

    const handleMappingChange = (paramName: string, value: string) => {
        const newMappings = { ...paramMappings, [paramName]: value };
        setParamMappings(newMappings);
        data.paramMappings = newMappings;
    };

    return (
        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-xl shadow-lg min-w-[280px]">
            <div className="bg-indigo-500 px-4 py-2 rounded-t-lg flex items-center gap-2">
                <Component className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">Call Function</span>
            </div>

            <div className="p-4 space-y-3">
                <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Function to Call</label>
                    <select
                        className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={selectedFunctionId || ''}
                        onChange={handleFunctionChange}
                    >
                        <option value="">Select a function...</option>
                        {callableWorkflows.map(wf => (
                            <option key={wf.id} value={wf.id}>{wf.name}</option>
                        ))}
                    </select>
                </div>

                {/* Parameter Mappings */}
                {functionParameters.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                            Pass Arguments
                        </label>
                        {functionParameters.map((param) => (
                            <div key={param.name} className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 min-w-[80px]">
                                    {param.name}:
                                </span>
                                <input
                                    type="text"
                                    className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="{variableName} or value"
                                    value={paramMappings[param.name] || ''}
                                    onChange={(e) => handleMappingChange(param.name, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                <p className="text-[10px] text-slate-400 italic">
                    Result stored in 'func_result'. Use {'{variableName}'} to pass context values.
                </p>
            </div>

            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-slate-400" />
            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-500" />
        </div>
    );
});
