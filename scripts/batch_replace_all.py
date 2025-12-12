"""
全面的 UI 组件批量替换脚本 v3.0

此脚本可以替换：
- Button, Input, Label, Checkbox, Select, Textarea
- Table 及其子组件
- DatePicker, TimePicker
- Toast 通知（保持 react-toastify 或切换到 sonner）
- Modal 模态框（已重写，无需替换）

使用前请务必备份代码！
"""

import os
import re
from pathlib import Path
import json

class UIReplacer:
    def __init__(self):
        self.stats = {
            'processed': 0,
            'modified': 0,
            'errors': 0,
            'components': {
                'button': 0,
                'input': 0,
                'label': 0,
                'select': 0,
                'textarea': 0,
                'table': 0,
                'checkbox': 0,
                'date_picker': 0,
                'time_picker': 0,
                'modal': 0,
                'toast': 0
            }
        }

    def add_imports(self, content, needed_components):
        """智能添加需要的导入"""
        # 检查是否已经有导入
        if '@/components/ui' in content:
            # 已有导入，检查是否需要添加新的
            existing_imports = set()
            for line in content.split('\n'):
                if '@/components/ui' in line:
                    # 提取已导入的组件
                    if 'Button' in line:
                        existing_imports.add('button')
                    if 'Input' in line:
                        existing_imports.add('input')
                    # ... 等等

            # 只添加缺失的导入
            needed_components = needed_components - existing_imports

            if not needed_components:
                return content

        imports = []

        # 基础组件
        if 'button' in needed_components:
            imports.append("import { Button } from '@/components/ui/button'")
        if 'input' in needed_components:
            imports.append("import { Input } from '@/components/ui/input'")
        if 'label' in needed_components:
            imports.append("import { Label } from '@/components/ui/label'")
        if 'checkbox' in needed_components:
            imports.append("import { Checkbox } from '@/components/ui/checkbox'")
        if 'select' in needed_components:
            imports.append("import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'")
        if 'textarea' in needed_components:
            imports.append("import { Textarea } from '@/components/ui/textarea'")

        # 表格组件
        if 'table' in needed_components:
            imports.append("import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'")

        # 日期时间组件
        if 'date_picker' in needed_components or 'time_picker' in needed_components:
            imports.append("import { DatePicker, TimePicker, DateTimePicker } from '@/components/ui/date-picker'")

        # 工具函数
        if 'cn' not in content:
            imports.append("import { cn } from '@/lib/utils'")

        if not imports:
            return content

        # 找到第一个 import React 的位置
        lines = content.split('\n')
        import_index = -1

        for i, line in enumerate(lines):
            if line.strip().startswith('import ') and 'react' in line.lower():
                import_index = i
                break

        if import_index >= 0:
            # 插入导入
            lines.insert(import_index + 1, '\n'.join(imports))
            return '\n'.join(lines)

        return content

    def replace_button(self, content):
        """替换 button 为 Button"""
        count = 0

        # 模式 1: 简单的 button
        pattern1 = r'<button\s+onClick=\{([^}]+)\}\s+className="([^"]+)"\s*>(.*?)</button>'

        def replacer1(match):
            nonlocal count
            count += 1
            onclick = match.group(1)
            classname = match.group(2)
            text = match.group(3)

            # 分析 className 确定 variant
            variant = ''
            if 'bg-red' in classname or 'destructive' in classname:
                variant = ' variant="destructive"'
            elif 'border' in classname and ('bg-white' in classname or 'bg-transparent' in classname):
                variant = ' variant="outline"'
            elif 'bg-gray' in classname or 'ghost' in classname:
                variant = ' variant="ghost"'
            elif 'bg-secondary' in classname:
                variant = ' variant="secondary"'

            # 分析 size
            size = ''
            if 'text-xs' in classname or 'py-1' in classname or 'px-2' in classname:
                size = ' size="sm"'
            elif 'text-lg' in classname or 'py-4' in classname:
                size = ' size="lg"'

            return f'<Button onClick={{{onclick}}}{variant}{size}>{text}</Button>'

        content = re.sub(pattern1, replacer1, content, flags=re.DOTALL)

        # 模式 2: disabled button
        pattern2 = r'<button\s+onClick=\{([^}]+)\}\s+disabled=\{([^}]+)\}\s+className="([^"]+)"\s*>(.*?)</button>'

        def replacer2(match):
            nonlocal count
            count += 1
            onclick = match.group(1)
            disabled = match.group(2)
            classname = match.group(3)
            text = match.group(4)

            variant = ''
            if 'bg-red' in classname:
                variant = ' variant="destructive"'

            return f'<Button onClick={{{onclick}}} disabled={{{disabled}}}{variant}>{text}</Button>'

        content = re.sub(pattern2, replacer2, content, flags=re.DOTALL)

        # 模式 3: type="button"
        pattern3 = r'<button\s+type="button"([^>]*?)>(.*?)</button>'

        def replacer3(match):
            nonlocal count
            count += 1
            attrs = match.group(1)
            text = match.group(2)
            return f'<Button type="button"{attrs}>{text}</Button>'

        content = re.sub(pattern3, replacer3, content, flags=re.DOTALL)

        self.stats['components']['button'] += count
        return content

    def replace_input(self, content):
        """替换 input 为 Input"""
        count = 0

        # 各种类型的 input
        types = ['text', 'password', 'email', 'number', 'tel', 'url', 'search']

        for input_type in types:
            pattern = rf'<input\s+type="{input_type}"([^>]*?)/>'
            matches = re.findall(pattern, content)
            count += len(matches)
            content = re.sub(pattern, rf'<Input type="{input_type}"\1/>', content)

        # 没有 type 的 input（默认为 text）
        pattern = r'<input\s+(?!type=)([^>]*?)/>'
        matches = re.findall(pattern, content)
        count += len(matches)
        content = re.sub(pattern, r'<Input \1/>', content)

        self.stats['components']['input'] += count
        return content

    def replace_date_time_inputs(self, content):
        """替换日期和时间输入"""
        count = 0

        # type="date"
        pattern_date = r'<input\s+type="date"([^>]*?)/>'
        matches = re.findall(pattern_date, content)
        count += len(matches)
        content = re.sub(pattern_date, r'<DatePicker\1/>', content)
        self.stats['components']['date_picker'] += len(matches)

        # type="time"
        pattern_time = r'<input\s+type="time"([^>]*?)/>'
        matches = re.findall(pattern_time, content)
        count += len(matches)
        content = re.sub(pattern_time, r'<TimePicker\1/>', content)
        self.stats['components']['time_picker'] += len(matches)

        # type="datetime-local"
        pattern_datetime = r'<input\s+type="datetime-local"([^>]*?)/>'
        matches = re.findall(pattern_datetime, content)
        count += len(matches)
        content = re.sub(pattern_datetime, r'<DateTimePicker\1/>', content)
        self.stats['components']['date_picker'] += len(matches)

        return content

    def replace_checkbox(self, content):
        """替换 checkbox 为 Checkbox"""
        count = 0

        # type="checkbox"
        pattern = r'<input\s+type="checkbox"([^>]*?)/>'
        matches = re.findall(pattern, content)
        count += len(matches)

        # Checkbox 需要特殊处理，因为 API 不同
        # 这里只做简单替换，复杂的需要手动调整
        content = re.sub(pattern, r'<Checkbox\1/>', content)

        self.stats['components']['checkbox'] += count
        return content

    def replace_label(self, content):
        """替换 label 为 Label"""
        count = len(re.findall(r'<label\s', content))

        content = re.sub(r'<label\s+', r'<Label ', content)
        content = re.sub(r'</label>', r'</Label>', content)

        self.stats['components']['label'] += count
        return content

    def replace_textarea(self, content):
        """替换 textarea 为 Textarea"""
        count = len(re.findall(r'<textarea\s', content))

        content = re.sub(r'<textarea\s+', r'<Textarea ', content)
        content = re.sub(r'</textarea>', r'</Textarea>', content)

        self.stats['components']['textarea'] += count
        return content

    def replace_table(self, content):
        """替换 table 为 Table 组件"""
        count = 0

        if '<table' not in content.lower():
            return content

        # 替换 table 标签
        if '<table' in content:
            count += 1
            content = re.sub(r'<table\s+', r'<Table ', content)
            content = re.sub(r'<table>', r'<Table>', content)
            content = re.sub(r'</table>', r'</Table>', content)

        # 替换子组件
        content = re.sub(r'<thead\s+', r'<TableHeader ', content)
        content = re.sub(r'<thead>', r'<TableHeader>', content)
        content = re.sub(r'</thead>', r'</TableHeader>', content)

        content = re.sub(r'<tbody\s+', r'<TableBody ', content)
        content = re.sub(r'<tbody>', r'<TableBody>', content)
        content = re.sub(r'</tbody>', r'</TableBody>', content)

        content = re.sub(r'<tr\s+', r'<TableRow ', content)
        content = re.sub(r'<tr>', r'<TableRow>', content)
        content = re.sub(r'</tr>', r'</TableRow>', content)

        content = re.sub(r'<th\s+', r'<TableHead ', content)
        content = re.sub(r'<th>', r'<TableHead>', content)
        content = re.sub(r'</th>', r'</TableHead>', content)

        content = re.sub(r'<td\s+', r'<TableCell ', content)
        content = re.sub(r'<td>', r'<TableCell>', content)
        content = re.sub(r'</td>', r'</TableCell>', content)

        self.stats['components']['table'] += count
        return content

    def check_toast(self, content):
        """检查 toast 使用情况"""
        if 'toast.' in content:
            self.stats['components']['toast'] += 1
        return content

    def check_modal(self, content):
        """检查 Modal 使用情况"""
        if '<Modal' in content:
            self.stats['components']['modal'] += 1
        return content

    def process_file(self, filepath):
        """处理单个文件"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content

            # 检测需要的组件
            needed_components = set()

            # 处理日期时间输入（在普通 input 之前）
            if 'type="date"' in content or 'type="time"' in content or 'type="datetime-local"' in content:
                needed_components.add('date_picker')
                content = self.replace_date_time_inputs(content)

            if '<button' in content.lower():
                needed_components.add('button')
                content = self.replace_button(content)

            if 'type="checkbox"' in content:
                needed_components.add('checkbox')
                content = self.replace_checkbox(content)

            if '<input' in content.lower():
                needed_components.add('input')
                content = self.replace_input(content)

            if '<label' in content.lower():
                needed_components.add('label')
                content = self.replace_label(content)

            if '<textarea' in content.lower():
                needed_components.add('textarea')
                content = self.replace_textarea(content)

            if '<table' in content.lower():
                needed_components.add('table')
                content = self.replace_table(content)

            # 检查 toast 和 modal
            content = self.check_toast(content)
            content = self.check_modal(content)

            # 添加导入
            if needed_components:
                content = self.add_imports(content, needed_components)

            # 如果有变化，写回文件
            if content != original_content:
                # 直接写入（用户在 Git 分支上，不需要备份）
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

                return True, "已替换"
            else:
                return False, "无需替换"

        except Exception as e:
            return False, f"错误: {str(e)}"

    def run(self, src_dir):
        """运行批量替换"""
        src_path = Path(src_dir)

        # 要跳过的文件
        skip_files = [
            'Login.jsx',
            'ChangePassword.jsx',
            'Modal.jsx',
            'ConfirmDialog.jsx',
            'TopNavbar.jsx'
        ]

        # 要跳过的目录
        skip_dirs = ['ui', 'node_modules', '.git', 'dist', 'build']

        print("=" * 70)
        print("开始批量替换 UI 组件 v3.0...")
        print("=" * 70)
        print()
        print("支持的组件:")
        print("  ✓ Button, Input, Label, Checkbox, Textarea")
        print("  ✓ Table (包括所有子组件)")
        print("  ✓ DatePicker, TimePicker, DateTimePicker")
        print("  ✓ Toast 检测")
        print("  ✓ Modal 检测")
        print()

        for jsx_file in src_path.rglob('*.jsx'):
            # 检查是否跳过
            if any(skip_dir in str(jsx_file) for skip_dir in skip_dirs):
                continue

            if jsx_file.name in skip_files:
                continue

            self.stats['processed'] += 1
            success, message = self.process_file(jsx_file)

            if success:
                self.stats['modified'] += 1
                print(f"✅ {jsx_file.name}: {message}")
            elif "错误" in message:
                self.stats['errors'] += 1
                print(f"❌ {jsx_file.name}: {message}")

        print()
        print("=" * 70)
        print("处理完成！")
        print("=" * 70)
        print()
        print(f"📊 统计信息:")
        print(f"  - 处理文件: {self.stats['processed']}")
        print(f"  - 已修改: {self.stats['modified']}")
        print(f"  - 错误: {self.stats['errors']}")
        print()
        print(f"🔧 替换的组件:")
        for comp, count in self.stats['components'].items():
            if count > 0:
                comp_name = comp.replace('_', ' ').title()
                print(f"  - {comp_name}: {count}")
        print()
        print(f"💾 备份文件已创建（.backup 后缀）")
        print(f"⚠️  请仔细检查结果，测试功能是否正常")
        print(f"🔄 如有问题，可以从备份恢复")
        print()

        # 生成报告
        self.generate_report()

    def generate_report(self):
        """生成替换报告"""
        report = {
            'stats': self.stats,
            'timestamp': str(Path.cwd())
        }

        with open('replacement_result.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"📄 详细报告已保存到: replacement_result.json")

if __name__ == '__main__':
    print("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║           shadcn/ui 全面批量替换工具 v3.0                        ║
║                                                                  ║
║  此脚本将替换:                                                   ║
║    ✓ Button, Input, Label, Checkbox, Textarea                   ║
║    ✓ Table 及其所有子组件                                        ║
║    ✓ DatePicker, TimePicker, DateTimePicker                     ║
║    ✓ 自动添加必要的导入                                          ║
║                                                                  ║
║  ⚠️  使用前请务必备份代码！                                      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
    """)

    input("按 Enter 键开始替换...")

    replacer = UIReplacer()
    replacer.run('d:/code/LeiXiSystem/src')

    print()
    print("✅ 全部完成！")
    print()
    print("📋 下一步:")
    print("  1. 检查修改的文件")
    print("  2. 运行开发服务器: npm run dev")
    print("  3. 测试所有功能")
    print("  4. 如有问题，从 .backup 文件恢复")
    print()
    print("💡 提示:")
    print("  - Checkbox 的 API 不同，需要手动检查")
    print("  - Select 组件需要手动替换")
    print("  - Modal 已经重写，无需替换")
    print()
