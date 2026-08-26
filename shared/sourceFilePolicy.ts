const textExtensions = new Set([
  "py", "html", "htm", "css", "js", "jsx", "ts", "tsx", "json", "md", "markdown", "yaml", "yml", "toml", "xml", "sql", "sh", "txt", "java", "c", "cpp", "h", "cs", "go", "rs", "php", "rb", "swift", "kt", "kts", "dart", "vue", "svelte",
]);

export const MAX_SOURCE_FILE_BYTES = 512 * 1024;

export function normalizeSourcePath(value: string): string {
  const normalized = value.trim().replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.startsWith(".")) {
    throw new Error("مسار الملف غير صالح");
  }
  if (!/^[a-zA-Z0-9_./@+-]+$/.test(normalized)) {
    throw new Error("يحتوي مسار الملف على محارف غير مسموحة");
  }
  return normalized;
}

export function detectSourceLanguage(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  const languages: Record<string, string> = { py: "python", html: "html", htm: "html", css: "css", js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", json: "json", md: "markdown", markdown: "markdown", yml: "yaml", yaml: "yaml", sh: "shell", sql: "sql", java: "java", c: "c", cpp: "cpp", h: "c", cs: "csharp", go: "go", rs: "rust", php: "php", rb: "ruby", swift: "swift", kt: "kotlin", kts: "kotlin", dart: "dart", vue: "vue", svelte: "svelte" };
  return languages[extension] ?? "text";
}

export function validateSourceFile(path: string, content: string): { path: string; language: string; sizeBytes: number } {
  const safePath = normalizeSourcePath(path);
  const extension = safePath.split(".").pop()?.toLowerCase() ?? "";
  if (!textExtensions.has(extension)) throw new Error("هذا النوع من الملفات غير مدعوم في محرر النصوص الآمن");
  const sizeBytes = new TextEncoder().encode(content).byteLength;
  if (sizeBytes > MAX_SOURCE_FILE_BYTES) throw new Error("حجم الملف يتجاوز الحد المسموح للاستيراد النصي");
  if (content.includes("\u0000")) throw new Error("لا يمكن استيراد الملفات الثنائية");
  return { path: safePath, language: detectSourceLanguage(safePath), sizeBytes };
}
