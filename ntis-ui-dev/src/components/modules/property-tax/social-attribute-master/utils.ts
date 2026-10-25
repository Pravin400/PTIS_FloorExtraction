export function getDataTypeBadgeVariant(dataType: string): 'success' | 'warning' | 'default' {
  const type = String(dataType || '').toUpperCase();
  if (type === 'BIT') return 'success';
  if (type === 'INTEGER' || type === 'INT') return 'warning';
  return 'default';
}
