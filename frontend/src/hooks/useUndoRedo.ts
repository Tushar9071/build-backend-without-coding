import { useState, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}

export default function useUndoRedo() {
    // History is an array of states
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [index, setIndex] = useState(-1);

    const takeSnapshot = useCallback((state: HistoryState) => {
        setHistory((prev) => {
            const currentHistory = prev.slice(0, index + 1);
            // Deduplicate
            if (currentHistory.length > 0) {
                const last = currentHistory[currentHistory.length - 1];
                // Check if identical state
                if (last.nodes.length === state.nodes.length && last.edges.length === state.edges.length) {
                    if (JSON.stringify(last) === JSON.stringify(state)) {
                        return prev; // no change
                    }
                }
            }

            const newHistory = [...currentHistory, state];
            return newHistory.slice(-50); // limit
        });

        setIndex((prev) => Math.min(prev + 1, 49)); // simplified
    }, [index]);


    const undo = useCallback(() => {
        setHistory((prevHistory) => {
            // We need to know current index to undo.
            // But we use state index. 
            // Wait, we need to return the value synchronously? 
            // setIndex is async.
            // Let's rely on external index? No.
            // We just return the target state from history[index - 1]
            return prevHistory;
        });

        // Actually, to make undo work properly, we need to update index and return correct state.
        // But setState doesn't return value.
        // We need 'index' from closure.
        if (index > 0) {
            const newIndex = index - 1;
            setIndex(newIndex);
            return history[newIndex];
        }
        return null;
    }, [history, index]);

    const redo = useCallback(() => {
        if (index < history.length - 1) {
            const newIndex = index + 1;
            setIndex(newIndex);
            return history[newIndex];
        }
        return null;
    }, [history, index]);

    return {
        takeSnapshot,
        undo,
        redo,
        canUndo: index > 0,
        canRedo: index < history.length - 1
    };
}
