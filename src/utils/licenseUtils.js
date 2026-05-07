const LICENSE_REGEX = /^SV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

export function validateLicenseKey(key) {
  return LICENSE_REGEX.test(key.trim().toUpperCase())
}

export function formatLicenseInput(raw) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const parts = []
  if (cleaned.length > 0) parts.push(cleaned.slice(0, 2))
  if (cleaned.length > 2) parts.push(cleaned.slice(2, 6))
  if (cleaned.length > 6) parts.push(cleaned.slice(6, 10))
  if (cleaned.length > 10) parts.push(cleaned.slice(10, 14))
  return parts.join('-')
}

export function maskLicenseKey(key) {
  if (!key) return ''
  const parts = key.split('-')
  return parts.map((p, i) => (i < parts.length - 1 ? '****' : p)).join('-')
}
