import { Handle, Position } from '@xyflow/react';
import { BarChart, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SuggestionInput } from '../ui/SuggestionInput';

export function DataNode({ id, data }: { id: string, data: any }) {

    const [collection, setCollection] = useState(data.collection || '');
    const [op, setOp] = useState(data.op || 'sum');
    const [resultVar, setResultVar] = useState(data.resultVar || 'summary');

    useEffect(() => {
        data.collection = collection;
        data.op = op;
        data.resultVar = resultVar;
    }, [collection, op, resultVar, data]);

    const [expanded, setExpanded] = useState(false);

    return (
        <div
            onDoubleClick={() => setExpanded(!expanded)}
            className={`bg-slate-900 border-2 border-slate-700 hover:border-teal-500 rounded-xl shadow-xl transition-all group ${expanded ? 'min-w-[280px]' : 'min-w-[200px]'}`}
        >

            <Handle type="target" position={Position.Top} className="!bg-teal-500 !w-3 !h-3 !border-2 !border-slate-900 !top-[-6px]" />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg">
                        <BarChart className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-sm">Data / Stats</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-slate-500 hover:text-white transition-colors p-1"
                    >
                        {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <GripHorizontal className="text-slate-600 w-4 h-4" />
                </div>
            </div>

            {expanded && (
                <div className="p-4 space-y-4">

                    {/* Collection Input */}
                    <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">Collection (Array)</label>
                        <SuggestionInput
                            nodeId={id}
                            value={collection}
                            onValueChange={(val) => setCollection(val)}
                            className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                            placeholder="{myArray}"
                        />
                    </div>

                    {/* Operation Select */}
                    <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">Operation</label>
                        <select
                            value={op}
                            onChange={(e) => setOp(e.target.value)}
                            className="nodrag bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white w-full focus:outline-none focus:border-teal-500"
                        >
                            <option value="sum">Sum (Total)</option>
                            <option value="avg">Average</option>
                            <option value="count">Count (Length)</option>
                            <option value="min">Minimum Value</option>
                            <option value="max">Maximum Value</option>
                        </select>
                    </div>

                    {/* Result Variable */}
                    <div className="pt-2 border-t border-slate-800">
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">Store Result In</label>
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-2">
                            <span className="text-slate-500 text-xs">var</span>
                            <input
                                type="text"
                                value={resultVar}
                                onChange={(e) => setResultVar(e.target.value)}
                                className="nodrag flex-1 bg-transparent py-1.5 text-xs text-green-400 font-bold focus:outline-none placeholder:text-slate-700"
                                placeholder="summary"
                            />
                        </div>
                    </div>

                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-teal-500 !w-3 !h-3 !border-2 !border-slate-900 !bottom-[-6px]" />
            <Handle type="source" position={Position.Right} className="!bg-teal-500 !w-3 !h-3 !border-2 !border-slate-900 !right-[-6px]" />

        </div>
    );
}
