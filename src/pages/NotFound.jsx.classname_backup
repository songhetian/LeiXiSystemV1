import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                <div className="text-8xl mb-4">404</div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">页面未找到</h1>
                <p className="text-gray-600 mb-6">
                    抱歉,您访问的页面不存在或已被移除
                </p>
                <div className="flex gap-3">
                    <Button onClick={() => window.history.back()}>
                        返回上页
                    </Button>
                    <Button onClick={() => window.location.href = '/'}>
                        返回首页
                    </Button>
                </div>
            </div>
        </div>
    )
}
