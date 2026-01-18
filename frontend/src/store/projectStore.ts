import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export interface WorkflowSummary {
    id: string;
    name: string;
    category: string;
    created_at: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at?: string;
    routes?: WorkflowSummary[];
    functions?: WorkflowSummary[];
    interfaces?: WorkflowSummary[];
}

interface ProjectState {
    projects: Project[];
    activeProject: Project | null;
    isLoading: boolean;

    fetchProjects: () => Promise<void>;
    createProject: (name: string, description?: string) => Promise<Project>;
    loadProject: (id: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    setActiveProject: (project: Project | null) => void;
    createWorkflowInProject: (projectId: string, name: string, category: string) => Promise<any>;
    clearActiveProject: () => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            projects: [],
            activeProject: null,
            isLoading: false,

            fetchProjects: async () => {
                set({ isLoading: true });
                try {
                    const res = await api.get('/projects/');
                    set({ projects: res.data });
                } catch (error) {
                    console.error('Failed to fetch projects:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            createProject: async (name: string, description?: string) => {
                const res = await api.post('/projects/', { name, description });
                const newProject = res.data;
                set((state) => ({ projects: [newProject, ...state.projects] }));
                return newProject;
            },

            loadProject: async (id: string) => {
                set({ isLoading: true });
                try {
                    const res = await api.get(`/projects/${id}`);
                    set({ activeProject: res.data });
                } catch (error) {
                    console.error('Failed to load project:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            deleteProject: async (id: string) => {
                await api.delete(`/projects/${id}`);
                set((state) => ({
                    projects: state.projects.filter(p => p.id !== id),
                    activeProject: state.activeProject?.id === id ? null : state.activeProject
                }));
            },

            setActiveProject: (project: Project | null) => {
                set({ activeProject: project });
            },

            clearActiveProject: () => {
                set({ activeProject: null });
            },

            createWorkflowInProject: async (projectId: string, name: string, category: string) => {
                const res = await api.post(`/projects/${projectId}/workflows`, null, {
                    params: { workflow_name: name, category }
                });
                // Reload project to get updated workflows
                await get().loadProject(projectId);
                return res.data;
            }
        }),
        {
            name: 'active-project-storage',
            partialize: (state) => ({ activeProject: state.activeProject }),
        }
    )
);
