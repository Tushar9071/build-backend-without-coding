import { type HTMLAttributes, forwardRef } from 'react';

interface NodeInputWrapperProps extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

/**
 * Wrapper to prevent React Flow from capturing mouse/wheel events from inputs.
 * Use this around any interactive element inside a node that needs text selection
 * or scrolling without moving the node or zooming the canvas.
 */
export const NodeInputWrapper = forwardRef<HTMLDivElement, NodeInputWrapperProps>(
    ({ children, className = '', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`nodrag nowheel ${className}`}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                {...props}
            >
                {children}
            </div>
        );
    }
);

NodeInputWrapper.displayName = 'NodeInputWrapper';

/**
 * Standard input that doesn't interfere with React Flow interactions
 */
export const NodeInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className = '', ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`nodrag nowheel ${className}`}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                {...props}
            />
        );
    }
);

NodeInput.displayName = 'NodeInput';

/**
 * Standard textarea that doesn't interfere with React Flow interactions
 */
export const NodeTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className = '', ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={`nodrag nowheel ${className}`}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                {...props}
            />
        );
    }
);

NodeTextarea.displayName = 'NodeTextarea';

/**
 * Standard select that doesn't interfere with React Flow interactions
 */
export const NodeSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className = '', ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={`nodrag nowheel ${className}`}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                {...props}
            />
        );
    }
);

NodeSelect.displayName = 'NodeSelect';
