import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form,
  InputNumber, message, Card, Typography, Space, Tag
} from 'antd';
import {
  SearchOutlined, ExportOutlined, HistoryOutlined,
  ShoppingCartOutlined, InboxOutlined
} from '@ant-design/icons';
import api from '../../../api';
import dayjs from 'dayjs';
import Breadcrumb from '../../../components/Breadcrumb';

const { Text, Title } = Typography;

const InventoryReceive = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchItems();
  }, [keyword]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inventory/items?keyword=${keyword}`);
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      message.error('加载库存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (values) => {
    try {
      const payload = {
        item_id: currentItem.id,
        quantity: values.quantity,
        purpose: values.purpose
      };
      const res = await api.post('/inventory/use', payload);
      if (res.data.success) {
        message.success('领用成功');
        setIsReceiveModalOpen(false);
        form.resetFields();
        fetchItems();
      }
    } catch (err) {
      message.error(err.response?.data?.message || '领用失败');
    }
  };

  const columns = [
    {
      title: '物品名称',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      render: (text, record) => (
        <div className="flex flex-col items-center">
          <Text strong className="text-slate-700">{text}</Text>
          <Tag color="blue" className="mt-1 border-0 rounded text-[10px]">{record.category}</Tag>
        </div>
      )
    },
    {
      title: '规格单位',
      dataIndex: 'unit',
      key: 'unit',
      align: 'center',
      render: text => <Text className="text-gray-500">{text || '个'}</Text>
    },
    {
      title: '当前库存',
      dataIndex: 'current_stock',
      key: 'current_stock',
      align: 'center',
      render: (text, record) => (
        <div className="flex flex-col items-center">
          <span className={`text-lg font-mono font-bold ${text <= (record.min_stock_alert || 5) ? 'text-red-500' : 'text-green-600'}`}>
            {text}
          </span>
          {text <= (record.min_stock_alert || 5) && (
            <Tag color="error" className="mt-1 border-0 rounded text-[10px]">库存不足</Tag>
          )}
        </div>
      )
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      align: 'center',
      render: text => <Text className="text-gray-400 text-xs italic">{text || '-'}</Text>
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Button
          icon={<ExportOutlined />}
          disabled={record.current_stock <= 0}
          onClick={() => {
            setCurrentItem(record);
            setIsReceiveModalOpen(true);
          }}
          className="bg-green-500 hover:bg-green-600 text-white rounded-[10px] h-9 px-5 font-bold shadow-md shadow-green-500/10 hover:shadow-green-500/20 transition-all border-none"
        >
          领取
        </Button>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <Breadcrumb items={['首页', '库存管理', '物品领取']} className="mb-6" />

      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
          <h1 className="text-3xl font-[900] text-gray-800 mb-2">物品领取</h1>
          <p className="text-gray-400 text-base mb-6 font-medium">申领办公用品、耗材及日常领用登记</p>
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="搜索物品名称/分类..."
            className="w-full max-w-md h-12 rounded-2xl bg-gray-50 border-none px-6 text-base shadow-sm"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            allowClear
          />
        </div>

        <Card
          bordered={false}
          className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden"
          bodyStyle={{ padding: 0 }}
        >
          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: total => <span className="text-gray-400 font-medium">共 {total} 种物品</span>,
              position: ['bottomCenter'],
              className: 'my-6'
            }}
            className="custom-receive-table"
          />
        </Card>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 border-b pb-4 mb-4">
            <ShoppingCartOutlined className="text-blue-500 text-xl" />
            <span className="text-lg font-bold">领用申请: {currentItem?.name}</span>
          </div>
        }
        open={isReceiveModalOpen}
        onCancel={() => setIsReceiveModalOpen(false)}
        onOk={() => form.submit()}
        okText="确认领取物品"
        cancelText="稍后领取"
        okButtonProps={{
          className: 'bg-blue-600 hover:bg-blue-700 rounded-xl h-11 px-8 font-bold border-none shadow-lg shadow-blue-500/20',
          style: { height: 44 }
        }}
        cancelButtonProps={{
          className: 'rounded-xl h-11 px-8 font-bold border-gray-200'
        }}
        centered
        width={400}
        closeIcon={false}
      >
        <Form form={form} layout="vertical" onFinish={handleReceive}>
          <div className="bg-blue-50 p-4 rounded-xl mb-6">
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-medium">可领取余额</span>
              <span className="text-blue-700 font-bold text-xl font-mono">{currentItem?.current_stock} {currentItem?.unit || '个'}</span>
            </div>
          </div>

          <Form.Item
            name="quantity"
            label={<span className="font-bold text-slate-700">领取数量</span>}
            rules={[
              { required: true, message: '请输入领取数量' },
              { type: 'number', max: currentItem?.current_stock, message: '超过当前库存' }
            ]}
          >
            <InputNumber min={1} className="w-full h-11 rounded-xl flex items-center" placeholder="请输入数量" />
          </Form.Item>

          <Form.Item
            name="purpose"
            label={<span className="font-bold text-slate-700">领用用途</span>}
            rules={[{ required: true, message: '请填写用途' }]}
          >
            <Input.TextArea rows={3} className="rounded-xl" placeholder="例如：新员工办公入职领用" />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx="true">{`
        .custom-receive-table .ant-table-thead > tr > th {
          background: #fcfcfc;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          font-size: 12px;
          padding-top: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f8fafc;
        }
        .custom-receive-table .ant-table-tbody > tr > td {
          padding-top: 20px;
          padding-bottom: 20px;
        }
        .custom-receive-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
      `}</style>
    </div>
  );
};

export default InventoryReceive;
