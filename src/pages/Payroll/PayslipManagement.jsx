import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/apiConfig';
import {
  BanknotesIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Upload, Tag, InputNumber } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function PayslipManagement() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({ month: null, department: null, status: null, keyword: '' });
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPayslips();
    fetchDepartments();
    fetchEmployees();
  }, [pagination.page, filters]);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/api/admin/payslips?${queryString}` : '/api/admin/payslips';
      
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(url), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPayslips(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.total
        }));
      }
    } catch (error) {
      console.error('获取工资条列表失败:', error);
      toast.error('获取工资条列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/departments/list'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error('获取部门列表失败:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/employees'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setEmployees(result.data);
      }
    } catch (error) {
      console.error('获取员工列表失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingPayslip(null);
    form.resetFields();
    setShowModal(true);
  };

  const handleEdit = (record) => {
    setEditingPayslip(record);
    form.setFieldsValue({
      ...record,
      salary_month: record.salary_month ? dayjs(record.salary_month) : null,
      payment_date: record.payment_date ? dayjs(record.payment_date) : null
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条工资条吗？',
      onOk: async () => {
        try {
          const response = await axios.delete(getApiUrl(`/api/admin/payslips/${id}`));
          if (response.data.success) {
            toast.success('删除成功');
            fetchPayslips();
          }
        } catch (error) {
          console.error('删除失败:', error);
          toast.error(error.response?.data?.message || '删除失败');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        salary_month: values.salary_month ? values.salary_month.format('YYYY-MM-01') : null,
        payment_date: values.payment_date ? values.payment_date.format('YYYY-MM-DD') : null
      };

      let response;
      if (editingPayslip) {
        response = await axios.put(getApiUrl(`/api/admin/payslips/${editingPayslip.id}`), data);
      } else {
        response = await axios.post(getApiUrl('/api/admin/payslips'), data);
      }

      if (response.data.success) {
        toast.success(editingPayslip ? '更新成功' : '创建成功');
        setShowModal(false);
        form.resetFields();
        fetchPayslips();
      }
    } catch (error) {
      console.error('保存失败:', error);
      toast.error(error.response?.data?.message || '保存失败');
    }
  };

  const handleBatchSend = async () => {
    if (selectedRowKeys.length === 0) {
      toast.error('请选择要发放的工资条');
      return;
    }

    Modal.confirm({
      title: '确认发放',
      content: `确定要发放选中的 ${selectedRowKeys.length} 条工资条吗？`,
      onOk: async () => {
        try {
          const response = await axios.post(getApiUrl('/api/admin/payslips/batch-send'), {
            payslip_ids: selectedRowKeys
          });

          if (response.data.success) {
            toast.success(response.data.message);
            setSelectedRowKeys([]);
            fetchPayslips();
          }
        } catch (error) {
          console.error('批量发放失败:', error);
          toast.error('批量发放失败');
        }
      }
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/admin/payslips/import-template'), {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payslip_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('模板下载成功');
    } catch (error) {
      console.error('下载模板失败:', error);
      toast.error('下载模板失败');
    }
  };

  const handleImport = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(getApiUrl('/api/admin/payslips/import'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchPayslips();
        
        if (response.data.data.errors && response.data.data.errors.length > 0) {
          Modal.warning({
            title: '导入结果',
            content: (
              <div>
                <p>成功: {response.data.data.success} 条</p>
                <p>失败: {response.data.data.failed} 条</p>
                {response.data.data.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">错误详情：</p>
                    <ul className="max-h-40 overflow-y-auto">
                      {response.data.data.errors.slice(0, 10).map((err, idx) => (
                        <li key={idx} className="text-red-500 text-sm">
                          第{err.row}行: {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ),
            width: 500
          });
        }
      }
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败');
    }

    return false;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      draft: { color: 'default', text: '草稿' },
      sent: { color: 'processing', text: '已发放' },
      viewed: { color: 'warning', text: '已查看' },
      confirmed: { color: 'success', text: '已确认' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '工资条编号',
      dataIndex: 'payslip_no',
      key: 'payslip_no',
      width: 150
    },
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      key: 'employee_name'
    },
    {
      title: '工号',
      dataIndex: 'employee_no',
      key: 'employee_no'
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name'
    },
    {
      title: '工资月份',
      dataIndex: 'salary_month',
      key: 'salary_month',
      render: (text) => dayjs(text).format('YYYY-MM')
    },
    {
      title: '实发工资',
      dataIndex: 'net_salary',
      key: 'net_salary',
      render: (text) => `¥${parseFloat(text).toFixed(2)}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="link"
            size="small"
            icon={<PencilIcon className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<TrashIcon className="w-4 h-4" />}
            onClick={() => handleDelete(record.id)}
            disabled={record.status === 'confirmed'}
          >
            删除
          </Button>
        </div>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    getCheckboxProps: (record) => ({
      disabled: record.status !== 'draft'
    })
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BanknotesIcon className="w-8 h-8 text-blue-500" />
            工资条管理
          </h1>
          <p className="text-gray-500 mt-1">管理员工工资条信息</p>
        </div>
        <div className="flex gap-2">
          <Button
            icon={<DocumentArrowDownIcon className="w-4 h-4" />}
            onClick={handleDownloadTemplate}
          >
            下载模板
          </Button>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleImport}
          >
            <Button icon={<DocumentArrowUpIcon className="w-4 h-4" />}>
              导入工资条
            </Button>
          </Upload>
          <Button
            type="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={handleAdd}
          >
            新增工资条
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex gap-4 flex-wrap">
          <DatePicker
            picker="month"
            placeholder="选择月份"
            onChange={(date) => setFilters(prev => ({ ...prev, month: date ? date.format('YYYY-MM') : null }))}
          />
          <Select
            placeholder="选择部门"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
            options={departments.map(d => ({ label: d.name, value: d.id }))}
          />
          <Select
            placeholder="选择状态"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            options={[
              { label: '草稿', value: 'draft' },
              { label: '已发放', value: 'sent' },
              { label: '已查看', value: 'viewed' },
              { label: '已确认', value: 'confirmed' }
            ]}
          />
          <Input
            placeholder="搜索员工姓名/工号"
            style={{ width: 200 }}
            onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
          />
          <Button type="primary" onClick={fetchPayslips}>
            查询
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button
              type="primary"
              icon={<PaperAirplaneIcon className="w-4 h-4" />}
              onClick={handleBatchSend}
            >
              批量发放 ({selectedRowKeys.length})
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={payslips}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page) => setPagination(prev => ({ ...prev, page })),
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </div>

      <Modal
        title={editingPayslip ? '编辑工资条' : '新增工资条'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="employee_id"
              label="员工"
              rules={[{ required: true, message: '请选择员工' }]}
            >
              <Select
                showSearch
                placeholder="请选择员工"
                optionFilterProp="children"
                disabled={!!editingPayslip}
                options={employees.map(e => ({ label: `${e.real_name}`, value: e.id }))}
              />
            </Form.Item>

            <Form.Item
              name="salary_month"
              label="工资月份"
              rules={[{ required: true, message: '请选择工资月份' }]}
            >
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="payment_date" label="发放日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="attendance_days" label="出勤天数" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="late_count" label="迟到次数" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="early_leave_count" label="早退次数" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="leave_days" label="请假天数" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="overtime_hours" label="加班时长" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="absent_days" label="缺勤天数" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="basic_salary" label="基本工资" initialValue={0}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="position_salary" label="岗位工资" initialValue={0}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="performance_bonus" label="绩效奖金" initialValue={0}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="overtime_pay" label="加班费" initialValue={0}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="allowances" label="各类补贴" initialValue={0}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="deductions" label="各类扣款" initialValue={0}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="social_security" label="社保扣款" initialValue={0}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="housing_fund" label="公积金扣款" initialValue={0}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="tax" label="个人所得税" initialValue={0}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="other_deductions" label="其他扣款" initialValue={0}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => {
                setShowModal(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPayslip ? '更新' : '创建'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
