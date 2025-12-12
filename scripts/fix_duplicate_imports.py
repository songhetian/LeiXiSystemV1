"""
清理重复导入脚本

修复批量替换导致的重复导入问题
"""

import os
import re
from pathlib import Path

def remove_duplicate_imports(content):
    """移除重复的导入语句"""
    lines = content.split('\n')
    seen_imports = set()
    cleaned_lines = []

    for line in lines:
        # 检查是否是导入语句
        if line.strip().startswith('import '):
            # 标准化导入语句（移除空格）
            normalized = re.sub(r'\s+', ' ', line.strip())

            if normalized not in seen_imports:
                seen_imports.add(normalized)
                cleaned_lines.append(line)
            # 否则跳过重复的导入
        else:
            cleaned_lines.append(line)

    return '\n'.join(cleaned_lines)

def fix_file(filepath):
    """修复单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # 移除重复导入
        content = remove_duplicate_imports(content)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, "已修复"
        else:
            return False, "无需修复"

    except Exception as e:
        return False, f"错误: {str(e)}"

def main():
    src_path = Path('d:/code/LeiXiSystem/src')

    print("=" * 70)
    print("清理重复导入...")
    print("=" * 70)
    print()

    fixed_count = 0
    error_count = 0

    for jsx_file in src_path.rglob('*.jsx'):
        if 'ui' in str(jsx_file):
            continue

        success, message = fix_file(jsx_file)

        if success:
            fixed_count += 1
            print(f"✅ {jsx_file.name}: {message}")
        elif "错误" in message:
            error_count += 1
            print(f"❌ {jsx_file.name}: {message}")

    print()
    print("=" * 70)
    print("清理完成！")
    print("=" * 70)
    print()
    print(f"📊 统计:")
    print(f"  - 已修复: {fixed_count}")
    print(f"  - 错误: {error_count}")
    print()

if __name__ == '__main__':
    main()
