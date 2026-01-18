import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Calendar, GitBranch, Folder, AlertCircle, X, Trash2, Edit2 } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { api } from '../lib/api';

interface WorkflowsProps {
    category?: string;
    title?: string;
    description?: string;
}

export default function Workflows({ category = 'route', title = 'API Routes', description = 'Manage your API endpoints.' }: WorkflowsProps) {
    const navigate = useNavigate();
    const { activeProject, loadProject, createWorkflowInProject, fetchProjects } = useProjectStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newWorkflowName, setNewWorkflowName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<{ id: string; name: string } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchProjects();
        // Reload active project to get fresh data
        if (activeProject?.id) {
            loadProject(activeProject.id);
        }
    }, [fetchProjects, activeProject?.id, loadProject]);

    // Get workflows from active project based on category
    const getWorkflowsForCategory = () => {
        if (!activeProject) return [];

        switch (category) {
            case 'route':
                return activeProject.routes || [];
            case 'function':
                return activeProject.functions || [];
            case 'interface':
                return activeProject.interfaces || [];
            default:
                return [];
        }
    };

    const workflows = getWorkflowsForCategory();
    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkflowName.trim() || !activeProject) return;

        setIsCreating(true);
        try {
            await createWorkflowInProject(activeProject.id, newWorkflowName, category);
            toast.success(`${title.replace(/s$/, '')} created!`);
            setIsCreateModalOpen(false);
            setNewWorkflowName('');
        } catch (error) {
            toast.error('Failed to create');
            console.error("Failed to create workflow:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCardClick = (id: string) => {
        navigate(`/workflows/${id}?context=${category}`);
    };

    const handleEdit = (e: React.MouseEvent, workflow: { id: string; name: string }) => {
        e.stopPropagation();
        setEditingWorkflow({ id: workflow.id, name: workflow.name });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWorkflow || !editingWorkflow.name.trim() || !activeProject) return;

        setIsUpdating(true);
        try {
            await api.put(`/workflows/${editingWorkflow.id}`, { name: editingWorkflow.name });
            toast.success('Workflow renamed');
            setIsEditModalOpen(false);
            setEditingWorkflow(null);
            // Refresh project data
            await loadProject(activeProject.id);
        } catch (error) {
            toast.error('Failed to rename');
            console.error("Failed to update workflow:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this workflow?')) return;
        if (!activeProject) return;

        try {
            await api.delete(`/workflows/${id}`);
            toast.success('Workflow deleted');
            // Refresh project data
            await loadProject(activeProject.id);
        } catch (error) {
            toast.error('Failed to delete');
            console.error("Failed to delete workflow:", error);
        }
    };

    // No project selected - show prompt
    if (!activeProject) {
        return (
            <div className="p-8 max-w-7xl mx-auto h-full flex flex-col items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Project Selected</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                        Please select a project first to manage your {title.toLowerCase()}.
                    </p>
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        <Folder className="w-5 h-5" />
                        Go to Projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            {/* Project Context Banner */}
            <div className="mb-4 flex items-center gap-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg px-4 py-2">
                <Folder className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-indigo-700 dark:text-indigo-300">
                    Working in: <strong>{activeProject.name}</strong>
                </span>
                <Link
                    to="/projects"
                    className="ml-auto text-xs text-indigo-500 hover:text-indigo-400 underline"
                >
                    Switch Project
                </Link>
            </div>

            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{description}</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New {title.replace(/s$/, '')}
                </button>
            </header>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder={`Search ${title.toLowerCase()}...`}
                    className="w-full max-w-md pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Workflows Grid */}
            <div className="flex-1 overflow-y-auto">
                {filteredWorkflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                        <GitBranch className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg mb-2">No {title.toLowerCase()} found</p>
                        <p className="text-sm">Get started by creating your first {title.toLowerCase().replace(/s$/, '')}.</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 text-sm text-indigo-500 hover:text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg hover:bg-indigo-500/10 transition-colors"
                        >
                            Create Workflow
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredWorkflows.map((workflow) => (
                            <div
                                key={workflow.id}
                                onClick={() => handleCardClick(workflow.id)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-lg hover:border-indigo-500/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                        <GitBranch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleEdit(e, workflow)}
                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-blue-500"
                                            title="Rename"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, workflow.id)}
                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-red-500"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-500 transition-colors">
                                    {workflow.name}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(workflow.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">Create New {title.replace(/s$/, '')}</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newWorkflowName}
                                    onChange={(e) => setNewWorkflowName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder={`e.g., ${category === 'route' ? 'Get Users' : category === 'function' ? 'Calculate Total' : 'User Schema'}`}
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newWorkflowName.trim()}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                                >
                                    {isCreating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit/Rename Modal */}
            {isEditModalOpen && editingWorkflow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">Rename Workflow</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Name</label>
                                <input
                                    type="text"
                                    value={editingWorkflow.name}
                                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating || !editingWorkflow.name.trim()}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                                >
                                    {isUpdating ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
