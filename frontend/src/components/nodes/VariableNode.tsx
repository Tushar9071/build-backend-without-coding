import { Handle, Position } from '@xyflow/react';
import { Database, Eye, EyeOff, Trash2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useReactFlow, useNodes } from '@xyflow/react';

export function VariableNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();
    const nodes = useNodes();

    // Duplicate Check
    const isDuplicate = nodes.some(n =>
        n.id !== id &&
        n.type === 'variable' &&
        n.data.name === data.name
    );

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    const [name, setName] = useState(data.name || 'myVar');
    const [type, setType] = useState(data.type || 'string');
    const [isPrivate, setIsPrivate] = useState(data.isPrivate || false);
    // data.value is managed directly in inputs to avoid complex state sync

    useEffect(() => {
        data.name = name;
        data.type = type; // Ensure type is synced
    }, [name, type, data]);

    return (
        <div className={`bg-slate-900 border-2 rounded-xl min-w-[300px] shadow-xl transition-all group relative ${isDuplicate ? 'border-red-500' : 'border-slate-700 hover:border-cyan-500'}`}>

            {/* Input Handle (Allows triggering variable update in flow) */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-slate-900 !top-[-6px]"
            />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg">
                        <Database className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="font-semibold text-white text-sm block leading-none">Variable</span>
                        <span className="text-[10px] text-slate-500 font-medium">Store & Update Data</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => {
                            setIsPrivate(!isPrivate);
                            data.isPrivate = !isPrivate;
                        }}
                        className="text-slate-500 hover:text-cyan-400 transition-colors p-1"
                        title={isPrivate ? "Private" : "Public"}
                    >
                        {isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-slate-800"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isDuplicate && (
                <div className="bg-red-500/10 mx-4 mt-4 mb-0 p-2 rounded border border-red-500/20 flex gap-2 items-center">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span className="text-[10px] text-red-300">Duplicate variable name</span>
                </div>
            )}

            {/* Body */}
            <div className={`p-4 space-y-3 ${isDuplicate ? 'pt-2' : ''}`}>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                data.name = e.target.value;
                            }}
                            className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono placeholder:text-slate-600"
                            placeholder="varName"
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">Type</label>
                        <select
                            value={type}
                            onChange={(e) => {
                                setType(e.target.value);
                                data.type = e.target.value;
                            }}
                            className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="array">Array</option>
                            <option value="json">JSON</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">
                        {type === 'array' ? 'Value (JSON Array)' : 'Value / Expression'}
                    </label>

                    {type === 'boolean' ? (
                        <select
                            defaultValue={String(data.value ?? 'false')}
                            onChange={(e) => {
                                data.value = e.target.value === 'true';
                            }}
                            className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                        >
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    ) : (type === 'json' || type === 'array') ? (
                        <textarea
                            defaultValue={data.value || (type === 'array' ? '[]' : '{}')}
                            onChange={(e) => {
                                data.value = e.target.value;
                            }}
                            className="nodrag w-full h-20 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono resize-none leading-relaxed"
                            placeholder={type === 'array' ? '["item1", "item2"]' : '{ "key": "value" }'}
                            spellCheck={false}
                        />
                    ) : (
                        <input
                            type={type === 'number' ? 'number' : 'text'}
                            defaultValue={data.value || ''}
                            onChange={(e) => {
                                const val = type === 'number' ? parseFloat(e.target.value) : e.target.value;
                                data.value = val;
                            }}
                            className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono placeholder:text-slate-700"
                            placeholder={type === 'number' ? '0' : 'Value or {variable}'}
                        />
                    )}
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-slate-900 !right-[-6px]"
            />
        </div>
    );
}
