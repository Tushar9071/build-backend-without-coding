import { Handle, Position } from '@xyflow/react';
import { Send, CheckCircle, AlertTriangle, Trash2, Database, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { SuggestionInput } from '../ui/SuggestionInput';
import { useAvailableVariables } from '../../hooks/useAvailableVariables';

export function ResponseNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();
    // Fetch available variables (connected + global)
    const variables = useAvailableVariables(id);

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };
    const [statusCode, setStatusCode] = useState(data.statusCode || 200);
    const [responseType, setResponseType] = useState(data.responseType || 'json');
    const [body, setBody] = useState(data.body || '{}');

    const getStatusColor = (code: number) => {
        if (code >= 200 && code < 300) return 'text-green-400 bg-green-500/20 border-green-500/50';
        if (code >= 400 && code < 500) return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
        if (code >= 500) return 'text-red-400 bg-red-500/20 border-red-500/50';
        return 'text-slate-400 bg-slate-500/20 border-slate-500/50';
    };

    const getHeaderColor = () => {
        if (statusCode >= 200 && statusCode < 300) return 'border-green-500';
        if (statusCode >= 400) return 'border-orange-500';
        if (statusCode >= 500) return 'border-red-500';
        return 'border-slate-500';
    }



    const [expanded, setExpanded] = useState(false);

    return (
        <div
            onDoubleClick={() => setExpanded(!expanded)}
            className={`bg-slate-900 border-2 ${getHeaderColor()} rounded-xl shadow-xl transition-all group ${expanded ? 'min-w-[280px]' : 'min-w-[200px]'}`}
        >

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-white !w-3 !h-3 !border-2 !border-slate-900"
            />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-800 text-slate-200 rounded-lg">
                        <Send className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-sm">Return Response</span>
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

                    {/* Status Code Selector */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Status Code</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={statusCode}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setStatusCode(val);
                                    data.statusCode = val;
                                }}
                                className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                            />
                            <div className={`flex-1 flex items-center px-3 rounded-lg border text-xs font-medium ${getStatusColor(statusCode)}`}>
                                {statusCode >= 200 && statusCode < 300 && <CheckCircle className="w-3.5 h-3.5 mr-2" />}
                                {statusCode >= 400 && <AlertTriangle className="w-3.5 h-3.5 mr-2" />}
                                <span>
                                    {statusCode === 200 ? 'OK' :
                                        statusCode === 201 ? 'Created' :
                                            statusCode === 400 ? 'Bad Request' :
                                                statusCode === 401 ? 'Unauthorized' :
                                                    statusCode === 404 ? 'Not Found' :
                                                        statusCode === 500 ? 'Server Error' : 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Response Body Type */}
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mt-2">
                        {['json', 'variable'].map((t) => (
                            <button
                                key={t}
                                className={`flex-1 text-[10px] uppercase font-bold py-1 px-2 rounded-md transition-colors ${responseType === t
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                onClick={() => {
                                    setResponseType(t);
                                    data.responseType = t;
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Body Input */}
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-slate-500 block">Response Body</label>
                        </div>

                        {responseType === 'json' ? (
                            <>
                                {/* We use SuggestionInput but we might want it to behave like a textarea? 
                                Current SuggestionInput is single line. 
                                For strictly "All nodes" request, let's use SuggestionInput for now. 
                             */}
                                <SuggestionInput
                                    nodeId={id}
                                    value={body}
                                    onValueChange={(val) => {
                                        setBody(val);
                                        data.body = val;
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors mb-2"
                                    placeholder='{ "message": "$myVar" }'
                                />
                            </>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                                    <span className="text-pink-500 font-mono text-xs mr-1">$</span>
                                    <input
                                        type="text"
                                        value={body}
                                        onChange={(e) => {
                                            setBody(e.target.value);
                                            data.body = e.target.value;
                                        }}
                                        placeholder="variableName"
                                        className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none font-mono"
                                    />
                                </div>

                                {/* Variable Picker for 'variable' mode */}
                                {variables.length > 0 && (
                                    <div className="grid grid-cols-2 gap-1">
                                        {variables.map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => {
                                                    setBody(v.name);
                                                    data.body = v.name;
                                                }}
                                                className={`px-2 py-1.5 rounded text-[10px] font-mono text-left truncate transition-colors flex items-center gap-2 ${body === v.name ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                            >
                                                <Database className="w-3 h-3 shrink-0" />
                                                {v.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
