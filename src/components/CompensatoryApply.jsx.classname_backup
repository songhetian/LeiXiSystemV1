import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import CompensatoryLeaveModal from './CompensatoryLeaveModal'

const CompensatoryApply = () => {
  const [showModal, setShowModal] = React.useState(false)

  const handleSuccess = () => {
    toast.success('调休申请已提交,等待审批')
    setShowModal(false)
    // 提交成功后跳转到假期明细
    window.location.hash = '#/vacation-details'
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📅</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">申请调休</h1>
            <p className="text-gray-600 mb-8">将工作日调换为休息日，灵活安排您的时间</p>

            <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3">调休说明</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• <strong>步骤1</strong>：选择要休息的工作日（原本要上班的日期）</li>
                <li>• <strong>步骤2</strong>：选择调到哪天上班（原本休息的日期）</li>
                <li>• <strong>步骤3</strong>：选择上班班次并填写申请理由</li>
                <li>• 审批通过后，系统将自动调整排班</li>
              </ul>
            </div>

            <Button onClick={() => setShowModal(true)} size="lg">
              开始申请调休
            </Button>
          </div>
        </div>
      </div>

      <CompensatoryLeaveModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default CompensatoryApply
