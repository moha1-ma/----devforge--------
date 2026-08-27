import { validateSourceFile } from "./sourceFilePolicy";

export const MAX_VISITOR_ATTACHMENTS = 4;
export const MAX_VISITOR_TOTAL_BYTES = 16 * 1024 * 1024;

const mediaRules: Record<string, { kind: "image" | "video"; maxBytes: number }> = {
  "image/jpeg": { kind: "image", maxBytes: 5 * 1024 * 1024 },
  "image/png": { kind: "image", maxBytes: 5 * 1024 * 1024 },
  "image/webp": { kind: "image", maxBytes: 5 * 1024 * 1024 },
  "video/mp4": { kind: "video", maxBytes: 12 * 1024 * 1024 },
  "video/webm": { kind: "video", maxBytes: 12 * 1024 * 1024 },
};

export type VisitorAttachmentInput = { name: string; mimeType: string; base64: string };
export type ValidatedVisitorAttachment = { kind: "image" | "video" | "code"; safeName: string; mimeType: string; data: Buffer; sizeBytes: number };
const allowedMediaReferenceHosts = ["youtube.com", "youtu.be", "vimeo.com", "loom.com"];

export function validateMediaReferenceUrl(value?: string) {
  const raw = value?.trim();
  if (!raw) return undefined;
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("رابط الوسائط غير صالح"); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || !allowedMediaReferenceHosts.some(allowed => host === allowed || host.endsWith(`.${allowed}`))) throw new Error("رابط الوسائط يجب أن يكون من مزود فيديو مسموح وباستخدام HTTPS");
  return url.toString();
}

function safeAttachmentName(name: string) {
  const cleaned = name.trim().replaceAll("\\", "/").split("/").pop() || "attachment";
  if (!/^[a-zA-Z0-9_. -]{1,180}$/.test(cleaned) || cleaned.startsWith(".")) throw new Error("اسم المرفق غير صالح");
  return cleaned;
}

function decodeBase64(value: string) {
  if (!/^[a-zA-Z0-9+/=\s]+$/.test(value)) throw new Error("صيغة المرفق غير صالحة");
  return Buffer.from(value.replace(/\s/g, ""), "base64");
}

export function validateVisitorAttachment(input: VisitorAttachmentInput): ValidatedVisitorAttachment {
  const safeName = safeAttachmentName(input.name);
  const data = decodeBase64(input.base64);
  if (!data.length) throw new Error("لا يمكن إرسال مرفق فارغ");
  const media = mediaRules[input.mimeType];
  if (media) {
    if (data.length > media.maxBytes) throw new Error("حجم الوسائط يتجاوز الحد المسموح");
    return { kind: media.kind, safeName, mimeType: input.mimeType, data, sizeBytes: data.length };
  }
  const content = data.toString("utf8");
  if (content.includes("\uFFFD")) throw new Error("ملف الكود يجب أن يكون نصيًا بترميز UTF-8");
  const source = validateSourceFile(safeName, content);
  return { kind: "code", safeName: source.path, mimeType: "text/plain; charset=utf-8", data: Buffer.from(content, "utf8"), sizeBytes: source.sizeBytes };
}

export function validateVisitorSubmission(input: { visitorAlias?: string; category: "opinion" | "media" | "code" | "project"; title: string; content: string; mediaReferenceUrl?: string; consentAccepted: boolean; attachments: VisitorAttachmentInput[] }) {
  const title = input.title.trim();
  const content = input.content.trim();
  const visitorAlias = input.visitorAlias?.trim() || undefined;
  const mediaReferenceUrl = validateMediaReferenceUrl(input.mediaReferenceUrl);
  if (!input.consentAccepted) throw new Error("يتطلب الإرسال الموافقة على سياسة المراجعة والخصوصية");
  if (title.length < 3 || title.length > 180) throw new Error("عنوان المشاركة يجب أن يكون بين 3 و180 حرفًا");
  if (content.length < 12 || content.length > 6000) throw new Error("وصف المشاركة يجب أن يكون بين 12 و6000 حرف");
  if (visitorAlias && visitorAlias.length > 80) throw new Error("الاسم المستعار طويل جدًا");
  if (input.attachments.length > MAX_VISITOR_ATTACHMENTS) throw new Error("عدد المرفقات يتجاوز الحد المسموح");
  const attachments = input.attachments.map(validateVisitorAttachment);
  if (attachments.reduce((total, item) => total + item.sizeBytes, 0) > MAX_VISITOR_TOTAL_BYTES) throw new Error("الحجم الكلي للمرفقات يتجاوز الحد المسموح");
  return { visitorAlias, title, content, mediaReferenceUrl, attachments };
}

export const visitorSubmissionPolicyCopy = "المشاركات والمرفقات تبقى معلّقة ولا تصبح عامة تلقائيًا. لا ترسل بيانات شخصية أو أسرارًا أو محتوى لا تملك حق مشاركته. لا تُشغّل ملفات الكود وتُراجع يدويًا قبل أي نشر.";
