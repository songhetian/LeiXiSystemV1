"""
shadcn/ui 批量替换辅助脚本

这个脚本可以帮助快速替换文件中的 UI 组件。
使用方法：
1. 备份您的代码
2. 运行此脚本
3. 检查替换结果
4. 测试功能
"""

import os
import re
from pathlib import Path

# 替换规则
REPLACEMENTS = {
    # 导入语句替换
    'imports': [
        # 添加 shadcn/ui 导入
        {
            'pattern': r"^(import React.*from 'react')",
            'add_after': """
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
""".strip()
        }
    ],

    # Button 替换
    'button': [
        {
            'pattern': r'<button\s+([^>]*?)className="([^"]*?)"([^>]*?)>',
            'replace': r'<Button className="\2"\1\3>'
        },
        {
            'pattern': r'</button>',
            'replace': r'</Button>'
        }
    ],

    # Input 替换
    'input': [
        {
            'pattern': r'<input\s+type="text"([^>]*?)className="([^"]*?)"([^>]*?)/>',
            'replace': r'<Input type="text"\1className="\2"\3/>'
        },
        {
            'pattern': r'<input\s+type="password"([^>]*?)className="([^"]*?)"([^>]*?)/>',
            'replace': r'<Input type="password"\1className="\2"\3/>'
        },
        {
            'pattern': r'<input\s+type="email"([^>]*?)className="([^"]*?)"([^>]*?)/>',
            'replace': r'<Input type="email"\1className="\2"\3/>'
        }
    ],

    # Label 替换
    'label': [
        {
            'pattern': r'<label\s+([^>]*?)className="([^"]*?)"([^>]*?)>',
            'replace': r'<Label \1className="\2"\3>'
        },
        {
            'pattern': r'</label>',
            'replace': r'</Label>'
        }
    ],

    # Select 替换
    'select': [
        {
            'pattern': r'<select\s+([^>]*?)>',
            'replace': r'<Select \1>'
        },
        {
            'pattern': r'</select>',
            'replace': r'</Select>'
        },
        {
            'pattern': r'<option\s+value="([^"]*?)">([^<]*?)</option>',
            'replace': r'<SelectItem value="\1">\2</SelectItem>'
        }
    ]
}

def should_skip_file(filepath):
    """检查是否应该跳过此文件"""
    skip_patterns = [
        'node_modules',
        '.git',
        'dist',
        'build',
        'ui/',  # 跳过 ui 组件本身
        'Modal.jsx',  # 已替换
        'ConfirmDialog.jsx',  # 已替换
        'Login.jsx',  # 已替换
        'ChangePassword.jsx'  # 已替换
    ]

    filepath_str = str(filepath)
    return any(pattern in filepath_str for pattern in skip_patterns)

def analyze_file(filepath):
    """分析文件，返回需要替换的内容统计"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        stats = {
            'buttons': len(re.findall(r'<button', content)),
            'inputs': len(re.findall(r'<input\s+type="(text|password|email)"', content)),
            'labels': len(re.findall(r'<label', content)),
            'selects': len(re.findall(r'<select', content)),
            'textareas': len(re.findall(r'<textarea', content))
        }

        total = sum(stats.values())
        return total, stats
    except Exception as e:
        print(f"Error analyzing {filepath}: {e}")
        return 0, {}

def scan_project(src_dir):
    """扫描项目，生成替换报告"""
    src_path = Path(src_dir)
    files_to_replace = []

    for jsx_file in src_path.rglob('*.jsx'):
        if should_skip_file(jsx_file):
            continue

        total, stats = analyze_file(jsx_file)
        if total > 0:
            files_to_replace.append({
                'path': jsx_file,
                'total': total,
                'stats': stats
            })

    # 按替换数量排序
    files_to_replace.sort(key=lambda x: x['total'])

    return files_to_replace

def generate_report(files_to_replace, output_file='replacement_report.md'):
    """生成替换报告"""
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('# shadcn/ui 替换报告\n\n')
        f.write(f'## 总计\n\n')
        f.write(f'- 需要替换的文件: {len(files_to_replace)}\n')

        total_buttons = sum(f['stats'].get('buttons', 0) for f in files_to_replace)
        total_inputs = sum(f['stats'].get('inputs', 0) for f in files_to_replace)
        total_labels = sum(f['stats'].get('labels', 0) for f in files_to_replace)
        total_selects = sum(f['stats'].get('selects', 0) for f in files_to_replace)

        f.write(f'- 总 Button: {total_buttons}\n')
        f.write(f'- 总 Input: {total_inputs}\n')
        f.write(f'- 总 Label: {total_labels}\n')
        f.write(f'- 总 Select: {total_selects}\n\n')

        f.write('## 文件列表（按复杂度排序）\n\n')
        f.write('| 文件 | 总数 | Button | Input | Label | Select |\n')
        f.write('|------|------|--------|-------|-------|--------|\n')

        for file_info in files_to_replace:
            try:
                rel_path = file_info['path'].name  # 只使用文件名
            except:
                rel_path = str(file_info['path'])
            stats = file_info['stats']
            f.write(f"| {rel_path} | {file_info['total']} | "
                   f"{stats.get('buttons', 0)} | "
                   f"{stats.get('inputs', 0)} | "
                   f"{stats.get('labels', 0)} | "
                   f"{stats.get('selects', 0)} |\n")

    print(f'报告已生成: {output_file}')

if __name__ == '__main__':
    print('扫描项目...')
    src_dir = 'd:/code/LeiXiSystem/src'

    files = scan_project(src_dir)

    print(f'找到 {len(files)} 个需要替换的文件')
    print(f'总共需要替换约 {sum(f["total"] for f in files)} 个元素')

    generate_report(files)

    print('\n建议：')
    print('1. 先从简单的文件开始（替换数量少的）')
    print('2. 每次替换后测试功能')
    print('3. 使用 Git 管理版本，方便回滚')
    print('4. 查看 replacement_report.md 了解详情')
