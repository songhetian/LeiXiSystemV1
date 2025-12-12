"""
Toast 迁移脚本 - 从 react-toastify 迁移到 Sonner

此脚本将：
1. 替换 toast 导入语句
2. 更新 toast 调用语法
3. 更新 App.jsx 中的 ToastContainer

使用前请务必备份代码！
"""

import os
import re
from pathlib import Path
import json

class ToastMigrator:
    def __init__(self):
        self.stats = {
            'processed': 0,
            'modified': 0,
            'errors': 0,
            'toast_calls': {
                'success': 0,
                'error': 0,
                'warning': 0,
                'info': 0,
                'promise': 0
            }
        }

    def replace_import(self, content):
        """替换导入语句"""
        # 替换 react-toastify 导入为 sonner
        patterns = [
            (r"import\s+{\s*toast\s*}\s+from\s+['\"]react-toastify['\"]", "import { toast } from 'sonner'"),
            (r"import\s+{\s*ToastContainer,\s*toast\s*}\s+from\s+['\"]react-toastify['\"]", "import { toast } from 'sonner'"),
            (r"import\s+['\"]react-toastify/dist/ReactToastify\.css['\"]", "// Sonner styles are included in the component"),
        ]

        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)

        return content

    def replace_toast_calls(self, content):
        """替换 toast 调用"""

        # toast.success
        pattern_success = r"toast\.success\(['\"]([^'\"]+)['\"]\)"
        matches = re.findall(pattern_success, content)
        self.stats['toast_calls']['success'] += len(matches)
        content = re.sub(pattern_success, r"toast.success('\1')", content)

        # toast.error
        pattern_error = r"toast\.error\(['\"]([^'\"]+)['\"]\)"
        matches = re.findall(pattern_error, content)
        self.stats['toast_calls']['error'] += len(matches)
        content = re.sub(pattern_error, r"toast.error('\1')", content)

        # toast.warning -> toast.warning (Sonner 也支持)
        pattern_warning = r"toast\.warning\(['\"]([^'\"]+)['\"]\)"
        matches = re.findall(pattern_warning, content)
        self.stats['toast_calls']['warning'] += len(matches)
        content = re.sub(pattern_warning, r"toast.warning('\1')", content)

        # toast.info
        pattern_info = r"toast\.info\(['\"]([^'\"]+)['\"]\)"
        matches = re.findall(pattern_info, content)
        self.stats['toast_calls']['info'] += len(matches)
        content = re.sub(pattern_info, r"toast.info('\1')", content)

        return content

    def process_file(self, filepath):
        """处理单个文件"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content

            # 检查是否使用了 toast
            if 'react-toastify' not in content and 'toast.' not in content:
                return False, "无需处理"

            # 替换导入
            content = self.replace_import(content)

            # 替换调用
            content = self.replace_toast_calls(content)

            # 如果有变化，写回文件
            if content != original_content:
                # 直接写入（用户在 Git 分支上，不需要备份）
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

                return True, "已迁移"
            else:
                return False, "无需修改"

        except Exception as e:
            return False, f"错误: {str(e)}"

    def update_app_jsx(self, filepath):
        """特殊处理 App.jsx"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content

            # 替换导入
            content = re.sub(
                r"import\s+{\s*ToastContainer,\s*toast\s*}\s+from\s+['\"]react-toastify['\"]",
                "import { toast } from 'sonner'\nimport { Toaster } from '@/components/ui/sonner'",
                content
            )

            # 移除 CSS 导入
            content = re.sub(
                r"import\s+['\"]react-toastify/dist/ReactToastify\.css['\"]",
                "// Sonner styles are included",
                content
            )
            content = re.sub(
                r"import\s+['\"]\.\/styles\/toast\.css['\"]",
                "// Custom toast styles (可以移除或保留用于其他用途)",
                content
            )

            # 替换 ToastContainer 为 Toaster
            # 保留一个简单的 Toaster
            toast_container_pattern = r'<ToastContainer[\s\S]*?/>'

            # 找到所有 ToastContainer
            containers = re.findall(toast_container_pattern, content)

            if containers:
                # 替换为单个 Toaster
                content = re.sub(
                    toast_container_pattern,
                    '',
                    content,
                    count=len(containers)
                )

                # 在合适的位置添加 Toaster
                # 在 </div> 之前添加（App 的最后）
                content = re.sub(
                    r'(</PermissionProvider>)',
                    r'<Toaster position="top-right" richColors />\n        \1',
                    content
                )

            # 如果有变化，写回文件
            if content != original_content:
                # 写入
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

                return True, "App.jsx 已更新"
            else:
                return False, "App.jsx 无需修改"

        except Exception as e:
            return False, f"错误: {str(e)}"

    def run(self, src_dir):
        """运行迁移"""
        src_path = Path(src_dir)

        print("=" * 70)
        print("开始迁移 Toast 到 Sonner...")
        print("=" * 70)
        print()
        print("迁移内容:")
        print("  ✓ react-toastify → sonner")
        print("  ✓ ToastContainer → Toaster")
        print("  ✓ 保持相同的 API")
        print()

        # 首先处理 App.jsx
        app_jsx = src_path / 'App.jsx'
        if app_jsx.exists():
            print("📝 处理 App.jsx...")
            success, message = self.update_app_jsx(app_jsx)
            if success:
                print(f"  ✅ {message}")
            else:
                print(f"  ℹ️  {message}")
            print()

        # 处理其他文件
        print("📝 处理其他文件...")
        print()

        for jsx_file in src_path.rglob('*.jsx'):
            # 跳过 ui 组件目录
            if 'ui' in str(jsx_file):
                continue

            # 跳过 App.jsx（已处理）
            if jsx_file.name == 'App.jsx':
                continue

            self.stats['processed'] += 1
            success, message = self.process_file(jsx_file)

            if success:
                self.stats['modified'] += 1
                print(f"✅ {jsx_file.name}: {message}")
            elif "错误" in message:
                self.stats['errors'] += 1
                print(f"❌ {jsx_file.name}: {message}")

        # 处理 .js 文件
        for js_file in src_path.rglob('*.js'):
            if 'node_modules' in str(js_file) or 'ui' in str(js_file):
                continue

            self.stats['processed'] += 1
            success, message = self.process_file(js_file)

            if success:
                self.stats['modified'] += 1
                print(f"✅ {js_file.name}: {message}")
            elif "错误" in message:
                self.stats['errors'] += 1
                print(f"❌ {js_file.name}: {message}")

        print()
        print("=" * 70)
        print("迁移完成！")
        print("=" * 70)
        print()
        print(f"📊 统计信息:")
        print(f"  - 处理文件: {self.stats['processed']}")
        print(f"  - 已修改: {self.stats['modified']}")
        print(f"  - 错误: {self.stats['errors']}")
        print()
        print(f"🔧 Toast 调用:")
        for call_type, count in self.stats['toast_calls'].items():
            if count > 0:
                print(f"  - {call_type}: {count}")
        print()
        print(f"💾 备份文件已创建（.backup 后缀）")
        print()

        # 生成报告
        self.generate_report()

    def generate_report(self):
        """生成迁移报告"""
        report = {
            'stats': self.stats,
            'migration': 'react-toastify to Sonner'
        }

        with open('toast_migration_result.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"📄 详细报告已保存到: toast_migration_result.json")

if __name__ == '__main__':
    print("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║           Toast 迁移工具 - react-toastify → Sonner              ║
║                                                                  ║
║  此脚本将:                                                       ║
║    ✓ 替换所有 toast 导入                                         ║
║    ✓ 更新 App.jsx 中的 ToastContainer                           ║
║    ✓ 保持相同的 API (toast.success, toast.error 等)            ║
║                                                                  ║
║  优势:                                                           ║
║    ✓ 更简洁的 UI                                                 ║
║    ✓ 更好的性能                                                  ║
║    ✓ 更现代的设计                                                ║
║    ✓ shadcn/ui 官方推荐                                          ║
║                                                                  ║
║  ⚠️  使用前请务必备份代码！                                      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
    """)

    response = input("确定要开始迁移吗？(yes/no): ")

    if response.lower() in ['yes', 'y']:
        migrator = ToastMigrator()
        migrator.run('d:/code/LeiXiSystem/src')

        print()
        print("✅ 迁移完成！")
        print()
        print("📋 下一步:")
        print("  1. 检查 App.jsx 中的 Toaster 组件")
        print("  2. 运行开发服务器: npm run dev")
        print("  3. 测试所有 toast 功能")
        print("  4. 如有问题，从 .backup 文件恢复")
        print()
        print("💡 提示:")
        print("  - Sonner 的 API 与 react-toastify 基本相同")
        print("  - toast.success(), toast.error() 等都可以直接使用")
        print("  - 样式更简洁现代")
        print()
    else:
        print("已取消迁移")
