import { Server, Code2, GitFork, Plus, Database, Braces, Send, FileJson, Repeat, Calculator, BarChart } from 'lucide-react';
import { cn } from '../../lib/utils';

type NodeType = 'api' | 'function' | 'logic' | 'variable' | 'response' | 'interface';

interface NodesToolbarProps {
    onAddNode: (type: NodeType) => void;
}

export function NodesToolbar({ onAddNode }: NodesToolbarProps) {
    const nodeTypes = [
        { type: 'api', label: 'API Endpoint', icon: Server, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'hover:border-indigo-500/50' },
        { type: 'interface', label: 'Interface Schema', icon: FileJson, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'hover:border-orange-500/50' },
        { type: 'loop', label: 'Iterator', icon: Repeat, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/50' },
        { type: 'function', label: 'Function', icon: Code2, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'hover:border-pink-500/50' },
        { type: 'logic', label: 'Condition', icon: GitFork, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'hover:border-yellow-500/50' },
        { type: 'math', label: 'Math / Op', icon: Calculator, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/50' },
        { type: 'data_op', label: 'Data / Stats', icon: BarChart, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'hover:border-teal-500/50' },
        { type: 'variable', label: 'Variable', icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'hover:border-cyan-500/50' },
        { type: 'database', label: 'Database', icon: Database, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'hover:border-amber-500/50' },
        { type: 'response', label: 'Return Response', icon: Send, color: 'text-green-400', bg: 'bg-green-500/10', border: 'hover:border-green-500/50' },
    ];

    return (
        <div className="absolute left-4 top-4 bg-slate-900/90 backdrop-blur-sm border border-slate-800 p-2 rounded-xl shadow-2xl flex flex-col gap-2 z-10 w-48">
            <div className="px-2 py-1 flex items-center gap-2 text-slate-400 mb-1">
                <Braces className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Components</span>
            </div>

            {nodeTypes.map((item) => (
                <button
                    key={item.type}
                    onClick={() => onAddNode(item.type as NodeType)}
                    className={cn(
                        "flex items-center gap-3 p-2 rounded-lg border border-transparent transition-all group bg-slate-950/50",
                        item.border,
                        "hover:bg-slate-900"
                    )}
                >
                    <div className={cn("p-1.5 rounded-md transition-transform group-hover:scale-110", item.bg, item.color)}>
                        <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">{item.label}</span>
                    <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity" />
                </button>
            ))}
        </div>
    );
}
