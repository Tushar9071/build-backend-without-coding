import { Handle, Position, useReactFlow, useEdges, useNodes } from '@xyflow/react';
import { FileJson, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import { SchemaEditor, type FieldDefinition } from '../ui/SchemaEditor';

export function InterfaceNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();
    const edges = useEdges();
    const nodes = useNodes();

    const isConnectedToApi = edges.some(edge => {
        if (edge.target !== id) return false;
        const sourceNode = nodes.find(n => n.id === edge.source);
        return sourceNode?.type === 'api';
    });

    // Initialize fields - ensure they have children arrays initialized
    const normalizeFields = (list: any[]): FieldDefinition[] => {
        return list.map(f => ({
            ...f,
            id: f.id || crypto.randomUUID(), // ensure ID
            value: f.value || f.defaultValue || '',
            children: normalizeFields(f.children || [])
        }));
    };

    // We use a local state to ensure render updates, but sync to data
    const [fields, setFields] = useState<FieldDefinition[]>(() => normalizeFields(data.fields || []));

    const handleFieldsChange = (newFields: FieldDefinition[]) => {
        setFields(newFields);
        data.fields = newFields;
    };

    const handleDeleteNode = () => {
        deleteElements({ nodes: [{ id }] });
    };

    const [expanded, setExpanded] = useState(false);

    return (
        <div
            onDoubleClick={() => setExpanded(!expanded)}
            className={`bg-slate-900 border-2 border-slate-700 hover:border-orange-500 rounded-xl shadow-xl transition-all group flex flex-col ${expanded ? 'min-w-[500px]' : 'min-w-[200px]'}`}
        >

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-orange-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                        <FileJson className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="font-semibold text-white text-sm block leading-none">Interface Schema</span>
                        <span className="text-[10px] text-slate-500 font-medium">Validation</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isConnectedToApi && (
                        <select
                            className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-orange-500 nodrag"
                            defaultValue={data.transferMode || 'body'}
                            onChange={(e) => {
                                data.transferMode = e.target.value;
                            }}
                        >
                            <option value="body">Body</option>
                            <option value="query">Query</option>
                            <option value="params">Params</option>
                        </select>
                    )}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-slate-500 hover:text-white transition-colors p-1"
                    >
                        {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleDeleteNode}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-slate-800"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 flex-1 flex flex-col gap-4">
                    <SchemaEditor
                        nodeId={id}
                        fields={fields}
                        onChange={handleFieldsChange}
                    />
                </div>
            )}

            {/* Footer Status */}
            <div className="bg-slate-950/50 p-2 rounded-b-xl border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Validation</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                    <span className="text-[10px] font-medium text-orange-400">Active</span>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-orange-500 !w-3 !h-3 !border-2 !border-slate-900"
            />
        </div>
    );
}
