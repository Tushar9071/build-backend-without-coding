
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { FileCode, Play, Terminal, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export function CodeNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();

    // Default data
    const [code, setCode] = useState(data.code || '# Access variables via context\n# e.g.\n# val = context["myVar"]\n# context["result"] = val * 2\n\nresult = "Hello " + context.get("query", {}).get("name", "World")\ncontext["greeting"] = result');
    const [language, setLanguage] = useState(data.language || 'python');
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        data.code = code;
        data.language = language;
    }, [code, language, data]);

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <div
            onDoubleClick={() => setExpanded(!expanded)}
            className={`bg-slate-900 border-2 border-slate-700 hover:border-emerald-500 rounded-xl shadow-xl transition-all group ${expanded ? 'min-w-[500px]' : 'min-w-[280px]'}`}
        >
            <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900 !top-[-6px]" />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                        <FileCode className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-sm">Execute Python</span>
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
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Python Code</label>
                            <span className="text-[10px] text-slate-600 font-mono">Access `context` dict</span>
                        </div>

                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="nodrag w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 leading-relaxed resize-y"
                            spellCheck={false}
                            placeholder="# Write your python code here"
                        />
                    </div>
                ) : (
                    <div className="p-3 bg-slate-950/50">
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                            {code.split('\n')[0]}...
                        </div>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900 !bottom-[-6px]" />
        </div>
    );
}
