import React from 'react';
import { Skeleton, Card, Space } from 'antd';

/**
 * 通用的数据表格骨架屏
 * @param {number} rows 模拟的行数
 * @param {boolean} showSearch 是否显示搜索栏骨架
 */
const DataTableSkeleton = ({ rows = 5, showSearch = true }) => {
  return (
    <div className="space-y-6">
      {/* 顶部搜索栏骨架 */}
      {showSearch && (
        <Card bordered={false} className="rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton.Button active size="small" style={{ width: 60 }} />
                <Skeleton.Input active size="default" style={{ width: 160, borderRadius: 12 }} />
              </div>
            ))}
            <div className="ml-auto">
              <Space>
                <Skeleton.Button active size="default" style={{ width: 80, borderRadius: 12 }} />
                <Skeleton.Button active size="default" style={{ width: 100, borderRadius: 12 }} />
              </Space>
            </div>
          </div>
        </Card>
      )}

      {/* 表格内容骨架 */}
      <Card bordered={false} className="rounded-2xl shadow-sm border border-gray-100 p-0 overflow-hidden">
        <div className="p-6 space-y-4">
          {/* 表头模拟 */}
          <div className="flex justify-between border-b pb-4 border-gray-50">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton.Button key={i} active size="small" style={{ width: '15%' }} />
            ))}
          </div>
          
          {/* 行数据模拟 */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex justify-between py-4 border-b border-gray-50 last:border-0">
              <div className="flex flex-col gap-2 w-[15%]">
                <Skeleton.Button active size="small" style={{ width: '80%' }} />
                <Skeleton.Button active size="small" style={{ width: '40%' }} />
              </div>
              <div className="flex items-center w-[15%]">
                <Skeleton.Avatar active size="small" shape="circle" className="mr-2" />
                <Skeleton.Button active size="small" style={{ width: '60%' }} />
              </div>
              <div className="flex items-center justify-center w-[15%]">
                <Skeleton.Button active size="small" style={{ width: '50%' }} />
              </div>
              <div className="flex items-center w-[30%]">
                <Skeleton.Input active size="small" style={{ width: '90%' }} />
              </div>
              <div className="flex items-center justify-center w-[15%]">
                <Skeleton.Button active size="small" style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DataTableSkeleton;
