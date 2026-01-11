/**
 * 报销设置页面
 * 管理报销类型和费用类型
 */
import React, { useState, useEffect } from 'react';
import { 
  Tabs, Table, Button, Input, Modal, Form, 
  Switch, Space, Tag, InputNumber, Tooltip,
  Card, Typography, Divider
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  UnorderedListOutlined, TagOutlined,
  SettingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import api from '../api';

const { Title, Text } = Typography;

const ReimbursementSettings = () => {
  const [activeTab, setActiveTab] = useState('types');

  return (
    <div className="reimbursement-settings" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>报销基础设置</Title>
          <Text type="secondary">自定义管理报销单类型以及费用明细项，以适配不同的业务场景</Text>
        </div>
        <div style={{ padding: '8px 16px', background: '#e6f7ff', borderRadius: '8px', border: '1px solid #91d5ff' }}>
          <Text type="info" style={{ color: '#0050b3' }}>
            <SettingOutlined /> 当前处于系统管理模式
          </Text>
        </div>
      </div>

      <Card 
        bordered={false} 
        style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
        bodyStyle={{ padding: '8px 24px 24px 24px' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'types',
              label: (<span><UnorderedListOutlined /> 报销分类 (一级)</span>),
              children: <div style={{ paddingTop: 16 }}><ReimbursementTypesManager /></div>
            },
            {
              key: 'expenses',
              label: (<span><TagOutlined /> 费用明细 (二级)</span>),
              children: <div style={{ paddingTop: 16 }}><ExpenseTypesManager /></div>
            }
          ]}
        />
      </Card>
    </div>
  );
};

// =============================================================================
// 子组件：报销类型管理
// =============================================================================
const ReimbursementTypesManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reimbursement/types');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ is_active: 1, sort_order: 0 }); // 数据库是 1/0
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: '删除此类型后，旧的报销单将显示原始文本。确定要删除吗？',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/reimbursement/types/${id}`);
          toast.success('删除成功');
          fetchData();
        } catch (error) {
          toast.error('删除失败');
        }
      }
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        is_active: values.is_active ? 1 : 0
      };
      
      if (editingItem) {
        await api.put(`/reimbursement/types/${editingItem.id}`, payload);
        toast.success('更新成功');
      } else {
        await api.post('/reimbursement/types', payload);
        toast.success('添加成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {}
  };

  const columns = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      render: (text) => <Text strong style={{ fontSize: 15 }}>{text}</Text>
    },
    {
      title: '描述说明',
      dataIndex: 'description',
      key: 'description',
      align: 'center',
      render: (text) => text || <Text type="secondary" italic>未填写</Text>
    },
    {
      title: '显示顺序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      align: 'center',
      width: 100,
      sorter: (a, b) => a.sort_order - b.sort_order
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center',
      width: 120,
      render: (active, record) => (
        <Switch 
          checked={!!active} 
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={async (checked) => {
            await api.put(`/reimbursement/types/${record.id}`, { ...record, is_active: checked ? 1 : 0 });
            fetchData();
          }} 
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          style={{ backgroundColor: '#1890ff', borderRadius: 8 }}
        >
          新增报销分类
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        pagination={false}
        bordered={false}
        className="custom-table"
      />
      <Modal
        title={editingItem ? '编辑报销分类' : '新增报销分类'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        destroyOnClose
        centered
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ paddingTop: 12 }}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="如：差旅费、加班餐费" maxLength={20} />
          </Form.Item>
          <Form.Item name="description" label="描述说明">
            <Input.TextArea rows={3} placeholder="简要说明此报销分类的用途" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序权重">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="当前状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// =============================================================================
// 子组件：费用类型管理
// =============================================================================
const ExpenseTypesManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reimbursement/expense-types');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ is_active: 1, sort_order: 0 });
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: '确定要删除此费用类型吗？',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/reimbursement/expense-types/${id}`);
          toast.success('删除成功');
          fetchData();
        } catch (error) {
          toast.error('删除失败');
        }
      }
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        is_active: values.is_active ? 1 : 0
      };
      
      if (editingItem) {
        await api.put(`/reimbursement/expense-types/${editingItem.id}`, payload);
        toast.success('更新成功');
      } else {
        await api.post('/reimbursement/expense-types', payload);
        toast.success('添加成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {}
  };

  const columns = [
    {
      title: '费用项名称',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      render: (text) => <Text strong style={{ fontSize: 15 }}>{text}</Text>
    },
    {
      title: '报销单位',
      dataIndex: 'unit',
      key: 'unit',
      align: 'center',
      render: (text) => text || <Text type="secondary">-</Text>
    },
    {
      title: '显示顺序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      align: 'center',
      width: 100,
      sorter: (a, b) => a.sort_order - b.sort_order
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      align: 'center',
      width: 120,
      render: (active, record) => (
        <Switch 
          checked={!!active} 
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={async (checked) => {
            await api.put(`/reimbursement/expense-types/${record.id}`, { ...record, is_active: checked ? 1 : 0 });
            fetchData();
          }} 
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          style={{ backgroundColor: '#1890ff', borderRadius: 8 }}
        >
          新增费用类型
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        pagination={false}
        bordered={false}
      />
      <Modal
        title={editingItem ? '编辑费用类型' : '新增费用类型'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        destroyOnClose
        centered
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ paddingTop: 12 }}>
          <Form.Item name="name" label="费用项名称" rules={[{ required: true, message: '请输入费用项名称' }]}>
            <Input placeholder="如：火车/高铁票、打车费" />
          </Form.Item>
          <Form.Item name="unit" label="报销单位" extra="如：张、次、天（可选）">
            <Input placeholder="如：张" />
          </Form.Item>
          <Form.Item name="sort_order" label="排序权重">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="当前状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReimbursementSettings;