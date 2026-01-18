import { useState, useEffect } from 'react';
import { Database, RefreshCw, Table, Terminal, CheckCircle2, Lock, Server } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../lib/api';

export default function DatabaseManager() {
  const [dbConfig, setDbConfig] = useState<{ url: string } | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbType, setDbType] = useState('postgresql');
  const [connectionUrl, setConnectionUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'tables' | 'query'>('tables');
  const [customQuery, setCustomQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/db/config');
      if (res.data.url) {
        setDbConfig(res.data);
        setConnectionUrl(res.data.url);
        // If backend returned type we would set it here, but current get_config might not return it. 
        // We'll leave default for now or update get_config later if needed.
        fetchTables();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await api.get('/db/tables');
      setTables(res.data);
    } catch (error) {
      toast.error('Failed to fetch tables');
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await api.post('/db/connect', { url: connectionUrl, type: dbType });
      toast.success('Database connected successfully!');
      setDbConfig({ url: connectionUrl });
      fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    setActiveTable(tableName);
    setIsLoading(true);
    try {
      const res = await api.get(`/db/table/${tableName}`);
      setTableData(res.data);
    } catch (error) {
      toast.error('Failed to load table data');
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!customQuery.trim()) return;
    setIsLoading(true);
    setQueryResult(null);
    try {
      const res = await api.post('/db/query', { query: customQuery });
      setQueryResult({ status: 'success', data: res.data });
      toast.success('Query executed');
    } catch (error: any) {
      setQueryResult({ status: 'error', error: error.response?.data?.detail || 'Query failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-950 text-white">
      {/* Sidebar - Tables */}
      <div className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            dbAdmin
          </h2>
          <div className="mt-4">
            {!dbConfig ? (
              <div className="text-xs text-slate-500 italic">Not Connected</div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Connected ({dbType})
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {dbConfig && (
            <>
              <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tables</div>
              {tables.map(table => (
                <button
                  key={table}
                  onClick={() => loadTableData(table)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${activeTable === table ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <Table className="w-4 h-4 opacity-70" />
                  {table}
                </button>
              ))}
              {tables.length === 0 && <div className="text-center text-slate-600 text-sm py-4">No tables found</div>}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Connection Overlay if not connected */}
        {!dbConfig && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Server className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">Connect Database</h2>
                <p className="text-slate-400 text-sm mt-2">Enter your connection string to manage your data.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Database Type</label>
                  <div className="relative">
                    <Database className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <select
                      value={dbType}
                      onChange={(e) => setDbType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="postgresql">PostgreSQL</option>
                      <option value="mysql">MySQL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Connection URL</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={connectionUrl}
                      onChange={(e) => setConnectionUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                      placeholder={dbType === 'postgresql' ? "postgresql://user:pass@host:5432/dbname" : "mysql://user:pass@host:3306/dbname"}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 ml-1">Supports: PostgreSQL (via asyncpg)</p>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={isLoading || !connectionUrl}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 rounded-lg transition-colors shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Connect Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center px-4 justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTab === 'tables' ? 'bg-slate-800 text-white font-medium border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Table className="w-4 h-4" />
              Data Explorer
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTab === 'query' ? 'bg-slate-800 text-white font-medium border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Terminal className="w-4 h-4" />
              SQL Console
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setDbConfig(null)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 hover:bg-red-500/10 rounded transition-colors">
              Disconnect
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-0 relative">

          {activeTab === 'tables' && (
            <div className="h-full flex flex-col">
              {/* Toolbar for Table */}
              {activeTable && (
                <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-200">
                  <h3 className="font-mono text-sm text-slate-300">
                    SELECT * FROM <span className="text-amber-400 font-bold">{activeTable}</span>
                  </h3>
                  <button onClick={() => loadTableData(activeTable)} className="p-1 hover:bg-slate-800 rounded">
                    <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}

              {/* Data Grid */}
              <div className="flex-1 overflow-auto bg-slate-950/50 p-4">
                {activeTable ? (
                  tableData.length > 0 ? (
                    <div className="border border-slate-800 rounded-lg overflow-hidden ring-1 ring-slate-800 shadow-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-slate-400 font-medium">
                          <tr>
                            <th className="px-4 py-3 w-10 border-b border-slate-800 bg-slate-900/80 sticky top-0">#</th>
                            {Object.keys(tableData[0]).map(key => (
                              <th key={key} className="px-4 py-3 border-b border-slate-800 bg-slate-900/80 sticky top-0 min-w-[100px] font-mono text-xs uppercase tracking-wider">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950">
                          {tableData.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-900/50 transition-colors group">
                              <td className="px-4 py-3 text-slate-600 font-mono text-xs border-r border-slate-800/50">{i + 1}</td>
                              {Object.values(row).map((val: any, j) => (
                                <td key={j} className="px-4 py-3 text-slate-300 max-w-[300px] truncate group-hover:whitespace-normal group-hover:break-words text-xs">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                      <p>No records found in table</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 opacity-50">
                    <Table className="w-16 h-16 stroke-1" />
                    <p>Select a table from the sidebar to view data</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'query' && (
            <div className="h-full flex flex-col p-4 gap-4">
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 font-mono text-sm text-amber-200 focus:outline-none focus:border-amber-500 resize-none shadow-inner"
                  placeholder="SELECT * FROM users WHERE active = true;"
                  spellCheck={false}
                />
                <div className="flex justify-end">
                  <button
                    onClick={executeQuery}
                    disabled={isLoading || !customQuery}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-amber-900/20 flex items-center gap-2"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
                    Run Query
                  </button>
                </div>
              </div>

              <div className="h-1/2 bg-slate-900 border border-slate-800 rounded-xl overflow-auto p-4 font-mono text-xs">
                {queryResult ? (
                  queryResult.status === 'success' ? (
                    Array.isArray(queryResult.data) ? (
                      <pre className="text-green-300">{JSON.stringify(queryResult.data, null, 2)}</pre>
                    ) : (
                      <div className="text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Operation Successful. {JSON.stringify(queryResult.data)}
                      </div>
                    )
                  ) : (
                    <div className="text-red-400 whitespace-pre-wrap">{queryResult.error}</div>
                  )
                ) : (
                  <div className="text-slate-600 italic">Query results will appear here...</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
