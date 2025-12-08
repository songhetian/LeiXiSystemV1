import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../utils/apiConfig';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl('/api/users/permissions'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPermissions(data.permissions || []);
        // 同时更新localStorage中的权限数据
        localStorage.setItem('permissions', JSON.stringify(data.permissions || []));
      } else {
        setPermissions([]);
        localStorage.removeItem('permissions');
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setPermissions([]);
      localStorage.removeItem('permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((permissionCode) => {
    // 超级管理员拥有所有权限 (前端也做个简单判断，虽然后端才是关键)
    // 但前端拿到的 permissions 列表应该已经包含了所有权限（如果后端逻辑正确）
    // 或者我们可以约定一个特殊权限码 'all'
    return permissions.includes(permissionCode);
  }, [permissions]);

  // 检查是否有任意一个权限
  const hasAnyPermission = useCallback((permissionCodes) => {
    return permissionCodes.some(code => permissions.includes(code));
  }, [permissions]);

  return (
    <PermissionContext.Provider value={{ permissions, hasPermission, hasAnyPermission, fetchPermissions, loading }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};
