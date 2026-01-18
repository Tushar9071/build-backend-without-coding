import { useState } from 'react';
import { Server, Code2, GitFork, Plus, Database, Braces, Send, FileJson, Repeat, Calculator, BarChart, ChevronDown, ChevronUp, FileCode, FileText, Play, CornerDownLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

type NodeType = 'api' | 'function' | 'logic' | 'variable' | 'response' | 'interface' | 'loop' | 'math' | 'data_op' | 'database' | 'code' | 'file' | 'subworkflow' | 'function_start' | 'function_return';

interface NodesToolbarProps {
    onAddNode: (type: NodeType) => void;
    category?: string;
}

export function NodesToolbar({ onAddNode, category = 'route' }: NodesToolbarProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const allNodeTypes = [
        // Function-specific nodes (for function context)
        { type: 'function_start', label: 'Function Start', icon: Play, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/10', border: 'hover:border-green-500/50' },
        { type: 'function_return', label: 'Function Return', icon: CornerDownLeft, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-500/10', border: 'hover:border-red-500/50' },

        // Route-specific nodes
        { type: 'api', label: 'API Endpoint', icon: Server, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-500/10', border: 'hover:border-indigo-500/50' },
        { type: 'subworkflow', label: 'Connect Function', icon: GitFork, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-500/10', border: 'hover:border-pink-500/50' },
        { type: 'response', label: 'Return Response', icon: Send, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/10', border: 'hover:border-green-500/50' },

        // Interface nodes
        { type: 'interface', label: 'Interface Schema', icon: FileJson, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-500/10', border: 'hover:border-orange-500/50' },

        // Logic nodes (for functions)
        { type: 'loop', label: 'Iterator', icon: Repeat, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/10', border: 'hover:border-purple-500/50' },
        { type: 'function', label: 'Logic Block', icon: Code2, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-500/10', border: 'hover:border-pink-500/50' },
        { type: 'logic', label: 'Condition', icon: GitFork, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/10', border: 'hover:border-yellow-500/50' },
        { type: 'math', label: 'Math / Op', icon: Calculator, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/10', border: 'hover:border-blue-500/50' },
        { type: 'data_op', label: 'Data / Stats', icon: BarChart, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-500/10', border: 'hover:border-teal-500/50' },
        { type: 'variable', label: 'Variable', icon: Database, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-500/10', border: 'hover:border-cyan-500/50' },
        { type: 'database', label: 'Database', icon: Database, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/10', border: 'hover:border-amber-500/50' },
        { type: 'code', label: 'Execute Python', icon: FileCode, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/10', border: 'hover:border-emerald-500/50' },
        { type: 'file', label: 'File System', icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/10', border: 'hover:border-blue-500/50' },
    ];

    const filteredNodes = allNodeTypes.filter(node => {
        if (category === 'route') {
            // Routes: API, Connect Function, Response, Logic
            return ['api', 'subworkflow', 'response', 'logic'].includes(node.type);
        } else if (category === 'function') {
            // Functions: Start, Return + all logic nodes (no API, no subworkflow, no interface)
            return ['function_start', 'function_return', 'loop', 'function', 'logic', 'math', 'data_op', 'variable', 'database', 'code', 'file'].includes(node.type);
        } else if (category === 'interface') {
            return ['interface'].includes(node.type);
        }
        return true;
    });

    return (
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 bg-white dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg shadow-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-fit"
            >
                <Braces className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Components</span>
                {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>

            <div className={cn(
                "bg-white dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col gap-1 w-48 overflow-hidden transition-all duration-300 origin-top p-1",
                isExpanded ? "scale-y-100 opacity-100 max-h-[80vh] overflow-y-auto" : "scale-y-0 opacity-0 max-h-0 py-0 border-0"
            )}>
                {filteredNodes.map((item) => (
                    <button
                        key={item.type}
                        onClick={() => {
                            onAddNode(item.type as NodeType);
                            if (window.innerWidth < 768) setIsExpanded(false);
                        }}
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-lg border border-transparent transition-all group hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0",
                            item.border
                        )}
                    >
                        <div className={cn("p-1.5 rounded-md transition-transform group-hover:scale-110 shrink-0", item.bg, item.color)}>
                            <item.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white truncate text-left">{item.label}</span>
                        <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500 transition-opacity shrink-0" />
                    </button>
                ))}
            </div>
        </div>
    );
}
