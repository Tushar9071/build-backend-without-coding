import React, { useState, useRef, useEffect } from 'react';
import { useAvailableVariables } from '../../hooks/useAvailableVariables';
import { Variable } from 'lucide-react';

interface SuggestionInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    nodeId: string;
    value: string;
    onValueChange: (value: string) => void;
}

export function SuggestionInput({ nodeId, value, onValueChange, className, ...props }: SuggestionInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const variables = useAvailableVariables(nodeId);

    // Filter variables based on current search term (if check matches)
    // Now support both '$' and '{' as trigger characters
    const getSearchTerm = (): { term: string; trigger: '$' | '{' } | null => {
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastDollar = textBeforeCursor.lastIndexOf('$');
        const lastBrace = textBeforeCursor.lastIndexOf('{');

        // Find which trigger is closer to cursor
        const lastTriggerPos = Math.max(lastDollar, lastBrace);
        if (lastTriggerPos === -1) return null;

        const trigger = lastTriggerPos === lastDollar ? '$' : '{';
        const textAfterTrigger = textBeforeCursor.substring(lastTriggerPos + 1);

        // For {, check if we're still inside (no closing })
        if (trigger === '{') {
            const closeBrace = textAfterTrigger.indexOf('}');
            if (closeBrace !== -1) return null; // Already closed
        }

        // Check if we are "inside" a potential variable name (no spaces)
        if (!/\s/.test(textAfterTrigger)) {
            return { term: textAfterTrigger, trigger };
        }

        return null;
    };

    const searchResult = getSearchTerm();
    const searchTerm = searchResult?.term ?? null;

    const filteredVariables = searchTerm !== null
        ? variables.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    useEffect(() => {
        if (searchTerm !== null && variables.length > 0) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [searchTerm, variables.length]);

    const handleSelect = (varName: string) => {
        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);

        const result = getSearchTerm();
        if (!result) return;

        const { trigger } = result;
        const lastTriggerPos = trigger === '$'
            ? textBeforeCursor.lastIndexOf('$')
            : textBeforeCursor.lastIndexOf('{');

        if (lastTriggerPos !== -1) {
            const prePart = textBeforeCursor.substring(0, lastTriggerPos);

            // Insert format based on trigger
            let newValue: string;
            let newPos: number;

            if (trigger === '$') {
                newValue = `${prePart}$${varName}${textAfterCursor}`;
                newPos = prePart.length + varName.length + 1;
            } else {
                newValue = `${prePart}{${varName}}${textAfterCursor}`;
                newPos = prePart.length + varName.length + 2;
            }

            onValueChange(newValue);
            setIsOpen(false);

            // Move cursor to end of inserted variable
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.setSelectionRange(newPos, newPos);
                    inputRef.current.focus();
                }
            }, 0);
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && !inputRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isOpen) {
            // TODO: Add arrow key navigation support
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        }
    }

    return (
        <div
            className="relative w-full"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => {
                    onValueChange(e.target.value);
                    setCursorPosition(e.target.selectionStart || 0);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setCursorPosition(e.currentTarget.selectionStart || 0);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => {
                    setCursorPosition(e.currentTarget.selectionStart || 0);
                }}
                onKeyDown={handleKeyDown}
                className={className}
                autoComplete="off"
                {...props}
            />

            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
                    style={{ top: '100%' }}
                    onWheel={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div className="py-1">
                        <div className='px-2 py-1 text-[10px] text-slate-500 font-bold uppercase border-b border-slate-800 bg-slate-950'>
                            Suggestions
                        </div>
                        {filteredVariables.map((variable) => (
                            <button
                                key={variable.name}
                                onClick={() => handleSelect(variable.name)}
                                className="flex items-center w-full px-3 py-2 text-sm text-left text-slate-300 hover:bg-slate-800 hover:text-white group"
                            >
                                <Variable className="w-3 h-3 mr-2 text-indigo-400 group-hover:text-indigo-300" />
                                <span className="flex-1 font-mono">{variable.name}</span>
                                <span className="text-[10px] text-slate-500 bg-slate-950 px-1 rounded">{variable.nodeType}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
