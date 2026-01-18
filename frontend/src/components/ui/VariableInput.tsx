import { useState, useRef, useEffect, useCallback } from 'react';
import { Variable } from 'lucide-react';

interface Suggestion {
    name: string;
    type: 'context' | 'variable' | 'function' | 'param';
    description?: string;
}

interface VariableInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    availableVariables?: Suggestion[];
    multiline?: boolean;
}

// Default context variables always available
const defaultSuggestions: Suggestion[] = [
    { name: 'body', type: 'context', description: 'Request body (JSON)' },
    { name: 'query', type: 'context', description: 'Query parameters' },
    { name: 'params', type: 'context', description: 'URL path parameters' },
    { name: 'request', type: 'context', description: 'Full request object' },
    { name: 'user', type: 'context', description: 'Authenticated user' },
    { name: 'func_result', type: 'function', description: 'Last function result' },
];

export function VariableInput({
    value,
    onChange,
    placeholder,
    className = '',
    availableVariables = [],
    multiline = false
}: VariableInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Combine default suggestions with custom variables
    const allSuggestions = [...defaultSuggestions, ...availableVariables];

    // Filter suggestions based on what user is typing after {
    const filteredSuggestions = allSuggestions.filter(s =>
        s.name.toLowerCase().includes(filterText.toLowerCase())
    );

    // Detect when user types { and show suggestions
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursor = e.target.selectionStart || 0;
        onChange(newValue);
        setCursorPosition(cursor);

        // Find if we're inside a { } block
        const textBeforeCursor = newValue.slice(0, cursor);
        const lastOpenBrace = textBeforeCursor.lastIndexOf('{');
        const lastCloseBrace = textBeforeCursor.lastIndexOf('}');

        if (lastOpenBrace > lastCloseBrace) {
            // We're inside { }, extract the text after {
            const textAfterBrace = textBeforeCursor.slice(lastOpenBrace + 1);
            setFilterText(textAfterBrace);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            setFilterText('');
        }
    }, [onChange]);

    // Insert selected suggestion
    const insertSuggestion = useCallback((suggestion: Suggestion) => {
        const textBeforeCursor = value.slice(0, cursorPosition);
        const textAfterCursor = value.slice(cursorPosition);

        const lastOpenBrace = textBeforeCursor.lastIndexOf('{');
        const beforeBrace = value.slice(0, lastOpenBrace + 1);

        // Check if there's a closing brace after cursor
        const closingBraceIdx = textAfterCursor.indexOf('}');
        const afterBrace = closingBraceIdx >= 0
            ? textAfterCursor.slice(closingBraceIdx + 1)
            : textAfterCursor;

        const newValue = `${beforeBrace}${suggestion.name}}${afterBrace}`;
        onChange(newValue);
        setShowSuggestions(false);

        // Focus back on input
        inputRef.current?.focus();
    }, [value, cursorPosition, onChange]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const typeColors = {
        context: 'bg-blue-500/20 text-blue-400',
        variable: 'bg-green-500/20 text-green-400',
        function: 'bg-purple-500/20 text-purple-400',
        param: 'bg-amber-500/20 text-amber-400',
    };

    const InputComponent = multiline ? 'textarea' : 'input';

    return (
        <div className="relative">
            <InputComponent
                ref={inputRef as any}
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
                spellCheck={false}
            />

            {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                >
                    <div className="px-3 py-2 border-b border-slate-700 flex items-center gap-2">
                        <Variable className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Suggestions</span>
                    </div>
                    {filteredSuggestions.map((suggestion, idx) => (
                        <button
                            key={`${suggestion.name}-${idx}`}
                            onClick={() => insertSuggestion(suggestion)}
                            className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between group transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-slate-200">{`{${suggestion.name}}`}</span>
                                {suggestion.description && (
                                    <span className="text-xs text-slate-500">{suggestion.description}</span>
                                )}
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColors[suggestion.type]}`}>
                                {suggestion.type}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Hook to extract variables from all nodes in the workflow
export function useWorkflowVariables(nodes: any[]): Suggestion[] {
    const variables: Suggestion[] = [];

    for (const node of nodes) {
        if (node.type === 'variable' && node.data?.name) {
            variables.push({
                name: node.data.name,
                type: 'variable',
                description: `Variable: ${node.data.type || 'any'}`
            });
        }
        if (node.type === 'function_start' && node.data?.parameters) {
            for (const param of node.data.parameters) {
                variables.push({
                    name: param.name,
                    type: 'param',
                    description: `Function parameter: ${param.type || 'any'}`
                });
            }
        }
        if (node.type === 'math' && node.data?.resultVar) {
            variables.push({
                name: node.data.resultVar,
                type: 'variable',
                description: 'Math result'
            });
        }
        if (node.type === 'data_op' && node.data?.resultVar) {
            variables.push({
                name: node.data.resultVar,
                type: 'variable',
                description: 'Data operation result'
            });
        }
        if (node.type === 'database' && node.data?.resultVar) {
            variables.push({
                name: node.data.resultVar,
                type: 'variable',
                description: 'Database query result'
            });
        }
        if (node.type === 'code' && node.data?.resultVar) {
            variables.push({
                name: node.data.resultVar,
                type: 'variable',
                description: 'Code execution result'
            });
        }
    }

    return variables;
}
