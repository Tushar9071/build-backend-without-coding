import { Github, Loader2, X, Download } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useState } from 'react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
}

export const DeployModal: React.FC<DeployModalProps> = ({ isOpen, onClose, workflowId }) => {
  const [token, setToken] = useState('');
  const [repoName, setRepoName] = useState(''); // e.g., "username/repo"
  const { deployWorkflow, downloadWorkflowCode, isLoading } = useWorkflowStore();
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await deployWorkflow(workflowId, token, repoName);
      if (result && result.repo_url) {
        setDeployUrl(result.repo_url);
      }
    } catch (error) {
      // Error is handled in store
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Github className="w-6 h-6" />
            <h2 className="text-xl font-bold dark:text-white">Run or Deploy</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {deployUrl ? (
          <div className="space-y-4">
             <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-green-700 dark:text-green-300">
               Deployment successful!
             </div>
             <p className="text-sm text-gray-600 dark:text-gray-400">
               Your code has been pushed to:
             </p>
             <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-blue-600 dark:text-blue-400 break-all transition-colors underline">
               {deployUrl}
             </a>
             <button
               onClick={onClose}
               className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
             >
               Close
             </button>
          </div>
        ) : (
          <div className="space-y-6">
             {/* Download Section */}
             <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-2 dark:text-gray-200 flex items-center gap-2">
                   <Download className="w-4 h-4" />
                   Download Code
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                   Get the full python project as a .zip file. Includes FastAPI server, Dockerfile, and runner logic.
                </p>
                <button
                  type="button"
                  onClick={() => downloadWorkflowCode(workflowId)}
                  className="w-full py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Download ZIP
                </button>
             </div>

             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or deploy to GitHub</span>
                </div>
             </div>

            <form onSubmit={handleDeploy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">GitHub Token</label>
                <input
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="ghp_..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Repository Name</label>
                <input
                  type="text"
                  required
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="username/repo"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-black dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    Deploy to GitHub
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

