"""
修复按钮类名的脚本

此脚本将修复错误地放在 onClick 属性中的类名
"""

import os
import re
from pathlib import Path


class ButtonClassnameFixer:
    def __init__(self):
        self.stats = {"processed": 0, "modified": 0, "errors": 0}

    def fix_button_classnames(self, content):
        """修复按钮类名"""
        count = 0

        # 匹配错误的 onClick 属性格式（包含类名）
        pattern = r"(<Button[^>]*?)onClick=\{((?:[^}])*?(?:px-\d+|py-\d+|bg-[\w-]+|text-[\w-]+|rounded[\w-]*|hover:[\w-]+|transition[\w-]*|font-[\w-]+|shadow[\w-]*|disabled:[\w-]+|flex-\d*|w-full|h-\d*|\s)+[^}]*)\}([^>]*?)(>)"

        def replacer(match):
            nonlocal count
            prefix = match.group(1)
            classes_content = match.group(2).strip()
            suffix = match.group(3)
            closing = match.group(4)

            # 分离真正的 onClick 函数和类名
            # 查找可能的 onClick 函数（包含括号的）
            onclick_func_match = re.search(
                r"(\([^)]*\)\s*=>\s*\{[^}]*\}|\w+\([^)]*\)|\(\)=>[^},\s]*)",
                classes_content,
            )
            onclick_func = ""
            remaining_classes = classes_content

            if onclick_func_match:
                onclick_func = onclick_func_match.group(1)
                # 移除 onClick 函数部分
                remaining_classes = classes_content.replace(onclick_func, "").strip()

            # 构建正确的属性
            new_attrs = []
            if onclick_func:
                new_attrs.append(f"onClick={{{onclick_func}}}")

            # 如果还有剩余的内容，作为 className 添加
            if remaining_classes.strip():
                # 清理多余的空格和逗号
                clean_classes = re.sub(r"[{},\s]+", " ", remaining_classes).strip()
                if clean_classes:
                    new_attrs.append(f'className="{clean_classes}"')

            count += 1
            if new_attrs:
                return f"{prefix}{' '.join(new_attrs)}{suffix}{closing}"
            else:
                return f"{prefix}{suffix}{closing}"

        content = re.sub(pattern, replacer, content)

        self.stats["processed"] += count
        return content

    def process_file(self, filepath):
        """处理单个文件"""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            original_content = content

            # 修复按钮类名
            content = self.fix_button_classnames(content)

            # 如果有变化，写回文件
            if content != original_content:
                # 备份原文件
                backup_path = str(filepath) + ".classname_backup"
                with open(backup_path, "w", encoding="utf-8") as f:
                    f.write(original_content)

                # 写入新内容
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)

                self.stats["modified"] += 1
                return True, "已修复"
            else:
                return False, "无需修复"

        except Exception as e:
            self.stats["errors"] += 1
            return False, f"错误: {str(e)}"

    def run(self, src_dir):
        """运行修复"""
        src_path = Path(src_dir)

        # 要处理的文件扩展名
        extensions = [".jsx", ".js", ".tsx", ".ts"]

        print("=" * 70)
        print("开始修复按钮类名...")
        print("=" * 70)
        print()

        for ext in extensions:
            for jsx_file in src_path.rglob(f"*{ext}"):
                # 跳过 ui 目录中的文件
                if "ui" in str(jsx_file.relative_to(src_path)).split(os.sep):
                    continue

                # 跳过 node_modules 等目录
                if any(
                    skip_dir in str(jsx_file)
                    for skip_dir in ["node_modules", ".git", "dist", "build"]
                ):
                    continue

                # 只处理包含 Button 组件的文件
                try:
                    with open(jsx_file, "r", encoding="utf-8") as f:
                        content = f.read()

                    if "Button" in content and (
                        "@/components/ui/button" in content or "from" in content
                    ):
                        success, message = self.process_file(jsx_file)

                        if success:
                            print(f"✅ {jsx_file.name}: {message}")
                        elif "错误" in message:
                            print(f"❌ {jsx_file.name}: {message}")
                        elif "无需修复" not in message:
                            print(f"ℹ️  {jsx_file.name}: {message}")
                except:
                    continue

        print()
        print("=" * 70)
        print("修复完成！")
        print("=" * 70)
        print()
        print(f"📊 统计信息:")
        print(f"  - 处理文件数: {self.stats['modified']}")
        print(f"  - 错误数: {self.stats['errors']}")


if __name__ == "__main__":
    print(
        """
╔═════════════════════════════════════════════════════════
═════════╗
║
         ║
║              修复按钮类名工具
         ║
║
         ║
║  此脚本将修复错误地放在 onClick 属性中的类名              ║
║
         ║
║  ⚠️  使用前请务必备份代码！
         ║
║
         ║
╚═════════════════════════════════════════════════════════
═════════╝
    """
    )

    input("按 Enter 键开始修复...")

    fixer = ButtonClassnameFixer()
    fixer.run("d:/code/LeiXiSystem/src")

    print()
    print("✅ 全部完成！")
