"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  ClipboardCheck,
  ChevronRight,
  Check,
  Copy,
  Download,
  FileText,
  Gauge,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  Sparkles,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRoundSearch,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  buildMockInstructorDashboard,
  loadInstructorDashboard,
  publishAssessmentReport,
  selectCoachingCandidates,
  refreshInstructorSummaries,
  gradeFinalQuiz,
  type ChallengeComparison,
  type CohortHealthHistoryPoint,
  type InstructorDashboardData,
  type InstructorStudent,
  type InstructorWorkshop,
  type FinalQuizSubmission,
  type FinalSurveySubmission,
  type LeadershipReport,
} from "@/lib/instructor-api";

type View = "overview" | "students" | "student" | "workshops" | "mini" | "finalQuiz" | "finalSurvey" | "reports" | "metrics";

const nav = [
  { id: "overview" as View, label: "Tổng quan", icon: LayoutDashboard },
  { id: "students" as View, label: "Học viên", icon: UsersRound },
  { id: "mini" as View, label: "Mini Challenge", icon: TrendingUp },
  { id: "workshops" as View, label: "Workshop Quality", icon: BookOpenCheck },
  { id: "finalQuiz" as View, label: "Kiểm tra cuối khóa", icon: GraduationCap },
  { id: "finalSurvey" as View, label: "Final Survey", icon: MessageSquareText },
  { id: "reports" as View, label: "Báo cáo lãnh đạo", icon: FileText },
  { id: "metrics" as View, label: "Cách tính chỉ số", icon: BarChart3 },
];

export function InstructorDashboard({ initialReportId = "" }: { initialReportId?: string }) {
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<InstructorDashboardData>(buildMockInstructorDashboard());
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tất cả");
  const [activityFilter, setActivityFilter] = useState("Tất cả hoạt động");
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(false);
  const [reportOnly, setReportOnly] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState("");

  async function loadDashboard(cohortId = "", reportUserId = "") {
    setLoading(true);
    const result = await loadInstructorDashboard(cohortId, reportUserId);
    setData(result.data);
    setSelectedCohortId(result.data.cohortId);
    setRemoteLoaded(result.remoteLoaded);
    setSyncError(!result.remoteLoaded);
    setSelectedWorkshopId((current) => current || getCurrentWorkshop(result.data)?.id || "WSTOTAL");
    setLoading(false);
  }

  async function refresh() {
    setLoading(true);
    await refreshInstructorSummaries(selectedCohortId);
    await loadDashboard(selectedCohortId);
  }

  async function changeCohort(cohortId: string) {
    if (!cohortId || cohortId === selectedCohortId) return;
    setSelectedStudentId("");
    setSelectedWorkshopId("");
    await loadDashboard(cohortId);
  }

  async function publishReportForStudent(studentId: string) {
    setLoading(true);
    const result = await publishAssessmentReport(studentId);
    if (!result.ok) {
      console.warn(result.error);
    }
    const refreshed = await loadInstructorDashboard(selectedCohortId);
    setData(refreshed.data);
    setRemoteLoaded(refreshed.remoteLoaded);
    setSyncError(!refreshed.remoteLoaded);
    setSelectedStudentId(studentId);
    setView("student");
    setLoading(false);
  }

  async function publishReadyReports() {
    const readyStudents = data.students.filter((student) => student.assessmentReportDataReady && !student.assessmentReportPublished);
    if (!readyStudents.length) return;

    setLoading(true);
    await Promise.all(
      readyStudents.map(async (student) => {
        const result = await publishAssessmentReport(student.id);
        if (!result.ok) {
          console.warn(result.error);
        }
      }),
    );
    const refreshed = await loadInstructorDashboard(selectedCohortId);
    setData(refreshed.data);
    setRemoteLoaded(refreshed.remoteLoaded);
    setSyncError(!refreshed.remoteLoaded);
    setLoading(false);
  }

  async function saveCoachingSelection(userIds: string[]) {
    setLoading(true);
    const result = await selectCoachingCandidates(selectedCohortId || data.cohortId, userIds);
    if (!result.ok) console.warn(result.error);
    await loadDashboard(selectedCohortId || data.cohortId);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportId = initialReportId || params.get("report");
    if (reportId) {
      setSelectedStudentId(reportId);
      setView("reports");
      setReportOnly(true);
    }
    loadDashboard("", reportId || "");
  }, [initialReportId]);

  const selectedStudent =
    data.students.find((student) => student.id === selectedStudentId) ||
    (reportOnly ? undefined : data.students[0]);
  const selectedWorkshop = data.workshops.find((workshop) => workshop.id === selectedWorkshopId) || data.workshops[0];
  const selectedReport =
    data.leadershipReports.find((report) => report.userId === selectedStudentId) ||
    (reportOnly ? undefined : data.leadershipReports[0]);

  function openStudent(student: InstructorStudent) {
    setSelectedStudentId(student.id);
    setView("student");
  }

  return (
    <div className={`dashboard-shell ${reportOnly ? "report-only" : ""}`}>
      {!reportOnly && (
      <aside className="sidebar">
        <div className="brand">
          <img src="/sen-pharma-logo.svg" alt="SEN Pharma" />
          <div>
            <strong>Lãnh Đạo Khai Tâm</strong>
            <span>Giảng viên Dashboard</span>
          </div>
        </div>
        <nav>
          {nav.map((item) => (
            <button
              className={view === item.id || (view === "student" && item.id === "students") ? "active" : ""}
              key={item.id}
              onClick={() => setView(item.id)}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles />
          <b>Cohort {data.cohortId || "đang cập nhật"}</b>
          <span>{data.students.length} học viên đang hoạt động</span>
        </div>
      </aside>
      )}

      <main>
        {!reportOnly && (
        <header className="topbar">
          <div className="top-filter">
            <span>Cohort</span>
            <select
              aria-label="Chọn cohort"
              disabled={loading}
              value={selectedCohortId || data.cohortId}
              onChange={(event) => changeCohort(event.target.value)}
            >
              {(data.cohorts.length ? data.cohorts : [data.cohortId]).filter(Boolean).map((cohortId) => (
                <option key={cohortId} value={cohortId}>{cohortId}</option>
              ))}
            </select>
          </div>
          <div className="top-filter">
            <span>Dữ liệu</span>
            <button>{remoteLoaded ? "Đã cập nhật" : "Chưa kết nối"}</button>
          </div>
          <div className="topbar-actions">
            <button className="primary-action" onClick={refresh} disabled={loading}>
              <RefreshCw /> {loading ? "Đang tải" : "Làm mới"}
            </button>
          </div>
        </header>
        )}
        {loading ? (
          <div className="dashboard-refresh-overlay">
            <div>
              <img src="/sen-pharma-logo.svg" alt="SEN Pharma" />
              <b>Đang làm mới dữ liệu</b>
              <span>Dashboard đang cập nhật số liệu mới nhất.</span>
            </div>
          </div>
        ) : null}

        <div className="content">
          {syncError && !loading ? (
            <ConnectionErrorPanel onRetry={refresh} />
          ) : (
          <>
          {view === "overview" && (
            <Overview
              data={data}
              onOpenStudentFilter={(nextStatus, nextActivityFilter) => {
                setStatus(nextStatus);
                setActivityFilter(nextActivityFilter);
                setQuery("");
                setView("students");
              }}
              onOpenGroupRisk={() => {
                setStatus("Tất cả");
                setActivityFilter("Thuộc nhóm chưa check-in");
                setQuery("");
                setView("students");
              }}
            />
          )}
          {view === "students" && (
            <StudentsView
              data={data}
              query={query}
              status={status}
              activityFilter={activityFilter}
              onOpenStudent={openStudent}
              onQuery={setQuery}
              onStatus={setStatus}
              onActivityFilter={setActivityFilter}
              onSaveCoachingSelection={saveCoachingSelection}
            />
          )}
          {view === "student" && selectedStudent && (
            <StudentDetail
              student={selectedStudent}
              onBack={() => setView("students")}
              onOpenReport={() => {
                setSelectedStudentId(selectedStudent.id);
                setView("reports");
              }}
              onPublishReport={() => publishReportForStudent(selectedStudent.id)}
            />
          )}
          {view === "workshops" && selectedWorkshop && (
            <WorkshopAnalytics
              selected={selectedWorkshop}
              selectedId={selectedWorkshopId || "WSTOTAL"}
              workshops={data.workshops}
              cohortId={selectedCohortId || data.cohortId}
              onSelect={(workshopId) => setSelectedWorkshopId(workshopId)}
            />
          )}
          {view === "finalQuiz" && (
            <FinalQuizGrading
              submissions={data.finalQuizSubmissions}
              onGrade={async (attemptId, essayScore, feedback, publish) => {
                setLoading(true);
                const result = await gradeFinalQuiz(attemptId, essayScore, feedback, publish);
                if (!result.ok) console.warn(result.error);
                await loadDashboard(selectedCohortId);
              }}
            />
          )}
          {view === "finalSurvey" && <FinalSurveyResponses submissions={data.finalSurveySubmissions} />}
          {view === "mini" && <MiniChallengeView data={data} />}
          {view === "reports" && selectedReport && (
            <LeadershipReportsView
              reports={data.leadershipReports}
              selected={selectedReport}
              students={data.students}
              onSelect={(studentId) => setSelectedStudentId(studentId)}
              onPublishReadyReports={publishReadyReports}
              reportOnly={reportOnly}
            />
          )}
          {view === "metrics" && <MetricGuide />}
          </>
          )}
        </div>
      </main>
    </div>
  );
}

function Overview({
  data,
  onOpenStudentFilter,
  onOpenGroupRisk,
}: {
  data: InstructorDashboardData;
  onOpenStudentFilter: (status: string, activityFilter: string) => void;
  onOpenGroupRisk: () => void;
}) {
  const attention = data.students.filter((student) => student.status === "Cần chú ý");
  const silent = data.students.filter((student) => !isRecentlyActive(student));
  const missingSelfAssessment = data.activeAssessments.self
    ? data.students.filter((student) => !student.selfAssessmentCompleted)
    : [];
  const missingPeerAssessment = data.activeAssessments.peer
    ? data.students.filter((student) => !student.peerAssessmentCompleted)
    : [];
  const missingGroupCheckins = data.activeMetrics.peerGroup
    ? data.groups.filter((group) => group.missingWeeks.length > 0)
    : [];
  const healthScore = getCohortHealthScore(data);
  const engagementRate = getEngagementRate(data.students);
  const currentWorkshop = getCurrentWorkshop(data);
  const peerActivity = roundAverage(data.groups.map((group) => group.rate));
  const healthTrend = Math.round(
    (data.trends.engagement + data.trends.practiceRetention + data.trends.assessment) / 3,
  );
  const groupDueWeeks = uniqueNumbers(data.groups.flatMap((group) => group.dueWeeks));
  const peerGroupDetail = !data.peerGroupOpen
    ? "Chưa mở sau WS7"
    : data.activeMetrics.peerGroup
      ? `Đã đến hạn tuần ${groupDueWeeks.join(", ") || "—"}`
      : "Đã mở · Chưa đến hạn check-in tuần 1";
  const statusCounts = {
    good: data.students.filter((student) => student.status === "Tốt").length,
    attention: data.students.filter((student) => student.status === "Cần chú ý").length,
    notStarted: data.students.filter((student) => student.status === "Chưa bắt đầu").length,
  };
  return (
    <>
      <PageHeading
        eyebrow={`COHORT ${data.cohortId || "ALL"}`}
        title="Tổng quan chương trình"
        copy={`${currentWorkshop?.title || "Workshop"} · Bức tranh nhanh về sức khỏe cohort, tiến độ học viên và các tín hiệu cần theo dõi.`}
      />
      <section className="overview-section">
        <div className="section-heading"><b>1. Sức khỏe cohort</b><span>Các chỉ số đang được dùng để tính Cohort Health</span></div>
        <div className="kpi-grid overview-kpi-grid">
        <div className="featured-health-kpi"><Kpi title="Cohort Health" value={`${healthScore}/100`} detail={healthScore >= 75 ? "Healthy" : healthScore >= 55 ? "Warning" : "At risk"} tone={healthScore >= 75 ? "green" : "gold"} icon={Gauge} trend={healthTrend} /></div>
        <Kpi title="Engagement" value={`${engagementRate}%`} detail={`${data.students.filter(isRecentlyActive).length}/${data.students.length || 0} học viên còn hoạt động`} tone="green" icon={UsersRound} trend={data.trends.engagement} />
        <Kpi title="Progress" value={`${data.averageProgress}/100`} detail="Tiến độ hoàn thành trung bình" tone="green" icon={TrendingUp} />
        <Kpi title="Practice" value={`${data.practiceRetentionRate}/100`} detail="Ngày thực hành / tổng ngày thử thách" tone="blue" icon={BookOpenCheck} trend={data.trends.practiceRetention} />
        <Kpi
          title="Assessment"
          value={data.activeMetrics.assessment ? `${data.evaluationCompletionRate}/100` : "—"}
          detail={data.activeMetrics.assessment ? "Tự đánh giá và nhận đánh giá từ người khác" : "Chưa mở form tự đánh giá hoặc mời đánh giá"}
          tone="gold"
          icon={ClipboardCheck}
          trend={data.trends.assessment}
        />
        <Kpi
          title="Peer Group"
          value={data.activeMetrics.peerGroup ? `${peerActivity}/100` : data.peerGroupOpen ? "Đã mở" : "Chưa mở"}
          detail={peerGroupDetail}
          tone="purple"
          icon={Handshake}
        />
        </div>
      </section>

      <section className="overview-section">
        <div className="section-heading"><b>2. Các tín hiệu rủi ro</b><span>Bấm vào từng ô để xem danh sách cần xử lý</span></div>
        <div className="attention-card-grid risk-card-grid">
        <AttentionCard
          tone="red"
          icon={AlertTriangle}
          value={attention.length.toString()}
          percent={formatRiskPercent(attention.length, data.students.length)}
          label="Học viên cần chú ý"
          detail="Theo trạng thái học tập hiện tại."
          onClick={() => onOpenStudentFilter("Cần chú ý", "Tất cả hoạt động")}
        />
        <AttentionCard
          tone="orange"
          icon={UserRoundSearch}
          value={silent.length.toString()}
          percent={formatRiskPercent(silent.length, data.students.length)}
          label="Không hoạt động 72h"
          detail="Không có check-in hoặc hoạt động gần đây."
          onClick={() => onOpenStudentFilter("Tất cả", "Chưa có hoạt động gần đây (72 giờ)")}
        />
        <AttentionCard
          tone="gold"
          icon={MessageSquareText}
          value={data.activeAssessments.self ? missingSelfAssessment.length.toString() : "—"}
          percent={data.activeAssessments.self ? formatRiskPercent(missingSelfAssessment.length, data.students.length) : undefined}
          label={data.activeAssessments.self ? "Chưa tự đánh giá" : "Tự đánh giá chưa mở"}
          detail="Chỉ tính khi template tự đánh giá đã mở."
          onClick={() => onOpenStudentFilter("Tất cả", "Chưa tự đánh giá")}
        />
        <AttentionCard
          tone="blue"
          icon={UsersRound}
          value={data.activeAssessments.peer ? missingPeerAssessment.length.toString() : "—"}
          percent={data.activeAssessments.peer ? formatRiskPercent(missingPeerAssessment.length, data.students.length) : undefined}
          label={data.activeAssessments.peer ? "Chưa đủ mời đánh giá" : "Mời đánh giá chưa mở"}
          detail="Chưa đủ số người đánh giá theo yêu cầu."
          onClick={() => onOpenStudentFilter("Tất cả", "Chưa mời đủ đánh giá")}
        />
        <AttentionCard
          tone="purple"
          icon={Handshake}
          value={data.activeMetrics.peerGroup ? missingGroupCheckins.length.toString() : "—"}
          percent={data.activeMetrics.peerGroup ? formatRiskPercent(missingGroupCheckins.length, data.groups.length) : undefined}
          label={data.activeMetrics.peerGroup ? "Nhóm chưa check-in" : "Check-in nhóm chưa đến hạn"}
          detail={data.activeMetrics.peerGroup ? `Đang xét tuần ${groupDueWeeks.join(", ")}.` : "Chỉ xét tuần 1, 2, 3 sau WS7."}
          onClick={onOpenGroupRisk}
        />
        </div>
      </section>

      <section className="overview-section">
        <div className="overview-chart-grid">
          <div className="panel progress-distribution-panel">
            <div className="section-heading"><b>3. Phân bổ tiến độ học viên</b></div>
            <p className="chart-subtitle">Theo trạng thái tiến độ hiện tại</p>
            <StatusDonut counts={statusCounts} total={data.students.length} />
            <Legend label="Tốt" value={formatStatusShare(statusCounts.good, data.students.length)} tone="green" />
            <Legend label="Cần chú ý" value={formatStatusShare(statusCounts.attention, data.students.length)} tone="gold" />
            <Legend label="Chưa bắt đầu" value={formatStatusShare(statusCounts.notStarted, data.students.length)} tone="gray" />
            <button className="chart-detail-button" onClick={() => onOpenStudentFilter("Tất cả", "Tất cả hoạt động")} type="button">
              Xem chi tiết <ChevronRight />
            </button>
          </div>
          <div className="panel cohort-history-panel">
            <div className="section-heading"><b>4. Biến động sức khỏe cohort theo ngày</b><span>Theo dõi 5 thành phần tạo nên Cohort Health</span></div>
            <CohortHealthAreaChart points={data.healthHistory} />
          </div>
        </div>
      </section>
    </>
  );
}

function AttentionCard({ tone, icon: Icon, value, percent, label, detail, onClick }: { tone: "green" | "gold" | "red" | "orange" | "blue" | "purple"; icon: typeof AlertTriangle; value: string; percent?: string; label: string; detail: string; onClick: () => void }) {
  return (
    <button className={`attention-card ${tone}`} onClick={onClick} type="button">
      <span><Icon /></span>
      <div>
        <small>{label}</small>
        <div className="attention-value"><strong>{value}</strong>{percent ? <em>{percent}</em> : null}</div>
        <p>{detail}</p>
      </div>
      <ChevronRight />
    </button>
  );
}

function CohortHealthAreaChart({ points }: { points: CohortHealthHistoryPoint[] }) {
  const [range, setRange] = useState(14);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const visiblePoints = points.slice(-range);
  const series: { key: keyof Pick<CohortHealthHistoryPoint, "engagement" | "progress" | "practice" | "assessment" | "peerGroup">; label: string; color: string }[] = [
    { key: "engagement", label: "Engagement", color: "#178775" },
    { key: "progress", label: "Progress", color: "#d4a72c" },
    { key: "practice", label: "Practice", color: "#3478d4" },
    { key: "assessment", label: "Assessment", color: "#7357d7" },
    { key: "peerGroup", label: "Peer Group", color: "#cc604e" },
  ];
  const x = (index: number) => visiblePoints.length <= 1 ? 0 : (index / (visiblePoints.length - 1)) * 100;
  const y = (value: number) => 100 - value;

  return (
    <div className="cohort-area-chart">
      <div className="chart-toolbar">
        <div className="chart-legend">
          {series.map((item) => {
            const hidden = hiddenSeries.includes(item.key);
            return (
              <button
                className={hidden ? "muted" : ""}
                key={item.key}
                onClick={() => setHiddenSeries((current) => hidden ? current.filter((key) => key !== item.key) : [...current, item.key])}
                type="button"
              >
                <i style={{ background: item.color }} />{item.label}
              </button>
            );
          })}
        </div>
        <select aria-label="Khoảng thời gian biểu đồ" value={range} onChange={(event) => setRange(Number(event.target.value))}>
          <option value={7}>7 ngày</option>
          <option value={14}>14 ngày</option>
          <option value={30}>30 ngày</option>
        </select>
      </div>
      <div className="area-chart-canvas">
        <div className="area-y-axis"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Biến động 5 chỉ số Cohort Health theo ngày">
          <defs>
            {series.map((item) => (
              <linearGradient id={`area-${item.key}`} key={item.key} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color} stopOpacity="0.16" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0.01" />
              </linearGradient>
            ))}
          </defs>
          {[0, 25, 50, 75, 100].map((value) => <line className="area-grid-line" key={value} x1="0" x2="100" y1={value} y2={value} />)}
          {series.filter((item) => !hiddenSeries.includes(item.key)).map((item) => {
            const coordinates = visiblePoints
              .map((point, index) => ({ value: point[item.key], index }))
              .filter((entry): entry is { value: number; index: number } => entry.value !== null)
              .map((entry) => `${x(entry.index)},${y(entry.value)}`);
            if (!coordinates.length) return null;
            return (
              <g key={item.key}>
                <polygon points={`0,100 ${coordinates.join(" ")} 100,100`} fill={`url(#area-${item.key})`} />
                <polyline points={coordinates.join(" ")} fill="none" stroke={item.color} strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>
        <div className="area-x-axis">
          {visiblePoints.map((point, index) => index % Math.max(1, Math.ceil(visiblePoints.length / 7)) === 0 || index === visiblePoints.length - 1 ? <span key={point.date}>{point.date}</span> : null)}
        </div>
      </div>
      {!dataHasPeerGroupHistory(visiblePoints) ? <p className="chart-note">Peer Group sẽ xuất hiện khi WS7 đã mở và tuần check-in đầu tiên đến hạn.</p> : null}
    </div>
  );
}

function dataHasPeerGroupHistory(points: CohortHealthHistoryPoint[]) {
  return points.some((point) => point.peerGroup !== null);
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)].sort((a, b) => a - b);
}

function HealthComponent({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div className={`health-component${active ? "" : " inactive"}`}>
      <span>{label}</span>
      <Progress value={active ? value : 0} />
      <b>{active ? `${value}/100` : "Chưa mở"}</b>
    </div>
  );
}

function CohortScoreGuide({ activeMetrics }: { activeMetrics: InstructorDashboardData["activeMetrics"] }) {
  const activeCount = Object.values(activeMetrics).filter(Boolean).length;
  const weight = activeCount ? Math.round(100 / activeCount) : 0;
  const items = [
    { key: "engagement" as const, label: "Engagement", text: "Tỷ lệ học viên còn hoạt động gần đây, dựa trên check-in/hoạt động trong 72 giờ." },
    { key: "progress" as const, label: "Progress", text: "Tiến độ học viên chỉ gồm các hạng mục đã đến thời điểm áp dụng." },
    { key: "practice" as const, label: "Practice", text: "Mức hoàn thành các ngày mini challenge đã đến hạn; không tính ngày tương lai." },
    { key: "assessment" as const, label: "Self/Peer", text: "Chỉ tính khi template tự đánh giá hoặc mời đánh giá đã được mở." },
    { key: "peerGroup" as const, label: "Nhóm", text: "Chỉ tính khi nhóm bạn đồng hành đã được mở trên Sheet." },
  ];

  return (
    <div className="score-guide">
      <b>Cách đọc score</b>
      {items.map((item) => (
        <p key={item.key}><strong>{item.label} {activeMetrics[item.key] ? `~${weight}%` : "· Chưa mở"}</strong>{item.text}</p>
      ))}
    </div>
  );
}

function StudentsView({
  data,
  query,
  status,
  activityFilter,
  onQuery,
  onStatus,
  onActivityFilter,
  onOpenStudent,
  onSaveCoachingSelection,
}: {
  data: InstructorDashboardData;
  query: string;
  status: string;
  activityFilter: string;
  onQuery: (value: string) => void;
  onStatus: (value: string) => void;
  onActivityFilter: (value: string) => void;
  onOpenStudent: (student: InstructorStudent) => void;
  onSaveCoachingSelection: (userIds: string[]) => void;
}) {
  const [coachingSelection, setCoachingSelection] = useState<string[]>([]);
  const statusOptions = ["Tất cả", "Tốt", "Cần chú ý", "Chưa bắt đầu"];
  const activityOptions = [
    "Tất cả hoạt động",
    "Chưa có hoạt động gần đây (72 giờ)",
    "Đã hoàn thành check-in",
    "Chưa hoàn thành check-in",
    "Đã tự đánh giá",
    "Chưa tự đánh giá",
    "Đã mời đủ đánh giá",
    "Chưa mời đủ đánh giá",
    "Thuộc nhóm chưa check-in",
  ];
  const { filtered, statusCounts, activityCounts } = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const missingGroupMemberNames = new Set(
      data.groups.filter((group) => group.missingWeeks.length > 0).flatMap((group) => group.members),
    );
    const matchesQuery = (student: InstructorStudent) =>
      `${student.name} ${student.id} ${student.email} ${student.department}`.toLowerCase().includes(normalizedQuery);
    const matchesStatus = (student: InstructorStudent, value: string) => value === "Tất cả" || student.status === value;
    const matchesActivity = (student: InstructorStudent, value: string) =>
      value === "Tất cả hoạt động" ||
      (value === "Chưa có hoạt động gần đây (72 giờ)" && !isRecentlyActive(student)) ||
      (value === "Đã hoàn thành check-in" && Boolean(student.checkinCompleted)) ||
      (value === "Chưa hoàn thành check-in" && !student.checkinCompleted) ||
      (value === "Đã tự đánh giá" && Boolean(student.selfAssessmentCompleted)) ||
      (value === "Chưa tự đánh giá" && !student.selfAssessmentCompleted) ||
      (value === "Đã mời đủ đánh giá" && Boolean(student.peerAssessmentCompleted)) ||
      (value === "Chưa mời đủ đánh giá" && !student.peerAssessmentCompleted) ||
      (value === "Thuộc nhóm chưa check-in" && missingGroupMemberNames.has(student.name));

    return {
      filtered: data.students.filter(
        (student) => matchesQuery(student) && matchesStatus(student, status) && matchesActivity(student, activityFilter),
      ),
      statusCounts: Object.fromEntries(
        statusOptions.map((value) => [
          value,
          data.students.filter((student) => matchesQuery(student) && matchesActivity(student, activityFilter) && matchesStatus(student, value)).length,
        ]),
      ),
      activityCounts: Object.fromEntries(
        activityOptions.map((value) => [
          value,
          data.students.filter((student) => matchesQuery(student) && matchesStatus(student, status) && matchesActivity(student, value)).length,
        ]),
      ),
    };
  }, [activityFilter, data.groups, data.students, query, status]);

  useEffect(() => {
    setCoachingSelection(
      data.coachingRequests.filter((request) => ["selected", "booked"].includes(request.status.toLowerCase())).map((request) => request.userId),
    );
  }, [data.coachingRequests]);

  function exportAllStudentFilters() {
    const workbook = XLSX.utils.book_new();
    const normalizedQuery = query.trim().toLowerCase();
    const missingGroupMemberNames = new Set(
      data.groups.filter((group) => group.missingWeeks.length > 0).flatMap((group) => group.members),
    );
    const matchesQuery = (student: InstructorStudent) =>
      `${student.name} ${student.id} ${student.email} ${student.department}`.toLowerCase().includes(normalizedQuery);
    const matchesActivity = (student: InstructorStudent, value: string) =>
      value === "Tất cả hoạt động" ||
      (value === "Chưa có hoạt động gần đây (72 giờ)" && !isRecentlyActive(student)) ||
      (value === "Đã hoàn thành check-in" && Boolean(student.checkinCompleted)) ||
      (value === "Chưa hoàn thành check-in" && !student.checkinCompleted) ||
      (value === "Đã tự đánh giá" && Boolean(student.selfAssessmentCompleted)) ||
      (value === "Chưa tự đánh giá" && !student.selfAssessmentCompleted) ||
      (value === "Đã mời đủ đánh giá" && Boolean(student.peerAssessmentCompleted)) ||
      (value === "Chưa mời đủ đánh giá" && !student.peerAssessmentCompleted) ||
      (value === "Thuộc nhóm chưa check-in" && missingGroupMemberNames.has(student.name));
    const queryMatchedStudents = data.students.filter(matchesQuery);
    const headers = [
      "Mã học viên", "Họ và tên", "Email", "Phòng ban", "Cohort", "Workshop", "Tiến độ (%)", "XP",
      "Streak dài nhất (ngày)", "Check-in gần nhất", "Số lần tự đánh giá", "Số lượt nhận đánh giá", "Trạng thái",
    ];
    const toRow = (student: InstructorStudent) => [
      student.id, student.name, student.email, student.department, student.cohortId, `WS${student.currentWorkshop}`,
      student.progress, student.xp, student.longestStreak, student.lastCheckin, student.selfAssessmentCount,
      student.peerReviewCount, student.status,
    ];
    const appendStudentSheet = (name: string, students: InstructorStudent[]) => {
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...students.map(toRow)]);
      sheet["!cols"] = [
        { wch: 16 }, { wch: 28 }, { wch: 32 }, { wch: 24 }, { wch: 16 }, { wch: 12 },
        { wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 24 }, { wch: 22 }, { wch: 24 }, { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(workbook, sheet, name);
    };

    const filterSheet = XLSX.utils.aoa_to_sheet([
      ["Thông tin xuất", "Giá trị"],
      ["Từ khóa", query.trim() || "Tất cả"],
      ["Cohort", data.cohortId || "Tất cả"],
      ["Trạng thái đang chọn", status],
      ["Hoạt động đang chọn", activityFilter],
      ["Số học viên khớp từ khóa", queryMatchedStudents.length],
      ["Thời điểm xuất", new Date().toLocaleString("vi-VN")],
      ["Cấu trúc", "Mỗi sheet trạng thái/hoạt động là một bộ lọc độc lập; từ khóa và cohort áp dụng cho tất cả sheet."],
    ]);
    filterSheet["!cols"] = [{ wch: 28 }, { wch: 90 }];
    XLSX.utils.book_append_sheet(workbook, filterSheet, "Thông tin");
    appendStudentSheet("Đang hiển thị", filtered);
    appendStudentSheet("Tất cả học viên", queryMatchedStudents);
    appendStudentSheet("TT - Tốt", queryMatchedStudents.filter((student) => student.status === "Tốt"));
    appendStudentSheet("TT - Cần chú ý", queryMatchedStudents.filter((student) => student.status === "Cần chú ý"));
    appendStudentSheet("TT - Chưa bắt đầu", queryMatchedStudents.filter((student) => student.status === "Chưa bắt đầu"));

    const activitySheets = [
      ["HD - Không gần đây", "Chưa có hoạt động gần đây (72 giờ)"],
      ["HD - Đã check-in", "Đã hoàn thành check-in"],
      ["HD - Chưa check-in", "Chưa hoàn thành check-in"],
      ["HD - Đã tự đánh giá", "Đã tự đánh giá"],
      ["HD - Chưa tự đánh giá", "Chưa tự đánh giá"],
      ["HD - Đủ đánh giá", "Đã mời đủ đánh giá"],
      ["HD - Chưa đủ đánh giá", "Chưa mời đủ đánh giá"],
      ["HD - Nhóm chưa check-in", "Thuộc nhóm chưa check-in"],
    ];
    activitySheets.forEach(([sheetName, filterValue]) => {
      appendStudentSheet(sheetName, queryMatchedStudents.filter((student) => matchesActivity(student, filterValue)));
    });

    const cohort = (data.cohortId || "tat-ca").replace(/[^a-zA-Z0-9_-]+/g, "-");
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `hoc-vien_tat-ca-bo-loc_${cohort}_${date}.xlsx`);
  }

  return (
    <>
      <PageHeading eyebrow="QUẢN LÝ HỌC VIÊN" title="Danh sách học viên" copy="Bấm vào từng học viên để xem trạng thái học tập, không hiển thị nội dung insight." />
      {data.coachingRequests.length ? (
        <div className="panel coaching-admin-panel">
          <div className="coaching-admin-heading">
            <div><b>Đăng ký Debrief Coaching 1:1</b><span>Ưu tiên theo XP, nếu bằng điểm thì ưu tiên đăng ký sớm hơn.</span></div>
            <strong>Đã chọn {coachingSelection.length}/5</strong>
          </div>
          <div className="coaching-candidate-list">
            {data.coachingRequests.map((request, index) => {
              const checked = coachingSelection.includes(request.userId);
              const booked = request.status.toLowerCase() === "booked";
              return (
                <label key={request.id}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={booked || (!checked && coachingSelection.length >= 5)}
                    onChange={() => setCoachingSelection((current) => checked ? current.filter((id) => id !== request.userId) : [...current, request.userId])}
                  />
                  <span className="rank">#{index + 1}</span>
                  <div><b>{request.fullName || request.userId}</b><small>{request.userId} · {request.xp} XP</small>{request.explorationGoal ? <p>{request.explorationGoal}</p> : null}</div>
                  <em>{booked ? "Đã chọn lịch" : checked ? "Được chọn" : "Chưa chọn"}</em>
                </label>
              );
            })}
          </div>
          <button className="primary-action coaching-save" disabled={coachingSelection.length > 5} onClick={() => onSaveCoachingSelection(coachingSelection)}>
            <Check /> Lưu danh sách Debrief Coaching
          </button>
        </div>
      ) : null}
      <div className="toolbar">
        <label className="search"><Search /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Tìm tên, mã học viên, email..." /></label>
        <div className="segmented">
          {statusOptions.map((item) => (
            <button className={status === item ? "active" : ""} key={item} onClick={() => onStatus(item)}>{item} ({statusCounts[item]})</button>
          ))}
        </div>
        <label className="activity-filter">
          <span>Hoạt động</span>
          <select value={activityFilter} onChange={(event) => onActivityFilter(event.target.value)}>
            {activityOptions.map((item) => <option key={item} value={item}>{item} ({activityCounts[item]})</option>)}
          </select>
        </label>
        <button className="export-button" type="button" onClick={exportAllStudentFilters} disabled={!data.students.length}>
          <Download /> Xuất tất cả bộ lọc
        </button>
      </div>
      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Học viên</th>
              <th>Workshop</th>
              <th>Tiến độ</th>
              <th>XP</th>
              <th>Streak</th>
              <th>Check-in gần nhất</th>
              <th>Đánh giá</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => (
              <tr key={student.id}>
                <td><div className="student-cell"><Avatar name={student.name} /><div><b>{student.name}</b><span>{student.id} · {student.email}</span></div></div></td>
                <td>WS{student.currentWorkshop}</td>
                <td><Progress value={student.progress} /><small>{student.progress}%</small></td>
                <td><strong>{student.xp}</strong></td>
                <td>{student.longestStreak} ngày</td>
                <td>{student.lastCheckin}</td>
                <td>{student.selfAssessmentCount} tự đánh giá · {student.peerReviewCount}/3 nhận đánh giá</td>
                <td><Status value={student.status} /></td>
                <td><button className="row-action" onClick={() => onOpenStudent(student)}><ChevronRight /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StudentDetail({
  student,
  onBack,
  onOpenReport,
  onPublishReport,
}: {
  student: InstructorStudent;
  onBack: () => void;
  onOpenReport: () => void;
  onPublishReport: () => void;
}) {
  return (
    <>
      <button className="back-button" onClick={onBack}>← Quay lại danh sách</button>
      <div className="student-hero">
        <Avatar name={student.name} large />
        <div>
          <span>{student.id}</span>
          <h1>{student.name}</h1>
          <p>{student.email} · Cohort {student.cohortId || "đang cập nhật"}</p>
        </div>
        <Status value={student.status} />
      </div>
      <section className="kpi-grid compact">
        <Kpi title="Tiến độ" value={`${student.progress}%`} detail="Chỉ tính các hạng mục đã đến thời điểm áp dụng" tone="green" icon={Gauge} />
        <Kpi title="XP" value={student.xp.toString()} detail="Từ check-in và đánh giá" tone="gold" icon={Sparkles} />
        <Kpi title="Streak dài nhất" value={`${student.longestStreak} ngày`} detail={student.lastCheckin} tone="blue" icon={TrendingUp} />
        <Kpi title="Nhận đánh giá" value={`${student.peerReviewCount}/3`} detail="Mốc khuyến nghị tối thiểu" tone="purple" icon={UserRoundSearch} />
      </section>
      <div className="panel">
        <PanelTitle title="Cách tính tiến độ học viên" subtitle="Không tính đánh giá workshop; phần đó nằm riêng trong Workshop Quality" />
        <div className="progress-part-grid">
          {student.progressWeights.checkin ? <ProgressPart title="Mini challenge" value={student.progressParts.checkin} total={student.progressWeights.checkin} /> : null}
          {student.progressWeights.workshop ? <ProgressPart title="Tham gia workshop" value={student.progressParts.workshop} total={student.progressWeights.workshop} /> : null}
          {student.progressWeights.selfAssessment ? <ProgressPart title="Tự đánh giá" value={student.progressParts.selfAssessment} total={student.progressWeights.selfAssessment} /> : null}
          {student.progressWeights.peerAssessment ? <ProgressPart title="Mời đánh giá" value={student.progressParts.peerAssessment} total={student.progressWeights.peerAssessment} /> : null}
        </div>
      </div>
      <div className="panel">
        <PanelTitle title="Báo cáo lãnh đạo cá nhân" subtitle="Mở khi học viên đã hoàn thành tự đánh giá và có đủ đánh giá từ người khác" icon={FileText} />
        {student.reportUrl ? (
          <div className="report-card">
            <div>
              <b>Leadership report</b>
              <span>Đã có file báo cáo cho {student.name}. Admin có thể dán URL riêng vào cột LeadershipReportURL trên sheet Users.</span>
            </div>
            <div>
              <a className="secondary-action" href={student.reportUrl} target="_blank" rel="noreferrer"><FileText /> Mở báo cáo</a>
              <a className="secondary-action" href={`mailto:${student.email}?subject=${encodeURIComponent("Báo cáo lãnh đạo cá nhân")}&body=${encodeURIComponent(`Chào ${student.name},\n\nBạn có thể mở báo cáo lãnh đạo cá nhân tại link sau:\n${student.reportUrl}\n\nThân mến,\nSEN Pharma`)}`}><Mail /> Soạn email</a>
            </div>
          </div>
        ) : (
          <div className="report-card">
            <div>
              <b>Report từ dữ liệu đánh giá</b>
              <span>
                {student.assessmentReportPublished
                  ? "Report đã được giảng viên tạo và học viên có thể mở từ app."
                  : student.assessmentReportDataReady
                    ? "Học viên đã đủ tối thiểu 1 tự đánh giá và 3 lượt người khác đánh giá. Giảng viên có thể tạo report khi thấy dữ liệu đã đủ."
                    : "Report sẽ sẵn sàng khi học viên có 1 tự đánh giá và tối thiểu 3 lượt người khác đánh giá."}
              </span>
            </div>
            {student.assessmentReportPublished ? (
              <button className="secondary-action" onClick={onOpenReport}><FileText /> Xem report</button>
            ) : student.assessmentReportDataReady ? (
              <button className="secondary-action" onClick={onPublishReport}><FileText /> Tạo report</button>
            ) : (
              <button className="secondary-action" disabled><FileText /> Chưa đủ dữ liệu</button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function LeadershipReportsView({
  reports,
  selected,
  students,
  onSelect,
  onPublishReadyReports,
  reportOnly = false,
}: {
  reports: LeadershipReport[];
  selected: LeadershipReport;
  students: InstructorStudent[];
  onSelect: (studentId: string) => void;
  onPublishReadyReports?: () => void;
  reportOnly?: boolean;
}) {
  const [activeMobileDimension, setActiveMobileDimension] = useState("being");
  const [expandedMobileScenario, setExpandedMobileScenario] = useState<number | null>(null);
  const selectedStudent = students.find((student) => student.id === selected.userId);
  const readyToPublishCount = students.filter((student) => student.assessmentReportDataReady && !student.assessmentReportPublished).length;
  const selfReactiveRate = Math.max(0, 100 - selected.selfCreativeRate);
  const peerReactiveRate = Math.max(0, 100 - selected.peerCreativeRate);
  const alignmentValues = selected.scenarios.filter((item) => item.peerTotal).map((item) => item.alignmentRate);
  const averageAlignment = alignmentValues.length ? Math.round(alignmentValues.reduce((sum, value) => sum + value, 0) / alignmentValues.length) : 0;
  const activeDimension = selected.dimensions.find((dimension) => dimension.id === activeMobileDimension) || selected.dimensions[0];
  const activeScenarios = activeDimension ? selected.scenarios.filter((scenario) => scenario.dimension === activeDimension.id) : [];

  useEffect(() => {
    setActiveMobileDimension(selected.dimensions[0]?.id || "being");
    setExpandedMobileScenario(null);
  }, [selected.userId, selected.dimensions]);

  useEffect(() => {
    setExpandedMobileScenario(null);
  }, [activeMobileDimension]);

  return (
    <>
      <PageHeading
        eyebrow="LEADERSHIP REPORT"
        title="Báo cáo lãnh đạo cá nhân"
        copy="Tạo từ 30 câu tình huống: so sánh tự đánh giá với các lượt nhận đánh giá từ người khác."
      />
      <div className="toolbar">
        <label className="search">
          <UserRoundSearch />
          <select value={selected.userId} onChange={(event) => onSelect(event.target.value)}>
            {reports.map((report) => (
              <option key={report.userId} value={report.userId}>{report.studentName}</option>
            ))}
          </select>
        </label>
        {!reportOnly && (
          <button className="primary-action" disabled={!readyToPublishCount} onClick={onPublishReadyReports}>
            <FileText /> Tạo report hàng loạt{readyToPublishCount ? ` (${readyToPublishCount})` : ""}
          </button>
        )}
      </div>
      <section className="mobile-leadership-report">
        <header className="mobile-report-header">
          <span>BÁO CÁO KẾT QUẢ ĐÁNH GIÁ</span>
          <b>từ Phản ứng đến Sáng tạo</b>
        </header>
        <article className="mobile-report-profile">
          <div className="mobile-report-avatar">{getInitials(selected.studentName)}</div>
          <div>
            <h2>{selected.studentName}</h2>
            <p>Mã học viên: {selected.userId}</p>
            <span>{selectedStudent?.cohortId || "Cohort"} · {selected.peerRespondentCount} người đánh giá</span>
          </div>
        </article>
        <article className="mobile-report-card">
          <h3>Bảng tóm tắt kết quả đánh giá</h3>
          <GradientMarkerLine label="Tự đánh giá" helper="Bạn nhìn nhận bản thân" value={selected.selfCreativeRate} tone="self" />
          <div className="mobile-peer-summary">
            <GradientMarkerLine label="Người khác đánh giá" helper={`Góc nhìn từ ${selected.peerRespondentCount || 0} người khác`} value={selected.peerCreativeRate} tone="peer" />
            <div className="alignment-donut small" style={{ background: `conic-gradient(var(--green) ${averageAlignment * 3.6}deg, #e5ece9 0deg)` }}>
              <span>{averageAlignment}%</span>
            </div>
          </div>
        </article>
        <article className="mobile-report-card mobile-guide-card">
          <h3>Hướng dẫn đọc màu</h3>
          <p><span className="legend green" />Xanh: bạn và hầu hết người đánh giá cùng nhìn nhận theo hướng Sáng tạo.</p>
          <p><span className="legend orange" />Cam: bạn và người khác cùng nhìn nhận bạn đang nghiêng về Phản ứng.</p>
          <p><span className="legend purple" />Tím: có khác biệt lớn giữa tự nhìn nhận và trải nghiệm của người khác.</p>
          <p><span className="legend white" />Trắng: chưa đủ dữ liệu hoặc chưa rõ xu hướng.</p>
        </article>
        <article className="mobile-report-card">
          <h3>Chọn khía cạnh để xem chi tiết</h3>
          <div className="mobile-dimension-tabs">
            {selected.dimensions.map((dimension) => {
              const DimensionIcon = dimensionIcon(dimension.id);
              return (
                <button
                  className={activeDimension?.id === dimension.id ? "active" : ""}
                  key={dimension.id}
                  onClick={() => setActiveMobileDimension(dimension.id)}
                >
                  <span className={`dimension-icon ${dimension.id}`}><DimensionIcon /></span>
                  {dimensionReportLabel(dimension.id)}
                </button>
              );
            })}
          </div>
        </article>
        {activeDimension ? (
          <article className="mobile-report-card">
            <div className="mobile-dimension-head">
              <span className={`dimension-icon ${activeDimension.id}`}>{(() => {
                const Icon = dimensionIcon(activeDimension.id);
                return <Icon />;
              })()}</span>
              <div>
                <h3>{dimensionReportLabel(activeDimension.id)}</h3>
                <p>{dimensionCaption(activeDimension.id)}</p>
              </div>
            </div>
            <div className="mobile-dimension-metrics">
              <SpectrumLine label="Tự đánh giá" reactive={100 - activeDimension.selfCreativeRate} creative={activeDimension.selfCreativeRate} />
              <SpectrumLine label="Người khác đánh giá" reactive={100 - activeDimension.peerCreativeRate} creative={activeDimension.peerCreativeRate} />
              <div className="mobile-alignment-row">
                <span>Mức độ tương đồng</span>
                <div className="alignment-donut small" style={{ background: `conic-gradient(var(--green) ${activeDimension.alignmentRate * 3.6}deg, #e5ece9 0deg)` }}>
                  <span>{activeDimension.alignmentRate}%</span>
                </div>
              </div>
            </div>
            <div className="mobile-scenario-list">
              {activeScenarios.map((item) => {
                const expanded = expandedMobileScenario === item.order;
                const peerReactiveRate = item.peerTotal ? Math.round((item.peerReactiveCount / item.peerTotal) * 100) : 0;
                const peerCreativeRate = item.peerTotal ? Math.round((item.peerCreativeCount / item.peerTotal) * 100) : 0;

                return (
                  <button
                    className={`mobile-scenario-card approved-${item.tone} ${expanded ? "expanded" : ""}`}
                    key={item.order}
                    onClick={() => setExpandedMobileScenario(expanded ? null : item.order)}
                  >
                    <div className="mobile-scenario-main">
                      <b>{item.order}</b>
                      <span>{compactScenarioText(item.question, item.order)}</span>
                      <em>{item.peerTotal ? `${item.alignmentRate}%` : "-"}</em>
                      <ChevronRight />
                    </div>
                    <div className="mobile-scenario-signals">
                      <p>Bạn chọn <strong className={item.selfAnswer || "mixed"}>{scenarioChoiceLabel(item.selfAnswer)}</strong></p>
                      <div className="peer-mini-spectrum" aria-label={`Phản ứng ${item.peerReactiveCount}, Sáng tạo ${item.peerCreativeCount}`}>
                        <span>Phản ứng {item.peerReactiveCount}</span>
                        <i>
                          <b className="reactive" style={{ width: `${peerReactiveRate}%` }} />
                          <b className="creative" style={{ width: `${peerCreativeRate}%` }} />
                        </i>
                        <span>Sáng tạo {item.peerCreativeCount}</span>
                      </div>
                    </div>
                    {expanded ? (
                      <div className="mobile-scenario-detail">
                        <div>
                          <small>Phản ứng</small>
                          <p>{item.reactiveText || scenarioMeaningText("reactive")}</p>
                        </div>
                        <div>
                          <small>Sáng tạo</small>
                          <p>{item.creativeText || scenarioMeaningText("creative")}</p>
                        </div>
                        <p className="scenario-read-note">{scenarioReadNote(item)}</p>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </article>
        ) : null}
        <article className="mobile-report-card">
          <h3>Phản hồi mở từ người khác</h3>
          <OpenFeedbackGroups groups={selected.openFeedbackGroups} compact />
        </article>
      </section>
      <section className="approved-report">
        <article className="approved-sheet guide-sheet approved-guide-visual guide-image-sheet">
          <img src="/reports/Leadership_Report_HuongDan_Page1_Sharp_2x.png" alt="Hướng dẫn cách đọc và phân tích báo cáo lãnh đạo" />
          <h2>HƯỚNG DẪN CÁCH ĐỌC & PHÂN TÍCH<br />BÁO CÁO KẾT QUẢ ĐÁNH GIÁ LÃNH ĐẠO</h2>
          <div className="guide-topline">
            <div className="guide-icon-card">
              <span>☑</span>
              <b>Lưu ý cách đọc & chiêm nghiệm</b>
            </div>
            <div className="guide-checks">
              <p><b>✕</b> Không phán xét bản thân</p>
              <p><b>✓</b> Không cần hiểu hết mọi thứ ngay từ lần đầu</p>
              <p><b>●</b> Chỉ đơn giản là quan sát để hiểu rõ mình hơn</p>
              <p><b>✓</b> Chỉ cần nhận ra 1-2 điều thật sự có ý nghĩa</p>
            </div>
          </div>
          <div className="guide-note-strip">Kết quả không phản ánh bạn là ai, mà phản ánh xu hướng bạn thường thể hiện trong các tình huống cụ thể.</div>
          <div className="guide-visual-grid">
            <section>
              <h3>1. Nhìn vào bức tranh tổng thể</h3>
              <p>Bắt đầu với bảng tóm tắt kết quả và tự hỏi: kết quả này có giống cảm nhận của tôi không, có điểm nào khiến tôi bất ngờ không, tôi đang cảm thấy gì khi nhìn vào kết quả này?</p>
              <div className="guide-callout">Đừng vội phân tích. Chỉ cần ghi nhận cảm nhận đầu tiên của mình.</div>
            </section>
            <section>
              <h3>2. Đi vào tình huống chi tiết</h3>
              <p>Đọc hiểu các dòng được highlight màu:</p>
              <ul>
                <li><span className="legend green" />Xanh: bạn và hầu hết người đánh giá đều nhìn nhận bạn đang thể hiện theo hướng Sáng tạo.</li>
                <li><span className="legend orange" />Cam: bạn và người khác đều nhìn nhận bạn đang nghiêng về Phản ứng.</li>
                <li><span className="legend purple" />Tím: có khác biệt lớn giữa cách bạn nhìn nhận bản thân và cách người khác trải nghiệm bạn.</li>
                <li><span className="legend white" />Trắng: cần quan sát thêm trước khi kết luận.</li>
              </ul>
            </section>
            <section>
              <h3>3. Đọc phản hồi cho câu hỏi mở</h3>
              <p>Đọc chậm, gạch chân những từ/cụm từ lặp lại nhiều lần. Đối chiếu với bảng kết quả chi tiết để xem có mối liên hệ nhỏ nào không.</p>
              <div className="guide-callout">Phản hồi không phải để đánh giá bạn, mà để giúp bạn thấy thêm những gì mình chưa thấy.</div>
            </section>
            <section>
              <h3>4. Tổng hợp insight cho chính mình</h3>
              <div className="guide-writing-box"><b>1</b>Một điểm mạnh tôi muốn tiếp tục phát huy</div>
              <div className="guide-writing-box"><b>2</b>Một tình huống tôi thường suy nghĩ/hành động theo hướng Phản ứng và muốn chuyển dịch</div>
              <div className="guide-writing-box"><b>3</b>Một hành động nhỏ tôi có thể bắt đầu ngay</div>
            </section>
          </div>
        </article>

        <article className="approved-sheet result-sheet">
          <h2>BÁO CÁO KẾT QUẢ ĐÁNH GIÁ LÃNH ĐẠO<br />từ Phản ứng đến Sáng tạo</h2>
          <div className="report-meta">
            <span><b>Họ tên người được đánh giá</b>{selected.studentName}</span>
            <span><b>Ngày báo cáo</b>{new Date().toLocaleDateString("vi-VN")}</span>
            <span><b>Số lượt đánh giá nhận được từ người khác</b>{selected.peerRespondentCount}</span>
          </div>
          <h3>Bảng tóm tắt kết quả đánh giá</h3>
          <LeadershipOverviewChart
            selfCreativeRate={selected.selfCreativeRate}
            peerCreativeRate={selected.peerCreativeRate}
            averageAlignment={averageAlignment}
            peerRespondentCount={selected.peerRespondentCount}
          />
          <table className="approved-summary-table">
            <tbody>
              <tr>
                <th>Giai đoạn</th>
                <th>Kết quả chung - Tự đánh giá</th>
                <th>Kết quả chung - Người khác đánh giá</th>
              </tr>
              <tr>
                <td>Phản ứng</td>
                <td>{selfReactiveRate}%</td>
                <td>{peerReactiveRate}%</td>
              </tr>
              <tr>
                <td>Sáng tạo</td>
                <td>{selected.selfCreativeRate}%</td>
                <td>{selected.peerCreativeRate}%</td>
              </tr>
              <tr>
                <td>Mức độ trùng khớp</td>
                <td colSpan={2}>{averageAlignment}% trung bình mức độ tương đồng của 30 câu</td>
              </tr>
            </tbody>
          </table>
          <div className="dimension-spectrum-grid">
            {selected.dimensions.map((dimension) => (
              <DimensionSpectrumCard key={dimension.id} dimension={dimension} />
            ))}
          </div>
          <h3>Bảng kết quả chi tiết</h3>
          <div className="approved-detail-wrap">
            <table>
              <thead>
                <tr>
                  <th>Khía cạnh</th>
                  <th>STT</th>
                  <th>Tình huống</th>
                  <th colSpan={2}>Tự đánh giá</th>
                  <th colSpan={2}>Người khác đánh giá</th>
                  <th>Mức độ tương đồng</th>
                </tr>
                <tr>
                  <th />
                  <th>Câu</th>
                  <th />
                  <th>Phản ứng</th>
                  <th>Sáng tạo</th>
                  <th>Phản ứng</th>
                  <th>Sáng tạo</th>
                  <th>Alignment</th>
                </tr>
              </thead>
              <tbody>
                {selected.scenarios.map((item, index) => {
                  const previous = selected.scenarios[index - 1];
                  const rowSpan = selected.scenarios.filter((scenario) => scenario.dimension === item.dimension).length;
                  const showDimension = !previous || previous.dimension !== item.dimension;

                  return (
                    <tr className={`approved-${item.tone}`} key={item.order}>
                      {showDimension ? <td className="dimension-merged" rowSpan={rowSpan}>{dimensionReportLabel(item.dimension)}</td> : null}
                      <td>{item.order}</td>
                      <td className="scenario-text-cell">{compactScenarioText(item.question, item.order)}</td>
                      <td>{item.selfAnswer === "reactive" ? "✓" : ""}</td>
                      <td>{item.selfAnswer === "creative" ? "✓" : ""}</td>
                      <td>{item.peerReactiveCount}</td>
                      <td>{item.peerCreativeCount}</td>
                      <td>{item.peerTotal ? `${item.alignmentRate}%` : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <h3>Phản hồi mở từ người khác</h3>
          <OpenFeedbackGroups groups={selected.openFeedbackGroups} />
          {selectedStudent?.reportUrl ? (
            <a className="secondary-action" href={selectedStudent.reportUrl} target="_blank" rel="noreferrer"><FileText /> Mở file báo cáo đã upload</a>
          ) : null}
        </article>

        <article className="approved-sheet guide-sheet">
          <h2>HƯỚNG DẪN CÁCH ĐỌC & PHÂN TÍCH<br />BÁO CÁO KẾT QUẢ ĐÁNH GIÁ LÃNH ĐẠO</h2>
          <section>
            <h3>1. Nhìn vào bức tranh tổng thể</h3>
            <p>Bắt đầu với bảng tóm tắt kết quả và tự hỏi: kết quả này có giống cảm nhận của tôi không, có điểm nào khiến tôi bất ngờ không, tôi đang cảm thấy gì khi nhìn vào kết quả này?</p>
          </section>
          <section>
            <h3>2. Đi vào tình huống chi tiết</h3>
            <p>Không cần phân tích hết 30 tình huống. Hãy tập trung vào những tình huống được highlight màu hoặc những tình huống khiến bạn dừng lại lâu hơn.</p>
          </section>
          <section>
            <h3>3. Đọc phản hồi mở</h3>
            <p>Đọc chậm, gạch chân các từ/cụm từ lặp lại. Đối chiếu với bảng kết quả chi tiết để xem có mối liên hệ nào giữa phản hồi và cách bạn thường phản ứng.</p>
          </section>
          <section>
            <h3>4. Tổng hợp insight cho chính mình</h3>
            <p>Một điểm mạnh tôi muốn tiếp tục phát huy. Một tình huống tôi thường phản ứng và muốn chuyển dịch. Một hành động nhỏ tôi có thể bắt đầu ngay.</p>
          </section>
          <section>
            <h3>Lời kết</h3>
            <p>Bạn không cần thay đổi tất cả mọi thứ cùng lúc. Chỉ cần thấy rõ một điều và bắt đầu thay đổi từ điều đó.</p>
          </section>
        </article>
      </section>
    </>
  );
}

function OpenFeedbackGroups({
  groups,
  compact = false,
}: {
  groups: LeadershipReport["openFeedbackGroups"];
  compact?: boolean;
}) {
  if (!groups.length) {
    return <p className="empty-state">Chưa có phản hồi mở từ người khác đánh giá.</p>;
  }

  return (
    <div className={`open-feedback-groups ${compact ? "compact" : ""}`}>
      {groups.map((group) => (
        <article className="open-feedback-group" key={`${group.questionId}-${group.order}`}>
          <header>
            <MessageSquareText />
            <div>
              <small>Câu {group.order}</small>
              <b>{group.question}</b>
            </div>
            <span>{group.answers.length} phản hồi</span>
          </header>
          <div>
            {group.answers.map((answer, index) => (
              <blockquote key={`${group.questionId}-${index}-${answer}`}>
                <small>Phản hồi {index + 1}</small>
                <p>{answer}</p>
              </blockquote>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="report-metric-bar">
      <span>{label}</span>
      <i><b style={{ width: `${value}%` }} /></i>
      <em>{value}%</em>
    </div>
  );
}

function LeadershipOverviewChart({
  selfCreativeRate,
  peerCreativeRate,
  averageAlignment,
  peerRespondentCount,
}: {
  selfCreativeRate: number;
  peerCreativeRate: number;
  averageAlignment: number;
  peerRespondentCount: number;
}) {
  return (
    <div className="leadership-overview-chart">
      <div className="leadership-overview-lines">
        <GradientMarkerLine
          label="Tự đánh giá"
          helper="Bạn nhìn nhận bản thân"
          value={selfCreativeRate}
          tone="self"
        />
        <GradientMarkerLine
          label="Người khác đánh giá"
          helper={`Góc nhìn từ ${peerRespondentCount || 0} người khác`}
          value={peerCreativeRate}
          tone="peer"
        />
      </div>
      <div className="alignment-donut-card">
        <div className="alignment-donut" style={{ background: `conic-gradient(var(--green) ${averageAlignment * 3.6}deg, #e5ece9 0deg)` }}>
          <span>{averageAlignment}%</span>
        </div>
        <b>Mức độ tương đồng tổng thể</b>
      </div>
    </div>
  );
}

function GradientMarkerLine({
  label,
  helper,
  value,
  tone,
}: {
  label: string;
  helper: string;
  value: number;
  tone: "self" | "peer";
}) {
  const reactiveValue = Math.max(0, 100 - value);
  return (
    <article className="gradient-marker-line">
      <div>
        <b>{label}</b>
        <span>{helper}</span>
      </div>
      <div className="marker-scale-wrap">
        <div className="scale-labels" aria-hidden="true">
          <span>Phản ứng <b>{reactiveValue}%</b></span>
          <span>Sáng tạo <b>{value}%</b></span>
        </div>
        <div className="marker-scale" aria-label={`${label}: ${value}% sáng tạo`}>
          <i style={{ left: `calc(${value}% - 7px)` }} className={tone} />
        </div>
      </div>
    </article>
  );
}
function DimensionSpectrumCard({ dimension }: { dimension: LeadershipReport["dimensions"][number] }) {
  const peerReactiveRate = Math.max(0, 100 - dimension.peerCreativeRate);
  const DimensionIcon = dimensionIcon(dimension.id);

  return (
    <article className="dimension-spectrum-card">
      <header className="dimension-spectrum-head">
        <span className={`dimension-icon ${dimension.id}`}>
          <DimensionIcon />
        </span>
        <div>
          <h4>{dimensionReportLabel(dimension.id)}</h4>
          <p>{dimensionCaption(dimension.id)}</p>
        </div>
      </header>
      <div className="dimension-spectrum-body">
        <div className="dimension-spectrum-lines">
          <SpectrumLine label="Tự đánh giá" reactive={100 - dimension.selfCreativeRate} creative={dimension.selfCreativeRate} />
          <SpectrumLine label="Người khác đánh giá" reactive={peerReactiveRate} creative={dimension.peerCreativeRate} />
        </div>
        <div className="dimension-alignment-donut">
          <div className="alignment-donut small" style={{ background: `conic-gradient(var(--green) ${dimension.alignmentRate * 3.6}deg, #e5ece9 0deg)` }}>
            <span>{dimension.alignmentRate}%</span>
          </div>
          <b>Mức độ tương đồng</b>
        </div>
      </div>
    </article>
  );
}
function SpectrumLine({ label, reactive, creative }: { label: string; reactive: number; creative: number }) {
  return (
    <div className="spectrum-line">
      <span>{label}</span>
      <div className="scale-labels compact" aria-hidden="true">
        <span>Phản ứng</span>
        <span>Sáng tạo</span>
      </div>
      <div className="spectrum-track" aria-label={`${label}: ${reactive}% phản ứng, ${creative}% sáng tạo`}>
        <i className="transfer-marker" style={{ left: `calc(${creative}% - 7px)` }} />
      </div>
      <em>
        <b>{reactive}%</b>
        <b>{creative}%</b>
      </em>
    </div>
  );
}
const reportScenarioLabels = [
  "Nhận phản hồi tiêu cực hoặc phê bình từ sếp (nhưng không đúng)",
  "Bị một đồng nghiệp phản bác công khai trước mọi người",
  "Gặp sự cố ngoài dự kiến trong lúc trình bày với khách hàng/đối tác",
  "Được khen ngợi về năng lực/thành tích trước đông người",
  "Kết quả công việc không đạt như kỳ vọng hoặc mục tiêu đã đặt ra",
  "Được giao một nhiệm vụ/dự án mới chưa từng làm hoặc đòi hỏi năng lực/kỹ năng mới",
  "Bị so sánh với người tiền nhiệm",
  "Làm việc trong giai đoạn có áp lực rất cao và nhiều thay đổi bất ngờ",
  "Ra quyết định quan trọng trong bối cảnh thiếu thời gian và thông tin",
  "Đồng nghiệp giỏi hơn, được ghi nhận nhiều hơn",
  "Khi có góc nhìn rất khác với cấp trên và đồng nghiệp trong một buổi họp",
  "Khi biết một vài thành viên trong team không đồng tình với quyết định của mình nhưng không nói",
  "Khi được yêu cầu đưa nhận xét về một đồng nghiệp khác không có ở đó",
  "Khi một thành viên trong team đang có vấn đề gây ảnh hưởng đến tập thể",
  "Khi làm việc với một đồng nghiệp/nhân viên có phong cách rất khác mình, thậm chí hay phản đối mình",
  "Khi có một người sếp mới là người trẻ và ít kinh nghiệm hơn",
  "Khi trong team có một số thành viên thể hiện năng lực rất tốt và có tiềm năng phát triển vượt trội",
  "Khi cấp trên/khách hàng/đối tác không lắng nghe hoặc hiểu quan điểm của mình về một vấn đề quan trọng",
  "Khi làm việc với một khách hàng/đối tác rất khó tính, đòi hỏi cao và hay gây áp lực",
  "Khi phụ trách dự án có nhiều bộ phận tham gia và tồn tại xung đột lợi ích & quan điểm giữa các bên",
  "Khi thiết lập mục tiêu cho team trong bối cảnh có áp lực phải đạt kết quả cao từ cấp trên",
  "Khi có một cơ hội quan trọng mà mình và nhiều đồng nghiệp cùng quan tâm",
  "Khi lựa chọn thành viên cho một dự án quan trọng mà mình phụ trách",
  "Khi phải phân bổ nguồn lực hạn chế cho nhiều ưu tiên khác nhau",
  "Khi dự án đang phụ trách xuất hiện rủi ro hoặc vấn đề ngoài dự kiến",
  "Khi xảy ra mâu thuẫn lợi ích giữa team mình với phòng ban khác, khách hàng/đối tác hoặc lợi ích chung",
  "Khi team có dấu hiệu giảm động lực trong quá trình thực hiện mục tiêu",
  "Khi không đồng tình với một quyết định của cấp trên nhưng vẫn cần thực hiện và chịu trách nhiệm",
  "Khi cần báo cáo với cấp trên về kết quả công việc của team trong khi kết quả chưa đạt như mong đợi",
  "Khi một quyết định của mình dẫn đến thất bại hoặc kết quả không như kỳ vọng",
];

function compactScenarioText(value: string, order?: number) {
  if (order && reportScenarioLabels[order - 1]) return reportScenarioLabels[order - 1];
  return value
    .replace(/^Khi\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function DimensionChartRow({ dimension }: { dimension: LeadershipReport["dimensions"][number] }) {
  const bars = [
    { label: "Self", value: dimension.selfCreativeRate, className: "self" },
    { label: "Peer", value: dimension.peerCreativeRate, className: "peer" },
    { label: "Alignment", value: dimension.alignmentRate, className: "alignment" },
  ];

  return (
    <div className="dimension-chart-row">
      <b>{dimension.title}</b>
      <div>
        {bars.map((bar) => (
          <label key={bar.label}>
            <span>{bar.label}</span>
            <i>
              <em className={bar.className} style={{ width: `${bar.value}%` }} />
            </i>
            <strong>{bar.value}%</strong>
          </label>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ tone }: { tone: LeadershipReport["scenarios"][number]["tone"] }) {
  const labels = {
    strength: "Phát huy",
    practice: "Luyện tập",
    blindspot: "Khác biệt",
    mixed: "Theo dõi",
  };
  return <span className={`report-pill ${tone}`}>{labels[tone]}</span>;
}

function scenarioChoiceLabel(value: "reactive" | "creative" | "") {
  if (value === "creative") return "Sáng tạo";
  if (value === "reactive") return "Phản ứng";
  return "Chưa có";
}

function scenarioMeaningText(value: "reactive" | "creative") {
  if (value === "creative") {
    return "Có xu hướng chậm lại, nhìn rộng hơn, lắng nghe thêm và chọn phản hồi có lợi cho mục tiêu chung.";
  }

  return "Có xu hướng phản hồi nhanh theo cảm xúc, bảo vệ bản thân hoặc cố giữ hình ảnh quen thuộc trong tình huống áp lực.";
}

function scenarioReadNote(item: LeadershipReport["scenarios"][number]) {
  if (!item.peerTotal) return "Chưa có đủ dữ liệu từ người khác để đối chiếu tình huống này.";
  const selfLabel = scenarioChoiceLabel(item.selfAnswer).toLowerCase();
  if (item.alignmentRate >= 80) return `Bạn và đa số người đánh giá đang nhìn khá giống nhau về xu hướng ${selfLabel} trong tình huống này.`;
  if (item.alignmentRate < 40) return "Góc nhìn của bạn và người khác đang khác nhau rõ. Đây là tình huống nên đọc chậm và quan sát thêm.";
  return "Có một phần tương đồng, nhưng vẫn còn khác biệt đáng chú ý giữa tự đánh giá và góc nhìn từ người khác.";
}

function dimensionLabel(value: string) {
  if (value === "being") return "Hiện diện";
  if (value === "relating") return "Kết nối";
  return "Mục tiêu";
}

function dimensionReportLabel(value: string) {
  if (value === "being") return "Tôi hiện diện thế nào";
  if (value === "relating") return "Tôi kết nối ra sao";
  return "Tôi đạt mục tiêu bằng cách nào";
}

function dimensionCaption(value: string) {
  if (value === "being") return "Cách bạn thể hiện bản thân trong các tình huống";
  if (value === "relating") return "Cách bạn xây dựng và duy trì mối quan hệ";
  return "Cách bạn đưa ra quyết định và thực thi để đạt kết quả";
}

function dimensionIcon(value: string) {
  if (value === "relating") return Handshake;
  if (value === "achieving") return Target;
  return UserRoundSearch;
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "L") + (parts[parts.length - 1]?.[0] || "");
}

function choiceLabel(value: "reactive" | "creative" | "") {
  if (value === "creative") return "Sáng tạo";
  if (value === "reactive") return "Phản ứng";
  return "-";
}

function WorkshopAnalytics({
  selected,
  selectedId,
  workshops,
  cohortId,
  onSelect,
}: {
  selected: InstructorWorkshop;
  selectedId: string;
  workshops: InstructorWorkshop[];
  cohortId: string;
  onSelect: (workshopId: string) => void;
}) {
  const isTotal = selectedId === "WSTOTAL";
  const [linkCopied, setLinkCopied] = useState(false);

  async function copyGeneralEvaluationLink() {
    if (!cohortId) return;
    const url = new URL("https://lanhdaokhaitam.vercel.app/workshop-evaluation");
    url.searchParams.set("cohortId", cohortId);

    try {
      await navigator.clipboard.writeText(url.toString());
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      window.prompt("Copy link đánh giá general:", url.toString());
    }
  }

  return (
    <>
      <PageHeading eyebrow="WORKSHOP ANALYTICS" title="Theo dõi đánh giá Workshop" copy="Có dashboard tổng quan cho tất cả workshop và list phản hồi theo từng workshop." />
      <div className="workshop-link-toolbar">
        <div>
          <b>Link đánh giá general</b>
          <span>Tự nhận workshop đang mở · Cohort {cohortId || "chưa chọn"}</span>
        </div>
        <button type="button" onClick={copyGeneralEvaluationLink} disabled={!cohortId}>
          {linkCopied ? <Check /> : <Copy />}
          {linkCopied ? "Đã copy link" : "Copy link workshop đang mở"}
        </button>
      </div>
      <div className="workshop-tabs">
        <button className={isTotal ? "active" : ""} onClick={() => onSelect("WSTOTAL")}>
          WSTOTAL<span>Tổng quan</span>
        </button>
        {workshops.map((workshop) => (
          <button className={!isTotal && selected.id === workshop.id ? "active" : ""} key={workshop.id} onClick={() => onSelect(workshop.id)}>
            {workshop.id}<span>{workshop.date || workshop.status}</span>
          </button>
        ))}
      </div>
      {isTotal ? (
        <WorkshopQualityDashboard workshops={workshops} selectedId={selectedId} onSelect={onSelect} />
      ) : (
      <>
      <section className="kpi-grid">
        <Kpi title="Workshop" value={selected.id} detail={selected.title} tone="green" icon={BookOpenCheck} />
        <Kpi title="Tham gia workshop" value={`${selected.attendanceRate}%`} detail={`${selected.participantCount} học viên tham gia`} tone="blue" icon={UsersRound} />
        <Kpi title="Tham gia đánh giá" value={`${selected.evaluationParticipationRate || selected.completionRate}%`} detail={`${selected.responseCount} form đã gửi`} tone="purple" icon={BarChart3} />
        <Kpi title="Điểm trung bình" value={selected.score ? `${selected.score}/5` : "-"} detail="Từ các câu rating" tone="gold" icon={Sparkles} />
      </section>
      <section className="detail-grid">
        <div className="panel">
          <PanelTitle title="Chi tiết chỉ số workshop" subtitle={`${selected.title} · ${selected.description}`} />
          <div className="strength-grid">
            <article>
              <span>Mạnh nhất</span>
              <b>{selected.strongestDimension?.label || "Chưa có dữ liệu"}</b>
              <em>{selected.strongestDimension ? `${selected.strongestDimension.score}/5` : "-"}</em>
            </article>
            <article>
              <span>Yếu nhất</span>
              <b>{selected.weakestDimension?.label || "Chưa có dữ liệu"}</b>
              <em>{selected.weakestDimension ? `${selected.weakestDimension.score}/5` : "-"}</em>
            </article>
          </div>
          <WorkshopCommonMetricsChart dimensionScores={selected.dimensionScores} />
        </div>
        <div className="panel">
          <PanelTitle title="Danh sách phản hồi" subtitle="Hiển thị tất cả nội dung text của workshop đang chọn" />
          <div className="quote-list">
            {selected.comments.length ? selected.comments.map((comment, index) => <blockquote key={`${comment}-${index}`}>{comment}</blockquote>) : <EmptyState text="Chưa có phản hồi văn bản." />}
          </div>
        </div>
      </section>
      </>
      )}
    </>
  );
}

const WORKSHOP_COMMON_DIMENSIONS = ["Rõ ràng", "Liên quan", "Facilitator", "An toàn chia sẻ", "Objective Achievement"];

function WorkshopCommonMetricsChart({ dimensionScores }: { dimensionScores: { label: string; score: number }[] }) {
  return (
    <div className="workshop-common-chart">
      <header>
        <b>Điểm theo tiêu chí chung</b>
        <span>4 tiêu chí chung + Objective Achievement · Thang điểm 5</span>
      </header>
      <div className="dimension-list">
        {WORKSHOP_COMMON_DIMENSIONS.map((label) => {
          const score = dimensionScores.find((item) => item.label === label)?.score || 0;
          return (
            <div key={label}>
              <span>{label}</span>
              <Progress value={(score / 5) * 100} />
              <b>{score ? `${score}/5` : "-"}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkshopQualityDashboard({
  workshops,
  selectedId,
  onSelect,
}: {
  workshops: InstructorWorkshop[];
  selectedId: string;
  onSelect: (workshopId: string) => void;
}) {
  const completedWorkshops = workshops.filter((workshop) => workshop.status !== "locked" || workshop.participantCount > 0);
  const scoredWorkshops = workshops.filter((workshop) => workshop.score > 0);
  const openedWorkshopsForTotals = workshops.filter((workshop) => workshop.openedForTotals);
  const averageAttendance = openedWorkshopsForTotals.length
    ? Math.round(openedWorkshopsForTotals.reduce((sum, workshop) => sum + workshop.attendanceRate, 0) / openedWorkshopsForTotals.length)
    : 0;
  const averageEvaluation = openedWorkshopsForTotals.length
    ? Math.round(
        openedWorkshopsForTotals.reduce(
          (sum, workshop) => sum + (workshop.evaluationParticipationRate || workshop.completionRate),
          0,
        ) / openedWorkshopsForTotals.length,
      )
    : 0;
  const averageScore = scoredWorkshops.length
    ? Math.round((scoredWorkshops.reduce((sum, workshop) => sum + workshop.score, 0) / scoredWorkshops.length) * 10) / 10
    : 0;
  const allDimensions = scoredWorkshops.flatMap((workshop) => workshop.dimensionScores.map((item) => ({ ...item, workshopId: workshop.id })));
  const strongest = [...allDimensions].sort((a, b) => b.score - a.score)[0];
  const weakest = [...allDimensions].sort((a, b) => a.score - b.score)[0];
  const dimensionLabels = ["Rõ ràng", "Liên quan", "Facilitator", "An toàn chia sẻ", "Objective Achievement"];
  const radarValues = dimensionLabels.map((label) => {
    const values = scoredWorkshops
      .map((workshop) => workshop.dimensionScores.find((item) => item.label === label)?.score || 0)
      .filter(Boolean);
    return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0;
  });
  const rankedWorkshops = [...scoredWorkshops].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <section className="panel workshop-quality-dashboard">
      <PanelTitle title="Dashboard đánh giá toàn bộ workshop" subtitle="Tổng hợp 4 tiêu chí chung và Objective Achievement của từng workshop." icon={BarChart3} />
      <div className="workshop-quality-kpis">
        <WorkshopKpiCard icon={CalendarCheck} title="Workshop đã thực hiện" value={`${completedWorkshops.length}/${workshops.length}`} />
        <WorkshopKpiCard icon={UsersRound} title="Tham gia workshop TB" value={`${averageAttendance}%`} />
        <WorkshopKpiCard icon={ClipboardCheck} title="Tham gia đánh giá TB" value={`${averageEvaluation}%`} />
        <WorkshopKpiCard icon={Sparkles} title="Điểm TB" value={averageScore ? `${averageScore}/5` : "-"} />
        <WorkshopKpiCard icon={ShieldCheck} title="Mạnh nhất" value={strongest ? `${strongest.label} · ${strongest.score}/5` : "-"} />
        <WorkshopKpiCard icon={AlertTriangle} title="Yếu nhất" value={weakest ? `${weakest.label} · ${weakest.score}/5` : "-"} tone="danger" />
      </div>
      <div className="workshop-card-grid">
        <button className={selectedId === "WSTOTAL" ? "active total" : "total"} onClick={() => onSelect("WSTOTAL")}>
          <span className="workshop-progress-ring" style={{ background: `conic-gradient(var(--green) ${completedWorkshops.length / Math.max(1, workshops.length) * 360}deg, #e5ece9 0deg)` }}>
            <i>{Math.round((completedWorkshops.length / Math.max(1, workshops.length)) * 100)}%</i>
          </span>
          <b>WSTOTAL</b>
          <em>{averageScore ? `${averageScore}/5` : "-"}</em>
          <small>Tổng quan toàn bộ workshop</small>
        </button>
        {workshops.map((workshop) => (
          <button className={selectedId === workshop.id ? "active" : ""} key={workshop.id} onClick={() => onSelect(workshop.id)}>
            <span className="workshop-progress-ring" style={{ background: `conic-gradient(var(--green) ${workshop.attendanceRate * 3.6}deg, #e5ece9 0deg)` }}>
              <i>{workshop.attendanceRate}%</i>
            </span>
            <b>{workshop.description || workshop.title}</b>
            <em>{workshop.score ? `${workshop.score}/5` : "-"}</em>
            <small>{workshop.evaluationParticipationRate || workshop.completionRate}% đánh giá</small>
          </button>
        ))}
      </div>
      <div className="workshop-visual-grid">
        <article>
          <header>
            <b>So sánh tham gia workshop</b>
            <span>Tỷ lệ tham gia</span>
          </header>
          <WorkshopHorizontalBars workshops={workshops} getValue={(workshop) => workshop.attendanceRate} />
        </article>
        <article>
          <header>
            <b>So sánh tham gia đánh giá</b>
            <span>Tỷ lệ đánh giá</span>
          </header>
          <WorkshopHorizontalBars workshops={workshops} getValue={(workshop) => workshop.evaluationParticipationRate || workshop.completionRate} />
        </article>
        <article className="workshop-line-panel">
          <header>
            <b>Điểm trung bình theo workshop</b>
            <span>Xu hướng chất lượng qua từng buổi</span>
          </header>
          <WorkshopScoreLine workshops={workshops} />
        </article>
        <article>
          <header>
            <b>Phân bố điểm</b>
            <span>Tất cả lượt chấm 5 tiêu chí</span>
          </header>
          <WorkshopScoreDistribution workshops={workshops} />
        </article>
        <article className="workshop-radar-panel">
          <header>
            <b>Điểm trung bình theo tiêu chí</b>
            <span>4 tiêu chí chung + Objective Achievement toàn cohort</span>
          </header>
          <WorkshopRadar labels={dimensionLabels} values={radarValues} />
        </article>
        <article className="workshop-ranking-panel">
          <header>
            <b>Workshop xếp hạng theo điểm TB</b>
            <span>Chỉ tính workshop đã có điểm</span>
          </header>
          <div>
            {rankedWorkshops.length ? rankedWorkshops.map((workshop, index) => (
              <button key={workshop.id} onClick={() => onSelect(workshop.id)}>
                <span>{index + 1}</span>
                <b>{workshop.id} · {workshop.description || workshop.title}</b>
                <em>{workshop.score}/5</em>
              </button>
            )) : <EmptyState text="Chưa có điểm đánh giá workshop." />}
          </div>
        </article>
      </div>
    </section>
  );
}

function WorkshopHorizontalBars({ workshops, getValue }: { workshops: InstructorWorkshop[]; getValue: (workshop: InstructorWorkshop) => number }) {
  return (
    <div className="workshop-horizontal-bars">
      {workshops.map((workshop) => {
        const value = Math.max(0, Math.min(100, Math.round(getValue(workshop) || 0)));
        return (
          <div key={workshop.id}>
            <b>{workshop.id}</b>
            <span><i style={{ width: `${value}%` }} /></span>
            <em>{value ? `${value}%` : "-"}</em>
          </div>
        );
      })}
    </div>
  );
}

function WorkshopKpiCard({ icon: Icon, title, value, tone = "default" }: { icon: typeof BarChart3; title: string; value: string; tone?: "default" | "danger" }) {
  return (
    <article className={`workshop-kpi-card ${tone}`}>
      <span><Icon /></span>
      <div>
        <small>{title}</small>
        <b>{value}</b>
      </div>
    </article>
  );
}

function WorkshopScoreDistribution({ workshops }: { workshops: InstructorWorkshop[] }) {
  const counts = [1, 2, 3, 4, 5].map((_, index) =>
    workshops.reduce((sum, workshop) => sum + (workshop.ratingDistribution?.[index] || 0), 0),
  );
  const total = counts.reduce((sum, count) => sum + count, 0);
  const buckets = [1, 2, 3, 4, 5].map((score, index) => {
    const count = counts[index];
    const percent = total ? Math.round((count / total) * 100) : 0;
    return { score, count, percent };
  });

  return (
    <div className="workshop-score-distribution">
      {buckets.map((bucket) => (
        <div key={bucket.score} title={`${bucket.count} lượt chấm`}>
          <span style={{ height: `${Math.max(3, bucket.percent)}%` }}>
            <b>{bucket.percent}%</b>
          </span>
          <em>{bucket.score} điểm</em>
        </div>
      ))}
    </div>
  );
}

function WorkshopScoreLine({ workshops }: { workshops: InstructorWorkshop[] }) {
  const scored = workshops.map((workshop) => ({ ...workshop, score: workshop.score || 0 }));
  const points = scored.length > 1
    ? scored.map((workshop, index) => {
        const x = (index / (scored.length - 1)) * 100;
        const y = 100 - (workshop.score / 5) * 100;
        return `${x},${Number.isFinite(y) ? y : 100}`;
      }).join(" ")
    : "0,100 100,100";

  return (
    <div className="workshop-line-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="workshopLineArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#178775" stopOpacity=".22" />
            <stop offset="1" stopColor="#178775" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${points} 100,100`} fill="url(#workshopLineArea)" />
        <polyline points={points} fill="none" stroke="#178775" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="workshop-line-labels">
        {scored.map((workshop) => <span key={workshop.id}>{workshop.id}</span>)}
      </div>
      <div className="workshop-line-values">
        {scored.map((workshop) => <b key={workshop.id}>{workshop.score ? workshop.score.toFixed(1) : "-"}</b>)}
      </div>
    </div>
  );
}

function WorkshopRadar({ labels, values }: { labels: string[]; values: number[] }) {
  const center = 50;
  const radius = 36;
  const points = values.map((value, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / values.length;
    const length = (Math.max(0, Math.min(5, value)) / 5) * radius;
    return `${center + Math.cos(angle) * length},${center + Math.sin(angle) * length}`;
  }).join(" ");
  const outer = labels.map((_label, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / labels.length;
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
  }).join(" ");

  return (
    <div className="workshop-radar">
      <svg viewBox="0 0 100 100">
        {[0.33, 0.66, 1].map((ratio) => {
          const ring = labels.map((_label, index) => {
            const angle = -Math.PI / 2 + (index * 2 * Math.PI) / labels.length;
            return `${center + Math.cos(angle) * radius * ratio},${center + Math.sin(angle) * radius * ratio}`;
          }).join(" ");
          return <polygon key={ratio} points={ring} fill="none" stroke="#dbe6e2" strokeWidth=".7" />;
        })}
        {labels.map((_label, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / labels.length;
          return <line key={index} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke="#dbe6e2" strokeWidth=".7" />;
        })}
        <polygon points={outer} fill="none" stroke="#dbe6e2" />
        <polygon points={points} fill="rgba(23,135,117,.2)" stroke="#178775" strokeWidth="1.6" />
        {values.map((value, index) => {
          const angle = -Math.PI / 2 + (index * 2 * Math.PI) / values.length;
          const length = (Math.max(0, Math.min(5, value)) / 5) * radius;
          return <circle key={index} cx={center + Math.cos(angle) * length} cy={center + Math.sin(angle) * length} r="2" fill="#178775" />;
        })}
      </svg>
      <div className="workshop-radar-labels">
        {labels.map((label, index) => <span key={label} className={`label-${index}`}>{label}<b>{values[index] ? values[index].toFixed(1) : "-"}</b></span>)}
      </div>
    </div>
  );
}

function ConnectionErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="connection-error-panel">
      <img src="/sen-pharma-logo.svg" alt="SEN Pharma" />
      <h1>Chưa kết nối được dữ liệu</h1>
      <p>Dashboard chưa đồng bộ được dữ liệu mới nhất. Mình tạm dừng hiển thị dữ liệu mẫu để tránh hiểu nhầm.</p>
      <button className="primary-action" onClick={onRetry}><RefreshCw /> Thử lại</button>
    </section>
  );
}

function MiniChallengeView({ data }: { data: InstructorDashboardData }) {
  const twentyOneDayChallenge =
    data.challengeComparisons.find((item) => item.totalDays >= 21) ||
    data.challengeComparisons.find((item) => /21/.test(item.title));
  const funnelItems = twentyOneDayChallenge
    ? data.challengeFunnel.filter((item) => item.challengeId === twentyOneDayChallenge.id)
    : data.challengeFunnel;

  return (
    <>
      <PageHeading eyebrow="PRACTICE ANALYTICS" title="Mini Challenge Dashboard" copy={`Cohort ${data.cohortId} · Tổng quan hành trình thực hành`} />
      <section className="kpi-grid">
        <Kpi title="Duy trì thực hành" value={`${data.practiceRetentionRate}%`} detail="Ngày thực hành / tổng ngày thử thách" tone="green" icon={TrendingUp} trend={data.trends.practiceRetention} />
        <Kpi title="Hoàn thành trên 80%" value={`${data.practiceOver80Rate}%`} detail="Học viên thực hành >= 80%" tone="blue" icon={Gauge} trend={data.trends.miniOver80} />
        <Kpi title="Hoàn thành dưới 80%" value={`${data.practiceUnder80Rate}%`} detail="Học viên thực hành dưới 80%" tone="gold" icon={AlertTriangle} trend={data.trends.miniUnder80} invertTrend />
        <Kpi title="Tỷ lệ bỏ cuộc" value={twentyOneDayChallenge ? `${twentyOneDayChallenge.dropoutRate}%` : "-"} detail="Chỉ áp dụng cho 21-days challenge" tone="purple" icon={UserRoundSearch} trend={data.trends.miniDropout} invertTrend />
      </section>
      <section className="mini-dashboard-grid">
        <div className="panel mini-heatmap-panel">
          <PanelTitle title="Tiến độ theo ngày" subtitle="Xanh: duy trì tốt · Vàng: trung bình · Đỏ: thấp · Trắng: chưa diễn ra" icon={CalendarCheck} />
          <ChallengeHeatmap items={data.challengeComparisons} dailyStats={data.challengeDailyStats} />
        </div>
        <div className="panel mini-funnel-panel">
          <PanelTitle title="Phễu duy trì 21 ngày" subtitle={twentyOneDayChallenge?.title || "Chỉ hiện khi có 21-days challenge"} icon={TrendingUp} />
          <ChallengeFunnel items={funnelItems} />
        </div>
      </section>
      <div className="panel mini-card-panel">
        <PanelTitle title="Tổng quan Mini Challenge" subtitle="Sắp xếp theo tỷ lệ duy trì thực hành" icon={BarChart3} />
        <ChallengeCardGrid items={data.challengeComparisons} />
      </div>
      <section className="mini-dashboard-grid mini-bars-grid">
        <MiniMetricBars title="Tỷ lệ tham gia check-in" items={data.challengeComparisons} getValue={(item) => item.retentionRate} />
        <MiniMetricBars title="Tỷ lệ hoàn thành >=80%" items={data.challengeComparisons} getValue={(item) => item.over80Rate} />
      </section>
    </>
  );
}

function ChallengeComparisonChart({ items }: { items: ChallengeComparison[] }) {
  if (!items.length) return <EmptyState text="Chưa có dữ liệu mini challenge để so sánh." />;
  return (
    <div className="comparison-combo">
      {items.map((item) => (
        <article key={item.id}>
          <header>
            <div><b>{item.title}</b><span>{item.participantCount} học viên · {item.totalDays} ngày</span></div>
          </header>
          <div className="combo-bars">
            <span style={{ height: `${item.retentionRate}%` }}><b>{item.retentionRate}%</b><i>Duy trì</i></span>
            <span style={{ height: `${item.over80Rate}%` }}><b>{item.over80Rate}%</b><i>&gt;=80%</i></span>
            <span className="warning" style={{ height: `${item.dropoutRate}%` }}><b>{item.dropoutRate}%</b><i>Bỏ cuộc</i></span>
          </div>
        </article>
      ))}
    </div>
  );
}

function ChallengeHeatmap({ items, dailyStats }: { items: ChallengeComparison[]; dailyStats: InstructorDashboardData["challengeDailyStats"] }) {
  const [activeCell, setActiveCell] = useState<string | null>(null);
  if (!items.length) return <EmptyState text="Chưa có dữ liệu mini challenge." />;
  const maxDays = Math.max(...items.map((item) => item.totalDays), 1);
  const dayLabels = Array.from({ length: maxDays }, (_, index) => index + 1);
  return (
    <div className="challenge-heatmap">
      <div className="heatmap-header">
        <span />
        {dayLabels.map((day) => <b key={day}>{day}</b>)}
      </div>
      {items.map((challenge) => {
        const dailyByDay = new Map(dailyStats.filter((item) => item.challengeId === challenge.id).map((item) => [item.day, item]));
        return (
          <div className="heatmap-row" key={challenge.id}>
            <strong>{challenge.id}</strong>
            {dayLabels.map((day) => {
              const stat = dailyByDay.get(day);
              const status = day > challenge.totalDays ? "future" : stat?.status || "future";
              const label = status === "future" ? "Chưa diễn ra" : `${stat?.checkinRate ?? 0}% thực hành`;
              const tooltip = `${challenge.id} · Ngày ${day}: ${label}`;
              const cellKey = `${challenge.id}-${day}`;
              const edgeClass = day <= 3 ? " edge-left" : day > maxDays - 3 ? " edge-right" : "";
              return (
                <button
                  key={day}
                  type="button"
                  className={`heat-cell ${status}${edgeClass}`}
                  aria-label={tooltip}
                  aria-describedby={activeCell === cellKey ? `${cellKey}-tooltip` : undefined}
                  onMouseEnter={() => setActiveCell(cellKey)}
                  onMouseLeave={() => setActiveCell((current) => current === cellKey ? null : current)}
                  onFocus={() => setActiveCell(cellKey)}
                  onBlur={() => setActiveCell((current) => current === cellKey ? null : current)}
                  onClick={() => setActiveCell(cellKey)}
                >
                  {activeCell === cellKey ? <span className="heat-tooltip" id={`${cellKey}-tooltip`} role="tooltip">{tooltip}</span> : null}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ChallengeFunnel({ items }: { items: InstructorDashboardData["challengeFunnel"] }) {
  if (!items.length) return <EmptyState text="Chưa có dữ liệu phễu 21 ngày." />;
  const sorted = [...items].sort((a, b) => a.day - b.day);
  return (
    <div className="challenge-funnel">
      {sorted.map((item, index) => (
        <div className="funnel-step" key={`${item.challengeId}-${item.day}-${index}`} style={{ width: `${Math.max(34, item.retentionRate)}%` }}>
          <span>{item.milestone}</span>
          <b>{item.retentionRate}%</b>
        </div>
      ))}
      <p>Mục tiêu: duy trì ổn định đến ngày 21</p>
    </div>
  );
}

function ChallengeCardGrid({ items }: { items: ChallengeComparison[] }) {
  if (!items.length) return <EmptyState text="Chưa có dữ liệu mini challenge." />;
  return (
    <div className="mini-card-grid">
      {[...items].sort((a, b) => b.retentionRate - a.retentionRate).map((item) => {
        const status = item.retentionRate >= 70 ? "Tốt" : item.retentionRate >= 30 ? "Trung bình" : "Nguy cơ";
        return (
          <article className={`mini-summary-card ${item.retentionRate < 30 ? "danger" : ""}`} key={item.id}>
            <div className="mini-ring" style={{ background: `conic-gradient(var(--green) ${item.retentionRate * 3.6}deg, #e7eeeb 0deg)` }}>
              <span>{item.retentionRate}%</span>
            </div>
            <div>
              <b>{item.id}</b>
              <h3>{item.title}</h3>
              <p>{item.participantCount} học viên · {item.totalDays} ngày</p>
            </div>
            <em>{status}</em>
          </article>
        );
      })}
    </div>
  );
}

function MiniMetricBars({ title, items, getValue }: { title: string; items: ChallengeComparison[]; getValue: (item: ChallengeComparison) => number }) {
  return (
    <div className="panel mini-metric-bars">
      <PanelTitle title={title} subtitle="So sánh giữa các mini challenge" icon={BarChart3} />
      {items.length ? items.map((item) => {
        const value = getValue(item);
        return (
          <div className="mini-metric-row" key={item.id}>
            <b>{item.id}</b>
            <span><i style={{ width: `${value}%` }} /></span>
            <em>{value}%</em>
          </div>
        );
      }) : <EmptyState text="Chưa có dữ liệu." />}
    </div>
  );
}

function RiskView({ data, onOpenStudent }: { data: InstructorDashboardData; onOpenStudent: (student: InstructorStudent) => void }) {
  const groupedStudents = new Set(data.groups.flatMap((group) => group.members));
  const unassignedCount = Math.max(0, data.students.length - groupedStudents.size);
  const atRisk = data.students.filter(isAtRisk);
  const silent = data.students.filter((student) => !isRecentlyActive(student));
  const noPeerReview = data.students.filter((student) => student.peerReviewCount < 1);
  const inactiveGroups = data.groups.filter((group) => group.missingWeeks.length > 0);
  return (
    <>
      <PageHeading eyebrow="ALERT SYSTEM" title="Risk / Alert" copy="Những tín hiệu giảng viên nên xem đầu tiên: rớt nhịp, im lặng, chưa đánh giá, nhóm chưa họp." />
      <section className="kpi-grid">
        <Kpi title="At-risk students" value={atRisk.length.toString()} detail="Cần facilitator theo dõi" tone="gold" icon={AlertTriangle} />
        <Kpi title="Im lặng 72h" value={silent.length.toString()} detail="Không có hoạt động gần đây" tone="purple" icon={UserRoundSearch} />
        <Kpi title="Chưa nhận đánh giá" value={noPeerReview.length.toString()} detail="Chưa có lượt đánh giá từ người khác" tone="blue" icon={MessageSquareText} />
        <Kpi title="Nhóm cần nhắc" value={(inactiveGroups.length + unassignedCount).toString()} detail={`${unassignedCount} học viên chưa có nhóm`} tone="green" icon={UsersRound} />
      </section>
      <section className="detail-grid">
        <div className="panel">
          <PanelTitle title="Học viên cần can thiệp" subtitle="Không hiển thị insight cá nhân, chỉ hiện tín hiệu hành vi" icon={AlertTriangle} />
          <div className="risk-list">
            {atRisk.length ? atRisk.map((student) => (
              <button key={student.id} onClick={() => onOpenStudent(student)}>
                <Avatar name={student.name} />
                <div>
                  <b>{student.name}</b>
                  <span>{getRiskReasons(student).join(" · ")}</span>
                </div>
                <Status value={student.status} />
              </button>
            )) : <EmptyState text="Chưa có học viên cần can thiệp." />}
          </div>
        </div>
        <div className="panel">
          <PanelTitle title="Nhóm đồng hành cần nhắc" subtitle="Chỉ theo dõi nhóm đã họp hay chưa, không xem nội dung insight nhóm" icon={MessageSquareText} />
          <div className="group-grid alert-group-grid">
            {data.groups.length ? data.groups.map((group) => (
              <article className="group-card" key={group.id}>
                <header><div><span>NHÓM ĐỒNG HÀNH</span><h3>{group.name}</h3></div><b>{group.rate}%</b></header>
                <p>{group.members.join(" · ")}</p>
                <div className="group-stat"><span>Số tuần đã họp</span><b>{group.checkinWeeks}/3</b></div>
                <Progress value={group.rate} />
              </article>
            )) : <EmptyState text="Chưa có nhóm bạn đồng hành." />}
          </div>
        </div>
      </section>
    </>
  );
}

function MetricGuide() {
  return (
    <>
      <PageHeading eyebrow="METRIC GUIDE" title="Cách tính các thông số" copy="Các chỉ số hiện được tính trực tiếp từ dữ liệu chương trình, không cần thêm sheet tổng hợp." />
      <div className="panel metric-guide">
        <h3>Cohort Health Score</h3>
        <p>Điểm 0-100 gồm: Engagement 30%, Progress học viên 20%, Practice retention 20%, Self/Peer assessment 15%, Peer group activity 15%.</p>
        <h3>Engagement 72h</h3>
        <p>Tỷ lệ học viên có check-in, tham gia workshop, gửi đánh giá workshop hoặc tự đánh giá trong đúng 72 giờ gần nhất.</p>
        <h3>Progress</h3>
        <p>Trung bình tiến độ từng học viên. Công thức hiện tại: check-in 40 điểm, tham gia workshop 25 điểm, tự đánh giá 15 điểm, nhận đánh giá từ người khác 20 điểm. Không tính đánh giá workshop.</p>
        <h3>Vì sao không tính đánh giá workshop vào progress?</h3>
        <p>Đánh giá workshop là dữ liệu chất lượng buổi học để giảng viên cải tiến nội dung. Nếu đưa vào progress, học viên có thể bị xem là chậm chỉ vì admin chưa mở hoặc chưa yêu cầu form feedback của phiên đó.</p>
        <h3>Duy trì thực hành</h3>
        <p>Tổng số ngày học viên thực hành / tổng số ngày thử thách đang áp dụng. Ví dụ 8 học viên, challenge 10 ngày thì mẫu số là 80 ngày.</p>
        <h3>Hoàn thành trên/dưới 80%</h3>
        <p>Đếm số học viên có số ngày thực hành đạt hoặc chưa đạt 80% tổng ngày của mini challenge, rồi chia cho tổng học viên tham gia.</p>
        <h3>Tỷ lệ bỏ cuộc</h3>
        <p>Số học viên thực hiện thử thách tuần cuối dưới 2 ngày / tổng số học viên tham gia. Chỉ áp dụng rõ nhất với thử thách dài từ 7 ngày trở lên.</p>
        <h3>Workshop analytics</h3>
        <p>Mỗi workshop có tỷ lệ tham gia workshop, tỷ lệ gửi đánh giá, điểm trung bình và 5 chỉ số lấy theo cột Dimension trong `Evaluation_Questions`, gồm Objective Achievement. Tab Workshop Quality có thêm bảng tổng kết tất cả workshop để so sánh nhanh.</p>
        <h3>Risk / Alert</h3>
        <p>Gắn cờ khi học viên thiếu check-in, tham gia workshop hoặc tự đánh giá đang được admin mở trên Sheet. Đánh giá workshop là optional nên không ảnh hưởng At-risk.</p>
      </div>
    </>
  );
}

function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</div>;
}

function Kpi({
  title,
  value,
  detail,
  tone,
  icon: Icon,
  trend,
  invertTrend = false,
}: {
  title: string;
  value: string;
  detail: string;
  tone: string;
  icon: typeof UsersRound;
  trend?: number;
  invertTrend?: boolean;
}) {
  const roundedTrend = Math.round(trend || 0);
  const improving = invertTrend ? roundedTrend < 0 : roundedTrend > 0;
  const worsening = invertTrend ? roundedTrend > 0 : roundedTrend < 0;
  return (
    <article className={`kpi ${tone}`}>
      <span><Icon /></span>
      <div>
        <small>{title}</small>
        <div className="kpi-value-row">
          <strong>{value}</strong>
          {trend !== undefined ? (
            <em className={`kpi-trend ${improving ? "up" : worsening ? "down" : "flat"}`}>
              {roundedTrend > 0 ? <ArrowUp /> : roundedTrend < 0 ? <ArrowDown /> : null}
              {roundedTrend === 0 ? "—" : `${Math.abs(roundedTrend)}đ`}
            </em>
          ) : null}
        </div>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function ProgressPart({ title, value, total }: { title: string; value: number; total: number }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <article className="progress-part-card">
      <div className="mini-donut" style={{ background: `conic-gradient(var(--green) ${percent * 3.6}deg, #e5ece9 0deg)` }}>
        <span>{percent}%</span>
      </div>
      <b>{title}</b>
      <small>{Math.round(value)}/{Math.round(total)} điểm</small>
    </article>
  );
}

function PanelTitle({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon?: typeof TrendingUp }) {
  return <div className="panel-title"><div><h3>{title}</h3><p>{subtitle}</p></div>{Icon ? <Icon /> : null}</div>;
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return <span className={`avatar ${large ? "large" : ""}`}>{initials(name)}</span>;
}

function FinalQuizGrading({
  submissions,
  onGrade,
}: {
  submissions: FinalQuizSubmission[];
  onGrade: (attemptId: string, essayScore: number, feedback: string, publish: boolean) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<string, { essayScore: string; feedback: string }>>({});
  return (
    <section>
      <PageHeading eyebrow="FINAL QUIZ" title="Chấm kiểm tra cuối khóa" copy="Trắc nghiệm được chấm tự động; giảng viên chấm 3 câu tự luận tối đa 30 điểm rồi công bố kết quả." />
      <div className="detail-grid">
        {submissions.length ? submissions.map((submission) => {
          const draft = drafts[submission.attemptId] || { essayScore: String(submission.essayScore || ""), feedback: submission.feedback || "" };
          const essayScore = Math.max(0, Math.min(30, Number(draft.essayScore || 0)));
          return (
            <article className="panel" key={submission.attemptId}>
              <PanelTitle title={`${submission.fullName} · ${submission.userId}`} subtitle={`Trắc nghiệm ${submission.objectiveScore}/70 · ${submission.gradingStatus === "published" ? "Đã công bố" : "Chờ chấm"}`} />
              <details className="quiz-objective-review" open>
                <summary>10 câu trắc nghiệm · Xem câu trả lời của học viên</summary>
                <div className="quiz-objective-list">
                  {submission.objectives.map((item) => (
                    <div className={`quiz-objective-item ${item.isCorrect ? "correct" : "incorrect"}`} key={item.questionId}>
                      <header>
                        <b>Câu {item.order}</b>
                        <span>{item.isCorrect ? "Đúng" : "Chưa đúng"}</span>
                      </header>
                      <p className="quiz-objective-question">{item.question}</p>
                      <p><small>Học viên chọn</small>{item.answer || "Chưa có câu trả lời"}</p>
                      <p><small>Đáp án đúng</small>{item.answerKey || "Chưa thiết lập"}</p>
                    </div>
                  ))}
                </div>
              </details>
              {submission.essays.map((essay, index) => (
                <div className="open-feedback-group" key={essay.questionId}>
                  <header><b>Câu {index + 11}</b></header>
                  <p><strong>{essay.question}</strong></p>
                  <p>{essay.answer || "Chưa có câu trả lời"}</p>
                </div>
              ))}
              <label className="field-label">Điểm tự luận (0–30)</label>
              <input className="field" min="0" max="30" type="number" value={draft.essayScore} onChange={(event) => setDrafts((current) => ({ ...current, [submission.attemptId]: { ...draft, essayScore: event.target.value } }))} />
              <label className="field-label">Nhận xét gửi học viên</label>
              <textarea className="field" value={draft.feedback} onChange={(event) => setDrafts((current) => ({ ...current, [submission.attemptId]: { ...draft, feedback: event.target.value } }))} />
              <p><b>Tổng dự kiến: {submission.objectiveScore + essayScore}/100</b></p>
              <div className="form-actions">
                <button className="ghost-btn" onClick={() => onGrade(submission.attemptId, essayScore, draft.feedback, false)}>Lưu bản nháp</button>
                <button className="btn" onClick={() => onGrade(submission.attemptId, essayScore, draft.feedback, true)}>Công bố điểm</button>
              </div>
            </article>
          );
        }) : <div className="empty-state">Chưa có học viên nộp bài kiểm tra cuối khóa.</div>}
      </div>
    </section>
  );
}

function FinalSurveyResponses({ submissions }: { submissions: FinalSurveySubmission[] }) {
  const scoredIds = new Set(["FINALSURVEY-Q1", "FINALSURVEY-Q2", "FINALSURVEY-Q3", "FINALSURVEY-Q4", "FINALSURVEY-Q5", "FINALSURVEY-Q7"]);
  const scoredQuestions = Array.from(
    submissions.reduce((questions, submission) => {
      submission.answers.forEach((answer) => {
        if (scoredIds.has(answer.questionId) && !questions.has(answer.questionId)) questions.set(answer.questionId, answer);
      });
      return questions;
    }, new Map<string, FinalSurveySubmission["answers"][number]>()),
  )
    .map(([questionId, question]) => {
      const values = submissions
        .map((submission) => Number(submission.answers.find((answer) => answer.questionId === questionId)?.answer))
        .filter((value) => Number.isFinite(value) && value > 0);
      const max = questionId === "FINALSURVEY-Q7" ? 10 : 5;
      return {
        ...question,
        max,
        average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0,
        distribution: Array.from({ length: max }, (_, index) => ({
          score: index + 1,
          count: values.filter((value) => value === index + 1).length,
        })),
      };
    })
    .sort((a, b) => a.order - b.order);
  const fivePointQuestions = scoredQuestions.filter((question) => question.max === 5);
  const overallAverage = fivePointQuestions.length
    ? fivePointQuestions.reduce((sum, question) => sum + question.average, 0) / fivePointQuestions.length
    : 0;
  const recommendationValues = submissions
    .map((submission) => Number(submission.answers.find((answer) => answer.questionId === "FINALSURVEY-Q7")?.answer))
    .filter((value) => Number.isFinite(value) && value > 0);
  const promoters = recommendationValues.filter((value) => value >= 9).length;
  const detractors = recommendationValues.filter((value) => value <= 6).length;
  const nps = recommendationValues.length
    ? Math.round(((promoters - detractors) / recommendationValues.length) * 100)
    : 0;
  const openFeedback = [
    { questionId: "FINALSURVEY-Q6", number: "6" },
    { questionId: "FINALSURVEY-Q8", number: "8" },
  ].map(({ questionId, number }) => ({
    questionId,
    number,
    question: submissions.flatMap((submission) => submission.answers).find((answer) => answer.questionId === questionId)?.question || "",
    answers: submissions
      .map((submission) => submission.answers.find((answer) => answer.questionId === questionId)?.answer.trim() || "")
      .filter(Boolean),
  }));
  const consentOptions = [
    { option: "A", label: "Hiển thị đầy đủ: Họ tên, Chức vụ, Tên công ty, Hình ảnh cá nhân" },
    { option: "B", label: "Hiển thị Họ tên, Chức vụ; không hiển thị Tên công ty và Hình ảnh" },
    { option: "C", label: "Hiển thị tên viết tắt, Chức vụ" },
  ];
  const consentGroups = consentOptions.map(({ option, label }) => ({
    option,
    label,
    names: submissions.flatMap((submission) => {
      const selected = submission.answers.find((answer) => answer.questionId === "FINALSURVEY-Q9")?.answer.trim().toUpperCase() || "";
      const name = submission.answers.find((answer) => answer.questionId === "FINALSURVEY-Q10")?.answer.trim() || "";
      return selected.startsWith(`${option}:`) && name ? [name] : [];
    }),
  }));
  return (
    <section>
      <PageHeading
        eyebrow="FINAL SURVEY"
        title="Dashboard đánh giá cuối khóa"
        copy="Số liệu được tổng hợp theo cohort; không hiển thị câu trả lời của từng học viên."
      />
      {submissions.length ? <>
        <div className="survey-summary">
          <article><span>Lượt phản hồi</span><b>{submissions.length}</b><small>Final Survey đã gửi</small></article>
          <article><span>Trải nghiệm & tác động</span><b>{overallAverage.toFixed(1)}/5</b><small>Trung bình câu 1–5</small></article>
          <article><span>Sẵn lòng giới thiệu</span><b>NPS = {nps}%</b><small>{promoters}/{recommendationValues.length} Promoters · {detractors} Detractors</small></article>
        </div>
        <div className="survey-score-grid">
          {scoredQuestions.map((question) => (
            <article className="panel survey-score-card" key={question.questionId}>
              <header><span>CÂU {question.questionId === "FINALSURVEY-Q7" ? "7" : question.order}</span><b>{question.average.toFixed(1)}/{question.max}</b></header>
              <h3>{question.question}</h3>
              <div>
                {question.distribution.map((item) => (
                  <div className="survey-score-row" key={item.score}>
                    <span>{item.score}</span>
                    <i><em style={{ width: `${submissions.length ? (item.count / submissions.length) * 100 : 0}%` }} /></i>
                    <b>{item.count}</b>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="survey-open-grid">
          {openFeedback.map((group) => (
            <article className="panel survey-open-card" key={group.questionId}>
              <PanelTitle title={`Câu ${group.number}`} subtitle={`${group.answers.length} phản hồi ẩn danh`} icon={MessageSquareText} />
              <h3>{group.question}</h3>
              <div>
                {group.answers.length
                  ? group.answers.map((answer, index) => <blockquote key={`${group.questionId}-${index}`}><p>{answer}</p></blockquote>)
                  : <small>Chưa có phản hồi.</small>}
              </div>
            </article>
          ))}
        </div>
        <article className="panel survey-consent-panel">
          <PanelTitle title="Đồng ý sử dụng chia sẻ" subtitle="Câu 9 · Chỉ hiển thị tên của người chọn A, B hoặc C" icon={ShieldCheck} />
          <div className="survey-consent-grid">
            {consentGroups.map((group) => (
              <section key={group.option}>
                <header><div><b>Phương án {group.option}</b><p>{group.label}</p></div><span>{group.names.length} người</span></header>
                <div>{group.names.length ? group.names.map((name) => <span key={`${group.option}-${name}`}>{name}</span>) : <small>Chưa có người chọn</small>}</div>
              </section>
            ))}
          </div>
        </article>
      </> : <div className="empty-state">Chưa có phản hồi Final Survey cho cohort này.</div>}
    </section>
  );
}

function Status({ value }: { value: InstructorStudent["status"] }) {
  const className = value === "Tốt" ? "status-good" : value === "Cần chú ý" ? "status-warning" : "status-idle";
  return <span className={`status ${className}`}>{value}</span>;
}

function Progress({ value }: { value: number }) {
  return <span className="progress"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="empty-state">{text}</p>;
}

function Legend({ label, value, tone }: { label: string; value: number | string; tone: "green" | "gold" | "gray" }) {
  return <div className="legend-row"><span><i className={`${tone}-dot`} /> {label}</span><b>{value}</b></div>;
}

function LineChart({ values }: { values: number[] }) {
  const safeValues = values.length ? values : [0, 0, 0, 0];
  const points = safeValues.map((value, index) => `${index * (100 / (safeValues.length - 1))},${100 - value}`).join(" ");
  return <div className="line-chart"><div className="chart-grid" /><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#178775" stopOpacity=".24" /><stop offset="1" stopColor="#178775" stopOpacity="0" /></linearGradient></defs><polygon points={`0,100 ${points} 100,100`} fill="url(#area)" /><polyline points={points} fill="none" stroke="#178775" strokeWidth="2.2" vectorEffect="non-scaling-stroke" /></svg></div>;
}

function Donut({ value, label }: { value: number; label: string }) {
  return <div className="donut" style={{ background: `conic-gradient(#178775 ${value * 3.6}deg, #e8eeeb 0)` }}><div><strong>{value}%</strong><span>{label}</span></div></div>;
}

function StatusDonut({ counts, total }: { counts: { good: number; attention: number; notStarted: number }; total: number }) {
  const goodDegrees = total ? (counts.good / total) * 360 : 0;
  const attentionDegrees = total ? (counts.attention / total) * 360 : 0;
  return (
    <div
      className="donut"
      style={{
        background: `conic-gradient(#178775 0 ${goodDegrees}deg, var(--gold) ${goodDegrees}deg ${goodDegrees + attentionDegrees}deg, #aeb8b4 ${goodDegrees + attentionDegrees}deg 360deg)`,
      }}
    >
      <div><strong>{total}</strong><span>học viên</span></div>
    </div>
  );
}

function formatStatusShare(count: number, total: number) {
  const percent = total ? Math.round((count / total) * 100) : 0;
  return `${percent}% · ${count}/${total}`;
}

function formatRiskPercent(count: number, total: number) {
  return `${total ? Math.round((count / total) * 100) : 0}%`;
}

function buildEngagementSeries(students: InstructorStudent[]) {
  const averageProgress = roundAverage(students.map((student) => student.progress));
  return [Math.max(0, averageProgress - 18), Math.max(0, averageProgress - 12), Math.max(0, averageProgress - 8), averageProgress, Math.min(100, averageProgress + 4), Math.min(100, averageProgress + 8)];
}

function getCohortHealthScore(data: InstructorDashboardData) {
  const engagement = getEngagementRate(data.students);
  const peerActivity = roundAverage(data.groups.map((group) => group.rate));
  const activeValues = [
    ...(data.activeMetrics.engagement ? [engagement] : []),
    ...(data.activeMetrics.progress ? [data.averageProgress] : []),
    ...(data.activeMetrics.practice ? [data.practiceRetentionRate] : []),
    ...(data.activeMetrics.assessment ? [data.evaluationCompletionRate] : []),
    ...(data.activeMetrics.peerGroup ? [peerActivity] : []),
  ];
  return roundAverage(activeValues);
}

function getEngagementRate(students: InstructorStudent[]) {
  if (!students.length) return 0;
  return Math.round((students.filter(isRecentlyActive).length / students.length) * 100);
}

function getCurrentWorkshop(data: InstructorDashboardData) {
  return data.workshops.find((workshop) => workshop.status === "now") || data.workshops.find((workshop) => workshop.order > 0) || data.workshops[0];
}

function isRecentlyActive(student: InstructorStudent) {
  if (student.lastActivityAt) {
    const lastActivityAt = new Date(student.lastActivityAt);
    const elapsed = Date.now() - lastActivityAt.getTime();
    return Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= 72 * 60 * 60 * 1000;
  }
  if (student.lastCheckin.startsWith("Hôm nay") || student.lastCheckin === "Hôm qua") return true;
  const match = student.lastCheckin.match(/^(\d+) ngày trước/);
  return match ? Number(match[1]) <= 3 : false;
}

function getRiskReasons(student: InstructorStudent) {
  return student.atRiskReasons?.length ? student.atRiskReasons : ["cần theo dõi"];
}

function isAtRisk(student: InstructorStudent) {
  return Boolean(student.atRiskReasons?.length);
}

function roundAverage(values: number[]) {
  return values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(-2).map((part) => part[0]).join("").toUpperCase() || "HV";
}
