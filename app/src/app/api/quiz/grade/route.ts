// ============================================================================
// POST /api/quiz/grade — Giảng viên chấm tự luận + công bố điểm (thay gradeFinalQuiz)
// ----------------------------------------------------------------------------
// ADMIN ONLY. Body: { attemptId, essayScore (0-30), feedback?, publish? }
// finalScore = objectiveScore + essayScore. publish=true -> công bố cho học viên.
// ============================================================================
import { NextRequest } from "next/server";
import { fail, handle, ok, readMeta, requireAdmin } from "@/lib/http";
import { getServiceSupabase } from "@/lib/supabaseServer";
import { optString, reqString } from "@/lib/validators";
import { clampEssayScore } from "@/lib/quiz";

export async function POST(request: NextRequest) {
  return handle(async () => {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const attemptId = reqString(body.attemptId, "mã bài thi", 60);
    const essayScore = clampEssayScore(body.essayScore);
    const feedback = optString(body.feedback, 2000);
    const publish = body.publish === true || String(body.publish).toLowerCase() === "true";

    const db = getServiceSupabase();
    const { data: attempt } = await db.from("evaluation_responses").select("id, score, metadata").eq("id", attemptId).single();
    if (!attempt) return fail("Không tìm thấy bài thi.", 404, "ATTEMPT_NOT_FOUND");

    const objectiveScore = Number(attempt.score) || 0;
    const finalScore = objectiveScore + essayScore;
    const now = new Date().toISOString();
    const attemptMeta = readMeta(attempt);

    const { error } = await db
      .from("evaluation_responses")
      .update({
        score: finalScore,
        metadata: {
          ...(attemptMeta as Record<string, unknown>),
          essayScore,
          instructorFeedback: feedback,
          gradedBy: admin.profile.full_name,
          gradedAt: now,
          gradingStatus: publish ? "published" : "graded",
          publishedAt: publish ? now : (attemptMeta.publishedAt as string) || null,
        },
      })
      .eq("id", attemptId);
    if (error) throw error;

    return ok({ attemptId, objectiveScore, essayScore, finalScore, gradingStatus: publish ? "published" : "graded" });
  });
}
