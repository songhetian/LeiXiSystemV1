"""
清理按钮属性的脚本

此脚本将清理 Button 组件中错误的 onClick 属性
"""

import os
import re
from pathlib import Path


class ButtonAttributeCleaner:
    def __init__(self):
        self.stats = {"processed": 0, "modified": 0, "errors": 0}

    def clean_button_attributes(self, content):
        """清理按钮属性"""
        count = 0

        # 匹配错误的 onClick 属性格式
        pattern = r"(<Button[^>]*?)onClick=\{([^}]*?)(px-\d+|py-\d+|bg-[\w-]+|text-[\w-]+|rounded[\w-]*|hover:[\w-]+|transition[\w-]*|font-[\w-]+|shadow[\w-]*|disabled:[\w-]+|flex-\d*|w-full|h-\d*|\s)+([^}]*?)\}([^>]*?>)"

        def replacer(match):
            nonlocal count
            prefix = match.group(1)
            onclick_start = match.group(2).strip()
            # 忽略中间的类名部分
            onclick_end = match.group(4).strip()
            suffix = match.group(5)

            # 重构正确的 onClick 属性
            if onclick_start and onclick_end:
                new_onclick = f"onClick={{{onclick_start} {onclick_end}}}"
            elif onclick_start:
                new_onclick = f"onClick={{{onclick_start}}}"
            else:
                new_onclick = ""

            count += 1
            return f"{prefix}{new_onclick}{suffix}"

        content = re.sub(pattern, replacer, content)

        # 修复另一个常见的错误格式
        pattern2 = r"(<Button[^>]*?)onClick=\{(px-\d+|py-\d+|bg-[\w-]+|text-[\w-]+|rounded[\w-]*|hover:[\w-]+|transition[\w-]*|font-[\w-]+|shadow[\w-]*|disabled:[\w-]+|flex-\d*|w-full|h-\d*|\s)+\}([^>]*?>)"

        def replacer2(match):
            nonlocal count
            prefix = match.group(1)
            suffix = match.group(3)
            count += 1
            # 移除错误的 onClick 属性
            return f"{prefix}{suffix}"

        content = re.sub(pattern2, replacer2, content)

        self.stats["processed"] += count
        return content

    def process_file(self, filepath):
        """处理单个文件"""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            original_content = content

            # 清理按钮属性
            content = self.clean_button_attributes(content)

            # 如果有变化，写回文件
            if content != original_content:
                # 备份原文件
                backup_path = str(filepath) + ".attr_backup"
                with open(backup_path, "w", encoding="utf-8") as f:
                    f.write(original_content)

                # 写入新内容
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)

                self.stats["modified"] += 1
                return True, "已清理"
            else:
                return False, "无需清理"

        except Exception as e:
            self.stats["errors"] += 1
            return False, f"错误: {str(e)}"

    def run(self, src_dir):
        """运行清理"""
        src_path = Path(src_dir)

        # 要处理的文件扩展名
        extensions = [".jsx", ".js", ".tsx", ".ts"]

        print("=" * 70)
        print("开始清理按钮属性...")
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
                        elif "无需清理" not in message:
                            print(f"ℹ️  {jsx_file.name}: {message}")
                except:
                    continue

        print()
        print("=" * 70)
        print("清理完成！")
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
║              清理按钮属性工具
         ║
║
         ║
║  此脚本将清理 Button 组件中错误的 onClick 属性           ║
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

    input("按 Enter 键开始清理...")

    cleaner = ButtonAttributeCleaner()
    cleaner.run("d:/code/LeiXiSystem/src")

    print()
    print("✅ 全部完成！")
