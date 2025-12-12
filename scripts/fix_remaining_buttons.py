"""
修复剩余按钮的脚本

此脚本将处理之前未被替换的按钮
"""

import os
import re
from pathlib import Path


class RemainingButtonFixer:
    def __init__(self):
        self.stats = {"processed": 0, "modified": 0, "errors": 0}

    def fix_remaining_buttons(self, content):
        """修复剩余的按钮"""
        count = 0

        # 匹配剩余的 button 标签
        # 模式1: 简单的 button 标签
        pattern1 = r"<button([^>]*?)>([^<]*?)</button>"

        def replacer1(match):
            nonlocal count
            attrs = match.group(1)
            text = match.group(2)

            # 清理属性中的多余内容
            attrs = attrs.strip()

            # 如果已经有 variant 或 size 属性，说明已经是 Button 组件
            if "variant=" in attrs or "size=" in attrs:
                return match.group(0)

            # 简单转换为 Button 组件
            count += 1
            if attrs:
                return f"<Button{attrs}>{text}</Button>"
            else:
                return f"<Button>{text}</Button>"

        # 只对明显不是 Button 组件的 button 标签进行替换
        if "<button" in content and "Button" not in content:
            content = re.sub(pattern1, replacer1, content)

        self.stats["processed"] += count
        return content

    def process_file(self, filepath):
        """处理单个文件"""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            original_content = content

            # 修复剩余按钮
            content = self.fix_remaining_buttons(content)

            # 如果有变化，写回文件
            if content != original_content:
                # 备份原文件
                backup_path = str(filepath) + ".backup2"
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
        print("开始修复剩余按钮...")
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

                # 只处理包含 <button 但不包含 Button 的文件
                try:
                    with open(jsx_file, "r", encoding="utf-8") as f:
                        content = f.read()

                    if (
                        "<button" in content
                        and "Button" not in content
                        and "@/components/ui/button" not in content
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
║              修复剩余按钮工具
         ║
║
         ║
║  此脚本将处理之前未被替换的按钮                          ║
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

    fixer = RemainingButtonFixer()
    fixer.run("d:/code/LeiXiSystem/src")

    print()
    print("✅ 全部完成！")
