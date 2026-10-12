import {
  challenges,
  defaultCheckin,
  defaultEvaluation,
  getFallbackEvaluationQuestions,
  getFallbackEvaluationTemplates,
  student,
  workshops,
} from "@/data/mock";
import type {
  AssessmentSummaryRecord,
  CoachingRequest,
  CoachingSlot,
  Challenge,
  Checkin,
  CheckinRecord,
  DashboardData,
  Evaluation,
  EvaluationAnswerRecord,
  EvaluationQuestion,
  EvaluationQuestionType,
  EvaluationRecord,
  EvaluationSessionType,
  EvaluationTemplate,
  EvaluationType,
  FinalQuizResult,
  GroupCheckinRecord,
  LeaderboardUser,
  PeerGroupMember,
  PeerGroupOption,
  PracticeExercise,
  Student,
  Workshop,
  WorkshopStatus,
} from "@/types/ldkt";
import { readJson, writeJson } from "./local-store";

const GAS_API_URL =
  process.env.NEXT_PUBLIC_GAS_API_URL ||
  "https://script.google.com/macros/s/AKfycbwqLgyYZ-PqV03Kg7dY6ui5qrjOZscS1HXItyb7PQyQprpRCSd05Mz3NPybRGZgTze-wg/exec";
const STORAGE_KEYS = {
  checkin: "ldkt.phase1.checkin",
  evaluation: "ldkt.phase1.evaluation",
  evaluationResponses: "ldkt.phase1.evaluationResponses",
  dashboardCache: "ldkt.phase1.dashboardCache",
  authToken: "ldkt.auth.token",
};
let authTokenOverride = "";

type SheetDashboardResponse = {
  ok: boolean;
  user?: Record<string, unknown>;
  workshops?: Record<string, unknown>[];
  challenges?: Record<string, unknown>[];
  practiceExercises?: Record<string, unknown>[];
  checkins?: Record<string, unknown>[];
  evaluations?: Record<string, unknown>[];
  evaluationTemplates?: Record<string, unknown>[];
  evaluationQuestions?: Record<string, unknown>[];
  evaluationAnswers?: Record<string, unknown>[];
  finalQuizResults?: Record<string, unknown>[];
  peerFeedbackCount?: number;
  peerGroupOptions?: Record<string, unknown>[];
  peerGroupMembers?: Record<string, unknown>[];
  groupCheckins?: Record<string, unknown>[];
  assessmentSummary?: Record<string, unknown>[];
  users?: Record<string, unknown>[];
  studentStats?: Record<string, unknown>[];
  coachingRequests?: Record<string, unknown>[];
  coachingSlots?: Record<string, unknown>[];
  error?: string;
};

type GasSaveResponse = {
  ok?: boolean;
  code?: string;
  error?: string;
  mode?: "inserted" | "updated";
};

type LoginResponse = {
  ok?: boolean;
  token?: string;
  user?: Record<string, unknown>;
  error?: string;
};

type RegisterResponse = LoginResponse & {
  userId?: string;
};

export type RegistrationData = {
  fullName: string;
  birthYear: string;
  gender: string;
  email: string;
  phone: string;
  city: string;
  companyName: string;
  industryGroup: string;
  totalWorkingYears: string;
  isPeopleManager: string;
  teamSize: string;
  leadershipYears: string;
  acquisitionSource: string;
  registrationMotivation: string;
  leadershipChallenge: string;
};

export type SaveResult = {
  localSaved: boolean;
  remoteSaved: boolean;
  remoteConfigured: boolean;
  rejected?: boolean;
  code?: string;
  error?: string;
  mode?: "inserted" | "updated";
};

export type DashboardLoadResult = {
  data: DashboardData;
  remoteLoaded: boolean;
  remoteConfigured: boolean;
  fromCache?: boolean;
};

export type DashboardScope = "home" | "full";

export function getDashboard(): DashboardData {
  return {
    student,
    workshops,
    challenges,
    practiceExercises: [],
    checkins: [],
    evaluations: getLocalEvaluationResponses(),
    evaluationTemplates: getFallbackEvaluationTemplates("WS3", "Workshop 3"),
    evaluationQuestions: getFallbackEvaluationQuestions(getFallbackEvaluationTemplates("WS3", "Workshop 3").map((item) => item.id)),
    evaluationAnswers: [],
    finalQuizResults: [],
    peerFeedbackCount: 0,
    peerGroupOptions: [],
    peerGroupMembers: [],
    groupCheckins: [],
    assessmentSummary: [],
    coachingRequests: [],
    coachingSlots: [],
    leaderboardUsers: [
      { id: "LDKT019", name: "Trần Thị Ngọc Thảo", initials: "NT", batch: "K12", currentWorkshopIndex: 3, status: "Active" },
      { id: student.id, name: student.name, initials: student.initials, batch: student.batch, currentWorkshopIndex: 3, status: "Active" },
      { id: "LDKT020", name: "Trần Min Chan", initials: "MC", batch: "K12", currentWorkshopIndex: 3, status: "Active" },
    ],
    currentWorkshopIndex: 3,
    currentMiniChallengeDay: 1,
    miniChallengeTotalDays: getMiniChallengeTotalDays(challenges),
  };
}

export function getInitialAuthToken() {
  if (typeof window === "undefined") return "";
  const urlToken = new URLSearchParams(window.location.search).get("token") || "";
  const storedToken = window.localStorage.getItem(STORAGE_KEYS.authToken) || "";
  authTokenOverride = urlToken || storedToken;
  return authTokenOverride;
}

export function setAuthToken(token: string) {
  authTokenOverride = token;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEYS.authToken, token);
  }
}

export function clearAuthToken() {
  authTokenOverride = "";
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEYS.authToken);
  }
}

export async function loginUser(identifier: string, studentCode: string) {
  const cleanedIdentifier = identifier.trim();
  const cleanedStudentCode = studentCode.trim();
  if (!cleanedIdentifier || !cleanedStudentCode) return { ok: false, error: "Nhập email/số điện thoại và mã học viên" };

  if (!GAS_API_URL) {
    setAuthToken("demo-token");
    return { ok: true, token: "demo-token", user: student };
  }

  try {
    const url = new URL(GAS_API_URL);
    url.searchParams.set("action", "login");
    url.searchParams.set("identifier", cleanedIdentifier);
    url.searchParams.set("studentCode", cleanedStudentCode);
    url.searchParams.set("_ts", Date.now().toString());

    const response = await fetch(url.toString());
    const payload = (await response.json()) as LoginResponse;
    if (payload.ok && payload.token) {
      setAuthToken(payload.token);
      return { ok: true, token: payload.token, user: payload.user };
    }

    if (payload.error?.toLowerCase().includes("unknown action")) {
      return { ok: false, error: "Apps Script chưa cập nhật chức năng đăng nhập. Hãy deploy Code.gs mới." };
    }

    return { ok: false, error: payload.error || "Không tìm thấy học viên" };
  } catch (error) {
    console.warn(error);
    return { ok: false, error: "Không kết nối được hệ thống dữ liệu" };
  }
}

export async function registerUser(data: RegistrationData) {
  if (!data.fullName.trim() || !data.email.trim()) {
    return { ok: false, error: "Nhập họ tên và email để đăng ký nhé" };
  }

  if (!GAS_API_URL) {
    setAuthToken("demo-token");
    return { ok: true, token: "demo-token", userId: "LDKT001" };
  }

  try {
    const remote = await postToGas("registerParticipant", data) as RegisterResponse | null;
    if (remote?.ok && remote.token) {
      setAuthToken(remote.token);
      return { ok: true, token: remote.token, userId: remote.userId || stringFrom(remote.user?.UserID, "") };
    }

    return { ok: false, error: remote?.error || "Chưa đăng ký được học viên" };
  } catch (error) {
    console.warn(error);
    return { ok: false, error: "Không kết nối được hệ thống dữ liệu" };
  }
}

export async function loadDashboard(scope: DashboardScope = "home"): Promise<DashboardData> {
  return (await loadDashboardWithStatus(scope)).data;
}

export function getCachedDashboardSnapshot() {
  return getCachedDashboard();
}

export async function loadDashboardWithStatus(scope: DashboardScope = "home"): Promise<DashboardLoadResult> {
  const cachedDashboard = getCachedDashboard();

  if (!GAS_API_URL) {
    return {
      data: cachedDashboard || mergeLocalEvaluationResponses(getDashboard()),
      remoteLoaded: false,
      remoteConfigured: false,
      fromCache: Boolean(cachedDashboard),
    };
  }

  try {
    const url = new URL(GAS_API_URL);
    url.searchParams.set("action", "getDashboard");
    url.searchParams.set("token", getInviteToken());
    url.searchParams.set("scope", scope);
    url.searchParams.set("_ts", Date.now().toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      return getDashboardLoadFallback(cachedDashboard);
    }

    const payload = (await response.json()) as SheetDashboardResponse;
    if (!payload.ok) {
      return getDashboardLoadFallback(cachedDashboard);
    }

    const data = mergeLocalEvaluationResponses(mapDashboardResponse(payload));
    writeCachedDashboard(data);

    return {
      data,
      remoteLoaded: true,
      remoteConfigured: true,
    };
  } catch (error) {
    console.warn(error);
    return getDashboardLoadFallback(cachedDashboard);
  }
}

function getDashboardLoadFallback(cachedDashboard: DashboardData | null): DashboardLoadResult {
  if (cachedDashboard) {
    return {
      data: cachedDashboard,
      remoteLoaded: false,
      remoteConfigured: true,
      fromCache: true,
    };
  }

  return {
    data: mergeLocalEvaluationResponses(getDashboard()),
    remoteLoaded: false,
    remoteConfigured: true,
  };
}

function getCachedDashboard() {
  const token = getInviteToken();
  if (!token) return null;

  const cache = readJson<Record<string, { savedAt: string; data: DashboardData }>>(STORAGE_KEYS.dashboardCache, {});
  return cache[token]?.data ? mergeLocalEvaluationResponses(cache[token].data) : null;
}

function writeCachedDashboard(data: DashboardData) {
  const token = getInviteToken();
  if (!token) return;

  const cache = readJson<Record<string, { savedAt: string; data: DashboardData }>>(STORAGE_KEYS.dashboardCache, {});
  cache[token] = {
    savedAt: new Date().toISOString(),
    data,
  };
  writeJson(STORAGE_KEYS.dashboardCache, cache);
}

export function getCheckin() {
  return readJson<Checkin>(STORAGE_KEYS.checkin, defaultCheckin);
}

export async function saveCheckin(checkin: Checkin, day = 1, challenge?: Challenge) {
  writeJson(STORAGE_KEYS.checkin, checkin);
  const remote = await postToGas("saveCheckin", {
    ...getBasePayload(day, challenge?.workshopId, challenge?.id),
    completed: checkin.status === "done",
    practiceStatus: checkin.status,
    mood: checkin.mood,
    insight: checkin.insight,
    nextAction: checkin.nextAction,
  });

  return getSaveResult(remote);
}

export function getEvaluation() {
  return readJson<Evaluation>(STORAGE_KEYS.evaluation, defaultEvaluation);
}

export async function saveEvaluation(evaluation: Evaluation, workshopId = "WS3") {
  writeJson(STORAGE_KEYS.evaluation, evaluation);
  const remote = await postToGas("saveEvaluation", {
    ...getBasePayload(1, workshopId),
    rating: evaluation.rating,
    feedback: evaluation.feedback,
  });

  return getSaveResult(remote);
}

export async function saveEvaluationResponse(template: EvaluationTemplate, answers: Record<string, string>) {
  const remote = await postToGas("saveEvaluationResponse", {
    token: getInviteToken(),
    templateId: template.id,
    workshopId: template.workshopId,
    sessionType: template.sessionType,
    respondentType: template.type === "peer" ? "peer" : "self",
    answers,
  });

  if (remote && remote.ok === false) {
    return {
      localSaved: false,
      remoteConfigured: Boolean(GAS_API_URL),
      remoteSaved: false,
      rejected: true,
      code: remote.code,
      error: remote.error || "Chưa lưu được đánh giá.",
    };
  }

  saveLocalEvaluationResponse(template, answers);

  return getSaveResult(remote);
}

export async function startFinalQuiz(templateId: string) {
  const remote = await postToGas("startFinalQuiz", { token: getInviteToken(), templateId });
  if (!remote) return null;
  const raw = remote as { ok?: boolean; error?: string; attempt?: Record<string, unknown>; questions?: Record<string, unknown>[] };
  return {
    ...raw,
    attempt: raw.attempt ? mapFinalQuizResult(raw.attempt) : null,
    questions: (raw.questions || []).map(mapEvaluationQuestion).filter((item): item is EvaluationQuestion => Boolean(item)),
  };
}

export async function submitFinalQuiz(templateId: string, answers: Record<string, string>) {
  const remote = await postToGas("submitFinalQuiz", { token: getInviteToken(), templateId, answers });
  if (remote && remote.ok === false) {
    return { localSaved: false, remoteConfigured: Boolean(GAS_API_URL), remoteSaved: false, rejected: true, error: remote.error || "Chưa nộp được bài thi." };
  }
  return getSaveResult(remote);
}

export async function joinPeerGroup(groupId: string) {
  const remote = await postToGas("joinPeerGroup", {
    token: getInviteToken(),
    groupId,
  });

  return getSaveResult(remote);
}

export async function registerCoaching(explorationGoal: string) {
  return getSaveResult(await postToGas("registerCoaching", { token: getInviteToken(), explorationGoal }));
}

export async function bookCoachingSlot(slotId: string) {
  return getSaveResult(await postToGas("bookCoachingSlot", { token: getInviteToken(), slotId }));
}

export async function renamePeerGroup(groupId: string, groupName: string) {
  const remote = await postToGas("renamePeerGroup", {
    token: getInviteToken(),
    groupId,
    groupName,
  });

  return getSaveResult(remote);
}

export async function saveGroupCheckin(groupId: string, week: number, met: boolean, insight: string, nextAction: string) {
  const remote = await postToGas("saveGroupCheckin", {
    token: getInviteToken(),
    groupId,
    week,
    met,
    insight,
    nextAction,
  });

  return getSaveResult(remote);
}

export async function savePushSubscription(subscription: PushSubscriptionJSON) {
  return getSaveResult(await postToGas("savePushSubscription", {
    token: getInviteToken(),
    subscription,
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
  }));
}

export async function removePushSubscription(endpoint: string) {
  return getSaveResult(await postToGas("removePushSubscription", {
    token: getInviteToken(),
    endpoint,
  }));
}

export function isRemoteApiConfigured() {
  return Boolean(GAS_API_URL);
}

function getBasePayload(day = 1, workshopId = "WS3", challengeId = `MC3-D${day}`) {
  return {
    token: getInviteToken(),
    workshopId,
    challengeId,
    day,
  };
}

function getInviteToken() {
  if (typeof window === "undefined") return "";
  const urlToken = new URLSearchParams(window.location.search).get("token") || "";
  if (urlToken) {
    authTokenOverride = urlToken;
    window.localStorage.setItem(STORAGE_KEYS.authToken, urlToken);
  }

  return authTokenOverride || window.localStorage.getItem(STORAGE_KEYS.authToken) || "";
}

async function postToGas(action: string, payload: Record<string, unknown>): Promise<GasSaveResponse | null> {
  if (!GAS_API_URL) return null;

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      throw new Error(`Apps Script request failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function getSaveResult(remote: GasSaveResponse | null): SaveResult {
  return {
    localSaved: true,
    remoteConfigured: Boolean(GAS_API_URL),
    remoteSaved: Boolean(remote?.ok),
    rejected: Boolean(remote && !remote.ok),
    error: remote?.error,
    mode: remote?.mode,
  };
}

function getLocalEvaluationResponses() {
  const token = getInviteToken();
  const storedResponses = readJson<Record<string, EvaluationRecord[]> | EvaluationRecord[]>(STORAGE_KEYS.evaluationResponses, {});
  if (Array.isArray(storedResponses)) return storedResponses;
  const allResponses = storedResponses;
  return token ? allResponses[token] || [] : [];
}

function saveLocalEvaluationResponse(template: EvaluationTemplate, answers: Record<string, string>) {
  const token = getInviteToken();
  if (!token) return;

  const now = new Date().toISOString();
  const allResponses = readJson<Record<string, EvaluationRecord[]>>(STORAGE_KEYS.evaluationResponses, {});
  const current = getLocalEvaluationResponses().filter((item) => item.templateId !== template.id);
  const values = Object.values(answers);
  const numericValues = values.map(Number).filter(Number.isFinite);
  const feedback = values.find((value) => value && Number.isNaN(Number(value))) || "";
  const rating = numericValues.length
    ? Math.round((numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length) * 10) / 10
    : 0;

  allResponses[token] = [
    ...current,
    {
      id: `LOCAL-${template.id}`,
      workshopId: template.workshopId,
      templateId: template.id,
      sessionType: template.sessionType,
      respondentType: template.type === "peer" ? "peer" : "self",
      rating,
      feedback,
      updatedAt: now,
    },
  ];
  writeJson<Record<string, EvaluationRecord[]>>(STORAGE_KEYS.evaluationResponses, allResponses);
}

function mergeLocalEvaluationResponses(data: DashboardData) {
  const merged = new Map<string, EvaluationRecord>();

  data.evaluations.forEach((item) => {
    merged.set(getEvaluationMergeKey(item), item);
  });
  getLocalEvaluationResponses().forEach((item) => {
    merged.set(getEvaluationMergeKey(item), item);
  });

  return {
    ...data,
    evaluations: Array.from(merged.values()),
  };
}

function getEvaluationMergeKey(item: EvaluationRecord) {
  if (isPeerFeedbackEvaluationRecord(item)) return item.id || `${item.templateId}-${item.updatedAt}`;
  return item.templateId || item.workshopId || item.id;
}

function mapDashboardResponse(payload: SheetDashboardResponse): DashboardData {
  const mappedStudent = mapStudent(payload.user);
  const mappedWorkshops = sortWorkshops(
    (payload.workshops?.map(mapWorkshop).filter(Boolean) as Workshop[] | undefined) || [],
  );
  const mappedChallenges = payload.challenges?.map(mapChallenge).filter(Boolean) as Challenge[] | undefined;
  const mappedPracticeExercises = payload.practiceExercises?.map(mapPracticeExercise).filter(Boolean) as
    | PracticeExercise[]
    | undefined;
  const mappedCheckins = payload.checkins?.map(mapCheckinRecord).filter(Boolean) as CheckinRecord[] | undefined;
  const mappedEvaluations = payload.evaluations?.map(mapEvaluationRecord).filter(Boolean) as
    | EvaluationRecord[]
    | undefined;
  const mappedTemplates = payload.evaluationTemplates?.map(mapEvaluationTemplate).filter(Boolean) as
    | EvaluationTemplate[]
    | undefined;
  const mappedQuestions = payload.evaluationQuestions?.map(mapEvaluationQuestion).filter(Boolean) as
    | EvaluationQuestion[]
    | undefined;
  const mappedAnswers = payload.evaluationAnswers?.map(mapEvaluationAnswerRecord).filter(Boolean) as
    | EvaluationAnswerRecord[]
    | undefined;
  const mappedFinalQuizResults = (payload.finalQuizResults?.map(mapFinalQuizResult).filter(Boolean) || []) as FinalQuizResult[];
  const mappedUsers = payload.users?.map(mapLeaderboardUser).filter(Boolean) as LeaderboardUser[] | undefined;
  const usersById = new Map((mappedUsers || []).map((user) => [user.id, user]));
  const mappedStudentStats = payload.studentStats
    ?.map((row) => mapStudentStatsUser(row, usersById))
    .filter(Boolean) as LeaderboardUser[] | undefined;
  const leaderboardUsers = mappedStudentStats?.length
    ? mappedStudentStats
    : mappedUsers?.length
      ? mappedUsers
      : getDashboard().leaderboardUsers;
  const currentStudentStats = leaderboardUsers.find((user) => user.id === mappedStudent.id);
  const mappedGroupMembers = (payload.peerGroupMembers?.map((row) => mapPeerGroupMember(row, payload.users || [])).filter(Boolean) ||
    []) as PeerGroupMember[];
  const mappedGroupOptions = derivePeerGroupOptions(payload.peerGroupOptions || [], payload.peerGroupMembers || [], mappedGroupMembers);
  const mappedGroupCheckins = (payload.groupCheckins?.map(mapGroupCheckinRecord).filter(Boolean) || []) as GroupCheckinRecord[];
  const mappedAssessmentSummary = (payload.assessmentSummary?.map(mapAssessmentSummaryRecord).filter(Boolean) ||
    []) as AssessmentSummaryRecord[];
  const mappedCoachingRequests = (payload.coachingRequests?.map(mapCoachingRequest).filter(Boolean) || []) as CoachingRequest[];
  const mappedCoachingSlots = (payload.coachingSlots?.map(mapCoachingSlot).filter(Boolean) || []) as CoachingSlot[];
  const currentWorkshopIndex = getCurrentWorkshopIndex(
    mappedWorkshops,
    numberFrom(valueByKeys(payload.user || {}, ["CurrentWorkshop", "current_workshop"]), 1),
  );
  const checkinsFromSheet = getLatestBy(mappedCheckins || [], function (checkin) {
    return checkin.challengeId || String(checkin.day);
  });
  const evaluationsFromSheet = getLatestBy(mappedEvaluations || [], function (evaluation) {
    if (isPeerFeedbackEvaluationRecord(evaluation)) return evaluation.id;
    return evaluation.templateId || evaluation.workshopId || evaluation.id;
  });
  const dashboardChallenges = mappedChallenges?.length ? mappedChallenges : challenges;
  const miniChallengeTotalDays = getMiniChallengeTotalDays(dashboardChallenges);
  const currentWorkshop = getCurrentWorkshop(mappedWorkshops.length ? mappedWorkshops : workshops, currentWorkshopIndex);
  const fallbackTemplates = getFallbackEvaluationTemplates(
    currentWorkshop?.id || `WS${currentWorkshopIndex}`,
    currentWorkshop?.title || `Workshop ${currentWorkshopIndex}`,
  );
  const evaluationTemplates = mergeEvaluationTemplates(
    mappedTemplates || [],
    fallbackTemplates,
    currentWorkshop?.id || `WS${currentWorkshopIndex}`,
  );
  const evaluationQuestions = mappedQuestions?.length ? mappedQuestions : [];

  return {
    student: mappedStudent,
    workshops: mappedWorkshops.length ? mappedWorkshops : workshops,
    challenges: dashboardChallenges,
    practiceExercises: (mappedPracticeExercises || []).sort((a, b) => a.order - b.order),
    checkins: checkinsFromSheet,
    evaluations: evaluationsFromSheet,
    evaluationTemplates,
    evaluationQuestions,
    evaluationAnswers: mappedAnswers || [],
    finalQuizResults: mappedFinalQuizResults,
    peerFeedbackCount: Math.max(
      numberFrom(payload.peerFeedbackCount, countPeerFeedback(evaluationsFromSheet)),
      currentStudentStats?.peerFeedbackCount || 0,
      countPeerFeedbackAnswers(mappedAnswers || []),
    ),
    peerGroupOptions: mappedGroupOptions,
    peerGroupMembers: mappedGroupMembers,
    groupCheckins: mappedGroupCheckins,
    assessmentSummary: mappedAssessmentSummary,
    coachingRequests: mappedCoachingRequests,
    coachingSlots: mappedCoachingSlots,
    leaderboardUsers,
    currentWorkshopIndex,
    currentMiniChallengeDay: getCurrentMiniChallengeDay(checkinsFromSheet, miniChallengeTotalDays),
    miniChallengeTotalDays,
  };
}

function mapCoachingRequest(row: Record<string, unknown>): CoachingRequest | null {
  const id = valueByKeys(row, ["RequestID", "request_id"]);
  const userId = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
  if (!id || !userId) return null;
  return {
    id,
    userId,
    xp: numberFrom(valueByKeys(row, ["XP", "xp"]), 0),
    requestedAt: valueByKeys(row, ["RequestedAt", "requested_at"]),
    status: (valueByKeys(row, ["Status", "status"]) || "registered") as CoachingRequest["status"],
    assignedSlotId: valueByKeys(row, ["AssignedSlotID", "assigned_slot_id"]),
  };
}

function mapCoachingSlot(row: Record<string, unknown>): CoachingSlot | null {
  const id = valueByKeys(row, ["SlotID", "slot_id"]);
  if (!id) return null;
  return {
    id,
    startAt: valueByKeys(row, ["StartAt", "start_at"]),
    endAt: valueByKeys(row, ["EndAt", "end_at"]),
    coachName: valueByKeys(row, ["CoachName", "coach_name"]),
    meetingLink: valueByKeys(row, ["MeetingLink", "meeting_link"]),
    status: valueByKeys(row, ["Status", "status"]) || "open",
    bookedUserId: valueByKeys(row, ["BookedUserID", "UserID", "booked_user_id"]),
  };
}

function mapAssessmentSummaryRecord(row: Record<string, unknown>): AssessmentSummaryRecord | null {
  const userId = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
  if (!userId) return null;

  return {
    userId,
    dimension: valueByKeys(row, ["Dimension", "dimension", "Khía cạnh", "Khia canh"]) || "",
    selfScore: numberFrom(valueByKeys(row, ["SelfScore", "Self Score", "self_score"]), 0),
    peerScore: numberFrom(valueByKeys(row, ["PeerScore", "Peer Score", "peer_score"]), 0),
    insight: valueByKeys(row, ["Insight", "insight", "Gợi ý", "Goi y"]) || "",
    reportStatus: valueByKeys(row, ["ReportStatus", "Report Status", "Status", "status"]) || "",
    completedAt: valueByKeys(row, ["CompletedAt", "Completed At", "UpdatedAt", "updated_at"]) || "",
  };
}

function mapStudent(row?: Record<string, unknown>): Student {
  if (!row) return student;

  const name = valueByKeys(row, ["FullName", "full_name", "Name", "Họ tên", "Ho ten"]) || student.name;
  return {
    id: valueByKeys(row, ["UserID", "user_id", "participant_id"]) || student.id,
    name,
    initials: getInitials(name),
    batch: valueByKeys(row, ["Batch", "CohortID", "cohort_id"]) || student.batch,
    role: valueByKeys(row, ["Role", "role"]) || student.role,
    team: valueByKeys(row, ["Department", "CompanyName", "company_name"]) || student.team,
    email: valueByKeys(row, ["Email", "email", "Gmail", "Mail"]),
    participationStatus: valueByKeys(row, ["ParticipationStatus", "participation_status", "LearningStatus", "ProgramStatus"]) || "Active",
    reportUrl: valueByKeys(row, [
      "LeadershipReportLink",
      "LeadershipReportURL",
      "ReportURL",
      "LeadershipReport",
      "leadership_report_link",
      "ReportLink",
    ]),
  };
}

function mapLeaderboardUser(row: Record<string, unknown>): LeaderboardUser | null {
  const id = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
  const name = valueByKeys(row, ["FullName", "full_name", "Name"]);
  if (!id || !name) return null;

  return {
    id,
    name,
    initials: getInitials(name),
    batch: valueByKeys(row, ["Batch", "CohortID", "cohort_id"]),
    currentWorkshopIndex: numberFrom(valueByKeys(row, ["CurrentWorkshop", "current_workshop"]), 1),
    status: valueByKeys(row, ["Status", "ParticipationStatus", "participation_status"]) || "Active",
    xp: numberFrom(valueByKeys(row, ["XP", "Points", "TotalXP", "Score", "Điểm XP", "Diem XP"]), 0),
  };
}

function mapStudentStatsUser(row: Record<string, unknown>, usersById: Map<string, LeaderboardUser>): LeaderboardUser | null {
  const id = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
  if (!id) return null;

  const base = usersById.get(id);
  const name = valueByKeys(row, ["FullName", "full_name", "Name", "Ho ten"]) || base?.name || id;

  return {
    id,
    name,
    initials: getInitials(name),
    batch: valueByKeys(row, ["Batch", "CohortID", "cohort_id"]) || base?.batch || "",
    currentWorkshopIndex: numberFrom(
      valueByKeys(row, ["CurrentWorkshop", "current_workshop", "Workshop", "Current WS"]),
      base?.currentWorkshopIndex || 0,
    ),
    status: valueByKeys(row, ["Status", "ParticipationStatus", "participation_status"]) || base?.status || "Active",
    xp: numberFrom(valueByKeys(row, ["XP", "xp", "Points", "TotalXP", "Score"]), base?.xp || 0),
    rank: numberFrom(valueByKeys(row, ["Rank", "rank", "Hang", "Hạng"]), 0) || undefined,
    progress: numberFrom(valueByKeys(row, ["Progress", "ProgressPercent", "Completion", "CompletionRate"]), 0),
    checkinCount: numberFrom(valueByKeys(row, ["CheckinCount", "CheckInCount", "Check-in Count", "PracticeDays"]), 0),
    longestStreak: numberFrom(valueByKeys(row, ["LongestStreak", "Streak", "Longest Streak"]), 0),
    peerFeedbackCount: numberFrom(valueByKeys(row, ["PeerFeedbackCount", "PeerReviewCount", "Peer Reviews", "PeerCount"]), 0),
    selfAssessmentCount: numberFrom(valueByKeys(row, ["SelfAssessmentCount", "SelfCount", "Self Assessments"]), 0),
    evaluationCount: numberFrom(valueByKeys(row, ["EvaluationCount", "AssessmentCount", "FormCount"]), 0),
    lastCheckin: valueByKeys(row, ["LastCheckin", "LastCheckinAt", "Last Check-in", "LastActivity"]),
  };
}

function mapWorkshop(row: Record<string, unknown>): Workshop | null {
  const title = stringFrom(row.Title, "");
  if (!title) return null;

  return {
    id: stringFrom(row.WorkshopID, ""),
    order: numberFrom(row.Order, 0),
    title,
    description: stringFrom(row.Description, ""),
    status: normalizeWorkshopStatus(row.Status),
    scheduleDate: formatSheetDate(
      valueByKeys(row, ["ScheduleDate", "Date", "StartDate", "WorkshopDate", "Ngày", "Ngay", "Ngày bắt đầu", "Ngay bat dau"]),
    ),
    scheduleTime: firstString(row.ScheduleTime, row.Time, row.StartTime),
    location: firstString(row.Location, row.Room, row.Venue),
    flashcardUrl: valueByKeys(row, ["Flashcard URL", "FlashcardURL", "FlashcardUrl", "LessonURL", "Lesson URL", "Link", "URL", "Bài học", "Link bài học"]),
  };
}

function valueByKeys(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const directValue = row[key];
    const text = stringFrom(directValue, "");
    if (text) return text;
  }

  const normalizedKeys = keys.map(normalizeKey);
  for (const rowKey of Object.keys(row)) {
    const normalizedRowKey = normalizeKey(rowKey);
    if (normalizedKeys.some((key) => normalizedRowKey === key || normalizedRowKey.includes(key))) {
      const text = stringFrom(row[rowKey], "");
      if (text) return text;
    }
  }

  return "";
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const text = stringFrom(value, "");
    if (text) return text;
  }

  return "";
}

function sortWorkshops(items: Workshop[]) {
  return [...items].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

function mapChallenge(row: Record<string, unknown>): Challenge | null {
  const title = stringFrom(row.Title, "");
  if (!title) return null;

  return {
    id: stringFrom(row.ChallengeID, ""),
    workshopId: stringFrom(row.WorkshopID, ""),
    day: numberFrom(row.Day, 1),
    title,
    description: stringFrom(row.Description, ""),
    instruction: stringFrom(row.Instruction, ""),
    status: stringFrom(row.Status, "Active"),
    date: formatSheetDate(valueByKeys(row, ["Date", "ChallengeDate", "Challenge Date", "Ngay", "Ngày"])),
  };
}

function mapPracticeExercise(row: Record<string, unknown>): PracticeExercise | null {
  const id = valueByKeys(row, ["ExerciseID", "Exercise ID", "PracticeID", "ID"]);
  const title = valueByKeys(row, ["Title", "Name", "Tên bài tập", "Ten bai tap"]);
  if (!id || !title) return null;

  const type = valueByKeys(row, ["Type", "ExerciseType", "Loại", "Loai"]) || "timer";
  const durationSeconds = Math.max(
    1,
    numberFrom(valueByKeys(row, ["DurationSeconds", "Duration", "Seconds", "Thời lượng", "Thoi luong"]), 300),
  );

  return {
    id,
    title,
    description: valueByKeys(row, ["Description", "Mô tả", "Mo ta"]),
    instruction: valueByKeys(row, ["Instruction", "Instructions", "Hướng dẫn", "Huong dan"]),
    type: type.trim().toLowerCase(),
    durationSeconds,
    mediaUrl: valueByKeys(row, ["MediaURL", "Media URL", "AudioURL", "Audio URL", "URL"]) || undefined,
    linkedChallengeId:
      valueByKeys(row, ["LinkedChallengeID", "Linked Challenge ID", "ChallengeID", "Challenge ID"]) || undefined,
    status: (valueByKeys(row, ["Status", "Trạng thái", "Trang thai"]) || "locked").trim().toLowerCase(),
    order: numberFrom(valueByKeys(row, ["Order", "Thứ tự", "Thu tu", "STT"]), 0),
  };
}

function mapCheckinRecord(row: Record<string, unknown>): CheckinRecord | null {
  const id = stringFrom(row.CheckinID, "");
  const challengeId = stringFrom(row.ChallengeID, "");
  const dayFromChallenge = getDayFromChallengeId(challengeId);
  const day = dayFromChallenge || numberFrom(row.Day, 0);
  if (!id || !day) return null;

  return {
    id,
    workshopId: stringFrom(row.WorkshopID, ""),
    challengeId,
    day,
    completed: booleanFrom(row.Completed),
    mood: stringFrom(row.Mood, ""),
    insight: stringFrom(row.Insight, ""),
    nextAction: stringFrom(row.NextAction, ""),
    createdAt: stringFrom(row.CreatedAt, ""),
    updatedAt: stringFrom(row.UpdatedAt, ""),
  };
}

function getDayFromChallengeId(challengeId: string) {
  const match = challengeId.match(/(?:^|-)D(\d+)$/i);
  return match ? Number(match[1]) || 0 : 0;
}

function mapEvaluationRecord(row: Record<string, unknown>): EvaluationRecord | null {
  const id = firstString(row.EvaluationID, row.ResponseID);
  if (!id) return null;

  return {
    id,
    workshopId: stringFrom(row.WorkshopID, ""),
    templateId: stringFrom(row.TemplateID, ""),
    sessionType: stringFrom(row.SessionType, ""),
    respondentType: stringFrom(row.RespondentType, ""),
    rating: numberFrom(row.Rating, 0),
    feedback: stringFrom(row.Feedback, ""),
    updatedAt: stringFrom(row.UpdatedAt, ""),
  };
}

function mapEvaluationAnswerRecord(row: Record<string, unknown>): EvaluationAnswerRecord | null {
  const id = firstString(row.AnswerID, row.AnswerId, row.ID, row.Id);
  const responseId = firstString(row.ResponseID, row.EvaluationID, row.ResponseId, row.evaluation_id);
  const questionId = firstString(row.QuestionID, row.QuestionId, row.question_id);
  if (!questionId) return null;

  return {
    id: id || `${responseId || "ANS"}-${questionId}`,
    responseId,
    userId: stringFrom(row.UserID, ""),
    templateId: stringFrom(row.TemplateID, ""),
    questionId,
    value: stringFrom(row.Value, ""),
    createdAt: stringFrom(row.CreatedAt, ""),
    updatedAt: stringFrom(row.UpdatedAt, ""),
  };
}

function mapFinalQuizResult(row: Record<string, unknown>): FinalQuizResult | null {
  const attemptId = valueByKeys(row, ["AttemptID", "AttemptId", "attempt_id"]);
  if (!attemptId) return null;
  return {
    attemptId,
    templateId: valueByKeys(row, ["TemplateID", "template_id"]) || "FINALQUIZ",
    status: valueByKeys(row, ["Status", "AttemptStatus", "status"]),
    startedAt: valueByKeys(row, ["StartedAt", "started_at"]),
    expiresAt: valueByKeys(row, ["ExpiresAt", "expires_at"]),
    submittedAt: valueByKeys(row, ["SubmittedAt", "submitted_at"]),
    objectiveScore: numberFrom(valueByKeys(row, ["ObjectiveScore"]), 0),
    essayScore: numberFrom(valueByKeys(row, ["EssayScore"]), 0),
    finalScore: numberFrom(valueByKeys(row, ["FinalScore"]), 0),
    gradingStatus: valueByKeys(row, ["GradingStatus"]),
    feedback: valueByKeys(row, ["InstructorFeedback", "Feedback"]),
    publishedAt: valueByKeys(row, ["PublishedAt"]),
  };
}

function mapEvaluationTemplate(row: Record<string, unknown>): EvaluationTemplate | null {
  const id = valueByKeys(row, ["TemplateID", "TemplateId", "template_id", "ID", "Mã form", "Ma form"]);
  const title = valueByKeys(row, ["Title", "Tên form", "Ten form", "Name"]);
  if (!id || !title) return null;

  return {
    id,
    type: normalizeEvaluationType(valueByKeys(row, ["Type", "Loại", "Loai"]), title, valueByKeys(row, ["SessionType", "Session Type", "Phiên", "Phien"])),
    workshopId: valueByKeys(row, ["WorkshopID", "WorkshopId", "workshop_id", "Workshop"]),
    sessionType: normalizeSessionType(valueByKeys(row, ["SessionType", "Session Type", "Phiên", "Phien"])),
    title,
    description: valueByKeys(row, ["Description", "Mô tả", "Mo ta"]),
    status: normalizeEvaluationStatus(valueByKeys(row, ["Status", "Trạng thái", "Trang thai"])),
    formUrl: firstString(row.FormURL, row.FormUrl, row.GoogleFormURL, row.Link, row.URL, row.Url),
  };
}

function mapEvaluationQuestion(row: Record<string, unknown>): EvaluationQuestion | null {
  const id = valueByKeys(row, ["QuestionID", "QuestionId", "question_id", "ID", "Mã câu hỏi", "Ma cau hoi"]);
  const templateId = valueByKeys(row, ["TemplateID", "TemplateId", "template_id", "Template", "Mã form", "Ma form"]);
  const text = valueByKeys(row, ["QuestionText", "Question", "Question Text", "Câu hỏi", "Cau hoi", "Nội dung", "Noi dung"]);
  if (!id || !templateId || !text) return null;

  return {
    id,
    templateId,
    order: numberFrom(valueByKeys(row, ["Order", "Thứ tự", "Thu tu", "STT"]), 1),
    text,
    type: normalizeQuestionType(valueByKeys(row, ["QuestionType", "Question Type", "Type", "Loại câu hỏi", "Loai cau hoi"])),
    options: valueByKeys(row, ["Options", "Option", "Lựa chọn", "Lua chon"])
      .split(/\s*\|\s*|\s*\/(?=[A-Z]:)\s*/)
      .map((item) => item.trim())
      .filter(Boolean),
    required: booleanFrom(valueByKeys(row, ["Required", "Bắt buộc", "Bat buoc"])),
    dimension: valueByKeys(row, ["Dimension", "Khía cạnh", "Khia canh", "Tiêu chí", "Tieu chi"]),
  };
}

function mapPeerGroupOption(row: Record<string, unknown>, members: PeerGroupMember[]): PeerGroupOption | null {
  const id = valueByKeys(row, ["GroupID", "group_id"]);
  const name = valueByKeys(row, ["GroupName", "group_name", "Name"]);
  if (!id || !name) return null;

  return {
    id,
    name,
    maxMembers: numberFrom(valueByKeys(row, ["MaxMembers", "max_members", "Limit", "Capacity"]), 5),
    status: valueByKeys(row, ["Status", "status"]) || "open",
    memberCount: members.filter((member) => member.groupId === id && normalizeKey(member.status) === "active").length,
  };
}

function derivePeerGroupOptions(
  optionRows: Record<string, unknown>[],
  memberRows: Record<string, unknown>[],
  members: PeerGroupMember[],
) {
  const mapped = [...optionRows, ...memberRows]
    .map((row) => mapPeerGroupOption(row, members))
    .filter(Boolean) as PeerGroupOption[];
  const byId = new Map<string, PeerGroupOption>();

  mapped.forEach((option) => {
    const existing = byId.get(option.id);
    byId.set(option.id, {
      ...option,
      maxMembers: option.maxMembers || existing?.maxMembers || 5,
      memberCount: Math.max(option.memberCount, existing?.memberCount || 0),
      status: option.status || existing?.status || "open",
    });
  });

  return [...byId.values()];
}

function mapPeerGroupMember(row: Record<string, unknown>, users: Record<string, unknown>[]): PeerGroupMember | null {
  const groupId = valueByKeys(row, ["GroupID", "group_id"]);
  const userId = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
  if (!groupId || !userId) return null;

  const user = users.find((item) => valueByKeys(item, ["UserID", "user_id", "participant_id"]) === userId);
  const userName = user ? valueByKeys(user, ["FullName", "full_name", "Name"]) : userId;

  return {
    groupId,
    groupName: valueByKeys(row, ["GroupName", "group_name", "Name"]),
    userId,
    userName,
    role: valueByKeys(row, ["Role", "role"]) || "member",
    status: valueByKeys(row, ["Status", "status"]) || "active",
  };
}

function mapGroupCheckinRecord(row: Record<string, unknown>): GroupCheckinRecord | null {
  const id = valueByKeys(row, ["CheckinID", "CheckInID", "GroupCheckinID", "ID", "Id"]);
  const groupId = valueByKeys(row, ["GroupID", "group_id"]);
  const userId = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
  const week = numberFrom(valueByKeys(row, ["Week", "week", "Tuan", "Tuần"]), 0);
  if (!groupId || !userId || !week) return null;

  return {
    id: id || `${groupId}-${userId}-W${week}`,
    groupId,
    week,
    userId,
    met: booleanFrom(valueByKeys(row, ["Met", "met"])),
    insight: valueByKeys(row, ["Insight", "insight", "NoiDung", "Nội dung", "NhanRa", "Nhận ra"]),
    nextAction: valueByKeys(row, ["NextAction", "next_action", "Action", "HanhDong", "Hành động"]),
    createdAt: valueByKeys(row, ["CreatedAt", "created_at", "Timestamp", "Dấu thời gian"]),
  };
}

function normalizeWorkshopStatus(value: unknown): WorkshopStatus {
  const status = stringFrom(value, "locked").toLowerCase();
  if (status === "open") return "now";
  if (status === "done" || status === "now" || status === "locked") return status;
  return "locked";
}

function normalizeEvaluationType(value: unknown, titleValue?: unknown, sessionValue?: unknown): EvaluationType {
  const type = normalizeKey(value);
  const title = normalizeKey(titleValue);
  const session = normalizeKey(sessionValue);

  if (["final_quiz", "finalquiz", "quiz", "finaltest", "kiemtracuoikhoa"].includes(type)) return "final_quiz";
  if (["workshop", "ws"].includes(type)) return "workshop";
  if (["self_before", "selfbefore", "before", "pre", "precourse", "dauvao", "danhgiadauvao"].includes(type)) {
    return "self_before";
  }
  if (["self_after", "selfafter", "after", "post", "postcourse", "cuoikhoa", "danhgiacuoikhoa"].includes(type)) {
    return "self_after";
  }
  if (["peer", "360", "peer360", "peerafter", "peer_after", "other", "otherbefore", "other_before", "danhgia360", "nhandanhgia"].includes(type)) return "peer";

  if (session === "peer" || title.includes("360") || title.includes("other") || title.includes("nguoi khac") || title.includes("guilink") || title.includes("nhan danh gia")) {
    return "peer";
  }
  if (title.includes("cuoi khoa") || title.includes("cuoikhoa") || title.includes("sau chuong trinh")) {
    return "self_after";
  }
  if (title.includes("dau vao") || title.includes("dauvao") || title.includes("truoc chuong trinh")) {
    return "self_before";
  }

  return "workshop";
}

function normalizeSessionType(value: unknown): EvaluationSessionType {
  const type = normalizeKey(value);
  if (type === "sharelearn" || type === "shareandlearn" || type === "share") return "share_learn";
  if (type === "onboard" || type === "main" || type === "self" || type === "peer" || type === "final") return type;
  return "main";
}

function normalizeQuestionType(value: unknown): EvaluationQuestionType {
  const type = normalizeKey(value);
  if (type === "rating" || type === "scale" || type === "text" || type === "single_choice" || type === "multi_choice") return type;
  if (type === "multiple_choice") return "multi_choice";
  if (type === "singlechoice") return "single_choice";
  if (type === "multichoice" || type === "multiplechoice") return "multi_choice";
  return "text";
}

function normalizeEvaluationStatus(value: unknown) {
  const status = normalizeKey(value);
  if (!status || ["active", "open", "mo", "dangmo", "available"].includes(status)) return "active";
  if (["locked", "lock", "disabled", "inactive", "chuamo", "chua mo"].includes(status)) return "locked";
  return status;
}

function mergeEvaluationTemplates(
  mappedTemplates: EvaluationTemplate[],
  fallbackTemplates: EvaluationTemplate[],
  currentWorkshopId: string,
) {
  if (mappedTemplates.length) return mappedTemplates;

  const hasCurrentWorkshopTemplate = mappedTemplates.some(
    (template) => template.type === "workshop" && template.workshopId === currentWorkshopId,
  );
  const base = hasCurrentWorkshopTemplate
    ? mappedTemplates
    : [...fallbackTemplates.filter((template) => template.type === "workshop"), ...mappedTemplates];
  const seen = new Set<string>();

  return base.filter((template) => {
    const key = template.id || `${template.type}-${template.workshopId}-${template.sessionType}-${template.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeKey(value: unknown) {
  return stringFrom(value, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9_]/g, "");
}

function stringFrom(value: unknown, fallback: string) {
  if (typeof value === "string") return value || fallback;
  if (typeof value === "number") return String(value);
  return fallback;
}

function numberFrom(value: unknown, fallback: number) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function booleanFrom(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return [
      "true",
      "yes",
      "y",
      "1",
      "x",
      "checked",
      "required",
      "bắt buộc",
      "bat buoc",
      "đã gặp",
      "da gap",
      "đã họp",
      "da hop",
    ].includes(normalized);
  }
  return false;
}

function formatSheetDate(value: string) {
  if (!value) return "";
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getCurrentMiniChallengeDay(checkins: CheckinRecord[], totalDays: number) {
  const completedDays = checkins.filter((checkin) => checkin.completed).map((checkin) => checkin.day);
  if (!completedDays.length) return 1;
  return Math.min(Math.max(...completedDays) + 1, totalDays);
}

function getMiniChallengeTotalDays(items: Challenge[]) {
  if (!items.length) return 1;
  return Math.max(...items.map((item) => item.day || 1));
}

function getCurrentWorkshopIndex(items: Workshop[], fallback: number) {
  const activeIndex = items.findIndex((item) => item.status === "now");
  if (activeIndex >= 0) return items[activeIndex].order ?? activeIndex + 1;

  const doneOrders = items
    .map((item, index) => (item.status === "done" ? item.order ?? index + 1 : -1))
    .filter((order) => order >= 0);
  if (doneOrders.length) return Math.max(...doneOrders);

  return Number.isFinite(fallback) && fallback >= 0 ? fallback : 0;
}

function getCurrentWorkshop(items: Workshop[], currentWorkshopIndex: number) {
  return (
    items.find((workshop) => workshop.status === "now") ||
    items.find((workshop) => workshop.order === currentWorkshopIndex) ||
    items.find((workshop) => workshop.status === "locked") ||
    items[0]
  );
}

function getLatestBy<T extends { updatedAt: string }>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T>();

  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;

    const existing = map.get(key);
    if (!existing || getTimestamp(item.updatedAt) >= getTimestamp(existing.updatedAt)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values()).sort(function (a, b) {
    return getTimestamp(a.updatedAt) - getTimestamp(b.updatedAt);
  });
}

function countPeerFeedback(evaluations: EvaluationRecord[]) {
  return evaluations.filter((item) => isPeerFeedbackEvaluationRecord(item)).length;
}

function countPeerFeedbackAnswers(answers: EvaluationAnswerRecord[]) {
  const responseIds = new Set<string>();

  answers.forEach((answer) => {
    const templateId = answer.templateId?.toLowerCase() || "";
    if (!templateId.includes("peer") && !templateId.includes("other") && !templateId.includes("360")) return;

    const responseId = answer.responseId || answer.id;
    if (responseId) responseIds.add(responseId);
  });

  return responseIds.size;
}

function isPeerFeedbackEvaluationRecord(item: EvaluationRecord) {
  const respondentType = item.respondentType?.toLowerCase() || "";
  const templateId = item.templateId?.toLowerCase() || "";
  return respondentType === "peer" || respondentType.includes("other") || templateId.includes("peer") || templateId.includes("other") || templateId.includes("360");
}

function getTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}
