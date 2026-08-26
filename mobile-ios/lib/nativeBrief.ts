export const NATIVE_BRIEF_STORAGE_KEY = "devforge.native-brief.v1";
export const NATIVE_BRIEF_MAX_LENGTH = 360;

export type NativeBriefRecord = {
  content: string;
  updatedAt: number;
};

type BriefValidation =
  | { ok: true; record: NativeBriefRecord }
  | { ok: false; message: string };

export function createNativeBriefRecord(input: string, updatedAt = Date.now()): BriefValidation {
  const content = input.trim();

  if (!content) {
    return { ok: false, message: "اكتب هدفًا أو خطوة واحدة على الأقل قبل الحفظ." };
  }

  if (content.length > NATIVE_BRIEF_MAX_LENGTH) {
    return { ok: false, message: `اجعل الموجز ${NATIVE_BRIEF_MAX_LENGTH} حرفًا أو أقل.` };
  }

  return { ok: true, record: { content, updatedAt } };
}

export function parseNativeBriefRecord(serialized: string | null): NativeBriefRecord | null {
  if (!serialized) return null;

  try {
    const value = JSON.parse(serialized) as Partial<NativeBriefRecord>;
    if (typeof value.content !== "string" || typeof value.updatedAt !== "number") return null;

    const validated = createNativeBriefRecord(value.content, value.updatedAt);
    return validated.ok ? validated.record : null;
  } catch {
    return null;
  }
}
