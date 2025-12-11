import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import qualityAPI from '../api/qualityAPI.js';
import SessionDetailModal from '../components/SessionDetailModal';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import ConfirmDialog from '../components/ConfirmDialog';
import { Trash2, ArrowLeft, Download, Search, Star, StarOff, Recycle, Flame, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// 🔴 MODULE LOADED - VERSION 2024-12-02-11:05 - Emoji Version
const CaseLibraryPage = () => {
  const [cases, setCases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Session Detail Modal State
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    caseId: null,
    caseTitle: '',
    type: 'soft' // 'soft' or 'permanent'
  });

  // Recycle Bin State
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'recycle'
  const [recycleBinPagination, setRecycleBinPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const currentUserId = 1;

  const handleFavoriteToggle = async (caseId, isFavorited) => {
    try {
      if (isFavorited) {
        await qualityAPI.removeFavoriteCase(caseId, currentUserId);
        toast.success('已取消收藏');
      } else {
        await qualityAPI.addFavoriteCase(caseId, currentUserId);
        toast.success('收藏成功');
      }
      loadCases();
    } catch (error) {
      toast.error('操作失败');
      console.error('Error toggling favorite:', error);
    }
  };

  const loadCases = async () => {
    try {
      setLoading(true);
      const response = await qualityAPI.getAllCases({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: filters.search,
        category: filters.category,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setCases(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('❌ Error loading cases:', error);
      toast.error('加载案例库失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'active') {
      loadCases();
    } else {
      loadRecycleBin();
    }
    loadCategories();
  }, [filters, pagination.page, viewMode, recycleBinPagination.page]);

  const loadRecycleBin = async () => {
    try {
      setLoading(true);
      const response = await qualityAPI.getRecycleBinCases({
        page: recycleBinPagination.page,
        pageSize: recycleBinPagination.pageSize,
        search: filters.search,
        category: filters.category,
      });
      setCases(response.data.data || []);
      setRecycleBinPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading recycle bin:', error);
      toast.error('加载回收站失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await qualityAPI.getCaseCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleExportCases = async () => {
    try {
      const response = await qualityAPI.exportCases();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `案例库_${new Date().toLocaleDateString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('导出成功');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('导出失败');
    }
  };

  const handleViewCaseSession = async (caseItem) => {
    if (!caseItem.session_id) {
      toast.warning('该案例没有关联会话');
      return;
    }

    try {
      const sessionResponse = await qualityAPI.getSessionDetail(caseItem.session_id);
      const session = sessionResponse.data.data;

      const messagesResponse = await qualityAPI.getSessionMessages(caseItem.session_id);
      const messages = messagesResponse.data.data || [];

      setSelectedSession(session);
      setSessionMessages(messages);
      setShowSessionDetail(true);
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('加载会话详情失败');
    }
  };



  // ... (existing code)

  const openDeleteModal = (caseItem, type) => {
    setDeleteModal({
      isOpen: true,
      caseId: caseItem ? caseItem.id : null,
      caseTitle: caseItem ? caseItem.title : '',
      type: type
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal(prev => ({ ...prev, isOpen: false }));
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === 'soft') {
        if (!deleteModal.caseId) return;
        await qualityAPI.deleteCase(deleteModal.caseId);
        toast.success('案例已移至回收站');
        loadCases();
      } else if (deleteModal.type === 'permanent') {
        if (!deleteModal.caseId) return;
        await qualityAPI.permanentDeleteCase(deleteModal.caseId);
        toast.success('案例已永久删除');
        loadRecycleBin();
      } else if (deleteModal.type === 'empty_bin') {
        await qualityAPI.emptyRecycleBin();
        toast.success('回收站已清空');
        loadRecycleBin();
      }
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // ... (render part)

            <div className="flex gap-3">
              <Button
                variant={viewMode === 'recycle' ? 'secondary' : 'outline'}
                onClick={() => setViewMode(viewMode === 'active' ? 'recycle' : 'active')}
                className="flex items-center gap-1"
              >
                {viewMode === 'recycle' ? (
                  <ArrowLeft className="h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {viewMode === 'recycle' ? '返回案例库' : '回收站'}
              </Button>

              {viewMode === 'recycle' && (
                <Button
                  variant="destructive"
                  className="flex items-center gap-1"
                  onClick={() => openDeleteModal(null, 'empty_bin')}
                  disabled={cases.length === 0}
                >
                  <Trash2 className="h-4 w-4" /> 清空回收站
                </Button>
              )}

              <Button
                variant="secondary"
                onClick={handleExportCases}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" /> 导出数据
              </Button>
            </div>

  // ... (modal render part)

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={
          deleteModal.type === 'soft' ? '移至回收站' :
          deleteModal.type === 'permanent' ? '永久删除确认' :
          '清空回收站确认'
        }
        confirmText={
          deleteModal.type === 'soft' ? '移至回收站' :
          deleteModal.type === 'permanent' ? '永久删除' :
          '确认清空'
        }
        cancelText="取消"
        type={deleteModal.type === 'permanent' || deleteModal.type === 'empty_bin' ? 'danger' : 'warning'}
        message={
          deleteModal.type === 'empty_bin' ? (
            '您确定要清空回收站吗？'
          ) : (
            <>
              <p className="mb-2">
                {deleteModal.type === 'soft' ? '您确定要将以下案例移至回收站吗？' : '您确定要永久删除以下案例吗？'}
              </p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 font-medium text-gray-800">
                {deleteModal.caseTitle}
              </div>
              {deleteModal.type === 'soft' ? (
                <p className="text-sm text-gray-500">
                  移至回收站后，您可以在回收站中恢复此案例。
                </p>
              ) : (
                <p className="text-sm text-red-500 font-medium">
                  此操作无法撤销！所有数据将被永久清除。
                </p>
              )}
            </>
          )
        }
      />

  const handleRestoreCase = async (caseId) => {
    try {
      await qualityAPI.restoreCase(caseId);
      toast.success('案例已恢复');
      loadRecycleBin();
    } catch (error) {
      console.error('Error restoring case:', error);
      toast.error('恢复失败: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
          </AlertTitle>
          <AlertDescription>请稍候</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>案例库</CardTitle>
              <CardDescription>
                {viewMode === 'active'
                  ? `共 ${pagination.total} 条案例`
                  : `回收站 ${recycleBinPagination.total} 条`}
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <Button
                variant={viewMode === 'recycle' ? 'secondary' : 'outline'}
                onClick={() => setViewMode(viewMode === 'active' ? 'recycle' : 'active')}
                className="flex items-center gap-1"
              >
                {viewMode === 'recycle' ? (
                  <ArrowLeft className="h-4 w-4" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {viewMode === 'recycle' ? '返回案例库' : '回收站'}
              </Button>
              {viewMode === 'recycle' && (
                <Button
                  variant="destructive"
                  className="flex items-center gap-1"
                  onClick={() => openDeleteModal(null, 'empty_bin')}
                  disabled={cases.length === 0}
                >
                  <Trash2 className="h-4 w-4" /> 清空回收站
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={handleExportCases}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" /> 导出数据
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="w-full mt-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    name="search"
                    placeholder="搜索案例标题、问题、解决方案..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={filters.category || undefined}
                onValueChange={(value) => {
                  setFilters(prev => ({ ...prev, category: value }))
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
              >
                <SelectTrigger className="min-w-[140px]">
                  <SelectValue placeholder="全部分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.is_active).map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={(value) => {
                  setFilters(prev => ({ ...prev, sortBy: value }))
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
              >
                <SelectTrigger className="min-w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">最新</SelectItem>
                  <SelectItem value="view_count">最热</SelectItem>
                  <SelectItem value="like_count">最赞</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortOrder}
                onValueChange={(value) => {
                  setFilters(prev => ({ ...prev, sortOrder: value }))
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
              >
                <SelectTrigger className="min-w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序</SelectItem>
                  <SelectItem value="asc">升序</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </CardContent>
          </Card>

        <div
          className="grid gap-4 mt-6"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
          }}
        >
          {cases.length === 0 ? (
            <div className="col-span-full">
              <Alert className="bg-gray-50">
                <AlertTitle>暂无案例数据</AlertTitle>
                <AlertDescription>请调整筛选条件或稍后重试</AlertDescription>
              </Alert>
            </div>
          ) : (
            cases.map((caseItem) => (
              <Card
                key={caseItem.id}
                className="rounded-xl hover:shadow-xl hover:border-primary-300 transition-all duration-300 flex flex-col h-full group cursor-pointer"
                onClick={() => viewMode === 'active' && handleViewCaseSession(caseItem)}
              >
                <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base font-bold text-gray-800 line-clamp-2 flex-1 group-hover:text-primary-600 transition-colors" title={caseItem.title}>
                    {caseItem.title}
                  </h3>
                  <div className="flex gap-2 ml-2 flex-shrink-0">
                    {viewMode === 'active' ? (
                      <>
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFavoriteToggle(caseItem.id, caseItem.isFavorited);
                          }}
                          title="收藏"
                        >
                          {caseItem.isFavorited ? (
                            <Star className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(caseItem, 'soft');
                          }}
                          title="删除"
                          style={{ minWidth: '32px', minHeight: '32px' }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="p-1.5 hover:bg-green-50 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreCase(caseItem.id);
                          }}
                          title="恢复"
                        >
                          <Recycle className="h-4 w-4 text-green-600" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-50 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(caseItem, 'permanent');
                          }}
                          title="永久删除"
                        >
                          <Flame className="h-4 w-4 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {caseItem.problem || caseItem.description ? (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow leading-relaxed">
                    {caseItem.problem || caseItem.description}
                  </p>
                ) : (
                  <Alert className="p-2 mb-3">
                    <AlertDescription className="text-xs">暂无描述</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge className="text-xs bg-blue-600 text-white">
                    {caseItem.category}
                  </Badge>

                  {caseItem.tags && caseItem.tags.map(tag => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}

                  {viewMode === 'recycle' && caseItem.deleted_at && (
                    <Badge variant="destructive" className="text-xs">
                      {new Date(caseItem.deleted_at).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {((viewMode === 'active' && pagination.totalPages > 1) ||
          (viewMode === 'recycle' && recycleBinPagination.totalPages > 1)) && (
          <div className="flex justify-center items-center mt-8 gap-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (viewMode === 'active') {
                  handlePageChange(pagination.page - 1);
                } else {
                  setRecycleBinPagination(prev => ({ ...prev, page: prev.page - 1 }));
                }
              }}
              disabled={viewMode === 'active' ? pagination.page === 1 : recycleBinPagination.page === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> 上一页
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                第 {viewMode === 'active' ? pagination.page : recycleBinPagination.page} / {viewMode === 'active' ? pagination.totalPages : recycleBinPagination.totalPages} 页
              </span>
              <span className="text-xs text-gray-400">
                (共 {viewMode === 'active' ? pagination.total : recycleBinPagination.total} 条)
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (viewMode === 'active') {
                  handlePageChange(pagination.page + 1);
                } else {
                  setRecycleBinPagination(prev => ({ ...prev, page: prev.page + 1 }));
                }
              }}
              disabled={viewMode === 'active'
                ? pagination.page === pagination.totalPages
                : recycleBinPagination.page === recycleBinPagination.totalPages}
              className="gap-1"
            >
              下一页 <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}


      {showSessionDetail && selectedSession && (
        <SessionDetailModal
          isOpen={showSessionDetail}
          onClose={() => setShowSessionDetail(false)}
          session={selectedSession}
          initialMessages={sessionMessages}
          readOnly={true}
        />
      )}


      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={deleteModal.type === 'soft' ? '移至回收站' : '永久删除确认'}
        confirmText={deleteModal.type === 'soft' ? '移至回收站' : '永久删除'}
        cancelText="取消"
        type={deleteModal.type === 'permanent' ? 'danger' : 'warning'}
        message={
          <>
            <p className="mb-2">
              您确定要{deleteModal.type === 'soft' ? '将以下案例移至回收站' : '永久删除以下案例'}吗？
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 font-medium text-gray-800">
              {deleteModal.caseTitle}
            </div>
            {deleteModal.type === 'soft' ? (
              <p className="text-sm text-gray-500">
                移至回收站后，您可以在回收站中恢复此案例。
              </p>
            ) : (
              <p className="text-sm text-red-500 font-medium">
                此操作无法撤销！数据将被永久清除。
              </p>
            )}
          </>
        }
      />
    </div>
  );
};

export default CaseLibraryPage;
