
import { Plus, Trash2, CornerDownRight } from 'lucide-react';
import { SuggestionInput } from './SuggestionInput';

export interface FieldDefinition {
    id: string;
    name: string;
    type: string;
    required: boolean;
    value?: string;
    children?: FieldDefinition[];
}

// Helpers
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
    const filtered = list.filter(item => item.id !== targetId);
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

const SchemaFieldRow = ({
    field,
    nodeId,
    onUpdate,
    onDelete,
    onAddChild
}: {
    field: FieldDefinition;
    nodeId: string;
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
                        <SuggestionInput
                            nodeId={nodeId}
                            value={field.value || ''}
                            onValueChange={(val) => onUpdate(field.id, { value: val })}
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
                <div className="w-12 flex justify-center">
                    <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
                        className="nodrag w-4 h-4 rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-offset-slate-900 focus:ring-orange-500 cursor-pointer"
                        title="Mark as Required"
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
                                nodeId={nodeId}
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
};

export function SchemaEditor({
    nodeId,
    fields,
    onChange
}: {
    nodeId: string;
    fields: FieldDefinition[];
    onChange: (fields: FieldDefinition[]) => void;
}) {

    const handleUpdateField = (fieldId: string, updates: Partial<FieldDefinition>) => {
        onChange(updateFieldRecursive(fields, fieldId, updates));
    };

    const handleDeleteField = (fieldId: string) => {
        onChange(deleteFieldRecursive(fields, fieldId));
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
        onChange(addChildRecursive(fields, parentId, newField));
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
        onChange([...fields, newField]);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Fields List */}
            <div className="space-y-2">
                <div className="flex px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 gap-2">
                    <div className="flex-[1.5]">Field Name</div>
                    <div className="flex-1">Expected / Type</div>
                    <div className="w-24 text-center">Type</div>
                    <div className="w-12 text-center text-orange-500">Required</div>
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
                        nodeId={nodeId}
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
    );
}
