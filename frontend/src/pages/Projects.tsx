import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, type Project } from '../store/projectStore';
import { Folder, Plus, Search, Calendar, Trash2, Network, Workflow, FileJson, X, ChevronRight, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Projects() {
    const navigate = useNavigate();
    const { projects, activeProject, fetchProjects, createProject, loadProject, deleteProject, setActiveProject, isLoading } = useProjectStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            const project = await createProject(newProjectName, newProjectDesc);
            toast.success('Project created successfully!');
            setIsCreateModalOpen(false);
            setNewProjectName('');
            setNewProjectDesc('');
            // Expand the new project
            setExpandedProjectId(project.id);
            await loadProject(project.id);
        } catch (error) {
            toast.error('Failed to create project');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this project and all its workflows?')) return;

        try {
            await deleteProject(id);
            toast.success('Project deleted');
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    const toggleProject = async (project: Project) => {
        if (expandedProjectId === project.id) {
            setExpandedProjectId(null);
        } else {
            setExpandedProjectId(project.id);
            await loadProject(project.id);
        }
    };

    const openWorkflow = (workflowId: string, category: string) => {
        navigate(`/workflows/${workflowId}?context=${category}`);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Projects</h1>
                    <p className="text-slate-500 dark:text-slate-400">Master workflows containing Routes, Functions, and Interfaces</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    New Project
                </button>
            </header>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full max-w-md pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading && projects.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                        <Folder className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg">No projects found</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4 text-indigo-500 hover:text-indigo-400 font-medium"
                        >
                            Create your first project
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Project Header */}
                                <div
                                    onClick={() => toggleProject(project)}
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                            <Folder className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{project.name}</h3>
                                            {project.description && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{project.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={(e) => handleDelete(e, project.id)}
                                            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedProjectId === project.id ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedProjectId === project.id && activeProject?.id === project.id && (
                                    <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/50">
                                        {/* Action Bar */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                                {(activeProject.routes?.length || 0) + (activeProject.functions?.length || 0) + (activeProject.interfaces?.length || 0)} workflows
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveProject(activeProject);
                                                    toast.success(`Selected project: ${activeProject.name}`);
                                                    navigate('/routes');
                                                }}
                                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                                Work on This Project
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            {/* Routes */}
                                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Network className="w-4 h-4 text-indigo-500" />
                                                    <h4 className="font-medium text-slate-900 dark:text-white">API Routes</h4>
                                                    <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                                        {activeProject.routes?.length || 0}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {activeProject.routes?.map(w => (
                                                        <button
                                                            key={w.id}
                                                            onClick={() => openWorkflow(w.id, 'route')}
                                                            className="w-full text-left p-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                                                        >
                                                            {w.name}
                                                        </button>
                                                    ))}
                                                    {(!activeProject.routes || activeProject.routes.length === 0) && (
                                                        <p className="text-xs text-slate-400 italic">No routes yet</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Functions */}
                                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Workflow className="w-4 h-4 text-pink-500" />
                                                    <h4 className="font-medium text-slate-900 dark:text-white">Functions</h4>
                                                    <span className="ml-auto text-xs bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">
                                                        {activeProject.functions?.length || 0}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {activeProject.functions?.map(w => (
                                                        <button
                                                            key={w.id}
                                                            onClick={() => openWorkflow(w.id, 'function')}
                                                            className="w-full text-left p-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                                                        >
                                                            {w.name}
                                                        </button>
                                                    ))}
                                                    {(!activeProject.functions || activeProject.functions.length === 0) && (
                                                        <p className="text-xs text-slate-400 italic">No functions yet</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Interfaces */}
                                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FileJson className="w-4 h-4 text-orange-500" />
                                                    <h4 className="font-medium text-slate-900 dark:text-white">Interfaces</h4>
                                                    <span className="ml-auto text-xs bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                                                        {activeProject.interfaces?.length || 0}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {activeProject.interfaces?.map(w => (
                                                        <button
                                                            key={w.id}
                                                            onClick={() => openWorkflow(w.id, 'interface')}
                                                            className="w-full text-left p-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                                                        >
                                                            {w.name}
                                                        </button>
                                                    ))}
                                                    {(!activeProject.interfaces || activeProject.interfaces.length === 0) && (
                                                        <p className="text-xs text-slate-400 italic">No interfaces yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                            <h3 className="font-bold text-slate-900 dark:text-white">Create New Project</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Name</label>
                                <input
                                    type="text"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., E-Commerce API"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (optional)</label>
                                <textarea
                                    value={newProjectDesc}
                                    onChange={(e) => setNewProjectDesc(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                                    placeholder="Brief description of your project..."
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
                                    disabled={isCreating || !newProjectName.trim()}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                                >
                                    {isCreating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
