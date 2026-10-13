// ============================================================================
// evaluationQuestions.ts — lay cau hoi cho mot template, GOP ngan hang chung
// ----------------------------------------------------------------------------
// Hanh vi giong ban cu (Code.gs: getPublicWorkshopQuestions /
// getAppEvaluationQuestions), nhung thay fuzzy-match bang mapping xac dinh:
//   workshop     -> COMMON + cau hoi rieng cua template
//   self_before  -> SELF-COMMON + cau hoi rieng
//   other_before -> PEER-COMMON + cau hoi rieng
//   final_quiz / final_survey -> chi cau hoi rieng (khong co ngan hang chung)
// ============================================================================

const SHARED_BANK: Record<string, string> = {
  workshop: "COMMON",
  self_before: "SELF-COMMON",
  other_before: "PEER-COMMON",
};

export type TemplateRef = { id: string; type: string };

/** Danh sach template_id can lay cau hoi (ngan hang chung dung truoc). */
export function templateIdsForQuestions(template: TemplateRef): string[] {
  const ids = [template.id];
  const shared = SHARED_BANK[template.type];
  if (shared && shared !== template.id) ids.unshift(shared);
  return ids;
}

type Db = {
  from: (table: string) => {
    select: (cols: string) => {
      in: (col: string, ids: string[]) => {
        order: (col: string) => Promise<{ data: any[] | null; error: any }>;
      };
    };
  };
};

/**
 * Lay toan bo cau hoi cho mot template (da gop ngan hang chung),
 * sap xep: cau hoi chung truoc, roi den cau hoi rieng theo sort_order.
 */
export async function getQuestionsForTemplate<T = any>(
  db: Db,
  template: TemplateRef,
  columns = "*",
): Promise<T[]> {
  const ids = templateIdsForQuestions(template);
  const { data, error } = await db
    .from("evaluation_questions")
    .select(columns)
    .in("template_id", ids)
    .order("sort_order");
  if (error) throw error;
  const rank = new Map(ids.map((id, i) => [id, i]));
  return ((data || []) as any[]).sort(
    (a, b) =>
      (rank.get(a.template_id) ?? 99) - (rank.get(b.template_id) ?? 99) ||
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      String(a.question_id || "").localeCompare(String(b.question_id || "")),
  ) as T[];
}
