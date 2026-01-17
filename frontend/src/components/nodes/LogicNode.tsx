import { Handle, Position } from '@xyflow/react';
import { GitFork, AlertCircle, Trash2, Database } from 'lucide-react';
import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useWorkflowVariables } from '../../hooks/useWorkflowVariables';

export function LogicNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();
    const variables = useWorkflowVariables();

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };
    const [condition, setCondition] = useState(data.condition || 'x > 0');

    const insertVariable = (varName: string) => {
        // For logic expressions in python/js, we often use the variable name directly without braces 
        // IF the engine supports it in the local scope.
        // However, our backend run logic handles substitutions or scope.
        // Let's assume we want to insert 'myVar'.
        // If the user wants specific syntax, they can type it, but 'myVar' is a safe default for expression evaluation contexts.
        const syntax = ` ${varName} `;
        setCondition((prev: any) => prev + syntax);
        data.condition = condition + syntax;
    };

    return (
        <div className="bg-slate-900 border-2 border-slate-700 hover:border-yellow-500 rounded-xl min-w-[280px] shadow-xl transition-all group">

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg">
                        <GitFork className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-sm">Condition (If/Else)</span>
                </div>
                <button
                    onClick={handleDelete}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-slate-800"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                <div className="bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <p className="text-[10px] text-yellow-200/70 leading-relaxed">
                        Evaluates the expression below. If true, flow continues to green output. If false, red output.
                    </p>
                </div>

                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Expression</label>
                    <input
                        type="text"
                        value={condition}
                        onChange={(e) => {
                            setCondition(e.target.value);
                            data.condition = e.target.value;
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500 transition-colors mb-2"
                        placeholder="myVar > 10"
                    />

                    {/* Variable Suggestions */}
                    {variables.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] text-slate-600 mr-1 pt-0.5">Insert:</span>
                            {variables.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => insertVariable(v.name)}
                                    className="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded text-[10px] font-mono transition-colors flex items-center gap-1"
                                    title={`Type: ${v.type}`}
                                >
                                    <Database className="w-2.5 h-2.5" />
                                    {v.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Outputs */}
            <div className="flex justify-between px-4 pb-4">
                <div className="flex flex-col items-center relative">
                    <span className="text-[10px] text-green-500 font-bold mb-1">TRUE</span>
                    {/* The handle cannot be absolutely positioned easily relative to this div if we want standard ReactFlow behavior, 
                usually handles are absolute relative to the node. 
                But we can fake the alignment or use 'relative' handles if supported, or just absolute positioning with calc.
                Let's use absolute positioning relative to node bottom.
             */}
                </div>
                <div className="flex flex-col items-center relative">
                    <span className="text-[10px] text-red-500 font-bold mb-1">FALSE</span>
                </div>
            </div>

            {/* Handles - manually positioned */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                className="!bg-green-500 !w-3 !h-3 !border-2 !border-slate-900 !left-[25%]"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                className="!bg-red-500 !w-3 !h-3 !border-2 !border-slate-900 !left-[75%]"
            />
        </div>
    );
}
