import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import qualityAPI from '../api/qualityAPI.js';
import Modal from '../components/Modal';
import SessionDetailModal from '../components/SessionDetailModal';

const CaseLibraryPage = () => {
  const [cases, setCases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caseForm, setCaseForm] = useState({
    title: '',
    category: '',
    case_type: 'excellent',
    difficulty_level: 'medium',
    priority: 'medium',
    problem_description: '',
    solution: '',
    key_points: '',
    status: 'published',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    difficulty: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Session Detail Modal State
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);

  // Placeholder for current user ID
  const currentUserId = 1; // In a real app, get this from auth context or similar

  const handleFavoriteToggle = async (caseId, isFavorited) => {
    try {
      if (isFavorited) {
        await qualityAPI.removeFavoriteCase(caseId, currentUserId);
        toast.success('案例已从收藏中移除');
      } else {
        await qualityAPI.addFavoriteCase(caseId, currentUserId);
        toast.success('案例已添加到收藏');
      }
      // Reload cases to update favorite status
      loadCases();
    } catch (error) {
      toast.error(`操作失败: ${error.response?.data?.message || error.message}`);
      console.error('Error toggling favorite status:', error);
    }
  };

  const handleExportCases = async () => {
    try {
      const response = await qualityAPI.exportCases();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'quality_cases.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('案例数据导出成功');
    } catch (error) {
      toast.error(`导出失败: ${error.response?.data?.message || error.message}`);
      console.error('Error exporting cases:', error);
    }
  };

  useEffect(() => {
    loadCases();
    loadCategories();
  }, [pagination.page, pagination.pageSize, filters]); // Reload cases when page, pageSize, or filters change

  const loadCategories = async () => {
    try {
      const response = await qualityAPI.getCaseCategories();
      setCategories(response.data.flatData || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCases = async () => {
    try {
      setLoading(true);
      const [casesResponse, favoriteCasesResponse] = await Promise.all([
        qualityAPI.getAllCases({
          page: pagination.page,
          pageSize: pagination.pageSize,
          ...filters,
        }),
        qualityAPI.getUserFavoriteCases(currentUserId, { pageSize: 9999 }) // Fetch all favorites for current user
      ]);

      const favoriteCaseIds = new Set(favoriteCasesResponse.data.data.map(favCase => favCase.id));

      const casesWithFavoriteStatus = casesResponse.data.data.map(caseItem => ({
        ...caseItem,
        isFavorited: favoriteCaseIds.has(caseItem.id)
      }));

      setCases(casesWithFavoriteStatus);
      setPagination(casesResponse.data.pagination);
    } catch (error) {
      toast.error('加载案例库失败');
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPagination({ ...pagination, page: 1 }); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleCaseFormChange = (e) => {
    const { name, value } = e.target;
    setCaseForm({ ...caseForm, [name]: value });
  };

  const openCreateModal = () => {
    setCaseForm({
      title: '',
      category: '',
      case_type: 'excellent',
      difficulty_level: 'medium',
      priority: 'medium',
      problem_description: '',
      solution: '',
      key_points: '',
      status: 'published',
    });
    setIsModalOpen(true);
  };

  const handleCreateCase = async () => {
    try {
      if (!caseForm.title || !caseForm.category || !caseForm.problem_description || !caseForm.solution) {
        toast.error('请填写必填项');
        return;
      }
      await qualityAPI.createCase(caseForm);
      toast.success('案例创建成功');
      setIsModalOpen(false);
      loadCases(); // Refresh the list
    } catch (error) {
      toast.error('创建失败: ' + (error.response?.data?.message || error.message));
      console.error('Error creating case:', error);
    }
  };

  const handleViewCaseSession = async (caseItem) => {
    if (!caseItem.session_id) {
      toast.warning('该案例没有关联会话');
      return;
    }

    try {
      // Load session details
      const sessionResponse = await qualityAPI.getSessionDetail(caseItem.session_id);
      const session = sessionResponse.data.data;

      // Load session messages
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
              <p className="text-gray-500 text-sm mt-1">共 {pagination.total} 条案例</p>
            </div>
            <div className="flex gap-3">
              <button onClick={openCreateModal} className="business-btn business-btn-primary">
                + 新增案例
              </button>
              <button
                className="business-btn business-btn-secondary"
                onClick={handleExportCases}
              >
                <i className="fas fa-download mr-2"></i>导出数据
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
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
                name="difficulty"
                value={filters.difficulty}
                onChange={handleFilterChange}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-all min-w-[120px]"
              >
                <option value="">全部难度</option>
                <option value="简单">简单</option>
                <option value="中等">中等</option>
                <option value="困难">困难</option>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {cases.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <i className="fas fa-inbox text-4xl text-gray-300 mb-3"></i>
              <p>暂无案例数据</p>
            </div>
          ) : (
            cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-primary-300 transition-all duration-300 flex flex-col h-full group cursor-pointer"
                onClick={() => handleViewCaseSession(caseItem)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-800 line-clamp-2 flex-1 group-hover:text-primary-600 transition-colors" title={caseItem.title}>
                    {caseItem.title}
                  </h3>
                  <button
                    className="ml-3 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoriteToggle(caseItem.id, caseItem.isFavorited);
                    }}
                  >
                    <i className={`${caseItem.isFavorited ? 'fas text-yellow-500' : 'far text-gray-400'} fa-star text-lg`}></i>
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow leading-relaxed">
                  {caseItem.problem || caseItem.description || '暂无描述'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 text-xs font-medium rounded-full border border-primary-200">
                    <i className="fas fa-folder mr-1"></i>{caseItem.category}
                  </span>
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                    caseItem.difficulty === '简单' ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200' :
                    caseItem.difficulty === '中等' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200'
                  }`}>
                    <i className="fas fa-signal mr-1"></i>{caseItem.difficulty}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs text-gray-500">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <i className="fas fa-eye text-blue-500"></i>
                      <span className="font-medium">{caseItem.view_count || 0}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fas fa-thumbs-up text-green-500"></i>
                      <span className="font-medium">{caseItem.like_count || 0}</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-primary-600 hover:text-primary-800 font-medium transition-colors px-2 py-1 hover:bg-primary-50 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        const caseUrl = `${window.location.origin}/case/${caseItem.id}`;
                        navigator.clipboard.writeText(caseUrl);
                        toast.success('链接已复制');
                      }}
                    >
                      <i className="fas fa-share-alt mr-1"></i>分享
                    </button>
                    <button
                      className="text-primary-600 hover:text-primary-800 font-medium transition-colors px-2 py-1 hover:bg-primary-50 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCaseSession(caseItem);
                      }}
                    >
                      <i className="fas fa-info-circle mr-1"></i>详情
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="business-btn business-btn-secondary business-btn-sm"
            >
              上一页
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`business-btn business-btn-sm ${pagination.page === p ? 'business-btn-primary' : 'business-btn-secondary'
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="business-btn business-btn-secondary business-btn-sm"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新增案例">
        <div className="space-y-4">
          <div>
            <label className="business-label">案例标题 *</label>
            <input
              type="text"
              name="title"
              value={caseForm.title}
              onChange={handleCaseFormChange}
              className="business-input"
              placeholder="请输入案例标题"
            />
          </div>
          <div>
            <label className="business-label">分类 *</label>
            <select
              name="category"
              value={caseForm.category}
              onChange={handleCaseFormChange}
              className="business-select"
            >
              <option value="">请选择分类</option>
              {categories.filter(c => c.is_active).map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="business-label">难度等级</label>
              <select
                name="difficulty_level"
                value={caseForm.difficulty_level}
                onChange={handleCaseFormChange}
                className="business-select"
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
            <div>
              <label className="business-label">优先级</label>
              <select
                name="priority"
                value={caseForm.priority}
                onChange={handleCaseFormChange}
                className="business-select"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>
          <div>
            <label className="business-label">问题描述 *</label>
            <textarea
              name="problem_description"
              value={caseForm.problem_description}
              onChange={handleCaseFormChange}
              rows="4"
              className="business-textarea"
              placeholder="请描述遇到的问题"
            ></textarea>
          </div>
          <div>
            <label className="business-label">解决方案 *</label>
            <textarea
              name="solution"
              value={caseForm.solution}
              onChange={handleCaseFormChange}
              rows="4"
              className="business-textarea"
              placeholder="请描述解决方案"
            ></textarea>
          </div>
          <div>
            <label className="business-label">关键要点</label>
            <textarea
              name="key_points"
              value={caseForm.key_points}
              onChange={handleCaseFormChange}
              rows="3"
              className="business-textarea"
              placeholder="请输入关键要点（可选）"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="business-btn business-btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleCreateCase}
              className="business-btn business-btn-primary"
            >
              创建
            </button>
          </div>
        </div>
      </Modal>

      {/* Session Detail Modal */}
      {showSessionDetail && selectedSession && (
        <SessionDetailModal
          isOpen={showSessionDetail}
          onClose={() => {
            setShowSessionDetail(false);
            setSelectedSession(null);
            setSessionMessages([]);
          }}
          session={selectedSession}
          initialMessages={sessionMessages}
        />
      )}
    </div>
  );
};

export default CaseLibraryPage;
