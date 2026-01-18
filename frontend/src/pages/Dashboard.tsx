import { Activity, Server, Database, Users, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { useDashboardStore } from '../store/dashboardStore';
import { Modal } from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

function StatCard({ title, value, change, trend, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg bg-opacity-10", color)}>
          <Icon className={cn("w-5 h-5", color.replace("bg-", "text-"))} />
        </div>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800",
          trend === 'up' ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"
        )}>
          {change}
        </span>
      </div>
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { workflows, fetchWorkflows, createWorkflow, isLoading } = useWorkflowStore();
  const { stats, fetchStats, isLoading: isStatsLoading } = useDashboardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflows();
    fetchStats();
  }, [fetchWorkflows, fetchStats]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    setIsCreating(true);
    try {
      await createWorkflow(newWorkflowName);
      setIsModalOpen(false);
      setNewWorkflowName('');
      // Optional: navigate to the new workflow
      navigate('/workflows');
    } catch (error) {
      console.error("Failed to create workflow:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Overview of your backend infrastructure and performance.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </button>
      </header>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Workflow"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
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
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
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
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Workflows"
          value={isLoading ? "..." : workflows.length.toString()}
          change="+12%"
          trend="up"
          icon={Activity}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Active Endpoints"
          value={isStatsLoading || !stats ? "..." : stats.active_endpoints.toString()}
          change="+3"
          trend="up"
          icon={Server}
          color="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          title="DB Connections"
          value={isStatsLoading || !stats ? "..." : stats.db_connections.toString()}
          change="Stable"
          trend="neutral"
          icon={Database}
          color="bg-orange-500/10 text-orange-500"
        />
        <StatCard
          title="Avg. Latency"
          value={isStatsLoading || !stats ? "..." : stats.avg_latency}
          change="-5ms"
          trend="up"
          icon={Users}
          color="bg-green-500/10 text-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {stats?.recent_activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", activity.status_code === 200 ? "bg-green-500" : "bg-red-500")} />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{activity.method} {activity.endpoint}</p>
                    <p className="text-xs text-slate-500">{activity.time} • {activity.status}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">{activity.duration}</span>
              </div>
            )) || <p className="text-slate-400 text-sm">No recent activity</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <button className="w-full mb-3 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
            + New API Endpoint
          </button>
          <button className="w-full mb-3 py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors">
            + Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
}
