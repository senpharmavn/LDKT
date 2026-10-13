// ============================================================================
// quiz.ts — Logic chấm bài quiz cuối khóa (giữ nguyên quy tắc bản cũ)
// ----------------------------------------------------------------------------
// - Trắc nghiệm: chỉ chấm 10 câu ĐẦU TIÊN có answer_key, mỗi câu đúng = 7 điểm
//   (tối đa 70). So sánh sau khi chuẩn hoá (không phân biệt hoa/thường,
//   thứ tự đáp án chọn nhiều).
// - Tự luận (text): để giảng viên chấm tay, thang 0–30.
// - Điểm cuối = trắc nghiệm + tự luận. Đỗ khi >= pass_score của template.
// ============================================================================

export const QUIZ_AUTO_QUESTION_COUNT = 10;
export const QUIZ_POINTS_PER_QUESTION = 7;
export const QUIZ_MAX_ESSAY_SCORE = 30;

/** Chuẩn hoá đáp án về dạng 'A' / 'A,C' để so sánh (giữ nguyên logic Code.gs). */
export function canonicalQuizAnswer(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parts =
    raw.indexOf("|") >= 0
      ? raw.split("|")
      : /^(?:[A-D]\s*,\s*)+[A-D]$/i.test(raw)
        ? raw.split(",")
        : [raw];
  return parts
    .map((part) => {
      const match = String(part).trim().match(/^([A-D])(?:\s*:|$)/i);
      return match ? match[1].toUpperCase() : String(part).trim().toUpperCase();
    })
    .filter(Boolean)
    .sort()
    .join(",");
}

export type QuizQuestionForGrading = {
  question_id: string;
  question_type: string;
  answer_key: string | null;
};

/** Chấm trắc nghiệm tự động. Trả về điểm + chi tiết từng câu. */
export function gradeObjective(
  questions: QuizQuestionForGrading[],
  answers: Record<string, unknown>,
): { objectiveScore: number; details: { question_id: string; is_correct: boolean; points: number }[] } {
  const details: { question_id: string; is_correct: boolean; points: number }[] = [];
  let objectiveScore = 0;
  // GIỮ NGUYÊN quy tắc cũ: chỉ 10 câu đầu có answer_key
  const gradable = questions.filter((q) => q.answer_key && q.answer_key.trim()).slice(0, QUIZ_AUTO_QUESTION_COUNT);
  for (const q of gradable) {
    const expected = canonicalQuizAnswer(q.answer_key);
    const given = canonicalQuizAnswer(answers[q.question_id]);
    const isCorrect = Boolean(expected) && expected === given;
    const points = isCorrect ? QUIZ_POINTS_PER_QUESTION : 0;
    objectiveScore += points;
    details.push({ question_id: q.question_id, is_correct: isCorrect, points });
  }
  return { objectiveScore, details };
}

/** Kẹp điểm tự luận trong thang 0–30 (giảng viên chấm). */
export function clampEssayScore(value: unknown): number {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(QUIZ_MAX_ESSAY_SCORE, Math.round(n)));
}
