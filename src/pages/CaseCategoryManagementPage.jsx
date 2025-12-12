import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner';
import qualityAPI from '../api/qualityAPI.js';
import Modal from '../components/Modal';

const CaseCategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    parent_id: null,
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await qualityAPI.getCaseCategories({ includeInactive: true });
      setCategories(response.data.flatData || []);
    } catch (error) {
      toast.error('加载分类列表失败');
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryForm({
      ...categoryForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const openCreateModal = () => {
    setCurrentCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      parent_id: null,
      sort_order: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setCurrentCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...categoryForm,
        sort_order: parseInt(categoryForm.sort_order) || 0,
        parent_id: categoryForm.parent_id || null,
      };

      if (currentCategory) {
        await qualityAPI.updateCaseCategory(currentCategory.id, payload);
        toast.success('分类更新成功');
      } else {
        await qualityAPI.createCaseCategory(payload);
        toast.success('分类创建成功');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (error) {
      toast.error('操作失败: ' + (error.response?.data?.message || error.message));
      console.error('Error submitting category:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个分类吗？')) {
      try {
        await qualityAPI.deleteCaseCategory(id);
        toast.success('分类删除成功');
        loadCategories();
      } catch (error) {
        toast.error('删除失败: ' + (error.response?.data?.message || error.message));
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await qualityAPI.updateCaseCategory(category.id, { is_active: !category.is_active });
      toast.success('分类状态更新成功');
      loadCategories();
    } catch (error) {
      toast.error('更新状态失败: ' + (error.response?.data?.message || error.message));
      console.error('Error toggling category status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-primary-600 text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="business-card">
        <div className="business-card-header">
          <div>
            <h2 className="business-card-title">案例分类管理</h2>
            <p className="text-gray-500 text-sm mt-1">共 {categories.length} 个分类</p>
          </div>
          <Button onClick={openCreateModal}>
            新增分类
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table className="business-table">
            <TableHeader>
              <TableRow>
                <TableHead>分类名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="5" className="text-center py-8 text-gray-500">
                    暂无分类数据
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-gray-600">{category.description || '-'}</TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>
                      <span className={`business-badge ${category.is_active
                          ? 'business-badge-success'
                          : 'business-badge-error'
                        }`}>
                        {category.is_active ? '已启用' : '已禁用'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                      <Button onClick={openEditModal(category)} className="() =>">
                        编辑
                      </Button>
                      <button
                        onClick={() => handleToggleActive(category)}
                        className={`business-btn business-btn-sm ${category.is_active ? 'business-btn-warning' : 'business-btn-success'
                          }`}
                      >
                        {category.is_active ? '禁用' : '启用'}
                      </button>
                      <Button onClick={handleDelete(category.id)} className="() =>">
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentCategory ? '编辑分类' : '新增分类'}>
        <div className="space-y-4">
          <div>
            <Label className="business-label">分类名称 *</Label>
            <Input type="text"
              name="name"
              value={categoryForm.name}
              onChange={handleFormChange}
              className="business-input"
              placeholder="请输入分类名称"
            />
          </div>
          <div>
            <Label className="business-label">描述</Label>
            <Textarea name="description"
              value={categoryForm.description}
              onChange={handleFormChange}
              rows="3"
              className="business-textarea"
              placeholder="请输入分类描述"
            ></Textarea>
          </div>
          <div>
            <Label className="business-label">排序权重</Label>
            <Input type="number"
              name="sort_order"
              value={categoryForm.sort_order}
              onChange={handleFormChange}
              className="business-input"
              placeholder="数字越小排序越靠前"
            />
          </div>
          <div className="flex items-center">
            <Checkbox
              name="is_active"
              checked={categoryForm.is_active}
              onChange={handleFormChange}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <Label className="ml-2 block text-sm text-gray-900">启用</Label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={setIsModalOpen(false)} className="() =>">
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {currentCategory ? '更新' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CaseCategoryManagementPage;
