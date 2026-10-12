"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Question = { id: string; order: number; text: string; type: string; options: string[]; required: boolean };
const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL || "https://script.google.com/macros/s/AKfycbwqLgyYZ-PqV03Kg7dY6ui5qrjOZscS1HXItyb7PQyQprpRCSd05Mz3NPybRGZgTze-wg/exec";

export default function FinalSurveyPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "done" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    post("getPublicFinalSurvey", {}).then((data) => {
      if (!data.ok) throw new Error(String(data.error || "Khảo sát chưa được mở."));
      setQuestions((data.evaluationQuestions || []).map(mapQuestion));
      setStatus("ready");
    }).catch((error) => { setMessage(error.message); setStatus("error"); });
  }, []);

  const visible = useMemo(() => questions
    .filter((q) => {
      const consent = answers["FINALSURVEY-Q9"] || "";
      if (q.id === "FINALSURVEY-Q10") return /^[ABC]:/.test(consent);
      if (q.id === "FINALSURVEY-Q11") return /^F:/.test(consent);
      return true;
    })
    .sort((a, b) => getDisplayQuestionOrder(a) - getDisplayQuestionOrder(b)), [questions, answers]);
  const choose = (id: string, value: string) => setAnswers((current) => ({ ...current, [id]: value }));

  async function submit() {
    const missing = visible.filter((q) => (q.required || q.id === "FINALSURVEY-Q10" || q.id === "FINALSURVEY-Q11") && !answers[q.id]?.trim());
    if (missing.length) { setMessage(`Vui lòng trả lời câu ${getDisplayQuestionNumber(missing[0])}.`); document.getElementById(missing[0].id)?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    setStatus("saving"); setMessage("");
    try {
      const cohortId = new URLSearchParams(location.search).get("cohortId") || "K002";
      const result = await post("savePublicFinalSurvey", { answers, cohortId });
      if (!result.ok) throw new Error(String(result.error || "Chưa gửi được khảo sát."));
      setStatus("done"); scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chưa gửi được khảo sát."); setStatus("ready"); }
  }

  if (status === "loading" || status === "error" || status === "done") return <SurveyState status={status} message={message} />;
  return <main className="final-survey-page"><div className="final-survey-wrap">
    <header className="final-survey-hero"><img src="/sen-lotus-logo.png" alt="SEN Pharma" /><span>FINAL SURVEY</span><h1>Trải nghiệm chương trình<br />Lãnh Đạo Khai Tâm</h1><p>Cảm ơn bạn đã đồng hành cùng chương trình LÃNH ĐẠO KHAI TÂM – K02 trong 2 tháng vừa qua.</p><p>Sau khi hoàn thành các workshop và 21 ngày thực hành, SEN Pharma mong được lắng nghe trải nghiệm của bạn về toàn bộ hành trình.</p><p>Không có câu trả lời đúng hay sai. <strong>Chia sẻ của bạn là một món quà quý giá dành cho SEN Pharma.</strong> ❤️</p></header>
    <section className="survey-note"><strong>Thông tin phản hồi</strong><p>Khảo sát mặc định ẩn danh. Thông tin cá nhân chỉ được ghi nhận khi bạn tự nguyện cung cấp ở phần “Chia sẻ của bạn”.</p></section>
    {visible.map((q) => <QuestionCard key={q.id} question={q} value={answers[q.id] || ""} onChange={(value) => choose(q.id, value)} />)}
    {message ? <p className="survey-error">{message}</p> : null}
    <button className="survey-submit" disabled={status === "saving"} onClick={submit}>{status === "saving" ? <><LoaderCircle className="spin" /> Đang ghi nhận...</> : "Gửi chia sẻ"}</button>
    <p className="survey-thanks">SEN Pharma chân thành cảm ơn những chia sẻ của bạn!</p>
  </div></main>;
}

function QuestionCard({ question: q, value, onChange }: { question: Question; value: string; onChange: (v: string) => void }) {
  const scale = q.type === "scale";
  return <section className="survey-card" id={q.id}><div className="survey-number">{getDisplayQuestionNumber(q)}</div><h2>{q.text}{q.required || q.id === "FINALSURVEY-Q10" ? <em>*</em> : null}</h2>
    {scale ? <><div className="scale-labels"><span>{q.id === "FINALSURVEY-Q7" ? "Hoàn toàn không sẵn lòng" : "Hoàn toàn không đồng ý"}</span><span>{q.id === "FINALSURVEY-Q7" ? "Rất sẵn lòng" : "Hoàn toàn đồng ý"}</span></div><div className={`scale-options${q.id === "FINALSURVEY-Q7" ? " nps-scale" : ""}`}>{q.options.map((o) => <button type="button" className={value === o ? "selected" : ""} onClick={() => onChange(o)} key={o}>{o}</button>)}</div></> : q.type === "text" ? <textarea rows={q.id === "FINALSURVEY-Q10" ? 2 : 5} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Nhập chia sẻ của bạn..." /> : <div className="choice-options">{q.options.map((o) => <button type="button" className={value === o ? "selected" : ""} onClick={() => onChange(o)} key={o}><span className="radio" />{o.replace(/^[A-F]:\s*/, "")}</button>)}</div>}
  </section>;
}

function getDisplayQuestionNumber(question: Question) {
  if (question.id === "FINALSURVEY-Q10") return "9a";
  if (question.id === "FINALSURVEY-Q11") return "9b";
  if (question.id === "FINALSURVEY-Q12") return "10";
  return String(question.order);
}

function getDisplayQuestionOrder(question: Question) {
  if (question.id === "FINALSURVEY-Q10") return 9.1;
  if (question.id === "FINALSURVEY-Q11") return 9.2;
  if (question.id === "FINALSURVEY-Q12") return 10;
  return question.order;
}

function SurveyState({ status, message }: { status: string; message: string }) { return <main className="final-survey-page"><div className="survey-state"><img src="/sen-lotus-logo.png" alt="" />{status === "loading" ? <><LoaderCircle className="spin" /><h1>Đang mở khảo sát</h1><p>Vui lòng chờ trong giây lát...</p></> : status === "done" ? <><CheckCircle2 className="done" /><h1>Đã ghi nhận chia sẻ</h1><p>Cảm ơn bạn đã dành thời gian đồng hành cùng SEN Pharma.</p></> : <><h1>Chưa mở được khảo sát</h1><p>{message}</p><button onClick={() => location.reload()}>Thử lại</button></>}</div></main>; }
async function post(action: string, payload: Record<string, unknown>) { const r = await fetch(GAS_API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...payload }) }); if (!r.ok) throw new Error("Không kết nối được hệ thống."); return r.json(); }
function mapQuestion(row: Record<string, unknown>): Question { const raw = String(row.options || ""); return { id: String(row.id), order: Number(row.order), text: String(row.text), type: String(row.type), options: raw.split("|").map((x) => x.trim()).filter(Boolean), required: row.required === true || String(row.required).toLowerCase() === "true" }; }
