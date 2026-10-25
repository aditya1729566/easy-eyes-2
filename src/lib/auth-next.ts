export function safeAuthNext(value: string | null | undefined) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
    ? value
    : '/account';
}
