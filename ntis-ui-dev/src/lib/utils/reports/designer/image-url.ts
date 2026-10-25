export function safeImageUrl(value?: string) {
  return value &&
    (/^data:image\/(png|jpeg|jpg|gif|webp|bmp);base64,/i.test(value) ||
      /^https?:\/\//i.test(value) ||
      /^\/(?!\/)/.test(value))
    ? value
    : undefined;
}

