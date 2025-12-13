const fs = require('fs');

// 检查图标文件是否存在
const iconPath = 'public/icons/logo.ico';
if (fs.existsSync(iconPath)) {
  const stats = fs.statSync(iconPath);
  console.log(`图标文件存在:`);
  console.log(`  路径: ${iconPath}`);
  console.log(`  大小: ${stats.size} bytes`);

  // 读取文件头来简单验证是否为有效的ICO文件
  const buffer = fs.readFileSync(iconPath);
  if (buffer.length >= 4) {
    const reserved = buffer.readUInt16LE(0);
    const type = buffer.readUInt16LE(2);
    console.log(`  文件头信息:`);
    console.log(`    Reserved: ${reserved} (应该为 0)`);
    console.log(`    Type: ${type} (应该为 1 表示图标)`);

    if (reserved === 0 && type === 1) {
      console.log(`  ✓ 图标文件格式基本正确`);
    } else {
      console.log(`  ✗ 图标文件格式可能不正确`);
    }
  }
} else {
  console.log(`图标文件不存在: ${iconPath}`);
}
