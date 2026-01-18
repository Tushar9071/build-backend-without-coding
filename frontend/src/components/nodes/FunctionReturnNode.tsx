import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CornerDownLeft } from 'lucide-react';

export const FunctionReturnNode = memo(({ data, isConnectable }: NodeProps) => {
    const [returnType, setReturnType] = useState((data.returnType as string) || 'variable');
    const [returnValue, setReturnValue] = useState((data.returnValue as string) || '');

    const handleTypeChange = (type: string) => {
        setReturnType(type);
        data.returnType = type;
    };

    const handleValueChange = (value: string) => {
        setReturnValue(value);
        data.returnValue = value;
    };

    return (
        <div className="bg-white dark:bg-slate-900 border-2 border-red-500 rounded-xl shadow-lg min-w-[250px]">
            <div className="bg-red-500 px-4 py-2 rounded-t-lg flex items-center gap-2">
                <CornerDownLeft className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">Function Return</span>
            </div>

            <div className="p-4 space-y-3">
                <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                        Return Type
                    </label>
                    <select
                        className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={returnType}
                        onChange={(e) => handleTypeChange(e.target.value)}
                    >
                        <option value="variable">Variable Value</option>
                        <option value="json">JSON Object</option>
                        <option value="expression">Expression</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                        {returnType === 'variable' ? 'Variable Name' : returnType === 'json' ? 'JSON Body' : 'Expression'}
                    </label>
                    {returnType === 'json' ? (
                        <textarea
                            className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 h-20"
                            placeholder='{"result": "{myVar}"}'
                            value={returnValue}
                            onChange={(e) => handleValueChange(e.target.value)}
                        />
                    ) : (
                        <input
                            type="text"
                            className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder={returnType === 'variable' ? 'resultVar' : '{a} + {b}'}
                            value={returnValue}
                            onChange={(e) => handleValueChange(e.target.value)}
                        />
                    )}
                </div>

                <p className="text-[10px] text-slate-400 italic">
                    This value will be returned to the caller and stored in 'func_result'.
                </p>
            </div>

            {/* Only input handle - functions end here */}
            <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-red-500" />
        </div>
    );
});
