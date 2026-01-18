import { Handle, Position } from '@xyflow/react';
import { Database, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export function DatabaseNode({ data }: { id: string, data: any }) {

    const [query, setQuery] = useState(data.query || 'SELECT * FROM users');
    const [queryType, setQueryType] = useState(data.queryType || 'read');
    const [resultVar, setResultVar] = useState(data.resultVar || 'dbData');
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        data.query = query;
        data.queryType = queryType;
        data.resultVar = resultVar;
    }, [query, queryType, resultVar, data]);

    return (
        <div
            onDoubleClick={() => setExpanded(!expanded)}
            className={`bg-slate-900 border-2 border-slate-700 hover:border-amber-500 rounded-xl shadow-xl transition-all group ${expanded ? 'min-w-[400px]' : 'min-w-[250px]'}`}
        >

            <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-slate-900 !top-[-6px]" />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/20 text-amber-500 rounded-lg">
                        <Database className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-sm">Database Query</span>
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

            {expanded ? (
                <div className="p-4 space-y-4">

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">Query Type</label>
                            <select
                                value={queryType}
                                onChange={(e) => setQueryType(e.target.value)}
                                className="nodrag bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white w-full focus:outline-none focus:border-amber-500"
                            >
                                <option value="read">Read (SELECT)</option>
                                <option value="write">Write (INSERT, UPDATE, DELETE)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">SQL Query</label>
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="nodrag w-full h-32 bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500 resize-y"
                            placeholder="SELECT * FROM table"
                            spellCheck={false}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Use <code>{'{varName}'}</code> or <code>:varName</code> to inject variables.</p>
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
                                className="nodrag flex-1 bg-transparent py-1.5 text-xs text-amber-500 font-bold focus:outline-none placeholder:text-slate-700"
                                placeholder="dbResult"
                            />
                        </div>
                    </div>

                </div>
            ) : (
                <div className="p-3">
                    <div className="text-xs font-mono text-slate-400 bg-slate-950 p-2 rounded truncate border border-slate-800 pointer-events-none">
                        {query}
                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-slate-900 !bottom-[-6px]" />
        </div>
    );
}
