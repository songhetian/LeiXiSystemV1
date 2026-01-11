/**
 * 报销详情组件
 *
 * 功能：
 * - 展示报销单详情
 * - 费用明细列表
 * - 附件预览
 * - 审批进度时间线
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import api from '../api';
import { getAttachmentUrl } from '../utils/fileUtils';

const TYPE_LABELS = {
  travel: '差旅费用',
  office: '办公费用',
  entertainment: '招待费用',
  training: '培训费用',
  other: '其他费用'
};

const EXPENSE_TYPE_LABELS = {
  transportation: '交通费',
  accommodation: '住宿费',
  meals: '餐饮费',
  communication: '通讯费',
  office_supplies: '办公用品',
  printing: '打印复印',
  gift: '礼品费',
  venue: '场地费',
  other: '其他'
};

const STATUS_LABELS = {
  draft: '草稿',
  pending: '待审批',
  approving: '审批中',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已撤销'
};

const STATUS_COLORS = {
  draft: '#999',
  pending: '#fa8c16',
  approving: '#1890ff',
  approved: '#52c41a',
  rejected: '#f5222d',
  cancelled: '#999'
};

const ReimbursementDetail = ({ reimbursementId, onBack }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reimbursementId) {
      fetchDetail();
    }
  }, [reimbursementId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reimbursement/${reimbursementId}`);
      if (response.data.success) {
        setDetail(response.data.data);
      } else {
        toast.error('获取详情失败');
      }
    } catch (error) {
      console.error('获取报销详情失败:', error);
      toast.error('获取详情失败');
    } finally {
      setLoading(false);
    }
  };

  const previewAttachment = (attachment) => {
    const url = getAttachmentUrl(attachment.file_url);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('无法生成预览地址');
    }
  };

  if (loading) {
    return (
      <div className="reimbursement-detail loading">
        <style>{detailStyles}</style>
        <div className="loading-text">加载中...</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="reimbursement-detail">
        <style>{detailStyles}</style>
        <div className="error-text">报销单不存在</div>
      </div>
    );
  }

  return (
    <div className="reimbursement-detail">
      <style>{detailStyles}</style>

      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeftOutlined /> 返回
        </button>
        <div className="header-info">
          <h1 className="detail-title">{detail.title}</h1>
          <span className="detail-no">{detail.reimbursement_no}</span>
        </div>
        <div
          className="status-badge"
          style={{ background: STATUS_COLORS[detail.status] }}
        >
          {STATUS_LABELS[detail.status]}
        </div>
      </div>

      <div className="detail-content">
        {/* 基本信息 */}
        <div className="detail-section">
          <h3 className="section-title">基本信息</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">申请人</span>
              <span className="info-value">{detail.applicant_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">部门</span>
              <span className="info-value">{detail.department_name || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">报销类型</span>
              <span className="info-value">{TYPE_LABELS[detail.type] || detail.type}</span>
            </div>
            <div className="info-item">
              <span className="info-label">匹配审批流程</span>
              <span className="info-value text-blue-600 font-semibold">{detail.workflow_name || '自动匹配中'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">报销金额</span>
              <span className="info-value amount">¥{parseFloat(detail.total_amount).toFixed(2)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">创建时间</span>
              <span className="info-value">{new Date(detail.created_at).toLocaleString()}</span>
            </div>
            {detail.submitted_at && (
              <div className="info-item">
                <span className="info-label">提交时间</span>
                <span className="info-value">{new Date(detail.submitted_at).toLocaleString()}</span>
              </div>
            )}
          </div>
          {detail.remark && (
            <div className="remark-box">
              <span className="remark-label">备注说明</span>
              <p className="remark-text">{detail.remark}</p>
            </div>
          )}
        </div>

        {/* 费用明细 */}
        <div className="detail-section">
          <h3 className="section-title">费用明细</h3>
          {detail.items && detail.items.length > 0 ? (
            <table className="items-table">
              <thead>
                <tr>
                  <th>费用类型</th>
                  <th>金额</th>
                  <th>发生日期</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{EXPENSE_TYPE_LABELS[item.item_type] || item.item_type}</td>
                    <td className="amount-cell">¥{parseFloat(item.amount).toFixed(2)}</td>
                    <td>{item.expense_date || '-'}</td>
                    <td>{item.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>合计</td>
                  <td className="amount-cell total">¥{parseFloat(detail.total_amount).toFixed(2)}</td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="empty-text">暂无费用明细</div>
          )}
        </div>

        {/* 附件 */}
        <div className="detail-section">
          <h3 className="section-title">发票/附件</h3>
          {detail.attachments && detail.attachments.length > 0 ? (
            <div className="attachment-grid">
              {detail.attachments.map((att, index) => {
                const isImage = att.file_type?.includes('image');
                const thumbnailUrl = isImage ? getAttachmentUrl(att.file_url) : null;
                
                return (
                  <div key={att.id || index} className="attachment-card" onClick={() => previewAttachment(att)}>
                    <div className="attachment-preview">
                      {isImage ? (
                        <img src={thumbnailUrl} alt={att.file_name} className="thumbnail" />
                      ) : (
                        <div className="attachment-icon">
                          {att.file_type?.includes('pdf') ? <FilePdfOutlined /> : <FileImageOutlined />}
                        </div>
                      )}
                    </div>
                    <div className="attachment-name">{att.file_name}</div>
                    <div className="attachment-action"><EyeOutlined /> 预览</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-text">暂无附件</div>
          )}
        </div>

        {/* 审批进度 */}
        <div className="detail-section">
          <h3 className="section-title">审批进度</h3>
          {detail.approval?.records && detail.approval.records.length > 0 ? (
            <div className="timeline">
              {detail.approval.records.map((record, index) => (
                <div key={record.id || index} className={`timeline-item ${record.action}`}>
                  <div className="timeline-icon">
                    {record.action === 'approve' && <CheckCircleOutlined />}
                    {record.action === 'reject' && <CloseCircleOutlined />}
                    {record.action === 'return' && <ClockCircleOutlined />}
                    {!['approve', 'reject', 'return'].includes(record.action) && <UserOutlined />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-user">{record.approver_name}</span>
                      <span className="timeline-action">
                        {record.action === 'approve' && '审批通过'}
                        {record.action === 'reject' && '驳回'}
                        {record.action === 'return' && '退回修改'}
                        {record.action === 'delegate' && '转交'}
                      </span>
                    </div>
                    {record.opinion && (
                      <div className="timeline-opinion">{record.opinion}</div>
                    )}
                    <div className="timeline-time">
                      {new Date(record.approved_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-text">暂无审批记录</div>
          )}

          {/* 当前节点 */}
          {detail.status === 'approving' && detail.approval?.currentNodeId && (
            <div className="current-node">
              当前正在等待审批...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const detailStyles = `
  .reimbursement-detail {
    padding: 24px;
    max-width: 900px;
    margin: 0 auto;
  }
  .reimbursement-detail.loading {
    text-align: center;
    padding: 100px;
  }
  .loading-text, .error-text {
    color: #999;
    font-size: 16px;
  }
  .detail-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
  }
  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    font-size: 14px;
    color: #666;
  }
  .back-btn:hover {
    background: #f5f5f5;
  }
  .header-info {
    flex: 1;
  }
  .detail-title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 4px 0;
  }
  .detail-no {
    font-family: monospace;
    color: #667eea;
    font-size: 14px;
  }
  .status-badge {
    padding: 6px 16px;
    border-radius: 16px;
    color: white;
    font-size: 14px;
    font-weight: 500;
  }
  .detail-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .detail-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
  }
  .info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .info-label {
    font-size: 12px;
    color: #888;
  }
  .info-value {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
  .info-value.amount {
    font-size: 18px;
    color: #667eea;
    font-weight: 700;
  }
  .remark-box {
    margin-top: 16px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  .remark-label {
    font-size: 12px;
    color: #888;
    display: block;
    margin-bottom: 6px;
  }
  .remark-text {
    margin: 0;
    font-size: 14px;
    color: #555;
    line-height: 1.6;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
  }
  .items-table th, .items-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  .items-table th {
    background: #f8f9fa;
    font-weight: 600;
    font-size: 13px;
    color: #555;
  }
  .items-table .amount-cell {
    font-weight: 600;
    color: #1a1a2e;
  }
  .items-table tfoot td {
    font-weight: 600;
    background: #f8f9fa;
  }
  .items-table .total {
    color: #667eea;
    font-size: 16px;
  }
  .empty-text {
    color: #999;
    text-align: center;
    padding: 20px;
  }
  .attachment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  .attachment-card {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .attachment-card:hover {
    border-color: #667eea;
    background: rgba(102,126,234,0.02);
  }
  .attachment-icon {
    font-size: 32px;
    color: #667eea;
    margin-bottom: 8px;
  }
  .attachment-preview {
    width: 100%;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    overflow: hidden;
    background: #fdfdfd;
    border-radius: 4px;
  }
  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  .attachment-card:hover .thumbnail {
    transform: scale(1.1);
  }
  .attachment-name {
    font-size: 13px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 8px;
  }
  .attachment-action {
    font-size: 12px;
    color: #1890ff;
  }
  .timeline {
    position: relative;
    padding-left: 30px;
  }
  .timeline::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #eee;
  }
  .timeline-item {
    position: relative;
    padding-bottom: 24px;
  }
  .timeline-item:last-child {
    padding-bottom: 0;
  }
  .timeline-icon {
    position: absolute;
    left: -30px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    background: white;
    border: 2px solid #ddd;
    color: #999;
  }
  .timeline-item.approve .timeline-icon {
    border-color: #52c41a;
    color: #52c41a;
  }
  .timeline-item.reject .timeline-icon {
    border-color: #f5222d;
    color: #f5222d;
  }
  .timeline-item.return .timeline-icon {
    border-color: #fa8c16;
    color: #fa8c16;
  }
  .timeline-content {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 12px 16px;
  }
  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .timeline-user {
    font-weight: 600;
    color: #333;
  }
  .timeline-action {
    font-size: 13px;
    padding: 2px 8px;
    border-radius: 4px;
  }
  .timeline-item.approve .timeline-action {
    background: #f6ffed;
    color: #52c41a;
  }
  .timeline-item.reject .timeline-action {
    background: #fff1f0;
    color: #f5222d;
  }
  .timeline-item.return .timeline-action {
    background: #fff7e6;
    color: #fa8c16;
  }
  .timeline-opinion {
    font-size: 14px;
    color: #555;
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .timeline-time {
    font-size: 12px;
    color: #999;
  }
  .current-node {
    text-align: center;
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    margin-top: 16px;
  }
`;

export default ReimbursementDetail;
