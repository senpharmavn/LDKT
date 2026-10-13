export type Screen =
  | "home"
  | "journey"
  | "workshop"
  | "challenge"
  | "checkin"
  | "challengeComplete"
  | "evaluate"
  | "evaluationForm"
  | "notifications"
  | "learning"
  | "practice"
  | "peerGroup"
  | "flashcards"
  | "insights"
  | "leadershipReport"
  | "profile";

export type CheckinStatus = "done" | "not_done";

export type Checkin = {
  status: CheckinStatus;
  mood: string;
  insight: string;
  nextAction: string;
};

export type Evaluation = {
  rating: number;
  feedback: string;
};

export type EvaluationType = "workshop" | "self_before" | "self_after" | "peer" | "final_quiz";

export type EvaluationSessionType = "onboard" | "main" | "share_learn" | "self" | "peer" | "final";

export type EvaluationQuestionType = "rating" | "scale" | "text" | "single_choice" | "multi_choice";

export type EvaluationTemplate = {
  id: string;
  type: EvaluationType;
  workshopId: string;
  sessionType: EvaluationSessionType;
  title: string;
  description: string;
  status: string;
  formUrl?: string;
};

export type EvaluationQuestion = {
  id: string;
  templateId: string;
  order: number;
  text: string;
  type: EvaluationQuestionType;
  options: string[];
  required: boolean;
  dimension: string;
};

export type CheckinRecord = {
  id: string;
  workshopId: string;
  challengeId: string;
  day: number;
  completed: boolean;
  mood: string;
  insight: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
};

export type EvaluationRecord = {
  id: string;
  workshopId: string;
  templateId?: string;
  sessionType?: string;
  respondentType?: string;
  rating: number;
  feedback: string;
  updatedAt: string;
};

export type EvaluationAnswerRecord = {
  id: string;
  responseId: string;
  userId: string;
  templateId: string;
  questionId: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

export type FinalQuizResult = {
  attemptId: string;
  templateId: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  submittedAt: string;
  objectiveScore: number;
  essayScore: number;
  finalScore: number;
  gradingStatus: string;
  feedback: string;
  publishedAt: string;
};

export type Student = {
  id: string;
  name: string;
  initials: string;
  batch: string;
  role: string;
  team: string;
  email?: string;
  participationStatus?: string;
  reportUrl?: string;
};

export type LeaderboardUser = {
  id: string;
  name: string;
  initials: string;
  batch: string;
  currentWorkshopIndex: number;
  status: string;
  xp?: number;
  rank?: number;
  progress?: number;
  checkinCount?: number;
  longestStreak?: number;
  peerFeedbackCount?: number;
  selfAssessmentCount?: number;
  evaluationCount?: number;
  lastCheckin?: string;
};

export type WorkshopStatus = "done" | "now" | "locked";

export type Workshop = {
  id?: string;
  order?: number;
  title: string;
  description: string;
  status: WorkshopStatus;
  scheduleDate?: string;
  scheduleTime?: string;
  location?: string;
  flashcardUrl?: string;
};

export type Challenge = {
  id: string;
  workshopId: string;
  day: number;
  title: string;
  description: string;
  instruction: string;
  status: string;
  date?: string;
};

export type PracticeExercise = {
  id: string;
  title: string;
  description: string;
  instruction: string;
  type: string;
  durationSeconds: number;
  mediaUrl?: string;
  linkedChallengeId?: string;
  status: string;
  order: number;
};

export type PeerGroupOption = {
  id: string;
  name: string;
  maxMembers: number;
  status: string;
  memberCount: number;
};

export type PeerGroupMember = {
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
  role: string;
  status: string;
};

export type GroupCheckinRecord = {
  id: string;
  groupId: string;
  week: number;
  userId: string;
  met: boolean;
  insight: string;
  nextAction: string;
  createdAt: string;
};

export type AssessmentSummaryRecord = {
  userId: string;
  dimension: string;
  selfScore: number;
  peerScore: number;
  insight: string;
  reportStatus: string;
  completedAt: string;
};

export type CoachingRequest = {
  id: string;
  userId: string;
  xp: number;
  requestedAt: string;
  status: "registered" | "selected" | "booked" | "not_selected" | "withdrawn";
  assignedSlotId: string;
};

export type CoachingSlot = {
  id: string;
  startAt: string;
  endAt: string;
  coachName: string;
  meetingLink: string;
  status: string;
  bookedUserId: string;
};

export type DashboardData = {
  student: Student;
  workshops: Workshop[];
  challenges: Challenge[];
  practiceExercises: PracticeExercise[];
  checkins: CheckinRecord[];
  evaluations: EvaluationRecord[];
  evaluationTemplates: EvaluationTemplate[];
  evaluationQuestions: EvaluationQuestion[];
  evaluationAnswers: EvaluationAnswerRecord[];
  finalQuizResults: FinalQuizResult[];
  peerFeedbackCount?: number;
  peerGroupOptions: PeerGroupOption[];
  peerGroupMembers: PeerGroupMember[];
  groupCheckins: GroupCheckinRecord[];
  assessmentSummary: AssessmentSummaryRecord[];
  coachingRequests: CoachingRequest[];
  coachingSlots: CoachingSlot[];
  leaderboardUsers: LeaderboardUser[];
  currentWorkshopIndex: number;
  currentMiniChallengeDay: number;
  miniChallengeTotalDays: number;
};
