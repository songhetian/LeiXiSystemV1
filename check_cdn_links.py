#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import requests
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import time


def find_files_with_cdn_links(root_dir):
    """查找项目中包含CDN链接的文件"""
    cdn_files = []
    cdn_patterns = [
        r"https?://[^/\s]*cdn[^/\s]*\.[^/\s]+",
        r"https?://[^/\s]*static[^/\s]*\.[^/\s]+",
        r"https?://[^/\s]*fonts\.googleapis\.com",
        r"https?://[^/\s]*ajax\.googleapis\.com",
    ]

    # 常见的文件扩展名
    extensions = (".html", ".css", ".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".txt")

    for root, dirs, files in os.walk(root_dir):
        # 排除 node_modules 和 dist 目录
        dirs[:] = [
            d
            for d in dirs
            if d not in ("node_modules", "dist", "dist-react", "dist-app", ".git")
        ]

        for file in files:
            if file.endswith(extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()

                    # 检查是否包含CDN链接
                    for pattern in cdn_patterns:
                        if re.search(pattern, content):
                            cdn_files.append(file_path)
                            break
                except (UnicodeDecodeError, PermissionError):
                    # 跳过无法读取的文件
                    continue

    return cdn_files


def extract_cdn_links(file_path):
    """从文件中提取CDN链接"""
    cdn_links = []
    cdn_patterns = [
        r"https?://[^/\s]*cdn[^/\s]*\.[^/\s]+[^\'\"\)\s<>]*",
        r"https?://[^/\s]*static[^/\s]*\.[^/\s]+[^\'\"\)\s<>]*",
        r"https?://[^/\s]*fonts\.googleapis\.com[^\'\"\)\s<>]*",
        r"https?://[^/\s]*ajax\.googleapis\.com[^\'\"\)\s<>]*",
    ]

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        for pattern in cdn_patterns:
            links = re.findall(pattern, content)
            cdn_links.extend(links)
    except (UnicodeDecodeError, PermissionError):
        pass

    return list(set(cdn_links))  # 去重


def check_link_status(url, timeout=5):
    """检查链接状态"""
    try:
        # 对于Google Fonts链接，我们只检查域名是否可访问
        parsed_url = urlparse(url)
        if "fonts.googleapis.com" in url:
            # 对于Google Fonts，我们检查基础域名
            test_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        else:
            test_url = url

        response = requests.head(test_url, timeout=timeout, allow_redirects=True)
        return url, response.status_code, None
    except requests.exceptions.RequestException as e:
        return url, None, str(e)


def main():
    project_root = os.path.dirname(os.path.abspath(__file__))
    print(f"正在检查项目目录: {project_root}")

    # 查找包含CDN链接的文件
    print("\n正在查找包含CDN链接的文件...")
    cdn_files = find_files_with_cdn_links(project_root)

    if not cdn_files:
        print("✓ 未发现包含CDN链接的文件")
        return

    print(f"\n发现 {len(cdn_files)} 个包含CDN链接的文件:")
    for file in cdn_files:
        print(f"  - {file}")

    # 提取所有CDN链接
    print("\n正在提取CDN链接...")
    all_links = []
    for file in cdn_files:
        links = extract_cdn_links(file)
        all_links.extend([(file, link) for link in links])

    if not all_links:
        print("✓ 未发现CDN链接")
        return

    print(f"\n发现 {len(all_links)} 个CDN链接:")
    for file, link in all_links:
        print(f"  [{os.path.basename(file)}] {link}")

    # 检查链接状态
    print("\n正在检查链接状态...")
    links_to_check = list(set([link for _, link in all_links]))  # 去重

    results = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_url = {
            executor.submit(check_link_status, url): url for url in links_to_check
        }

        for future in as_completed(future_to_url):
            url, status_code, error = future.result()
            results[url] = {"status_code": status_code, "error": error}

            if status_code and status_code < 400:
                status = f"✓ 正常 ({status_code})"
            elif status_code:
                status = f"✗ 错误 ({status_code})"
            else:
                status = f"✗ 无法访问 ({error})"

            print(f"  {url}: {status}")

    # 输出需要替换的链接建议
    print("\n" + "=" * 50)
    print("建议替换的链接:")
    print("=" * 50)

    google_fonts_found = False
    for file, link in all_links:
        if "fonts.googleapis.com" in link:
            google_fonts_found = True
            print(f"\n[{os.path.basename(file)}] Google Fonts 链接:")
            print(f"  原链接: {link}")
            print(f"  建议替换为国内CDN:")
            print(
                f"    1. jsDelivr: https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css"
            )
            print(
                f"    2. Staticfile: https://cdn.staticfile.net/MaterialDesign-Webfont/7.4.47/css/materialdesignicons.min.css"
            )
            print(
                f"    3. BootCDN: https://cdn.bootcdn.net/ajax/libs/MaterialDesign-Webfont/7.4.47/css/materialdesignicons.min.css"
            )

    if not google_fonts_found:
        print("✓ 未发现需要替换的Google Fonts链接")


if __name__ == "__main__":
    main()
