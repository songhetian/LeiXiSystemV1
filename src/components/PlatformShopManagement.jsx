import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import qualityAPI from '../api/qualityAPI.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import PlatformShopForm from './PlatformShopForm';
import { MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import './PlatformShopManagement.css';

const PlatformShopManagement = () => {
    const [platforms, setPlatforms] = useState([]);
    const [filteredPlatforms, setFilteredPlatforms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('card');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);

    const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
    const [isShopModalOpen, setIsShopModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'platform'|'shop', id, name }
    const [editingPlatform, setEditingPlatform] = useState(null);
    const [editingShop, setEditingShop] = useState(null);
    const [selectedPlatform, setSelectedPlatform] = useState(null);


    useEffect(() => {
        loadPlatforms();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredPlatforms(platforms);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = platforms.filter(platform =>
                platform.name.toLowerCase().includes(query) ||
                platform.shops?.some(shop => shop.name.toLowerCase().includes(query))
            );
            setFilteredPlatforms(filtered);
        }
        setCurrentPage(1);
    }, [searchQuery, platforms]);

    const loadPlatforms = async () => {
        try {
            setLoading(true);
            const response = await qualityAPI.getPlatforms();
            const platformsWithShops = await Promise.all(
                (response.data.data || []).map(async (platform) => {
                    const shopResponse = await qualityAPI.getShopsByPlatform(platform.id);
                    return { ...platform, shops: shopResponse.data.data || [] };
                })
            );
            setPlatforms(platformsWithShops);
            setFilteredPlatforms(platformsWithShops);
        } catch (error) {
            toast.error('加载平台和店铺数据失败');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlatform = () => {
        setEditingPlatform(null);
        setIsPlatformModalOpen(true);
    };

    const handleEditPlatform = (platform) => {
        setEditingPlatform(platform);
        setIsPlatformModalOpen(true);
    };

    const handleDeletePlatform = (platform) => {
        setDeleteTarget({ type: 'platform', id: platform.id, name: platform.name });
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget.type === 'platform') {
                await qualityAPI.deletePlatform(deleteTarget.id);
                toast.success('平台删除成功！');
            } else if (deleteTarget.type === 'shop') {
                await qualityAPI.deleteShop(deleteTarget.id);
                toast.success('店铺删除成功！');
            }
            loadPlatforms();
        } catch (error) {
            toast.error(deleteTarget.type === 'platform' ? '平台删除失败' : '店铺删除失败');
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteTarget(null);
        }
    };

    const handleSavePlatform = async (platformData) => {
        try {
            if (editingPlatform) {
                await qualityAPI.updatePlatform(editingPlatform.id, platformData);
                toast.success('平台更新成功！');
            } else {
                await qualityAPI.createPlatform(platformData);
                toast.success('平台添加成功！');
            }
            setIsPlatformModalOpen(false);
            loadPlatforms();
        } catch (error) {
            toast.error(editingPlatform ? '平台更新失败' : '平台添加失败');
        }
    };

    const handleAddShop = (platform) => {
        setSelectedPlatform(platform);
        setEditingShop(null);
        setIsShopModalOpen(true);
    };

    const handleEditShop = (shop, platform) => {
        setSelectedPlatform(platform);
        setEditingShop(shop);
        setIsShopModalOpen(true);
    };

    const handleDeleteShop = (shop) => {
        setDeleteTarget({ type: 'shop', id: shop.id, name: shop.name });
        setIsDeleteModalOpen(true);
    };

    const handleSaveShop = async (shopData) => {
        try {
            const dataToSave = { ...shopData, platform_id: selectedPlatform.id };
            if (editingShop) {
                await qualityAPI.updateShop(editingShop.id, dataToSave);
                toast.success('店铺更新成功！');
            } else {
                await qualityAPI.createShop(dataToSave);
                toast.success('店铺添加成功！');
            }
            setIsShopModalOpen(false);
            loadPlatforms();
        } catch (error) {
            toast.error(editingShop ? '店铺更新失败' : '店铺添加失败');
        }
    };

    const totalPages = Math.ceil(filteredPlatforms.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPlatforms = filteredPlatforms.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>加载中...</p>
            </div>
        );
    }

    return (
        <div className="platform-shop-container">
            {/* Header */}
            <div className="platform-shop-header">
                <div>
                    <h2 className="platform-shop-title">平台与店铺管理</h2>
                    <p className="platform-shop-subtitle">
                        共 {filteredPlatforms.length} 个平台，{filteredPlatforms.reduce((sum, p) => sum + (p.shops?.length || 0), 0)} 个店铺
                    </p>
                </div>

                <div className="header-actions">
                    {/* Search */}
                    <div className="search-box">
                        <MagnifyingGlassIcon className="search-icon" />
                        <input
                            type="text"
                            placeholder="搜索平台或店铺..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="view-toggle">
                        <button
                            onClick={() => setViewMode('card')}
                            className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                            title="卡片视图"
                        >
                            <Squares2X2Icon className="toggle-icon" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            title="列表视图"
                        >
                            <ListBulletIcon className="toggle-icon" />
                        </button>
                    </div>

                    {/* Add Platform */}
                    <button onClick={handleAddPlatform} className="btn-add-platform">
                        <PlusIcon className="btn-icon" />
                        添加平台
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {currentPlatforms.length === 0 && (
                <div className="empty-state-modern">
                    <div className="empty-icon">🏪</div>
                    <p className="empty-title">
                        {searchQuery ? '未找到匹配的平台或店铺' : '暂无平台数据'}
                    </p>
                    <p className="empty-subtitle">
                        {searchQuery ? '请尝试其他搜索关键词' : '点击"添加平台"按钮创建新平台'}
                    </p>
                </div>
            )}

            {/* Card View */}
            {viewMode === 'card' && currentPlatforms.length > 0 && (
                <div className="platforms-grid">
                    {currentPlatforms.map(platform => (
                        <div key={platform.id} className="platform-card-modern">
                            {/* Card Header */}
                            <div className="card-header">
                                <h3 className="card-title">{platform.name}</h3>
                                <div className="card-actions-header">
                                    <button
                                        onClick={() => handleEditPlatform(platform)}
                                        className="icon-btn icon-btn-edit"
                                        title="编辑平台"
                                    >
                                        <PencilIcon className="icon-btn-icon" />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePlatform(platform.id)}
                                        className="icon-btn icon-btn-delete"
                                        title="删除平台"
                                    >
                                        <TrashIcon className="icon-btn-icon" />
                                    </button>
                                </div>
                            </div>

                            {/* Shop Count Badge */}
                            <div className="shop-count-badge">
                                <span className="badge-icon">🏬</span>
                                <span className="badge-text">{platform.shops?.length || 0} 个店铺</span>
                            </div>

                            {/* Shops List */}
                            <div className="shops-section">
                                {platform.shops && platform.shops.length > 0 ? (
                                    <div className="shops-list">
                                        {platform.shops.map(shop => (
                                            <div key={shop.id} className="shop-item">
                                                <span className="shop-name">{shop.name}</span>
                                                <div className="shop-actions">
                                                    <button
                                                        onClick={() => handleEditShop(shop, platform)}
                                                        className="shop-action-btn shop-edit"
                                                        title="编辑"
                                                    >
                                                        <PencilIcon className="shop-action-icon" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteShop(shop.id)}
                                                        className="shop-action-btn shop-delete"
                                                        title="删除"
                                                    >
                                                        <TrashIcon className="shop-action-icon" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-shops">
                                        <span className="empty-shops-icon">📭</span>
                                        <span className="empty-shops-text">暂无店铺</span>
                                    </div>
                                )}
                            </div>

                            {/* Add Shop Button */}
                            <div className="card-footer">
                                <button
                                    onClick={() => handleAddShop(platform)}
                                    className="btn-add-shop"
                                >
                                    <PlusIcon className="btn-icon-small" />
                                    添加店铺
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && currentPlatforms.length > 0 && (
                <div className="platforms-list">
                    {currentPlatforms.map(platform => (
                        <div key={platform.id} className="platform-list-item">
                            <div className="list-item-header">
                                <h3 className="list-item-title">{platform.name}</h3>
                                <div className="list-item-actions">
                                    <button
                                        onClick={() => handleAddShop(platform)}
                                        className="btn-list-action btn-success"
                                    >
                                        <PlusIcon className="btn-icon-small" />
                                        添加店铺
                                    </button>
                                    <button
                                        onClick={() => handleEditPlatform(platform)}
                                        className="btn-list-action btn-secondary"
                                    >
                                        编辑平台
                                    </button>
                                    <button
                                        onClick={() => handleDeletePlatform(platform.id)}
                                        className="btn-list-action btn-danger"
                                    >
                                        删除平台
                                    </button>
                                </div>
                            </div>

                            <table className="shops-table">
                                <thead>
                                    <tr>
                                        <th>店铺名称</th>
                                        <th className="text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {platform.shops && platform.shops.length > 0 ? (
                                        platform.shops.map(shop => (
                                            <tr key={shop.id}>
                                                <td>{shop.name}</td>
                                                <td className="text-right">
                                                    <button
                                                        onClick={() => handleEditShop(shop, platform)}
                                                        className="btn-table-action btn-edit"
                                                    >
                                                        编辑
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteShop(shop.id)}
                                                        className="btn-table-action btn-delete"
                                                    >
                                                        删除
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="empty-table-cell">
                                                该平台下暂无店铺
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        上一页
                    </button>
                    <span className="pagination-info">
                        第 {currentPage} 页 / 共 {totalPages} 页
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        下一页
                    </button>
                </div>
            )}

            {/* Modals */}
            <Dialog open={isPlatformModalOpen} onOpenChange={(open) => { if (!open) setIsPlatformModalOpen(false); }}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingPlatform ? '编辑平台' : '添加平台'}</DialogTitle>
                    </DialogHeader>
                    <PlatformShopForm
                        entity={editingPlatform}
                        onSave={handleSavePlatform}
                        onCancel={() => setIsPlatformModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isShopModalOpen} onOpenChange={(open) => { if (!open) setIsShopModalOpen(false); }}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingShop ? `编辑店铺 (平台: ${selectedPlatform?.name})` : `添加新店铺到 ${selectedPlatform?.name}`}</DialogTitle>
                    </DialogHeader>
                    <PlatformShopForm
                        entity={editingShop}
                        onSave={handleSaveShop}
                        onCancel={() => setIsShopModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={(open) => { if (!open) setIsDeleteModalOpen(false); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <p className="text-gray-700 mb-4">
                            {deleteTarget?.type === 'platform'
                                ? `确定要删除平台 "${deleteTarget?.name}" 吗？其下的所有店铺也将被删除。`
                                : `确定要删除店铺 "${deleteTarget?.name}" 吗？`
                            }
                        </p>
                        <p className="text-sm text-red-600 font-medium">⚠️ 此操作不可撤销！</p>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                确认删除
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PlatformShopManagement;
