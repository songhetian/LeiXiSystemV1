import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Shadcn UI Components
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { MotionCard } from '../../components/ui/motion-card';
import { MotionTable, MotionTableBody, MotionTableCell, MotionTableHead, MotionTableHeader, MotionTableRow } from '../../components/ui/motion-table';

// Icons
import { 
  Settings,
  Plus,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Tag,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

import ConversionRulesSettingsOptimized from '../../components/ConversionRulesSettingsOptimized';
import VacationTypeManagementOptimized from '../../components/VacationTypeManagementOptimized';

const SystemConfigPageOptimized = () => {
  const [activeSection, setActiveSection] = useState('conversion');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">系统配置</h1>
          <p className="text-gray-600 mt-1">管理系统核心配置参数</p>
        </div>
      </div>

      {/* 顶部切换按钮 */}
      <div className="mb-6 flex gap-4">
        <Button
          variant={activeSection === 'conversion' ? 'default' : 'outline'}
          className="flex items-center gap-2"
          onClick={() => setActiveSection('conversion')}
        >
          <Clock className="w-4 h-4" />
          转换规则
        </Button>
        <Button
          variant={activeSection === 'types' ? 'default' : 'outline'}
          className="flex items-center gap-2"
          onClick={() => setActiveSection('types')}
        >
          <Tag className="w-4 h-4" />
          假期类型
        </Button>
      </div>

      {/* 内容区域 */}
      <div className="system-config-content">
        {activeSection === 'conversion' && (
          <ConversionRulesSettingsOptimized visible={true} onClose={() => {}} standalone={true} />
        )}
        {activeSection === 'types' && (
          <VacationTypeManagementOptimized visible={true} onClose={() => {}} standalone={true} />
        )}
      </div>
    </div>
  );
};

export default SystemConfigPageOptimized;
