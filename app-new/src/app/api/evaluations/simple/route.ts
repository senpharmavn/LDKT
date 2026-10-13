// ============================================================================
// POST /api/evaluations/simple — Đánh giá nhanh workshop (thay saveEvaluation)
// ----------------------------------------------------------------------------
// Bản cũ lưu rating/feedback đơn giản theo (user, workshop). Bản mới lưu vào
// evaluation_responses với template tổng hợp "WS-SIMPLE" để đồng nhất pipeline.
// Body: { workshopId?, rating?, feedback? }
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, requireUser } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString } from "@/lib/validators";

const SIMPLE_TEMPLATE_ID = "WS-SIMPLE";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const workshopId = optString(body.workshopId, 20) || "WS3";
    const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating) || 5)));
    const feedback = optString(body.feedback, 2000);

    const db = getServiceSupabase();

    // Đảm bảo template tổng hợp tồn tại (tự tạo lần đầu)
    await db.from("evaluation_templates").upsert(
      {
        id: SIMPLE_TEMPLATE_ID,
        type: "workshop",
        workshop_id: null,
        title: "Đánh giá nhanh workshop",
        status: "active",
        is_open: true,
      },
      { onConflict: "id" },
    );

    const { data: existing } = await db
      .from("evaluation_responses")
      .select("id")
      .eq("user_id", user.id)
      .eq("template_id", SIMPLE_TEMPLATE_ID)
      .eq("metadata->>workshopId", workshopId)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      template_id: SIMPLE_TEMPLATE_ID,
      metadata: { workshopId, respondentType: "self", kind: "simple" },
      submitted_at: new Date().toISOString(),
    };

    let responseId: string;
    if (existing) {
      const { error } = await db.from("evaluation_responses").update(payload).eq("id", existing.id);
      if (error) throw error;
      responseId = existing.id;
      await db.from("evaluation_answers").delete().eq("response_id", responseId);
    } else {
      const { data, error } = await db.from("evaluation_responses").insert(payload).select("id").single();
      if (error) throw error;
      responseId = data.id;
    }

    await db.from("evaluation_answers").insert([
      { response_id: responseId, question_id: "rating", answer_value: rating },
      { response_id: responseId, question_id: "feedback", answer_text: feedback },
    ]);

    return ok({ responseId, mode: existing ? "updated" : "inserted" });
  });
}
