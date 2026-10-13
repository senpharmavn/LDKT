// ============================================================================
// validators.ts — Validate input đầu vào (gọn nhẹ, không cần zod)
// ----------------------------------------------------------------------------
// Mỗi hàm trả về chuỗi đã làm sạch, hoặc ném Error với message tiếng Việt
// để Route Handler bắt và trả 400.
// ============================================================================

export function reqString(value: unknown, field: string, maxLen = 500): string {
  const s = String(value ?? "").trim();
  if (!s) throw new Error(`Thiếu ${field}.`);
  if (s.length > maxLen) throw new Error(`${field} quá dài (tối đa ${maxLen} ký tự).`);
  return s;
}

export function optString(value: unknown, maxLen = 2000): string {
  const s = String(value ?? "").trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export function reqInt(value: unknown, field: string, min = 0, max = 1_000_000): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${field} không hợp lệ.`);
  return n;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Chuẩn hoá câu trả lời trắc nghiệm về dạng 'reactive' | 'creative' | nguyên bản. */
export function normalizeScenarioAnswer(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const key = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
  if (key === "reactive" || key === "phanung" || key.startsWith("phanung") || key.startsWith("reaction")) {
    return "reactive";
  }
  if (key === "creative" || key === "sangtao" || key.startsWith("sangtao") || key.startsWith("creativity")) {
    return "creative";
  }
  return raw;
}

/** Kiểm tra một câu hỏi đã được trả lời hay chưa. */
export function hasAnswerValue(answers: Record<string, unknown>, questionId: string): boolean {
  if (!answers || !Object.prototype.hasOwnProperty.call(answers, questionId)) return false;
  const v = answers[questionId];
  if (Array.isArray(v)) return v.some((item) => String(item ?? "").trim() !== "");
  return String(v ?? "").trim() !== "";
}

/** Điểm trung bình các câu rating/scale trong bộ đáp án. */
export function averageRating(answers: Record<string, unknown>): number {
  const nums = Object.values(answers)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

/** Câu trả lời text đầu tiên (làm feedback tóm tắt). */
export function firstTextAnswer(answers: Record<string, unknown>): string {
  for (const v of Object.values(answers)) {
    const s = String(v ?? "").trim();
    if (s && Number.isNaN(Number(s))) return s.slice(0, 500);
  }
  return "";
}
