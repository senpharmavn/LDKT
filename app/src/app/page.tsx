"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav, TopBar } from "@/components/ldkt-ui";
import {
  ChallengeScreen,
  CheckinScreen,
  ChallengeCompleteScreen,
  EvaluationFormScreen,
  EvaluateScreen,
  FlashcardScreen,
  HomeScreen,
  InsightJournalScreen,
  JourneyScreen,
  LeadershipReportScreen,
  LearningHubScreen,
  LoginScreen,
  NotificationsScreen,
  PeerGroupScreen,
  PracticeScreen,
  ProfileScreen,
  type NotificationTask,
  SyncSplashScreen,
  WorkshopScreen,
} from "@/components/ldkt-screens";
import {
  clearAuthToken,
  bookCoachingSlot,
  getCheckin,
  getCachedDashboardSnapshot,
  getDashboard,
  getInitialAuthToken,
  joinPeerGroup,
  registerCoaching,
  type DashboardScope,
  loadDashboardWithStatus,
  loginUser,
  renamePeerGroup,
  saveCheckin as persistCheckin,
  saveEvaluationResponse as persistEvaluationResponse,
  startFinalQuiz,
  submitFinalQuiz,
  saveGroupCheckin as persistGroupCheckin,
} from "@/lib/api";
import { getProgramProgressPercent } from "@/lib/progress";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushState,
  clearChallengeNotificationState,
  type PushState,
} from "@/lib/push-notifications";
import type {
  AssessmentSummaryRecord,
  Challenge,
  Checkin,
  CheckinRecord,
  DashboardData,
  EvaluationRecord,
  EvaluationTemplate,
  Screen,
  Workshop,
} from "@/types/ldkt";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [authToken, setAuthTokenState] = useState(() => getInitialAuthToken());
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginStudentCode, setLoginStudentCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData>(() => getDashboard());
  const [checkin, setCheckin] = useState<Checkin>(() => getCheckin());
  const [selectedEvaluationTemplateId, setSelectedEvaluationTemplateId] = useState("");
  const [selectedChallengeWorkshopId, setSelectedChallengeWorkshopId] = useState("");
  const [evaluationAnswers, setEvaluationAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<"checkin" | "evaluation" | "group" | "coaching" | null>(null);
  const [syncStatus, setSyncStatus] = useState<"loading" | "synced" | "error">("loading");
  const [initialDashboardLoaded, setInitialDashboardLoaded] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [pushState, setPushState] = useState<PushState>("checking");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  useEffect(() => {
    if (!authToken) return;

    let active = true;

    const cachedDashboard = getCachedDashboardSnapshot();
    if (cachedDashboard) {
      applyDashboard(cachedDashboard);
      setInitialDashboardLoaded(true);
      setSyncStatus("loading");
    }

    loadDashboard().then(() => undefined);
    const interval = window.setInterval(() => {
      loadDashboard().then(() => undefined);
    }, 60000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };

    async function loadDashboard() {
      const result = await loadDashboardWithStatus("home");
      if (!active) return;

      if (result.remoteLoaded) {
        applyDashboard(result.data);
        setSyncStatus("synced");
      } else if (result.fromCache) {
        applyDashboard(result.data);
        setSyncStatus("loading");
      } else {
        setSyncStatus("error");
      }
      setInitialDashboardLoaded(true);
    }
  }, [authToken]);

  useEffect(() => {
    if (!toast) return;
    if (toast === "Đang mở bài kiểm tra...") return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!authToken) return;
    if (!["evaluate", "evaluationForm", "learning", "practice", "peerGroup", "insights", "leadershipReport", "profile"].includes(screen)) return;
    ensureDashboardDetails().then(() => undefined);
  }, [authToken, screen]);

  useEffect(() => {
    if (!authToken || screen !== "profile") return;
    refreshDashboardInBackground().then(() => undefined);
  }, [authToken, screen]);

  useEffect(() => {
    if (!authToken || screen !== "notifications") return;
    getPushState().then(setPushState).catch(() => setPushState("unavailable"));
  }, [authToken, screen]);

  async function togglePushNotifications() {
    setPushBusy(true);
    setPushMessage("");
    try {
      const nextState = pushState === "on" ? await disablePushNotifications() : await enablePushNotifications();
      setPushState(nextState);
      if (nextState === "on") setPushMessage("Đã bật nhắc lịch trên thiết bị này.");
      if (nextState === "off") setPushMessage("Đã tắt thông báo trên thiết bị này.");
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : "Chưa thay đổi được cài đặt thông báo.");
    } finally {
      setPushBusy(false);
    }
  }

  const actualWorkshopIndex = dashboard.currentWorkshopIndex;
  const displayWorkshopIndex = getDisplayWorkshopIndex(actualWorkshopIndex);
  const progressPercent = getProgramProgressPercent(displayWorkshopIndex, 7);
  const currentWorkshop = getCurrentWorkshop(dashboard.workshops, actualWorkshopIndex, dashboard.challenges);
  const currentWorkshopOrder = currentWorkshop?.order ?? actualWorkshopIndex;
  const isExperienceWorkshop = currentWorkshopOrder <= 0;
  const currentWorkshopId = currentWorkshop?.id || `WS${Math.max(1, actualWorkshopIndex)}`;
  const currentChallenges = useMemo(
    () => (isExperienceWorkshop ? [] : getChallengesForWorkshop(dashboard.challenges, currentWorkshopId)),
    [dashboard.challenges, currentWorkshopId, isExperienceWorkshop],
  );
  const hasMiniChallengeData = currentChallenges.length > 0;
  const miniChallengeTotalDays = getMiniChallengeTotalDays(currentChallenges);
  const currentCheckins = useMemo(
    () => getCheckinsForWorkshop(dashboard.checkins, currentWorkshopId),
    [dashboard.checkins, currentWorkshopId],
  );
  const completedDays = useMemo(
    () => currentCheckins.filter((item) => item.completed).map((item) => item.day),
    [currentCheckins],
  );
  const currentStudentStats = useMemo(
    () => dashboard.leaderboardUsers.find((item) => item.id === dashboard.student.id),
    [dashboard.leaderboardUsers, dashboard.student.id],
  );
  const currentAssessmentSummary = useMemo(
    () => (dashboard.assessmentSummary || []).filter((item) => item.userId === dashboard.student.id),
    [dashboard.assessmentSummary, dashboard.student.id],
  );
  const leadershipReportReady = Boolean(dashboard.student.reportUrl) || isAssessmentReportReady(currentAssessmentSummary);
  const leaderAssessmentOpen = useMemo(
    () =>
      dashboard.evaluationTemplates.some(
        (template) => template.status !== "locked" && (template.type === "self_before" || isPeerLinkTemplate(template)),
      ),
    [dashboard.evaluationTemplates],
  );
  const reviewOnlyMode = !isActiveParticipation(dashboard.student.participationStatus);
  const longestStreak = useMemo(() => {
    if (typeof currentStudentStats?.longestStreak === "number") return currentStudentStats.longestStreak;
    return getLongestCompletedStreak(completedDays);
  }, [completedDays, currentStudentStats?.longestStreak]);
  const scheduleBasedChallengeDay = useMemo(
    () => getMiniChallengeDayForToday(currentChallenges, currentWorkshop?.scheduleDate, miniChallengeTotalDays),
    [currentChallenges, currentWorkshop?.scheduleDate, miniChallengeTotalDays],
  );
  const miniChallengeOpen = scheduleBasedChallengeDay > 0;
  const hasMiniChallenge = !reviewOnlyMode && hasMiniChallengeData && miniChallengeOpen;
  const completedChallengeCount = hasMiniChallenge
    ? scheduleBasedChallengeDay || getCurrentMiniChallengeDay(currentCheckins, miniChallengeTotalDays)
    : 0;
  const currentDayCheckin = useMemo(
    () => getCheckinForDay(currentCheckins, completedChallengeCount),
    [currentCheckins, completedChallengeCount],
  );
  const currentDayCompleted = hasMiniChallenge && Boolean(currentDayCheckin);

  useEffect(() => {
    if (!initialDashboardLoaded || (hasMiniChallenge && !currentDayCompleted)) return;
    clearChallengeNotificationState().catch(() => undefined);
  }, [currentDayCompleted, hasMiniChallenge, initialDashboardLoaded]);
  const currentChallenge = hasMiniChallenge
    ? getChallengeForDay(currentChallenges, completedChallengeCount) ||
      createFallbackChallenge(currentWorkshopId, completedChallengeCount)
    : undefined;
  const miniChallengeCompleted = completedDays.includes(miniChallengeTotalDays);
  const selectedChallengeWorkshop = selectedChallengeWorkshopId
    ? dashboard.workshops.find((workshop) => workshop.id === selectedChallengeWorkshopId)
    : undefined;
  const selectedChallenges = selectedChallengeWorkshop
    ? getChallengesForWorkshop(dashboard.challenges, selectedChallengeWorkshopId)
    : currentChallenges;
  const selectedChallengeTotalDays = getMiniChallengeTotalDays(selectedChallenges);
  const selectedChallengeCheckins = selectedChallengeWorkshop
    ? getCheckinsForWorkshop(dashboard.checkins, selectedChallengeWorkshopId)
    : currentCheckins;
  const selectedCompletedDays = selectedChallengeCheckins
    .filter((item) => item.completed)
    .map((item) => item.day);
  const selectedChallengeDay = selectedChallengeWorkshop
    ? getMiniChallengeDayForToday(selectedChallenges, selectedChallengeWorkshop.scheduleDate, selectedChallengeTotalDays)
    : completedChallengeCount;
  const selectedDayCheckin = getCheckinForDay(selectedChallengeCheckins, selectedChallengeDay);
  const selectedDayCompleted = Boolean(selectedDayCheckin);
  const selectedChallenge =
    getChallengeForDay(selectedChallenges, selectedChallengeDay) ||
    createFallbackChallenge(selectedChallengeWorkshopId || currentWorkshopId, selectedChallengeDay);
  const selectedMiniChallengeCompleted = selectedCompletedDays.includes(selectedChallengeTotalDays);
  const hasActiveWorkshopEvaluationTemplate = dashboard.evaluationTemplates.some(
    (template) => template.type === "workshop" && template.status !== "locked",
  );
  const pendingEvaluationTemplates = useMemo(
    () =>
      reviewOnlyMode
        ? []
        : dashboard.evaluationTemplates.filter((template) => {
        if (isPeerLinkTemplate(template)) return false;
        if (template.status === "locked") return false;
        if (
          !hasActiveWorkshopEvaluationTemplate &&
          template.type === "workshop" &&
          template.workshopId &&
          template.workshopId !== currentWorkshopId
        ) {
          return false;
        }
        return !isEvaluationTemplateCompleted(template, dashboard.evaluations);
      }),
    [currentWorkshopId, dashboard.evaluationTemplates, dashboard.evaluations, hasActiveWorkshopEvaluationTemplate, reviewOnlyMode],
  );
  const evaluationSubmitted = pendingEvaluationTemplates.length === 0;
  const activePeerFeedbackTemplate = reviewOnlyMode
    ? undefined
    : dashboard.evaluationTemplates.find((template) => isPeerLinkTemplate(template) && template.status !== "locked");
  const activePeerFeedbackCount = activePeerFeedbackTemplate
    ? countPeerFeedbackForTemplate(dashboard.evaluations, activePeerFeedbackTemplate)
    : 0;
  const peerFeedbackCount = Math.max(
    activePeerFeedbackCount,
    dashboard.peerFeedbackCount ?? 0,
    countAllPeerFeedback(dashboard.evaluations),
    currentStudentStats?.peerFeedbackCount || 0,
  );
  const selectedEvaluationTemplate = dashboard.evaluationTemplates.find((item) => item.id === selectedEvaluationTemplateId);
  const selectedEvaluationQuestions = useMemo(
    () =>
      dashboard.evaluationQuestions
        .filter((question) => isQuestionForTemplate(question, selectedEvaluationTemplate))
        .sort((a, b) => a.order - b.order),
    [dashboard.evaluationQuestions, selectedEvaluationTemplate],
  );
  const notificationTasks = getNotificationTasks({
    hasMiniChallenge,
    currentDayCompleted,
    evaluationTemplates: pendingEvaluationTemplates,
    evaluations: dashboard.evaluations,
    peerFeedbackCount,
    peerFeedbackEnabled: Boolean(activePeerFeedbackTemplate) && peerFeedbackCount < 3,
    onCheckin: () => go("checkin"),
    onEvaluation: openEvaluationForm,
    onPeerEvaluation: () => go("evaluate"),
  });
  const notificationCount = notificationTasks.filter((task) => !task.done).length;

  function go(next: Screen) {
    if (reviewOnlyMode && ["checkin", "evaluationForm", "peerGroup", "challenge", "challengeComplete"].includes(next)) {
      setToast("Khóa học đã kết thúc. Bạn vẫn có thể xem lại bài học và insight cá nhân.");
      next = "learning";
    }

    if (next === "home") {
      setSelectedChallengeWorkshopId("");
    }

    if (next === "checkin") {
      const checkinRecord = screen === "challenge" && selectedChallengeWorkshopId
        ? selectedDayCheckin
        : currentDayCheckin;
      setCheckin(
        checkinRecord
          ? {
              status: checkinRecord.completed ? "done" : "not_done",
              mood: checkinRecord.mood || "Tĩnh",
              insight: checkinRecord.insight || "",
              nextAction: checkinRecord.nextAction || "",
            }
          : {
              status: "done",
              mood: "Tĩnh",
              insight: "",
              nextAction: "",
            },
      );
    }

    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector(".app-main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openJourneyChallenge(workshopId: string) {
    if (reviewOnlyMode) {
      setToast("Khóa học đã kết thúc. Mini challenge chỉ còn ở chế độ xem lại.");
      return;
    }

    setSelectedChallengeWorkshopId(workshopId);
    setScreen("challenge");
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector(".app-main")?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openPracticeChallenge(linkedChallengeId?: string) {
    const target = getPracticeChallengeTarget(linkedChallengeId);
    if (!target) {
      setToast("Hôm nay không có Mini Challenge cần check-in.");
      return;
    }

    openJourneyChallenge(target.workshopId);
  }

  function hasPracticeChallengeToday(linkedChallengeId?: string) {
    return Boolean(getPracticeChallengeTarget(linkedChallengeId));
  }

  function getPracticeChallengeTarget(linkedChallengeId?: string) {
    const linkedId = (linkedChallengeId || "").trim().toLowerCase();
    const linkedChallenges = linkedId
      ? dashboard.challenges.filter((challenge) => {
          const challengeId = challenge.id.trim().toLowerCase();
          return challengeId === linkedId || challengeId.startsWith(`${linkedId}-d`);
        })
      : [];

    if (linkedId && !linkedChallenges.length) return undefined;

    const workshopId = linkedChallenges[0]?.workshopId || currentWorkshopId;
    const workshop = dashboard.workshops.find((item) => item.id === workshopId);
    const workshopChallenges = getChallengesForWorkshop(dashboard.challenges, workshopId);
    const todayDay = getMiniChallengeDayForToday(
      workshopChallenges,
      workshop?.scheduleDate,
      getMiniChallengeTotalDays(workshopChallenges),
    );
    const todayChallenge = todayDay > 0 ? getChallengeForDay(workshopChallenges, todayDay) : undefined;

    return todayChallenge ? { workshopId, challenge: todayChallenge } : undefined;
  }

  async function submitLogin() {
    setLoginLoading(true);
    setLoginError("");

    try {
      const result = await loginUser(loginIdentifier, loginStudentCode);
      if (!result.ok || !result.token) {
        setLoginError(result.error || "Không tìm thấy học viên");
        return;
      }

      setAuthTokenState(result.token);
      setInitialDashboardLoaded(false);
      setScreen("home");
      await refreshDashboard("home");
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    clearAuthToken();
    setAuthTokenState("");
    setInitialDashboardLoaded(false);
    setLoginIdentifier("");
    setLoginStudentCode("");
    setLoginError("");
    setScreen("home");
  }

  async function openEvaluationForm(templateId: string) {
    if (reviewOnlyMode) {
      setToast("Khóa học đã kết thúc. Form hoạt động đã đóng.");
      return;
    }

    const template = dashboard.evaluationTemplates.find((item) => item.id === templateId);
    if (template && isPeerLinkTemplate(template)) {
      copyPeerEvaluationLink(template).then(() => undefined);
      return;
    }

    if (template?.type === "final_quiz") {
      setToast("Đang mở bài kiểm tra...");
      const existingResult = dashboard.finalQuizResults.find((item) => item.templateId === templateId);
      if (existingResult && existingResult.status !== "in_progress") {
        setSelectedEvaluationTemplateId(templateId);
        setEvaluationAnswers({});
        setDetailsLoaded(true);
        go("evaluationForm");
        setToast("");
        return;
      }

      const started = await startFinalQuiz(templateId);
      if (!started?.ok) {
        setToast(started?.error || "Chưa mở được bài kiểm tra cuối khóa.");
        return;
      }
      setDashboard((current) => ({
        ...current,
        evaluationQuestions: started.questions?.length
          ? [
              ...current.evaluationQuestions.filter((question) => question.templateId !== templateId),
              ...started.questions,
            ]
          : current.evaluationQuestions,
        finalQuizResults: started.attempt
          ? [
              ...current.finalQuizResults.filter((result) => result.templateId !== templateId),
              started.attempt,
            ]
          : current.finalQuizResults,
      }));
      setSelectedEvaluationTemplateId(templateId);
      setEvaluationAnswers({});
      setDetailsLoaded(true);
      go("evaluationForm");
      setToast("");
      return;
    }

    const loaded = await ensureDashboardDetails();
    if (!loaded) {
      setToast("Chưa mở được nội dung form, bạn thử lại sau nhé");
      return;
    }
    setSelectedEvaluationTemplateId(templateId);
    setEvaluationAnswers({});
    go("evaluationForm");
  }

  async function copyPeerEvaluationLink(template?: EvaluationTemplate) {
    if (reviewOnlyMode) {
      setToast("Khóa học đã kết thúc. Link mời đánh giá đã đóng.");
      return;
    }

    const peerLink = buildPeerAssessmentLink(dashboard, template);

    try {
      const copied = await copyTextToClipboard(peerLink);
      if (!copied) {
        window.prompt("Copy link mời đánh giá:", peerLink);
      }

      setToast("Đã copy link mời đánh giá");
    } catch {
      window.prompt("Copy link mời đánh giá:", peerLink);
      setToast("Link đã sẵn sàng để copy");
    }
  }

  async function saveCheckin() {
    if (reviewOnlyMode) {
      setToast("Khóa học đã kết thúc. Check-in đã đóng.");
      return;
    }

    const challengeDay = selectedChallengeWorkshopId ? selectedChallengeDay : completedChallengeCount;
    const challengeTotalDays = selectedChallengeWorkshopId ? selectedChallengeTotalDays : miniChallengeTotalDays;
    const challenge = selectedChallengeWorkshopId ? selectedChallenge : currentChallenge;
    const dayCompleted = selectedChallengeWorkshopId ? selectedDayCompleted : currentDayCompleted;

    if (dayCompleted) {
      setToast("Bạn đã check-in hôm nay rồi");
      go("home");
      return;
    }

    const checkinError = getCheckinValidationError(checkin);
    if (checkinError) {
      setToast(checkinError);
      return;
    }

    setSaving("checkin");
    try {
      const justCompletedMiniChallenge = challengeDay >= challengeTotalDays;
      const result = await persistCheckin(checkin, challengeDay, challenge);
      applyLocalCheckin(checkin, challengeDay, challenge);
      if (result.remoteSaved) await clearChallengeNotificationState().catch(() => undefined);
      setToast(getSaveToast(result.remoteSaved, result.remoteConfigured, "check-in"));
      go(justCompletedMiniChallenge ? "challengeComplete" : "home");
      refreshDashboardInBackground();
    } finally {
      setSaving(null);
    }
  }

  async function saveEvaluationForm() {
    if (reviewOnlyMode) {
      setToast("Khóa học đã kết thúc. Form hoạt động đã đóng.");
      go("evaluate");
      return;
    }

    if (!selectedEvaluationTemplate) {
      setToast("Chọn form đánh giá trước nhé");
      go("evaluate");
      return;
    }

    const template = selectedEvaluationTemplate;
    const answers = evaluationAnswers;
    const requiredQuestions = dashboard.evaluationQuestions.filter(
      (question) => question.required && isQuestionForTemplate(question, template),
    );
    const missingRequiredCount = requiredQuestions.filter((question) => !answers[question.id]?.trim()).length;
    const templateQuestions = dashboard.evaluationQuestions.filter((question) => isQuestionForTemplate(question, template));
    const missingQuestionCount = templateQuestions.filter((question) => !answers[question.id]?.trim()).length;
    if (template.type === "final_quiz" && missingQuestionCount) {
      setToast(`Còn ${missingQuestionCount} câu chưa trả lời.`);
      return;
    }
    if (missingRequiredCount) {
      setToast(`Còn ${missingRequiredCount} câu bắt buộc chưa trả lời.`);
      return;
    }

    setSaving("evaluation");
    try {
      const result = template.type === "final_quiz"
        ? await submitFinalQuiz(template.id, answers)
        : await persistEvaluationResponse(template, answers);
      if (result.rejected) {
        setToast(result.error || "Vui lòng hoàn thành các câu hỏi bắt buộc.");
        return;
      }

      applyLocalEvaluation(template, answers);
      setEvaluationAnswers({});
      go("evaluate");
      setToast(getSaveToast(result.remoteSaved, result.remoteConfigured, "đánh giá"));
      refreshDashboardInBackground();
    } finally {
      setSaving(null);
    }
  }

  async function joinGroup(groupId: string) {
    if (reviewOnlyMode) {
      setToast("Khóa học đã kết thúc. Nhóm bạn đồng hành đã đóng.");
      return;
    }

    setSaving("group");
    try {
      const result = await joinPeerGroup(groupId);
      await refreshDashboard("full");
      setToast(getSaveToast(result.remoteSaved, result.remoteConfigured, "nhóm bạn đồng hành"));
    } finally {
      setSaving(null);
    }
  }

  async function registerForCoaching(explorationGoal: string) {
    const optimisticRequestId = `COACH-${dashboard.student.id}-PENDING`;
    const requestedAt = new Date().toISOString();
    setDashboard((current) => ({
      ...current,
      coachingRequests: [
        ...current.coachingRequests.filter((request) => request.userId !== current.student.id),
        {
          id: optimisticRequestId,
          userId: current.student.id,
          xp: current.leaderboardUsers.find((user) => user.id === current.student.id)?.xp || 0,
          requestedAt,
          status: "registered",
          assignedSlotId: "",
        },
      ],
    }));
    setSaving("coaching");
    try {
      const result = await registerCoaching(explorationGoal);
      if (result.remoteSaved) {
        setToast("Đã đăng ký Coaching 1:1 online");
        refreshDashboard("full").then(() => undefined);
      } else {
        setDashboard((current) => ({
          ...current,
          coachingRequests: current.coachingRequests.filter((request) => request.id !== optimisticRequestId),
        }));
        setToast(result.error || "Chưa đăng ký được coaching");
      }
    } finally {
      setSaving(null);
    }
  }

  async function chooseCoachingSlot(slotId: string) {
    setDashboard((current) => ({
      ...current,
      coachingRequests: current.coachingRequests.map((request) =>
        request.userId === current.student.id ? { ...request, status: "booked", assignedSlotId: slotId } : request,
      ),
      coachingSlots: current.coachingSlots.map((slot) =>
        slot.id === slotId ? { ...slot, status: "booked", bookedUserId: current.student.id } : slot,
      ),
    }));
    setSaving("coaching");
    try {
      const result = await bookCoachingSlot(slotId);
      if (result.remoteSaved) {
        setToast("Đã xác nhận lịch coaching");
        refreshDashboard("full").then(() => undefined);
      } else {
        setDashboard((current) => ({
          ...current,
          coachingRequests: current.coachingRequests.map((request) =>
            request.userId === current.student.id ? { ...request, status: "selected", assignedSlotId: "" } : request,
          ),
          coachingSlots: current.coachingSlots.map((slot) =>
            slot.id === slotId ? { ...slot, status: "open", bookedUserId: "" } : slot,
          ),
        }));
        setToast(result.error || "Chưa chọn được lịch coaching");
      }
    } finally {
      setSaving(null);
    }
  }

  async function renameGroup(groupId: string, groupName: string) {
    if (reviewOnlyMode) {
      setToast("Khóa học đã kết thúc. Nhóm bạn đồng hành đã đóng.");
      return;
    }

    setSaving("group");
    try {
      const result = await renamePeerGroup(groupId, groupName);
      await refreshDashboard("full");
      setToast(getSaveToast(result.remoteSaved, result.remoteConfigured, "tên nhóm"));
    } finally {
      setSaving(null);
    }
  }

  async function saveGroupCheckin(groupId: string, week: number, met: boolean, insight: string, nextAction: string) {
    if (reviewOnlyMode) {
      setToast("Khóa học đã kết thúc. Check-in nhóm đã đóng.");
      return;
    }

    setSaving("group");
    try {
      const result = await persistGroupCheckin(groupId, week, met, insight, nextAction);
      await refreshDashboard("full");
      setToast(getSaveToast(result.remoteSaved, result.remoteConfigured, "check-in nhóm"));
    } finally {
      setSaving(null);
    }
  }

  async function refreshDashboard(scope: DashboardScope = "home") {
    setSyncStatus("loading");
    const result = await loadDashboardWithStatus(scope);
    if (result.remoteLoaded) {
      applyDashboard(result.data, scope !== "full");
      if (scope === "full") setDetailsLoaded(true);
      setSyncStatus("synced");
    } else if (result.fromCache) {
      applyDashboard(result.data);
      setSyncStatus("loading");
    } else {
      setSyncStatus("error");
    }
    setInitialDashboardLoaded(true);
  }

  async function refreshDashboardInBackground() {
    const result = await loadDashboardWithStatus("home");
    if (result.remoteLoaded) {
      applyDashboard(result.data);
      setSyncStatus("synced");
    }
  }

  async function ensureDashboardDetails() {
    if (detailsLoaded) return true;

    setSyncStatus("loading");
    const result = await loadDashboardWithStatus("full");
    if (result.remoteLoaded || result.fromCache) {
      applyDashboard(result.data, !result.remoteLoaded);
      if (result.remoteLoaded || hasDashboardDetails(result.data)) {
        setDetailsLoaded(true);
        setSyncStatus(result.remoteLoaded ? "synced" : "loading");
      }
      return true;
    }

    setSyncStatus("error");
    return false;
  }

  function applyLocalCheckin(value: Checkin, day: number, challenge?: Challenge) {
    const now = new Date().toISOString();
    const record: CheckinRecord = {
      id: `LOCAL-${challenge?.id || currentWorkshopId}-${day}`,
      workshopId: challenge?.workshopId || currentWorkshopId,
      challengeId: challenge?.id || `MC${currentWorkshopOrder}-D${day}`,
      day,
      completed: value.status === "done",
      mood: value.mood,
      insight: value.insight,
      nextAction: value.nextAction,
      createdAt: now,
      updatedAt: now,
    };

    setDashboard((current) => ({
      ...current,
      checkins: [
        ...current.checkins.filter(
          (item) => (item.challengeId || `${item.workshopId}-${item.day}`) !== (record.challengeId || `${record.workshopId}-${record.day}`),
        ),
        record,
      ],
    }));
  }

  function applyLocalEvaluation(template: EvaluationTemplate, answers: Record<string, string>) {
    const now = new Date().toISOString();
    const values = Object.values(answers);
    const numericValues = values.map(Number).filter(Number.isFinite);
    const feedback = values.find((value) => value && Number.isNaN(Number(value))) || "";
    const rating = numericValues.length
      ? Math.round((numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length) * 10) / 10
      : 0;
    const record: EvaluationRecord = {
      id: `LOCAL-${template.id}`,
      workshopId: template.workshopId,
      templateId: template.id,
      sessionType: template.sessionType,
      respondentType: template.type === "peer" ? "peer" : "self",
      rating,
      feedback,
      updatedAt: now,
    };

    setDashboard((current) => ({
      ...current,
      evaluations: [
        ...current.evaluations.filter((item) => item.templateId !== template.id),
        record,
      ],
    }));
  }

  function applyDashboard(data: DashboardData, preserveCurrentDetails = true) {
    setDashboard((current) => {
      if (preserveCurrentDetails && !hasDashboardDetails(data) && hasDashboardDetails(current)) {
        return {
          ...data,
          evaluationQuestions: current.evaluationQuestions,
          evaluationAnswers: current.evaluationAnswers,
          peerGroupOptions: current.peerGroupOptions,
          peerGroupMembers: current.peerGroupMembers,
          groupCheckins: current.groupCheckins,
          assessmentSummary: data.assessmentSummary?.length ? data.assessmentSummary : current.assessmentSummary,
        };
      }

      return data;
    });
    if (hasDashboardDetails(data)) setDetailsLoaded(true);

  }

  if (!authToken) {
    return (
      <div className="ldkt-page">
        <div className="phone">
          <main className="app-main">
            <LoginScreen
              error={loginError}
              identifier={loginIdentifier}
              studentCode={loginStudentCode}
              loading={loginLoading}
              onChange={setLoginIdentifier}
              onStudentCodeChange={setLoginStudentCode}
              onSubmit={submitLogin}
            />
          </main>
        </div>
      </div>
    );
  }

  if ((!initialDashboardLoaded && syncStatus === "loading") || syncStatus === "error") {
    return (
      <div className="ldkt-page">
        <div className="phone">
          <SyncSplashScreen error={syncStatus === "error"} onRetry={refreshDashboard} />
        </div>
      </div>
    );
  }

  return (
    <div className="ldkt-page">
      <div className="phone">
        <main className="app-main">
          <TopBar
            notificationCount={notificationCount}
            onNotificationsClick={() => go("notifications")}
          />
          {screen === "home" && (
            <HomeScreen
              progressPercent={progressPercent}
              completedChallengeCount={completedChallengeCount}
              completedDays={completedDays}
              completedDaysCount={completedDays.length}
              longestStreak={longestStreak}
              student={dashboard.student}
              leaderboardUsers={dashboard.leaderboardUsers}
              challenges={currentChallenges}
              currentWorkshop={currentWorkshop}
              currentWorkshopIndex={currentWorkshopOrder}
              hasMiniChallenge={hasMiniChallenge}
              miniChallengeTotalDays={miniChallengeTotalDays}
              currentDayCompleted={currentDayCompleted}
              miniChallengeCompleted={miniChallengeCompleted}
              evaluationSubmitted={evaluationSubmitted}
              onGo={go}
            />
          )}
          {screen === "journey" && (
            <JourneyScreen
              workshops={dashboard.workshops}
              challenges={dashboard.challenges}
              activitiesLocked={reviewOnlyMode}
              onOpenChallenge={openJourneyChallenge}
              onGo={go}
            />
          )}
          {screen === "notifications" && (
            <NotificationsScreen
              tasks={notificationTasks}
              pushState={pushState}
              pushBusy={pushBusy}
              pushMessage={pushMessage}
              onTogglePush={togglePushNotifications}
              onGo={go}
            />
          )}
          {screen === "workshop" && <WorkshopScreen workshops={dashboard.workshops} onGo={go} />}
          {screen === "challenge" && (
            <ChallengeScreen
              completedChallengeCount={selectedChallengeDay}
              challenges={selectedChallenges}
              completedDays={selectedCompletedDays}
              miniChallengeTotalDays={selectedChallengeTotalDays}
              currentDayCompleted={selectedDayCompleted}
              miniChallengeCompleted={selectedMiniChallengeCompleted}
              onGo={go}
            />
          )}
          {screen === "checkin" && (
            <CheckinScreen
              checkin={checkin}
              currentDay={selectedChallengeWorkshopId ? selectedChallengeDay : completedChallengeCount}
              challenges={selectedChallengeWorkshopId ? selectedChallenges : currentChallenges}
              completedDays={selectedChallengeWorkshopId ? selectedCompletedDays : completedDays}
              miniChallengeTotalDays={selectedChallengeWorkshopId ? selectedChallengeTotalDays : miniChallengeTotalDays}
              currentDayCompleted={selectedChallengeWorkshopId ? selectedDayCompleted : currentDayCompleted}
              onChange={setCheckin}
              saving={saving === "checkin"}
              onSave={saveCheckin}
              onGo={go}
            />
          )}
          {screen === "challengeComplete" && (
            <ChallengeCompleteScreen
              totalDays={miniChallengeTotalDays}
              onGoHome={() => go("home")}
            />
          )}
          {screen === "evaluate" && !detailsLoaded && (
            <DetailLoadingCard title="Đang mở form đánh giá" note="Đang chuẩn bị nội dung mới nhất." />
          )}
          {screen === "evaluate" && detailsLoaded && (
            <EvaluateScreen
              currentWorkshop={currentWorkshop}
              currentWorkshopIndex={displayWorkshopIndex}
              evaluations={dashboard.evaluations}
              peerFeedbackCount={peerFeedbackCount}
              templates={dashboard.evaluationTemplates}
              finalQuizResults={dashboard.finalQuizResults}
              onCopyPeerLink={copyPeerEvaluationLink}
              onSelectTemplate={openEvaluationForm}
              onGo={go}
            />
          )}
          {screen === "evaluationForm" && !detailsLoaded && (
            <DetailLoadingCard title="Đang mở nội dung form" note="Đang chuẩn bị bộ câu hỏi mới nhất." />
          )}
          {screen === "evaluationForm" && detailsLoaded && (
            <EvaluationFormScreen
              answers={evaluationAnswers}
              key={selectedEvaluationTemplate?.id || "evaluation-form"}
              questions={selectedEvaluationQuestions}
              saving={saving === "evaluation"}
              template={selectedEvaluationTemplate}
              finalQuizResult={dashboard.finalQuizResults.find((item) => item.templateId === selectedEvaluationTemplate?.id)}
              onAnswerChange={(questionId, value) =>
                setEvaluationAnswers((current) => ({ ...current, [questionId]: value }))
              }
              onGo={go}
              onSave={saveEvaluationForm}
            />
          )}
          {screen === "learning" && !detailsLoaded && (
            <DetailLoadingCard title="Đang mở Learning" note="Đang chuẩn bị tài liệu mới nhất." />
          )}
          {screen === "learning" && detailsLoaded && (
            <LearningHubScreen
              coachingRequests={dashboard.coachingRequests}
              coachingSlots={dashboard.coachingSlots}
              currentMiniChallengeDay={completedChallengeCount}
              currentWorkshopIndex={displayWorkshopIndex}
              groupCheckins={dashboard.groupCheckins}
              groupMembers={dashboard.peerGroupMembers}
              groupOptions={dashboard.peerGroupOptions}
              practiceExercises={dashboard.practiceExercises || []}
              saving={saving === "group" || saving === "coaching"}
              studentId={dashboard.student.id}
              activitiesLocked={reviewOnlyMode}
              workshops={dashboard.workshops}
              onBookCoachingSlot={chooseCoachingSlot}
              onRegisterCoaching={registerForCoaching}
              onJoinGroup={joinGroup}
              onRenameGroup={renameGroup}
              onSaveGroupCheckin={saveGroupCheckin}
              onGo={go}
            />
          )}
          {screen === "practice" && !detailsLoaded && (
            <DetailLoadingCard title="Đang mở Thực hành" note="Đang chuẩn bị bài tập mới nhất." />
          )}
          {screen === "practice" && detailsLoaded && (
            <PracticeScreen
              exercises={dashboard.practiceExercises || []}
              hasChallengeToday={hasPracticeChallengeToday}
              onGo={go}
              onOpenChallenge={openPracticeChallenge}
            />
          )}
          {screen === "peerGroup" && !detailsLoaded && (
            <DetailLoadingCard title="Đang mở nhóm bạn đồng hành" note="Đang chuẩn bị dữ liệu nhóm mới nhất." />
          )}
          {screen === "peerGroup" && detailsLoaded && (
            <PeerGroupScreen
              currentMiniChallengeDay={completedChallengeCount}
              currentWorkshopIndex={displayWorkshopIndex}
              groupCheckins={dashboard.groupCheckins}
              groupMembers={dashboard.peerGroupMembers}
              groupOptions={dashboard.peerGroupOptions}
              saving={saving === "group"}
              studentId={dashboard.student.id}
              onJoinGroup={joinGroup}
              onRenameGroup={renameGroup}
              onSaveGroupCheckin={saveGroupCheckin}
              onGo={go}
            />
          )}
          {screen === "flashcards" && (
            <FlashcardScreen
              currentWorkshopIndex={dashboard.currentWorkshopIndex}
              workshops={dashboard.workshops}
              onGo={go}
            />
          )}
          {screen === "insights" && !detailsLoaded && (
            <DetailLoadingCard title="Đang mở nhật ký insight" note="Đang chuẩn bị dữ liệu mới nhất." />
          )}
          {screen === "insights" && detailsLoaded && (
            <InsightJournalScreen
              checkins={dashboard.checkins}
              groupCheckins={dashboard.groupCheckins}
              groupMembers={dashboard.peerGroupMembers}
              groupOptions={dashboard.peerGroupOptions}
              studentId={dashboard.student.id}
              workshops={dashboard.workshops}
              onGo={go}
            />
          )}
          {screen === "profile" && (
            <ProfileScreen
              student={dashboard.student}
              reportLoading={!detailsLoaded}
              reportReady={leadershipReportReady}
              showReportCard={leaderAssessmentOpen || leadershipReportReady}
              onLogout={logout}
              onGo={go}
            />
          )}
          {screen === "leadershipReport" && (
            <LeadershipReportScreen
              student={dashboard.student}
              questions={dashboard.evaluationQuestions}
              answers={dashboard.evaluationAnswers}
              evaluations={dashboard.evaluations}
              onGo={go}
            />
          )}
        </main>
        <BottomNav active={screen} onGo={go} />
        <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
      </div>
    </div>
  );
}

function getCurrentWorkshop(workshops: Workshop[], currentWorkshopIndex: number, challenges: Challenge[] = []) {
  const todayChallenge = challenges.find((challenge) => isSameLocalDate(parseWorkshopDate(challenge.date), new Date()));
  const scheduledWorkshop = todayChallenge
    ? workshops.find((workshop) => workshop.id === todayChallenge.workshopId)
    : undefined;
  return (
    scheduledWorkshop ||
    workshops.find((workshop) => workshop.status === "now" && (workshop.order ?? 0) >= 1) ||
    workshops.find((workshop) => workshop.order === currentWorkshopIndex) ||
    workshops.find((workshop) => workshop.status === "locked" && (workshop.order ?? 0) >= 1) ||
    workshops.find((workshop) => (workshop.order ?? 0) >= 1) ||
    workshops[0]
  );
}

function getMiniChallengeDayForToday(challenges: Challenge[], scheduleDate: string | undefined, totalDays: number) {
  const datedChallenges = challenges.filter((challenge) => parseWorkshopDate(challenge.date));
  if (datedChallenges.length) {
    return datedChallenges.find((challenge) => isSameLocalDate(parseWorkshopDate(challenge.date), new Date()))?.day || 0;
  }
  return getMiniChallengeDayFromWorkshopDate(scheduleDate, totalDays);
}

function isSameLocalDate(left: Date | null, right: Date) {
  return Boolean(
    left &&
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate(),
  );
}

function getDisplayWorkshopIndex(currentWorkshopIndex: number) {
  return Math.max(0, Math.min(currentWorkshopIndex || 0, 7));
}

function isActiveParticipation(value?: string) {
  const key = normalizeStatusKey(value || "Active");
  return !key || ["active", "danghoc", "dangthamgia", "inprogress", "learning"].includes(key);
}

function normalizeStatusKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getChallengeForDay(challenges: Challenge[], day: number) {
  return challenges.find((challenge) => challenge.day === day);
}

function createFallbackChallenge(workshopId: string, day: number): Challenge {
  const workshopNumber = workshopId.match(/\d+/)?.[0] || workshopId;

  return {
    id: `MC${workshopNumber}-D${day}`,
    workshopId,
    day,
    title: `Mini Challenge ${workshopNumber}-D${day}`,
    description: `Mini Challenge ${workshopNumber}-D${day}`,
    instruction: "",
    status: "active",
  };
}

function getChallengesForWorkshop(challenges: Challenge[], workshopId: string) {
  const matched = challenges.filter((challenge) => challenge.workshopId === workshopId);
  return matched;
}

function getMiniChallengeTotalDays(challenges: Challenge[]) {
  if (!challenges.length) return 1;
  return Math.max(...challenges.map((challenge) => challenge.day || 1));
}

function getCheckinsForWorkshop(checkins: CheckinRecord[], workshopId: string) {
  return checkins.filter((checkin) => checkin.workshopId === workshopId);
}

function hasDashboardDetails(data: DashboardData) {
  return Boolean(
    data.evaluationQuestions.length ||
      data.evaluationAnswers.length ||
      data.peerGroupOptions.length ||
      data.peerGroupMembers.length ||
      data.groupCheckins.length,
  );
}

function isAssessmentReportReady(summary: AssessmentSummaryRecord[]) {
  return summary.some((item) => {
    const status = normalizeStatusKey(item.reportStatus);
    return ["published", "open", "completed", "done"].includes(status);
  });
}

function getCurrentMiniChallengeDay(checkins: CheckinRecord[], totalDays: number) {
  const completedDays = checkins.filter((checkin) => checkin.completed).map((checkin) => checkin.day);
  if (!completedDays.length) return 1;
  return Math.min(Math.max(...completedDays) + 1, totalDays);
}

function getMiniChallengeDayFromWorkshopDate(scheduleDate: string | undefined, totalDays: number) {
  const workshopDate = parseWorkshopDate(scheduleDate);
  if (!workshopDate) return 0;

  const startDate = startOfLocalDay(workshopDate);

  const today = startOfLocalDay(new Date());
  const elapsedDays = Math.floor((today.getTime() - startDate.getTime()) / 86400000) + 1;

  if (elapsedDays < 1) return 0;
  return Math.min(elapsedDays, totalDays);
}

function parseWorkshopDate(value: string | undefined) {
  if (!value) return null;

  const normalized = value.trim();
  const vietnameseDate = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vietnameseDate) {
    const [, day, month, year] = vietnameseDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getCheckinForDay(checkins: CheckinRecord[], day: number) {
  return [...checkins]
    .filter((checkin) => checkin.day === day)
    .sort((a, b) => getTime(b.updatedAt || b.createdAt) - getTime(a.updatedAt || a.createdAt))[0];
}

function getLongestCompletedStreak(days: number[]) {
  const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);
  let longest = 0;
  let current = 0;
  let previous = 0;

  uniqueDays.forEach((day) => {
    current = day === previous + 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = day;
  });

  return longest;
}

function getTodayCheckin(checkins: CheckinRecord[]) {
  return [...checkins]
    .filter((checkin) => isToday(checkin.updatedAt || checkin.createdAt))
    .sort((a, b) => b.day - a.day || getTime(b.updatedAt || b.createdAt) - getTime(a.updatedAt || a.createdAt))[0];
}

function getTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function isToday(value: string) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getSaveToast(remoteSaved: boolean, remoteConfigured: boolean, label: string) {
  if (!remoteConfigured) return `Đã lưu ${label} trên máy`;
  if (remoteSaved) return `Đã lưu và đồng bộ ${label}`;
  return `Đã lưu tạm ${label}, chưa cập nhật lên hệ thống`;
}

function getCheckinValidationError(checkin: Checkin) {
  if (!checkin.insight.trim() && !checkin.nextAction.trim()) {
    return "Bạn viết thêm một điều nhận ra hoặc hành động nhỏ nhé";
  }

  return "";
}

function buildPeerAssessmentLink(dashboard: DashboardData, template?: EvaluationTemplate) {
  const origin = typeof window === "undefined" ? "https://lanhdaokhaitam.vercel.app" : window.location.origin;
  const url = new URL("/peer", origin);
  url.searchParams.set("target", dashboard.student.id);
  url.searchParams.set("name", dashboard.student.name);
  if (dashboard.student.email) url.searchParams.set("email", dashboard.student.email);
  if (template?.id) url.searchParams.set("template", template.id);
  return url.toString();
}

function buildPrefilledPeerLink(formUrl: string, dashboard: DashboardData) {
  const normalizedFormUrl = normalizeGoogleFormUrl(formUrl);
  const token =
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("token") ||
        window.localStorage.getItem("ldkt.auth.token") ||
        dashboard.student.id;
  const values: Record<string, string> = {
    UserID: dashboard.student.id,
    user_id: dashboard.student.id,
    userid: dashboard.student.id,
    StudentID: dashboard.student.id,
    student_id: dashboard.student.id,
    studentid: dashboard.student.id,
    MaHocVien: dashboard.student.id,
    Ma_hoc_vien: dashboard.student.id,
    FullName: dashboard.student.name,
    full_name: dashboard.student.name,
    fullname: dashboard.student.name,
    HoTen: dashboard.student.name,
    Ho_ten: dashboard.student.name,
    Name: dashboard.student.name,
    Email: dashboard.student.email || "",
    email: dashboard.student.email || "",
    Gmail: dashboard.student.email || "",
    gmail: dashboard.student.email || "",
    Token: token,
    token,
    Batch: dashboard.student.batch,
    batch: dashboard.student.batch,
    Department: dashboard.student.team,
    department: dashboard.student.team,
    Team: dashboard.student.team,
    team: dashboard.student.team,
  };

  return normalizedFormUrl
    .replace(/%7B([^%]+)%7D/gi, function (_match, key: string) {
      return replacePrefillValue(key, values);
    })
    .replace(/\{([^}]+)\}/g, function (_match, key: string) {
      return replacePrefillValue(key, values);
    });
}

function replacePrefillValue(key: string, values: Record<string, string>) {
  try {
    key = decodeURIComponent(key);
  } catch {
    // Keep the original key when it is not URL-encoded.
  }

    const normalizedKey = key.trim();
    return encodeURIComponent(values[normalizedKey] || values[normalizePrefillKey(normalizedKey)] || "");
}

function normalizeGoogleFormUrl(formUrl: string) {
  const trimmed = formUrl.trim();
  if (!trimmed) return trimmed;

  return trimmed
    .replace("/edit?", "/viewform?")
    .replace(/\/edit$/, "/viewform")
    .replace("/formResponse?", "/viewform?");
}

function normalizePrefillKey(value: string) {
  return value.replace(/[\s-]+/g, "_");
}

async function copyTextToClipboard(text: string) {
  if (window.navigator.clipboard?.writeText) {
    try {
      await window.navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea fallback for browsers that block Clipboard API.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.left = "-9999px";
  textarea.style.position = "fixed";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function isPeerLinkTemplate(template: EvaluationTemplate) {
  if (template.status === "locked") return false;
  const text = `${template.id} ${template.title} ${template.sessionType} ${template.type}`.toLowerCase();
  return Boolean(template.formUrl) || template.type === "peer" || text.includes("peer") || text.includes("360") || text.includes("other");
}

function countAllPeerFeedback(evaluations: DashboardData["evaluations"]) {
  return evaluations.filter((item) => isPeerFeedbackEvaluation(item)).length;
}

function countPeerFeedbackForTemplate(evaluations: DashboardData["evaluations"], template: EvaluationTemplate) {
  const templateKey = normalizeCompletionKey(template.id);
  const isAfterTemplate = templateKey.includes("after") || normalizeCompletionKey(template.title).includes("sauchuongtrinh");
  const isBeforeTemplate = !isAfterTemplate;

  return evaluations.filter((item) => {
    if (!isPeerFeedbackEvaluation(item)) return false;

    const responseTemplateKey = normalizeCompletionKey(item.templateId || "");
    if (responseTemplateKey && responseTemplateKey === templateKey) return true;
    if (responseTemplateKey.includes("after")) return isAfterTemplate;
    if (responseTemplateKey.includes("before") || responseTemplateKey.includes("360") || responseTemplateKey.includes("app") || responseTemplateKey.includes("other")) {
      return isBeforeTemplate;
    }

    return isBeforeTemplate && !responseTemplateKey;
  }).length;
}

function isPeerFeedbackEvaluation(item: DashboardData["evaluations"][number]) {
  const respondentType = item.respondentType?.toLowerCase() || "";
  const templateId = item.templateId?.toLowerCase() || "";
  return respondentType === "peer" || respondentType.includes("other") || templateId.includes("peer") || templateId.includes("other") || templateId.includes("360");
}

function isEvaluationTemplateCompleted(template: EvaluationTemplate, evaluations: DashboardData["evaluations"]) {
  const templateKey = normalizeCompletionKey(template.id);
  const workshopSessionKey = normalizeCompletionKey(`${template.workshopId}|${template.sessionType}`);

  return evaluations.some((evaluation) => {
    const evaluationTemplateKey = normalizeCompletionKey(evaluation.templateId || "");
    const evaluationWorkshopSessionKey = normalizeCompletionKey(`${evaluation.workshopId}|${evaluation.sessionType || ""}`);

    return (
      Boolean(templateKey && evaluationTemplateKey && templateKey === evaluationTemplateKey) ||
      Boolean(template.type === "workshop" && workshopSessionKey && evaluationWorkshopSessionKey === workshopSessionKey)
    );
  });
}

function isQuestionForTemplate(question: { id: string; templateId: string }, selectedTemplate?: EvaluationTemplate) {
  if (!selectedTemplate) return false;

  const questionKey = normalizeCompletionKey(question.templateId);
  const questionIdKey = normalizeCompletionKey(question.id);
  const templateKey = normalizeCompletionKey(selectedTemplate.id);
  const sessionKey = normalizeCompletionKey(selectedTemplate.sessionType);
  const typeKey = normalizeCompletionKey(selectedTemplate.type);
  const workshopKey = normalizeCompletionKey(selectedTemplate.workshopId || "");
  const workshopSessionKey = normalizeCompletionKey(`${selectedTemplate.workshopId}-${selectedTemplate.sessionType}`);
  const commonKeys = new Set([
    "workshop-common",
    `${typeKey}-common`,
    `${sessionKey}-common`,
  ]);
  if (selectedTemplate.type === "workshop") {
    commonKeys.add("common");
    commonKeys.add("common-workshop");
    commonKeys.add("all1");
    commonKeys.add("all2");
    commonKeys.add("all3");
    commonKeys.add("all4");
    commonKeys.add("all");
    commonKeys.add("all-workshops");
  }
  if (selectedTemplate.type === "self_before") {
    commonKeys.add("self-common");
    commonKeys.add("self-assessment-common");
    commonKeys.add("assessment-common");
    commonKeys.add("all-self");
  }

  return (
    questionKey === templateKey ||
    questionIdKey === templateKey ||
    (workshopKey && questionKey === workshopKey) ||
    (workshopSessionKey && (questionKey === workshopSessionKey || questionIdKey.startsWith(workshopSessionKey))) ||
    commonKeys.has(questionKey) ||
    commonKeys.has(questionIdKey)
  );
}

function normalizeCompletionKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
}

function getNotificationTasks({
  hasMiniChallenge,
  currentDayCompleted,
  evaluationTemplates,
  evaluations,
  peerFeedbackCount,
  peerFeedbackEnabled,
  onCheckin,
  onEvaluation,
  onPeerEvaluation,
}: {
  hasMiniChallenge: boolean;
  currentDayCompleted: boolean;
  evaluationTemplates: EvaluationTemplate[];
  evaluations: EvaluationRecord[];
  peerFeedbackCount: number;
  peerFeedbackEnabled: boolean;
  onCheckin: () => void;
  onEvaluation: (templateId: string) => void;
  onPeerEvaluation: () => void;
}): NotificationTask[] {
  const tasks: NotificationTask[] = [];

  if (hasMiniChallenge && !currentDayCompleted) {
    tasks.push({
      id: "checkin",
      title: "Check-in Mini Challenge",
      note: "Ghi nhận thực hành hôm nay",
      done: false,
      onClick: onCheckin,
    });
  }

  evaluationTemplates.filter((template) => template.type !== "workshop").forEach((template) => {
    tasks.push({
      id: `evaluation-${template.id}`,
      title: template.title || "Đánh giá",
      note: template.description || "Hoàn thành form đánh giá đang mở",
      done: false,
      waiting: true,
      onClick: () => onEvaluation(template.id),
    });
  });

  if (peerFeedbackEnabled) {
    tasks.push({
      id: "peer-feedback-link",
      title: "Mời người khác đánh giá",
      note: peerFeedbackCount > 0 ? `Đã nhận ${peerFeedbackCount} lượt đánh giá` : "Chưa nhận lượt đánh giá nào",
      done: false,
      waiting: true,
      onClick: onPeerEvaluation,
    });
  }

  return tasks;
}

function DetailLoadingCard({ title, note }: { title: string; note: string }) {
  return (
    <section>
      <div className="card detail-loading-card">
        <div className="sync-spinner" aria-hidden="true" />
        <h2>{title.replace("Đang mở ", "Mở ")}</h2>
      </div>
    </section>
  );
}

