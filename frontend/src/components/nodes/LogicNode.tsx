import { Handle, Position } from '@xyflow/react';
import { GitFork, AlertCircle, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { SuggestionInput } from '../ui/SuggestionInput';

export function LogicNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };
    const [condition, setCondition] = useState(data.condition || 'x > 0');

    const [expanded, setExpanded] = useState(false);

    return (
        <div
            onDoubleClick={() => setExpanded(!expanded)}
            className={`bg-slate-900 border-2 border-slate-700 hover:border-yellow-500 rounded-xl shadow-xl transition-all group ${expanded ? 'min-w-[280px]' : 'min-w-[200px]'}`}
        >

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
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-slate-500 hover:text-white transition-colors p-1"
                    >
                        {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-slate-800"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 space-y-3">
                    <div className="bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10 flex gap-3">
                        <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <p className="text-[10px] text-yellow-200/70 leading-relaxed">
                            Evaluates the expression below. If true, flow continues to green output. If false, red output.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Expression</label>
                        <SuggestionInput
                            nodeId={id}
                            value={condition}
                            onValueChange={(val) => {
                                setCondition(val);
                                data.condition = val;
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500 transition-colors mb-2"
                            placeholder="myVar > 10"
                        />
                    </div>
                </div>
            )}

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
