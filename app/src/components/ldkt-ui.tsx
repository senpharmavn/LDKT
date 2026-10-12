import type { ElementType } from "react";
import {
  Bell,
  Check,
  CircleAlert,
  ClipboardCheck,
  Library,
  Home,
  Map,
  Route,
  UserRound,
} from "lucide-react";
import { student as fallbackStudent } from "@/data/mock";
import type { Screen, Student, Workshop } from "@/types/ldkt";

export function TopBar({
  notificationCount = 0,
  onNotificationsClick,
}: {
  notificationCount?: number;
  onNotificationsClick?: () => void;
}) {
  return (
    <header className="top">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <img src="/sen-lotus-icon.png" alt="" />
        </span>
        <div>
          <b>Lãnh Đạo Khai Tâm</b>
          <span>SEN Pharma · Learning Journey</span>
        </div>
      </div>
      <div className="top-actions">
        <button className="notify-button" onClick={onNotificationsClick} title="Việc cần làm hôm nay">
          <Bell aria-hidden="true" />
          {notificationCount > 0 ? <span>{notificationCount}</span> : null}
        </button>
      </div>
    </header>
  );
}

export function BottomNav({ active, onGo }: { active: Screen; onGo: (screen: Screen) => void }) {
  const items: { label: string; screen: Screen; icon: ElementType }[] = [
    { label: "Home", screen: "home", icon: Home },
    { label: "Hành trình", screen: "journey", icon: Route },
    { label: "Đánh giá", screen: "evaluate", icon: ClipboardCheck },
    { label: "Learning", screen: "learning", icon: Library },
    { label: "Hồ sơ", screen: "profile", icon: UserRound },
  ];

  return (
    <nav className="bottom" aria-label="Điều hướng chính">
      {items.map((item) => {
        const isActive =
          active === item.screen ||
          (active === "evaluationForm" && item.screen === "evaluate") ||
          ((active === "flashcards" || active === "insights" || active === "peerGroup" || active === "practice") &&
            item.screen === "learning") ||
          (active === "leadershipReport" && item.screen === "profile");

        return (
          <button className={isActive ? "active" : ""} key={item.screen} onClick={() => onGo(item.screen)}>
            <item.icon aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function StudentHello({ student = fallbackStudent }: { student?: Student }) {
  return (
    <div className="hello">
      <div>
        <p>Xin chào,</p>
        <h1>{student.name}</h1>
      </div>
      <div className="avatar">{student.initials}</div>
    </div>
  );
}

export function PageTitle({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return (
    <div className="section-title">
      {title}
      <button onClick={onClick}>{action}</button>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress" aria-label={`Tiến độ ${value}%`}>
      <i style={{ width: `${value}%` }} />
    </div>
  );
}

export function WorkshopLine({ workshops = [] }: { workshops?: Workshop[] }) {
  const workshopItems = workshops.length
    ? workshops.filter((item) => (item.order ?? 0) <= 7)
    : ["WS1", "WS2", "WS3", "WS4", "WS5", "WS6", "WS7"].map((label, index) => ({
        id: label,
        order: index + 1,
        title: label,
        description: "",
        status: index < 2 ? "done" : index === 2 ? "now" : "locked",
      }));

  return (
    <div className="workshop-line">
      {workshopItems.map((item, index) => {
        const label = `WS${item.order ?? index + 1}`;

        return (
        <div className={`ws-dot ${item.status}`} key={item.id || label}>
          <i />
          {label}
        </div>
        );
      })}
    </div>
  );
}

const MOUNTAIN_POINTS = [
  { x: 56, y: 130 },
  { x: 130, y: 103 },
  { x: 197, y: 77 },
  { x: 256, y: 50 },
  { x: 330, y: 32 },
];

const COMPACT_MOUNTAIN_POINTS = [
  { x: 50, y: 76 },
  { x: 126, y: 56 },
  { x: 200, y: 37 },
  { x: 270, y: 50 },
  { x: 340, y: 22 },
];

export function MountainPath({
  completed,
  completedDays,
  currentDay,
  total = 5,
  compact = false,
}: {
  completed: number;
  completedDays?: number[];
  currentDay?: number;
  total?: number;
  compact?: boolean;
}) {
  const viewBox = compact ? { width: 390, height: 96 } : { width: 390, height: 160 };
  const isLongChallenge = total > 10;
  const safeCompleted = Math.max(1, Math.min(completed, total));
  const safeCurrentDay = Math.max(1, Math.min(currentDay || completed, total));
  const completedSet = new Set(completedDays?.length ? completedDays : Array.from({ length: Math.max(0, completed - 1) }, (_, index) => index + 1));

  if (isLongChallenge) {
    const longViewBox = { width: 560, height: 190 };
    const longPoints = getLongChallengeNodePoints(total);
    const pathPoints = longPoints.map((point) => `${point.x},${point.y}`).join(" ");
    const completedPathPoints = longPoints
      .slice(0, safeCurrentDay)
      .map((point) => `${point.x},${point.y}`)
      .join(" ");
    const currentPoint = longPoints[safeCurrentDay - 1] || longPoints[0];

    return (
      <div className={`mountain mountain-long ${compact ? "checkin-mini-mountain" : ""}`}>
        <div className="mountain-route-inner">
        <div
          className="current-route-badge"
          style={{ left: `${(currentPoint.x / longViewBox.width) * 100}%`, top: `${Math.max(10, ((currentPoint.y - 48) / longViewBox.height) * 100)}%` }}
        >
          Bạn đang ở đây
        </div>
          <div
            className="route-avatar"
            style={{ left: `${(currentPoint.x / longViewBox.width) * 100}%`, top: `${Math.max(12, ((currentPoint.y - 36) / longViewBox.height) * 100)}%` }}
          >
            <UserRound aria-hidden="true" />
          </div>
        <svg className="long-map-line" viewBox="0 0 560 190" aria-hidden="true">
          <polyline className="long-map-track" points={pathPoints} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {completedPathPoints ? (
            <polyline className="long-map-progress" points={completedPathPoints} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
        </svg>
        {longPoints.map((point, index) => {
          const node = index + 1;

          return (
            <div
              className={`node long-node ${completedSet.has(node) ? "done" : node < safeCurrentDay ? "missed" : ""} ${node === safeCurrentDay ? "current" : ""} ${node === safeCurrentDay && !completedSet.has(node) ? "now" : ""} ${node === total ? "trophy" : ""}`}
              key={node}
              style={{ left: `${(point.x / longViewBox.width) * 100}%`, top: `${(point.y / longViewBox.height) * 100}%` }}
            >
              {node === safeCurrentDay ? <UserRound aria-hidden="true" /> : node}
            </div>
          );
        })}
        <div className="route-milestones" aria-hidden="true">
          <span style={{ left: `${(longPoints[Math.min(6, total - 1)].x / longViewBox.width) * 100}%` }}>Mốc 1</span>
          <span style={{ left: `${(longPoints[Math.min(13, total - 1)].x / longViewBox.width) * 100}%` }}>Mốc 2</span>
          <span style={{ left: `${(longPoints[total - 1].x / longViewBox.width) * 100}%` }}>Mốc 3</span>
        </div>
        </div>
      </div>
    );
  }

  const points = getMountainNodePoints(total, compact);

  return (
    <div className={`mountain ${compact ? "checkin-mini-mountain" : ""}`}>
      <div className="path">
        <svg viewBox={compact ? "0 0 390 96" : "0 0 390 160"} aria-hidden="true">
          <polyline
            points={compact ? "50,76 126,56 200,37 270,50 340,22" : "56,130 130,103 197,77 256,50 330,32"}
            fill="none"
            stroke="rgba(255,255,255,.95)"
            strokeLinecap="round"
            strokeWidth="5"
          />
        </svg>
      </div>
      {points.map((point, index) => {
        const node = index + 1;

        return (
        <div
          className={`node ${completedSet.has(node) ? "done" : node < safeCurrentDay ? "missed" : ""} ${node === safeCurrentDay ? "current" : ""} ${node === safeCurrentDay && !completedSet.has(node) ? "now" : ""} ${node === total ? "trophy" : ""}`}
          key={node}
          style={{ left: `${(point.x / viewBox.width) * 100}%`, top: `${(point.y / viewBox.height) * 100}%` }}
        >
          {node === safeCurrentDay ? <UserRound aria-hidden="true" /> : node}
        </div>
        );
      })}
    </div>
  );
}

function getMountainNodePoints(total: number, compact: boolean) {
  const source = compact ? COMPACT_MOUNTAIN_POINTS : MOUNTAIN_POINTS;
  const count = Math.max(1, total);

  if (count === 1) return [source[0]];

  return Array.from({ length: count }, (_, index) => {
    const sourceIndex = (index / (count - 1)) * (source.length - 1);
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(source.length - 1, Math.ceil(sourceIndex));
    const ratio = sourceIndex - leftIndex;
    const left = source[leftIndex];
    const right = source[rightIndex];

    return {
      x: left.x + (right.x - left.x) * ratio,
      y: left.y + (right.y - left.y) * ratio,
    };
  });
}

function getLongChallengeNodePoints(total: number) {
  const minX = 32;
  const maxX = 528;
  const startY = 128;
  const endY = 74;
  const source = Array.from({ length: Math.max(1, total) }, (_, index) => {
    const ratio = total === 1 ? 0 : index / (total - 1);
    const x = minX + (maxX - minX) * ratio;
    const climb = startY + (endY - startY) * ratio;
    const wave = Math.sin(ratio * Math.PI * 3.4) * 13;

    return { x, y: climb + wave };
  });

  if (total === source.length) return source;

  return Array.from({ length: total }, (_, index) => {
    const sourceIndex = total === 1 ? 0 : (index / (total - 1)) * (source.length - 1);
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(source.length - 1, Math.ceil(sourceIndex));
    const ratio = sourceIndex - leftIndex;
    const left = source[leftIndex];
    const right = source[rightIndex];

    return {
      x: left.x + (right.x - left.x) * ratio,
      y: left.y + (right.y - left.y) * ratio,
    };
  });
}

export function Kpi({
  value,
  label,
  icon: Icon,
  tone = "green",
}: {
  value: string;
  label: string;
  icon?: ElementType;
  tone?: "green" | "gold" | "purple";
}) {
  return (
    <div className={`kpi ${tone}`}>
      {Icon ? (
        <span className="kpi-icon">
          <Icon aria-hidden="true" />
        </span>
      ) : null}
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export function TodayItem({
  title,
  note,
  done,
  waiting = false,
  onClick,
}: {
  title: string;
  note: string;
  done: boolean;
  waiting?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="check">{done ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}</span>
      <div>
        <b>{title}</b>
        <div className="mini-note">{note}</div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button className={`today-item today-item-button ${waiting ? "wait" : ""}`} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <div className={`today-item ${waiting ? "wait" : ""}`}>
      {content}
    </div>
  );
}

export function ListRow({
  title,
  note,
  status,
  waiting = false,
}: {
  title: string;
  note: string;
  status: string;
  waiting?: boolean;
}) {
  return (
    <div className="list-row">
      <div>
        <b>{title}</b>
        <div className="mini-note">{note}</div>
      </div>
      <span className={`status ${waiting ? "wait" : ""}`}>
        {waiting ? <Map aria-hidden="true" /> : <Check aria-hidden="true" />}
        {status}
      </span>
    </div>
  );
}
