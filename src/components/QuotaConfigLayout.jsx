import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Calendar, Settings } from 'lucide-react';
import HolidayConfig from './HolidayConfig';
import SystemConfigPage from './SystemConfigPage';
import VacationQuotaSettings from './VacationQuotaSettings';

const QuotaConfigLayout = () => {
  const [activeTab, setActiveTab] = useState('quota');

  return (
    <div className="quota-config-layout">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="quota">
            <Calendar className="mr-2 h-4 w-4" />
            员工额度
          </TabsTrigger>
          <TabsTrigger value="holiday">
            <Calendar className="mr-2 h-4 w-4" />
            节假日配置
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="mr-2 h-4 w-4" />
            系统配置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quota">
          <VacationQuotaSettings />
        </TabsContent>
        <TabsContent value="holiday">
          <HolidayConfig />
        </TabsContent>
        <TabsContent value="system">
          <SystemConfigPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuotaConfigLayout;
