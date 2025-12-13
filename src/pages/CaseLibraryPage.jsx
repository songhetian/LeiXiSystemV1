import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import qualityAPI from '../api/qualityAPI.js';
import Modal from '../components/Modal';
import SessionDetailModal from '../components/SessionDetailModal';

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
              <button
                onClick={() => setViewMode(viewMode === 'active' ? 'recycle' : 'active')}
                className={`business-btn ${viewMode === 'recycle' ? 'business-btn-primary' : 'business-btn-secondary'} flex items-center justify-center`}
              >
                <span className="mr-2">{viewMode === 'recycle' ? '🔙' : '♻️'}</span>
                {viewMode === 'recycle' ? '返回案例库' : '回收站'}
              </button>

              {viewMode === 'recycle' && (
                <button
                  className="business-btn business-btn-danger flex items-center justify-center"
                  onClick={() => openDeleteModal(null, 'empty_bin')}
                  disabled={cases.length === 0}
                >
                  <span className="mr-2">🗑️</span>清空回收站
                </button>
              )}

              <button
                className="business-btn business-btn-secondary flex items-center justify-center"
                onClick={handleExportCases}
              >
                <span className="mr-2">📥</span>导出数据
              </button>
            </div>

  // ... (modal render part)

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        title={
          deleteModal.type === 'soft' ? '移至回收站' :
          deleteModal.type === 'permanent' ? '永久删除确认' :
          '清空回收站确认'
        }
        size="small"
        variant="danger"
        footer={
          <div className="flex justify-end gap-3">
            <button
              className="business-btn business-btn-secondary"
              onClick={closeDeleteModal}
            >
              取消
            </button>
            <button
              className="business-btn business-btn-danger"
              onClick={confirmDelete}
            >
              {deleteModal.type === 'soft' ? '移至回收站' :
               deleteModal.type === 'permanent' ? '永久删除' :
               '确认清空'}
            </button>
          </div>
        }
      >
        <div className="py-2">
          <p className="text-gray-700 mb-2">
            {deleteModal.type === 'soft' ? '您确定要将以下案例移至回收站吗？' :
             deleteModal.type === 'permanent' ? '您确定要永久删除以下案例吗？' :
             '您确定要清空回收站吗？'}
          </p>

          {deleteModal.type !== 'empty_bin' && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 font-medium text-gray-800">
              {deleteModal.caseTitle}
            </div>
          )}

          {deleteModal.type === 'soft' ? (
            <p className="text-sm text-gray-500">
              <span className="mr-1">💡</span>移至回收站后，您可以在回收站中恢复此案例。
            </p>
          ) : (
            <p className="text-sm text-red-500 font-medium">
              <span className="mr-1">⚠️</span>此操作无法撤销！所有数据将被永久清除。
            </p>
          )}
        </div>
      </Modal>

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
      <div className="flex items-center justify-center h-full">
        <div className="text-primary-600 text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="business-card">
        <div className="business-card-header flex-col items-start gap-4">
          <div className="w-full flex justify-between items-center">
            <div>
              <h2 className="business-card-title">案例库</h2>
              <p className="text-gray-500 text-sm mt-1">
                {viewMode === 'active'
                  ? `共 ${pagination.total} 条案例`
                  : `回收站 ${recycleBinPagination.total} 条`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'active' ? 'recycle' : 'active')}
                className={`business-btn ${viewMode === 'recycle' ? 'business-btn-primary' : 'business-btn-secondary'} flex items-center justify-center`}
              >
                <span className="mr-2">{viewMode === 'recycle' ? '🔙' : '♻️'}</span>
                {viewMode === 'recycle' ? '返回案例库' : '回收站'}
              </button>
              <button
                className="business-btn business-btn-secondary flex items-center justify-center"
                onClick={handleExportCases}
              >
                <span className="mr-2">📥</span>导出数据
              </button>
            </div>
          </div>

          <div className="w-full bg-gray-50 rounded-xl p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    name="search"
                    placeholder="搜索案例标题、问题、解决方案..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              </div>

              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-all min-w-[140px]"
              >
                <option value="">全部分类</option>
                {categories.filter(c => c.is_active).map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-all min-w-[120px]"
              >
                <option value="created_at">最新</option>
                <option value="view_count">最热</option>
                <option value="like_count">最赞</option>
              </select>

              <select
                name="sortOrder"
                value={filters.sortOrder}
                onChange={handleFilterChange}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-all min-w-[100px]"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </div>

        <div
          className="grid gap-4 mt-6"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
          }}
        >
          {cases.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <span className="text-4xl mb-3 block">📭</span>
              <p>暂无案例数据</p>
            </div>
          ) : (
            cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-primary-300 transition-all duration-300 flex flex-col h-full group cursor-pointer"
                onClick={() => viewMode === 'active' && handleViewCaseSession(caseItem)}
              >
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
                          <span className="text-base">{caseItem.isFavorited ? '⭐' : '☆'}</span>
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
                          <span className="text-base">🗑️</span>
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
                          <span className="text-base">♻️</span>
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-50 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(caseItem, 'permanent');
                          }}
                          title="永久删除"
                        >
                          <span className="text-base">🔥</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow leading-relaxed">
                  {caseItem.problem || caseItem.description || '暂无描述'}
                </p>

                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded-full shadow-sm">
                    <span className="mr-1">📁</span>{caseItem.category}
                  </span>

                  {caseItem.tags && caseItem.tags.map(tag => (
                    <span key={tag.id} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                      <span className="mr-1">🏷️</span>{tag.name}
                    </span>
                  ))}

                  {viewMode === 'recycle' && caseItem.deleted_at && (
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-full border border-red-100">
                      <span className="mr-1">🕒</span>
                      {new Date(caseItem.deleted_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {((viewMode === 'active' && pagination.totalPages > 1) ||
          (viewMode === 'recycle' && recycleBinPagination.totalPages > 1)) && (
          <div className="flex justify-center items-center mt-8 gap-4">
            <button
              onClick={() => {
                if (viewMode === 'active') {
                  handlePageChange(pagination.page - 1);
                } else {
                  setRecycleBinPagination(prev => ({ ...prev, page: prev.page - 1 }));
                }
              }}
              disabled={viewMode === 'active' ? pagination.page === 1 : recycleBinPagination.page === 1}
              className="business-btn business-btn-secondary business-btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="mr-1">⬅️</span>上一页
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                第 {viewMode === 'active' ? pagination.page : recycleBinPagination.page} / {viewMode === 'active' ? pagination.totalPages : recycleBinPagination.totalPages} 页
              </span>
              <span className="text-xs text-gray-400">
                (共 {viewMode === 'active' ? pagination.total : recycleBinPagination.total} 条)
              </span>
            </div>

            <button
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
              className="business-btn business-btn-secondary business-btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页<span className="ml-1">➡️</span>
            </button>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {showSessionDetail && selectedSession && (
        <SessionDetailModal
          isOpen={showSessionDetail}
          onClose={() => setShowSessionDetail(false)}
          session={selectedSession}
          initialMessages={sessionMessages}
          readOnly={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        title={deleteModal.type === 'soft' ? '移至回收站' : '永久删除确认'}
        size="small"
        variant="danger"
        footer={
          <div className="flex justify-end gap-3">
            <button
              className="business-btn business-btn-secondary"
              onClick={closeDeleteModal}
            >
              取消
            </button>
            <button
              className="business-btn business-btn-danger"
              onClick={confirmDelete}
            >
              {deleteModal.type === 'soft' ? '移至回收站' : '永久删除'}
            </button>
          </div>
        }
      >
        <div className="py-2">
          <p className="text-gray-700 mb-2">
            您确定要{deleteModal.type === 'soft' ? '将以下案例移至回收站' : '永久删除以下案例'}吗？
          </p>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 font-medium text-gray-800">
            {deleteModal.caseTitle}
          </div>
          {deleteModal.type === 'soft' ? (
            <p className="text-sm text-gray-500">
              <span className="mr-1">💡</span>移至回收站后，您可以在回收站中恢复此案例。
            </p>
          ) : (
            <p className="text-sm text-red-500 font-medium">
              <span className="mr-1">⚠️</span>此操作无法撤销！数据将被永久清除。
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CaseLibraryPage;
