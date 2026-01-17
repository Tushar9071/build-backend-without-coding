import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Repeat, Trash2, Play } from 'lucide-react';
import { useState } from 'react';

export function LoopNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();
    const [collection, setCollection] = useState(data.collection || '');
    const [variable, setVariable] = useState(data.variable || '');

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <div className="bg-slate-900 border-2 border-slate-700 hover:border-purple-500 rounded-xl min-w-[280px] shadow-xl transition-all group relative pb-8 pr-4">

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-purple-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                        <Repeat className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="font-semibold text-white text-sm block leading-none">Iterator</span>
                        <span className="text-[10px] text-slate-500 font-medium">Loop Collection</span>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-slate-800"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-4">

                {/* Collection Input */}
                <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Collection (Array)</label>
                    <input
                        type="text"
                        value={collection}
                        onChange={(e) => {
                            setCollection(e.target.value);
                            data.collection = e.target.value;
                        }}
                        className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono transition-colors"
                        placeholder="e.g. body.items"
                    />
                </div>

                {/* Variable Name Input */}
                <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Item Variable Name</label>
                    <input
                        type="text"
                        value={variable}
                        onChange={(e) => {
                            setVariable(e.target.value);
                            data.variable = e.target.value;
                        }}
                        className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono transition-colors"
                        placeholder="e.g. item"
                    />
                </div>
            </div>

            {/* Footer / Status */}
            <div className="bg-slate-950/50 p-2 rounded-b-xl border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Iterations</span>
                <span className="text-[10px] font-mono text-purple-400">Dynamic</span>
            </div>

            {/* Output Handles */}

            {/* 'Do' Handle (Right) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center">
                <div className="absolute right-4 flex items-center gap-1 pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-purple-300 bg-slate-950/80 px-1 rounded shadow-sm">Next</span>
                    <Play className="w-3 h-3 text-purple-400 fill-current" />
                </div>
                <Handle
                    type="source"
                    position={Position.Right}
                    id="do"
                    className="!bg-purple-500 !w-3 !h-3 !border-2 !border-slate-900"
                />
            </div>

            {/* 'Done' Handle (Bottom) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex flex-col items-center">
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="done"
                    className="!bg-slate-500 !w-3 !h-3 !border-2 !border-slate-900"
                />
                <div className="absolute top-4 flex items-center gap-1 pointer-events-none whitespace-nowrap">
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950/80 px-1 rounded shadow-sm">Done</span>
                </div>
            </div>

        </div>
    );
}
