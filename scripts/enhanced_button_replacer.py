"""
增强的按钮颜色替换脚本

此脚本将智能识别不同类型的按钮并为其分配合适的 shadcn/ui 变体:
- 危险/删除按钮 -> destructive
- 边框按钮 -> outline
- 幽灵/透明按钮 -> ghost
- 链接样式按钮 -> link
- 主要按钮 -> default
- 次要按钮 -> secondary
"""

import os
import re
from pathlib import Path
import json


class EnhancedButtonReplacer:
    def __init__(self):
        self.stats = {
            "processed": 0,
            "modified": 0,
            "errors": 0,
            "variants": {
                "default": 0,
                "destructive": 0,
                "outline": 0,
                "secondary": 0,
                "ghost": 0,
                "link": 0,
            },
        }

    def analyze_button_style(self, classname):
        """分析按钮样式并确定合适的 variant"""
        classname = classname.lower()

        # 危险/删除按钮 - destructive
        if any(
            keyword in classname
            for keyword in [
                "bg-red",
                "text-red",
                "destructive",
                "danger",
                "bg-error",
                "text-error",
                "delete",
                "remove",
            ]
        ):
            return "destructive"

        # 边框按钮 - outline
        if any(
            keyword in classname
            for keyword in ["border", "outline", "bg-white", "bg-transparent"]
        ) and not any(
            keyword in classname
            for keyword in ["bg-red", "bg-blue", "bg-green", "bg-primary"]
        ):
            return "outline"

        # 幽灵按钮 - ghost
        if any(
            keyword in classname
            for keyword in ["ghost", "bg-gray-100", "bg-gray-200", "hover:bg-gray"]
        ):
            return "ghost"

        # 链接按钮 - link
        if (
            any(
                keyword in classname
                for keyword in ["text-blue", "text-primary", "underline"]
            )
            and "bg-" not in classname
        ):
            return "link"

        # 次要按钮 - secondary
        if any(
            keyword in classname
            for keyword in ["bg-secondary", "bg-gray", "bg-neutral"]
        ):
            return "secondary"

        # 默认按钮 - primary/default
        return "default"

    def analyze_button_size(self, classname):
        """分析按钮尺寸"""
        classname = classname.lower()

        if any(
            keyword in classname
            for keyword in ["text-xs", "py-1", "px-2", "h-8", "h-9"]
        ):
            return "sm"
        elif any(
            keyword in classname
            for keyword in ["text-lg", "py-3", "py-4", "h-11", "h-12"]
        ):
            return "lg"
        elif "icon" in classname.lower():
            return "icon"
        else:
            return "default"

    def replace_buttons_in_content(self, content):
        """替换内容中的按钮"""
        count = 0

        # 匹配各种按钮模式
        patterns = [
            # 模式1: 带 onClick 和 className 的按钮
            (
                r'<button\s+([^>]*?)onClick=\{([^}]+?)\}([^>]*?)className="([^"]+?)"([^>]*?)>([^<]+?)</button>',
                2,
                4,
            ),
            # 模式2: 带 className 和 onClick 的按钮
            (
                r'<button\s+([^>]*?)className="([^"]+?)"([^>]*?)onClick=\{([^}]+?)\}([^>]*?)>([^<]+?)</button>',
                2,
                4,
            ),
            # 模式3: 简单带 className 的按钮
            (
                r'<button\s+([^>]*?)className="([^"]+?)"([^>]*?)>([^<]+?)</button>',
                2,
                None,
            ),
            # 模式4: 带 type="button" 的按钮
            (
                r'<button\s+type="button"([^>]*?)className="([^"]+?)"([^>]*?)>([^<]+?)</button>',
                2,
                None,
            ),
        ]

        modified_content = content

        for pattern, class_group, onclick_group in patterns:

            def button_replacer(match):
                nonlocal count
                groups = match.groups()
                classname = groups[class_group - 1]

                # 确定 variant
                variant = self.analyze_button_style(classname)
                self.stats["variants"][variant] += 1

                # 确定 size
                size = self.analyze_button_size(classname)

                # 构建新的按钮
                onclick_attr = ""
                if onclick_group and len(groups) >= onclick_group:
                    onclick_value = groups[onclick_group - 1]
                    onclick_attr = f" onClick={{{onclick_value}}}"

                # 获取按钮文本
                button_text = groups[-1]

                # 构建 variant 和 size 属性
                variant_attr = f' variant="{variant}"' if variant != "default" else ""
                size_attr = f' size="{size}"' if size != "default" else ""

                count += 1
                return f"<Button{onclick_attr}{variant_attr}{size_attr}>{button_text}</Button>"

            modified_content = re.sub(
                pattern, button_replacer, modified_content, flags=re.DOTALL
            )

        self.stats["processed"] += count
        return modified_content

    def process_file(self, filepath):
        """处理单个文件"""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            original_content = content

            # 替换按钮
            content = self.replace_buttons_in_content(content)

            # 如果有变化，写回文件
            if content != original_content:
                # 备份原文件
                backup_path = str(filepath) + ".backup"
                with open(backup_path, "w", encoding="utf-8") as f:
                    f.write(original_content)

                # 写入新内容
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)

                self.stats["modified"] += 1
                return True, "已替换"
            else:
                return False, "无需替换"

        except Exception as e:
            self.stats["errors"] += 1
            return False, f"错误: {str(e)}"

    def run(self, src_dir):
        """运行批量替换"""
        src_path = Path(src_dir)

        # 要处理的文件扩展名
        extensions = [".jsx", ".js", ".tsx", ".ts"]

        print("=" * 70)
        print("开始增强按钮颜色替换...")
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

                success, message = self.process_file(jsx_file)

                if success:
                    print(f"✅ {jsx_file.name}: {message}")
                elif "错误" in message:
                    print(f"❌ {jsx_file.name}: {message}")
                elif "无需替换" not in message:
                    print(f"ℹ️  {jsx_file.name}: {message}")

        print()
        print("=" * 70)
        print("处理完成！")
        print("=" * 70)
        print()
        print(f"📊 统计信息:")
        print(f"  - 处理文件数: {self.stats['modified']}")
        print(f"  - 错误数: {self.stats['errors']}")
        print()
        print(f"🎨 按钮变体统计:")
        for variant, count in self.stats["variants"].items():
            if count > 0:
                variant_name = {
                    "default": "主要按钮",
                    "destructive": "危险按钮",
                    "outline": "边框按钮",
                    "secondary": "次要按钮",
                    "ghost": "幽灵按钮",
                    "link": "链接按钮",
                }.get(variant, variant)
                print(f"  - {variant_name}: {count}")
        print()

        # 生成报告
        self.generate_report()

    def generate_report(self):
        """生成替换报告"""
        report = {"stats": self.stats, "timestamp": str(Path.cwd())}

        with open(
            "enhanced_button_replacement_report.json", "w", encoding="utf-8"
        ) as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"📄 详细报告已保存到: enhanced_button_replacement_report.json")


if __name__ == "__main__":
    print(
        """
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║              增强按钮颜色替换工具                                 ║
║                                                                  ║
║  此脚本将智能识别并替换按钮颜色变体:                             ║
║    ✓ 主要按钮 (default)                                          ║
║    ✓ 危险按钮 (destructive)                                      ║
║    ✓ 边框按钮 (outline)                                          ║
║    ✓ 次要按钮 (secondary)                                        ║
║    ✓ 幽灵按钮 (ghost)                                            ║
║    ✓ 链接按钮 (link)                                             ║
║                                                                  ║
║  ⚠️  使用前请务必备份代码！                                      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
    """
    )

    input("按 Enter 键开始替换...")

    replacer = EnhancedButtonReplacer()
    replacer.run("d:/code/LeiXiSystem/src")

    print()
    print("✅ 全部完成！")
    print()
    print("📋 下一步:")
    print("  1. 检查修改的文件")
    print("  2. 运行开发服务器: npm run dev")
    print("  3. 测试所有功能")
    print("  4. 如有问题，从 .backup 文件恢复")
    print()
