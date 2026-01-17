import { Handle, Position, useReactFlow } from '@xyflow/react';
import { FileJson, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface FieldDefinition {
    id: string;
    name: string;
    type: string;
    required: boolean;
    value?: string;
}

export function InterfaceNode({ id, data }: { id: string, data: any }) {
    const { deleteElements } = useReactFlow();

    // Initialize fields
    const initialFields = (data.fields || []).map((f: any) => ({
        ...f,
        value: f.value || f.defaultValue || ''
    }));

    const [fields, setFields] = useState<FieldDefinition[]>(initialFields);

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    const addField = () => {
        const newField: FieldDefinition = {
            id: crypto.randomUUID(),
            name: '',
            type: 'string',
            required: true,
            value: ''
        };
        const updated = [...fields, newField];
        setFields(updated);
        data.fields = updated;
    };

    const updateField = (fieldId: string, updates: Partial<FieldDefinition>) => {
        const updated = fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
        setFields(updated);
        data.fields = updated;
    };

    const removeField = (fieldId: string) => {
        const updated = fields.filter(f => f.id !== fieldId);
        setFields(updated);
        data.fields = updated;
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
                        <span className="text-[10px] text-slate-500 font-medium">Request Body Validation</span>
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
            <div className="p-4 flex-1 flex flex-col gap-4">

                {/* Fields List */}
                <div className="space-y-2">
                    <div className="flex px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 gap-2">
                        <div className="flex-[1.5]">Field Name</div>
                        <div className="flex-1">Expected Value</div>
                        <div className="w-24 text-center">Type</div>
                        <div className="w-8 text-center">Req</div>
                        <div className="w-6"></div>
                    </div>

                    {fields.length === 0 && (
                        <div className="text-center py-6 text-slate-600 text-xs border border-dashed border-slate-800 rounded-lg">
                            No fields defined
                        </div>
                    )}

                    {fields.map((field) => (
                        <div key={field.id} className="flex gap-2 items-center group/row">

                            {/* Name Input */}
                            <div className="flex-[1.5]">
                                <input
                                    type="text"
                                    value={field.name}
                                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                                    className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono placeholder:text-slate-600"
                                    placeholder="key"
                                />
                            </div>

                            {/* Value Input (Restored) */}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={field.value}
                                    onChange={(e) => updateField(field.id, { value: e.target.value })}
                                    className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-emerald-400 focus:outline-none focus:border-orange-500 font-mono placeholder:text-slate-700"
                                    placeholder="any value"
                                />
                            </div>

                            {/* Type Select */}
                            <div className="w-24">
                                <select
                                    value={field.type}
                                    onChange={(e) => updateField(field.id, { type: e.target.value })}
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
                                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                    className="nodrag w-4 h-4 rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-offset-slate-900 focus:ring-orange-500 cursor-pointer"
                                />
                            </div>

                            {/* Delete Action */}
                            <div className="w-6 flex justify-center">
                                <button
                                    onClick={() => removeField(field.id)}
                                    className="nodrag text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover/row:opacity-100"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add Button */}
                <button
                    onClick={addField}
                    className="nodrag flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-dashed border-slate-700 hover:border-orange-500/50 hover:bg-orange-500/5 text-slate-500 hover:text-orange-400 transition-all text-xs font-medium"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Field
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
