export type RawRow = Record<string, unknown>;

export type InstructorStudent = {
  id: string;
  name: string;
  email: string;
  department: string;
  cohortId: string;
  xp: number;
  currentWorkshop: number;
  checkinCount: number;
  evaluationCount: number;
  selfAssessmentCount: number;
  peerReviewCount: number;
  checkinCompleted?: boolean;
  selfAssessmentCompleted?: boolean;
  peerAssessmentCompleted?: boolean;
  reportUrl: string;
  assessmentReportStatus: string;
  assessmentReportDataReady: boolean;
  assessmentReportPublished: boolean;
  progressParts: {
    checkin: number;
    workshop: number;
    selfAssessment: number;
    peerAssessment: number;
  };
  progressWeights: {
    checkin: number;
    workshop: number;
    selfAssessment: number;
    peerAssessment: number;
  };
  longestStreak: number;
  lastCheckin: string;
  lastActivityAt?: string;
  atRiskReasons?: string[];
  progress: number;
  status: "Tốt" | "Cần chú ý" | "Chưa bắt đầu";
};

export type InstructorWorkshop = {
  id: string;
  title: string;
  description: string;
  order: number;
  status: string;
  date: string;
  openedForTotals: boolean;
  participantCount: number;
  attendanceRate: number;
  evaluationParticipationRate: number;
  score: number;
  responseCount: number;
  completionRate: number;
  dimensionScores: { label: string; score: number }[];
  ratingDistribution?: number[];
  strongestDimension?: { label: string; score: number };
  weakestDimension?: { label: string; score: number };
  comments: string[];
};

export type InstructorGroup = {
  id: string;
  name: string;
  members: string[];
  checkinWeeks: number;
  dueWeeks: number[];
  missingWeeks: number[];
  rate: number;
};

export type CohortHealthHistoryPoint = {
  date: string;
  engagement: number;
  progress: number;
  practice: number;
  assessment: number;
  peerGroup: number | null;
  health: number;
};

export type CoachingRequest = {
  id: string;
  userId: string;
  fullName: string;
  xp: number;
  requestedAt: string;
  status: string;
  assignedSlotId: string;
  explorationGoal: string;
};

export type FinalQuizSubmission = {
  attemptId: string;
  userId: string;
  fullName: string;
  status: string;
  submittedAt: string;
  objectiveScore: number;
  essayScore: number;
  finalScore: number;
  gradingStatus: string;
  feedback: string;
  objectives: {
    questionId: string;
    order: number;
    question: string;
    answer: string;
    answerKey: string;
    isCorrect: boolean;
  }[];
  essays: { questionId: string; question: string; answer: string }[];
};

export type FinalSurveySubmission = {
  responseId: string;
  anonymousId: string;
  submittedAt: string;
  rating: number;
  answers: {
    questionId: string;
    order: number;
    displayNumber: string;
    question: string;
    answer: string;
  }[];
};

export type InstructorDashboardData = {
  cohortId: string;
  cohorts: string[];
  students: InstructorStudent[];
  workshops: InstructorWorkshop[];
  leadershipReports: LeadershipReport[];
  groups: InstructorGroup[];
  practiceRetentionRate: number;
  practiceOver80Rate: number;
  practiceUnder80Rate: number;
  dropoutRate: number;
  challengeComparisons: ChallengeComparison[];
  challengeDailyStats: ChallengeDailyStat[];
  challengeFunnel: ChallengeFunnelPoint[];
  todayCheckins: number;
  averageProgress: number;
  evaluationCompletionRate: number;
  trends: {
    engagement: number;
    practiceRetention: number;
    assessment: number;
    miniOver80: number;
    miniUnder80: number;
    miniDropout: number;
  };
  activeMetrics: {
    engagement: boolean;
    progress: boolean;
    practice: boolean;
    assessment: boolean;
    peerGroup: boolean;
  };
  peerGroupOpen: boolean;
  activeAssessments: {
    self: boolean;
    peer: boolean;
  };
  activeProgressLabels: string[];
  healthHistory: CohortHealthHistoryPoint[];
  recentActivity: string[];
  coachingRequests: CoachingRequest[];
  coachingSlots: RawRow[];
  finalQuizSubmissions: FinalQuizSubmission[];
  finalSurveySubmissions: FinalSurveySubmission[];
};

export type LeadershipReport = {
  userId: string;
  studentName: string;
  peerRespondentCount: number;
  selfCreativeRate: number;
  peerCreativeRate: number;
  peerInsights: string[];
  openFeedbackGroups: {
    questionId: string;
    order: number;
    question: string;
    answers: string[];
  }[];
  dimensions: {
    id: string;
    title: string;
    selfCreativeRate: number;
    peerCreativeRate: number;
    alignmentRate: number;
    insight: string;
  }[];
  scenarios: {
    order: number;
    question: string;
    dimension: string;
    reactiveText: string;
    creativeText: string;
    selfAnswer: "reactive" | "creative" | "";
    peerCreativeCount: number;
    peerReactiveCount: number;
    peerTotal: number;
    alignmentRate: number;
    tone: "strength" | "practice" | "blindspot" | "mixed";
  }[];
  recommendations: string[];
};

export type ChallengeComparison = {
  id: string;
  title: string;
  participantCount: number;
  totalDays: number;
  retentionRate: number;
  over80Rate: number;
  under80Rate: number;
  dropoutRate: number;
};

export type ChallengeDailyStat = {
  challengeId: string;
  day: number;
  checkinRate: number;
  status: "good" | "medium" | "low" | "future";
};

export type ChallengeFunnelPoint = {
  challengeId: string;
  milestone: string;
  day: number;
  participantCount: number;
  activeCount: number;
  retentionRate: number;
};

const DEFAULT_GAS_API_URL =
  "https://script.google.com/macros/s/AKfycbwqLgyYZ-PqV03Kg7dY6ui5qrjOZscS1HXItyb7PQyQprpRCSd05Mz3NPybRGZgTze-wg/exec";

const API_URL = process.env.NEXT_PUBLIC_GAS_API_URL || DEFAULT_GAS_API_URL;

export async function loadInstructorDashboard(
  cohortId = "",
  reportUserId = "",
): Promise<{ data: InstructorDashboardData; remoteLoaded: boolean }> {
  if (!API_URL) return { data: buildMockInstructorDashboard(), remoteLoaded: false };

  try {
    const url = new URL(API_URL);
    url.searchParams.set("action", "getInstructorDashboard");
    url.searchParams.set("_ts", Date.now().toString());
    if (cohortId) url.searchParams.set("cohortId", cohortId);
    if (reportUserId) url.searchParams.set("reportUserId", reportUserId);

    const response = await fetch(url.toString(), { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Cannot load instructor dashboard");

    return { data: mapInstructorPayload(payload), remoteLoaded: true };
  } catch (error) {
    console.warn(error);
    return { data: buildMockInstructorDashboard(), remoteLoaded: false };
  }
}

export async function refreshInstructorSummaries(cohortId = "") {
  if (!API_URL) return { ok: false, error: "Missing API URL" };

  try {
    const url = new URL(API_URL);
    url.searchParams.set("action", "rebuildInstructorSummaries");
    url.searchParams.set("_ts", Date.now().toString());
    if (cohortId) url.searchParams.set("cohortId", cohortId);
    if (typeof window !== "undefined") {
      const reportUserId = new URLSearchParams(window.location.search).get("report") || "";
      if (reportUserId) url.searchParams.set("reportUserId", reportUserId);
    }

    const response = await fetch(url.toString(), { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Cannot refresh summaries");

    return { ok: true, payload };
  } catch (error) {
    console.warn(error);
    return { ok: false, error: String(error) };
  }
}

export async function publishAssessmentReport(userId: string) {
  if (!API_URL) return { ok: false, error: "Missing API URL" };

  try {
    const reportBaseUrl =
      typeof window !== "undefined" && window.location.origin
        ? `${window.location.origin}/`
        : "https://ldkt-instructor-dashboard.vercel.app/";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "publishAssessmentReport", userId, reportBaseUrl }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Cannot publish assessment report");

    return { ok: true, payload };
  } catch (error) {
    console.warn(error);
    return { ok: false, error: String(error) };
  }
}

export async function selectCoachingCandidates(cohortId: string, userIds: string[]) {
  if (!API_URL) return { ok: false, error: "Missing API URL" };
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "selectCoachingCandidates", cohortId, userIds, selectedBy: "Giảng viên" }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Cannot select coaching candidates");
    return { ok: true, payload };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export async function gradeFinalQuiz(attemptId: string, essayScore: number, feedback: string, publish: boolean) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "gradeFinalQuiz", attemptId, essayScore, feedback, publish, gradedBy: "Giảng viên" }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Cannot grade final quiz");
    return { ok: true, payload };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

function mapInstructorPayload(payload: RawRow): InstructorDashboardData {
  const users = arrayFrom(payload.users);
  const studentStats = arrayFrom(payload.studentStats);
  const workshopRows = arrayFrom(payload.workshops);
  const workshops = workshopRows.map(mapWorkshop).sort((a, b) => a.order - b.order);
  const checkins = arrayFrom(payload.checkins);
  const evaluations = arrayFrom(payload.evaluations);
  const answers = arrayFrom(payload.evaluationAnswers);
  const questions = arrayFrom(payload.evaluationQuestions);
  const templates = arrayFrom(payload.evaluationTemplates);
  const groupMembers = arrayFrom(payload.peerGroupMembers);
  const groupOptions = arrayFrom(payload.peerGroupOptions);
  const groupCheckins = arrayFrom(payload.groupCheckins);
  const workshopStats = arrayFrom(payload.workshopStats);
  const challengeStats = arrayFrom(payload.challengeStats);
  const challengeDailyStats = arrayFrom(payload.challengeDailyStats);
  const challenge21dFunnel = arrayFrom(payload.challenge21dFunnel);
  const assessmentSummary = arrayFrom(payload.assessmentSummary);
  const finalQuizRows = arrayFrom(payload.finalQuizResults);
  const coachingRequests = arrayFrom(payload.coachingRequests)
    .map((row) => ({
      id: valueBy(row, ["RequestID", "request_id"]),
      userId: valueBy(row, ["UserID", "user_id", "participant_id"]),
      fullName: valueBy(row, ["FullName", "full_name", "Name"]),
      xp: numberFrom(valueBy(row, ["XP", "xp"]), 0),
      requestedAt: valueBy(row, ["RequestedAt", "requested_at"]),
      status: valueBy(row, ["Status", "status"]) || "registered",
      assignedSlotId: valueBy(row, ["AssignedSlotID", "assigned_slot_id"]),
      explorationGoal: valueBy(row, ["ExplorationGoal", "exploration_goal", "CoachingGoal"]),
    }))
    .filter((row) => row.id && row.userId)
    .sort((a, b) => b.xp - a.xp || a.requestedAt.localeCompare(b.requestedAt));
  const finalQuizQuestions = questions.filter((row) => normalize(valueBy(row, ["TemplateID", "template_id"])) === "finalquiz");
  const finalQuizSubmissions: FinalQuizSubmission[] = finalQuizRows.map((row) => {
    const attemptId = valueBy(row, ["AttemptID", "attempt_id"]);
    const userId = valueBy(row, ["UserID", "user_id"]);
    const user = users.find((item) => valueBy(item, ["UserID", "user_id", "participant_id"]) === userId);
    return {
      attemptId,
      userId,
      fullName: valueBy(row, ["FullName"]) || valueBy(user || {}, ["FullName", "Name"]) || userId,
      status: valueBy(row, ["Status"]),
      submittedAt: valueBy(row, ["SubmittedAt"]),
      objectiveScore: numberFrom(valueBy(row, ["ObjectiveScore"]), 0),
      essayScore: numberFrom(valueBy(row, ["EssayScore"]), 0),
      finalScore: numberFrom(valueBy(row, ["FinalScore"]), 0),
      gradingStatus: valueBy(row, ["GradingStatus"]),
      feedback: valueBy(row, ["InstructorFeedback"]),
      objectives: finalQuizQuestions.filter((question) => numberFrom(valueBy(question, ["Order"]), 0) <= 10).map((question) => {
        const questionId = valueBy(question, ["QuestionID", "question_id"]);
        const answer = answers.find((item) => valueBy(item, ["ResponseID", "response_id"]) === attemptId && valueBy(item, ["QuestionID", "question_id"]) === questionId);
        const answerValue = valueBy(answer || {}, ["Value", "value"]);
        const answerKey = valueBy(question, ["AnswerKey", "CorrectAnswer"]);
        return {
          questionId,
          order: numberFrom(valueBy(question, ["Order"]), 0),
          question: valueBy(question, ["QuestionText", "Question"]),
          answer: answerValue,
          answerKey,
          isCorrect: canonicalQuizAnswerForInstructor(answerValue) === canonicalQuizAnswerForInstructor(answerKey),
        };
      }),
      essays: finalQuizQuestions.filter((question) => numberFrom(valueBy(question, ["Order"]), 0) > 10).map((question) => {
        const questionId = valueBy(question, ["QuestionID", "question_id"]);
        const answer = answers.find((item) => valueBy(item, ["ResponseID", "response_id"]) === attemptId && valueBy(item, ["QuestionID", "question_id"]) === questionId);
        return { questionId, question: valueBy(question, ["QuestionText", "Question"]), answer: valueBy(answer || {}, ["Value", "value"]) };
      }),
    };
  }).filter((item) => item.attemptId);
  const finalSurveyQuestions = questions
    .filter((row) => normalize(valueBy(row, ["TemplateID", "template_id"])) === "finalsurvey")
    .sort((a, b) => numberFrom(valueBy(a, ["Order", "order"]), 0) - numberFrom(valueBy(b, ["Order", "order"]), 0));
  const finalSurveyRows = evaluations.filter((row) =>
    normalize(valueBy(row, ["TemplateID", "template_id"])) === "finalsurvey" ||
    normalize(valueBy(row, ["SessionType", "session_type"])) === "finalsurvey",
  );
  const finalSurveySubmissions: FinalSurveySubmission[] = finalSurveyRows
    .map((row, index) => {
      const responseId = valueBy(row, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]);
      const storedAnonymousId = valueBy(row, ["UserID", "user_id", "participant_id"]);
      return {
        responseId,
        anonymousId: !storedAnonymousId || normalize(storedAnonymousId) === "anonymous"
          ? `Anonymous ${index + 1}`
          : storedAnonymousId,
        submittedAt: valueBy(row, ["CreatedAt", "SubmittedAt", "UpdatedAt", "created_at"]),
        rating: numberFrom(valueBy(row, ["Rating", "rating"]), 0),
        answers: finalSurveyQuestions
          .map((question) => {
            const questionId = valueBy(question, ["QuestionID", "question_id"]);
            const answerRow = answers.find((item) =>
              valueBy(item, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]) === responseId &&
              valueBy(item, ["QuestionID", "question_id"]) === questionId,
            );
            const order = numberFrom(valueBy(question, ["Order", "order"]), 0);
            return {
              questionId,
              order,
              displayNumber: order === 10 ? "9a" : order === 11 ? "9b" : order === 12 ? "10" : String(order),
              question: valueBy(question, ["QuestionText", "Question", "question"]),
              answer: valueBy(answerRow || {}, ["Value", "value", "Answer", "answer"]),
            };
          })
          .filter((answer) => answer.answer),
      };
    })
    .filter((submission) => submission.responseId)
    .sort((a, b) => (parseDate(b.submittedAt)?.getTime() || 0) - (parseDate(a.submittedAt)?.getTime() || 0));

  const learners = users.filter(isLearner);
  const now = new Date();
  const today = startOfDay(now);
  const miniChallenges = arrayFrom(payload.miniChallenges).filter((challenge) => normalize(valueBy(challenge, ["Status", "status"]) || "active") !== "locked");
  const eligibleChallenges = miniChallenges.filter((challenge) => {
    const date = parseDate(valueBy(challenge, ["Date", "date"]));
    return isApplicableStatus(valueBy(challenge, ["Status", "status"])) && Boolean(date && startOfDay(date).getTime() <= today.getTime());
  });
  const activeTemplates = templates.filter((template) => normalize(valueBy(template, ["Status", "status"]) || "active") !== "locked");
  const applicableTemplates = templates.filter((template) => isApplicableStatus(valueBy(template, ["Status", "status"])));
  const selfTemplateIds = unique(
    applicableTemplates.filter(isSelfAssessment).map((template) => valueBy(template, ["TemplateID", "template_id"])).filter(Boolean),
  );
  const peerTemplateIds = unique(
    applicableTemplates.filter(isPeerAssessment).map((template) => valueBy(template, ["TemplateID", "template_id"])).filter(Boolean),
  );
  const eligibleWorkshopIds = workshopRows
    .filter((workshop) => {
      const workshopId = valueBy(workshop, ["WorkshopID", "workshop_id"]);
      const order = numberFrom(valueBy(workshop, ["Order", "order"]), numberFrom(workshopId.replace(/\D/g, ""), 0));
      const date = parseDate(valueBy(workshop, ["Date", "ScheduleDate", "StartDate"]));
      return order > 0 && isApplicableStatus(valueBy(workshop, ["Status", "status"])) && Boolean(date && startOfDay(date).getTime() <= today.getTime());
    })
    .map((workshop) => valueBy(workshop, ["WorkshopID", "workshop_id"]))
    .filter(Boolean);
  const activeProgressCategoryCount =
    Number(eligibleChallenges.length > 0) +
    Number(eligibleWorkshopIds.length > 0) +
    Number(selfTemplateIds.length > 0) +
    Number(peerTemplateIds.length > 0);
  const progressCategoryWeight = activeProgressCategoryCount ? 100 / activeProgressCategoryCount : 0;
  const progressWeights = {
    checkin: eligibleChallenges.length ? progressCategoryWeight : 0,
    workshop: eligibleWorkshopIds.length ? progressCategoryWeight : 0,
    selfAssessment: selfTemplateIds.length ? progressCategoryWeight : 0,
    peerAssessment: peerTemplateIds.length ? progressCategoryWeight : 0,
  };
  const finalWorkshopReached = workshopRows.some((workshop) => {
    const workshopId = normalize(valueBy(workshop, ["WorkshopID", "workshop_id"]));
    const order = numberFrom(valueBy(workshop, ["Order", "order"]), numberFrom(workshopId.replace(/\D/g, ""), 0));
    const date = parseDate(valueBy(workshop, ["Date", "ScheduleDate", "StartDate"]));
    return order === 7 && isApplicableStatus(valueBy(workshop, ["Status", "status"])) && Boolean(date && startOfDay(date).getTime() <= today.getTime());
  });
  const peerGroupActive =
    finalWorkshopReached && groupOptions.some((group) => isApplicableStatus(valueBy(group, ["Status", "status"]), false));
  const studentStatsById = new Map(
    studentStats
      .map((row) => [valueBy(row, ["UserID", "user_id", "participant_id"]), row] as const)
      .filter(([id]) => Boolean(id)),
  );
  const workshopStatsById = new Map(
    workshopStats
      .map((row) => [valueBy(row, ["WorkshopID", "workshop_id"]), row] as const)
      .filter(([id]) => Boolean(id)),
  );
  const students = learners.map((user) => {
    const userId = valueBy(user, ["UserID", "user_id", "participant_id"]);
    return applyAssessmentReportStatus(
      applyStudentStats(
        mapStudent(user, {
          checkins: checkins.filter((item) => valueBy(item, ["UserID", "user_id", "participant_id"]) === userId),
          evaluations: evaluations.filter((item) => valueBy(item, ["UserID", "user_id", "participant_id"]) === userId),
          peerReviewCountOverride: countPeerReviewsForUser(user, evaluations, answers),
          selfTemplateIds,
          peerTemplateIds,
          eligibleChallengeIds: eligibleChallenges.map((challenge) => valueBy(challenge, ["ChallengeID", "challenge_id"])).filter(Boolean),
          workshopIds: eligibleWorkshopIds,
          progressWeights,
          miniChallenges,
          workshops: workshopRows,
          templates,
        }),
        studentStatsById.get(userId),
      ),
      getAssessmentReportStatus(assessmentSummary, userId),
    );
  });

  const instructorWorkshops = workshops.map((workshop) =>
    applyWorkshopStats(
      enrichWorkshop(workshop, evaluations, answers, questions, activeTemplates, students.length),
      workshopStatsById.get(workshop.id),
    ),
  );
  const challengeComparisons = buildChallengeComparisons(challengeStats, miniChallenges, checkins, students);
  const mappedChallengeDailyStats = buildChallengeDailyStats(challengeDailyStats, miniChallenges);
  const challengeFunnel = buildChallengeFunnel(challenge21dFunnel);
  const aggregateChallenge = aggregateChallengeComparisons(challengeComparisons);
  const dueGroupWeeks = getDueGroupCheckinWeeks(miniChallenges, new Date());
  const groups = buildGroups(groupOptions, groupMembers, groupCheckins, users, dueGroupWeeks);
  const requestedReportUserId =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("report") || "" : "";
  const reportLearners = requestedReportUserId
    ? learners.filter((user) => valueBy(user, ["UserID", "user_id", "participant_id"]) === requestedReportUserId)
    : learners;
  const leadershipReports = (reportLearners.length ? reportLearners : learners).map((user) =>
    buildLeadershipReport(
      valueBy(user, ["UserID", "user_id", "participant_id"]),
      valueBy(user, ["FullName", "full_name", "Name"]),
      answers,
      questions,
      evaluations,
    ),
  );
  const todayCheckins = checkins.filter((item) => isToday(valueBy(item, ["UpdatedAt", "CreatedAt", "Date", "Timestamp"]))).length;
  const averageProgress = round(average(students.map((student) => student.progress)));
  const practiceRetentionRate = progressWeights.checkin
    ? roundAverage(students.map((student) => (student.progressParts.checkin / progressWeights.checkin) * 100))
    : 0;
  const assessmentRates = [
    ...(progressWeights.selfAssessment
      ? [roundAverage(students.map((student) => (student.progressParts.selfAssessment / progressWeights.selfAssessment) * 100))]
      : []),
    ...(progressWeights.peerAssessment
      ? [roundAverage(students.map((student) => (student.progressParts.peerAssessment / progressWeights.peerAssessment) * 100))]
      : []),
  ];
  const evaluationCompletionRate = roundAverage(assessmentRates);
  const todayBoundary = startOfDay(new Date());
  const historicalToday = getHistoricalActivityMetrics(
    learners,
    checkins,
    evaluations,
    eligibleChallenges,
    workshopRows,
    selfTemplateIds,
    peerTemplateIds,
    new Date(),
  );
  const historicalYesterday = getHistoricalActivityMetrics(
    learners,
    checkins,
    evaluations,
    eligibleChallenges,
    workshopRows,
    selfTemplateIds,
    peerTemplateIds,
    todayBoundary,
  );
  const activeMetrics = {
    engagement: activeProgressCategoryCount > 0 || peerGroupActive,
    progress: activeProgressCategoryCount > 0,
    practice: eligibleChallenges.length > 0,
    assessment: selfTemplateIds.length > 0 || peerTemplateIds.length > 0,
    peerGroup: peerGroupActive && dueGroupWeeks.length > 0,
  };
  const activeProgressLabels = [
    ...(eligibleWorkshopIds.length ? ["Workshop"] : []),
    ...(eligibleChallenges.length ? ["Mini challenge"] : []),
    ...(selfTemplateIds.length ? ["Tự đánh giá"] : []),
    ...(peerTemplateIds.length ? ["Mời đánh giá"] : []),
  ];

  return {
    cohortId: stringFrom(payload.cohortId, valueBy(learners[0] || users[0] || {}, ["CohortID", "cohort_id", "Batch", "batch"]) || "Cohort"),
    cohorts: arrayFrom(payload.cohorts).map((item) => stringFrom(item, "")).filter(Boolean),
    students,
    workshops: instructorWorkshops,
    leadershipReports,
    groups,
    practiceRetentionRate,
    practiceOver80Rate: aggregateChallenge.over80Rate,
    practiceUnder80Rate: aggregateChallenge.under80Rate,
    dropoutRate: aggregateChallenge.dropoutRate,
    challengeComparisons,
    challengeDailyStats: mappedChallengeDailyStats,
    challengeFunnel,
    todayCheckins,
    averageProgress,
    evaluationCompletionRate: clamp(evaluationCompletionRate, 0, 100),
    trends: {
      engagement: historicalToday.engagement - historicalYesterday.engagement,
      practiceRetention: historicalToday.practiceRetention - historicalYesterday.practiceRetention,
      assessment: historicalToday.assessment - historicalYesterday.assessment,
      miniOver80: historicalToday.over80 - historicalYesterday.over80,
      miniUnder80: historicalToday.under80 - historicalYesterday.under80,
      miniDropout: historicalToday.dropout - historicalYesterday.dropout,
    },
    activeMetrics,
    peerGroupOpen: peerGroupActive,
    activeAssessments: {
      self: selfTemplateIds.length > 0,
      peer: peerTemplateIds.length > 0,
    },
    activeProgressLabels,
    healthHistory: buildCohortHealthHistory({
      learners,
      checkins,
      evaluations,
      challenges: miniChallenges,
      workshops: workshopRows,
      selfTemplateIds,
      peerTemplateIds,
      groupMembers,
      groupCheckins,
      peerGroupActive,
    }),
    recentActivity: buildRecentActivity(checkins, evaluations, users),
    coachingRequests,
    coachingSlots: arrayFrom(payload.coachingSlots),
    finalQuizSubmissions,
    finalSurveySubmissions,
  };
}

function mapStudent(
  user: RawRow,
  context: {
    checkins: RawRow[];
    evaluations: RawRow[];
    peerReviewCountOverride?: number;
    selfTemplateIds: string[];
    peerTemplateIds: string[];
    eligibleChallengeIds: string[];
    workshopIds: string[];
    progressWeights: InstructorStudent["progressWeights"];
    miniChallenges: RawRow[];
    workshops: RawRow[];
    templates: RawRow[];
  },
): InstructorStudent {
  const id = valueBy(user, ["UserID", "user_id", "participant_id"]);
  const name = valueBy(user, ["FullName", "full_name", "Name"]) || id;
  const currentWorkshop = numberFrom(valueBy(user, ["CurrentWorkshop", "current_workshop"]), 0);
  const xp = numberFrom(valueBy(user, ["XP", "xp", "Points", "TotalXP", "Score"]), 0);
  const completedChallengeIds = unique(
    context.checkins
      .filter((item) => {
        const completed = valueBy(item, ["Completed", "completed"]);
        return completed === "" || isTruthy(completed);
      })
      .map((item) => valueBy(item, ["ChallengeID", "challenge_id"]))
      .filter(Boolean),
  );
  const completedCheckins = completedChallengeIds.length;
  const hasWorkshopAttendanceColumns = context.workshopIds.some((workshopId) => hasAnyValue(user, workshopAttendanceKeys(workshopId)));
  const attendedWorkshopCount = hasWorkshopAttendanceColumns
    ? context.workshopIds.filter((workshopId) => isTruthy(valueBy(user, workshopAttendanceKeys(workshopId)))).length
    : Math.max(0, currentWorkshop);
  const selfAssessmentCount = unique(context.evaluations.filter(isSelfAssessment).map(evaluationKey)).length;
  const peerReviewCount = context.peerReviewCountOverride ?? unique(context.evaluations.filter(isPeerAssessment).map(evaluationKey)).length;
  const evaluationCount = selfAssessmentCount + peerReviewCount;
  const completedSelfTemplateCount = unique(
    context.evaluations
      .filter((evaluation) => context.selfTemplateIds.includes(valueBy(evaluation, ["TemplateID", "template_id"])))
      .map(evaluationKey),
  ).length;
  const completedPeerTarget = Math.min(peerReviewCount, context.peerTemplateIds.length * 3);
  const checkinCompleted =
    context.eligibleChallengeIds.length > 0 &&
    context.eligibleChallengeIds.every((challengeId) => completedChallengeIds.includes(challengeId));
  const selfAssessmentCompleted =
    context.selfTemplateIds.length > 0 && completedSelfTemplateCount >= context.selfTemplateIds.length;
  const peerAssessmentCompleted =
    context.peerTemplateIds.length > 0 && peerReviewCount >= context.peerTemplateIds.length * 3;
  const progressParts = {
    checkin: context.progressWeights.checkin
      ? Math.min(context.progressWeights.checkin, (completedChallengeIds.filter((id) => context.eligibleChallengeIds.includes(id)).length / context.eligibleChallengeIds.length) * context.progressWeights.checkin)
      : 0,
    workshop: context.progressWeights.workshop
      ? Math.min(context.progressWeights.workshop, (attendedWorkshopCount / context.workshopIds.length) * context.progressWeights.workshop)
      : 0,
    selfAssessment: context.progressWeights.selfAssessment
      ? Math.min(context.progressWeights.selfAssessment, (completedSelfTemplateCount / context.selfTemplateIds.length) * context.progressWeights.selfAssessment)
      : 0,
    peerAssessment: context.progressWeights.peerAssessment
      ? Math.min(context.progressWeights.peerAssessment, (completedPeerTarget / (context.peerTemplateIds.length * 3)) * context.progressWeights.peerAssessment)
      : 0,
  };
  const progress = clamp(round(progressParts.checkin + progressParts.workshop + progressParts.selfAssessment + progressParts.peerAssessment), 0, 100);
  const lastCheckinValue = getLatestDate(context.checkins);
  const lastActivityValue = getLatestStudentActivity(user, context);
  const atRiskReasons = getStudentAtRiskReasons(user, context);
  const hasStarted = progress > 0;
  const status: InstructorStudent["status"] =
    !hasStarted ? "Chưa bắt đầu" : progress >= 70 ? "Tốt" : "Cần chú ý";

  return {
    id,
    name,
    email: valueBy(user, ["Email", "email"]),
    department: valueBy(user, ["Department", "CompanyName", "company_name"]),
    cohortId: valueBy(user, ["CohortID", "cohort_id", "Batch", "batch"]),
    xp,
    currentWorkshop,
    checkinCount: completedCheckins,
    evaluationCount,
    selfAssessmentCount,
    peerReviewCount,
    checkinCompleted,
    selfAssessmentCompleted,
    peerAssessmentCompleted,
    reportUrl: valueBy(user, ["LeadershipReportURL", "ReportURL", "LeadershipReport", "leadership_report_link", "ReportLink"]),
    assessmentReportStatus: "",
    assessmentReportDataReady: false,
    assessmentReportPublished: false,
    progressParts: {
      checkin: round(progressParts.checkin),
      workshop: round(progressParts.workshop),
      selfAssessment: round(progressParts.selfAssessment),
      peerAssessment: round(progressParts.peerAssessment),
    },
    progressWeights: context.progressWeights,
    longestStreak: getLongestStreak(context.checkins),
    lastCheckin: lastCheckinValue ? formatRelativeDate(lastCheckinValue) : "Chưa check-in",
    lastActivityAt: lastActivityValue ? lastActivityValue.toISOString() : "",
    atRiskReasons,
    progress,
    status,
  };
}

function applyAssessmentReportStatus(student: InstructorStudent, status: string): InstructorStudent {
  const normalized = normalize(status);
  const published = ["published", "open", "completed", "done"].includes(normalized);
  const hasMinimumData = student.selfAssessmentCount >= 1 && student.peerReviewCount >= 3;
  const dataReady = published || hasMinimumData || ["dataready", "readytopublish", "ready"].includes(normalized);
  return {
    ...student,
    assessmentReportStatus: status,
    assessmentReportDataReady: dataReady,
    assessmentReportPublished: published,
  };
}

function getAssessmentReportStatus(summary: RawRow[], userId: string) {
  const rows = summary.filter((row) => valueBy(row, ["UserID", "user_id", "participant_id"]) === userId);
  if (!rows.length) return "";
  const statuses = rows.map((row) => valueBy(row, ["ReportStatus", "Status", "status"])).filter(Boolean);
  if (statuses.some((status) => ["published", "open", "completed", "done"].includes(normalize(status)))) return "published";
  if (statuses.some((status) => ["dataready", "readytopublish", "ready"].includes(normalize(status)))) return "data_ready";
  return statuses[0] || "";
}

function applyStudentStats(student: InstructorStudent, stats?: RawRow): InstructorStudent {
  if (!stats) return student;

  const lastCheckin = valueBy(stats, ["LastCheckin", "LastCheckinAt", "Last Check-in", "LastActivity"]) || student.lastCheckin;

  return {
    ...student,
    name: valueBy(stats, ["FullName", "full_name", "Name"]) || student.name,
    email: valueBy(stats, ["Email", "email"]) || student.email,
    department: valueBy(stats, ["Department", "CompanyName", "company_name"]) || student.department,
    cohortId: valueBy(stats, ["CohortID", "cohort_id", "Batch", "batch"]) || student.cohortId,
    xp: optionalNumber(valueBy(stats, ["XP", "xp", "Points", "TotalXP", "Score"])) ?? student.xp,
    currentWorkshop: optionalNumber(valueBy(stats, ["CurrentWorkshop", "current_workshop", "Workshop"])) ?? student.currentWorkshop,
    reportUrl: valueBy(stats, ["LeadershipReportURL", "ReportURL", "LeadershipReport", "leadership_report_link", "ReportLink"]) || student.reportUrl,
    longestStreak: optionalNumber(valueBy(stats, ["LongestStreak", "Streak", "Longest Streak"])) ?? student.longestStreak,
    lastCheckin,
  };
}

function optionalNumber(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeStudentStatus(value: unknown): InstructorStudent["status"] | undefined {
  const normalized = normalize(value);
  if (!normalized) return undefined;
  if (normalized.includes("tot") || normalized.includes("good")) return "Tốt";
  if (normalized.includes("canchu") || normalized.includes("warning") || normalized.includes("risk")) return "Cần chú ý";
  if (normalized.includes("chuabatdau") || normalized.includes("notstarted")) return "Chưa bắt đầu";
  return undefined;
}

function countPeerReviewsForUser(user: RawRow, evaluations: RawRow[], answers: RawRow[]) {
  const targetMatches = (row: RawRow) => {
    const userId = normalize(valueBy(user, ["UserID", "user_id", "participant_id"]));
    const email = normalize(valueBy(user, ["Email", "email"]));
    const name = normalize(valueBy(user, ["FullName", "full_name", "Name"]));
    const rowUserId = normalize(valueBy(row, ["UserID", "user_id", "participant_id", "TargetUserID", "target_user_id"]));
    const rowEmail = normalize(valueBy(row, ["Email", "email", "TargetEmail", "target_email", "Email người được đánh giá"]));
    const rowName = normalize(valueBy(row, ["FullName", "full_name", "Name", "TargetName", "target_name", "Tên người được đánh giá"]));
    return Boolean((userId && rowUserId === userId) || (email && rowEmail === email) || (name && rowName === name));
  };
  const responseMeta = new Map(
    evaluations.map((evaluation) => [
      normalize(valueBy(evaluation, ["ResponseID", "EvaluationID", "response_id"])),
      {
        templateId: normalize(valueBy(evaluation, ["TemplateID", "template_id"])),
        respondentType: normalize(valueBy(evaluation, ["RespondentType", "respondent_type"])),
        row: evaluation,
      },
    ]),
  );
  const evaluationResponseIds = evaluations
    .filter((evaluation) => isPeerAssessment(evaluation) && targetMatches(evaluation))
    .map((evaluation) => valueBy(evaluation, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]));
  const answerResponseIds = answers
    .filter((answer) => {
      const meta = responseMeta.get(normalize(valueBy(answer, ["ResponseID", "response_id"])));
      return isPeerAnswer(answer, responseMeta) && (targetMatches(answer) || Boolean(meta?.row && targetMatches(meta.row)));
    })
    .map((answer) => valueBy(answer, ["ResponseID", "response_id"]));
  return unique([...evaluationResponseIds, ...answerResponseIds].filter(Boolean)).length;
}

function mapWorkshop(row: RawRow): InstructorWorkshop {
  const order = numberFrom(valueBy(row, ["Order", "order"]), numberFrom(String(valueBy(row, ["WorkshopID", "workshop_id"])).replace(/\D/g, ""), 0));
  const scheduledDate = parseDate(valueBy(row, ["Date", "ScheduleDate", "StartDate"]));
  const today = startOfDay(new Date());
  return {
    id: valueBy(row, ["WorkshopID", "workshop_id"]) || `WS${order}`,
    title: valueBy(row, ["Title", "title"]) || `Workshop ${order}`,
    description: valueBy(row, ["Description", "description"]),
    order,
    status: valueBy(row, ["Status", "status"]),
    date: formatDate(valueBy(row, ["Date", "ScheduleDate", "StartDate"])),
    openedForTotals:
      order > 0 &&
      isApplicableStatus(valueBy(row, ["Status", "status"])) &&
      Boolean(scheduledDate && startOfDay(scheduledDate).getTime() <= today.getTime()),
    participantCount: numberFrom(valueBy(row, ["ParticipantCount", "Participants", "AttendedCount", "AttendanceCount", "Số người tham gia"]), 0),
    attendanceRate: numberFrom(valueBy(row, ["AttendanceRate", "WorkshopParticipationRate", "Tỉ lệ tham gia workshop"]), 0),
    evaluationParticipationRate: numberFrom(valueBy(row, ["EvaluationParticipationRate", "EvaluationRate", "Tỉ lệ tham gia đánh giá"]), 0),
    score: 0,
    responseCount: 0,
    completionRate: 0,
    dimensionScores: [],
    ratingDistribution: [],
    comments: [],
  };
}

function enrichWorkshop(
  workshop: InstructorWorkshop,
  evaluations: RawRow[],
  answers: RawRow[],
  questions: RawRow[],
  templates: RawRow[],
  studentCount: number,
): InstructorWorkshop {
  const workshopResponses = evaluations.filter((item) => valueBy(item, ["WorkshopID", "workshop_id"]) === workshop.id);
  const workshopResponseIds = new Set(
    workshopResponses.map((item) => valueBy(item, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"])).filter(Boolean),
  );
  const allQuestionLabels: Record<string, string> = {
    ALL1: "Rõ ràng",
    ALL2: "Liên quan",
    ALL3: "Facilitator",
    ALL4: "An toàn chia sẻ",
    CLARITY: "Rõ ràng",
    RELEVANCE: "Liên quan",
    FACILITATION: "Facilitator",
    "PSYCHOLOGICAL SAFETY": "An toàn chia sẻ",
    "OBJECTIVE ACHIEVEMENT": "Objective Achievement",
  };
  const questionMap = new Map(
    questions.map((item) => {
      const questionId = valueBy(item, ["QuestionID", "question_id"]).trim().toUpperCase();
      return [questionId, allQuestionLabels[questionId] || valueBy(item, ["Dimension", "dimension"]) || "Khác"];
    }),
  );
  const workshopTemplates = templates.filter(
    (item) => valueBy(item, ["WorkshopID", "workshop_id"]) === workshop.id && normalize(valueBy(item, ["Status", "status"]) || "active") !== "locked",
  );
  const workshopAnswers = answers.filter((item) => {
    const responseId = valueBy(item, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]);
    return workshopResponseIds.has(responseId) || valueBy(item, ["TemplateID", "template_id"]).startsWith(workshop.id);
  });
  const allAnswers = workshopAnswers.filter((item) => allQuestionLabels[valueBy(item, ["QuestionID", "question_id"]).trim().toUpperCase()]);
  const ratings = allAnswers.map((item) => numberFrom(valueBy(item, ["Value", "value"]), NaN)).filter(Number.isFinite);
  const responseIdentities = unique(
    workshopResponses
      .map((item) => {
        const userId = valueBy(item, ["UserID", "user_id", "participant_id"]);
        return normalize(userId) === "public"
          ? valueBy(item, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"])
          : userId;
      })
      .filter(Boolean),
  );
  const comments = workshopAnswers
    .map((item) => valueBy(item, ["Value", "value"]))
    .filter((value) => value && Number.isNaN(Number(value)))
    .slice(0, 8);
  const dimensionScores = Object.entries(
    allAnswers
      .reduce<Record<string, number[]>>((bucket, item) => {
        const value = numberFrom(valueBy(item, ["Value", "value"]), NaN);
        if (!Number.isFinite(value)) return bucket;
        const questionId = valueBy(item, ["QuestionID", "question_id"]).trim().toUpperCase();
        const dimension = questionMap.get(questionId) || allQuestionLabels[questionId] || "Khác";
        bucket[dimension] = [...(bucket[dimension] || []), value];
        return bucket;
      }, {}),
  )
    .map(([label, values]) => ({ label, score: round(average(values), 1) }))
    .sort((a, b) => b.score - a.score);
  const participantCount = workshop.participantCount || unique(workshopResponses.map((item) => valueBy(item, ["UserID", "user_id", "participant_id"]))).length;
  const evaluationDenominator = participantCount || studentCount;

  return {
    ...workshop,
    participantCount,
    attendanceRate: workshop.attendanceRate || (studentCount ? clamp(round((participantCount / studentCount) * 100), 0, 100) : 0),
    evaluationParticipationRate: workshop.evaluationParticipationRate || (evaluationDenominator ? clamp(round((responseIdentities.length / evaluationDenominator) * 100), 0, 100) : 0),
    score: ratings.length ? round(average(ratings), 1) : 0,
    responseCount: responseIdentities.length || workshopResponses.length,
    completionRate: evaluationDenominator && workshopTemplates.length ? clamp(round((responseIdentities.length / evaluationDenominator) * 100), 0, 100) : 0,
    dimensionScores,
    ratingDistribution: [1, 2, 3, 4, 5].map(
      (score) => ratings.filter((rating) => Math.round(rating) === score).length,
    ),
    strongestDimension: dimensionScores[0],
    weakestDimension: dimensionScores[dimensionScores.length - 1],
    comments,
  };
}

function applyWorkshopStats(workshop: InstructorWorkshop, stats?: RawRow): InstructorWorkshop {
  if (!stats) return workshop;

  const participantCount = optionalNumber(valueBy(stats, ["ParticipantCount", "Participants", "AttendedCount"])) ?? workshop.participantCount;
  const attendanceRate = optionalNumber(valueBy(stats, ["AttendanceRate", "WorkshopParticipationRate"])) ?? workshop.attendanceRate;
  const evaluationParticipationRate =
    optionalNumber(valueBy(stats, ["EvaluationParticipationRate", "EvaluationRate"])) ?? workshop.evaluationParticipationRate;
  const score = optionalNumber(valueBy(stats, ["AverageScore", "Score", "Average"])) ?? workshop.score;
  const responseCount = optionalNumber(valueBy(stats, ["ResponseCount", "Responses", "EvaluationCount"])) ?? workshop.responseCount;
  const commonDimensionScores = [
    { label: "Rõ ràng", score: optionalNumber(valueBy(stats, ["ALL1Score", "ALL1"])) },
    { label: "Liên quan", score: optionalNumber(valueBy(stats, ["ALL2Score", "ALL2"])) },
    { label: "Facilitator", score: optionalNumber(valueBy(stats, ["ALL3Score", "ALL3"])) },
    { label: "An toàn chia sẻ", score: optionalNumber(valueBy(stats, ["ALL4Score", "ALL4"])) },
    {
      label: "Objective Achievement",
      score: optionalNumber(valueBy(stats, ["ObjectiveAchievementScore", "ObjectiveAchievement", "Objective Achievement"])),
    },
  ].filter((item): item is { label: string; score: number } => item.score !== undefined && item.score > 0);
  const dimensionScores = commonDimensionScores.length ? commonDimensionScores : workshop.dimensionScores;
  const strongestDimension = parseDimensionStat(valueBy(stats, ["StrongestDimension", "Strongest"]));
  const weakestDimension = parseDimensionStat(valueBy(stats, ["WeakestDimension", "Weakest"]));

  return {
    ...workshop,
    participantCount,
    attendanceRate,
    evaluationParticipationRate,
    score,
    responseCount,
    completionRate: evaluationParticipationRate,
    dimensionScores,
    strongestDimension: strongestDimension || workshop.strongestDimension,
    weakestDimension: weakestDimension || workshop.weakestDimension,
  };
}

function parseDimensionStat(value: unknown) {
  const text = stringFrom(value, "").trim();
  if (!text) return undefined;

  const parts = text.split(/[·-]/).map((part) => part.trim()).filter(Boolean);
  const label = parts[0] || text;
  const scoreText = parts[1] || "";
  const score = optionalNumber(scoreText.replace("/5", "")) ?? 0;
  return { label, score };
}

function buildChallengeComparisons(challengeStats: RawRow[], challenges: RawRow[], checkins: RawRow[], students: InstructorStudent[]): ChallengeComparison[] {
  if (challengeStats.length) {
    return challengeStats.map((row) => {
      const challengeId = valueBy(row, ["ChallengeID", "challenge_id", "WorkshopID", "workshop_id"]);
      const workshopId = valueBy(row, ["WorkshopID", "workshop_id"]);
      const participantCount = unique(
        checkins
          .filter((checkin) => {
            const completed = valueBy(checkin, ["Completed", "completed"]);
            return (!completed || isTruthy(completed)) && getChallengeSeriesId(checkin) === getChallengeSeriesId(row);
          })
          .map((checkin) => valueBy(checkin, ["UserID", "user_id", "participant_id"]))
          .filter(Boolean),
      ).length;
      const over80Rate = clamp(round(numberFrom(valueBy(row, ["Completion80Rate", "Over80Rate", "CompletionRate80"]), 0)), 0, 100);
      const under80Rate = optionalNumber(valueBy(row, ["Under80Rate", "CompletionUnder80Rate"]));
      return {
        id: challengeId || workshopId || "challenge",
        title:
          valueBy(row, ["Title", "ChallengeTitle", "Name", "ChallengeName"]) ||
          (workshopId ? `Mini Challenge ${workshopId.replace(/\D/g, "") || workshopId}` : challengeId),
        participantCount,
        totalDays: Math.max(1, numberFrom(valueBy(row, ["TotalDays", "Days", "Duration"]), 1)),
        retentionRate: clamp(round(numberFrom(valueBy(row, ["RetentionRate", "PracticeRetentionRate", "CheckinRate"]), 0)), 0, 100),
        over80Rate,
        under80Rate: clamp(round(under80Rate ?? 100 - over80Rate), 0, 100),
        dropoutRate: clamp(round(numberFrom(valueBy(row, ["DropoutRate", "Dropout"]), 0)), 0, 100),
      };
    });
  }

  const workshopIds = unique(challenges.map((item) => valueBy(item, ["WorkshopID", "workshop_id"])).filter(Boolean));
  return workshopIds.map((workshopId) => {
    const challengeRows = challenges.filter((item) => valueBy(item, ["WorkshopID", "workshop_id"]) === workshopId);
    const totalDays = Math.max(1, unique(challengeRows.map((item) => valueBy(item, ["Day", "day"]) || valueBy(item, ["ChallengeID", "challenge_id"]))).length);
    const challengeCheckins = checkins.filter((item) => valueBy(item, ["WorkshopID", "workshop_id"]) === workshopId);
    const completedByStudent = new Map<string, Set<string>>();
    for (const row of challengeCheckins) {
      if (normalize(valueBy(row, ["Completed", "completed"])) === "false") continue;
      const userId = valueBy(row, ["UserID", "user_id", "participant_id"]);
      const day = valueBy(row, ["Day", "day"]) || valueBy(row, ["ChallengeID", "challenge_id"]);
      if (!completedByStudent.has(userId)) completedByStudent.set(userId, new Set());
      completedByStudent.get(userId)?.add(day);
    }
    const ratios = students.map((student) => (completedByStudent.get(student.id)?.size || 0) / totalDays);
    const participantCount = completedByStudent.size;
    const completedDays = ratios.reduce((total, ratio) => total + ratio * totalDays, 0);
    const finalWeekThreshold = Math.min(7, totalDays);
    const dropoutCount = ratios.filter((ratio) => ratio * finalWeekThreshold < 2 && totalDays >= 7).length;
    return {
      id: workshopId,
      title: `Mini Challenge ${workshopId.replace(/\D/g, "") || workshopId}`,
      participantCount,
      totalDays,
      retentionRate: participantCount ? round((completedDays / (participantCount * totalDays)) * 100) : 0,
      over80Rate: participantCount ? round((ratios.filter((ratio) => ratio >= 0.8).length / participantCount) * 100) : 0,
      under80Rate: participantCount ? round((ratios.filter((ratio) => ratio < 0.8).length / participantCount) * 100) : 0,
      dropoutRate: participantCount ? round((dropoutCount / participantCount) * 100) : 0,
    };
  });
}

function getChallengeSeriesId(row: RawRow) {
  const challengeId = valueBy(row, ["ChallengeID", "challenge_id"]);
  if (challengeId) return normalize(challengeId.replace(/-D\d+$/i, ""));
  const workshopId = valueBy(row, ["WorkshopID", "workshop_id"]);
  return normalize(workshopId.replace(/^WS/i, "MC"));
}

function aggregateChallengeComparisons(items: ChallengeComparison[]) {
  if (!items.length) return { retentionRate: 0, over80Rate: 0, under80Rate: 0, dropoutRate: 0 };
  return {
    retentionRate: round(average(items.map((item) => item.retentionRate))),
    over80Rate: round(average(items.map((item) => item.over80Rate))),
    under80Rate: round(average(items.map((item) => item.under80Rate))),
    dropoutRate: round(average(items.map((item) => item.dropoutRate))),
  };
}

function getHistoricalActivityMetrics(
  learners: RawRow[],
  checkins: RawRow[],
  evaluations: RawRow[],
  challenges: RawRow[],
  workshops: RawRow[],
  selfTemplateIds: string[],
  peerTemplateIds: string[],
  cutoff: Date,
) {
  const cutoffTime = cutoff.getTime();
  const activityWindowStart = cutoffTime - 72 * 60 * 60 * 1000;
  const dueChallengeIds = unique(
    challenges
      .filter((challenge) => {
        const date = parseDate(valueBy(challenge, ["Date", "date"]));
        return Boolean(date && date.getTime() <= cutoffTime);
      })
      .map((challenge) => valueBy(challenge, ["ChallengeID", "challenge_id"]))
      .filter(Boolean),
  );
  const dueWorkshops = workshops.filter((workshop) => {
    const workshopId = valueBy(workshop, ["WorkshopID", "workshop_id"]);
    const order = numberFrom(valueBy(workshop, ["Order", "order"]), numberFrom(workshopId.replace(/\D/g, ""), 0));
    const date = parseDate(valueBy(workshop, ["Date", "ScheduleDate", "StartDate"]));
    return order > 0 && isApplicableStatus(valueBy(workshop, ["Status", "status"])) && Boolean(date && date.getTime() <= cutoffTime);
  });
  const checkinsBeforeCutoff = checkins.filter((checkin) => {
    const date = parseDate(valueBy(checkin, ["UpdatedAt", "CreatedAt", "Date", "Timestamp"]));
    return Boolean(date && date.getTime() <= cutoffTime);
  });
  const evaluationsBeforeCutoff = evaluations.filter((evaluation) => {
    const date = parseDate(valueBy(evaluation, ["UpdatedAt", "CreatedAt", "Date", "Timestamp"]));
    return Boolean(date && date.getTime() <= cutoffTime);
  });
  const completionRatios = learners.map((learner) => {
    const userId = valueBy(learner, ["UserID", "user_id", "participant_id"]);
    const completedIds = unique(
      checkinsBeforeCutoff
        .filter((checkin) => {
          const completed = valueBy(checkin, ["Completed", "completed"]);
          return valueBy(checkin, ["UserID", "user_id", "participant_id"]) === userId && (!completed || isTruthy(completed));
        })
        .map((checkin) => valueBy(checkin, ["ChallengeID", "challenge_id"]))
        .filter((challengeId) => dueChallengeIds.includes(challengeId)),
    );
    return dueChallengeIds.length ? completedIds.length / dueChallengeIds.length : 0;
  });
  const assessmentRates = learners.map((learner) => {
    const userId = valueBy(learner, ["UserID", "user_id", "participant_id"]);
    const userEvaluations = evaluationsBeforeCutoff.filter(
      (evaluation) => valueBy(evaluation, ["UserID", "user_id", "participant_id"]) === userId,
    );
    const selfCount = unique(
      userEvaluations
        .filter((evaluation) => selfTemplateIds.includes(valueBy(evaluation, ["TemplateID", "template_id"])))
        .map((evaluation) => valueBy(evaluation, ["TemplateID", "template_id"])),
    ).length;
    const peerCount = unique(
      userEvaluations
        .filter((evaluation) => isPeerAssessment(evaluation))
        .map((evaluation) => valueBy(evaluation, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]))
        .filter(Boolean),
    ).length;
    const parts = [
      ...(selfTemplateIds.length ? [Math.min(1, selfCount / selfTemplateIds.length)] : []),
      ...(peerTemplateIds.length ? [Math.min(1, peerCount / (peerTemplateIds.length * 3))] : []),
    ];
    return parts.length ? average(parts) : 0;
  });
  const learnerIds = new Set(
    learners.map((learner) => valueBy(learner, ["UserID", "user_id", "participant_id"])).filter(Boolean),
  );
  const activeUserIds = new Set(
    [...checkinsBeforeCutoff, ...evaluationsBeforeCutoff]
      .filter((row) => {
        const date = parseDate(valueBy(row, ["UpdatedAt", "CreatedAt", "Date", "Timestamp"]));
        return Boolean(date && date.getTime() >= activityWindowStart);
      })
      .map((row) => valueBy(row, ["UserID", "user_id", "participant_id"]))
      .filter((userId) => learnerIds.has(userId)),
  );
  dueWorkshops.forEach((workshop) => {
    const workshopId = valueBy(workshop, ["WorkshopID", "workshop_id"]);
    const date = parseDate(valueBy(workshop, ["Date", "ScheduleDate", "StartDate"]));
    if (!date || date.getTime() < activityWindowStart) return;
    learners.forEach((learner) => {
      if (isTruthy(valueBy(learner, workshopAttendanceKeys(workshopId)))) {
        activeUserIds.add(valueBy(learner, ["UserID", "user_id", "participant_id"]));
      }
    });
  });
  const workshopRatios = learners.map((learner) =>
    dueWorkshops.length
      ? dueWorkshops.filter((workshop) => isTruthy(valueBy(learner, workshopAttendanceKeys(valueBy(workshop, ["WorkshopID", "workshop_id"]))))).length / dueWorkshops.length
      : 0,
  );
  const activeProgressParts = Number(dueChallengeIds.length > 0) + Number(dueWorkshops.length > 0) + Number(selfTemplateIds.length > 0) + Number(peerTemplateIds.length > 0);
  const progress = learners.length && activeProgressParts
    ? round(average(learners.map((_, index) => {
        const parts = [
          ...(dueChallengeIds.length ? [completionRatios[index]] : []),
          ...(dueWorkshops.length ? [workshopRatios[index]] : []),
          ...(selfTemplateIds.length || peerTemplateIds.length ? [assessmentRates[index]] : []),
        ];
        return average(parts) * 100;
      })))
    : 0;

  return {
    engagement: learners.length ? round((activeUserIds.size / learners.length) * 100) : 0,
    progress,
    practiceRetention: round(average(completionRatios) * 100),
    assessment: round(average(assessmentRates) * 100),
    over80: learners.length ? round((completionRatios.filter((ratio) => ratio >= 0.8).length / learners.length) * 100) : 0,
    under80: learners.length ? round((completionRatios.filter((ratio) => ratio < 0.8).length / learners.length) * 100) : 0,
    dropout:
      learners.length && dueChallengeIds.length >= 7
        ? round((completionRatios.filter((ratio) => ratio * dueChallengeIds.length < 2).length / learners.length) * 100)
        : 0,
  };
}

function buildChallengeDailyStats(rows: RawRow[], challenges: RawRow[]): ChallengeDailyStat[] {
  const scheduleByChallengeDay = new Map(
    challenges.map((challenge) => {
      const rawChallengeId = valueBy(challenge, ["ChallengeID", "challenge_id"]);
      const challengeId = rawChallengeId.replace(/-D\d+$/i, "");
      const day = Math.max(1, numberFrom(valueBy(challenge, ["Day", "day"]), 1));
      return [`${challengeId}::${day}`, parseDate(valueBy(challenge, ["Date", "date"]))] as const;
    }),
  );
  const today = startOfDay(new Date());

  return rows.map((row) => {
    const checkinRate = clamp(round(numberFrom(valueBy(row, ["CheckinRate", "CheckInRate", "Rate", "RetentionRate"]), 0)), 0, 100);
    const challengeId = valueBy(row, ["ChallengeID", "challenge_id", "WorkshopID", "workshop_id"]);
    const day = Math.max(1, numberFrom(valueBy(row, ["Day", "day"]), 1));
    const scheduledDate = scheduleByChallengeDay.get(`${challengeId}::${day}`);
    const isFuture = Boolean(scheduledDate && startOfDay(scheduledDate).getTime() > today.getTime());
    return {
      challengeId,
      day,
      checkinRate,
      status: isFuture ? "future" : normalizeDailyStatus(valueBy(row, ["Status", "status"]), checkinRate),
    };
  }).filter((item) => Boolean(item.challengeId));
}

function buildChallengeFunnel(rows: RawRow[]): ChallengeFunnelPoint[] {
  return rows.map((row) => ({
    challengeId: valueBy(row, ["ChallengeID", "challenge_id", "WorkshopID", "workshop_id"]),
    milestone: valueBy(row, ["Milestone", "Label", "Name"]) || `Ngày ${numberFrom(valueBy(row, ["Day", "day"]), 0)}`,
    day: Math.max(0, numberFrom(valueBy(row, ["Day", "day"]), 0)),
    participantCount: numberFrom(valueBy(row, ["ParticipantCount", "Participants", "TotalStudents"]), 0),
    activeCount: numberFrom(valueBy(row, ["ActiveCount", "CheckinCount", "ActiveStudents"]), 0),
    retentionRate: clamp(round(numberFrom(valueBy(row, ["RetentionRate", "Rate"]), 0)), 0, 100),
  })).filter((item) => Boolean(item.challengeId));
}

function normalizeDailyStatus(value: unknown, rate: number): ChallengeDailyStat["status"] {
  const normalized = normalize(value);
  if (["good", "medium", "low", "future"].includes(normalized)) return normalized as ChallengeDailyStat["status"];
  if (["tot", "tốt", "xanh"].includes(normalized)) return "good";
  if (["trungbinh", "trung bình", "vang", "vàng"].includes(normalized)) return "medium";
  if (["thap", "thấp", "do", "đỏ", "nguyco", "nguy cơ"].includes(normalized)) return "low";
  if (["future", "chuadienra", "chưa diễn ra", "chuatoi", "chưa tới"].includes(normalized)) return "future";
  if (rate <= 0) return "future";
  if (rate >= 70) return "good";
  if (rate >= 30) return "medium";
  return "low";
}

function getDueGroupCheckinWeeks(challenges: RawRow[], cutoff: Date) {
  const challenge21 = challenges.find((challenge) => numberFrom(valueBy(challenge, ["Day", "day"]), 0) === 21);
  if (!challenge21) return [];
  const challenge21Series = valueBy(challenge21, ["ChallengeID", "challenge_id"]).replace(/-D\d+$/i, "");
  const challengeRows = challenges.filter((challenge) =>
    valueBy(challenge, ["ChallengeID", "challenge_id"]).replace(/-D\d+$/i, "") === challenge21Series,
  );
  const scheduledWeeks = [1, 2, 3].map((week) => {
    const dueDay = week * 7;
    const row = challengeRows.find((challenge) => numberFrom(valueBy(challenge, ["Day", "day"]), 0) === dueDay);
    return { week, date: row ? parseDate(valueBy(row, ["Date", "date"])) : undefined };
  });
  return scheduledWeeks
    .filter((item) => item.date && startOfDay(item.date).getTime() <= startOfDay(cutoff).getTime())
    .map((item) => item.week);
}

function buildGroups(options: RawRow[], members: RawRow[], checkins: RawRow[], users: RawRow[], dueWeeks: number[]): InstructorGroup[] {
  const optionMap = new Map(options.map((item) => [valueBy(item, ["GroupID", "group_id"]), valueBy(item, ["GroupName", "group_name", "Name"])]));
  const groupIds = unique(members.map((item) => valueBy(item, ["GroupID", "group_id"])).filter(Boolean));
  return groupIds.map((groupId) => {
    const groupMembers = members.filter((item) => valueBy(item, ["GroupID", "group_id"]) === groupId);
    const groupCheckins = checkins.filter((item) => valueBy(item, ["GroupID", "group_id"]) === groupId);
    const memberNames = groupMembers.map((member) => {
      const user = users.find((item) => valueBy(item, ["UserID", "user_id", "participant_id"]) === valueBy(member, ["UserID", "user_id", "participant_id"]));
      return valueBy(user || {}, ["FullName", "full_name", "Name"]) || valueBy(member, ["UserID", "user_id", "participant_id"]);
    });
    const completedWeeks = unique(groupCheckins.map((item) => String(valueBy(item, ["Week", "week"])))).map(Number);
    const completedDueWeeks = dueWeeks.filter((week) => completedWeeks.includes(week));
    return {
      id: groupId,
      name: optionMap.get(groupId) || valueBy(groupMembers[0] || {}, ["GroupName", "group_name"]) || groupId,
      members: memberNames,
      checkinWeeks: completedWeeks.length,
      dueWeeks,
      missingWeeks: dueWeeks.filter((week) => !completedWeeks.includes(week)),
      rate: dueWeeks.length ? clamp(round((completedDueWeeks.length / dueWeeks.length) * 100), 0, 100) : 0,
    };
  });
}

function buildCohortHealthHistory({
  learners,
  checkins,
  evaluations,
  challenges,
  workshops,
  selfTemplateIds,
  peerTemplateIds,
  groupMembers,
  groupCheckins,
  peerGroupActive,
}: {
  learners: RawRow[];
  checkins: RawRow[];
  evaluations: RawRow[];
  challenges: RawRow[];
  workshops: RawRow[];
  selfTemplateIds: string[];
  peerTemplateIds: string[];
  groupMembers: RawRow[];
  groupCheckins: RawRow[];
  peerGroupActive: boolean;
}): CohortHealthHistoryPoint[] {
  const today = startOfDay(new Date());
  const groupIds = unique(groupMembers.map((row) => valueBy(row, ["GroupID", "group_id"])).filter(Boolean));

  return Array.from({ length: 30 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (29 - index));
    const cutoff = new Date(day);
    cutoff.setHours(23, 59, 59, 999);
    const metrics = getHistoricalActivityMetrics(learners, checkins, evaluations, challenges, workshops, selfTemplateIds, peerTemplateIds, cutoff);
    const dueWeeks = getDueGroupCheckinWeeks(challenges, cutoff);
    const completedGroupRates = groupIds.map((groupId) => {
      if (!dueWeeks.length) return 0;
      const completedWeeks = unique(
        groupCheckins
          .filter((row) => {
            if (valueBy(row, ["GroupID", "group_id"]) !== groupId) return false;
            const createdAt = parseDate(valueBy(row, ["CreatedAt", "UpdatedAt", "Date", "Timestamp"]));
            return Boolean(createdAt && createdAt.getTime() <= cutoff.getTime());
          })
          .map((row) => String(valueBy(row, ["Week", "week"]))),
      ).map(Number);
      return (dueWeeks.filter((week) => completedWeeks.includes(week)).length / dueWeeks.length) * 100;
    });
    const peerGroup = peerGroupActive && dueWeeks.length ? roundAverage(completedGroupRates) : null;
    const activeValues = [metrics.engagement, metrics.progress, metrics.practiceRetention, metrics.assessment, ...(peerGroup === null ? [] : [peerGroup])];
    return {
      date: `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`,
      engagement: metrics.engagement,
      progress: metrics.progress,
      practice: metrics.practiceRetention,
      assessment: metrics.assessment,
      peerGroup,
      health: roundAverage(activeValues),
    };
  });
}

function buildRecentActivity(checkins: RawRow[], evaluations: RawRow[], users: RawRow[]) {
  const names = new Map(users.map((user) => [valueBy(user, ["UserID", "user_id", "participant_id"]), valueBy(user, ["FullName", "full_name", "Name"])]));
  const checkinItems = checkins.slice(-4).map((item) => `${names.get(valueBy(item, ["UserID", "user_id", "participant_id"])) || "Học viên"} đã check-in ${valueBy(item, ["ChallengeID", "challenge_id"]) || ""}`);
  const evaluationItems = evaluations.slice(-4).map((item) => `${names.get(valueBy(item, ["UserID", "user_id", "participant_id"])) || "Học viên"} đã gửi đánh giá ${valueBy(item, ["TemplateID", "template_id"]) || ""}`);
  return [...checkinItems, ...evaluationItems].slice(-6).reverse();
}

const reportDimensions = [
  { id: "being", title: "Tôi hiện diện thế nào" },
  { id: "relating", title: "Tôi kết nối ra sao" },
  { id: "achieving", title: "Tôi đạt mục tiêu bằng cách nào" },
];

function buildLeadershipReport(
  userId: string,
  studentName: string,
  answers: RawRow[],
  questions: RawRow[],
  evaluations: RawRow[],
): LeadershipReport {
  const userAnswers = answers.filter((answer) => valueBy(answer, ["UserID", "user_id", "participant_id"]) === userId);
  const userEvaluations = evaluations.filter((evaluation) => valueBy(evaluation, ["UserID", "user_id", "participant_id"]) === userId);
  const responseMeta = new Map(
    userEvaluations.map((evaluation) => [
      normalize(valueBy(evaluation, ["ResponseID", "EvaluationID", "response_id"])),
      {
        templateId: normalize(valueBy(evaluation, ["TemplateID", "template_id"])),
        respondentType: normalize(valueBy(evaluation, ["RespondentType", "respondent_type"])),
      },
    ]),
  );
  const scenarioQuestions = questions
    .filter((question) => {
      const templateId = normalize(valueBy(question, ["TemplateID", "template_id"]));
      const type = normalize(valueBy(question, ["QuestionType", "question_type"]));
      return templateId.includes("self-common") && type.includes("single");
    })
    .map((question) => ({
      id: valueBy(question, ["QuestionID", "question_id"]),
      order: numberFrom(valueBy(question, ["Order", "order"]), getQuestionOrder(valueBy(question, ["QuestionID", "question_id"]))),
      question: valueBy(question, ["QuestionText", "question_text", "Text"]),
      reactiveText: getScenarioOptionText(question, "reactive"),
      creativeText: getScenarioOptionText(question, "creative"),
      dimension: getScenarioDimension(valueBy(question, ["Dimension", "dimension"]), numberFrom(valueBy(question, ["Order", "order"]), getQuestionOrder(valueBy(question, ["QuestionID", "question_id"])))),
    }))
    .filter((question) => question.id && question.order)
    .sort((a, b) => a.order - b.order)
    .slice(0, 30);
  const scenarios = scenarioQuestions.map((question) => {
    const relatedAnswers = userAnswers.filter((answer) => {
      const answerOrder = getQuestionOrder(valueBy(answer, ["QuestionID", "question_id"]));
      return answerOrder === question.order;
    });
    const matchingSelfAnswers = userAnswers
      .filter(
        (answer) =>
          normalize(valueBy(answer, ["QuestionID", "question_id"])) === normalize(question.id) &&
          isSelfAnswer(answer, responseMeta) &&
          Boolean(normalizeScenarioChoice(valueBy(answer, ["Value", "value"]))),
      )
      .sort(
        (a, b) =>
          getAnswerTimestamp(b) - getAnswerTimestamp(a),
      );
    const selfAnswer = normalizeScenarioChoice(valueBy(matchingSelfAnswers[0], ["Value", "value"]));
    const peerAnswers = relatedAnswers.filter((answer) => isPeerAnswer(answer, responseMeta));
    const peerCreativeCount = peerAnswers.filter((answer) => normalizeScenarioChoice(valueBy(answer, ["Value", "value"])) === "creative").length;
    const peerReactiveCount = peerAnswers.filter((answer) => normalizeScenarioChoice(valueBy(answer, ["Value", "value"])) === "reactive").length;
    const peerTotal = peerCreativeCount + peerReactiveCount;
    const matching = selfAnswer === "creative" ? peerCreativeCount : selfAnswer === "reactive" ? peerReactiveCount : 0;
    const alignmentRate = peerTotal ? round((matching / peerTotal) * 100) : 0;
    const tone: LeadershipReport["scenarios"][number]["tone"] =
      alignmentRate >= 80 && selfAnswer === "creative"
        ? "strength"
        : alignmentRate >= 80 && selfAnswer === "reactive"
          ? "practice"
          : alignmentRate < 40 && peerTotal
            ? "blindspot"
            : "mixed";

    return {
      order: question.order,
      question: question.question,
      dimension: question.dimension,
      reactiveText: question.reactiveText,
      creativeText: question.creativeText,
      selfAnswer,
      peerCreativeCount,
      peerReactiveCount,
      peerTotal,
      alignmentRate,
      tone,
    };
  });
  const dimensions = reportDimensions.map((dimension) => {
    const rows = scenarios.filter((scenario) => scenario.dimension === dimension.id);
    const selfAnswered = rows.filter((row) => row.selfAnswer).length;
    const selfCreative = rows.filter((row) => row.selfAnswer === "creative").length;
    const peerTotal = rows.reduce((sum, row) => sum + row.peerTotal, 0);
    const peerCreative = rows.reduce((sum, row) => sum + row.peerCreativeCount, 0);
    const peerAligned = rows.reduce((sum, row) => {
      if (!row.selfAnswer) return sum;
      return sum + (row.selfAnswer === "creative" ? row.peerCreativeCount : row.peerReactiveCount);
    }, 0);
    const alignmentRate = peerTotal ? round((peerAligned / peerTotal) * 100) : 0;
    const selfCreativeRate = selfAnswered ? round((selfCreative / selfAnswered) * 100) : 0;
    const peerCreativeRate = peerTotal ? round((peerCreative / peerTotal) * 100) : 0;

    return {
      ...dimension,
      selfCreativeRate,
      peerCreativeRate,
      alignmentRate,
      insight: getDimensionInsight(dimension.title, selfCreativeRate, peerCreativeRate, alignmentRate),
    };
  });
  const selfAnswered = scenarios.filter((row) => row.selfAnswer).length;
  const selfCreative = scenarios.filter((row) => row.selfAnswer === "creative").length;
  const peerTotal = scenarios.reduce((sum, row) => sum + row.peerTotal, 0);
  const peerCreative = scenarios.reduce((sum, row) => sum + row.peerCreativeCount, 0);
  const peerRespondentIds = unique(
    userEvaluations
      .filter(isPeerAssessment)
      .map((evaluation) => normalize(valueBy(evaluation, ["ResponseID", "EvaluationID", "response_id"])))
      .filter(Boolean),
  );
  const peerRespondentCount =
    peerRespondentIds.length ||
    unique(
      userAnswers
        .filter((answer) => isPeerAnswer(answer, responseMeta))
        .map((answer) => normalize(valueBy(answer, ["ResponseID", "response_id"])))
        .filter(Boolean),
    ).length;
  const openFeedbackGroups = buildOpenFeedbackGroups(userAnswers, questions, responseMeta);
  const peerInsights = openFeedbackGroups.flatMap((group) => group.answers).slice(0, 6);
  const recommendations = buildRecommendations(dimensions, scenarios);

  return {
    userId,
    studentName,
    peerRespondentCount,
    selfCreativeRate: selfAnswered ? round((selfCreative / selfAnswered) * 100) : 0,
    peerCreativeRate: peerTotal ? round((peerCreative / peerTotal) * 100) : 0,
    peerInsights,
    openFeedbackGroups,
    dimensions,
    scenarios,
    recommendations,
  };
}

function buildOpenFeedbackGroups(
  userAnswers: RawRow[],
  questions: RawRow[],
  responseMeta: Map<string, { templateId: string; respondentType: string }>,
) {
  const openQuestions = questions
    .filter((question) => {
      const templateId = normalize(valueBy(question, ["TemplateID", "template_id"]));
      const type = normalize(valueBy(question, ["QuestionType", "question_type"]));
      return type.includes("text") && (templateId.includes("peer") || templateId.includes("other"));
    })
    .map((question, index) => {
      const questionId = valueBy(question, ["QuestionID", "question_id"]);
      return {
        questionId,
        order: numberFrom(valueBy(question, ["Order", "order"]), getQuestionOrder(questionId) || index + 31),
        question: valueBy(question, ["QuestionText", "question_text", "Text"]) || `Câu hỏi mở ${index + 1}`,
      };
    })
    .filter((question) => question.questionId || question.question)
    .sort((a, b) => a.order - b.order);

  const questionIdCounts = new Map<string, number>();
  openQuestions.forEach((question) => {
    if (!question.questionId) return;
    questionIdCounts.set(question.questionId, (questionIdCounts.get(question.questionId) || 0) + 1);
  });
  const uniqueQuestionById = new Map(
    openQuestions
      .filter((question) => question.questionId && questionIdCounts.get(question.questionId) === 1)
      .map((question) => [question.questionId, question]),
  );
  const questionByOrder = new Map(openQuestions.map((question) => [question.order, question]));
  const groups = new Map<string, { questionId: string; order: number; question: string; answers: string[] }>();
  const answersByResponse = new Map<string, RawRow[]>();

  userAnswers
    .filter((answer) => isPeerAnswer(answer, responseMeta))
    .filter((answer) => isOpenTextAnswer(valueBy(answer, ["Value", "value"])))
    .forEach((answer) => {
      const responseId = valueBy(answer, ["ResponseID", "response_id"]) || "__unknown__";
      const items = answersByResponse.get(responseId) || [];
      items.push(answer);
      answersByResponse.set(responseId, items);
    });

  answersByResponse.forEach((items) => {
    const sortedItems = [...items].sort((a, b) => {
      const orderDiff =
        getQuestionOrder(valueBy(a, ["QuestionID", "question_id"])) -
        getQuestionOrder(valueBy(b, ["QuestionID", "question_id"]));
      if (orderDiff) return orderDiff;
      return valueBy(a, ["UpdatedAt", "CreatedAt", "updated_at", "created_at"]).localeCompare(
        valueBy(b, ["UpdatedAt", "CreatedAt", "updated_at", "created_at"]),
      );
    });
    const questionIdCountsInResponse = new Map<string, number>();
    sortedItems.forEach((answer) => {
      const answerQuestionId = valueBy(answer, ["QuestionID", "question_id"]);
      if (!answerQuestionId) return;
      questionIdCountsInResponse.set(answerQuestionId, (questionIdCountsInResponse.get(answerQuestionId) || 0) + 1);
    });

    sortedItems.forEach((answer, index) => {
      const answerQuestionId = valueBy(answer, ["QuestionID", "question_id"]);
      const answerOrder = getQuestionOrder(answerQuestionId);
      const idIsUniqueInResponse = questionIdCountsInResponse.get(answerQuestionId) === 1;
      const matchedQuestion =
        (idIsUniqueInResponse && answerOrder ? questionByOrder.get(answerOrder) : undefined) ||
        openQuestions[index] ||
        (idIsUniqueInResponse ? uniqueQuestionById.get(answerQuestionId) : undefined);
      const fallbackOrder = answerOrder || index + 1;
      const question = matchedQuestion || {
        questionId: answerQuestionId || `OPEN-${fallbackOrder}`,
        order: fallbackOrder,
        question: answerQuestionId ? `Câu hỏi mở ${fallbackOrder}` : "Phản hồi mở từ người khác",
      };
      const key = `${question.order}-${question.questionId || question.question}`;
      const group = groups.get(key) || { ...question, answers: [] };
      const value = valueBy(answer, ["Value", "value"]).trim();
      if (value) group.answers.push(value);
      groups.set(key, group);
    });
  });

  return Array.from(groups.values())
    .filter((group) => group.answers.length)
    .sort((a, b) => a.order - b.order);
}

function isOpenTextAnswer(value: string) {
  const text = String(value || "").trim();
  return text.length >= 1 && !normalizeScenarioChoice(text) && Number.isNaN(Number(text));
}

function getScenarioDimension(value: string, order: number) {
  const key = normalize(value);
  if (key.includes("being") || key.includes("presence") || key.includes("hiendien")) return "being";
  if (key.includes("relating") || key.includes("connect") || key.includes("ketnoi")) return "relating";
  if (key.includes("achieving") || key.includes("goal") || key.includes("muctieu")) return "achieving";
  if (order <= 10) return "being";
  if (order <= 20) return "relating";
  return "achieving";
}

function getQuestionOrder(questionId: string) {
  const match = String(questionId || "").match(/Q(\d+)$/i);
  return match ? Number(match[1]) || 0 : 0;
}

function getAnswerTimestamp(answer?: RawRow) {
  if (!answer) return 0;
  const value = valueBy(answer, ["UpdatedAt", "CreatedAt", "updated_at", "created_at"]);
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function normalizeScenarioChoice(value: unknown): "reactive" | "creative" | "" {
  const key = normalize(value);
  if (key.startsWith("reactive") || key.startsWith("phanung")) return "reactive";
  if (key.startsWith("creative") || key.startsWith("sangtao")) return "creative";
  return "";
}

function parseScenarioOption(option: string) {
  const text = String(option || "").trim();
  const doubleSeparator = text.indexOf("::");
  if (doubleSeparator >= 0) {
    return {
      label: text.slice(0, doubleSeparator).trim(),
      body: text.slice(doubleSeparator + 2).trim(),
    };
  }

  const singleSeparator = text.match(/^(Phản ứng|Phan ung|Reactive|Sáng tạo|Sang tao|Creative)\s*:\s*(.+)$/i);
  if (singleSeparator) {
    return {
      label: singleSeparator[1].trim(),
      body: singleSeparator[2].trim(),
    };
  }

  return { label: text, body: "" };
}

function getScenarioOptionText(question: RawRow, target: "reactive" | "creative") {
  const options = valueBy(question, ["Options", "options", "Option", "LuaChon", "Lựa chọn", "Lua chon"])
    .split("|")
    .map((option) => option.trim())
    .filter(Boolean);
  const matched = options.find((option) => {
    const parsed = parseScenarioOption(option);
    return normalizeScenarioChoice(parsed.label || option) === target;
  });

  if (!matched) return "";
  const parsed = parseScenarioOption(matched);
  return parsed.body || parsed.label;
}

function isSelfAnswer(answer: RawRow, responseMeta: Map<string, { templateId: string; respondentType: string }>) {
  const templateId = normalize(valueBy(answer, ["TemplateID", "template_id"]));
  const meta = responseMeta.get(normalize(valueBy(answer, ["ResponseID", "response_id"])));
  return templateId.includes("self") || meta?.respondentType === "self" || meta?.templateId.includes("self");
}

function isPeerAnswer(answer: RawRow, responseMeta: Map<string, { templateId: string; respondentType: string }>) {
  const templateId = normalize(valueBy(answer, ["TemplateID", "template_id"]));
  const meta = responseMeta.get(normalize(valueBy(answer, ["ResponseID", "response_id"])));
  return templateId.includes("peer") || templateId.includes("other") || templateId.includes("360") || meta?.respondentType === "peer" || Boolean(meta?.respondentType.includes("other")) || Boolean(meta?.templateId.includes("peer")) || Boolean(meta?.templateId.includes("other"));
}

function getDimensionInsight(title: string, selfRate: number, peerRate: number, alignmentRate: number) {
  if (!selfRate && !peerRate) return "Chưa đủ dữ liệu để đọc khía cạnh này.";
  if (alignmentRate >= 70 && peerRate >= selfRate) return `${title} đang được người khác nhìn nhận tích cực. Đây là vùng có thể tiếp tục phát huy.`;
  if (peerRate < selfRate - 20) return `${title} có khoảng cách giữa tự nhìn nhận và góc nhìn bên ngoài. Nên ưu tiên quan sát phản hồi thực tế.`;
  if (selfRate < 50 && peerRate < 50) return `${title} là vùng luyện tập quan trọng trong giai đoạn tới.`;
  return `${title} đang ở vùng chuyển tiếp, cần thêm tình huống thực hành để củng cố.`;
}

function buildRecommendations(dimensions: LeadershipReport["dimensions"], scenarios: LeadershipReport["scenarios"]) {
  const weakest = [...dimensions].sort((a, b) => a.peerCreativeRate - b.peerCreativeRate)[0];
  const practiceItems = scenarios.filter((item) => item.tone === "practice").slice(0, 2);
  const blindspots = scenarios.filter((item) => item.tone === "blindspot").slice(0, 2);
  const recommendations = [
    weakest ? `Ưu tiên luyện tập khía cạnh "${weakest.title}" trong 2 tuần tới.` : "",
    practiceItems.length ? `Chọn 1 tình huống phản ứng thường gặp để ghi nhận lại trước khi phản hồi.` : "",
    blindspots.length ? `Trao đổi với người đánh giá để hiểu thêm các điểm có góc nhìn khác biệt.` : "",
    "Duy trì nhật ký insight sau mỗi mini challenge để theo dõi thay đổi hành vi.",
  ];
  return recommendations.filter(Boolean);
}

function evaluationKey(item: RawRow) {
  return valueBy(item, ["TemplateID", "template_id"]) || valueBy(item, ["EvaluationID", "ResponseID", "response_id"]);
}

function isSelfAssessment(item: RawRow) {
  const respondentType = normalize(valueBy(item, ["RespondentType", "respondent_type", "Type", "type"]));
  const templateId = normalize(valueBy(item, ["TemplateID", "template_id"]));
  return respondentType === "selfbefore" || respondentType === "selfafter" || templateId.startsWith("self") || templateId.includes("self");
}

function isWorkshopAssessment(item: RawRow, templateById: Map<string, RawRow>) {
  const templateId = valueBy(item, ["TemplateID", "template_id"]);
  const template = templateById.get(templateId) || item;
  const type = normalize(valueBy(template, ["Type", "type"]));
  return type === "workshop" || (!type && /^ws\d+/i.test(templateId));
}

function getLatestStudentActivity(
  user: RawRow,
  context: { checkins: RawRow[]; evaluations: RawRow[]; workshops: RawRow[]; templates: RawRow[] },
) {
  const now = new Date();
  const templateById = new Map(context.templates.map((template) => [valueBy(template, ["TemplateID", "template_id"]), template]));
  const activityDates = [
    ...context.checkins.map(getRowActivityDate),
    ...context.evaluations
      .filter((evaluation) => isSelfAssessment(evaluation) || isWorkshopAssessment(evaluation, templateById))
      .map(getRowActivityDate),
    ...context.workshops
      .filter((workshop) => {
        const workshopId = valueBy(workshop, ["WorkshopID", "workshop_id"]);
        const workshopDate = parseDate(valueBy(workshop, ["Date", "ScheduleDate", "StartDate"]));
        return Boolean(
          workshopId &&
          workshopDate &&
          workshopDate.getTime() <= now.getTime() &&
          isTruthy(valueBy(user, workshopAttendanceKeys(workshopId))),
        );
      })
      .map((workshop) => parseDate(valueBy(workshop, ["Date", "ScheduleDate", "StartDate"]))),
  ].filter((date): date is Date => Boolean(date));

  return activityDates.sort((a, b) => b.getTime() - a.getTime())[0];
}

function getStudentAtRiskReasons(
  user: RawRow,
  context: { checkins: RawRow[]; evaluations: RawRow[]; miniChallenges: RawRow[]; workshops: RawRow[]; templates: RawRow[] },
) {
  const now = new Date();
  const today = startOfDay(now);
  const completedChallengeIds = new Set(
    context.checkins
      .filter((checkin) => isTruthy(valueBy(checkin, ["Completed", "completed"])))
      .map((checkin) => valueBy(checkin, ["ChallengeID", "challenge_id"]))
      .filter(Boolean),
  );
  const completedTemplateIds = new Set(
    context.evaluations.map((evaluation) => valueBy(evaluation, ["TemplateID", "template_id"])).filter(Boolean),
  );
  const dueOpenChallenges = context.miniChallenges.filter((challenge) => {
    const date = parseDate(valueBy(challenge, ["Date", "date"]));
    return isOpenStatus(valueBy(challenge, ["Status", "status"])) && Boolean(date && startOfDay(date).getTime() <= today.getTime());
  });
  const dueEnabledWorkshops = context.workshops.filter((workshop) => {
    const workshopId = valueBy(workshop, ["WorkshopID", "workshop_id"]);
    const order = numberFrom(valueBy(workshop, ["Order", "order"]), numberFrom(workshopId.replace(/\D/g, ""), 0));
    const date = parseDate(valueBy(workshop, ["Date", "ScheduleDate", "StartDate"]));
    return order > 0 && isEnabledWorkshopStatus(valueBy(workshop, ["Status", "status"])) && Boolean(date && startOfDay(date).getTime() <= today.getTime());
  });
  const openSelfTemplates = context.templates.filter(
    (template) => isOpenStatus(valueBy(template, ["Status", "status"])) && isSelfAssessment(template),
  );
  const reasons: string[] = [];

  if (dueOpenChallenges.some((challenge) => !completedChallengeIds.has(valueBy(challenge, ["ChallengeID", "challenge_id"])))) {
    reasons.push("miss check-in");
  }
  if (dueEnabledWorkshops.some((workshop) => !isTruthy(valueBy(user, workshopAttendanceKeys(valueBy(workshop, ["WorkshopID", "workshop_id"])))))) {
    reasons.push("chưa tham gia workshop");
  }
  if (openSelfTemplates.some((template) => !completedTemplateIds.has(valueBy(template, ["TemplateID", "template_id"])))) {
    reasons.push("chưa tự đánh giá");
  }

  return reasons;
}

function getRowActivityDate(row: RawRow) {
  return parseDate(valueBy(row, ["UpdatedAt", "CreatedAt", "Date", "Timestamp"]));
}

function isOpenStatus(value: unknown) {
  return ["active", "open", "now", "dangmo", "dangthuchien"].includes(normalize(value || "active"));
}

function isApplicableStatus(value: unknown, defaultToActive = true) {
  const normalized = normalize(value || (defaultToActive ? "active" : "locked"));
  return [
    "active",
    "open",
    "now",
    "done",
    "completed",
    "ended",
    "dangmo",
    "dangthuchien",
    "hoanthanh",
    "daketthuc",
  ].includes(normalized);
}

function isEnabledWorkshopStatus(value: unknown) {
  return ["active", "open", "now", "done", "completed", "ended", "dangmo", "dangthuchien", "hoanthanh", "daketthuc"].includes(
    normalize(value || "locked"),
  );
}

function isPeerAssessment(item: RawRow) {
  const respondentType = normalize(valueBy(item, ["RespondentType", "respondent_type", "Type", "type"]));
  const templateId = normalize(valueBy(item, ["TemplateID", "template_id"]));
  return respondentType === "peer" || respondentType.includes("peer") || respondentType.includes("other") || templateId.includes("peer") || templateId.includes("other") || templateId.includes("360");
}

function workshopAttendanceKeys(workshopId: string) {
  return [
    workshopId,
    `${workshopId}_Attended`,
    `${workshopId}Attended`,
    `${workshopId} Attended`,
    `${workshopId}_Attendance`,
    `${workshopId} Attendance`,
  ];
}

function hasAnyValue(row: RawRow, keys: string[]) {
  return keys.some((key) => row?.[key] !== undefined && row?.[key] !== null && String(row[key]).trim() !== "");
}

function isTruthy(value: unknown) {
  const normalized = normalize(value);
  return value === true || normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "co" || normalized === "x" || normalized === "checked" || normalized === "done";
}

function isLearner(user: RawRow) {
  const role = normalize(valueBy(user, ["Role", "role"]));
  const status = normalize(valueBy(user, ["Status", "status", "ParticipationStatus", "participation_status"]) || "active");
  const isInstructor = role.includes("giangvien") || role.includes("instructor") || role.includes("coach") || role.includes("admin");
  const isInactive = status.includes("inactive") || status.includes("dropout") || status.includes("completed");
  return !isInstructor && !isInactive;
}

export function buildMockInstructorDashboard(): InstructorDashboardData {
  const students: InstructorStudent[] = [
    { id: "LDKT001", name: "Trần Phú Gia", email: "gia@example.com", department: "QA/QC", cohortId: "CH001", xp: 90, currentWorkshop: 2, checkinCount: 7, evaluationCount: 5, selfAssessmentCount: 2, peerReviewCount: 3, reportUrl: "/reports/Leadership_Report_Tran_Phu_Gia.pdf", assessmentReportStatus: "published", assessmentReportDataReady: true, assessmentReportPublished: true, progressParts: { checkin: 28, workshop: 7, selfAssessment: 15, peerAssessment: 20 }, progressWeights: { checkin: 40, workshop: 25, selfAssessment: 15, peerAssessment: 20 }, longestStreak: 5, lastCheckin: "Hôm nay, 08:42", progress: 70, status: "Tốt" },
    { id: "LDKT002", name: "Nguyễn Hoàng Vũ", email: "hoangvu@example.com", department: "RD", cohortId: "CH001", xp: 70, currentWorkshop: 2, checkinCount: 5, evaluationCount: 3, selfAssessmentCount: 1, peerReviewCount: 2, reportUrl: "", assessmentReportStatus: "pending", assessmentReportDataReady: false, assessmentReportPublished: false, progressParts: { checkin: 20, workshop: 7, selfAssessment: 8, peerAssessment: 13 }, progressWeights: { checkin: 40, workshop: 25, selfAssessment: 15, peerAssessment: 20 }, longestStreak: 4, lastCheckin: "Hôm qua", progress: 48, status: "Cần chú ý" },
    { id: "LDKT003", name: "Trần Thị Ngọc Thảo", email: "thao@example.com", department: "RD", cohortId: "CH001", xp: 0, currentWorkshop: 2, checkinCount: 1, evaluationCount: 1, selfAssessmentCount: 1, peerReviewCount: 0, reportUrl: "", assessmentReportStatus: "pending", assessmentReportDataReady: false, assessmentReportPublished: false, progressParts: { checkin: 4, workshop: 7, selfAssessment: 8, peerAssessment: 0 }, progressWeights: { checkin: 40, workshop: 25, selfAssessment: 15, peerAssessment: 20 }, longestStreak: 1, lastCheckin: "3 ngày trước", progress: 19, status: "Cần chú ý" },
    { id: "LDKT004", name: "Đào Thị Hà Trang", email: "hatrang@example.com", department: "Kinh doanh", cohortId: "CH001", xp: 0, currentWorkshop: 2, checkinCount: 0, evaluationCount: 0, selfAssessmentCount: 0, peerReviewCount: 0, reportUrl: "", assessmentReportStatus: "pending", assessmentReportDataReady: false, assessmentReportPublished: false, progressParts: { checkin: 0, workshop: 7, selfAssessment: 0, peerAssessment: 0 }, progressWeights: { checkin: 40, workshop: 25, selfAssessment: 15, peerAssessment: 20 }, longestStreak: 0, lastCheckin: "Chưa check-in", progress: 7, status: "Cần chú ý" },
  ];
  const workshops: InstructorWorkshop[] = [
    { id: "WS0", title: "Workshop 0", description: "Workshop trải nghiệm", order: 0, status: "done", date: "16/06", openedForTotals: false, participantCount: 8, attendanceRate: 100, evaluationParticipationRate: 88, score: 4.6, responseCount: 7, completionRate: 88, dimensionScores: [{ label: "Rõ ràng", score: 4.8 }, { label: "An toàn chia sẻ", score: 4.4 }, { label: "Ứng dụng", score: 4.1 }, { label: "Facilitator", score: 4.6 }], strongestDimension: { label: "Rõ ràng", score: 4.8 }, weakestDimension: { label: "Ứng dụng", score: 4.1 }, comments: ["Buổi trải nghiệm giúp tôi hiểu rõ cách học.", "Không khí an toàn, dễ chia sẻ."] },
    { id: "WS1", title: "Workshop 1", description: "Lắng nghe", order: 1, status: "done", date: "17/06", openedForTotals: true, participantCount: 8, attendanceRate: 100, evaluationParticipationRate: 75, score: 4.3, responseCount: 6, completionRate: 75, dimensionScores: [{ label: "Rõ ràng", score: 4.4 }, { label: "Liên quan", score: 4.7 }, { label: "Facilitator", score: 4.5 }, { label: "An toàn chia sẻ", score: 3.8 }], strongestDimension: { label: "Liên quan", score: 4.7 }, weakestDimension: { label: "An toàn chia sẻ", score: 3.8 }, comments: ["Nội dung thực tế.", "Mong có thêm ví dụ tình huống."] },
    { id: "WS2", title: "Workshop 2", description: "Hiểu", order: 2, status: "now", date: "18/06", openedForTotals: true, participantCount: 7, attendanceRate: 88, evaluationParticipationRate: 63, score: 4.1, responseCount: 5, completionRate: 63, dimensionScores: [{ label: "Rõ ràng", score: 4.4 }, { label: "Liên quan", score: 4.2 }, { label: "Facilitator", score: 4.0 }, { label: "An toàn chia sẻ", score: 3.6 }], strongestDimension: { label: "Rõ ràng", score: 4.4 }, weakestDimension: { label: "An toàn chia sẻ", score: 3.6 }, comments: ["Bài tập phản tư hữu ích."] },
  ];
  const challengeComparisons: ChallengeComparison[] = [
    { id: "WS1", title: "Mini Challenge 1", participantCount: 8, totalDays: 5, retentionRate: 78, over80Rate: 63, under80Rate: 37, dropoutRate: 12 },
    { id: "WS2", title: "Mini Challenge 2", participantCount: 8, totalDays: 10, retentionRate: 59, over80Rate: 38, under80Rate: 62, dropoutRate: 25 },
    { id: "WS7", title: "Thử thách 21 ngày", participantCount: 8, totalDays: 21, retentionRate: 42, over80Rate: 25, under80Rate: 75, dropoutRate: 38 },
  ];
  const challengeDailyStats: ChallengeDailyStat[] = challengeComparisons.flatMap((challenge) =>
    Array.from({ length: challenge.totalDays }, (_, index) => {
      const day = index + 1;
      const checkinRate = clamp(challenge.retentionRate - Math.max(0, day - 1) * 3, 0, 100);
      return {
        challengeId: challenge.id,
        day,
        checkinRate,
        status: normalizeDailyStatus("", checkinRate),
      };
    }),
  );
  const challengeFunnel: ChallengeFunnelPoint[] = [
    { challengeId: "WS7", milestone: "Bắt đầu", day: 1, participantCount: 8, activeCount: 8, retentionRate: 100 },
    { challengeId: "WS7", milestone: "Ngày 3", day: 3, participantCount: 8, activeCount: 7, retentionRate: 88 },
    { challengeId: "WS7", milestone: "Ngày 7", day: 7, participantCount: 8, activeCount: 6, retentionRate: 75 },
    { challengeId: "WS7", milestone: "Ngày 14", day: 14, participantCount: 8, activeCount: 4, retentionRate: 50 },
    { challengeId: "WS7", milestone: "Ngày 21", day: 21, participantCount: 8, activeCount: 3, retentionRate: 38 },
  ];
  return {
    cohortId: "CH001",
    cohorts: ["CH001"],
    students,
    workshops,
    leadershipReports: students.map((student, index) => ({
      userId: student.id,
      studentName: student.name,
      peerRespondentCount: student.peerReviewCount,
      selfCreativeRate: [63, 57, 40, 0][index] || 0,
      peerCreativeRate: [70, 52, 35, 0][index] || 0,
      peerInsights: [
        "Người khác ghi nhận bạn bình tĩnh hơn khi nhận phản hồi khó.",
        "Bạn tạo cảm giác an toàn khi lắng nghe và hỏi lại trước khi phản hồi.",
        "Một số tình huống áp lực cao vẫn cần chậm lại để nhìn rộng hơn.",
      ].slice(0, Math.max(1, Math.min(3, student.peerReviewCount || 1))),
      openFeedbackGroups: [
        {
          questionId: "PEER-TEXT-31",
          order: 31,
          question: "Theo bạn, điểm mạnh nổi bật trong phong cách lãnh đạo của người này là gì?",
          answers: ["Người khác ghi nhận bạn bình tĩnh hơn khi nhận phản hồi khó.", "Bạn tạo cảm giác an toàn khi lắng nghe và hỏi lại trước khi phản hồi."],
        },
        {
          questionId: "PEER-TEXT-32",
          order: 32,
          question: "Theo bạn, lãnh đạo này cần phát triển hoặc cải thiện điều gì?",
          answers: ["Một số tình huống áp lực cao vẫn cần chậm lại để nhìn rộng hơn."],
        },
      ].filter((group) => student.peerReviewCount),
      dimensions: reportDimensions.map((dimension, dimensionIndex) => ({
        ...dimension,
        selfCreativeRate: Math.max(0, ([63, 57, 40, 0][index] || 0) - dimensionIndex * 8),
        peerCreativeRate: Math.max(0, ([70, 52, 35, 0][index] || 0) - dimensionIndex * 7),
        alignmentRate: Math.max(0, 78 - index * 12 - dimensionIndex * 8),
        insight: "Dữ liệu mẫu để kiểm tra bố cục báo cáo.",
      })),
      scenarios: Array.from({ length: 30 }, (_, scenarioIndex) => ({
        order: scenarioIndex + 1,
        question: `Tình huống ${scenarioIndex + 1}`,
        dimension: scenarioIndex < 10 ? "being" : scenarioIndex < 20 ? "relating" : "achieving",
        reactiveText: "Phản hồi nhanh theo cảm xúc hoặc cố bảo vệ hình ảnh trong tình huống áp lực.",
        creativeText: "Chậm lại, nhìn rộng hơn và chọn phản hồi có lợi cho mục tiêu chung.",
        selfAnswer: scenarioIndex % 3 === 0 ? "reactive" : "creative",
        peerCreativeCount: 2,
        peerReactiveCount: 1,
        peerTotal: 3,
        alignmentRate: scenarioIndex % 5 === 0 ? 33 : 67,
        tone: scenarioIndex % 5 === 0 ? "blindspot" : scenarioIndex % 3 === 0 ? "practice" : "strength",
      })),
      recommendations: ["Ưu tiên luyện tập vùng có tỷ lệ sáng tạo thấp nhất.", "Trao đổi thêm với người đánh giá ở các tình huống có góc nhìn khác biệt."],
    })),
    groups: [
      { id: "G01", name: "Sen Bền Bỉ", members: ["Trần Phú Gia", "Nguyễn Hoàng Vũ"], checkinWeeks: 2, dueWeeks: [1, 2, 3], missingWeeks: [3], rate: 67 },
      { id: "G02", name: "Tâm Sáng", members: ["Trần Thị Ngọc Thảo", "Đào Thị Hà Trang"], checkinWeeks: 1, dueWeeks: [1, 2, 3], missingWeeks: [2, 3], rate: 33 },
    ],
    practiceRetentionRate: 60,
    practiceOver80Rate: 42,
    practiceUnder80Rate: 58,
    dropoutRate: 25,
    challengeComparisons,
    challengeDailyStats,
    challengeFunnel,
    todayCheckins: 2,
    averageProgress: 38,
    evaluationCompletionRate: 54,
    trends: { engagement: 4, practiceRetention: 3, assessment: 2, miniOver80: 2, miniUnder80: -2, miniDropout: 0 },
    activeMetrics: { engagement: true, progress: true, practice: true, assessment: true, peerGroup: true },
    peerGroupOpen: true,
    activeAssessments: { self: true, peer: true },
    activeProgressLabels: ["Workshop", "Mini challenge", "Tự đánh giá", "Mời đánh giá"],
    healthHistory: Array.from({ length: 30 }, (_, index) => ({
      date: `${String(index + 1).padStart(2, "0")}/07`,
      engagement: 44 + index * 2,
      progress: 24 + index,
      practice: 38 + index * 2,
      assessment: 30 + index,
      peerGroup: 20 + index * 3,
      health: 31 + index * 2,
    })),
    recentActivity: ["Trần Phú Gia đã check-in MC2-D4", "Nguyễn Hoàng Vũ đã gửi đánh giá WS1-MAIN", "Nhóm Sen Bền Bỉ đã check-in tuần 2"],
    coachingRequests: [],
    coachingSlots: [],
    finalQuizSubmissions: [],
    finalSurveySubmissions: [],
  };
}

function arrayFrom(value: unknown): RawRow[] {
  return Array.isArray(value) ? (value as RawRow[]) : [];
}

function valueBy(row: RawRow, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value);
  }
  return "";
}

function stringFrom(value: unknown, fallback = "") {
  return value === undefined || value === null || String(value).trim() === "" ? fallback : String(value);
}

function numberFrom(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(value: unknown) {
  return stringFrom(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
}

function canonicalQuizAnswerForInstructor(value: unknown) {
  const raw = stringFrom(value).trim();
  if (!raw) return "";
  const parts = raw.includes("|")
    ? raw.split("|")
    : /^(?:[A-D]\s*,\s*)+[A-D]$/i.test(raw)
      ? raw.split(",")
      : [raw];
  return parts
    .map((part) => part.trim().match(/^([A-D])(?:\s*:|$)/i)?.[1]?.toUpperCase() || part.trim().toUpperCase())
    .filter(Boolean)
    .sort()
    .join(",");
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function average(items: number[]) {
  return items.length ? items.reduce((total, item) => total + item, 0) / items.length : 0;
}

function roundAverage(values: number[]) {
  return values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatDate(value: string) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) : value;
}

function parseDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value);
  const vietnameseDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (vietnameseDate) return new Date(Number(vietnameseDate[3]), Number(vietnameseDate[2]) - 1, Number(vietnameseDate[1]));
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isToday(value: unknown) {
  const date = parseDate(value);
  if (!date) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function getLatestDate(rows: RawRow[]) {
  return rows
    .map((row) => parseDate(valueBy(row, ["UpdatedAt", "CreatedAt", "Date", "Timestamp"])))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0];
}

function daysBetween(from: Date, to: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / dayMs);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatRelativeDate(date: Date) {
  const days = daysBetween(date, new Date());
  if (days === 0) return `Hôm nay, ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  if (days === 1) return "Hôm qua";
  return `${days} ngày trước`;
}

function getLongestStreak(checkins: RawRow[]) {
  const days = unique(
    checkins
      .map((item) => parseDate(valueBy(item, ["UpdatedAt", "CreatedAt", "Date", "Timestamp"])))
      .filter((date): date is Date => Boolean(date))
      .map((date) => startOfDay(date).getTime()),
  ).sort((a, b) => a - b);
  let best = 0;
  let current = 0;
  let previous = 0;
  const dayMs = 24 * 60 * 60 * 1000;
  for (const day of days) {
    current = previous && day - previous === dayMs ? current + 1 : 1;
    best = Math.max(best, current);
    previous = day;
  }
  return best;
}
