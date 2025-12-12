"""
自动化 UI 组件替换脚本

此脚本将自动替换简单的 UI 元素为 shadcn/ui 组件
"""

import os
import re
from pathlib import Path

# 导入映射
IMPORT_ADDITIONS = """
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
"""

def add_imports(content, filepath):
    """添加必要的导入语句"""
    # 检查是否已经有 shadcn/ui 导入
    if '@/components/ui' in content:
        return content

    # 在第一个 import 之后添加
    lines = content.split('\n')
    import_index = -1

    for i, line in enumerate(lines):
        if line.strip().startswith('import ') and 'react' in line.lower():
            import_index = i
            break

    if import_index >= 0:
        # 插入导入
        lines.insert(import_index + 1, IMPORT_ADDITIONS.strip())
        return '\n'.join(lines)

    return content

def replace_simple_button(content):
    """替换简单的 button 为 Button"""
    # 只替换简单的 button（没有复杂属性的）
    pattern = r'<button\s+onClick=\{([^}]+)\}\s+className="([^"]+)"\s*>(.*?)</button>'

    def replacer(match):
        onclick = match.group(1)
        classname = match.group(2)
        text = match.group(3)

        # 简化 className
        if 'bg-primary' in classname or 'bg-blue' in classname:
            variant = ''
        elif 'bg-red' in classname or 'bg-destructive' in classname:
            variant = ' variant="destructive"'
        elif 'border' in classname and 'bg-white' in classname:
            variant = ' variant="outline"'
        elif 'bg-gray-100' in classname or 'bg-transparent' in classname:
            variant = ' variant="ghost"'
        else:
            variant = ''

        # 简化 size
        if 'text-xs' in classname or 'py-1' in classname:
            size = ' size="sm"'
        elif 'text-lg' in classname or 'py-4' in classname:
            size = ' size="lg"'
        else:
            size = ''

        return f'<Button onClick={{{onclick}}}{variant}{size}>{text}</Button>'

    content = re.sub(pattern, replacer, content, flags=re.DOTALL)
    return content

def replace_simple_input(content):
    """替换简单的 input 为 Input"""
    # type="text"
    content = re.sub(
        r'<input\s+type="text"([^>]*?)/>',
        r'<Input type="text"\1/>',
        content
    )

    # type="password"
    content = re.sub(
        r'<input\s+type="password"([^>]*?)/>',
        r'<Input type="password"\1/>',
        content
    )

    # type="email"
    content = re.sub(
        r'<input\s+type="email"([^>]*?)/>',
        r'<Input type="email"\1/>',
        content
    )

    return content

def replace_simple_label(content):
    """替换简单的 label 为 Label"""
    content = re.sub(
        r'<label\s+([^>]*?)>',
        r'<Label \1>',
        content
    )
    content = re.sub(
        r'</label>',
        r'</Label>',
        content
    )
    return content

def process_file(filepath):
    """处理单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # 添加导入
        content = add_imports(content, filepath)

        # 替换元素
        content = replace_simple_button(content)
        content = replace_simple_input(content)
        content = replace_simple_label(content)

        # 如果有变化，写回文件
        if content != original_content:
            # 备份原文件
            backup_path = str(filepath) + '.backup'
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)

            # 写入新内容
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

            return True, "已替换"
        else:
            return False, "无需替换"

    except Exception as e:
        return False, f"错误: {str(e)}"

def main():
    """主函数"""
    src_dir = Path('d:/code/LeiXiSystem/src')

    # 要跳过的文件
    skip_files = [
        'Login.jsx',
        'ChangePassword.jsx',
        'Modal.jsx',
        'ConfirmDialog.jsx',
        'TopNavbar.jsx'
    ]

    # 要跳过的目录
    skip_dirs = ['ui', 'node_modules', '.git']

    processed = 0
    modified = 0
    errors = 0

    print("开始批量替换...")
    print("=" * 60)

    for jsx_file in src_dir.rglob('*.jsx'):
        # 检查是否跳过
        if any(skip_dir in str(jsx_file) for skip_dir in skip_dirs):
            continue

        if jsx_file.name in skip_files:
            continue

        processed += 1
        success, message = process_file(jsx_file)

        if success:
            modified += 1
            print(f"✅ {jsx_file.name}: {message}")
        elif "错误" in message:
            errors += 1
            print(f"❌ {jsx_file.name}: {message}")

    print("=" * 60)
    print(f"\n处理完成！")
    print(f"- 处理文件: {processed}")
    print(f"- 已修改: {modified}")
    print(f"- 错误: {errors}")
    print(f"\n备份文件已创建（.backup 后缀）")
    print(f"请检查结果，如有问题可以从备份恢复")

if __name__ == '__main__':
    main()
