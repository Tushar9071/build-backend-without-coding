import { Handle, Position } from '@xyflow/react';
import { Calculator, GripHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';

export function MathNode({ data }: { id: string, data: any }) {

    const [valA, setValA] = useState(data.valA || '');
    const [valB, setValB] = useState(data.valB || '');
    const [op, setOp] = useState(data.op || '+');
    const [resultVar, setResultVar] = useState(data.resultVar || '');

    useEffect(() => {
        data.valA = valA;
        data.valB = valB;
        data.op = op;
        data.resultVar = resultVar;
    }, [valA, valB, op, resultVar, data]);

    return (
        <div className="bg-slate-900 border-2 border-slate-700 hover:border-blue-500 rounded-xl min-w-[280px] shadow-xl transition-all group">

            <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900 !top-[-6px]" />

            {/* Header */}
            <div className="bg-slate-950 p-3 rounded-t-xl border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                        <Calculator className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-sm">Math / Op</span>
                </div>
                <GripHorizontal className="text-slate-600 w-4 h-4" />
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">

                {/* Operation Row */}
                <div className="flex gap-2 items-center">
                    <div className="flex-1">
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">Value A</label>
                        <input
                            type="text"
                            value={valA}
                            onChange={(e) => setValA(e.target.value)}
                            className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                            placeholder="0 or {var}"
                        />
                    </div>
                </div>

                <div className="flex gap-2 items-center justify-center">
                    <select
                        value={op}
                        onChange={(e) => setOp(e.target.value)}
                        className="nodrag bg-slate-800 border border-slate-700 rounded px-4 py-1 text-sm text-white font-bold focus:outline-none focus:border-blue-500 text-center w-full"
                    >
                        <option value="+">+</option>
                        <option value="-">-</option>
                        <option value="*">×</option>
                        <option value="/">÷</option>
                        <option value="%">%</option>
                    </select>
                </div>

                <div className="flex gap-2 items-center">
                    <div className="flex-1">
                        <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">Value B</label>
                        <input
                            type="text"
                            value={valB}
                            onChange={(e) => setValB(e.target.value)}
                            className="nodrag w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                            placeholder="0 or {var}"
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase">Store Result In</label>
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-2">
                        <span className="text-slate-500 text-xs">var</span>
                        <input
                            type="text"
                            value={resultVar}
                            onChange={(e) => setResultVar(e.target.value)}
                            className="nodrag flex-1 bg-transparent py-1.5 text-xs text-green-400 font-bold focus:outline-none placeholder:text-slate-700"
                            placeholder="resultName"
                        />
                    </div>
                </div>

            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900 !bottom-[-6px]" />
            <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900 !right-[-6px]" />

        </div>
    );
}
