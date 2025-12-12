import React from 'react';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usePermission } from '../contexts/PermissionContext';

/**
 * 权限门控组件
 * @param {string} permission - 需要的权限代码
 * @param {ReactNode} children - 有权限时显示的内容
 * @param {ReactNode} fallback - 无权限时显示的内容 (默认不显示)
 */
const PermissionGate = ({ permission, children, fallback = null }) => {
  const { hasPermission, loading } = usePermission();

  if (loading) {
    return null; // 或者返回一个加载占位符
  }

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGate;
