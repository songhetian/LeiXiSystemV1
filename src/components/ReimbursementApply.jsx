/**
 * 报销申请组件
 *
 * 功能：
 * - 填写报销信息（标题、类型、备注）
 * - 添加费用明细（类型、金额、日期、说明）
 * - 上传发票/附件
 * - 保存草稿和提交申请
 * - 支持自定义报销类型和费用类型
 */

import React, { useState, useEffect } from 'react';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  SaveOutlined,
  SendOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import api from '../api';
import { getAttachmentUrl } from '../utils/fileUtils';

const ReimbursementApply = ({ user, onSuccess }) => {
  // 动态配置状态
  const [reimbursementTypes, setReimbursementTypes] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    remark: ''
  });

  // 费用明细
  const [items, setItems] = useState([
    { item_type: '', amount: '', expense_date: '', description: '' }
  ]);

  // 附件
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  // 编辑模式（用于编辑草稿）
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  // 获取配置数据
  const fetchConfigs = async () => {
    try {
      const [resTypes, resExpenses] = await Promise.all([
        api.get('/reimbursement/types'),
        api.get('/reimbursement/expense-types')
      ]);

      if (resTypes.data.success) {
        const types = resTypes.data.data.filter(t => t.is_active);
        setReimbursementTypes(types);
        // 设置默认类型
        if (types.length > 0 && !formData.type) {
          setFormData(prev => ({ ...prev, type: types[0].code || types[0].name }));
        }
      }

      if (resExpenses.data.success) {
        setExpenseTypes(resExpenses.data.data.filter(t => t.is_active));
      }
    } catch (error) {
      console.error('获取配置失败:', error);
      // 失败时不影响基本功能，只是列表可能为空或使用兜底逻辑
    }
  };

  // 计算总金额
  const totalAmount = items.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    return sum + amount;
  }, 0);

  // 添加费用明细
  const addItem = () => {
    setItems([...items, { item_type: '', amount: '', expense_date: '', description: '' }]);
  };

  // 删除费用明细
  const removeItem = (index) => {
    if (items.length === 1) {
      toast.warning('至少需要一条费用明细');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // 更新费用明细
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // 文件上传
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of files) {
      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`文件 ${file.name} 格式不支持，只支持 JPG、PNG、PDF`);
        continue;
      }

      // 检查文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 超过10MB限制`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          setAttachments(prev => [...prev, {
            id: Date.now(),
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: response.data.url,
            isNew: true
          }]);
        }
      } catch (error) {
        console.error('上传失败:', error);
        toast.error(`文件 ${file.name} 上传失败`);
      }
    }

    setUploading(false);
    event.target.value = '';
  };

  // 删除附件
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // 预览附件
  const previewAttachment = (attachment) => {
    const url = getAttachmentUrl(attachment.file_url);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('无法生成预览地址');
    }
  };

  // 表单验证
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('请填写报销标题');
      return false;
    }

    if (!formData.type) {
      toast.error('请选择报销类型');
      return false;
    }

    if (items.length === 0) {
      toast.error('请至少添加一条费用明细');
      return false;
    }

    if (attachments.length === 0) {
      toast.error('请上传发票或相关附件图片');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.item_type) {
        toast.error(`第 ${i + 1} 条明细：请选择费用类型`);
        return false;
      }
      if (!item.amount || parseFloat(item.amount) <= 0) {
        toast.error(`第 ${i + 1} 条明细：请填写有效金额`);
        return false;
      }
    }

    return true;
  };

  // 保存草稿
  const saveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('请至少填写报销标题');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        user_id: user?.id,
        employee_id: user?.employee_id,
        department_id: user?.department_id,
        items: items.filter(item => item.item_type && item.amount),
        attachments: attachments
      };

      let response;
      if (editingId) {
        response = await api.put(`/reimbursement/${editingId}`, payload);
      } else {
        response = await api.post('/reimbursement/apply', payload);
        if (response.data.success) {
          setEditingId(response.data.data.id);
        }
      }

      if (response.data.success) {
        toast.success('草稿保存成功');
      } else {
        toast.error(response.data.message || '保存失败');
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 提交申请
  const submitApplication = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // 先保存/更新
      const payload = {
        ...formData,
        user_id: user?.id,
        employee_id: user?.employee_id,
        department_id: user?.department_id,
        items,
        attachments: attachments
      };

      let reimbursementId = editingId;

      if (editingId) {
        await api.put(`/reimbursement/${editingId}`, payload);
      } else {
        const createResponse = await api.post('/reimbursement/apply', payload);
        if (createResponse.data.success) {
          reimbursementId = createResponse.data.data.id;
        } else {
          throw new Error(createResponse.data.message);
        }
      }

      // 提交审批
      const submitResponse = await api.post(`/reimbursement/${reimbursementId}/submit`);

      if (submitResponse.data.success) {
        toast.success('报销申请提交成功');
        // 重置表单
        setFormData({ title: '', type: '', remark: '' });
        setItems([{ item_type: '', amount: '', expense_date: '', description: '' }]);
        setAttachments([]);
        setEditingId(null);
        // 重新获取一下默认值
        if (reimbursementTypes.length > 0) {
          setFormData(prev => ({ ...prev, type: reimbursementTypes[0].code || reimbursementTypes[0].name }));
        }
        onSuccess?.();
      } else {
        toast.error(submitResponse.data.message || '提交失败');
      }
    } catch (error) {
      console.error('提交申请失败:', error);
      toast.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reimbursement-apply">
      <style>{`
        .reimbursement-apply {
          padding: 32px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .section {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid #f3f4f6;
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 18px;
          background: #667eea;
          border-radius: 2px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        .form-label.required::after {
          content: '*';
          color: #ef4444;
          margin-left: 4px;
        }
        .form-input, .form-select, .form-textarea {
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 15px;
          color: #111827;
          transition: all 0.2s;
          background: #fff;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .form-textarea {
          min-height: 100px;
          resize: vertical;
          line-height: 1.5;
        }
        .items-header {
          display: grid;
          grid-template-columns: 180px 140px 160px 1fr 50px;
          gap: 16px;
          padding: 0 16px 12px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .item-row {
          display: grid;
          grid-template-columns: 180px 140px 160px 1fr 50px;
          gap: 16px;
          align-items: flex-start;
          padding: 20px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 16px;
          transition: all 0.2s;
        }
        .item-row:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .btn-remove-item {
          width: 36px;
          height: 36px;
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #ef4444;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          margin-top: 4px;
        }
        .btn-remove-item:hover {
          background: #fee2e2;
          color: #dc2626;
        }
        .btn-add-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 16px;
          border: 2px dashed #e5e7eb;
          background: transparent;
          color: #667eea;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.2s;
          margin-bottom: 24px;
        }
        .btn-add-item:hover {
          border-color: #667eea;
          background: #f5f7ff;
        }
        .total-row {
          display: flex;
          justify-content: flex-end;
          align-items: baseline;
          gap: 12px;
          padding: 20px 0;
          margin-top: 12px;
          border-top: 2px solid #f3f4f6;
        }
        .total-label {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }
        .total-amount {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        }
        .upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 16px;
          padding: 40px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: block;
          background: #fdfdfd;
        }
        .upload-area:hover {
          border-color: #667eea;
          background: #f5f7ff;
        }
        .upload-icon {
          font-size: 40px;
          color: #9ca3af;
          margin-bottom: 12px;
        }
        .upload-text {
          color: #374151;
          font-size: 16px;
          font-weight: 600;
        }
        .upload-hint {
          color: #6b7280;
          font-size: 13px;
          margin-top: 8px;
        }
        .attachment-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }
        .attachment-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
        }
        .attachment-icon {
          font-size: 20px;
          color: #667eea;
        }
        .attachment-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #374151;
          font-weight: 500;
        }
        .attachment-actions {
          display: flex;
          gap: 4px;
        }
        .attachment-btn {
          width: 30px;
          height: 30px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .attachment-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .attachment-btn.delete:hover {
          background: #fef2f2;
          color: #ef4444;
        }
        .action-bar {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding: 24px 0;
          margin-top: 8px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 32px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: #fff;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        .btn-primary {
          background: #667eea;
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          background: #5a6fd1;
          box-shadow: 0 4px 12px rgba(102,126,234,0.3);
          transform: translateY(-1px);
        }
      `}</style>

      {/* 基本信息 */}
      <div className="section">
        <h3 className="section-title">基本信息</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label required">报销标题</label>
            <input
              type="text"
              className="form-input"
              placeholder="如：12月份差旅费报销"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label required">报销类型</label>
            <select
              className="form-select"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="" disabled>请选择</option>
              {reimbursementTypes.map(t => (
                <option key={t.id} value={t.code || t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">备注说明</label>
          <textarea
            className="form-textarea"
            placeholder="请在此输入补充说明..."
            value={formData.remark}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
          />
        </div>
      </div>

      {/* 费用明细 */}
      <div className="section">
        <h3 className="section-title">费用明细</h3>

        <div className="items-header">
          <div>费用类型</div>
          <div>金额 (元)</div>
          <div>发生日期</div>
          <div>费用说明</div>
          <div></div>
        </div>

        {items.map((item, index) => (
          <div key={index} className="item-row">
            <select
              className="form-select"
              value={item.item_type}
              onChange={(e) => updateItem(index, 'item_type', e.target.value)}
            >
              <option value="">选择类型</option>
              {expenseTypes.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
            <input
              type="number"
              className="form-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={item.amount}
              onChange={(e) => updateItem(index, 'amount', e.target.value)}
            />
            <input
              type="date"
              className="form-input"
              value={item.expense_date}
              onChange={(e) => updateItem(index, 'expense_date', e.target.value)}
            />
            <input
              type="text"
              className="form-input"
              placeholder="请输入用途说明"
              value={item.description}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
            />
            <button className="btn-remove-item" onClick={() => removeItem(index)} title="移除此项">
              <DeleteOutlined />
            </button>
          </div>
        ))}

        <button className="btn-add-item" onClick={addItem}>
          <PlusOutlined /> 添加一条费用明细
        </button>

        <div className="total-row">
          <span className="total-label">报销总金额合计</span>
          <span className="total-amount">¥ {totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* 发票附件 */}
      <div className="section">
        <h3 className="section-title">发票/附件</h3>

        <label className="upload-area">
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <div className="upload-icon"><UploadOutlined /></div>
          <div className="upload-text">
            {uploading ? '上传中...' : '点击或拖拽文件到此处上传'}
          </div>
          <div className="upload-hint">支持 JPG、PNG、PDF 格式，单个文件不超过 10MB</div>
        </label>

        {attachments.length > 0 && (
          <div className="attachment-list">
            {attachments.map((att, index) => (
              <div key={att.id || index} className="attachment-item">
                <span className="attachment-icon">
                  {att.file_type?.includes('pdf') ? <FilePdfOutlined /> : <FileImageOutlined />}
                </span>
                <span className="attachment-name" title={att.file_name}>{att.file_name}</span>
                <div className="attachment-actions">
                  <button className="attachment-btn" onClick={() => previewAttachment(att)}>
                    <EyeOutlined />
                  </button>
                  <button className="attachment-btn delete" onClick={() => removeAttachment(index)}>
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="action-bar">
        <button className="btn btn-secondary" onClick={saveDraft} disabled={saving}>
          <SaveOutlined /> {saving ? '保存中...' : '保存草稿'}
        </button>
        <button className="btn btn-primary" onClick={submitApplication} disabled={submitting}>
          <SendOutlined /> {submitting ? '提交中...' : '提交申请'}
        </button>
      </div>
    </div>
  );
};

export default ReimbursementApply;