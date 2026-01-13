import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api';
import Breadcrumb from './Breadcrumb';

const RoleWorkflowConfig = () => {
  const [roles, setRoles] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, workflowsRes] = await Promise.all([
        api.get('/approvers/roles/workflows'),
        api.get('/approval-workflow')
      ]);
      
      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (workflowsRes.data.success) setWorkflows(workflowsRes.data.data);
    } catch (error) {
      console.error('获取数据失败:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowChange = async (roleId, workflowId) => {
    setUpdatingId(roleId);
    try {
      const response = await api.put(`/approvers/roles/${roleId}/workflow`, {
        role_id: roleId,
        workflow_id: workflowId || null
      });

      if (response.data.success) {
        toast.success('配置已自动保存');
        setRoles(roles.map(r => r.id === roleId ? { ...r, workflow_id: workflowId } : r));
      } else {
        toast.error(response.data.message || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('网络错误');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(role => 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [roles, searchTerm]);

  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRoles.slice(startIndex, startIndex + pageSize);
  }, [filteredRoles, currentPage]);

  const totalPages = Math.ceil(filteredRoles.length / pageSize);

  return (
    <div className="container mx-auto py-4 max-w-5xl px-4 sm:px-6">
      <Breadcrumb items={['首页', '报销管理', '角色流程映射']} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4 mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">角色流程映射</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="快速搜索..."
              className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center justify-center h-9 w-9 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 bg-white disabled:opacity-50"
          >
            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">角色名称</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-72">关联流程</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">描述说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && roles.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : paginatedRoles.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-12 text-center text-sm text-slate-400">暂无数据</td>
                </tr>
              ) : (
                paginatedRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="text-base font-semibold text-slate-800">{role.name}</span>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-[240px]">
                          <select
                            className={`
                              w-full h-9 pl-3 pr-8 text-sm bg-white border rounded-md appearance-none transition-all outline-none
                              ${updatingId === role.id ? 'border-primary ring-2 ring-primary/5' : 'border-slate-200 hover:border-slate-300'}
                              ${!role.workflow_id ? 'text-slate-400 italic' : 'text-slate-700 font-medium'}
                            `}
                            value={role.workflow_id || ''}
                            onChange={(e) => handleWorkflowChange(role.id, e.target.value ? parseInt(e.target.value) : null)}
                            disabled={updatingId === role.id}
                          >
                            <option value="">系统默认流程</option>
                            {workflows.map(wf => (
                              <option key={wf.id} value={wf.id}>
                                {wf.name} {wf.status === 'inactive' ? '(已停用)' : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                        
                        <div className="w-5 shrink-0">
                          {updatingId === role.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : role.workflow_id ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-500 line-clamp-1" title={role.description}>
                        {role.description || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredRoles.length > pageSize && (
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              共 {filteredRoles.length} 条数据
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </button>
              
              <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded text-slate-600">
                第 {currentPage} 页 / 共 {totalPages} 页
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-bold">优先级说明：</span>此处配置的流程将覆盖所有通用条件。当员工提交报销时，系统将优先执行其角色所绑定的特定流程。
        </p>
      </div>
    </div>
  );
};

export default RoleWorkflowConfig;