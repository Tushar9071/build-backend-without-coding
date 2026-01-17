import { Handle, Position } from '@xyflow/react';
import { Code2, Play, Lock, Globe } from 'lucide-react';
import { useState } from 'react';

import { Trash2 } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

export function FunctionNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };
    const [name, setName] = useState(data.name || 'myFunction');
    const [isPublic, setIsPublic] = useState(data.isPublic || false);

    return (
        <div className="bg-slate-900 border-2 border-slate-700 hover:border-pink-500 rounded-xl min-w-[280px] shadow-xl transition-all group">

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-pink-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-pink-500/20 text-pink-400 rounded-lg">
                        <Code2 className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-sm">Function</span>
                </div>

                {/* Visibility Toggle */}
                <button
                    onClick={() => {
                        setIsPublic(!isPublic);
                        data.isPublic = !isPublic;
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${isPublic ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white'}`}
                    title={isPublic ? "Public Access" : "Private"}
                >
                    {isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </button>
                <button
                    onClick={handleDelete}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-slate-800"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Function Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            data.name = e.target.value;
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-pink-500 transition-colors"
                        placeholder="processData"
                    />
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-medium transition-colors border border-pink-500/20">
                    <Play className="w-3 h-3" />
                    Edit Logic
                </button>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-pink-500 !w-3 !h-3 !border-2 !border-slate-900"
            />
        </div>
    );
}
