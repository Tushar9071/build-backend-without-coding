
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { FileText, Trash2, FolderOpen, Save, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export function FileNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();

    const [operation, setOperation] = useState(data.operation || 'read');
    const [path, setPath] = useState(data.path || '/tmp/file.txt');
    const [content, setContent] = useState(data.content || '');
    const [resultVar, setResultVar] = useState(data.resultVar || 'fileData');
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        data.operation = operation;
        data.path = path;
        data.content = content;
        data.resultVar = resultVar;
    }, [operation, path, content, resultVar, data]);

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <div
            onDoubleClick={() => setExpanded(!expanded)}
            className={`bg-slate-900 border-2 border-slate-700 hover:border-blue-500 rounded-xl shadow-xl transition-all group ${expanded ? 'min-w-[400px]' : 'min-w-[250px]'}`}
        >
            <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900 !top-[-6px]" />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                        <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-sm">File System</span>
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

            {/* Body */}
            <div className="p-0">
                {expanded ? (
                    <div className="p-4 space-y-4">

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Operation</label>
                                <select
                                    className="nodrag w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                                    value={operation}
                                    onChange={e => setOperation(e.target.value)}
                                >
                                    <option value="read">Read File</option>
                                    <option value="write">Write File</option>
                                    <option value="delete">Delete File</option>
                                    <option value="list">List Directory</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">File Path</label>
                            <input
                                type="text"
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                                placeholder="/path/to/file"
                            />
                        </div>

                        {operation === 'write' && (
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Content</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="nodrag w-full h-24 bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-y"
                                    placeholder="File content..."
                                />
                            </div>
                        )}

                        <div className="pt-2 border-t border-slate-800">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Store Result In</label>
                            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-2">
                                <span className="text-slate-500 text-xs">var</span>
                                <input
                                    type="text"
                                    value={resultVar}
                                    onChange={(e) => setResultVar(e.target.value)}
                                    className="nodrag flex-1 bg-transparent py-1.5 text-xs text-blue-500 font-bold focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-slate-950/50 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-blue-400">
                            <span>{operation}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                            {path}
                        </div>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900 !bottom-[-6px]" />
        </div>
    );
}
