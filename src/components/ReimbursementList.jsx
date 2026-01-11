/**
 * 报销记录列表组件
 *
 * 功能：
 * - 列表展示报销记录
 * - 状态筛选
 * - 查看详情
 * - 操作（提交、撤销、删除草稿）
 */

import React, { useState, useEffect } from 'react';
import {
  EyeOutlined,
  DeleteOutlined,
  SendOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import { Modal } from 'antd';
import api from '../api';

// 状态选项
const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审批' },
  { value: 'approving', label: '审批中' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'cancelled', label: '已撤销' }
];

// 类型映射
const TYPE_LABELS = {
  travel: '差旅费用',
  office: '办公费用',
  entertainment: '招待费用',
  training: '培训费用',
  other: '其他费用'
};

// 状态样式
const STATUS_STYLES = {
  draft: { background: '#f5f5f5', color: '#666' },
  pending: { background: '#fff7e6', color: '#fa8c16' },
  approving: { background: '#e6f7ff', color: '#1890ff' },
  approved: { background: '#f6ffed', color: '#52c41a' },
  rejected: { background: '#fff1f0', color: '#f5222d' },
  cancelled: { background: '#f5f5f5', color: '#999' }
};

const STATUS_LABELS = {
  draft: '草稿',
  pending: '待审批',
  approving: '审批中',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已撤销'
};

const ReimbursementList = ({ user, onViewDetail, onEdit }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // 加载数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        user_id: user?.id,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await api.get('/reimbursement/list', { params });
      if (response.data.success) {
        setRecords(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      console.error('获取报销记录失败:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id, statusFilter, pagination.page]);

  // 提交草稿
  const handleSubmit = async (id) => {
    try {
      const response = await api.post(`/reimbursement/${id}/submit`);
      if (response.data.success) {
        toast.success('提交成功');
        fetchData();
      } else {
        toast.error(response.data.message || '提交失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败');
    }
  };

  // 撤销申请
  const handleCancel = async (id) => {
    Modal.confirm({
      title: '确认撤销',
      content: '确定要撤销此报销申请吗？撤销后可重新编辑提交。',
      okText: '确认撤销',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await api.post(`/reimbursement/${id}/cancel`);
          if (response.data.success) {
            toast.success('已撤销');
            fetchData();
          } else {
            toast.error(response.data.message || '操作失败');
          }
        } catch (error) {
          console.error('撤销失败:', error);
          toast.error('操作失败');
        }
      }
    });
  };

  // 删除草稿
  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此报销草稿吗？删除后无法恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await api.delete(`/reimbursement/${id}`);
          if (response.data.success) {
            toast.success('已删除');
            fetchData();
          } else {
            toast.error(response.data.message || '删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          toast.error('删除失败');
        }
      }
    });
  };

  return (
    <div className="reimbursement-list">
      <style>{`
        .reimbursement-list {
          padding: 24px;
        }
        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .list-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a2e;
        }
        .list-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .filter-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }
        .btn-refresh {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-refresh:hover {
          background: #f5f5f5;
        }
        .list-table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        .table th, .table td {
          padding: 14px 16px;
          text-align: center;
          vertical-align: middle;
          border-bottom: 1px solid #eee;
        }
        .table th {
          background: #f8f9fa;
          font-weight: 600;
          font-size: 13px;
          color: #555;
          text-align: center;
        }
        .table tr:hover td {
          background: #fafafa;
        }
        .reimbursement-no {
          font-family: monospace;
          color: #667eea;
          font-weight: 500;
        }
        .type-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          background: #f0f0f0;
          color: #666;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .amount {
          font-weight: 600;
          color: #1a1a2e;
        }
        .date {
          color: #888;
          font-size: 13px;
        }
        .action-btns {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        .action-btn {
          padding: 6px 10px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .action-btn.view {
          background: #e6f7ff;
          color: #1890ff;
        }
        .action-btn.submit {
          background: #f0f5ff;
          color: #667eea;
        }
        .action-btn.cancel {
          background: #fff7e6;
          color: #fa8c16;
        }
        .action-btn.delete {
          background: #fff1f0;
          color: #f5222d;
        }
        .action-btn:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .pagination {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: #f8f9fa;
        }
        .page-btn {
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .page-info {
          color: #666;
          font-size: 13px;
        }
        .loading-overlay {
          text-align: center;
          padding: 40px;
          color: #999;
        }
      `}</style>

      <div className="list-header">
        <h2 className="list-title">我的报销</h2>
        <div className="list-actions">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button className="btn-refresh" onClick={fetchData} disabled={loading}>
            <ReloadOutlined /> 刷新
          </button>
        </div>
      </div>

      <div className="list-table">
        {loading ? (
          <div className="loading-overlay">加载中...</div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FileTextOutlined /></div>
            <div>暂无报销记录</div>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>类型</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td>{record.title}</td>
                    <td>
                      <span className="type-badge">{TYPE_LABELS[record.type] || record.type}</span>
                    </td>
                    <td>
                      <span className="amount">¥ {parseFloat(record.total_amount).toFixed(2)}</span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={STATUS_STYLES[record.status]}
                      >
                        {STATUS_LABELS[record.status] || record.status}
                      </span>
                    </td>
                    <td>
                      <span className="date">
                        {new Date(record.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="action-btn view"
                          onClick={() => onViewDetail?.(record)}
                        >
                          <EyeOutlined /> 查看
                        </button>

                        {record.status === 'draft' && (
                          <>
                            <button
                              className="action-btn submit"
                              onClick={() => handleSubmit(record.id)}
                            >
                              <SendOutlined /> 提交
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDelete(record.id)}
                            >
                              <DeleteOutlined />
                            </button>
                          </>
                        )}

                        {['pending', 'approving'].includes(record.status) && (
                          <button
                            className="action-btn cancel"
                            onClick={() => handleCancel(record.id)}
                          >
                            <CloseCircleOutlined /> 撤销
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <span className="page-info">
                共 {pagination.total} 条
              </span>
              <button
                className="page-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                上一页
              </button>
              <button
                className="page-btn"
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                下一页
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReimbursementList;
