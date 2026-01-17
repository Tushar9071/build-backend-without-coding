import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useWorkflowStore } from '../store/workflowStore';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, GitBranch, Trash2, Edit2 } from 'lucide-react';

export default function Workflows() {
    const { workflows, fetchWorkflows, createWorkflow, deleteWorkflow, updateWorkflow, isLoading } = useWorkflowStore();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newWorkflowName, setNewWorkflowName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<{ id: string, name: string } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkflowName.trim()) return;

        setIsCreating(true);
        try {
            await createWorkflow(newWorkflowName);
            setIsCreateModalOpen(false);
            setNewWorkflowName('');
        } catch (error) {
            console.error("Failed to create workflow:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWorkflow || !editingWorkflow.name.trim()) return;

        setIsUpdating(true);
        try {
            await updateWorkflow(editingWorkflow.id, { name: editingWorkflow.name });
            setIsEditModalOpen(false);
            setEditingWorkflow(null);
        } catch (error) {
            console.error("Failed to update workflow:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        toast((t) => (
            <div className="flex flex-col gap-4 min-w-[300px] bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Delete Workflow?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Are you sure you want to delete this workflow? This action cannot be undone.
                    </p>
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            await deleteWorkflow(id);
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: {
                background: 'transparent',
                boxShadow: 'none',
            }
        });
    };

    const openEditModal = (e: React.MouseEvent, workflow: { id: string, name: string }) => {
        e.stopPropagation();
        setEditingWorkflow(workflow);
        setIsEditModalOpen(true);
    };

    const handleCardClick = (id: string) => {
        navigate(`/workflows/${id}`);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Workflows</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your backend logic flows.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Workflow
                </button>
            </header>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search workflows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
            </div>

            {isLoading && workflows.length === 0 ? (
                <div className="text-center py-20">
                    <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-500">Loading workflows...</p>
                </div>
            ) : filteredWorkflows.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50 rounded-xl border-dashed">
                    <GitBranch className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-300 mb-1">No workflows found</h3>
                    <p className="text-slate-500 dark:text-slate-500 mb-6">Get started by creating your first workflow.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Create Workflow
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWorkflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            onClick={() => handleCardClick(workflow.id)}
                            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] relative overflow-hidden"
                        >
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={(e) => openEditModal(e, workflow)}
                                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                    title="Rename"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, workflow.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-all">
                                    <GitBranch className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors pr-16">{workflow.name}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2">
                                    {workflow.nodes.length} nodes • {workflow.edges.length} connections
                                </p>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-2">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        {workflow.updated_at ? new Date(workflow.updated_at).toLocaleDateString() : 'Just now'}
                                    </span>
                                </div>
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    Active
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Create New Workflow</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Workflow Name
                                </label>
                                <input
                                    type="text"
                                    value={newWorkflowName}
                                    onChange={(e) => setNewWorkflowName(e.target.value)}
                                    placeholder="e.g., User Validation Flow"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    {isCreating ? 'Creating...' : 'Create Workflow'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingWorkflow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Rename Workflow</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    Workflow Name
                                </label>
                                <input
                                    type="text"
                                    value={editingWorkflow.name}
                                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
