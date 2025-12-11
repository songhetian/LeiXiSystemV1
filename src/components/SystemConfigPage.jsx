// [SHADCN-REPLACED]
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Clock, Tag } from 'lucide-react';
import ConversionRulesSettings from './ConversionRulesSettings';
import VacationTypeManagement from './VacationTypeManagement';

const SystemConfigPage = () => {
  const [activeSection, setActiveSection] = useState('conversion');

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>系统配置</CardTitle>
          <CardDescription>管理转换规则与假期类型</CardDescription>
          <div className="mt-4 flex gap-3">
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
        </CardHeader>
        <CardContent>
          <div className="system-config-content">
            {activeSection === 'conversion' && (
              <ConversionRulesSettings visible={true} onClose={() => {}} standalone={true} />
            )}
            {activeSection === 'types' && (
              <VacationTypeManagement visible={true} onClose={() => {}} standalone={true} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemConfigPage;
