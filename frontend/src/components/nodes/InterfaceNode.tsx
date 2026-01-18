import { Handle, Position, useReactFlow, useEdges, useNodes } from '@xyflow/react';
import { FileJson, Plus, Trash2, CornerDownRight } from 'lucide-react';
import { useState } from 'react';

export interface FieldDefinition {
    id: string;
    name: string;
    type: string;
    required: boolean;
    value?: string;
    children?: FieldDefinition[];
}

// Recursive row component
const SchemaFieldRow = ({
    field,
    onUpdate,
    onDelete,
    onAddChild
}: {
    field: FieldDefinition;
    onUpdate: (id: string, updates: Partial<FieldDefinition>) => void;
    onDelete: (id: string) => void;
    onAddChild: (parentId: string) => void;
}) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center group/row">
                
                {/* Name Input */}
                <div className="flex-[1.5] relative flex items-center">
                    <input
                        type="text"
                        value={field.name}
                        onChange={(e) => onUpdate(field.id, { name: e.target.value })}
                        className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono placeholder:text-slate-600"
                        placeholder="key"
                    />
                </div>

                {/* Value Input */}
                <div className="flex-1">
                    {field.type === 'object' ? (
                        <div className="text-[10px] text-slate-600 italic px-2">Nested Object</div>
                    ) : (
                        <input
                            type="text"
                            value={field.value || ''}
                            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
                            className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-emerald-400 focus:outline-none focus:border-orange-500 font-mono placeholder:text-slate-700"
                            placeholder="any value"
                        />
                    )}
                </div>

                {/* Type Select */}
                <div className="w-24">
                    <select
                        value={field.type}
                        onChange={(e) => onUpdate(field.id, { type: e.target.value })}
                        className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-1 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-orange-500 appearance-none text-center font-bold cursor-pointer hover:bg-slate-900"
                    >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                    </select>
                </div>

                {/* Required Checkbox */}
                <div className="w-8 flex justify-center">
                    <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
                        className="nodrag w-4 h-4 rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-offset-slate-900 focus:ring-orange-500 cursor-pointer"
                    />
                </div>

                {/* Actions */}
                <div className="w-12 flex items-center justify-end gap-1">
                    {field.type === 'object' && (
                        <button
                            onClick={() => onAddChild(field.id)}
                            className="nodrag text-slate-600 hover:text-indigo-400 p-1 transition-colors"
                            title="Add child field"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(field.id)}
                        className="nodrag text-slate-600 hover:text-red-400 transition-colors p-1"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Render Children */}
            {field.children && field.children.length > 0 && (
                <div className="pl-4 ml-3 border-l-2 border-slate-800 space-y-2 relative">
                    {/* Visual guide line extension */}
                   <div className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-slate-800/50"></div>
                    {field.children.map(child => (
                        <div key={child.id} className="relative">
                             <CornerDownRight className="absolute -left-4 top-2.5 w-3.5 h-3.5 text-slate-700" />
                             <SchemaFieldRow
                                field={child}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                onAddChild={onAddChild}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

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

    const [fields, setFields] = useState<FieldDefinition[]>(() => normalizeFields(data.fields || []));

    // Update parent data whenever fields change
    const updateData = (newFields: FieldDefinition[], newTransferMode?: string) => {
        setFields(newFields);
        data.fields = newFields;
        if (newTransferMode) data.transferMode = newTransferMode;
    };

    const handleDeleteNode = () => {
        deleteElements({ nodes: [{ id }] });
    };

    // Deep update helper
    const updateFieldRecursive = (list: FieldDefinition[], targetId: string, updates: Partial<FieldDefinition>): FieldDefinition[] => {
        return list.map(item => {
            if (item.id === targetId) {
                return { ...item, ...updates };
            }
            if (item.children) {
                return { ...item, children: updateFieldRecursive(item.children, targetId, updates) };
            }
            return item;
        });
    };

    const deleteFieldRecursive = (list: FieldDefinition[], targetId: string): FieldDefinition[] => {
        // Filter out if it's in this list
        const filtered = list.filter(item => item.id !== targetId);
        // Then map to check children
        return filtered.map(item => {
            if (item.children) {
                return { ...item, children: deleteFieldRecursive(item.children, targetId) };
            }
            return item;
        });
    };

    const addChildRecursive = (list: FieldDefinition[], parentId: string, newField: FieldDefinition): FieldDefinition[] => {
        return list.map(item => {
            if (item.id === parentId) {
                return { ...item, children: [...(item.children || []), newField] };
            }
            if (item.children) {
                return { ...item, children: addChildRecursive(item.children, parentId, newField) };
            }
            return item;
        });
    };

    const handleUpdateField = (fieldId: string, updates: Partial<FieldDefinition>) => {
        updateData(updateFieldRecursive(fields, fieldId, updates));
    };

    const handleDeleteField = (fieldId: string) => {
        updateData(deleteFieldRecursive(fields, fieldId));
    };

    const handleAddChild = (parentId: string) => {
        const newField: FieldDefinition = {
            id: crypto.randomUUID(),
            name: '',
            type: 'string',
            required: true,
            value: '',
            children: []
        };
        updateData(addChildRecursive(fields, parentId, newField));
    };

    const addRootField = () => {
        const newField: FieldDefinition = {
            id: crypto.randomUUID(),
            name: '',
            type: 'string',
            required: true,
            value: '',
            children: []
        };
        updateData([...fields, newField]);
    };

    return (
        <div className="bg-slate-900 border-2 border-slate-700 hover:border-orange-500 rounded-xl min-w-[500px] shadow-xl transition-all group flex flex-col">

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
                        onClick={handleDeleteNode}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-slate-800"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col gap-4">

                {/* Fields List */}
                <div className="space-y-2">
                    <div className="flex px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 gap-2">
                        <div className="flex-[1.5]">Field Name</div>
                        <div className="flex-1">Expected / Type</div>
                        <div className="w-24 text-center">Type</div>
                        <div className="w-8 text-center">Req</div>
                        <div className="w-12 text-center">Actions</div>
                    </div>

                    {fields.length === 0 && (
                        <div className="text-center py-6 text-slate-600 text-xs border border-dashed border-slate-800 rounded-lg">
                            No fields defined
                        </div>
                    )}

                    {fields.map((field) => (
                        <SchemaFieldRow
                            key={field.id}
                            field={field}
                            onUpdate={handleUpdateField}
                            onDelete={handleDeleteField}
                            onAddChild={handleAddChild}
                        />
                    ))}
                </div>

                {/* Add Button */}
                <button
                    onClick={addRootField}
                    className="nodrag flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-slate-700 hover:border-orange-500/50 hover:bg-orange-500/5 text-slate-500 hover:text-orange-400 transition-all text-xs font-medium"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Root Field
                </button>
            </div>

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
