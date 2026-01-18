import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Server, Copy, ExternalLink, AlertTriangle, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { SuggestionInput } from '../ui/SuggestionInput';
import { SchemaEditor, type FieldDefinition } from '../ui/SchemaEditor';

export function ApiNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();
    const { id: workflowId } = useParams<{ id: string }>();
    const [method, setMethod] = useState(data.method || 'GET');
    const [path, setPath] = useState(data.path || '/');
    const [validation, setValidation] = useState<{ valid: boolean, message: string } | null>(null);

    // Schema Validation State (for body)
    const normalizeFields = (list: any[]): FieldDefinition[] => {
        return list.map(f => ({
            ...f,
            id: f.id || crypto.randomUUID(),
            value: f.value || f.defaultValue || '',
            children: normalizeFields(f.children || [])
        }));
    };
    const [validationFields, setValidationFields] = useState<FieldDefinition[]>(() => normalizeFields(data.validationFields || []));

    const handleValidationChange = (newFields: FieldDefinition[]) => {
        setValidationFields(newFields);
        data.validationFields = newFields;
    };

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    // Debounce validation
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (path && workflowId) {
                try {
                    // Assuming path needs to be checked without /api/v1/invoke prefix locally since we just want uniqueness among user definitions
                    const res = await api.get(`/workflows/validate-path`, {
                        params: {
                            path,
                            method,
                            exclude_workflow_id: workflowId
                        }
                    });
                    setValidation(res.data);
                } catch (e) {
                    console.error("Validation check failed", e);
                }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [path, method, workflowId]);

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    const fullUrl = `${baseUrl}/invoke${path.startsWith('/') ? '' : '/'}${path}`;

    const copyUrl = () => {
        navigator.clipboard.writeText(fullUrl);
        toast.success("URL copied to clipboard");
    };

    const [expanded, setExpanded] = useState(false);

    return (
        <div
            onDoubleClick={() => setExpanded(!expanded)}
            className={`bg-white dark:bg-slate-900 border-2 rounded-xl shadow-xl transition-all group ${validation?.valid === false ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500'} ${expanded ? 'min-w-[320px]' : 'min-w-[200px]'}`}
        >
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-t-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${validation?.valid === false ? 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400' : 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
                        <Server className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">API Endpoint</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
                    >
                        {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 space-y-4">

                    {validation?.valid === false && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex gap-2 items-start">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-red-300 leading-tight">{validation.message}</p>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">HTTP Method</label>
                        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                            {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                                <button
                                    key={m}
                                    className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-colors ${method === m
                                        ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    onClick={() => {
                                        setMethod(m);
                                        data.method = m;
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Endpoint Path</label>
                        <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                            <span className="text-slate-400 dark:text-slate-600 text-[10px] font-mono whitespace-nowrap mr-1">/api/v1/invoke/</span>
                            <SuggestionInput
                                nodeId={id}
                                value={path}
                                onValueChange={(val) => {
                                    let newPath = val;
                                    if (newPath.startsWith('/')) newPath = newPath.substring(1);
                                    setPath(newPath);
                                    data.path = newPath;
                                }}
                                className="flex-1 bg-transparent border-none text-xs font-mono text-slate-900 dark:text-white p-2 pl-0 focus:outline-none"
                                placeholder="users"
                            />
                        </div>
                    </div>

                    {/* URL Preview & Copy */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800/50 flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-600">Invocation URL</label>
                        <div className="flex items-center justify-between gap-2">
                            <code className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] font-mono select-all">
                                {fullUrl}
                            </code>
                            <div className="flex gap-1 shrink-0">
                                <button onClick={copyUrl} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="Copy URL">
                                    <Copy className="w-3 h-3" />
                                </button>
                                <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="Open in new tab">
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Implicit Variables Info */}
                    <div className="bg-indigo-50 dark:bg-indigo-500/5 p-2 rounded-lg border border-indigo-100 dark:border-indigo-500/10">
                        <label className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400/80 mb-1 block">Available Variables</label>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Request data is automatically available in:
                        </p>
                        <div className="flex gap-2 mt-1.5 font-mono text-[10px]">
                            <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-transparent shadow-sm dark:shadow-none">{`$body`}</span>
                            <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-transparent shadow-sm dark:shadow-none">{`$query`}</span>
                            <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-transparent shadow-sm dark:shadow-none">{`$params`}</span>
                        </div>
                        {/* Show extracted path params if any */}
                        {path.includes(':') && (
                            <div className="mt-2 pt-2 border-t border-indigo-500/10">
                                <p className="text-[10px] text-slate-500 mb-1">Detected Params:</p>
                                <div className="flex flex-wrap gap-1">
                                    {path.match(/:([a-zA-Z0-9_]+)/g)?.map((p: string) => (
                                        <span key={p} className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono text-indigo-300 border border-indigo-500/30">
                                            {`$params.${p.substring(1)}`}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Body Validation Section */}
                    {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">Body Validation Schema</label>
                            <div className="bg-slate-50 dark:bg-slate-950/30 rounded-lg p-2 border border-slate-200 dark:border-slate-800/50">
                                <SchemaEditor
                                    nodeId={id}
                                    fields={validationFields}
                                    onChange={handleValidationChange}
                                />
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Footer / Status */}
            <div className="bg-slate-50 dark:bg-slate-950/50 p-2 rounded-b-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Trigger</span>
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${validation?.valid === false ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                    <span className={`text-[10px] font-medium ${validation?.valid === false ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {validation?.valid === false ? 'Conflict' : 'Active'}
                    </span>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900"
            />
        </div>
    );
}