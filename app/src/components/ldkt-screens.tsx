import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flag,
  Flame,
  Frown,
  Heart,
  Laugh,
  Library,
  Link,
  Meh,
  Pause,
  Pin,
  Play,
  RotateCcw,
  ScrollText,
  Send,
  Smile,
  Star,
  Target,
  Trophy,
  UserRound,
  UsersRound,
  Volume2,
  VolumeX,
  Wind,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Kpi,
  ListRow,
  MountainPath,
  PageTitle,
  ProgressBar,
  StudentHello,
  TodayItem,
} from "@/components/ldkt-ui";
import { challengeDays as fallbackChallengeDays, student as fallbackStudent, workshops as fallbackWorkshops } from "@/data/mock";
import { workshopStatusLabel } from "@/lib/status";
import type {
  Challenge,
  Checkin,
  CheckinRecord,
  CoachingRequest,
  CoachingSlot,
  EvaluationQuestion,
  EvaluationRecord,
  EvaluationAnswerRecord,
  EvaluationTemplate,
  FinalQuizResult,
  GroupCheckinRecord,
  LeaderboardUser,
  PeerGroupMember,
  PeerGroupOption,
  PracticeExercise,
  Screen,
  Student,
  Workshop,
} from "@/types/ldkt";

export type NotificationTask = {
  id: string;
  title: string;
  note: string;
  done: boolean;
  waiting?: boolean;
  onClick: () => void;
};

export function LoginScreen({
  identifier,
  studentCode,
  error,
  loading,
  onChange,
  onStudentCodeChange,
  onSubmit,
}: {
  identifier: string;
  studentCode: string;
  error: string;
  loading: boolean;
  onChange: (value: string) => void;
  onStudentCodeChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="login-screen">
      <div className="login-brand">
        <span>Lãnh Đạo Khai Tâm</span>
        <h1>Learning Journey Platform</h1>
      </div>
      <div className="card login-card">
        <span className="tag">Đăng nhập</span>
        <h2>Vào hành trình học tập</h2>
        <p className="muted">Nhập email hoặc số điện thoại, sau đó nhập mã học viên để xác nhận.</p>
        <input
          className="field login-field"
          placeholder="Email hoặc số điện thoại"
          value={identifier}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className="field login-field"
          placeholder="Mã học viên, ví dụ LDKT018"
          value={studentCode}
          onChange={(event) => onStudentCodeChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit();
          }}
        />
        {error ? <div className="login-error">{error}</div> : null}
        <button className="btn" disabled={loading || !identifier.trim() || !studentCode.trim()} onClick={onSubmit}>
          <ChevronRight aria-hidden="true" />
          {loading ? "Đang kiểm tra..." : "Đăng nhập"}
        </button>
        {false ? <button className="btn ghost registration-link" style={{ display: "none" }}>
          Đăng ký học viên mới
        </button> : null}
      </div>
    </section>
  );
}

export type RegistrationAnswers = {
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

type RegistrationQuestion = {
  id: keyof RegistrationAnswers;
  title: string;
  note: string;
  placeholder?: string;
  type?: "text" | "number" | "textarea" | "choice";
  options?: string[];
  required?: boolean;
};

const registrationInitialAnswers: RegistrationAnswers = {
  fullName: "",
  birthYear: "",
  gender: "",
  email: "",
  phone: "",
  city: "",
  companyName: "",
  industryGroup: "",
  totalWorkingYears: "",
  isPeopleManager: "",
  teamSize: "",
  leadershipYears: "",
  acquisitionSource: "",
  registrationMotivation: "",
  leadershipChallenge: "",
};

const registrationQuestions: RegistrationQuestion[] = [
  {
    id: "fullName",
    title: "Bạn tên là gì?",
    note: "Nhập họ và tên đầy đủ để SEN Pharma ghi nhận hành trình của bạn.",
    placeholder: "Ví dụ: Trần Phú Gia",
    required: true,
  },
  {
    id: "email",
    title: "Email cá nhân của bạn là gì?",
    note: "Email giúp chương trình nhận diện đúng hồ sơ học viên.",
    placeholder: "tenban@email.com",
    required: true,
  },
  {
    id: "phone",
    title: "Số điện thoại của bạn?",
    note: "Bạn sẽ dùng email hoặc số điện thoại cùng mã học viên để đăng nhập.",
    placeholder: "090...",
    required: true,
  },
  {
    id: "birthYear",
    title: "Bạn sinh năm nào?",
    note: "Thông tin này giúp đội ngũ hiểu rõ hơn về nhóm học viên.",
    placeholder: "Ví dụ: 1994",
    type: "number",
  },
  {
    id: "gender",
    title: "Bạn muốn chọn giới tính nào?",
    note: "Bạn có thể bỏ qua nếu không muốn chia sẻ.",
    type: "choice",
    options: ["Nữ", "Nam", "Khác", "Không chia sẻ"],
  },
  {
    id: "city",
    title: "Bạn đang ở tỉnh/thành nào?",
    note: "Chỉ cần ghi nơi bạn đang sinh sống hoặc làm việc chính.",
    placeholder: "Ví dụ: TP.HCM",
  },
  {
    id: "companyName",
    title: "Bạn đang thuộc công ty/bộ phận nào?",
    note: "Nếu bạn thuộc SEN Pharma, có thể ghi phòng ban hoặc đơn vị.",
    placeholder: "Ví dụ: SEN Pharma - RD",
  },
  {
    id: "industryGroup",
    title: "Lĩnh vực làm việc của bạn là gì?",
    note: "Chọn hoặc ghi lĩnh vực gần nhất với công việc hiện tại.",
    placeholder: "Ví dụ: Dược phẩm, QA/QC, Sales...",
  },
  {
    id: "totalWorkingYears",
    title: "Bạn đã đi làm khoảng bao lâu?",
    note: "Ghi số năm kinh nghiệm tổng thể.",
    placeholder: "Ví dụ: 5",
    type: "number",
  },
  {
    id: "isPeopleManager",
    title: "Hiện tại bạn có quản lý nhân sự không?",
    note: "Điều này giúp chương trình gợi ý nội dung sát hơn.",
    type: "choice",
    options: ["Có", "Chưa"],
    required: true,
  },
  {
    id: "teamSize",
    title: "Nếu có, bạn đang quản lý bao nhiêu người?",
    note: "Nếu chưa quản lý nhân sự, bạn có thể để trống.",
    placeholder: "Ví dụ: 6",
    type: "number",
  },
  {
    id: "leadershipYears",
    title: "Bạn đã ở vai trò quản lý/lãnh đạo bao lâu?",
    note: "Tính cả vai trò chính thức và không chính thức.",
    placeholder: "Ví dụ: 2",
    type: "number",
  },
  {
    id: "acquisitionSource",
    title: "Bạn biết chương trình từ đâu?",
    note: "Chọn nguồn gần đúng nhất.",
    type: "choice",
    options: ["Công ty giới thiệu", "Quản lý giới thiệu", "Đồng nghiệp", "Fanpage Facebook", "Zalo", "Khác"],
  },
  {
    id: "registrationMotivation",
    title: "Bạn mong đợi điều gì từ chương trình?",
    note: "Một câu ngắn thôi cũng được.",
    placeholder: "Ví dụ: Hiểu bản thân hơn và dẫn dắt đội nhóm tốt hơn...",
    type: "textarea",
  },
  {
    id: "leadershipChallenge",
    title: "Thử thách leadership lớn nhất của bạn hiện tại là gì?",
    note: "Câu trả lời này chỉ dùng để cá nhân hóa hành trình học.",
    placeholder: "Ví dụ: Giao tiếp thẳng thắn, tạo động lực, quản trị cảm xúc...",
    type: "textarea",
  },
];

export function RegistrationScreen({
  loading,
  error,
  createdUserId,
  onBackToLogin,
  onContinueToApp,
  onSubmit,
}: {
  loading: boolean;
  error: string;
  createdUserId: string;
  onBackToLogin: () => void;
  onContinueToApp: () => void;
  onSubmit: (answers: RegistrationAnswers) => void;
}) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<RegistrationAnswers>(registrationInitialAnswers);
  const question = registrationQuestions[step];
  const progress = Math.max(0, Math.round(((step + 1) / registrationQuestions.length) * 100));
  const value = question ? answers[question.id] : "";
  const canContinue = !question?.required || Boolean(value.trim());

  function updateAnswer(nextValue: string) {
    if (!question) return;
    setAnswers((current) => ({ ...current, [question.id]: nextValue }));
  }

  if (createdUserId) {
    return (
      <section className="registration-screen">
        <div className="registration-card success">
          <span className="tag">Đăng ký thành công</span>
          <h1>Mã học viên của bạn</h1>
          <div className="student-code-result">{createdUserId}</div>
          <p>Hãy lưu mã này để đăng nhập cùng email hoặc số điện thoại bạn vừa đăng ký.</p>
          <button className="btn" onClick={onContinueToApp}>Vào hành trình</button>
          <button className="btn ghost registration-link" onClick={onBackToLogin}>Về màn hình đăng nhập</button>
        </div>
      </section>
    );
  }

  if (step < 0) {
    return (
      <section className="registration-screen">
        <div className="registration-card welcome">
          <span className="tag">Lãnh Đạo Khai Tâm</span>
          <h1>Chào bạn đến với chương trình Lãnh Đạo Khai Tâm của SEN Pharma</h1>
          <p>Bạn đã sẵn sàng khám phá năng lực lãnh đạo trong bạn chưa?</p>
          <button className="btn" onClick={() => setStep(0)}>
            Bắt đầu
            <ChevronRight aria-hidden="true" />
          </button>
          <button className="btn ghost registration-link" onClick={onBackToLogin}>Tôi đã có mã học viên</button>
        </div>
      </section>
    );
  }

  return (
    <section className="registration-screen">
      <div className="registration-progress">
        <button onClick={() => (step === 0 ? setStep(-1) : setStep((current) => current - 1))}>Quay lại</button>
        <div><i style={{ width: `${progress}%` }} /></div>
        <span>{step + 1}/{registrationQuestions.length}</span>
      </div>

      <div className="registration-card">
        <span className="tag">Câu hỏi {step + 1}</span>
        <h1>{question.title}</h1>
        <p>{question.note}</p>
        {question.type === "choice" ? (
          <div className="registration-options">
            {question.options?.map((option) => (
              <button className={value === option ? "active" : ""} key={option} onClick={() => updateAnswer(option)}>
                {option}
              </button>
            ))}
          </div>
        ) : question.type === "textarea" ? (
          <textarea
            className="field tall registration-input"
            placeholder={question.placeholder}
            value={value}
            onChange={(event) => updateAnswer(event.target.value)}
          />
        ) : (
          <input
            className="field registration-input"
            inputMode={question.type === "number" ? "numeric" : "text"}
            placeholder={question.placeholder}
            value={value}
            onChange={(event) => updateAnswer(event.target.value)}
          />
        )}
        {error ? <div className="login-error">{error}</div> : null}
        <button
          className="btn"
          disabled={loading || !canContinue}
          onClick={() => {
            if (step === registrationQuestions.length - 1) onSubmit(answers);
            else setStep((current) => current + 1);
          }}
        >
          {loading ? "Đang đăng ký..." : step === registrationQuestions.length - 1 ? "Hoàn tất đăng ký" : "Tiếp tục"}
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export function SyncSplashScreen({
  error = false,
  onRetry,
}: {
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <section className="sync-splash">
      <img className="sync-splash-logo" src="/sen-lotus-logo.png" alt="SEN Pharma" />
      <div>
        <h1>Lãnh Đạo Khai Tâm</h1>
        <p>Hành trình vạn dặm bắt đầu bằng một bước chân</p>
      </div>
      {error ? (
        <>
          <XCircle className="sync-error-icon" aria-hidden="true" />
          <span>Chưa thể cập nhật dữ liệu hệ thống.</span>
          <button className="btn green sync-retry-button" onClick={onRetry}>
            Thử lại
          </button>
        </>
      ) : (
        <>
          <div className="sync-spinner" aria-hidden="true" />
          <span>Đang mở hành trình...</span>
        </>
      )}
    </section>
  );
}

export function HomeScreen({
  progressPercent,
  completedChallengeCount,
  completedDays = [],
  completedDaysCount,
  longestStreak,
  student = fallbackStudent,
  leaderboardUsers,
  challenges,
  currentWorkshop,
  currentWorkshopIndex,
  hasMiniChallenge = true,
  miniChallengeTotalDays,
  currentDayCompleted,
  miniChallengeCompleted,
  evaluationSubmitted,
  onGo,
}: {
  progressPercent: number;
  completedChallengeCount: number;
  completedDays?: number[];
  completedDaysCount: number;
  longestStreak: number;
  student?: Student;
  leaderboardUsers?: LeaderboardUser[];
  challenges?: Challenge[];
  currentWorkshop?: Workshop;
  currentWorkshopIndex: number;
  hasMiniChallenge?: boolean;
  miniChallengeTotalDays: number;
  currentDayCompleted: boolean;
  miniChallengeCompleted: boolean;
  evaluationSubmitted: boolean;
  onGo: (screen: Screen) => void;
}) {
  const currentChallenge =
    getChallengeForDay(challenges, completedChallengeCount) ||
    challenges?.[0] || {
      id: `challenge-day-${completedChallengeCount}`,
      workshopId: "WS7",
      day: completedChallengeCount,
      title: `Ngày ${completedChallengeCount}`,
      description: "",
      instruction: "",
      status: "active",
    };
  const isExperienceWorkshop = (currentWorkshop?.order ?? currentWorkshopIndex) <= 0;
  const currentWorkshopTitle = getWorkshopHeadline(currentWorkshop, currentWorkshopIndex);
  const heroCopy =
    currentWorkshop?.description && currentWorkshop.description !== currentWorkshopTitle
      ? currentWorkshop.description
      : `Bạn đang thực hành sau Workshop ${currentWorkshopIndex}. Hoàn thành check-in và ghi nhận phản tư mỗi ngày.`;
  const checkinButtonLabel = miniChallengeCompleted
    ? "Đã hoàn thành mini challenge"
    : currentDayCompleted
      ? "Đã check-in hôm nay"
      : "Check-in hôm nay";
  const profileScore = getCurrentUserXp(student, leaderboardUsers, {
    completedDaysCount,
    currentWorkshopIndex,
    evaluationSubmitted,
  });
  const leaderboard = getDashboardLeaderboard(student, profileScore, leaderboardUsers);
  const currentRank = leaderboard.find((entry) => entry.isCurrent)?.rank.toString() || "--";

  return (
    <section className="home-compact">
      <StudentHello student={student} />
      <div className="card hero home-hero">
        <div className="hero-topline">
          <span className="tag gold">{isExperienceWorkshop ? "Trải nghiệm" : `Workshop ${currentWorkshopIndex} / 7`}</span>
          <button onClick={() => onGo("journey")}>Xem hành trình</button>
        </div>
        <h2>{currentWorkshopTitle}</h2>
        <p className="hero-copy">{heroCopy}</p>
        <ProgressBar value={progressPercent} />
        <small>{progressPercent}% hành trình chương trình</small>
      </div>

      <ProgressionPanel
        streak={longestStreak}
        completion={progressPercent}
        xp={profileScore}
        rank={currentRank}
      />

      {hasMiniChallenge && currentChallenge ? (
      <div className="card mini-challenge-card">
        <div className="split-row">
          <span className="tag">Mini Challenge</span>
          <b className="gold-text">Ngày {completedChallengeCount} / {miniChallengeTotalDays}</b>
        </div>
        <h2>{currentChallenge.title}</h2>
        <p className="muted">
          {currentChallenge.description ||
            "Ghi nhận một khoảnh khắc bạn phản ứng tự động. Dừng lại, quan sát cảm xúc và viết điều nhận ra."}
        </p>
        <MountainPath completed={completedChallengeCount} completedDays={completedDays} currentDay={completedChallengeCount} total={miniChallengeTotalDays} />
        <button className="btn green" disabled={currentDayCompleted} onClick={() => onGo("checkin")}>
          <CheckCircle2 aria-hidden="true" />
          {checkinButtonLabel}
        </button>
      </div>
      ) : null}

      <LeaderboardCard leaderboard={leaderboard} />
    </section>
  );
}

function ProgressionPanel({
  streak,
  completion,
  xp,
  rank,
}: {
  streak: number;
  completion: number;
  xp: number;
  rank: string;
}) {
  const items = [
    { label: "Streak", value: streak.toString(), icon: Flame, tone: "orange" },
    { label: "Hoàn thành", value: `${completion}%`, icon: Target, tone: "green" },
    { label: "XP", value: xp.toString(), icon: Star, tone: "gold" },
    { label: "Hạng", value: rank, icon: Trophy, tone: "purple" },
  ];

  return (
    <div className="progression-panel">
      <div className="progression-title">My Progression</div>
      <div className="progression-grid">
        {items.map((item) => (
          <div className={`progression-item ${item.tone}`} key={item.label}>
            <item.icon aria-hidden="true" />
            <b>{item.value}</b>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardCard({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  return (
    <div className="card leaderboard-card" style={{ background: "linear-gradient(180deg, #fffdf9, #fff8e8)" }}>
      <div className="profile-section-heading" style={{ alignItems: "flex-start", display: "flex", gap: 12, justifyContent: "space-between" }}>
        <div>
          <span className="tag gold">Leaderboard</span>
          <h3>Bảng xếp hạng</h3>
        </div>
        <Trophy style={{ background: "#fff7dc", borderRadius: 16, color: "#d0aa3f", height: 44, padding: 10, width: 44 }} />
      </div>
      <div className="leaderboard-list" style={{ display: "grid", gap: 10 }}>
        {leaderboard.map((entry) => (
          <div
            className={`leaderboard-row ${entry.isCurrent ? "current" : ""}`}
            key={entry.id}
            style={{
              alignItems: "center",
              background: entry.isCurrent ? "#e3f5ef" : "rgba(255, 255, 255, 0.75)",
              border: `1px solid ${entry.isCurrent ? "rgba(22, 130, 109, 0.28)" : "#eadfcb"}`,
              borderRadius: 18,
              display: "grid",
              gap: 10,
              gridTemplateColumns: "38px 1fr auto",
              padding: 10,
            }}
          >
            <span
              className="leaderboard-rank"
              style={{
                alignItems: "center",
                background: entry.isCurrent ? "#16826d" : "#fff4cf",
                borderRadius: 14,
                color: entry.isCurrent ? "#fff" : "#9a7112",
                display: "flex",
                fontSize: 16,
                fontWeight: 950,
                height: 38,
                justifyContent: "center",
                width: 38,
              }}
            >
              {entry.rank}
            </span>
            <div>
              <b style={{ display: "block", fontSize: 14 }}>{entry.name}</b>
              <small style={{ color: "#70758f", display: "block", fontSize: 11, fontWeight: 750, marginTop: 2 }}>{entry.note}</small>
            </div>
            <strong style={{ color: "#16826d", fontSize: 13, whiteSpace: "nowrap" }}>{entry.xp} XP</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function getWorkshopHeadline(workshop: Workshop | undefined, currentWorkshopIndex: number) {
  const fallback = `Workshop ${currentWorkshopIndex}`;
  if (!workshop) return fallback;
  if (workshop.title && !/^workshop\s+\d+$/i.test(workshop.title.trim())) return workshop.title;
  return workshop.description || workshop.title || fallback;
}

export function JourneyScreen({
  workshops = fallbackWorkshops,
  challenges = [],
  activitiesLocked = false,
  onOpenChallenge,
  onGo,
}: {
  workshops?: Workshop[];
  challenges?: Challenge[];
  activitiesLocked?: boolean;
  onOpenChallenge: (workshopId: string) => void;
  onGo: (screen: Screen) => void;
}) {
  const workshopItems = workshops.filter((item, index) => (item.order ?? index + 1) <= 8);
  const nextActivity = getNextJourneyActivity(workshopItems, challenges);
  const flowItems = buildJourneyFlow(workshopItems, challenges);

  return (
    <section>
      <PageTitle title="Hành trình" action="Home" onClick={() => onGo("home")} />
      <NextActivityCard activity={nextActivity} />
      <div className="journey-flow">
        {flowItems.map((item) => (
          <div className={`journey-step ${item.status} ${item.type}`} key={item.id}>
            <span className="journey-marker">
              <item.icon aria-hidden="true" />
            </span>
            <div>
              <h3>{item.title}</h3>
              {item.note ? <p>{item.note}</p> : null}
              {item.resourceUrl && item.status !== "locked" ? (
                <button className="journey-resource-link" onClick={() => window.open(item.resourceUrl, "_blank", "noopener,noreferrer")}>
                  Xem tài liệu
                </button>
              ) : null}
              {item.actionScreen && item.actionLabel ? (
                <button
                  className="journey-resource-link journey-action-link"
                  disabled={activitiesLocked || item.status === "locked" || item.actionDisabled}
                  onClick={() =>
                    item.challengeWorkshopId
                      ? onOpenChallenge(item.challengeWorkshopId)
                      : onGo(item.actionScreen!)
                  }
                >
                  {item.actionLabel}
                  <ChevronRight aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NextActivityCard({
  activity,
}: {
  activity?: {
    title: string;
    description: string;
    dateCopy?: string;
    icon: LucideIcon;
  };
}) {
  if (!activity) {
    return (
      <div className="next-workshop-card">
        <span className="tag purple">Next</span>
        <h3>Hoàn tất hành trình workshop</h3>
        <p>21-days challenge sẽ mở sau khi hoàn thành Workshop 7.</p>
      </div>
    );
  }

  const Icon = activity.icon;

  return (
    <div className="next-workshop-card">
      <div>
        <span className="tag purple">Next</span>
        <h3>{activity.title}</h3>
        <p>{activity.description}</p>
        <small>{activity.dateCopy || "Thông tin sẽ được cập nhật sau"}</small>
      </div>
      <Icon aria-hidden="true" />
    </div>
  );
}

function getNextJourneyActivity(workshops: Workshop[], challenges: Challenge[]) {
  const currentWorkshop = workshops.find((item) => item.status === "now");
  if (currentWorkshop) {
    const order = currentWorkshop.order ?? (Number(String(currentWorkshop.id || "").replace(/\D/g, "")) || 0);
    const workshopId = currentWorkshop.id || `WS${order}`;
    const hasChallenge = challenges.some((challenge) => challenge.workshopId === workshopId);
    if (hasChallenge && order >= 1 && order < 7) {
      const access = getJourneyChallengeAccess(currentWorkshop, challenges);
      return {
        title: "Mini Challenge",
        description: `Thực hành sau ${currentWorkshop.title}`,
        dateCopy: access.enabled ? "Đã mở cho hoạt động hiện tại" : access.label,
        icon: Flag,
      };
    }

    if (hasChallenge && order === 7) {
      const access = getJourneyChallengeAccess(currentWorkshop, challenges);
      return {
        title: "21-days challenge",
        description: "Mở sau Workshop 7, lan tỏa tinh thần lãnh đạo sáng tạo",
        dateCopy: access.enabled ? "Đã mở cho hoạt động hiện tại" : access.label,
        icon: Trophy,
      };
    }
  }

  const workshop = getNextWorkshop(workshops);
  if (!workshop) return undefined;
  const dateCopy = [workshop.scheduleDate, workshop.scheduleTime].filter(Boolean).join(" · ");
  return {
    title: workshop.title,
    description: workshop.description || "Nội dung workshop sẽ được cập nhật sau.",
    dateCopy: dateCopy ? `Dự kiến bắt đầu vào ngày ${dateCopy}` : "Lịch học sẽ được cập nhật sau",
    icon: BookOpen,
  };
}

function buildJourneyFlow(workshops: Workshop[], challenges: Challenge[] = []) {
  const items: {
    id: string;
    type: "workshop" | "mini" | "assessment" | "challenge21";
    title: string;
    note: string;
    status: Workshop["status"];
    icon: LucideIcon;
    resourceUrl?: string;
    actionLabel?: string;
    actionScreen?: Screen;
    actionDisabled?: boolean;
    challengeWorkshopId?: string;
  }[] = [];

  const shareLearnWorkshop = workshops.find((workshop, index) => {
    const order = workshop.order ?? index + 1;
    const text = `${workshop.title} ${workshop.description}`.toLowerCase();
    return order > 7 || text.includes("share") || text.includes("learn") || text.includes("chia sẻ");
  });
  const coreWorkshops = workshops.filter((workshop, index) => workshop !== shareLearnWorkshop && (workshop.order ?? index + 1) <= 7);

  coreWorkshops.forEach((workshop, index) => {
    const order = workshop.order ?? index + 1;
    items.push({
      id: workshop.id || `WS${order}`,
      type: "workshop",
      title: workshop.title,
      note: `${workshop.description || "Nội dung workshop"} · ${workshopStatusLabel(workshop.status)}`,
      status: workshop.status,
      icon: BookOpen,
      resourceUrl: workshop.flashcardUrl,
    });

    if (order === 2) {
      items.push({
        id: "assessment-after-ws2",
        type: "assessment",
        title: "Leadership Assessment",
        note: "Tự đánh giá và mời người khác đánh giá",
        status: workshop.status === "locked" ? "locked" : "done",
        icon: CheckCircle2,
        actionLabel: "Thực hiện đánh giá",
        actionScreen: "evaluate",
      });
    }

    const workshopId = workshop.id || `WS${order}`;
    const hasMiniChallenge = challenges.some((challenge) => challenge.workshopId === workshopId);

    if (order >= 1 && order < 7 && hasMiniChallenge) {
      const workshopChallenges = challenges.filter((challenge) => challenge.workshopId === workshopId);
      const challengeAccess = getJourneyChallengeAccess(workshop, workshopChallenges);
      items.push({
        id: `mini-after-ws${order}`,
        type: "mini",
        title: "Mini Challenge",
        note: "",
        status: challengeAccess.status,
        icon: Flag,
        actionLabel: challengeAccess.label,
        actionScreen: "challenge",
        actionDisabled: !challengeAccess.enabled,
        challengeWorkshopId: workshop.id || `WS${order}`,
      });
    }
  });

  const finalWorkshop = coreWorkshops.find((item, index) => (item.order ?? index + 1) === 7);
  const finalChallengeAccess = finalWorkshop
    ? getJourneyChallengeAccess(
        finalWorkshop,
        challenges.filter((challenge) => challenge.workshopId === (finalWorkshop.id || "WS7")),
      )
    : { enabled: false, label: "Chưa mở", status: "locked" as const };

  items.push({
    id: "challenge-21-days",
    type: "challenge21",
    title: "21-days challenge",
    note: "Mở sau Workshop 7, lan tỏa tinh thần lãnh đạo sáng tạo",
    status: finalWorkshop?.status === "locked" ? "locked" : "now",
    icon: Trophy,
    actionLabel: finalChallengeAccess.label === "Mở Mini Challenge" ? "Xem thử thách" : finalChallengeAccess.label,
    actionScreen: "challenge",
    actionDisabled: !finalChallengeAccess.enabled,
    challengeWorkshopId: finalWorkshop?.id || "WS7",
  });

  if (shareLearnWorkshop) {
    const shareOrder = shareLearnWorkshop.order ?? 8;
    items.push({
      id: shareLearnWorkshop.id || `WS${shareOrder}`,
      type: "workshop",
      title: shareLearnWorkshop.title,
      note: `${shareLearnWorkshop.description || "Share & Learn"} · ${workshopStatusLabel(shareLearnWorkshop.status)}`,
      status: shareLearnWorkshop.status,
      icon: BookOpen,
      resourceUrl: shareLearnWorkshop.flashcardUrl,
    });
  }

  return items;
}
function getJourneyChallengeAccess(workshop: Workshop, challenges: Challenge[] = []) {
  const challengeDates = challenges
    .map((challenge) => parseJourneyDate(challenge.date))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (challengeDates.length) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDate = new Date(challengeDates[0]);
    const lastDate = new Date(challengeDates[challengeDates.length - 1]);
    firstDate.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);
    if (today < firstDate) {
      return { enabled: false, label: `Mở từ ${firstDate.toLocaleDateString("vi-VN")}`, status: "locked" as const };
    }
    if (today > lastDate) {
      return { enabled: false, label: "Đã kết thúc", status: "done" as const };
    }
    const hasChallengeToday = challengeDates.some((date) => {
      const value = new Date(date);
      value.setHours(0, 0, 0, 0);
      return value.getTime() === today.getTime();
    });
    return {
      enabled: hasChallengeToday,
      label: hasChallengeToday ? "Mở Mini Challenge" : "Hôm nay không có thử thách",
      status: "now" as const,
    };
  }

  if (workshop.status === "done") return { enabled: false, label: "Đã kết thúc", status: "done" as const };
  if (workshop.status !== "now") return { enabled: false, label: "Chưa mở", status: "locked" as const };

  const workshopDate = parseJourneyDate(workshop.scheduleDate);
  if (!workshopDate) {
    return { enabled: true, label: "Mở Mini Challenge", status: "now" as const };
  }

  const openDate = new Date(workshopDate);
  openDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today < openDate) {
    return { enabled: false, label: `Mở từ ${openDate.toLocaleDateString("vi-VN")}`, status: "locked" as const };
  }

  return { enabled: true, label: "Mở Mini Challenge", status: "now" as const };
}

function parseJourneyDate(value?: string) {
  if (!value) return null;
  const text = value.trim();
  const vietnameseDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vietnameseDate) {
    return new Date(Number(vietnameseDate[3]), Number(vietnameseDate[2]) - 1, Number(vietnameseDate[1]));
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getNextWorkshop(workshops: Workshop[]) {
  return workshops.find((item) => item.status === "locked") || workshops.find((item) => item.status === "now");
}

export function WorkshopScreen({
  workshops = fallbackWorkshops,
  onGo,
}: {
  workshops?: Workshop[];
  onGo: (screen: Screen) => void;
}) {
  return (
    <section>
      <PageTitle title="Workshop" action="Home" onClick={() => onGo("home")} />
      {workshops.slice(0, 6).map((item) => (
        <ListRow
          key={item.title}
          title={item.title}
          note={item.description}
          status={workshopStatusLabel(item.status)}
          waiting={item.status !== "done"}
        />
      ))}
      <div className="card">
        <span className="tag purple">Thông báo</span>
        <h3>Workshop 4 dự kiến mở sau khi hoàn thành Mini Challenge 3</h3>
        <p className="muted">Nội dung và thời gian workshop sẽ được cập nhật sau.</p>
      </div>
    </section>
  );
}

export function ChallengeScreen({
  completedChallengeCount,
  challenges,
  completedDays = [],
  miniChallengeTotalDays,
  currentDayCompleted,
  miniChallengeCompleted,
  onGo,
}: {
  completedChallengeCount: number;
  challenges?: Challenge[];
  completedDays?: number[];
  miniChallengeTotalDays: number;
  currentDayCompleted: boolean;
  miniChallengeCompleted: boolean;
  onGo: (screen: Screen) => void;
}) {
  const challengeTitles = challenges?.length ? challenges.map((challenge) => challenge.title) : fallbackChallengeDays;
  const currentChallenge = getChallengeForDay(challenges, completedChallengeCount);
  const buttonLabel = miniChallengeCompleted
    ? "Đã hoàn thành mini challenge"
    : currentDayCompleted
      ? "Đã check-in hôm nay"
      : "Check-in";

  return (
    <section>
      <PageTitle title="Challenge" action="Home" onClick={() => onGo("home")} />
      <div className="card">
        <span className="tag">Mini Challenge hiện tại</span>
        <h2>
          Ngày {completedChallengeCount} / {miniChallengeTotalDays} · {currentChallenge.title}
        </h2>
        <MountainPath completed={completedChallengeCount} completedDays={completedDays} currentDay={completedChallengeCount} total={miniChallengeTotalDays} />
        <button className="btn green" disabled={currentDayCompleted} onClick={() => onGo("checkin")}>
          <CheckCircle2 aria-hidden="true" />
          {buttonLabel}
        </button>
      </div>
      <div className="card">
        <h3>Lộ trình mini challenge</h3>
        {challengeTitles.map((title, index) => (
          <ListRow
            key={title}
            title={`Ngày ${index + 1}`}
            note={title}
            status={getChallengeStatus(index + 1, completedChallengeCount, completedDays)}
            waiting={!completedDays.includes(index + 1)}
          />
        ))}
      </div>
    </section>
  );
}

export function CheckinScreen({
  checkin,
  currentDay,
  challenges,
  completedDays = [],
  miniChallengeTotalDays,
  currentDayCompleted,
  saving,
  onChange,
  onSave,
  onGo,
}: {
  checkin: Checkin;
  currentDay: number;
  challenges?: Challenge[];
  completedDays?: number[];
  miniChallengeTotalDays: number;
  currentDayCompleted: boolean;
  saving: boolean;
  onChange: (value: Checkin) => void;
  onSave: () => void;
  onGo: (screen: Screen) => void;
}) {
  const moods = [
    { label: "Tĩnh", icon: Smile },
    { label: "Vui", icon: Laugh },
    { label: "Suy nghĩ", icon: Meh },
    { label: "Mệt", icon: Frown },
    { label: "Nhẹ lòng", icon: Heart },
  ];
  const currentChallenge = getChallengeForDay(challenges, currentDay);
  const canSubmit = !currentDayCompleted && Boolean(checkin.insight.trim() || checkin.nextAction.trim());

  return (
    <section>
      <PageTitle title="Check-in hôm nay" action="Đóng" onClick={() => onGo("home")} />
      <div className="card checkin-card">
        <span className="tag">Ngày {currentDay} / {miniChallengeTotalDays}</span>
        <h2>{currentChallenge.title}</h2>
        <p className={currentChallenge.instruction ? "checkin-daily-quote" : "muted"}>
          {currentChallenge.instruction ||
            (currentDayCompleted ? "Bạn đã hoàn thành check-in cho ngày này." : "Hôm nay bạn đã thực hành chưa?")}
        </p>
        <MountainPath completed={currentDay} completedDays={completedDays} currentDay={currentDay} total={miniChallengeTotalDays} compact />
        <div className="choice">
          <button
            className={checkin.status === "done" ? "active" : ""}
            disabled={currentDayCompleted}
            onClick={() => onChange({ ...checkin, status: "done" })}
          >
            <CheckCircle2 aria-hidden="true" />
            Đã thực hành
          </button>
          <button
            className={checkin.status === "not_done" ? "active no" : "no"}
            disabled={currentDayCompleted}
            onClick={() => onChange({ ...checkin, status: "not_done" })}
          >
            <XCircle aria-hidden="true" />
            Chưa làm
          </button>
        </div>
        <h3>Cảm xúc hôm nay</h3>
        <div className="emotion-icons">
          {moods.map((mood) => (
            <button
              className={checkin.mood === mood.label ? "active" : ""}
              key={mood.label}
              disabled={currentDayCompleted}
              onClick={() => onChange({ ...checkin, mood: mood.label })}
              title={mood.label}
            >
              <mood.icon aria-hidden="true" />
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
        <h3>Điều tôi nhận ra hôm nay</h3>
        <textarea
          className="field tall"
          placeholder="Ví dụ: Tôi nhận ra mình thường vội phản hồi trước khi thật sự lắng nghe..."
          value={checkin.insight}
          disabled={currentDayCompleted}
          onChange={(event) => onChange({ ...checkin, insight: event.target.value })}
        />
        <h3>Một hành động nhỏ tôi sẽ thử ngày mai</h3>
        <textarea
          className="field tall"
          placeholder="Tôi sẽ..."
          value={checkin.nextAction}
          disabled={currentDayCompleted}
          onChange={(event) => onChange({ ...checkin, nextAction: event.target.value })}
        />
        <button className="btn" disabled={saving || !canSubmit} onClick={onSave}>
          <Send aria-hidden="true" />
          {currentDayCompleted ? "Đã check-in hôm nay" : saving ? "Đang lưu..." : "Gửi check-in"}
        </button>
      </div>
    </section>
  );
}

export function ChallengeCompleteScreen({
  totalDays,
  onGoHome,
}: {
  totalDays: number;
  onGoHome: () => void;
}) {
  return (
    <section className="challenge-complete-screen">
      <div className="challenge-complete-card">
        <div className="celebration-icon" aria-hidden="true">
          <Smile />
          <Trophy />
        </div>
        <span className="tag gold">Hoàn thành thử thách</span>
        <h1>Chúc mừng bạn!</h1>
        <p>
          Bạn đã hoàn thành hành trình {totalDays} ngày. Những ghi nhận nhỏ mỗi ngày đang trở thành năng lực quan sát
          và lãnh đạo bền vững hơn.
        </p>
        <button className="btn green" onClick={onGoHome}>
          <CheckCircle2 aria-hidden="true" />
          Về Home
        </button>
      </div>
    </section>
  );
}

export function NotificationsScreen({
  tasks,
  pushState,
  pushBusy,
  pushMessage,
  onTogglePush,
  onGo,
}: {
  tasks: NotificationTask[];
  pushState: "checking" | "unsupported" | "unavailable" | "blocked" | "off" | "on";
  pushBusy: boolean;
  pushMessage: string;
  onTogglePush: () => void;
  onGo: (screen: Screen) => void;
}) {
  const pushOn = pushState === "on";
  const pushDisabled = pushBusy || ["checking", "unsupported", "unavailable", "blocked"].includes(pushState);
  const statusText = pushState === "blocked"
    ? "Đang bị chặn trong cài đặt trình duyệt"
    : pushState === "unsupported"
      ? "Thiết bị này chưa hỗ trợ web push"
      : pushState === "unavailable"
        ? "Hệ thống push chưa được cấu hình"
        : pushOn
          ? "Mini challenge 20:00 · Workshop 19:00"
          : "Bật để nhận nhắc đúng lịch";
  return (
    <section>
      <PageTitle title="Thông báo" action="Home" onClick={() => onGo("home")} />
      <div className="card push-setting-card">
        <div>
          <strong>Thông báo trên thiết bị</strong>
          <p>{pushMessage || statusText}</p>
        </div>
        <button
          aria-checked={pushOn}
          aria-label="Bật hoặc tắt thông báo trên thiết bị"
          className={`push-switch ${pushOn ? "on" : ""}`}
          disabled={pushDisabled}
          onClick={onTogglePush}
          role="switch"
        >
          <span />
        </button>
      </div>
      <div className="card notification-list-card">
        <span className="tag gold">Việc cần làm</span>
        {tasks.length ? (
          <div className="today-list">
            {tasks.map((task) => (
              <TodayItem
                done={task.done}
                key={task.id}
                note={task.note}
                title={task.title}
                waiting={task.waiting}
                onClick={task.onClick}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">Bạn đã hoàn thành các việc cần làm hiện tại.</div>
        )}
      </div>
    </section>
  );
}

export function EvaluateScreen({
  currentWorkshop,
  currentWorkshopIndex,
  evaluations = [],
  peerFeedbackCount = 0,
  templates = [],
  finalQuizResults = [],
  onSelectTemplate,
  onCopyPeerLink,
  onGo,
}: {
  currentWorkshop?: Workshop;
  currentWorkshopIndex: number;
  evaluations?: EvaluationRecord[];
  peerFeedbackCount?: number;
  templates?: EvaluationTemplate[];
  finalQuizResults?: FinalQuizResult[];
  onSelectTemplate: (templateId: string) => void;
  onCopyPeerLink: (template: EvaluationTemplate) => void;
  onGo: (screen: Screen) => void;
}) {
  const visibleTemplates = useMemo(
    () => sortEvaluationTemplates(templates, currentWorkshop?.id || `WS${currentWorkshopIndex}`),
    [templates, currentWorkshop?.id, currentWorkshopIndex],
  );
  const pendingTemplates = visibleTemplates.filter((template) => {
    if (template.status === "locked") return false;
    return isPeerLinkTemplate(template) || !isEvaluationTemplateCompleted(template, evaluations);
  });
  const finalQuizTemplates = visibleTemplates.filter((template) => template.type === "final_quiz");
  const workshopTemplates = pendingTemplates.filter((template) => template.type === "workshop");
  const personalTemplates = pendingTemplates.filter((template) => template.type !== "workshop" && template.type !== "final_quiz");
  const peerLinkTemplates = personalTemplates.filter(isPeerLinkTemplate);
  const nonPeerPersonalTemplates = personalTemplates.filter((template) => !isPeerLinkTemplate(template));
  const peerFeedbackEnabled = visibleTemplates.some(
    (template) => isPeerLinkTemplate(template) && template.status !== "locked",
  );
  const openTemplate = (template: EvaluationTemplate) =>
    isPeerLinkTemplate(template) ? onCopyPeerLink(template) : onSelectTemplate(template.id);

  return (
    <section>
      <PageTitle title="Đánh giá" action="Home" onClick={() => onGo("home")} />
      <div className="evaluation-board">
        <div className="evaluation-group">
          <h3>Kiểm tra cuối khóa</h3>
          {finalQuizTemplates.length ? finalQuizTemplates.map((template) => {
            const result = finalQuizResults.find((item) => item.templateId === template.id);
            const published = result?.gradingStatus === "published";
            const submitted = result?.status === "submitted";
            return (
              <button className="evaluation-task" disabled={template.status === "locked" && !result} key={template.id} onClick={() => openTemplate(template)}>
                <span className={published || submitted ? "done" : template.status === "locked" ? "locked" : ""}>
                  {published || submitted ? <CheckCircle2 aria-hidden="true" /> : template.status === "locked" ? <XCircle aria-hidden="true" /> : <CircleIcon />}
                </span>
                <div>
                  <b>{template.title}</b>
                  <small>{published ? `Kết quả: ${result?.finalScore}/100` : submitted ? "Đã nộp · Đang chờ giảng viên chấm" : template.status === "locked" ? "Chưa mở" : "30 phút · Chỉ làm một lần"}</small>
                </div>
              </button>
            );
          }) : <div className="empty-state">Bài kiểm tra cuối khóa chưa được thiết lập.</div>}
        </div>
        <div className="evaluation-group">
          <h3>Workshop</h3>
          {workshopTemplates.length ? (
            workshopTemplates.map((template) => (
              <EvaluationTaskButton
                done={isEvaluationTemplateCompleted(template, evaluations)}
                key={template.id}
                template={template}
                onClick={() => openTemplate(template)}
              />
            ))
          ) : (
            <div className="empty-state">Chưa có form đánh giá workshop cho giai đoạn này.</div>
          )}
        </div>
        <div className="evaluation-group">
          <h3>Cá nhân & mời đánh giá</h3>
          {peerLinkTemplates.length ? (
            peerLinkTemplates.map((template) => (
              <EvaluationTaskButton
                done={isEvaluationTemplateCompleted(template, evaluations)}
                key={template.id}
                template={template}
                onClick={() => openTemplate(template)}
              />
            ))
          ) : null}
          {nonPeerPersonalTemplates.length ? (
            nonPeerPersonalTemplates.map((template) => (
              <EvaluationTaskButton
                done={isEvaluationTemplateCompleted(template, evaluations)}
                key={template.id}
                template={template}
                onClick={() => openTemplate(template)}
              />
            ))
          ) : !peerLinkTemplates.length && !peerFeedbackEnabled ? (
            <div className="empty-state">Chưa có form Leadership Assessment hoặc mời người khác đánh giá.</div>
          ) : (
            null
          )}
          {peerFeedbackEnabled ? (
            <div className="peer-feedback-summary">
              <UsersRound aria-hidden="true" />
              <div>
                <b>Số lượt đánh giá bạn nhận được</b>
                <span>
                  {peerFeedbackCount > 0
                    ? `Bạn đã nhận ${peerFeedbackCount} lượt đánh giá`
                    : "Bạn chưa nhận lượt đánh giá nào"}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function EvaluationFormScreen({
  template,
  questions = [],
  answers,
  saving,
  onAnswerChange,
  onSave,
  onGo,
  finalQuizResult,
}: {
  template?: EvaluationTemplate;
  questions?: EvaluationQuestion[];
  answers: Record<string, string>;
  saving: boolean;
  onAnswerChange: (questionId: string, value: string) => void;
  onSave: () => void;
  onGo: (screen: Screen) => void;
  finalQuizResult?: FinalQuizResult;
}) {
  const isScenarioAssessment = Boolean(
    template &&
      template.type === "self_before" &&
      questions.length > 1 &&
      questions.some((question) => question.type === "single_choice" && question.options.length >= 2),
  );
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [formError, setFormError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingQuizSeconds(finalQuizResult?.expiresAt));
  const isFinalQuiz = template?.type === "final_quiz";
  useEffect(() => {
    if (!isFinalQuiz || !finalQuizResult?.expiresAt || finalQuizResult.status !== "in_progress") return;
    const update = () => setRemainingSeconds(getRemainingQuizSeconds(finalQuizResult.expiresAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [finalQuizResult?.expiresAt, finalQuizResult?.status, isFinalQuiz]);
  const requiredAnswered = questions
    .filter((question) => question.required)
    .every((question) => Boolean(answers[question.id]?.trim()));
  const allQuestionsAnswered = questions.length > 0 && questions.every((question) => Boolean(answers[question.id]?.trim()));
  const canSubmitForm = isFinalQuiz ? allQuestionsAnswered : requiredAnswered;
  const activeQuestion = questions[activeQuestionIndex];

  if (!template) {
    return (
      <div className="card dynamic-evaluation-card">
        <span className="tag purple">Đánh giá</span>
        <h2>Chọn một form đánh giá</h2>
        <p className="muted">Quay lại danh sách để chọn workshop, onboard hoặc share & learn.</p>
        <button className="btn" onClick={() => onGo("evaluate")}>
          <ChevronRight aria-hidden="true" />
          Danh sách đánh giá
        </button>
      </div>
    );
  }

  if (isFinalQuiz && finalQuizResult?.gradingStatus === "published") {
    return (
      <section>
        <PageTitle title="Kiểm tra cuối khóa" action="Danh sách" onClick={() => onGo("evaluate")} />
        <div className="card dynamic-evaluation-card">
          <span className="tag purple">Kết quả đã công bố</span>
          <h2>{finalQuizResult.finalScore}/100 · {finalQuizResult.finalScore > 70 ? "Đạt" : "Chưa đạt"}</h2>
          <p>Trắc nghiệm: {finalQuizResult.objectiveScore}/70 · Tự luận: {finalQuizResult.essayScore}/30</p>
          {finalQuizResult.feedback ? <p className="muted">Nhận xét: {finalQuizResult.feedback}</p> : null}
        </div>
      </section>
    );
  }

  if (isFinalQuiz && finalQuizResult?.status === "submitted") {
    return (
      <section>
        <PageTitle title="Kiểm tra cuối khóa" action="Danh sách" onClick={() => onGo("evaluate")} />
        <div className="card dynamic-evaluation-card"><h2>Đã nộp bài</h2><p className="muted">Giảng viên đang chấm bài. Điểm sẽ xuất hiện tại đây sau khi được công bố.</p></div>
      </section>
    );
  }

  if (isScenarioAssessment || isFinalQuiz) {
    const progressPercent = questions.length ? Math.round(((activeQuestionIndex + 1) / questions.length) * 100) : 0;
    const answeredCount = questions.filter((question) => Boolean(answers[question.id]?.trim())).length;
    const requiredQuestionCount = questions.filter((question) => question.required).length;
    const missingRequiredCount = questions.filter((question) => question.required && !answers[question.id]?.trim()).length;
    const activeQuestionIsValid = !activeQuestion?.required || Boolean(answers[activeQuestion.id]?.trim());
    const handleScenarioNext = () => {
      if (!activeQuestionIsValid) {
        setFormError("Vui lòng trả lời câu hiện tại trước khi chuyển sang câu tiếp theo.");
        return;
      }
      setFormError("");
      setActiveQuestionIndex((current) => Math.min(questions.length - 1, current + 1));
    };
    const handleScenarioSave = () => {
      if (!activeQuestionIsValid) {
        setFormError("Vui lòng trả lời câu hiện tại trước khi hoàn tất.");
        return;
      }
      if (!canSubmitForm) {
        const missingCount = isFinalQuiz
          ? questions.filter((question) => !answers[question.id]?.trim()).length
          : missingRequiredCount;
        setFormError(isFinalQuiz ? `Còn ${missingCount} câu chưa trả lời.` : `Còn ${missingCount} câu bắt buộc chưa trả lời.`);
        return;
      }
      setFormError("");
      onSave();
    };

    return (
      <section>
        <PageTitle title={isFinalQuiz ? "Kiểm tra cuối khóa" : "Leadership Assessment"} action="Danh sách" onClick={() => onGo("evaluate")} />
        <div className="card dynamic-evaluation-card scenario-assessment-card">
          <div className="scenario-assessment-head">
            <h2>
              Câu {Math.min(activeQuestionIndex + 1, questions.length)} / {questions.length}
            </h2>
            {isFinalQuiz ? <p className="tag purple" aria-live="polite">Thời gian còn lại: {formatQuizTime(remainingSeconds)}</p> : null}
          </div>
          <div className="scenario-progress" aria-label={`${progressPercent}% hoàn thành`}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>

          {activeQuestion ? (
            <div className="scenario-question question-slide-panel" key={activeQuestion.id}>
              <div className="scenario-prompt-card">
                <p>{activeQuestion.text}</p>
              </div>
              {activeQuestion.type !== "text" ? (
                <div className="scenario-choice-title">
                  <Pin aria-hidden="true" />
                  <div>
                    <h3>{activeQuestion.type === "multi_choice" ? "Chọn tất cả đáp án đúng" : isFinalQuiz ? "Chọn một đáp án" : "Chọn phương án gần với bạn nhất"}</h3>
                    {!isFinalQuiz ? <p>
                      Dựa trên <strong>suy nghĩ, cảm xúc thực bên trong</strong> của bạn (đặc biệt là{" "}
                      <strong>khi bạn gặp áp lực</strong>), thay vì chọn cách bạn nghĩ &quot;nên làm&quot; hoặc cách
                      bạn muốn thể hiện ra ngoài.
                    </p> : null}
                  </div>
                </div>
              ) : null}
              <EvaluationQuestionField
                answer={answers[activeQuestion.id] || ""}
                question={activeQuestion}
                questionIndex={activeQuestionIndex}
                onChange={(value) => {
                  setFormError("");
                  onAnswerChange(activeQuestion.id, value);
                  if (activeQuestion.type !== "text" && activeQuestion.type !== "multi_choice" && activeQuestionIndex < questions.length - 1) {
                    window.setTimeout(() => {
                      setActiveQuestionIndex((current) => Math.min(questions.length - 1, current + 1));
                    }, 220);
                  }
                }}
              />
              {activeQuestion.type === "multi_choice" ? (
                <p className="multi-choice-status" aria-live="polite">
                  {answers[activeQuestion.id]?.split("|").filter(Boolean).length || 0} đáp án đã chọn
                </p>
              ) : null}
            </div>
          ) : (
            <div className="empty-state">Chưa có câu hỏi cho form này.</div>
          )}

          <div className="scenario-form-actions">
            <button
              className="ghost-btn"
              disabled={activeQuestionIndex === 0 || saving}
              onClick={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))}
            >
              Quay lại
            </button>
            {activeQuestionIndex < questions.length - 1 ? (
              <button
                className="btn"
                disabled={saving}
                onClick={handleScenarioNext}
              >
                Tiếp theo
                <ChevronRight aria-hidden="true" />
              </button>
            ) : (
              <button className="btn" disabled={saving || !questions.length || !canSubmitForm} onClick={handleScenarioSave}>
                {saving ? "Đang nộp..." : isFinalQuiz ? "Nộp bài" : "Hoàn tất"}
              </button>
            )}
          </div>
          <p className={`scenario-count ${missingRequiredCount ? "needs-attention" : ""}`}>
            {answeredCount}/{questions.length} câu đã trả lời
            {activeQuestionIndex === questions.length - 1 ? (
              <span className="scenario-count-guidance">
                <small>Bấm {isFinalQuiz ? "Nộp bài" : "Hoàn tất"} nếu bạn đã trả lời đủ {questions.length} câu.</small>
                <small>Nếu chưa đủ, bấm Quay lại để hoàn thành.</small>
              </span>
            ) : null}
            {missingRequiredCount && activeQuestionIndex === questions.length - 1 ? (
              <>
                <span>Còn {missingRequiredCount}/{requiredQuestionCount} câu hỏi bắt buộc chưa trả lời.</span>
                <span>Bấm nút Quay lại để hoàn thành.</span>
              </>
            ) : null}
          </p>
          {formError ? <p className="form-error">{formError}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageTitle title="Đánh giá" action="Danh sách" onClick={() => onGo("evaluate")} />
      <div className="card dynamic-evaluation-card">
        {template.sessionType && template.sessionType !== "main" ? (
          <span className="tag purple">{template.sessionType}</span>
        ) : null}
        <h2>{getEvaluationTemplateDisplayTitle(template)}</h2>
        {isFinalQuiz ? <p className="tag purple">Thời gian còn lại: {formatQuizTime(remainingSeconds)}</p> : null}
        <p className="muted">{template.description || "Hoàn thành các câu hỏi bên dưới để gửi đánh giá."}</p>
        {questions.length ? (
          <div className="question-list">
            {questions.map((question) => (
              <EvaluationQuestionField
                answer={answers[question.id] || ""}
                key={question.id}
                question={question}
                questionIndex={question.order - 1}
                onChange={(value) => onAnswerChange(question.id, value)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">Chưa có câu hỏi cho form này.</div>
        )}
        <button className="btn" disabled={saving || !questions.length || !canSubmitForm} onClick={onSave}>
          <ChevronRight aria-hidden="true" />
          {saving ? "Đang nộp..." : isFinalQuiz ? "Nộp bài" : "Gửi đánh giá"}
        </button>
      </div>
    </section>
  );
}

function EvaluationTaskButton({
  template,
  done,
  onClick,
}: {
  template: EvaluationTemplate;
  done: boolean;
  onClick: () => void;
}) {
  const isPeerLink = isPeerLinkTemplate(template);
  const disabled = template.status === "locked" && !isPeerLink;
  const title = isPeerLink ? "Mời người khác đánh giá" : getEvaluationTemplateDisplayTitle(template);

  return (
    <button className={`evaluation-task ${isPeerLink ? "peer-link-task" : ""}`} disabled={disabled} onClick={onClick}>
      <span className={done ? "done" : disabled ? "locked" : isPeerLink ? "link" : ""}>
        {done ? (
          <CheckCircle2 aria-hidden="true" />
        ) : disabled ? (
          <XCircle aria-hidden="true" />
        ) : isPeerLink ? (
          <Link aria-hidden="true" />
        ) : (
          <CircleIcon />
        )}
      </span>
      <div>
        <b>{title}</b>
        {!isPeerLink && template.description ? <small>{template.description}</small> : null}
      </div>
      {isPeerLink ? <em>Copy link</em> : null}
    </button>
  );
}

function getPeerLinkNote(template: EvaluationTemplate) {
  if (template.formUrl) return "Bấm để copy link Google Form đã điền sẵn thông tin học viên";
  return "Copy link";
}

function getEvaluationTemplateDisplayTitle(template: EvaluationTemplate) {
  if (template.type === "self_before") return "Tự đánh giá";
  return template.title;
}

function getRemainingQuizSeconds(expiresAt?: string) {
  if (!expiresAt) return 30 * 60;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatQuizTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function isPeerLinkTemplate(template: EvaluationTemplate) {
  if (template.status === "locked") return false;
  const text = `${template.id} ${template.title} ${template.sessionType} ${template.type}`.toLowerCase();
  return Boolean(template.formUrl) || template.type === "peer" || text.includes("peer") || text.includes("360") || text.includes("other");
}

function isEvaluationTemplateCompleted(template: EvaluationTemplate, evaluations: EvaluationRecord[]) {
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

function normalizeCompletionKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
}

function CircleIcon() {
  return <span className="dot-icon" />;
}

function EvaluationQuestionField({
  question,
  questionIndex,
  answer,
  onChange,
}: {
  question: EvaluationQuestion;
  questionIndex?: number;
  answer: string;
  onChange: (value: string) => void;
}) {
  const scaleOptions = question.options.length ? question.options : ["1", "2", "3", "4", "5"];
  const selectedOptions = answer ? answer.split("|").filter(Boolean) : [];
  const isStarScale =
    (question.type === "rating" || question.type === "scale") &&
    scaleOptions.every((option) => Number.isFinite(Number(option)));
  const selectedStarValue = Number(answer) || 0;

  return (
    <div className="question-field">
      <label>
        {question.text}
        {question.required ? <span>*</span> : null}
      </label>
      {question.type === "text" ? (
        <textarea className="field" value={answer} onChange={(event) => onChange(event.target.value)} />
      ) : question.type === "multi_choice" ? (
        <div className="choice-options multi-choice-options">
          {scaleOptions.map((option) => {
            const active = selectedOptions.includes(option);

            return (
              <button
                aria-pressed={active}
                className={`multi-choice-option ${active ? "active" : ""}`}
                key={option}
                onClick={() =>
                  onChange(
                    active
                      ? selectedOptions.filter((item) => item !== option).join("|")
                      : [...selectedOptions, option].join("|"),
                  )
                }
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <div className={question.type === "single_choice" ? "choice-options" : isStarScale ? "rating-options" : "scale-options"}>
          {getDisplayOptions(scaleOptions, (questionIndex ?? 0) + 1).map((option) => {
            const scenarioOption = parseScenarioOption(option);
            const optionValue = getScenarioAnswerValue(option);
            const active = isStarScale && Number(option) <= selectedStarValue ? true : answer === optionValue || answer === option;

            return (
              <button
                aria-label={isStarScale ? `${option} sao` : scenarioOption.label || option}
                className={`${active ? "active" : ""} ${
                  scenarioOption.body ? "scenario-option" : ""
                }`}
                key={option}
                onClick={() => onChange(optionValue)}
                title={isStarScale ? `${option} sao` : scenarioOption.label || option}
              >
                {isStarScale ? (
                  <Star aria-hidden="true" />
                ) : scenarioOption.body ? (
                  <>
                    <span>{scenarioOption.body}</span>
                  </>
                ) : (
                  option
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function parseScenarioOption(option: string) {
  const separatorIndex = option.indexOf("::");
  if (separatorIndex < 0) {
    const singleColonMatch = option.match(/^(Phản ứng|Sáng tạo)\s*:\s*(.+)$/i);
    if (singleColonMatch) {
      return { label: singleColonMatch[1].trim(), body: singleColonMatch[2].trim() };
    }

    return option.length > 30 ? { label: "", body: option } : { label: option, body: "" };
  }

  return {
    label: option.slice(0, separatorIndex).trim(),
    body: option.slice(separatorIndex + 2).trim(),
  };
}

function getDisplayOptions(options: string[], questionOrder = 1) {
  const scenarioOptions = options.map((option) => ({ option, value: getScenarioAnswerValue(option) }));
  const hasScenarioPair =
    scenarioOptions.some((item) => item.value === "reactive") && scenarioOptions.some((item) => item.value === "creative");
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

function sortEvaluationTemplates(templates: EvaluationTemplate[], currentWorkshopId: string) {
  const order: Record<EvaluationTemplate["type"], number> = { final_quiz: 0, workshop: 1, self_before: 2, peer: 3, self_after: 4 };
  const activeWorkshopTemplates = templates.filter((template) => template.type === "workshop" && template.status !== "locked");
  const shouldRespectWorkshopFilter = activeWorkshopTemplates.length === 0;

  return [...templates]
    .filter((template) => {
      if (template.type === "self_after") return false;
      if (template.type !== "workshop") return true;
      return !template.workshopId || template.workshopId === currentWorkshopId || !shouldRespectWorkshopFilter;
    })
    .sort((a, b) => order[a.type] - order[b.type] || a.title.localeCompare(b.title));
}

export function LearningScreen({
  checkins = [],
  onGo,
}: {
  checkins?: CheckinRecord[];
  onGo: (screen: Screen) => void;
}) {
  const insights = [...checkins]
    .filter((item) => item.insight?.trim() || item.nextAction?.trim())
    .sort((a, b) => b.day - a.day);
  const resources = [
    {
      title: "Tóm tắt Workshop 3",
      note: "Các ý chính cần nhớ sau buổi học",
      status: "Tài liệu",
      icon: ScrollText,
    },
    {
      title: "Nhật ký insight cá nhân",
      note: "Dùng phần reflection/check-in để ghi lại điều nhận ra",
      status: "Gợi ý",
      icon: Library,
    },
  ];

  return (
    <section>
      <PageTitle title="Learning" action="Home" onClick={() => onGo("home")} />
      <div className="card">
        <span className="tag purple">Tài liệu học tập</span>
        <h2>Đọc lại và thực hành nhẹ mỗi ngày</h2>
        <p className="muted">
          Danh sách tài liệu sẽ được cập nhật theo từng workshop.
        </p>
      </div>
      <div className="learning-list">
        {resources.map((resource) => (
          <div className="learning-row" key={resource.title}>
            <span className="learning-icon">
              <resource.icon aria-hidden="true" />
            </span>
            <div>
              <b>{resource.title}</b>
              <div className="mini-note">{resource.note}</div>
            </div>
            <span className="status wait">{resource.status}</span>
          </div>
        ))}
      </div>
      <div className="card insight-journal-card group-insight-card">
        <span className="tag">Insight cá nhân</span>
        <h3>Nhật ký điều tôi nhận ra</h3>
        {insights.length ? (
          <div className="insight-journal-list">
            {insights.map((item) => (
              <div className="insight-journal-item" key={item.id || `${item.workshopId}-${item.day}`}>
                <div className="insight-day">Ngày {item.day}</div>
                {item.insight ? <p>{item.insight}</p> : null}
                {item.nextAction ? <small>Hành động tiếp theo: {item.nextAction}</small> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Chưa có insight nào. Sau mỗi lần check-in, điều bạn ghi nhận sẽ xuất hiện tại đây.
          </div>
        )}
      </div>
    </section>
  );
}

export function LearningHubScreen({
  currentMiniChallengeDay,
  currentWorkshopIndex,
  coachingRequests = [],
  coachingSlots = [],
  activitiesLocked = false,
  groupCheckins = [],
  groupMembers = [],
  groupOptions = [],
  practiceExercises = [],
  saving = false,
  studentId,
  workshops = [],
  onBookCoachingSlot,
  onRegisterCoaching,
  onJoinGroup,
  onGo,
  onRenameGroup,
  onSaveGroupCheckin,
}: {
  currentMiniChallengeDay: number;
  currentWorkshopIndex: number;
  coachingRequests?: CoachingRequest[];
  coachingSlots?: CoachingSlot[];
  activitiesLocked?: boolean;
  groupCheckins?: GroupCheckinRecord[];
  groupMembers?: PeerGroupMember[];
  groupOptions?: PeerGroupOption[];
  practiceExercises?: PracticeExercise[];
  saving?: boolean;
  studentId: string;
  workshops?: Workshop[];
  onBookCoachingSlot: (slotId: string) => void;
  onRegisterCoaching: (explorationGoal: string) => void;
  onJoinGroup: (groupId: string) => Promise<void>;
  onGo: (screen: Screen) => void;
  onRenameGroup: (groupId: string, groupName: string) => void;
  onSaveGroupCheckin: (groupId: string, week: number, met: boolean, insight: string, nextAction: string) => void;
}) {
  const activeMembership = groupMembers.find(
    (member) => member.userId === studentId && normalizeStatus(member.status) === "active",
  );
  const coachingRequest = coachingRequests.find((request) => request.userId === studentId);
  const [coachingFormOpen, setCoachingFormOpen] = useState(false);
  const [explorationGoal, setExplorationGoal] = useState("");
  const coachingRegistrationOpen = workshops.some(
    (workshop) => (workshop.order === 7 || workshop.id?.toLowerCase() === "ws7") && workshop.status === "now",
  );
  const currentGroupWeek = getCurrentGroupWeek(currentMiniChallengeDay);
  const groupCheckinOpen = currentWorkshopIndex >= 7 && currentMiniChallengeDay >= 1;
  const activePracticeExercises = practiceExercises.filter((exercise) =>
    ["active", "open", "now"].includes(normalizeStatus(exercise.status)),
  );
  const hasCurrentGroupCheckin = Boolean(
    activeMembership &&
      groupCheckinOpen &&
      groupCheckins.some(
        (item) =>
          item.groupId === activeMembership.groupId &&
          item.week === currentGroupWeek &&
          item.userId === studentId,
      ),
  );
  const resources = [
    {
      title: "Tài liệu Workshop",
      note: `Xem tài liệu học tập đến Workshop ${currentWorkshopIndex}`,
      status: "Tài liệu",
      icon: ScrollText,
      onClick: () => onGo("flashcards"),
    },
    {
      title: "Nhật ký insight cá nhân",
      note: "Xem lại insight cá nhân và nội dung họp nhóm",
      status: "Xem",
      icon: Library,
      onClick: () => onGo("insights"),
    },
  ];

  if (coachingRegistrationOpen && (!coachingRequest || coachingRequest.status === "registered")) {
    resources.push({
      title: "Coaching 1:1 online",
      note: coachingRequest ? "Bạn đã đăng ký Coaching 1:1 online" : "Đăng ký tham gia Coaching 1:1 online",
      status: coachingRequest ? "Đã đăng ký coaching" : "Đăng ký",
      icon: UserRound,
      onClick: () => {
        if (!coachingRequest) setCoachingFormOpen(true);
      },
    });
  }

  if (activePracticeExercises.length) {
    resources.splice(1, 0, {
      title: "Thực hành",
      note: `${activePracticeExercises.length} bài tập đang mở`,
      status: "Bắt đầu",
      icon: Wind,
      onClick: () => onGo("practice"),
    });
  }

  if (currentWorkshopIndex >= 7 || activeMembership || activitiesLocked) {
    resources.push({
      title: "Họp nhóm bạn đồng hành",
      note: activitiesLocked
        ? "Khóa học đã kết thúc. Bạn có thể xem lại insight nhóm trong nhật ký."
        : activeMembership
        ? groupCheckinOpen
          ? `Check-in thảo luận nhóm tuần ${currentGroupWeek}`
          : "Bạn đã có nhóm. Check-in sẽ mở trong thử thách 21 ngày"
        : "Chọn nhóm để cùng thực hành và chia sẻ insight",
      status: activitiesLocked
        ? "Xem lại"
        : activeMembership
        ? groupCheckinOpen
          ? hasCurrentGroupCheckin
            ? "Đã check-in"
            : "Thực hiện"
          : "Đã chọn nhóm"
        : groupOptions.length
          ? "Chọn nhóm"
          : "Chưa mở",
      icon: UsersRound,
      onClick: () => onGo(activitiesLocked ? "insights" : "peerGroup"),
    });
  }

  return (
    <section>
      <PageTitle title="Learning" action="Home" onClick={() => onGo("home")} />
      <div className="card">
        <span className="tag purple">Tài liệu học tập</span>
        <h2>Ôn tập và ghi nhận mỗi ngày</h2>
      </div>
      <div className="learning-list">
        {resources.map((resource) => (
          <button className="learning-row" key={resource.title} onClick={resource.onClick}>
            <span className="learning-icon">
              <resource.icon aria-hidden="true" />
            </span>
            <div>
              <b>{resource.title}</b>
              <div className="mini-note">{resource.note}</div>
            </div>
            <span className="status wait">{resource.status}</span>
          </button>
        ))}
      </div>
      {coachingRegistrationOpen && !coachingRequest && coachingFormOpen ? (
        <div className="card coaching-card coaching-registration-form">
          <span className="tag purple">Coaching 1:1 online</span>
          <label htmlFor="coaching-exploration-goal">Điều bạn mong muốn khám phá hoặc chuyển hóa nhất ở bản thân là gì?</label>
          <textarea
            id="coaching-exploration-goal"
            value={explorationGoal}
            onChange={(event) => setExplorationGoal(event.target.value)}
            placeholder="Chia sẻ điều bạn mong muốn..."
            rows={4}
          />
          <button className="btn" disabled={saving || !explorationGoal.trim()} onClick={() => onRegisterCoaching(explorationGoal.trim())}>
            {saving ? "Đang đăng ký..." : "Xác nhận đăng ký"}
          </button>
        </div>
      ) : null}
      {coachingRequest?.status === "selected" ? (
        <div className="card coaching-card">
          <span className="tag purple">Coaching 1:1 online</span>
          <h2>Chọn lịch coaching</h2>
          <div className="coaching-slot-list">
            {(() => {
              const availableSlots = coachingSlots.filter((slot) => slot.status.toLowerCase() === "open" && !slot.bookedUserId);
              if (!availableSlots.length) return <p>Hiện chưa có lịch coaching khả dụng.</p>;
              return availableSlots.map((slot) => (
                <button disabled={saving} key={slot.id} onClick={() => onBookCoachingSlot(slot.id)}>
                  <b>{formatCoachingTime(slot.startAt, slot.endAt)}</b>
                  <span>{slot.coachName || "Coaching 1:1 online"}</span>
                </button>
              ));
            })()}
          </div>
        </div>
      ) : null}
      {coachingRequest?.status === "booked" ? (
        <div className="card coaching-card confirmed">
          <span className="tag purple">Coaching 1:1 online</span>
          <h2>Lịch coaching của bạn</h2>
          {(() => {
            const slot = coachingSlots.find((item) => item.id === coachingRequest.assignedSlotId);
            if (!slot) return <p>Đã xác nhận lịch coaching.</p>;
            return <><p><b>{formatCoachingTime(slot.startAt, slot.endAt)}</b></p>{slot.meetingLink ? <a className="btn" href={slot.meetingLink} target="_blank" rel="noreferrer">Mở link tham dự</a> : null}</>;
          })()}
        </div>
      ) : null}
    </section>
  );
}

function formatCoachingTime(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime())) return startAt;
  const date = start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const startTime = start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const endTime = Number.isNaN(end.getTime()) ? "" : end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${startTime}${endTime ? `–${endTime}` : ""} · ${date}`;
}

export function PracticeScreen({
  exercises = [],
  hasChallengeToday,
  onGo,
  onOpenChallenge,
}: {
  exercises?: PracticeExercise[];
  hasChallengeToday: (linkedChallengeId?: string) => boolean;
  onGo: (screen: Screen) => void;
  onOpenChallenge: (linkedChallengeId?: string) => void;
}) {
  const activeExercises = useMemo(
    () =>
      exercises
        .filter((exercise) => ["active", "open", "now"].includes(normalizeStatus(exercise.status)))
        .sort((a, b) => a.order - b.order),
    [exercises],
  );
  const [selectedId, setSelectedId] = useState("");
  const selectedExercise = activeExercises.find((exercise) => exercise.id === selectedId) || activeExercises[0];
  const challengeAvailableToday = selectedExercise
    ? hasChallengeToday(selectedExercise.linkedChallengeId)
    : false;
  const duration = selectedExercise?.durationSeconds || 300;
  const [remainingSeconds, setRemainingSeconds] = useState(duration);
  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bellRef = useRef<HTMLAudioElement | null>(null);
  const bellPlayedRef = useRef(false);
  const deadlineRef = useRef(0);
  const wakeLockRef = useRef<PracticeWakeLockSentinel | null>(null);

  useEffect(() => {
    setRemainingSeconds(duration);
    setRunning(false);
    setCompleted(false);
    bellPlayedRef.current = false;
    deadlineRef.current = 0;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (bellRef.current) {
      bellRef.current.pause();
      bellRef.current.currentTime = 0;
    }
    void releasePracticeWakeLock();
  }, [duration, selectedExercise?.id]);

  useEffect(() => {
    if (!running) return;

    const tick = () => {
      const next = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0 && !bellPlayedRef.current) {
        bellPlayedRef.current = true;
        setRunning(false);
        setCompleted(true);
        audioRef.current?.pause();
        void releasePracticeWakeLock();
        if (bellRef.current) {
          bellRef.current.currentTime = 0;
          bellRef.current.volume = 0.65;
          bellRef.current.play().catch(() => undefined);
        }
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (!document.hidden || !running) return;
      const next = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setRemainingSeconds(next);
      setRunning(false);
      audioRef.current?.pause();
      void releasePracticeWakeLock();
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [running]);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      bellRef.current?.pause();
      void releasePracticeWakeLock();
    },
    [],
  );

  function startTimer() {
    if (!selectedExercise || remainingSeconds <= 0) return;
    deadlineRef.current = Date.now() + remainingSeconds * 1000;
    bellPlayedRef.current = false;
    setCompleted(false);
    setRunning(true);
    void requestPracticeWakeLock();
    if (audioRef.current) {
      audioRef.current.volume = 0.22;
      audioRef.current.muted = muted;
      audioRef.current.play().catch(() => undefined);
    }
  }

  function pauseTimer() {
    if (deadlineRef.current) {
      setRemainingSeconds(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    }
    setRunning(false);
    audioRef.current?.pause();
    void releasePracticeWakeLock();
  }

  function resetTimer() {
    setRunning(false);
    setCompleted(false);
    setRemainingSeconds(duration);
    bellPlayedRef.current = false;
    deadlineRef.current = 0;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (bellRef.current) {
      bellRef.current.pause();
      bellRef.current.currentTime = 0;
    }
    void releasePracticeWakeLock();
  }

  async function requestPracticeWakeLock() {
    const wakeLock = (navigator as NavigatorWithPracticeWakeLock).wakeLock;
    if (!wakeLock || document.hidden || wakeLockRef.current) return;

    try {
      const sentinel = await wakeLock.request("screen");
      wakeLockRef.current = sentinel;
      sentinel.addEventListener(
        "release",
        () => {
          if (wakeLockRef.current === sentinel) wakeLockRef.current = null;
        },
        { once: true },
      );
    } catch {
      wakeLockRef.current = null;
    }
  }

  async function releasePracticeWakeLock() {
    const sentinel = wakeLockRef.current;
    wakeLockRef.current = null;
    if (!sentinel || sentinel.released) return;

    try {
      await sentinel.release();
    } catch {
      // The browser may already have released the lock when the page became hidden.
    }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  }

  return (
    <section>
      <PageTitle title="Thực hành" action="Learning" onClick={() => onGo("learning")} />
      {!activeExercises.length ? (
        <div className="card empty-state">Chưa có bài thực hành nào đang mở.</div>
      ) : (
        <>
          <div className="practice-list" aria-label="Danh sách bài thực hành">
            {activeExercises.map((exercise) => (
              <button
                className={`practice-card ${exercise.id === selectedExercise?.id ? "active" : ""}`}
                key={exercise.id}
                onClick={() => setSelectedId(exercise.id)}
              >
                <span className="practice-card-icon"><Wind aria-hidden="true" /></span>
                <span>
                  <b>{exercise.title}</b>
                  <small>{formatPracticeDuration(exercise.durationSeconds)}</small>
                </span>
                <ChevronRight aria-hidden="true" />
              </button>
            ))}
          </div>

          {selectedExercise ? (
            <div className="card practice-detail">
              <span className="tag purple">Bài tập thực hành</span>
              <h2>{selectedExercise.title}</h2>
              {selectedExercise.description ? <p className="practice-description">{selectedExercise.description}</p> : null}
              {selectedExercise.instruction ? (
                <div className="practice-instruction">
                  <b>Hướng dẫn</b>
                  <p>{selectedExercise.instruction}</p>
                </div>
              ) : null}

              <div className={`practice-orb ${running ? "breathing" : ""}`} aria-hidden="true">
                <Wind />
              </div>
              <div className="practice-timer" aria-live="polite">{formatTimer(remainingSeconds)}</div>
              <div className="practice-timer-note">
                {completed ? "Bạn đã hoàn thành bài thực hành. Hãy dành một chút thời gian ghi nhận cảm nhận của mình." : running ? "Thả lỏng và nhẹ nhàng quan sát hơi thở." : "Khi sẵn sàng, bấm Bắt đầu."}
              </div>

              <audio
                key={selectedExercise.id}
                ref={audioRef}
                src={selectedExercise.mediaUrl || "/audio/meditation-music-5m.mp3"}
                preload="none"
                loop
              />
              <audio ref={bellRef} src="/audio/meditation-bell.wav" preload="auto" />
              <div className="practice-controls">
                <button className="practice-icon-button" onClick={resetTimer} title="Đặt lại">
                  <RotateCcw aria-hidden="true" />
                </button>
                <button className="primary practice-main-button" onClick={running ? pauseTimer : startTimer} disabled={completed}>
                  {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                  {running ? "Tạm dừng" : completed ? "Đã hoàn thành" : remainingSeconds < duration ? "Tiếp tục" : "Bắt đầu"}
                </button>
                <button className="practice-icon-button" onClick={toggleMute} title={muted ? "Bật nhạc" : "Tắt nhạc"}>
                  {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                </button>
              </div>
              {completed ? (
                <div className="practice-complete-actions">
                  {challengeAvailableToday ? (
                    <button
                      className="primary practice-challenge-button"
                      onClick={() => onOpenChallenge(selectedExercise.linkedChallengeId)}
                    >
                      Sang Mini Challenge để check-in
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ) : (
                    <p className="practice-no-challenge">Hôm nay không có Mini Challenge cần check-in.</p>
                  )}
                  <button className="secondary practice-reset-button" onClick={resetTimer}>Thực hành lại</button>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type PracticeWakeLockSentinel = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void, options?: { once?: boolean }) => void;
};

type NavigatorWithPracticeWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<PracticeWakeLockSentinel>;
  };
};

function formatPracticeDuration(totalSeconds: number) {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} phút`;
}

export function PeerGroupScreen({
  currentMiniChallengeDay,
  currentWorkshopIndex,
  groupCheckins = [],
  groupMembers = [],
  groupOptions = [],
  saving = false,
  studentId,
  onJoinGroup,
  onRenameGroup,
  onSaveGroupCheckin,
  onGo,
}: {
  currentMiniChallengeDay: number;
  currentWorkshopIndex: number;
  groupCheckins?: GroupCheckinRecord[];
  groupMembers?: PeerGroupMember[];
  groupOptions?: PeerGroupOption[];
  saving?: boolean;
  studentId: string;
  onJoinGroup: (groupId: string) => Promise<void>;
  onRenameGroup: (groupId: string, groupName: string) => void;
  onSaveGroupCheckin: (groupId: string, week: number, met: boolean, insight: string, nextAction: string) => void;
  onGo: (screen: Screen) => void;
}) {
  return (
    <section>
      <PageTitle title="Nhóm bạn đồng hành" action="Learning" onClick={() => onGo("learning")} />
      <PeerGroupCard
        checkins={groupCheckins}
        currentMiniChallengeDay={currentMiniChallengeDay}
        currentWorkshopIndex={currentWorkshopIndex}
        members={groupMembers}
        options={groupOptions}
        saving={saving}
        studentId={studentId}
        onJoin={onJoinGroup}
        onRename={onRenameGroup}
        onSaveCheckin={onSaveGroupCheckin}
      />
    </section>
  );
}

function PeerGroupCard({
  checkins,
  currentMiniChallengeDay,
  currentWorkshopIndex,
  members,
  options,
  saving,
  studentId,
  onJoin,
  onRename,
  onSaveCheckin,
}: {
  checkins: GroupCheckinRecord[];
  currentMiniChallengeDay: number;
  currentWorkshopIndex: number;
  members: PeerGroupMember[];
  options: PeerGroupOption[];
  saving: boolean;
  studentId: string;
  onJoin: (groupId: string) => Promise<void>;
  onRename: (groupId: string, groupName: string) => void;
  onSaveCheckin: (groupId: string, week: number, met: boolean, insight: string, nextAction: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [joiningGroupId, setJoiningGroupId] = useState("");
  const [met, setMet] = useState(true);
  const [insight, setInsight] = useState("");
  const [nextAction, setNextAction] = useState("");
  const activeMembership = members.find(
    (member) => member.userId === studentId && normalizeStatus(member.status) === "active",
  );
  const group = activeMembership ? options.find((option) => option.id === activeMembership.groupId) : undefined;
  const groupName = group?.name || activeMembership?.groupName || "";
  const groupMembers = activeMembership
    ? members.filter((member) => member.groupId === activeMembership.groupId && normalizeStatus(member.status) === "active")
    : [];
  const currentWeek = getCurrentGroupWeek(currentMiniChallengeDay);
  const currentWeekCheckin = activeMembership
    ? checkins.find((item) => item.groupId === activeMembership.groupId && item.week === currentWeek && item.userId === studentId)
    : undefined;
  const canCheckin = Boolean(
    activeMembership &&
      currentWorkshopIndex >= 7 &&
      currentMiniChallengeDay >= 1 &&
      currentWeek >= 1 &&
      currentWeek <= 3 &&
      !currentWeekCheckin,
  );

  if (!options.length && !activeMembership) {
    return (
      <div className="card peer-group-card">
        <span className="tag">Nhóm bạn đồng hành</span>
        <h3>Chưa có nhóm đang mở</h3>
      </div>
    );
  }

  if (!activeMembership) {
    return (
      <div className="card peer-group-card">
        <span className="tag">Nhóm bạn đồng hành</span>
        <h3>Chọn nhóm để cùng thực hành 21 ngày</h3>
        <p className="muted">Mỗi học viên chỉ tham gia một nhóm đang mở. Khi nhóm đủ người, nút tham gia sẽ tự khóa.</p>
        <div className="peer-group-list">
          {options.map((option) => {
            const isOpen = isGroupOpen(option.status);
            const isFull = option.memberCount >= option.maxMembers;
            const isJoining = joiningGroupId === option.id;
            const optionMembers = members.filter(
              (member) => member.groupId === option.id && normalizeStatus(member.status) === "active",
            );

            return (
              <button
                aria-pressed={isJoining}
                className={`peer-group-option${isJoining ? " joining" : ""}`}
                disabled={saving || !isOpen || isFull}
                key={option.id}
                onClick={async () => {
                  setJoiningGroupId(option.id);
                  try {
                    await onJoin(option.id);
                  } finally {
                    setJoiningGroupId("");
                  }
                }}
              >
                <div>
                  <b>{option.name}</b>
                  <small>{option.memberCount}/{option.maxMembers} thành viên</small>
                  {optionMembers.length ? (
                    <div className="peer-option-members">
                      {optionMembers.map((member) => (
                        <span key={member.userId}>{member.userName || member.userId}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="peer-option-empty">Chưa có thành viên</div>
                  )}
                </div>
                <span>{isJoining ? "Đã chọn" : isFull ? "Đã đầy" : isOpen ? "Tham gia" : "Đã khóa"}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="card peer-group-card">
      <span className="tag">Nhóm bạn đồng hành</span>
      <h3>{groupName}</h3>
      <p className="muted">Tuần {currentWeek || 1} của thử thách 21 ngày. Cùng gặp nhau, chia sẻ insight và giữ nhịp thực hành.</p>
      <div className="peer-member-list">
        {groupMembers.map((member) => (
          <span key={member.userId}>{member.userName || member.userId}</span>
        ))}
      </div>
      <div className="peer-group-form">
        <label>
          Đổi tên nhóm
          <div className="inline-action">
            <input
              className="field"
              maxLength={30}
              onChange={(event) => setNewName(event.target.value)}
              placeholder={groupName}
              value={newName}
            />
            <button
              disabled={saving || !newName.trim()}
              onClick={() => {
                onRename(activeMembership.groupId, newName.trim());
                setNewName("");
              }}
            >
              Lưu
            </button>
          </div>
        </label>
        {currentWeekCheckin ? (
          <div className="group-checkin-complete">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <b>Đã thực hiện check-in nhóm tuần {currentWeek}</b>
              <span>Nội dung đã được lưu trong Nhật ký insight.</span>
            </div>
          </div>
        ) : canCheckin ? (
          <>
            <div className="toggle-row">
              <span>Tuần này nhóm đã gặp nhau?</span>
              <button className={met ? "selected" : ""} onClick={() => setMet(true)}>Đã gặp</button>
              <button className={!met ? "selected" : ""} onClick={() => setMet(false)}>Chưa</button>
            </div>
            <label>
              Insight sau buổi thảo luận
              <textarea
                className="field tall"
                onChange={(event) => setInsight(event.target.value)}
                placeholder="Điều tôi học được từ nhóm..."
                value={insight}
              />
            </label>
            <label>
              Hành động tiếp theo
              <textarea
                className="field tall"
                onChange={(event) => setNextAction(event.target.value)}
                placeholder="Tuần tới tôi sẽ..."
                value={nextAction}
              />
            </label>
            <button
              className="btn green"
              disabled={saving || (!insight.trim() && !nextAction.trim())}
              onClick={() => {
                onSaveCheckin(activeMembership.groupId, currentWeek, met, insight, nextAction);
                setInsight("");
                setNextAction("");
              }}
            >
              <CheckCircle2 aria-hidden="true" />
              Check-in nhóm tuần này
            </button>
          </>
        ) : (
          <div className="empty-state">Check-in nhóm sẽ mở trong thử thách 21 ngày sau Workshop 7.</div>
        )}
      </div>
    </div>
  );
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase();
}

function isGroupOpen(value: string) {
  const status = normalizeStatus(value);
  return !status || ["open", "active", "available", "dangmo", "mo"].includes(status);
}

function getCurrentGroupWeek(currentDay: number) {
  if (currentDay <= 0) return 1;
  return Math.min(3, Math.max(1, Math.ceil(currentDay / 7)));
}

function getGroupMemberName(members: PeerGroupMember[], userId: string) {
  const member = members.find((item) => item.userId === userId);
  return member?.userName || userId || "Thành viên trong nhóm";
}

export function InsightJournalScreen({
  checkins = [],
  groupCheckins = [],
  groupMembers = [],
  groupOptions = [],
  studentId,
  workshops = [],
  onGo,
}: {
  checkins?: CheckinRecord[];
  groupCheckins?: GroupCheckinRecord[];
  groupMembers?: PeerGroupMember[];
  groupOptions?: PeerGroupOption[];
  studentId: string;
  workshops?: Workshop[];
  onGo: (screen: Screen) => void;
}) {
  const insights = [...checkins]
    .filter((item) => item.insight?.trim() || item.nextAction?.trim())
    .sort((a, b) => (a.workshopId || "").localeCompare(b.workshopId || "") || a.day - b.day);
  const grouped = insights.reduce<Record<string, CheckinRecord[]>>((result, item) => {
    const key = item.workshopId || "Mini Challenge";
    result[key] = [...(result[key] || []), item];
    return result;
  }, {});
  const activeMembership = groupMembers.find(
    (member) => member.userId === studentId && normalizeStatus(member.status) === "active",
  );
  const groupName =
    groupOptions.find((option) => option.id === activeMembership?.groupId)?.name ||
    activeMembership?.groupName ||
    "Nhóm bạn đồng hành";
  const visibleGroupCheckins = [...groupCheckins]
    .filter((item) => item.groupId === activeMembership?.groupId)
    .sort((a, b) => a.week - b.week);

  return (
    <section>
      <PageTitle title="Nhật ký insight" action="Learning" onClick={() => onGo("learning")} />
      <div className="card insight-journal-card">
        <span className="tag">Insight cá nhân</span>
        <h3>Điều tôi nhận ra theo từng workshop</h3>
        {Object.keys(grouped).length ? (
          <div className="insight-journal-list">
            {Object.entries(grouped).map(([workshopId, items]) => (
              <div className="insight-workshop-group" key={workshopId}>
                <h4>{getWorkshopName(workshops, workshopId)}</h4>
                {items.map((item) => (
                  <div className="insight-journal-item" key={item.id || `${item.workshopId}-${item.day}`}>
                    <div className="insight-day">Ngày {item.day}</div>
                    {item.insight ? <p>{item.insight}</p> : null}
                    {item.nextAction ? <small>Hành động tiếp theo: {item.nextAction}</small> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Chưa có insight nào. Sau mỗi lần check-in, điều bạn ghi nhận sẽ xuất hiện tại đây.</div>
        )}
      </div>
      <div className="card insight-journal-card">
        <span className="tag">Insight nhóm</span>
        <h3>{groupName}</h3>
        {visibleGroupCheckins.length ? (
          <div className="insight-journal-list">
            {visibleGroupCheckins.map((item) => (
              <div className="insight-journal-item group-insight-item" key={item.id || `${item.groupId}-${item.week}`}>
                <div className="insight-day">Check-in nhóm tuần {item.week}</div>
                <small>{getGroupMemberName(groupMembers, item.userId)}</small>
                {item.insight ? <p>{item.insight}</p> : null}
                {item.nextAction ? <small>Hành động tiếp theo: {item.nextAction}</small> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Chưa có nội dung check-in nhóm.</div>
        )}
      </div>
    </section>
  );
}

export function FlashcardScreen({
  currentWorkshopIndex,
  workshops = [],
  onGo,
}: {
  currentWorkshopIndex: number;
  workshops?: Workshop[];
  onGo: (screen: Screen) => void;
}) {
  const availableWorkshops = (workshops.length ? workshops : fallbackWorkshops)
    .filter((workshop, index) => (workshop.order ?? index + 1) <= currentWorkshopIndex);
  const openFlashcards = (url?: string) => {
    window.open(url || "https://senpharmavn.github.io/ldp-knowledge-recap/", "_blank", "noopener,noreferrer");
  };

  return (
    <section>
      <PageTitle title="Tóm tắt Workshop" action="Learning" onClick={() => onGo("learning")} />
      <div className="card">
        <span className="tag purple">Tài liệu học tập</span>
        <h2>Chọn workshop để xem tài liệu</h2>
        <p className="muted">Hiện chỉ mở đến Workshop {currentWorkshopIndex}. Bấm vào workshop để mở tài liệu hoặc bộ recap tương ứng.</p>
      </div>
      <div className="learning-list">
        {availableWorkshops.map((workshop, index) => (
          <button className="learning-row" key={workshop.id || index} onClick={() => openFlashcards(workshop.flashcardUrl)}>
            <span className="learning-icon">
              <ScrollText aria-hidden="true" />
            </span>
            <div>
              <b>{workshop.title || `Workshop ${index + 1}`}</b>
              <div className="mini-note">{workshop.description || "Xem lại tài liệu học tập của workshop"}</div>
            </div>
            <span className="status wait">Xem</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function getWorkshopName(workshops: Workshop[], workshopId: string) {
  const workshop = workshops.find((item) => item.id === workshopId);
  return workshop?.title || workshopId || "Mini Challenge";
}

function getChallengeStatus(day: number, currentDay: number, completedDays: number[]) {
  if (completedDays.includes(day)) return "Hoàn thành";
  if (day < currentDay) return "Đã qua";
  if (day === currentDay) return "Hôm nay";
  return "Chưa mở";
}

function getChallengeForDay(challenges: Challenge[] | undefined, day: number) {
  return (
    challenges?.find((challenge) => challenge.day === day) || {
      id: "",
      workshopId: "",
      day,
      title: fallbackChallengeDays[day - 1] || "Quan sát phản ứng của bản thân",
      description: "",
      instruction: "",
      status: "Active",
    }
  );
}

export function ProfileScreen({
  student = fallbackStudent,
  reportLoading = false,
  reportReady = false,
  showReportCard = true,
  onGo,
  onLogout,
}: {
  student?: Student;
  reportLoading?: boolean;
  reportReady?: boolean;
  showReportCard?: boolean;
  onGo: (screen: Screen) => void;
  onLogout: () => void;
}) {
  const leadershipReportUrl = `https://ldkt-instructor-dashboard.vercel.app/?report=${encodeURIComponent(student.id)}`;

  return (
    <section>
      <PageTitle title="Hồ sơ" action="Home" onClick={() => onGo("home")} />
      <div className="card">
        <div className="hello">
          <div>
            <p>Mã học viên</p>
            <h1>{student.id}</h1>
          </div>
          <div className="avatar">{student.initials}</div>
        </div>
        <p>
          <b>Họ tên:</b> {student.name}
        </p>
      </div>
      {showReportCard && student.reportUrl && reportReady ? (
        <div className="card report-link-card">
          <div>
            <span className="tag">Leadership Assessment</span>
            <h3>Leadership Assessment</h3>
            <p className="muted">Báo cáo từ tự đánh giá và góc nhìn từ người khác.</p>
          </div>
          <a className="btn primary" href={student.reportUrl} target="_blank" rel="noreferrer">
            Mở báo cáo
          </a>
        </div>
      ) : showReportCard ? (
        <div className="card report-link-card">
          <div>
            <span className="tag">Leadership Assessment</span>
            <h3>Leadership Assessment</h3>
            <p className="muted">
              {reportReady
                ? "Báo cáo Leadership Assessment của bạn đã sẵn sàng."
                : reportLoading
                  ? "Đang kiểm tra trạng thái báo cáo của bạn."
                  : "Báo cáo sẽ có sau khi bạn hoàn thành đánh giá và chương trình mở báo cáo."}
            </p>
          </div>
          {reportReady ? (
            <a className="btn primary" href={leadershipReportUrl} target="_blank" rel="noreferrer">
              Xem báo cáo
            </a>
          ) : (
            <button className="btn primary" disabled>
              Đang tổng hợp
            </button>
          )}
        </div>
      ) : null}
      <button className="btn ghost logout-button" onClick={onLogout}>
        Đăng xuất / Đổi tài khoản
      </button>
    </section>
  );
}

export function LeadershipReportScreen({
  student = fallbackStudent,
  questions = [],
  answers = [],
  evaluations = [],
  onGo,
}: {
  student?: Student;
  questions?: EvaluationQuestion[];
  answers?: EvaluationAnswerRecord[];
  evaluations?: EvaluationRecord[];
  onGo: (screen: Screen) => void;
}) {
  const report = useMemo(() => buildScenarioReport(questions, answers, evaluations), [answers, evaluations, questions]);

  return (
    <section>
      <PageTitle title="Leadership Assessment" action="Hồ sơ" onClick={() => onGo("profile")} />
      <div className="card leadership-summary-card">
        <span className="tag">Leadership Assessment</span>
        <h2>{student.name}</h2>
        <p className="muted">Tổng hợp từ tự đánh giá và các lượt đánh giá từ người khác.</p>
        <div className="report-score-grid report-metric-grid">
          <div>
            <b>{report.selfCreativeRate}%</b>
            <span>Tự đánh giá</span>
          </div>
          <div>
            <b>{report.peerCreativeRate}%</b>
            <span>Người khác đánh giá</span>
          </div>
          <div>
            <b>{report.peerRespondentCount}</b>
            <span>Lượt đánh giá</span>
          </div>
        </div>
      </div>
      {report.ready ? (
        <>
          <div className="card leadership-report-card report-guide-card">
            <h3>Cách đọc báo cáo</h3>
            <div className="report-guide-grid">
              <div>
                <CheckCircle2 />
                <b>Không phán xét bản thân</b>
                <span>Kết quả phản ánh xu hướng trong tình huống cụ thể.</span>
              </div>
              <div>
                <Star />
                <b>Quan sát khác biệt</b>
                <span>So sánh góc nhìn của bạn và người khác để thấy điểm mù.</span>
              </div>
              <div>
                <Target />
                <b>Chọn một hành động nhỏ</b>
                <span>Ưu tiên 1-2 insight có ý nghĩa nhất để thực hành.</span>
              </div>
            </div>
            <div className="report-legend">
              <span><i className="legend-reactive" /> Phản ứng</span>
              <span><i className="legend-creative" /> Sáng tạo</span>
              <span><i className="legend-alignment" /> Tương đồng</span>
            </div>
          </div>
          <div className="card leadership-report-card">
            <h3>3 khía cạnh lãnh đạo</h3>
            <div className="dimension-report-list">
              {report.dimensions.map((dimension) => {
                const DimensionIcon = reportDimensionIcons[dimension.id] || Target;

                return (
                  <div className="dimension-report-item" key={dimension.id}>
                    <div className="dimension-report-head">
                      <span className="dimension-report-icon">
                        <DimensionIcon />
                      </span>
                      <div>
                        <b>{dimension.title}</b>
                        <small>{dimension.note}</small>
                      </div>
                    </div>
                    <div className="dimension-bars">
                      <span className="spectrum-bar">
                        <strong>Tự đánh giá</strong>
                        <i style={{ left: `${dimension.selfCreativeRate}%` }} />
                        <em>{dimension.selfCreativeRate}%</em>
                      </span>
                      <span className="spectrum-bar">
                        <strong>Người khác đánh giá</strong>
                        <i style={{ left: `${dimension.peerCreativeRate}%` }} />
                        <em>{dimension.peerCreativeRate}%</em>
                      </span>
                      <div className="alignment-row">
                        <div className="alignment-donut" style={{ background: `conic-gradient(var(--green) ${dimension.alignmentRate * 3.6}deg, #e5eeea 0deg)` }}>
                          <b>{dimension.alignmentRate}%</b>
                        </div>
                        <span>
                          <strong>Mức độ tương đồng</strong>
                          <small>Số lượt người khác chọn giống bạn trên tổng lượt đánh giá.</small>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card leadership-report-card">
            <h3>Tình huống cần chiêm nghiệm</h3>
            <div className="report-highlight-list">
              {report.highlights.map((item) => (
                <div className={`report-highlight ${item.tone}`} key={item.questionId}>
                  <small>Câu {item.order} · {item.dimensionTitle}</small>
                  <b>{item.title}</b>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          {report.openFeedbackGroups.length ? (
            <div className="card leadership-report-card open-feedback-card">
              <h3>Phản hồi mở từ người khác</h3>
              <p className="muted">Các góp ý được nhóm theo từng câu hỏi trong form mời người khác đánh giá.</p>
              <div className="open-feedback-list">
                {report.openFeedbackGroups.map((group) => (
                  <div className="open-feedback-group" key={`${group.questionId}-${group.order}`}>
                    <div className="open-feedback-question">
                      <ScrollText />
                      <div>
                        <small>Câu {group.order}</small>
                        <b>{group.question}</b>
                      </div>
                      <span>{group.answers.length} phản hồi</span>
                    </div>
                    <div className="open-feedback-answers">
                      {group.answers.map((answer, index) => (
                        <blockquote key={answer.id || `${group.questionId}-${index}`}>
                          <small>Phản hồi {index + 1}</small>
                          <p>{answer.text}</p>
                        </blockquote>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            Cần có tự đánh giá và ít nhất một lượt đánh giá từ người khác để tạo báo cáo.
          </div>
        </div>
      )}
    </section>
  );
}

const reportDimensions = [
  { id: "being", title: "Tôi hiện diện thế nào", note: "Cách giữ bình tĩnh, lắng nghe và hiện diện trong tình huống khó." },
  { id: "relating", title: "Tôi kết nối ra sao", note: "Cách xây dựng kết nối, phản hồi và phối hợp với người khác." },
  { id: "achieving", title: "Tôi đạt mục tiêu bằng cách nào", note: "Cách theo đuổi mục tiêu, ra quyết định và tạo kết quả chung." },
];

const reportDimensionIcons: Record<string, LucideIcon> = {
  being: UserRound,
  relating: UsersRound,
  achieving: Target,
};

function buildScenarioReport(
  questions: EvaluationQuestion[],
  answers: EvaluationAnswerRecord[],
  evaluations: EvaluationRecord[],
) {
  const responseMeta = new Map(
    evaluations.map((evaluation) => [
      normalizeCompletionKey(evaluation.id),
      {
        templateId: normalizeCompletionKey(evaluation.templateId || ""),
        respondentType: normalizeCompletionKey(evaluation.respondentType || ""),
      },
    ]),
  );
  const scenarioQuestions = questions
    .filter((question) => question.type === "single_choice" && question.options.length >= 2)
    .map((question) => ({
      ...question,
      dimensionId: getScenarioDimension(question),
    }))
    .filter((question) => Boolean(question.dimensionId))
    .sort((a, b) => a.order - b.order);
  const questionByKey = new Map<string, (typeof scenarioQuestions)[number]>();
  scenarioQuestions.forEach((question) => {
    questionByKey.set(normalizeCompletionKey(question.id), question);
    questionByKey.set(`order-${question.order}`, question);
  });

  const rows = scenarioQuestions.map((question) => {
    const relatedAnswers = answers.filter((answer) => {
      const answerQuestion = questionByKey.get(normalizeCompletionKey(answer.questionId));
      const answerOrder = getQuestionOrder(answer.questionId);
      return answerQuestion?.order === question.order || answerOrder === question.order;
    });
    const selfAnswers = relatedAnswers.filter((answer) => isSelfScenarioAnswer(answer, responseMeta));
    const peerAnswers = relatedAnswers.filter((answer) => isPeerScenarioAnswer(answer, responseMeta));
    const selfValue = normalizeReportAnswer(selfAnswers[selfAnswers.length - 1]?.value || "");
    const peerCreative = peerAnswers.filter((answer) => normalizeReportAnswer(answer.value) === "creative").length;
    const peerReactive = peerAnswers.filter((answer) => normalizeReportAnswer(answer.value) === "reactive").length;
    const peerTotal = peerCreative + peerReactive;
    const peerSame = selfValue ? peerAnswers.filter((answer) => normalizeReportAnswer(answer.value) === selfValue).length : 0;
    const alignment = peerTotal ? Math.round((peerSame / peerTotal) * 100) : 0;

    return {
      questionId: question.id,
      order: question.order,
      title: question.text,
      dimensionId: question.dimensionId,
      selfValue,
      peerCreative,
      peerReactive,
      peerTotal,
      peerSame,
      alignment,
    };
  });
  const dimensions = reportDimensions.map((dimension) => {
    const dimensionRows = rows.filter((row) => row.dimensionId === dimension.id);
    const selfAnswered = dimensionRows.filter((row) => row.selfValue).length;
    const selfCreative = dimensionRows.filter((row) => row.selfValue === "creative").length;
    const peerTotal = dimensionRows.reduce((sum, row) => sum + row.peerTotal, 0);
    const peerCreative = dimensionRows.reduce((sum, row) => sum + row.peerCreative, 0);
    const peerSame = dimensionRows.reduce((sum, row) => sum + row.peerSame, 0);

    return {
      ...dimension,
      selfCreativeRate: selfAnswered ? Math.round((selfCreative / selfAnswered) * 100) : 0,
      peerCreativeRate: peerTotal ? Math.round((peerCreative / peerTotal) * 100) : 0,
      alignmentRate: peerTotal ? Math.round((peerSame / peerTotal) * 100) : 0,
    };
  });
  const selfAnswered = rows.filter((row) => row.selfValue).length;
  const selfCreative = rows.filter((row) => row.selfValue === "creative").length;
  const peerTotal = rows.reduce((sum, row) => sum + row.peerTotal, 0);
  const peerCreative = rows.reduce((sum, row) => sum + row.peerCreative, 0);
  const peerSame = rows.reduce((sum, row) => sum + row.peerSame, 0);
  const peerRespondentCount = getPeerRespondentCount(answers, evaluations, responseMeta);
  const highlights = rows
    .filter((row) => row.selfValue && row.peerTotal)
    .map((row) => {
      const dimensionTitle = reportDimensions.find((dimension) => dimension.id === row.dimensionId)?.title || "";
      const selfLabel = row.selfValue === "creative" ? "sáng tạo" : "phản ứng";
      const tone = row.alignment >= 80 ? (row.selfValue === "creative" ? "good" : "watch") : row.alignment < 40 ? "gap" : "neutral";
      const description =
        tone === "good"
          ? `Bạn và người khác cùng nhìn thấy xu hướng ${selfLabel}. Đây là điểm có thể tiếp tục phát huy.`
          : tone === "watch"
            ? `Người khác cũng thấy xu hướng ${selfLabel}. Đây là tình huống nên ưu tiên quan sát và luyện tập.`
            : tone === "gap"
              ? "Góc nhìn của bạn và người khác đang khác nhau khá nhiều. Nên đọc kỹ phản hồi mở để hiểu thêm."
              : "Góc nhìn của bạn và người khác có một phần tương đồng, một phần khác biệt.";

      return {
        questionId: row.questionId,
        order: row.order,
        dimensionTitle,
        title: row.title,
        tone,
        description,
      };
    })
    .sort((a, b) => {
      const toneOrder = { watch: 1, gap: 2, good: 3, neutral: 4 };
      return toneOrder[a.tone as keyof typeof toneOrder] - toneOrder[b.tone as keyof typeof toneOrder] || a.order - b.order;
    })
    .slice(0, 5);
  const openFeedbackGroups = buildOpenPeerFeedbackGroups(questions, answers, evaluations, responseMeta);

  return {
    ready: Boolean(selfAnswered && peerTotal),
    selfCreativeRate: selfAnswered ? Math.round((selfCreative / selfAnswered) * 100) : 0,
    peerCreativeRate: peerTotal ? Math.round((peerCreative / peerTotal) * 100) : 0,
    alignmentRate: peerTotal ? Math.round((peerSame / peerTotal) * 100) : 0,
    peerRespondentCount,
    dimensions,
    highlights,
    openFeedbackGroups,
  };
}

function buildOpenPeerFeedbackGroups(
  questions: EvaluationQuestion[],
  answers: EvaluationAnswerRecord[],
  evaluations: EvaluationRecord[],
  responseMeta: Map<string, { templateId: string; respondentType: string }>,
) {
  const textQuestions = questions
    .filter((question) => question.type === "text" && isOpenPeerQuestion(question))
    .sort((a, b) => a.order - b.order);

  const questionByKey = new Map<string, (typeof textQuestions)[number]>();
  const questionByOrder = new Map<number, (typeof textQuestions)[number]>();
  textQuestions.forEach((question) => {
    const key = normalizeCompletionKey(question.id);
    if (key && !questionByKey.has(key)) questionByKey.set(key, question);
    if (!questionByOrder.has(question.order)) questionByOrder.set(question.order, question);
  });

  const groups = new Map<
    string,
    {
      questionId: string;
      order: number;
      question: string;
      answers: { id: string; text: string; responseId: string; updatedAt: string }[];
    }
  >();

  const addFeedbackAnswer = (
    question: { id: string; order: number; text: string },
    answer: EvaluationAnswerRecord | { id: string; responseId: string; value: string; createdAt?: string; updatedAt?: string },
    fallbackKey?: string,
  ) => {
    const groupKey = `${question.order}-${normalizeCompletionKey(question.id) || fallbackKey || normalizeCompletionKey(question.text)}`;
    const existing = groups.get(groupKey) || {
      questionId: question.id || groupKey,
      order: question.order,
      question: question.text,
      answers: [],
    };
    const text = answer.value.trim();
    const uniqueKey = `${answer.id || ""}-${answer.responseId || ""}-${text}`;
    if (
      !existing.answers.some(
        (item) => `${item.id || ""}-${item.responseId || ""}-${item.text}` === uniqueKey,
      )
    ) {
      existing.answers.push({
        id: answer.id,
        text,
        responseId: answer.responseId,
        updatedAt: answer.updatedAt || answer.createdAt || "",
      });
    }
    groups.set(groupKey, existing);
  };

  const answersByResponse = new Map<string, EvaluationAnswerRecord[]>();
  answers
    .filter((answer) => answer.value.trim() && isPeerScenarioAnswer(answer, responseMeta))
    .filter((answer) => {
      const value = answer.value.trim();
      return value.length >= 1 && !normalizeReportAnswer(value) && Number.isNaN(Number(value));
    })
    .forEach((answer) => {
      const responseId = normalizeCompletionKey(answer.responseId) || "__unknown__";
      const items = answersByResponse.get(responseId) || [];
      items.push(answer);
      answersByResponse.set(responseId, items);
    });

  answersByResponse.forEach((items) => {
    const sortedItems = items.sort((a, b) => {
      const orderDiff = getQuestionOrder(a.questionId) - getQuestionOrder(b.questionId);
      if (orderDiff) return orderDiff;
      return (a.updatedAt || a.createdAt || "").localeCompare(b.updatedAt || b.createdAt || "");
    });
    const questionIdCountsInResponse = new Map<string, number>();
    sortedItems.forEach((answer) => {
      const answerQuestionKey = normalizeCompletionKey(answer.questionId);
      if (!answerQuestionKey) return;
      questionIdCountsInResponse.set(answerQuestionKey, (questionIdCountsInResponse.get(answerQuestionKey) || 0) + 1);
    });

    sortedItems.forEach((answer, index) => {
      const answerQuestionKey = normalizeCompletionKey(answer.questionId);
      const answerOrder = getQuestionOrder(answer.questionId);
      const idIsUniqueInResponse = questionIdCountsInResponse.get(answerQuestionKey) === 1;
      const question =
        (idIsUniqueInResponse && answerOrder ? questionByOrder.get(answerOrder) : undefined) ||
        textQuestions[index] ||
        (idIsUniqueInResponse ? questionByKey.get(answerQuestionKey) : undefined);

      if (question) {
        addFeedbackAnswer(question, answer);
        return;
      }

      addFeedbackAnswer(
        {
          id: answer.questionId || `peer-open-${index + 1}`,
          order: 100 + index,
          text: "Phản hồi mở từ người khác",
        },
        answer,
        `fallback-${index}`,
      );
    });
  });

  const feedbackAnswers = evaluations
    .filter((evaluation) => {
      const templateKey = normalizeCompletionKey(evaluation.templateId || "");
      const respondentKey = normalizeCompletionKey(evaluation.respondentType || "");
      return (
        evaluation.feedback.trim() &&
        (respondentKey === "peer" || templateKey.includes("peer") || templateKey.includes("other")) &&
        !normalizeReportAnswer(evaluation.feedback.trim()) &&
        Number.isNaN(Number(evaluation.feedback.trim()))
      );
    })
    .map((evaluation) => ({
      id: evaluation.id,
      value: evaluation.feedback.trim(),
      responseId: evaluation.id,
      updatedAt: evaluation.updatedAt,
    }));

  feedbackAnswers.forEach((answer, index) => {
    addFeedbackAnswer(
      {
        id: "general-peer-feedback",
        order: 200 + index,
        text: "Phản hồi mở từ người khác",
      },
      answer,
      `evaluation-feedback-${index}`,
    );
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      answers: group.answers.sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || "")),
    }))
    .sort((a, b) => a.order - b.order);
}

function isOpenPeerQuestion(question: EvaluationQuestion) {
  const templateKey = normalizeCompletionKey(question.templateId);
  const dimensionKey = normalizeCompletionKey(question.dimension);

  return (
    templateKey.includes("peer") ||
    templateKey.includes("other") ||
    dimensionKey.includes("strength") ||
    dimensionKey.includes("improvement") ||
    dimensionKey.includes("observation") ||
    question.order > 30
  );
}

function getQuestionOrder(questionId: string) {
  const match = String(questionId || "").match(/Q(\d+)$/i);
  return match ? Number(match[1]) || 0 : 0;
}

function getScenarioDimension(question: EvaluationQuestion) {
  const key = normalizeCompletionKey(question.dimension);
  if (key.includes("being") || key.includes("presence") || key.includes("hien-dien")) return "being";
  if (key.includes("relating") || key.includes("connect") || key.includes("ket-noi")) return "relating";
  if (key.includes("achieving") || key.includes("goal") || key.includes("muc-tieu")) return "achieving";
  if (question.order <= 10) return "being";
  if (question.order <= 20) return "relating";
  if (question.order <= 30) return "achieving";
  return "";
}

function isSelfScenarioAnswer(
  answer: EvaluationAnswerRecord,
  responseMeta: Map<string, { templateId: string; respondentType: string }>,
) {
  const meta = responseMeta.get(normalizeCompletionKey(answer.responseId));
  const templateKey = normalizeCompletionKey(answer.templateId || meta?.templateId || "");
  const respondentKey = normalizeCompletionKey(meta?.respondentType || "");
  return respondentKey === "self" || templateKey.includes("self-before") || templateKey.includes("self-common");
}

function getPeerRespondentCount(
  answers: EvaluationAnswerRecord[],
  evaluations: EvaluationRecord[],
  responseMeta: Map<string, { templateId: string; respondentType: string }>,
) {
  const responseIds = new Set(
    evaluations
      .filter(isPeerEvaluationRecord)
      .map((evaluation) => normalizeCompletionKey(evaluation.id))
      .filter(Boolean),
  );

  if (responseIds.size) return responseIds.size;

  return new Set(
    answers
      .filter((answer) => isPeerScenarioAnswer(answer, responseMeta))
      .map((answer) => normalizeCompletionKey(answer.responseId || answer.id))
      .filter(Boolean),
  ).size;
}

function isPeerEvaluationRecord(evaluation: EvaluationRecord) {
  const templateKey = normalizeCompletionKey(evaluation.templateId || "");
  const respondentKey = normalizeCompletionKey(evaluation.respondentType || "");
  return (
    respondentKey === "peer" ||
    respondentKey.includes("other") ||
    templateKey.includes("peer") ||
    templateKey.includes("other") ||
    templateKey.includes("360")
  );
}

function isPeerScenarioAnswer(
  answer: EvaluationAnswerRecord,
  responseMeta: Map<string, { templateId: string; respondentType: string }>,
) {
  const meta = responseMeta.get(normalizeCompletionKey(answer.responseId));
  const templateKey = normalizeCompletionKey(answer.templateId || meta?.templateId || "");
  const respondentKey = normalizeCompletionKey(meta?.respondentType || "");
  return respondentKey === "peer" || templateKey.includes("peer") || templateKey.includes("other");
}

function normalizeReportAnswer(value: string) {
  const key = normalizeScenarioKey(value);
  if (key.startsWith("reactive") || key.startsWith("phanung")) return "reactive";
  if (key.startsWith("creative") || key.startsWith("sangtao")) return "creative";
  return "";
}

type LeaderboardEntry = {
  id: string;
  name: string;
  rank: number;
  xp: number;
  note: string;
  isCurrent?: boolean;
};

const leadershipReport = {
  self: [3, 2.7, 2.7],
  peer: [3.8, 3.4, 3.1],
};

function getCurrentUserXp(
  student: Student,
  users: LeaderboardUser[] = [],
  fallback: { completedDaysCount: number; currentWorkshopIndex: number; evaluationSubmitted: boolean },
) {
  const currentUser = users.find((item) => item.id === student.id);
  if (currentUser && typeof currentUser.xp === "number") return currentUser.xp;

  const checkinXp = fallback.completedDaysCount * 20;
  const evaluationXp = fallback.evaluationSubmitted ? 20 : 0;

  return checkinXp + evaluationXp;
}

function normalizeCohortKey(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function getDashboardLeaderboard(student: Student, currentXp: number, users: LeaderboardUser[] = []): LeaderboardEntry[] {
  const currentCohort = normalizeCohortKey(student.batch);
  const cohortUsers =
    users.length && currentCohort ? users.filter((item) => normalizeCohortKey(item.batch) === currentCohort) : users;
  const sheetUsers = cohortUsers.some((item) => item.id === student.id) ? cohortUsers : users;
  const hasSheetUsers = sheetUsers.length > 0;
  const hasSheetRank = sheetUsers.some((item) => typeof item.rank === "number" && item.rank > 0);
  const source = sheetUsers.length
    ? sheetUsers
    : users.length
    ? users
    : [
        { id: "LDKT019", name: "Trần Thị Ngọc Thảo", initials: "NT", batch: "K12", currentWorkshopIndex: 3, status: "Active" },
        { id: student.id, name: student.name, initials: student.initials, batch: student.batch, currentWorkshopIndex: 3, status: "Active" },
        { id: "LDKT020", name: "Trần Min Chan", initials: "MC", batch: "K12", currentWorkshopIndex: 3, status: "Active" },
      ];
  const ranked = source
    .filter((item) => item.status.toLowerCase() !== "inactive")
    .map((item, index) => {
      const isCurrent = item.id === student.id;
      const baseXp = Math.max(0, item.currentWorkshopIndex - 1 || 0) * 80;
      const steadyBonus = Math.max(0, 45 - index * 15);
      const xp = hasSheetUsers
        ? item.xp || 0
        : isCurrent
          ? Math.max(baseXp, Math.round(currentXp))
          : baseXp + steadyBonus;

      return {
        id: item.id,
        name: item.name,
        sourceIndex: index,
        rank: 0,
        xp,
        note: isCurrent ? "Hạng của bạn" : `${item.batch || "Học viên"} · WS${item.currentWorkshopIndex || 1}`,
        isCurrent,
      };
    })
    .sort((a, b) => {
      if (hasSheetRank) {
        const userA = source.find((item) => item.id === a.id);
        const userB = source.find((item) => item.id === b.id);
        return (userA?.rank || 9999) - (userB?.rank || 9999) || b.xp - a.xp || a.sourceIndex - b.sourceIndex;
      }

      return b.xp - a.xp || a.sourceIndex - b.sourceIndex;
    });
  const withRank = ranked.map((entry, index) => ({ ...entry, rank: index + 1 }));
  const visible = withRank.slice(0, 3);
  const current = withRank.find((entry) => entry.isCurrent);

  if (current && !visible.some((entry) => entry.id === current.id)) {
    return [...visible.slice(0, 2), current];
  }

  return visible;
}

function getProfileLeaderboard(student: Student, currentXp: number): LeaderboardEntry[] {
  return [
    { id: "LDKT019", name: "Trần Thị Ngọc Thảo", rank: 1, xp: Math.max(560, currentXp + 80), note: "Dẫn đầu K12" },
    {
      id: student.id,
      name: student.name,
      rank: 2,
      xp: Math.max(520, currentXp),
      note: "Hạng của bạn",
      isCurrent: true,
    },
    { id: "LDKT020", name: "Trần Min Chan", rank: 3, xp: Math.max(470, currentXp - 45), note: "Bám sát mục tiêu" },
  ];
}

function LeadershipReportCard() {
  const selfPoints = getRadarPoints(leadershipReport.self);
  const peerPoints = getRadarPoints(leadershipReport.peer);
  const axisPoints = getRadarPoints([5, 5, 5]).split(" ");

  return (
    <div className="card leadership-card" style={{ overflow: "hidden" }}>
      <div className="profile-section-heading" style={{ alignItems: "flex-start", display: "flex", gap: 12, justifyContent: "space-between" }}>
        <div>
          <span className="tag">Báo cáo lãnh đạo</span>
          <h3>3 khía cạnh lãnh đạo</h3>
        </div>
        <Star style={{ background: "#fff7dc", borderRadius: 16, color: "#d0aa3f", height: 44, padding: 10, width: 44 }} />
      </div>
      <p className="muted">So sánh góc nhìn của bạn và người khác sau khi hoàn thành đánh giá.</p>
      <EvaluationSummaryCard />
      <div className="radar-legend" style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", margin: "12px 0 2px" }}>
        <span style={{ alignItems: "center", color: "#70758f", display: "inline-flex", fontSize: 11, fontWeight: 850, gap: 6 }}>
          <i className="self" style={{ background: "#16826d", borderRadius: 999, display: "inline-block", height: 9, width: 9 }} /> Tự đánh giá
        </span>
        <span style={{ alignItems: "center", color: "#70758f", display: "inline-flex", fontSize: 11, fontWeight: 850, gap: 6 }}>
          <i className="peer" style={{ background: "#2167f3", borderRadius: 999, display: "inline-block", height: 9, width: 9 }} /> Người khác đánh giá
        </span>
      </div>
      <svg
        className="radar-chart"
        style={{ display: "block", height: "auto", margin: "6px auto 2px", maxWidth: 340, width: "100%" }}
        viewBox="0 0 320 280"
        role="img"
        aria-label="Sơ đồ radar 3 khía cạnh lãnh đạo"
      >
        {[1, 2, 3, 4, 5].map((level) => (
          <polygon
            className="radar-grid"
            fill="none"
            key={level}
            points={getRadarPoints([level, level, level])}
            stroke="#d9deea"
            strokeDasharray="3 4"
            strokeWidth="1"
          />
        ))}
        {axisPoints.map((point) => (
          <line
            className="radar-axis"
            key={point}
            stroke="#d9deea"
            strokeWidth="1"
            x1="160"
            y1="132"
            x2={point.split(",")[0]}
            y2={point.split(",")[1]}
          />
        ))}
        <polygon className="radar-area self" fill="#16826d" fillOpacity="0.12" points={selfPoints} />
        <polygon className="radar-area peer" fill="#2167f3" fillOpacity="0.12" points={peerPoints} />
        <polyline
          className="radar-line self"
          fill="none"
          points={`${selfPoints} ${selfPoints.split(" ")[0]}`}
          stroke="#16826d"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <polyline
          className="radar-line peer"
          fill="none"
          points={`${peerPoints} ${peerPoints.split(" ")[0]}`}
          stroke="#2167f3"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        {leadershipReport.self.map((score, index) => {
          const point = getRadarPoint(score, index);
          return (
            <g key={`self-${index}`}>
              <circle className="radar-dot self" cx={point.x} cy={point.y} fill="#16826d" r="4" />
              <text className="radar-score self" fill="#16826d" x={point.x - 8} y={point.y + 18}>
                {score.toFixed(1)}
              </text>
            </g>
          );
        })}
        {leadershipReport.peer.map((score, index) => {
          const point = getRadarPoint(score, index);
          return (
            <g key={`peer-${index}`}>
              <circle className="radar-dot peer" cx={point.x} cy={point.y} fill="#2167f3" r="4" />
              <text className="radar-score peer" fill="#2167f3" x={point.x + 6} y={point.y - 6}>
                {score.toFixed(1)}
              </text>
            </g>
          );
        })}
        <text className="radar-label top" fill="#0d132b" textAnchor="middle" x="160" y="18">
          Tôi hiện diện
        </text>
        <text className="radar-label right" fill="#0d132b" textAnchor="middle" x="252" y="198">
          Tôi kết nối
        </text>
        <text className="radar-label left" fill="#0d132b" textAnchor="middle" x="68" y="198">
          Tôi đạt mục tiêu
        </text>
      </svg>
      <div
        className="radar-insight"
        style={{
          alignItems: "flex-start",
          background: "#f7fafc",
          border: "1px solid #e7edf3",
          borderRadius: 18,
          display: "flex",
          gap: 10,
          padding: 12,
        }}
      >
        <Star style={{ color: "#16826d", flex: "0 0 auto", height: 20, width: 20 }} />
        <p style={{ margin: 0 }}>
          <b style={{ display: "block", fontSize: 12, lineHeight: 1.35 }}>Người khác đánh giá bạn cao hơn ở cả 3 khía cạnh.</b>
          <span style={{ color: "#70758f", display: "block", fontSize: 12, lineHeight: 1.35, marginTop: 3 }}>
            Bạn có tiềm năng phát triển rất tốt. Hãy tiếp tục phát huy và tự tin hơn vào bản thân.
          </span>
        </p>
      </div>
    </div>
  );
}

function EvaluationSummaryCard() {
  const cards = [
    {
      title: "Tự đánh giá",
      stage: "Vùng chuyển tiếp",
      score: "3,0",
      note: "Bạn đang chuyển từ phản ứng quen thuộc sang lựa chọn có chủ đích hơn.",
      icon: UserRound,
      color: "#16826d",
      bg: "#e3f5ef",
    },
    {
      title: "Người khác đánh giá",
      stage: "Xu hướng sáng tạo",
      score: "3,4",
      note: "Người khác nhìn thấy tiềm năng chủ động và linh hoạt của bạn rõ hơn.",
      icon: UsersRound,
      color: "#2167f3",
      bg: "#edf3ff",
    },
  ];

  return (
    <div
      className="evaluation-summary"
      style={{
        margin: "14px 0 10px",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              background: "#fff",
              border: "1px solid #e7edf3",
              borderRadius: 18,
              boxShadow: "0 10px 24px rgba(22, 23, 45, 0.06)",
              minWidth: 0,
              padding: 14,
            }}
          >
            <div style={{ alignItems: "center", display: "flex", gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  alignItems: "center",
                  background: card.bg,
                  borderRadius: 14,
                  color: card.color,
                  display: "flex",
                  height: 36,
                  justifyContent: "center",
                  width: 36,
                }}
              >
                <card.icon aria-hidden="true" style={{ height: 20, width: 20 }} />
              </span>
              <b style={{ color: card.color, display: "block", fontSize: 13, lineHeight: 1.2 }}>{card.title}</b>
            </div>
            <small style={{ color: "#70758f", display: "block", fontSize: 11, fontWeight: 800, marginBottom: 7 }}>
              Giai đoạn của bạn
            </small>
            <strong
              style={{
                background: card.bg,
                borderRadius: 999,
                color: card.color,
                display: "inline-flex",
                fontSize: 12,
                lineHeight: 1.2,
                padding: "7px 10px",
              }}
            >
              {card.stage}
            </strong>
            <div style={{ color: "#0d132b", fontSize: 24, fontWeight: 950, marginTop: 12 }}>{card.score}</div>
            <p style={{ color: "#70758f", fontSize: 11, fontWeight: 700, lineHeight: 1.35, margin: "5px 0 0" }}>{card.note}</p>
          </div>
        ))}
      </div>
      <div
        style={{
          background: "#f7fafc",
          border: "1px solid #e7edf3",
          borderRadius: 16,
          color: "#70758f",
          fontSize: 12,
          fontWeight: 750,
          lineHeight: 1.4,
          marginTop: 14,
          padding: 12,
        }}
      >
        Góc nhìn bên ngoài đang cao hơn tự đánh giá, nên phần phát triển tiếp theo là ghi nhận điểm mạnh và thử hành động chủ động hơn trong các tình huống thật.
      </div>
    </div>
  );
}

function getRadarPoints(values: number[]) {
  return values
    .map((value, index) => {
      const point = getRadarPoint(value, index);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

function getRadarPoint(value: number, index: number) {
  const angles = [-90, 30, 150];
  const centerX = 160;
  const centerY = 132;
  const radius = (Math.max(0, Math.min(value, 5)) / 5) * 96;
  const angle = (angles[index] * Math.PI) / 180;

  return {
    x: Number((centerX + Math.cos(angle) * radius).toFixed(2)),
    y: Number((centerY + Math.sin(angle) * radius).toFixed(2)),
  };
}
