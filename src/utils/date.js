export const formatDate = (dateInput, includeTime = false) => {
  if (!dateInput) return '-'

  // 如果是字符串，尝试直接提取日期部分（避免时区问题）
  if (typeof dateInput === 'string') {
    // 匹配 YYYY-MM-DD 格式（可能后面跟着时间）
    const m = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m && !includeTime) {
      return `${m[1]}-${m[2]}-${m[3]}`
    }
  }

  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`

  if (includeTime) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${dateStr} ${hours}:${minutes}:${seconds}`
  }

  return dateStr
}

export const formatDateTime = (dateInput) => formatDate(dateInput, true)
