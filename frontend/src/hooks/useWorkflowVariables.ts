import { useNodes } from '@xyflow/react';
import { useMemo } from 'react';

export interface WorkflowVariable {
    id: string;
    name: string;
    type: string;
    value?: any;
}

export function useWorkflowVariables() {
    const nodes = useNodes();

    const variables = useMemo(() => {
        return nodes
            .filter((n) => n.type === 'variable')
            .map((n) => ({
                id: n.id,
                name: n.data.name as string,
                type: n.data.type as string,
                value: n.data.value
            }))
            .filter(v => v.name && v.name.trim() !== '');
    }, [nodes]);

    return variables;
}
