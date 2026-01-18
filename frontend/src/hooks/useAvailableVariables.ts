import { useNodes, useEdges, type Node, type Edge } from '@xyflow/react';
import { useMemo } from 'react';

export interface VariableSuggestion {
    name: string;
    type?: string;
    nodeType: string;
}

const findIncomingNodes = (nodeId: string, nodes: Node[], edges: Edge[]): Node[] => {
    const incomingEdges = edges.filter((edge) => edge.target === nodeId);
    const incomingNodeIds = new Set(incomingEdges.map((edge) => edge.source));
    return nodes.filter((n) => incomingNodeIds.has(n.id));
};

// Helper to traverse interface fields
const getInterfaceFields = (fields: any[], prefix: string = ''): string[] => {
    let vars: string[] = [];
    if (!fields) return vars;

    for (const field of fields) {
        const currentPath = prefix ? `${prefix}.${field.name}` : field.name;
        // If it's a leaf node (or object that can be referenced as whole), add it
        if (field.name) {
            vars.push(currentPath);
        }

        if (field.children && field.children.length > 0) {
            vars = [...vars, ...getInterfaceFields(field.children, currentPath)];
        }
    }
    return vars;
};

const getKeysFromJSON = (obj: any, prefix: string = ''): string[] => {
    let keys: string[] = [];
    if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
            const path = prefix ? `${prefix}.${key}` : key;
            keys.push(path);
            keys.push(...getKeysFromJSON(obj[key], path));
        });
    }
    return keys;
};

export function useAvailableVariables(currentNodeId: string) {
    const nodes = useNodes();
    const edges = useEdges();

    const variables = useMemo(() => {
        const vars: VariableSuggestion[] = [];
        const visited = new Set<string>();
        const stack = [currentNodeId];

        while (stack.length > 0) {
            const currentId = stack.pop()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            // Find parents
            const parents = findIncomingNodes(currentId, nodes, edges);

            for (const parent of parents) {
                // Extract variables based on node type
                if (parent.type === 'variable' && parent.data?.name) {
                    const varName = parent.data.name as string;
                    vars.push({ name: varName, type: (parent.data.type as string) || 'any', nodeType: 'Variable' });

                    // If JSON type, try to parse and add children
                    if (parent.data.type === 'json' || parent.data.type === 'object') {
                        try {
                            const parsed = typeof parent.data.value === 'string' ? JSON.parse(parent.data.value) : parent.data.value;
                            const childKeys = getKeysFromJSON(parsed, varName);
                            childKeys.forEach(k => vars.push({ name: k, type: 'any', nodeType: 'Variable Prop' }));
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                }

                if (parent.type === 'math' && parent.data?.resultVar) {
                    vars.push({ name: parent.data.resultVar as string, type: 'number', nodeType: 'Math' });
                }

                if (parent.type === 'data_op' && parent.data?.resultVar) {
                    vars.push({ name: parent.data.resultVar as string, type: 'number', nodeType: 'Data Op' });
                }

                if (parent.type === 'loop' && parent.data?.variable) {
                    vars.push({ name: parent.data.variable as string, type: 'any', nodeType: 'Loop Item' });
                }

                if (parent.type === 'interface' && parent.data?.fields) {
                    const prefix = (parent.data.transferMode as string) || 'body'; // default source is body like body.field
                    const fields = getInterfaceFields(parent.data.fields as any[]);
                    fields.forEach(f => {
                        vars.push({ name: `${prefix}.${f}`, type: 'any', nodeType: 'Interface' });
                    });
                }

                // Extract Params from API Node Path
                if (parent.type === 'api') {
                    if (parent.data?.path) {
                        const path = parent.data.path as string;
                        // Regex to find :paramName
                        const paramMatches = path.match(/:([a-zA-Z0-9_]+)/g);
                        if (paramMatches) {
                            paramMatches.forEach(p => {
                                const cleanName = p.substring(1); // remove :
                                vars.push({ name: `params.${cleanName}`, type: 'string', nodeType: 'Path Param' });
                            });
                        }
                    }

                    // Extract Body Validation Fields
                    if (parent.data?.validationFields) {
                        const fields = getInterfaceFields(parent.data.validationFields as any[]);
                        fields.forEach(f => {
                            vars.push({ name: `body.${f}`, type: 'any', nodeType: 'API Body' });
                        });
                    }
                }

                // Add parent to stack to continue traversing up
                stack.push(parent.id);
            }
        }

        // Add global (public) variables from all nodes (regardless of connection)
        nodes.forEach(node => {
            if (node.id === currentNodeId) return;

            if (node.type === 'variable' && !node.data?.isPrivate && node.data?.name) {
                const varName = node.data.name as string;
                vars.push({
                    name: varName,
                    type: (node.data.type as string) || 'any',
                    nodeType: 'Variable (Global)'
                });

                // If JSON type, try to parse and add children
                if (node.data.type === 'json' || node.data.type === 'object') {
                    try {
                        const parsed = typeof node.data.value === 'string' ? JSON.parse(node.data.value) : node.data.value;
                        const childKeys = getKeysFromJSON(parsed, varName);
                        childKeys.forEach(k => vars.push({ name: k, type: 'any', nodeType: 'Variable Prop' }));
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }
        });

        // Add Implicit Context Variables
        vars.push({ name: 'body', type: 'object', nodeType: 'Context' });
        vars.push({ name: 'query', type: 'object', nodeType: 'Context' });
        vars.push({ name: 'params', type: 'object', nodeType: 'Context' });
        vars.push({ name: 'request', type: 'object', nodeType: 'Context' });
        vars.push({ name: 'user', type: 'object', nodeType: 'Context' });
        vars.push({ name: 'func_result', type: 'any', nodeType: 'Function' });

        // Add Database Node results
        nodes.forEach(node => {
            if (node.type === 'database' && node.data?.resultVar) {
                vars.push({ name: node.data.resultVar as string, type: 'any', nodeType: 'Database' });
            }
            if (node.type === 'code' && node.data?.resultVar) {
                vars.push({ name: node.data.resultVar as string, type: 'any', nodeType: 'Code' });
            }
            if (node.type === 'subworkflow') {
                vars.push({ name: 'func_result', type: 'any', nodeType: 'Function Call' });
            }
            // Function Start node parameters
            if (node.type === 'function_start' && node.data?.parameters) {
                const params = node.data.parameters as Array<{ name: string; type: string }>;
                params.forEach(p => {
                    vars.push({ name: p.name, type: p.type || 'any', nodeType: 'Function Param' });
                });
            }
        });

        // Remove duplicates (by name)
        const uniqueVars = new Map();
        vars.forEach(v => {
            if (!uniqueVars.has(v.name)) {
                uniqueVars.set(v.name, v);
            }
        });

        return Array.from(uniqueVars.values());
    }, [nodes, edges, currentNodeId]);

    return variables;
}
