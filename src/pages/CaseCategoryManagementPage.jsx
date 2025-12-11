import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import qualityAPI from '../api/qualityAPI.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Edit, Trash2 } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>案例分类管理</CardTitle>
              <p className="text-gray-500 text-sm mt-1">共 {categories.length} 个分类</p>
            </div>
            <Button onClick={openCreateModal} className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> 新增分类
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
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
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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
                        <Badge variant={category.is_active ? 'success' : 'destructive'}>
                          {category.is_active ? '已启用' : '已禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(category)} className="flex items-center gap-1">
                            <Edit className="h-4 w-4" /> 编辑
                          </Button>
                          <Button
                            variant={category.is_active ? 'secondary' : 'default'}
                            size="sm"
                            onClick={() => handleToggleActive(category)}
                            className="flex items-center gap-1"
                          >
                            {category.is_active ? '禁用' : '启用'}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)} className="flex items-center gap-1">
                            <Trash2 className="h-4 w-4" /> 删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) setIsModalOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentCategory ? '编辑分类' : '新增分类'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">分类名称 *</label>
              <Input
                name="name"
                value={categoryForm.name}
                onChange={handleFormChange}
                placeholder="请输入分类名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <Textarea
                name="description"
                value={categoryForm.description}
                onChange={handleFormChange}
                rows={3}
                placeholder="请输入分类描述"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">排序权重</label>
              <Input
                type="number"
                name="sort_order"
                value={categoryForm.sort_order}
                onChange={handleFormChange}
                placeholder="数字越小排序越靠前"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={categoryForm.is_active}
                onCheckedChange={(v) => setCategoryForm(prev => ({ ...prev, is_active: !!v }))}
              />
              <span className="text-sm">启用</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{currentCategory ? '更新' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaseCategoryManagementPage;
