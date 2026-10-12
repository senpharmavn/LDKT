"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EvaluationFormScreen } from "@/components/ldkt-screens";
import type {
  EvaluationQuestion,
  EvaluationQuestionType,
  EvaluationSessionType,
  EvaluationTemplate,
  Screen,
} from "@/types/ldkt";

type LoadState = "loading" | "ready" | "done" | "error";
type RawRow = Record<string, unknown>;

const QUERY_TEMPLATE_KEYS = ["template", "templateId", "form"];
const QUERY_WORKSHOP_KEYS = ["workshop", "workshopId", "ws"];
const QUERY_SESSION_KEYS = ["session", "sessionType"];
const QUERY_COHORT_KEYS = ["cohortId", "cohort", "CohortID"];

const GAS_API_URL =
  process.env.NEXT_PUBLIC_GAS_API_URL ||
  "https://script.google.com/macros/s/AKfycbwqLgyYZ-PqV03Kg7dY6ui5qrjOZscS1HXItyb7PQyQprpRCSd05Mz3NPybRGZgTze-wg/exec";

export default function PublicWorkshopEvaluationPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<LoadState>("loading");
  const [template, setTemplate] = useState<EvaluationTemplate | undefined>();
  const [rawQuestions, setRawQuestions] = useState<EvaluationQuestion[]>([]);
  const [cohortId, setCohortId] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPublicForm() {
      try {
        const params = new URLSearchParams(window.location.search);
        const templateParam = getQueryValue(params, QUERY_TEMPLATE_KEYS);
        const workshopParam = getQueryValue(params, QUERY_WORKSHOP_KEYS);
        const sessionParam = getQueryValue(params, QUERY_SESSION_KEYS) || "main";
        const cohortParam = getQueryValue(params, QUERY_COHORT_KEYS);
        setCohortId(cohortParam);

        const payload = await postToGas("getPublicWorkshopEvaluation", {
          cohortId: cohortParam,
          sessionType: sessionParam,
          templateId: templateParam,
          workshopId: workshopParam,
        });
        if (!mounted) return;

        if (!payload.ok) {
          throw new Error(String(payload.error || "Chưa có form đánh giá workshop đang mở."));
        }

        const selectedTemplate = mapTemplate((payload.template || {}) as RawRow);
        const questions = ((payload.evaluationQuestions || payload.questions || []) as RawRow[])
          .map(mapQuestion)
          .filter((question: EvaluationQuestion | null): question is EvaluationQuestion => Boolean(question))
          .sort(compareQuestions);

        if (!selectedTemplate || !questions.length) {
          throw new Error("Chưa có form đánh giá workshop đang mở.");
        }

        setTemplate(selectedTemplate);
        setRawQuestions(questions);
        setState("ready");
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Không mở được form đánh giá.");
        setState("error");
      }
    }

    void loadPublicForm();

    return () => {
      mounted = false;
    };
  }, []);

  const questions = useMemo(
    () =>
      rawQuestions.map((question, index) => ({
        ...question,
        order: question.order || index + 1,
      })),
    [rawQuestions],
  );

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  };

  const handleGo = (_screen: Screen) => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.assign("/");
  };

  const handleSave = async () => {
    if (!template) return;

    const missingRequiredCount = questions.filter((question) => question.required && !answers[question.id]?.trim()).length;
    if (missingRequiredCount) {
      setError(`Còn ${missingRequiredCount} câu bắt buộc chưa trả lời.`);
      setState("error");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const result = await postToGas("savePublicWorkshopEvaluation", {
        answers,
        cohortId,
        respondentType: "public",
        sessionType: template.sessionType,
        templateId: template.id,
        workshopId: template.workshopId,
      });
      if (!result.ok) {
        throw new Error(String(result.error || "Chưa gửi được đánh giá."));
      }
      setState("done");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Chưa gửi được đánh giá.");
      setState("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="ldkt-page peer-public-page">
      <div className="phone public-phone">
        <section className="peer-assessment-shell workshop-public-shell">
          {state === "loading" ? <PublicFormLoading /> : null}
          {state === "error" ? (
            <PublicFormMessage
              description={error || "Không mở được form đánh giá."}
              title="Chưa mở được form"
              onRetry={() => {
                setError("");
                setState("loading");
                window.location.reload();
              }}
            />
          ) : null}
          {state === "done" ? (
            <PublicFormMessage
              done
              description="Cảm ơn bạn đã hoàn thành đánh giá workshop."
              title="Đã ghi nhận đánh giá"
            />
          ) : null}
          {state === "ready" && template ? (
            <EvaluationFormScreen
              answers={answers}
              onAnswerChange={handleAnswerChange}
              onGo={handleGo}
              onSave={handleSave}
              questions={questions}
              saving={saving}
              template={template}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function PublicFormLoading() {
  return (
    <div className="card dynamic-evaluation-card public-form-state">
      <img alt="" src="/sen-lotus-logo.png" />
      <span className="tag green">Đánh giá Workshop</span>
      <h1>Đang mở form</h1>
      <p className="muted">Vui lòng chờ trong giây lát...</p>
    </div>
  );
}

function PublicFormMessage({
  description,
  done = false,
  onRetry,
  title,
}: {
  description: string;
  done?: boolean;
  onRetry?: () => void;
  title: string;
}) {
  return (
    <div className="card dynamic-evaluation-card public-form-state">
      <span className={done ? "success-icon" : "loading-icon"}>
        {done ? <CheckCircle2 aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
      </span>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      {onRetry ? (
        <button className="btn" onClick={onRetry}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

async function postToGas(action: string, payload: Record<string, unknown>) {
  const response = await fetch(GAS_API_URL, {
    body: JSON.stringify({ action, ...payload }),
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Không kết nối được hệ thống (${response.status}).`);
  }

  return response.json();
}

function mapTemplate(row: RawRow): EvaluationTemplate | null {
  const id = stringFrom(valueByKeys(row, ["id", "TemplateID", "templateId"]));
  const title = stringFrom(valueByKeys(row, ["title", "Title"]));
  if (!id || !title) return null;

  return {
    description: stringFrom(valueByKeys(row, ["description", "Description"])),
    formUrl: stringFrom(valueByKeys(row, ["formUrl", "FormURL", "URL"])),
    id,
    sessionType: normalizeSessionType(valueByKeys(row, ["sessionType", "SessionType"])),
    status: stringFrom(valueByKeys(row, ["status", "Status"])) || "active",
    title,
    type: "workshop",
    workshopId: stringFrom(valueByKeys(row, ["workshopId", "WorkshopID"])),
  };
}

function mapQuestion(row: RawRow): EvaluationQuestion | null {
  const id = stringFrom(valueByKeys(row, ["id", "QuestionID", "questionId"]));
  const templateId = stringFrom(valueByKeys(row, ["templateId", "TemplateID"]));
  const text = stringFrom(valueByKeys(row, ["text", "QuestionText", "questionText"]));
  if (!id || !templateId || !text) return null;

  return {
    dimension: stringFrom(valueByKeys(row, ["dimension", "Dimension"])),
    id,
    options: optionsFrom(valueByKeys(row, ["options", "Options"])),
    order: numberFrom(valueByKeys(row, ["order", "Order"]), 1),
    required: booleanFrom(valueByKeys(row, ["required", "Required"])),
    templateId,
    text,
    type: normalizeQuestionType(valueByKeys(row, ["type", "QuestionType", "questionType"])),
  };
}

function compareQuestions(first: EvaluationQuestion, second: EvaluationQuestion) {
  return first.order - second.order || first.id.localeCompare(second.id);
}

function getQueryValue(params: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = params.get(key);
    if (value?.trim()) return value.trim();
  }
  return "";
}

function valueByKeys(row: RawRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
}

function stringFrom(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function numberFrom(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanFrom(value: unknown) {
  if (typeof value === "boolean") return value;
  const normalized = stringFrom(value).toLowerCase();
  return ["true", "yes", "1", "x", "co", "có"].includes(normalized);
}

function optionsFrom(value: unknown) {
  if (Array.isArray(value)) return value.map(stringFrom).filter(Boolean);
  return stringFrom(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeQuestionType(value: unknown): EvaluationQuestionType {
  const normalized = stringFrom(value).toLowerCase();
  if (normalized === "scale") return "scale";
  if (normalized === "text") return "text";
  if (normalized === "single_choice") return "single_choice";
  if (normalized === "multi_choice") return "multi_choice";
  return "rating";
}

function normalizeSessionType(value: unknown): EvaluationSessionType {
  const normalized = stringFrom(value).toLowerCase();
  if (normalized === "onboard") return "onboard";
  if (normalized === "share_learn" || normalized === "share&learn" || normalized === "share") return "share_learn";
  if (normalized === "peer") return "peer";
  if (normalized === "self") return "self";
  return "main";
}
