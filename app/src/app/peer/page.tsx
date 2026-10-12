"use client";

import { ArrowLeft, CheckCircle2, ChevronRight, Pin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type RawRow = Record<string, unknown>;

type PeerQuestion = {
  id: string;
  order: number;
  text: string;
  type: string;
  options: string[];
  required: boolean;
  dimension: string;
};

type PeerTarget = {
  UserID: string;
  FullName: string;
  Email?: string;
};

type LoadState = "loading" | "email" | "ready" | "error" | "done" | "duplicate";

const GAS_API_URL =
  process.env.NEXT_PUBLIC_GAS_API_URL ||
  "https://script.google.com/macros/s/AKfycbwqLgyYZ-PqV03Kg7dY6ui5qrjOZscS1HXItyb7PQyQprpRCSd05Mz3NPybRGZgTze-wg/exec";

export default function PeerAssessmentPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [targetUserId, setTargetUserId] = useState("");
  const [templateId, setTemplateId] = useState("PEER-APP");
  const [target, setTarget] = useState<PeerTarget | null>(null);
  const [questions, setQuestions] = useState<PeerQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [respondentEmail, setRespondentEmail] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      await Promise.resolve();
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("target") || "";
      const targetTemplateId = params.get("template") || "PEER-APP";
      if (!active) return;
      setTargetUserId(targetId);
      setTemplateId(targetTemplateId);

      if (!targetId) {
        setState("error");
        setError("Link đánh giá chưa có mã học viên.");
        return;
      }

      try {
        const payload = await loadPeerAssessment(targetId);
        if (!payload.ok) throw new Error(payload.error || "Không tải được form đánh giá.");
        const questionRows = (payload.evaluationQuestions || []) as RawRow[];
        const mappedQuestions = questionRows
          .map(mapPeerQuestion)
          .filter((question: PeerQuestion | null): question is PeerQuestion => Boolean(question))
          .sort((a: PeerQuestion, b: PeerQuestion) => a.order - b.order);

        if (!mappedQuestions.length) {
          throw new Error("Chưa có bộ câu hỏi nhận đánh giá từ người khác.");
        }

        if (!active) return;
        setTarget(payload.targetUser || null);
        setQuestions(mappedQuestions);
        setState("email");
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Không tải được form đánh giá.");
        setState("error");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const activeQuestion = questions[activeIndex];
  const activeAnswer = activeQuestion ? answers[activeQuestion.id] || "" : "";
  const isTextQuestion = activeQuestion?.type === "text" || !activeQuestion?.options.length;
  const progressPercent = questions.length ? Math.round(((activeIndex + 1) / questions.length) * 100) : 0;
  const answeredCount = questions.filter((question) => Boolean(answers[question.id]?.trim())).length;
  const requiredQuestionCount = questions.filter((question) => question.required).length;
  const missingRequiredCount = questions.filter((question) => question.required && !answers[question.id]?.trim()).length;
  const canSubmit = useMemo(
    () => questions.filter((question) => question.required).every((question) => Boolean(answers[question.id]?.trim())),
    [answers, questions],
  );
  const activeQuestionIsValid = !activeQuestion?.required || Boolean(activeAnswer.trim());

  function chooseAnswer(questionId: string, value: string) {
    setError("");
    setAnswers((current) => ({ ...current, [questionId]: value }));
    if (activeIndex < questions.length - 1) {
      window.setTimeout(() => setActiveIndex((current) => Math.min(questions.length - 1, current + 1)), 220);
    }
  }

  function updateAnswer(questionId: string, value: string) {
    setError("");
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function goNext() {
    if (!activeQuestionIsValid) {
      setError("Vui lòng trả lời câu hiện tại trước khi chuyển sang câu tiếp theo.");
      return;
    }
    setError("");
    setActiveIndex((current) => Math.min(questions.length - 1, current + 1));
  }

  async function startAssessment() {
    if (checkingEmail) return;
    const email = respondentEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setError("Vui lòng nhập đúng email của bạn.");
      return;
    }

    setCheckingEmail(true);
    setError("");
    try {
      const payload = await postToGas("checkPeerAssessmentEmail", {
        targetUserId,
        templateId,
        respondentEmail: email,
      });
      if (!payload.ok) throw new Error(payload.error || "Chưa kiểm tra được email.");
      setRespondentEmail(email);
      setState(payload.duplicate ? "duplicate" : "ready");
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Chưa kiểm tra được email.");
    } finally {
      setCheckingEmail(false);
    }
  }

  async function submit() {
    if (saving) return;
    if (!activeQuestionIsValid) {
      setError("Vui lòng trả lời câu hiện tại trước khi hoàn tất.");
      return;
    }
    if (!canSubmit) {
      setError(`Còn ${missingRequiredCount} câu bắt buộc chưa trả lời.`);
      return;
    }
    setSaving(true);
    try {
      const payload = await postToGas("savePeerAssessment", {
        targetUserId,
        templateId,
        respondentEmail,
        answers,
      });
      if (!payload.ok && payload.code === "DUPLICATE_PEER_ASSESSMENT") {
        setState("duplicate");
        return;
      }
      if (!payload.ok) throw new Error(payload.error || "Chưa gửi được đánh giá.");
      setState("done");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Chưa gửi được đánh giá.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="ldkt-page peer-public-page">
      <div className="phone public-phone">
        <section className="peer-assessment-shell">
          {state === "loading" ? (
            <div className="card dynamic-evaluation-card peer-loading-card">
              <img alt="SEN Pharma" className="peer-loading-logo" src="/sen-lotus-logo.png" />
              <h1>Đang mở form đánh giá</h1>
              <p>Vui lòng chờ trong giây lát...</p>
            </div>
          ) : null}

          {state === "error" ? (
            <div className="card dynamic-evaluation-card">
              <span className="tag purple">Nhận đánh giá</span>
              <h2>Chưa mở được form</h2>
              <p className="muted">{error}</p>
            </div>
          ) : null}

          {state === "done" ? (
            <div className="card dynamic-evaluation-card peer-thankyou-card">
              <CheckCircle2 aria-hidden="true" />
              <span className="tag">Đã gửi</span>
              <h1>Cảm ơn bạn</h1>
              <p>
                Phản hồi của bạn đã được ghi nhận cho {target?.FullName || "học viên"}. Mỗi góp ý nhỏ đều giúp hành
                trình học tập rõ hơn.
              </p>
            </div>
          ) : null}

          {state === "duplicate" ? (
            <div className="card dynamic-evaluation-card peer-thankyou-card peer-duplicate-card">
              <CheckCircle2 aria-hidden="true" />
              <span className="tag">Đã ghi nhận trước đó</span>
              <h1>Bạn đã đánh giá rồi</h1>
              <p>
                Email này đã gửi đánh giá cho {target?.FullName || "học viên"} rồi.
              </p>
            </div>
          ) : null}

          {state === "email" ? (
            <div className="card dynamic-evaluation-card peer-email-card">
              <span className="tag purple">Nhận đánh giá</span>
              <div className="peer-public-header">
                <div>
                  <p className="peer-evaluate-for">Đánh giá cho</p>
                  <h1>{target?.FullName || "Học viên"}</h1>
                </div>
              </div>
              <div className="peer-email-intro">
                <h2>Nhập email để bắt đầu</h2>
                <p>Email chỉ được dùng để tránh một người gửi đánh giá hai lần cho cùng học viên.</p>
              </div>
              <label className="peer-email-field">
                <span>Email của người đánh giá</span>
                <input
                  autoComplete="email"
                  className="field"
                  disabled={checkingEmail}
                  inputMode="email"
                  onChange={(event) => {
                    setRespondentEmail(event.target.value);
                    setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void startAssessment();
                  }}
                  placeholder="tenban@email.com"
                  type="email"
                  value={respondentEmail}
                />
              </label>
              <button className="btn peer-email-submit" disabled={checkingEmail} onClick={startAssessment} type="button">
                {checkingEmail ? "Đang kiểm tra..." : "Bắt đầu đánh giá"}
                {!checkingEmail ? <ChevronRight aria-hidden="true" /> : null}
              </button>
              {error ? <p className="form-error">{error}</p> : null}
            </div>
          ) : null}

          {state === "ready" && activeQuestion ? (
            <div
              className="card dynamic-evaluation-card scenario-assessment-card peer-question-card question-slide-panel"
              key={activeQuestion.id}
            >
              <div className="peer-public-header">
                <div>
                  <p className="peer-evaluate-for">Đánh giá cho</p>
                  <h1>{target?.FullName || "Học viên"}</h1>
                </div>
              </div>

              <div className="scenario-assessment-head">
                <h2>
                  Câu {activeIndex + 1} / {questions.length}
                </h2>
              </div>
              <div className="scenario-progress" aria-label={`${progressPercent}% hoàn thành`}>
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="scenario-prompt-card">
                <p>{activeQuestion.text}</p>
              </div>

              {!isTextQuestion ? (
                <>
                  <div className="scenario-choice-title">
                    <Pin aria-hidden="true" />
                    <div>
                      <h3>Chọn phương án gần với người này nhất</h3>
                      <p>
                        Dựa trên <strong>hành vi thực tế</strong> bạn nhìn thấy hoặc trải nghiệm ở lãnh đạo này (đặc
                        biệt là <strong>khi người đó gặp áp lực</strong>), thay vì dựa vào tình cảm cá nhân hay ấn
                        tượng gần đây.
                      </p>
                    </div>
                  </div>

                  <div className="choice-options scenario-options peer-options">
                    {getDisplayOptions(activeQuestion.options, activeIndex + 1).map((option) => {
                      const parsed = parseChoiceOption(option);
                      const optionValue = getScenarioAnswerValue(option);
                      const selected = activeAnswer === optionValue || activeAnswer === option;

                      return (
                        <button
                          className={`scenario-option ${selected ? "active" : ""}`}
                          key={option}
                          onClick={() => chooseAnswer(activeQuestion.id, optionValue)}
                          type="button"
                        >
                          <span>{parsed.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="peer-text-question">
                  <div className="scenario-open-meta">
                    <strong>{getOpenQuestionTitle(activeQuestion)}</strong>
                    <span>{getOpenQuestionSubtitle(activeQuestion, questions)}</span>
                  </div>
                  <textarea
                    className="field"
                    onChange={(event) => updateAnswer(activeQuestion.id, event.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    value={activeAnswer}
                  />
                </div>
              )}

              <div className="scenario-form-actions">
                <button
                  className="ghost-btn"
                  disabled={activeIndex === 0 || saving}
                  onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
                >
                  <ArrowLeft aria-hidden="true" />
                  Quay lại
                </button>
                {activeIndex < questions.length - 1 ? (
                  <button
                    className="btn"
                    disabled={saving}
                    onClick={goNext}
                  >
                    Tiếp theo
                    <ChevronRight aria-hidden="true" />
                  </button>
                ) : (
                  <button className="btn" disabled={saving || !canSubmit} onClick={submit}>
                    {saving ? "Đang gửi..." : "Hoàn tất"}
                  </button>
                )}
              </div>
              <p className={`scenario-count ${missingRequiredCount ? "needs-attention" : ""}`}>
                {answeredCount}/{questions.length} câu đã trả lời
                {missingRequiredCount && activeIndex === questions.length - 1 ? (
                  <>
                    <span>Còn {missingRequiredCount}/{requiredQuestionCount} câu hỏi bắt buộc chưa trả lời.</span>
                    <span>Bấm nút Quay lại để hoàn thành.</span>
                  </>
                ) : null}
              </p>
              {error ? <p className="form-error">{error}</p> : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

async function loadPeerAssessment(targetUserId: string) {
  return postToGas("getPeerAssessment", { targetUserId });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function postToGas(action: string, payload: Record<string, unknown>) {
  const response = await fetch(GAS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) throw new Error(`Apps Script request failed: ${response.status}`);
  return response.json();
}

function mapPeerQuestion(row: RawRow): PeerQuestion | null {
  const id = stringFrom(valueByKeys(row, ["QuestionID", "question_id", "id"]));
  const text = stringFrom(valueByKeys(row, ["QuestionText", "question_text", "Text", "Câu hỏi"]));
  if (!id || !text) return null;
  const options = stringFrom(valueByKeys(row, ["Options", "options"]))
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  const rawType = normalizeKey(stringFrom(valueByKeys(row, ["QuestionType", "question_type", "Type", "type"])));
  const type = rawType || (options.length ? "single_choice" : "text");

  return {
    id,
    order: numberFrom(valueByKeys(row, ["Order", "order"]), 1),
    text,
    type: type === "singlechoice" ? "single_choice" : type,
    options,
    required: booleanFrom(valueByKeys(row, ["Required", "required"])),
    dimension: stringFrom(valueByKeys(row, ["Dimension", "dimension"])),
  };
}

function getOpenQuestionTitle(question: PeerQuestion) {
  const normalized = normalizeKey(`${question.dimension} ${question.id}`);
  if (normalized.includes("strength")) return "Điểm mạnh nổi bật";
  if (normalized.includes("improvement") || normalized.includes("develop")) return "Điểm cần phát triển";
  if (normalized.includes("observation") || normalized.includes("other")) return "Góp ý thêm";
  return `Câu hỏi mở ${question.order}`;
}

function getOpenQuestionSubtitle(question: PeerQuestion, questions: PeerQuestion[]) {
  const openQuestions = questions.filter((item) => item.type === "text" || !item.options.length);
  const openIndex = openQuestions.findIndex((item) => item.id === question.id);
  if (openIndex < 0) return "Câu hỏi mở";
  return `Câu hỏi mở ${openIndex + 1}/${openQuestions.length}`;
}

function parseChoiceOption(value: string) {
  const separatorIndex = value.indexOf("::");
  if (separatorIndex < 0) return { label: "", text: value };

  return {
    label: value.slice(0, separatorIndex).trim(),
    text: value.slice(separatorIndex + 2).trim(),
  };
}

function getDisplayOptions(options: string[], questionOrder = 1) {
  const scenarioOptions = options.map((option) => ({ option, value: getScenarioAnswerValue(option) }));
  const hasScenarioPair =
    scenarioOptions.some((item) => item.value === "reactive") &&
    scenarioOptions.some((item) => item.value === "creative");
  if (!hasScenarioPair) return options;
  const reactiveFirst = Math.abs(Number(questionOrder) || 1) % 2 === 1;

  return [...scenarioOptions]
    .sort((a, b) => getScenarioDisplayOrder(a.value, reactiveFirst) - getScenarioDisplayOrder(b.value, reactiveFirst))
    .map((item) => item.option);
}

function getScenarioDisplayOrder(value: string, reactiveFirst: boolean) {
  if (value === "reactive") return reactiveFirst ? 1 : 2;
  if (value === "creative") return reactiveFirst ? 2 : 1;
  return 3;
}

function getScenarioAnswerValue(option: string) {
  const normalized = normalizeScenarioKey(option);
  if (normalized.startsWith("phanung") || normalized.startsWith("reactive") || normalized.startsWith("reaction")) return "reactive";
  if (normalized.startsWith("sangtao") || normalized.startsWith("creative") || normalized.startsWith("creativity")) return "creative";
  return option;
}

function normalizeScenarioKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
}

function valueByKeys(row: RawRow, keys: string[]) {
  for (const key of keys) {
    if (row[key]) return row[key];
  }

  const normalizedKeys = keys.map(normalizeKey);
  for (const key of Object.keys(row)) {
    const normalized = normalizeKey(key);
    if (normalizedKeys.some((candidate) => normalized === candidate || normalized.includes(candidate))) {
      return row[key];
    }
  }

  return "";
}

function stringFrom(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function numberFrom(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanFrom(value: unknown) {
  if (typeof value === "boolean") return value;
  const normalized = normalizeKey(String(value || ""));
  return ["true", "yes", "co", "required", "1"].includes(normalized);
}

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
}
