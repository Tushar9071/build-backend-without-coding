import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play, Plus, Trash2 } from 'lucide-react';

interface Parameter {
    name: string;
    type: string;
    required: boolean;
}

export const FunctionStartNode = memo(({ data, isConnectable }: NodeProps) => {
    // Use controlled state that syncs with node data
    const [functionName, setFunctionName] = useState<string>(
        (data.functionName as string) || ''
    );
    const [params, setParams] = useState<Parameter[]>(
        (data.parameters as Parameter[]) || []
    );
    const [newParamName, setNewParamName] = useState('');

    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFunctionName(value);
        data.functionName = value; // Persist to node data
    }, [data]);

    const addParameter = useCallback(() => {
        if (!newParamName.trim()) return;
        const newParams = [...params, { name: newParamName.trim(), type: 'any', required: true }];
        setParams(newParams);
        data.parameters = newParams;
        setNewParamName('');
    }, [params, newParamName, data]);

    const removeParameter = useCallback((index: number) => {
        const newParams = params.filter((_, i) => i !== index);
        setParams(newParams);
        data.parameters = newParams;
    }, [params, data]);

    const updateParamType = useCallback((index: number, type: string) => {
        const newParams = [...params];
        newParams[index].type = type;
        setParams(newParams);
        data.parameters = newParams;
    }, [params, data]);

    return (
        <div className="bg-white dark:bg-slate-900 border-2 border-green-500 rounded-xl shadow-lg min-w-[280px]">
            <div className="bg-green-500 px-4 py-2 rounded-t-lg flex items-center gap-2">
                <Play className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">Function Start</span>
            </div>

            <div className="p-4 space-y-3">
                <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                        Function Name
                    </label>
                    <input
                        type="text"
                        className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., calculateTotal"
                        value={functionName}
                        onChange={handleNameChange}
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">
                        Parameters (Inputs)
                    </label>

                    {/* Existing Parameters */}
                    <div className="space-y-2 mb-2">
                        {params.map((param, index) => (
                            <div key={index} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                                <span className="text-sm font-mono text-slate-700 dark:text-slate-300 flex-1">{param.name}</span>
                                <select
                                    className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-700 dark:text-slate-300"
                                    value={param.type}
                                    onChange={(e) => updateParamType(index, e.target.value)}
                                >
                                    <option value="any">any</option>
                                    <option value="string">string</option>
                                    <option value="number">number</option>
                                    <option value="boolean">boolean</option>
                                    <option value="object">object</option>
                                    <option value="array">array</option>
                                </select>
                                <button
                                    onClick={() => removeParameter(index)}
                                    className="text-red-400 hover:text-red-500 p-1"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add New Parameter */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="paramName"
                            value={newParamName}
                            onChange={(e) => setNewParamName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addParameter()}
                        />
                        <button
                            onClick={addParameter}
                            className="bg-green-500 hover:bg-green-400 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" />
                            Add
                        </button>
                    </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                    Define the inputs this function accepts. Access them via {'{paramName}'} in subsequent nodes.
                </p>
            </div>

            {/* Only output handle - functions start here */}
            <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-green-500" />
        </div>
    );
});
