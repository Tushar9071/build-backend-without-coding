import { create } from 'zustand';
import { api, endpoints } from '../lib/api';
import type { Node, Edge } from '@xyflow/react';
import { toast } from 'react-hot-toast';

export interface Workflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  updated_at?: string;
  description?: string;
  category?: string;
}

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;

  fetchWorkflows: () => Promise<void>;
  createWorkflow: (name: string, category?: string) => Promise<void>;
  loadWorkflow: (id: string) => Promise<void>;
  saveWorkflow: (id: string, nodes: Node[], edges: Edge[]) => Promise<void>;
  updateWorkflow: (id: string, data: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  runWorkflow: (id: string, inputData: any) => Promise<any>;
  deployWorkflow: (id: string, token: string, repoName: string) => Promise<{ repo_url: string }>;
  downloadWorkflowCode: (id: string) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,

  runWorkflow: async (id: string, inputData: any) => {
    // Don't set global loading state to avoid full page spinner, just return result
    try {
      const response = await api.post(endpoints.workflows.run(id), inputData);
      return response.data;
    } catch (err: any) {
      toast.error("Failed to run workflow");
      throw err;
    }
  },

  fetchWorkflows: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get(endpoints.workflows.list);
      set({ workflows: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to fetch workflows');
    }
  },

  createWorkflow: async (name: string, category: string = 'route') => {
    set({ isLoading: true });
    try {
      const response = await api.post(endpoints.workflows.create, {
        name,
        category,
        nodes: [],
        edges: []
      });
      set(state => ({
        workflows: [...state.workflows, response.data],
        isLoading: false
      }));
      toast.success('Workflow created successfully');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to create workflow');
    }
  },

  loadWorkflow: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await api.get(endpoints.workflows.get(id));
      set({ currentWorkflow: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to load workflow');
    }
  },

  saveWorkflow: async (id: string, nodes: Node[], edges: Edge[]) => {
    const current = get().currentWorkflow;
    if (!current) return;

    try {
      await api.put(endpoints.workflows.update(id), {
        name: current.name,
        nodes,
        edges
      });

      set(state => ({
        currentWorkflow: state.currentWorkflow ? { ...state.currentWorkflow, nodes, edges } : null
      }));
      toast.success('Workflow saved');
    } catch (err: any) {
      console.error("Failed to save workflow", err);
      toast.error('Failed to save workflow');
    }
  },

  updateWorkflow: async (id: string, data: Partial<Workflow>) => {
    set({ isLoading: true });
    try {
      let name = data.name;
      if (!name) {
        const ex = get().workflows.find(w => w.id === id);
        name = ex?.name || "Untitled";
      }

      const payload = {
        name,
        ...data
      };

      const response = await api.put(endpoints.workflows.update(id), payload);

      set(state => ({
        workflows: state.workflows.map(w => w.id === id ? response.data : w),
        currentWorkflow: state.currentWorkflow?.id === id ? response.data : state.currentWorkflow,
        isLoading: false
      }));
      toast.success('Workflow updated');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to update workflow');
    }
  },

  deleteWorkflow: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.delete(endpoints.workflows.delete(id));
      set(state => ({
        workflows: state.workflows.filter(w => w.id !== id),
        currentWorkflow: state.currentWorkflow?.id === id ? null : state.currentWorkflow,
        isLoading: false
      }));
      toast.success('Workflow deleted');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      toast.error('Failed to delete workflow');
    }
  },

  deployWorkflow: async (id, token, repoName) => {
    set({ isLoading: true });
    try {
      const response = await api.post(endpoints.github.deploy, {
        workflow_id: id,
        github_token: token,
        repo_name: repoName
      });
      toast.success('Deployed successfully!');
      return response.data;
    } catch (error: any) {
      toast.error('Deployment failed: ' + (error.response?.data?.detail || error.message));
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  downloadWorkflowCode: async (id) => {
    try {
      const url = `${api.defaults.baseURL}${endpoints.github.download(id)}`;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `workflow-${id}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      toast.error('Download failed');
    }
  }
}));
