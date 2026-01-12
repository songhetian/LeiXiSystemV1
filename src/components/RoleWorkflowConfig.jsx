/**
 * 角色报销流程配置页面
 *
 * 功能：
 * - 列出所有角色
 * - 显示每个角色当前使用的审批流程
 * - 允许为每个角色选择或切换审批流程
 */

import React, { useState, useEffect } from 'react';
import {
  TeamOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import api from '../api';

const RoleWorkflowConfig = () => {
  const [roles, setRoles] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    fetchRoles();
    fetchWorkflows();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/approvers/roles/workflows');
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
      toast.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await api.get('/approval-workflow');
      if (response.data.success) {
        setWorkflows(response.data.data);
      }
    } catch (error) {
      console.error('获取流程列表失败:', error);
    }
  };

  const handleEdit = (role) => {
    setEditingRole({
      ...role,
      workflow_id: role.workflow_id || null
    });
  };

  const handleSave = async () => {
    if (!editingRole) return;

    setSaving(true);
    try {
      const payload = {
        role_id: editingRole.id,
        workflow_id: editingRole.workflow_id
      };

      const response = await api.put(`/approvers/roles/${editingRole.id}/workflow`, payload);

      if (response.data.success) {
        toast.success('流程配置保存成功');
        setEditingRole(null);
        fetchRoles();
      } else {
        toast.error(response.data.message || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingRole(null);
  };

  const getWorkflowName = (workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    return workflow ? workflow.name : '未配置';
  };

  const getWorkflowStatus = (workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return 'none';
    return workflow.status === 'active' ? 'active' : 'inactive';
  };

  return (
    <div className="role-workflow-config">
      <style>{styles}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">角色报销流程配置</h1>
          <p className="page-subtitle">为每个角色分配专属的报销审批流程</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { fetchRoles(); fetchWorkflows(); }}>
          <ReloadOutlined /> 刷新
        </button>
      </div>

      <div className="role-grid">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : roles.length === 0 ? (
          <div className="empty">暂无角色数据</div>
        ) : (
          roles.map(role => (
            <div key={role.id} className="role-card">
              <div className="card-header">
                <div className="role-info">
                  <div className="role-icon">
                    <TeamOutlined />
                  </div>
                  <div className="role-detail">
                    <div className="role-name">{role.name}</div>
                    <div className="role-desc">{role.description || '无描述'}</div>
                  </div>
                </div>
                <div className="workflow-status status-${getWorkflowStatus(role.workflow_id)}">
                  {getWorkflowStatus(role.workflow_id) === 'none' && <span>未配置</span>}
                  {getWorkflowStatus(role.workflow_id) === 'active' && <CheckCircleOutlined />}
                  {getWorkflowStatus(role.workflow_id) === 'inactive' && <span>已停用</span>}
                </div>
              </div>

              {editingRole?.id === role.id ? (
                <div className="edit-mode">
                  <div className="form-group">
                    <label className="form-label">选择审批流程</label>
                    <select
                      className="form-select"
                      value={editingRole.workflow_id || ''}
                      onChange={e => setEditingRole({ ...editingRole, workflow_id: e.target.value ? parseInt(e.target.value) : null })}
                    >
                      <option value="">使用默认流程</option>
                      {workflows.map(workflow => (
                        <option key={workflow.id} value={workflow.id}>
                          {workflow.name} {workflow.status === 'inactive' ? '(已停用)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="edit-actions">
                    <button className="btn btn-sm btn-secondary" onClick={handleCancel} disabled={saving}>
                      取消
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                      <SaveOutlined /> {saving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="view-mode">
                  <div className="workflow-info">
                    <div className="info-label">当前流程</div>
                    <div className="info-value">{getWorkflowName(role.workflow_id)}</div>
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={() => handleEdit(role)}>
                    <EditOutlined /> 配置流程
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {workflows.length === 0 && !loading && (
        <div className="no-workflows">
          <SettingOutlined />
          <p>暂无审批流程</p>
          <p className="hint">请先在"流程配置"中创建审批流程</p>
        </div>
      )}
    </div>
  );
};

const styles = `
  .role-workflow-config {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  .page-title {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
  }
  .page-subtitle {
    font-size: 14px;
    color: #888;
    margin: 4px 0 0 0;
  }
  .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-sm {
    padding: 8px 16px;
    font-size: 13px;
  }
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102,126,234,0.4);
  }
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  .btn-secondary {
    background: #f0f0f0;
    color: #555;
  }
  .btn-secondary:hover {
    background: #e0e0e0;
  }
  .role-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
  }
  .role-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: all 0.2s;
  }
  .role-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .role-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .role-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
  }
  .role-name {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a2e;
  }
  .role-desc {
    font-size: 12px;
    color: #888;
    margin-top: 2px;
  }
  .workflow-status {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .workflow-status.status-none {
    color: #999;
  }
  .workflow-status.status-active {
    color: #52c41a;
  }
  .workflow-status.status-inactive {
    color: #fa8c16;
  }
  .view-mode {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }
  .workflow-info {
    flex: 1;
  }
  .info-label {
    font-size: 12px;
    color: #888;
    margin-bottom: 4px;
  }
  .info-value {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a2e;
  }
  .edit-mode {
    padding-top: 16px;
    border-top: 1px solid #eee;
  }
  .form-group {
    margin-bottom: 12px;
  }
  .form-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #555;
    margin-bottom: 6px;
  }
  .form-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
  }
  .form-select:focus {
    outline: none;
    border-color: #667eea;
  }
  .edit-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .loading, .empty {
    text-align: center;
    padding: 60px;
    color: #999;
    grid-column: 1 / -1;
    background: white;
    border-radius: 12px;
  }
  .no-workflows {
    text-align: center;
    padding: 60px;
    color: #999;
    background: white;
    border-radius: 12px;
    margin-top: 20px;
  }
  .no-workflows svg {
    font-size: 48px;
    margin-bottom: 16px;
    color: #ddd;
  }
  .no-workflows p {
    margin: 8px 0;
  }
  .no-workflows .hint {
    font-size: 13px;
    color: #aaa;
  }
`;

export default RoleWorkflowConfig;