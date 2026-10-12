const CONFIG = {
  SPREADSHEET_ID: "1UiqBretXwydIxFzixHXGmIaVvjCC9K93V8DKbdDJbuY",
  SHEETS: {
    USERS: "Users",
    STUDENT_STATS: "Student_Stats",
    WORKSHOPS: "Workshops",
    MINI_CHALLENGES: "Mini_Challenges",
    CHECKINS: "Checkins",
    EVALUATIONS: "Evaluations",
    EVALUATION_TEMPLATES: "Evaluation_Templates",
    EVALUATION_QUESTIONS: "Evaluation_Questions",
    EVALUATION_RESPONSES: "Evaluation_Responses",
    EVALUATION_ANSWERS: "Evaluation_Answers",
    WORKSHOP_STATS: "Workshop_Stats",
    ASSESSMENT_SUMMARY: "Assessment_Summary",
    CHALLENGE_STATS: "Challenge_Stats",
    CHALLENGE_DAILY_STATS: "Challenge_Daily_Stats",
    CHALLENGE_21D_FUNNEL: "Challenge_21D_Funnel",
    PEER_RESPONSES: "Peer_Responses",
    EMAIL_LOGS: "Email_Logs",
    PEER_GROUP_LIST: "Peer_Group_List",
    PEER_GROUPS: "Peer_Groups",
    GROUP_CHECKINS: "Group_Checkins",
    PRACTICE_EXERCISES: "practice",
    COACHING_REQUESTS: "CoachingRequests",
    COACHING_SLOTS: "CoachingSlots",
    PUSH_SUBSCRIPTIONS: "Push_Subscriptions",
    NOTIFICATION_LOG: "Notification_Log",
    FINAL_QUIZ_RESULTS: "Final_Quiz_Results",
  },
  APP_URL: "https://lanhdaokhaitam.vercel.app",
};

function doGet(event) {
  return handleRequest(event);
}

function doPost(event) {
  return handleRequest(event);
}

function handleRequest(event) {
  try {
    const action = getAction(event);
    const payload = getPayload(event);

    if (action === "getDashboard") {
      return jsonResponse(getDashboard(payload));
    }

    if (action === "getInstructorDashboard") {
      return jsonResponse(getInstructorDashboard(payload));
    }

    if (action === "login") {
      return jsonResponse(login(payload));
    }

    if (action === "syncUserSystemFields") {
      return jsonResponse(syncUserSystemFields());
    }

    if (action === "rebuildStudentStats") {
      return jsonResponse(rebuildStudentStats());
    }

    if (action === "syncMissingStudentStats") {
      return jsonResponse(syncMissingStudentStats());
    }

    if (action === "setupStudentStatsUserTrigger") {
      return jsonResponse(setupStudentStatsUserTrigger());
    }

    if (action === "rebuildInstructorSummaries") {
      return jsonResponse(rebuildInstructorSummaries(payload));
    }

    if (action === "publishAssessmentReport") {
      return jsonResponse(publishAssessmentReport(payload));
    }

    if (action === "setupInstructorSummaryTrigger") {
      return jsonResponse(setupInstructorSummaryTrigger());
    }

    if (action === "saveCheckin") {
      return jsonResponse(saveCheckin(payload));
    }

    if (action === "saveEvaluation") {
      return jsonResponse(saveEvaluation(payload));
    }

    if (action === "saveEvaluationResponse") {
      return jsonResponse(saveEvaluationResponse(payload));
    }

    if (action === "startFinalQuiz") return jsonResponse(startFinalQuiz(payload));
    if (action === "submitFinalQuiz") return jsonResponse(submitFinalQuiz(payload));
    if (action === "gradeFinalQuiz") return jsonResponse(gradeFinalQuiz(payload));

    if (action === "getPublicWorkshopEvaluation") {
      return jsonResponse(getPublicWorkshopEvaluation(payload));
    }

    if (action === "savePublicWorkshopEvaluation") {
      return jsonResponse(savePublicWorkshopEvaluation(payload));
    }
    if (action === "getPublicFinalSurvey") {
      return jsonResponse(getPublicFinalSurvey(payload));
    }
    if (action === "savePublicFinalSurvey") {
      return jsonResponse(savePublicFinalSurvey(payload));
    }

    if (action === "getPeerAssessment") {
      return jsonResponse(getPeerAssessment(payload));
    }

    if (action === "checkPeerAssessmentEmail") {
      return jsonResponse(checkPeerAssessmentEmail(payload));
    }

    if (action === "savePeerAssessment") {
      return jsonResponse(savePeerAssessment(payload));
    }

    if (action === "joinPeerGroup") {
      return jsonResponse(joinPeerGroup(payload));
    }

    if (action === "renamePeerGroup") {
      return jsonResponse(renamePeerGroup(payload));
    }

    if (action === "saveGroupCheckin") {
      return jsonResponse(saveGroupCheckin(payload));
    }

    if (action === "registerCoaching") {
      return jsonResponse(registerCoaching(payload));
    }

    if (action === "bookCoachingSlot") {
      return jsonResponse(bookCoachingSlot(payload));
    }

    if (action === "savePushSubscription") return jsonResponse(savePushSubscription(payload));
    if (action === "removePushSubscription") return jsonResponse(removePushSubscription(payload));
    if (action === "getPushDispatch") return jsonResponse(getPushDispatch(payload));
    if (action === "markPushDeliveries") return jsonResponse(markPushDeliveries(payload));
    if (action === "setupPushReminderTriggers") return jsonResponse(setupPushReminderTriggers(payload));
    if (action === "setupPushTestTrigger") return jsonResponse(setupPushTestTrigger(payload));

    if (action === "selectCoachingCandidates") {
      return jsonResponse(selectCoachingCandidates(payload));
    }

    return jsonResponse({ ok: false, error: "Unknown action: " + action }, 400);
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) }, 500);
  }
}

function getAction(event) {
  if (event && event.parameter && event.parameter.action) {
    return event.parameter.action;
  }

  const payload = getPayload(event);
  return payload.action || "";
}

function getPayload(event) {
  const payload = {};

  if (event && event.parameter) {
    Object.keys(event.parameter).forEach(function (key) {
      payload[key] = event.parameter[key];
    });
  }

  if (event && event.postData && event.postData.contents) {
    return Object.assign(payload, JSON.parse(event.postData.contents));
  }

  return payload;
}

function login(payload) {
  const identifier = normalizeText(payload.identifier || payload.email || payload.phone || payload.userId);
  const studentCode = normalizeText(payload.studentCode || payload.userId);
  if (!identifier || !studentCode) return { ok: false, error: "Missing identifier or student code" };

  const users = readSheet(CONFIG.SHEETS.USERS);
  const studentStats = readOptionalSheet(CONFIG.SHEETS.STUDENT_STATS);
  const user = users.find(function (row) {
    const status = normalizeText(valueByKeys(row, ["Status", "ParticipationStatus", "participation_status"]) || "Active");
    if (status && status !== "active") return false;

    const contactMatches =
      normalizeText(valueByKeys(row, ["Email", "email"])) === identifier ||
      normalizeText(valueByKeys(row, ["Phone", "phone"])) === identifier;
    const studentCodeMatches = normalizeText(valueByKeys(row, ["UserID", "user_id"])) === studentCode;
    return contactMatches && studentCodeMatches;
  });

  if (!user) return { ok: false, error: "Email/số điện thoại hoặc mã học viên chưa đúng" };

  return {
    ok: true,
    token: valueByKeys(user, ["Token", "token"]) || valueByKeys(user, ["UserID", "user_id"]),
    user: user,
  };
}

function registerParticipant(payload) {
  const fullName = String(payload.fullName || payload.FullName || "").trim();
  const email = String(payload.email || payload.Email || "").trim();
  const phone = String(payload.phone || payload.Phone || "").trim();
  if (!fullName || !email) return { ok: false, error: "Missing full name or email" };

  const users = readSheet(CONFIG.SHEETS.USERS);
  const existing = users.find(function (row) {
    const sameEmail = email && normalizeText(row.Email) === normalizeText(email);
    const samePhone = phone && normalizeText(row.Phone) === normalizeText(phone);
    return sameEmail || samePhone;
  });
  const now = new Date();
  const userId = existing && existing.UserID ? existing.UserID : makeNextUserId(users);
  const token = existing && existing.Token ? existing.Token : makeId("TOK");
  const row = {
    UserID: userId,
    user_id: userId,
    FullName: fullName,
    full_name: fullName,
    BirthYear: payload.birthYear || "",
    birth_year: payload.birthYear || "",
    Gender: payload.gender || "",
    gender: payload.gender || "",
    Email: email,
    email: email,
    Phone: phone,
    phone: phone,
    City: payload.city || "",
    city: payload.city || "",
    CompanyName: payload.companyName || payload.company_name || "",
    company_name: payload.companyName || payload.company_name || "",
    IndustryGroup: payload.industryGroup || payload.industry_group || "",
    industry_group: payload.industryGroup || payload.industry_group || "",
    TotalWorkingYears: payload.totalWorkingYears || payload.total_working_years || "",
    total_working_years: payload.totalWorkingYears || payload.total_working_years || "",
    IsPeopleManager: payload.isPeopleManager || payload.is_people_manager || "",
    is_people_manager: payload.isPeopleManager || payload.is_people_manager || "",
    TeamSize: payload.teamSize || payload.team_size || "",
    team_size: payload.teamSize || payload.team_size || "",
    LeadershipYears: payload.leadershipYears || payload.leadership_years || "",
    leadership_years: payload.leadershipYears || payload.leadership_years || "",
    AcquisitionSource: payload.acquisitionSource || payload.acquisition_source || "",
    acquisition_source: payload.acquisitionSource || payload.acquisition_source || "",
    RegistrationMotivation: payload.registrationMotivation || payload.registration_motivation || "",
    registration_motivation: payload.registrationMotivation || payload.registration_motivation || "",
    LeadershipChallenge: payload.leadershipChallenge || payload.leadership_challenge || "",
    leadership_challenge: payload.leadershipChallenge || payload.leadership_challenge || "",
    EnrollmentDate: existing && existing.EnrollmentDate ? existing.EnrollmentDate : Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy"),
    enrollment_date: existing && existing.enrollment_date ? existing.enrollment_date : Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy"),
    CohortID: payload.cohortId || payload.cohort_id || "C2026_01",
    cohort_id: payload.cohortId || payload.cohort_id || "C2026_01",
    Role: "Học viên",
    role: "Học viên",
    CurrentWorkshop: existing && existing.CurrentWorkshop ? existing.CurrentWorkshop : 1,
    current_workshop: existing && existing.current_workshop ? existing.current_workshop : 1,
    ParticipationStatus: existing && existing.ParticipationStatus ? existing.ParticipationStatus : "Active",
    participation_status: existing && existing.participation_status ? existing.participation_status : "Active",
    Status: existing && existing.Status ? existing.Status : "Active",
    Token: token,
    token: token,
    XP: existing && existing.XP ? existing.XP : 0,
    xp: existing && existing.xp ? existing.xp : 0,
  };

  const result = upsertObject(CONFIG.SHEETS.USERS, row, function (current) {
    return current.UserID === userId || normalizeText(current.Email) === normalizeText(email);
  });

  return {
    ok: true,
    userId: userId,
    token: token,
    user: result.row,
    mode: result.mode,
  };
}

function onFormSubmit(event) {
  return syncUserSystemFields();
}

function syncUserSystemFields() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    return syncUserSystemFieldsUnlocked();
  } finally {
    lock.releaseLock();
  }
}

function syncNewUsers() {
  return syncUserSystemFields();
}

function setupUserAutomationTriggers() {
  const spreadsheet = getSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    const handler = trigger.getHandlerFunction();
    if (handler === "onFormSubmit" || handler === "syncNewUsers") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(spreadsheet)
    .onFormSubmit()
    .create();

  ScriptApp.newTrigger("syncNewUsers")
    .timeBased()
    .everyMinutes(5)
    .create();

  return {
    ok: true,
    triggers: ["onFormSubmit", "syncNewUsers"],
  };
}

function syncUserSystemFieldsUnlocked() {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheet) throw new Error("Missing sheet: " + CONFIG.SHEETS.USERS);

  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return { ok: true, updated: 0 };

  const headers = normalizeHeaders(values[0]);
  const userIdColumn = findHeaderIndex(headers, ["UserID", "user_id", "participant_id"]);
  const tokenColumn = findHeaderIndex(headers, ["Token", "token"]);
  const xpColumn = findHeaderIndex(headers, ["XP", "xp"]);
  const statusColumn = findHeaderIndex(headers, ["Status", "ParticipationStatus", "participation_status"]);
  const enrollmentDateColumn = findHeaderIndex(headers, ["EnrollmentDate", "enrollment_date", "StartDate"]);
  const roleColumn = findHeaderIndex(headers, ["Role", "role"]);
  const currentWorkshopColumn = findHeaderIndex(headers, ["CurrentWorkshop", "current_workshop"]);

  const existingUsers = readSheet(CONFIG.SHEETS.USERS);
  var updated = 0;

  for (var index = 1; index < values.length; index++) {
    const row = values[index];
    if (!hasAnyValue(row)) continue;

    var changed = false;

    if (userIdColumn >= 0 && !row[userIdColumn]) {
      row[userIdColumn] = makeNextUserId(existingUsers.concat(rowsToObjects(headers, values.slice(1, index))));
      changed = true;
    }

    if (tokenColumn >= 0 && !row[tokenColumn]) {
      row[tokenColumn] = makeId("TOK");
      changed = true;
    }

    if (xpColumn >= 0 && row[xpColumn] === "") {
      row[xpColumn] = 0;
      changed = true;
    }

    if (statusColumn >= 0 && !row[statusColumn]) {
      row[statusColumn] = "Active";
      changed = true;
    }

    if (roleColumn >= 0 && !row[roleColumn]) {
      row[roleColumn] = "Học viên";
      changed = true;
    }

    if (currentWorkshopColumn >= 0 && row[currentWorkshopColumn] === "") {
      row[currentWorkshopColumn] = 0;
      changed = true;
    }

    if (enrollmentDateColumn >= 0 && !row[enrollmentDateColumn]) {
      row[enrollmentDateColumn] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
      changed = true;
    }

    if (changed) {
      sheet.getRange(index + 1, 1, 1, headers.length).setValues([row.slice(0, headers.length)]);
      updated += 1;
    }
  }

  return { ok: true, updated: updated };
}

function makeNextUserId(users) {
  const maxNumber = users.reduce(function (max, row) {
    const match = String(valueByKeys(row, ["UserID", "user_id", "participant_id"]) || "").match(/^LDKT(\d+)$/i);
    if (!match) return max;
    return Math.max(max, Number(match[1]) || 0);
  }, 0);
  const nextNumber = maxNumber + 1;
  return "LDKT" + String(nextNumber).padStart(3, "0");
}

function getDashboard(payload) {
  const user = findUserByToken(payload.token) || findFirstUser();
  const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
  const scope = String(payload.scope || "").toLowerCase();
  const includeDetails = scope === "full" || scope === "detail" || scope === "details";
  const workshops = readSheet(CONFIG.SHEETS.WORKSHOPS);
  const challenges = readSheet(CONFIG.SHEETS.MINI_CHALLENGES);
  const practiceExercises = readOptionalSheet(CONFIG.SHEETS.PRACTICE_EXERCISES);
  const checkins = readSheet(CONFIG.SHEETS.CHECKINS).filter(function (row) {
    return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
  });
  const evaluations = readOptionalSheet(CONFIG.SHEETS.EVALUATIONS).filter(function (row) {
    return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
  });
  const evaluationTemplates = getEvaluationTemplatesForClient();
  const evaluationQuestions = includeDetails ? readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS).map(sanitizeEvaluationQuestion) : [];
  const dynamicResponses = readOptionalSheet(CONFIG.SHEETS.EVALUATION_RESPONSES).filter(function (row) {
    return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
  });
  const evaluationAnswers = includeDetails
    ? readOptionalSheet(CONFIG.SHEETS.EVALUATION_ANSWERS).filter(function (row) {
        return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
      })
    : [];
  const users = readSheet(CONFIG.SHEETS.USERS);
  const studentStats = readOptionalSheet(CONFIG.SHEETS.STUDENT_STATS);
  const assessmentSummary = readOptionalSheet(CONFIG.SHEETS.ASSESSMENT_SUMMARY).filter(function (row) {
    return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
  });
  const peerGroupOptions = includeDetails ? getPeerGroupOptionRows() : [];
  const peerGroupMembers = includeDetails ? readOptionalSheet(CONFIG.SHEETS.PEER_GROUPS) : [];
  const activePeerGroup = peerGroupMembers.find(function (row) {
    return (
      valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId &&
      normalizeText(valueByKeys(row, ["Status", "status"]) || "active") === "active"
    );
  });
  const activePeerGroupId = activePeerGroup ? valueByKeys(activePeerGroup, ["GroupID", "group_id"]) : "";
  const groupCheckins = readOptionalSheet(CONFIG.SHEETS.GROUP_CHECKINS).filter(function (row) {
    return activePeerGroupId && valueByKeys(row, ["GroupID", "group_id"]) === activePeerGroupId;
  });
  const peerResponses = readPeerResponseSheets()
    .filter(function (row) {
      return isPeerResponseForUser(row, user, payload.token, users.length);
    })
    .map(function (row, index) {
      const timestamp = valueByKeys(row, ["Timestamp", "Dấu thời gian", "Dau thoi gian"]);

      return {
        ResponseID: row.ResponseID || row.EvaluationID || timestamp || "PEER-" + index,
        UserID: userId,
        TemplateID: valueByKeys(row, ["TemplateID", "Template ID"]) || "OTHER-BEFORE",
        WorkshopID: valueByKeys(row, ["WorkshopID", "Workshop ID"]) || "",
        SessionType: "peer",
        RespondentType: "peer",
        Rating: valueByKeys(row, ["Rating", "Score", "Diem", "Điểm"]) || "",
        Feedback: valueByKeys(row, ["Feedback", "Comment", "NhanXet", "Nhận xét", "Góp ý", "Gop y"]) || "",
        CreatedAt: row.CreatedAt || timestamp || "",
        UpdatedAt: row.UpdatedAt || timestamp || new Date().toISOString(),
      };
    });
  const dynamicPeerFeedbackCount = dynamicResponses.filter(function (row) {
    const respondentType = normalizeText(valueByKeys(row, ["RespondentType", "respondent_type"]));
    const templateId = normalizeText(valueByKeys(row, ["TemplateID", "template_id"]));
    return respondentType === "peer" || respondentType.indexOf("other") >= 0 || templateId.indexOf("peer") >= 0 || templateId.indexOf("other") >= 0 || templateId.indexOf("360") >= 0;
  }).length;
  const peerFeedbackCount = Math.max(peerResponses.length, dynamicPeerFeedbackCount);
  const coachingRequests = readOptionalSheet(CONFIG.SHEETS.COACHING_REQUESTS).filter(function (row) {
    return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
  });
  const selectedForCoaching = coachingRequests.some(function (row) {
    return ["selected", "booked"].indexOf(normalizeText(valueByKeys(row, ["Status", "status"]))) >= 0;
  });
  const userCohortId = getUserCohortId(user);
  const coachingSlots = selectedForCoaching
    ? filterRowsByCohort(readOptionalSheet(CONFIG.SHEETS.COACHING_SLOTS), userCohortId)
    : [];
  const finalQuizResults = readOptionalSheet(CONFIG.SHEETS.FINAL_QUIZ_RESULTS).filter(function (row) {
    return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
  });

  return {
    ok: true,
    user: user,
    workshops: workshops,
    challenges: challenges,
    practiceExercises: practiceExercises,
    checkins: checkins,
    evaluations: evaluations.concat(dynamicResponses).concat(peerResponses),
    evaluationTemplates: evaluationTemplates,
    evaluationQuestions: evaluationQuestions,
    evaluationAnswers: evaluationAnswers,
    peerFeedbackCount: peerFeedbackCount,
    peerGroupOptions: peerGroupOptions,
    peerGroupMembers: peerGroupMembers,
    groupCheckins: groupCheckins,
    assessmentSummary: assessmentSummary,
    users: users,
    studentStats: studentStats,
    coachingRequests: coachingRequests,
    coachingSlots: coachingSlots,
    finalQuizResults: finalQuizResults,
  };
}

function getInstructorDashboard(payload) {
  const requestedCohortId = String(payload.cohortId || payload.cohort || "").trim();
  const requestedReportUserId = String(payload.reportUserId || payload.report || "").trim();
  const users = readSheet(CONFIG.SHEETS.USERS);
  const studentStats = readOptionalSheet(CONFIG.SHEETS.STUDENT_STATS);
  const eligibleStudents = users.filter(function (row) {
    const role = normalizeText(valueByKeys(row, ["Role", "role"]));
    const status = normalizeText(valueByKeys(row, ["Status", "ParticipationStatus", "participation_status"]) || "Active");

    if (role.indexOf("giangvien") >= 0 || role.indexOf("facilitator") >= 0 || role.indexOf("teacher") >= 0) return false;
    if (status && status !== "active") return false;
    return true;
  });
  const cohorts = getCohortIds(eligibleStudents);
  const reportUser = requestedReportUserId ? eligibleStudents.filter(function (user) {
    return valueByKeys(user, ["UserID", "user_id", "participant_id"]) === requestedReportUserId;
  })[0] : null;
  const reportCohortId = reportUser ? getUserCohortId(reportUser) : "";
  const effectiveCohortId = reportCohortId || requestedCohortId;
  const cohortId = cohorts.indexOf(effectiveCohortId) >= 0 ? effectiveCohortId : (cohorts[0] || effectiveCohortId);
  const students = eligibleStudents.filter(function (row) {
    return !cohortId || getUserCohortId(row) === cohortId;
  });
  const studentIds = students.map(function (row) {
    return valueByKeys(row, ["UserID", "user_id", "participant_id"]);
  });

  const checkins = readSheet(CONFIG.SHEETS.CHECKINS).filter(function (row) {
    return studentIds.indexOf(valueByKeys(row, ["UserID", "user_id", "participant_id"])) >= 0;
  });
  const publicResponseIds = {};
  const evaluationResponses = readOptionalSheet(CONFIG.SHEETS.EVALUATION_RESPONSES).filter(function (row) {
    const userId = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
    const isStudentResponse = studentIds.indexOf(userId) >= 0;
    const responseCohortId = String(valueByKeys(row, ["CohortID", "cohort_id", "Cohort", "Batch"]) || "").trim();
    const templateId = normalizeKey(valueByKeys(row, ["TemplateID", "template_id"]));
    const respondentType = normalizeKey(valueByKeys(row, ["RespondentType", "respondent_type"]));
    const isPublicResponse = responseCohortId === cohortId && (
      normalizeKey(userId) === "public" ||
      templateId === "finalsurvey" ||
      respondentType === "publicanonymous"
    );
    if (isPublicResponse) {
      const responseId = valueByKeys(row, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]);
      if (responseId) publicResponseIds[responseId] = true;
    }
    return isStudentResponse || isPublicResponse;
  });
  const evaluations = readOptionalSheet(CONFIG.SHEETS.EVALUATIONS)
    .filter(function (row) {
      return studentIds.indexOf(valueByKeys(row, ["UserID", "user_id", "participant_id"])) >= 0;
    })
    .concat(evaluationResponses);
  const evaluationAnswers = readOptionalSheet(CONFIG.SHEETS.EVALUATION_ANSWERS).filter(function (row) {
    const userId = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
    const responseId = valueByKeys(row, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]);
    return studentIds.indexOf(userId) >= 0 || Boolean(publicResponseIds[responseId]);
  });
  const peerGroups = readOptionalSheet(CONFIG.SHEETS.PEER_GROUPS).filter(function (row) {
    return studentIds.indexOf(valueByKeys(row, ["UserID", "user_id", "participant_id"])) >= 0;
  });
  const groupIds = peerGroups.map(function (row) {
    return valueByKeys(row, ["GroupID", "group_id"]);
  });
  const groupCheckins = readOptionalSheet(CONFIG.SHEETS.GROUP_CHECKINS).filter(function (row) {
    return groupIds.indexOf(valueByKeys(row, ["GroupID", "group_id"])) >= 0;
  });
  const coachingRequests = filterRowsByCohort(readOptionalSheet(CONFIG.SHEETS.COACHING_REQUESTS), cohortId);
  const coachingSlots = filterRowsByCohort(readOptionalSheet(CONFIG.SHEETS.COACHING_SLOTS), cohortId);

  return {
    ok: true,
    cohortId: cohortId,
    cohorts: cohorts,
    users: students,
    studentStats: studentStats,
    workshops: readSheet(CONFIG.SHEETS.WORKSHOPS),
    miniChallenges: readOptionalSheet(CONFIG.SHEETS.MINI_CHALLENGES),
    workshopStats: filterRowsByCohort(readOptionalSheet(CONFIG.SHEETS.WORKSHOP_STATS), cohortId),
    challengeStats: filterRowsByCohort(readOptionalSheet(CONFIG.SHEETS.CHALLENGE_STATS), cohortId),
    challengeDailyStats: filterRowsByCohort(readOptionalSheet(CONFIG.SHEETS.CHALLENGE_DAILY_STATS), cohortId),
    challenge21dFunnel: filterRowsByCohort(readOptionalSheet(CONFIG.SHEETS.CHALLENGE_21D_FUNNEL), cohortId),
    assessmentSummary: readOptionalSheet(CONFIG.SHEETS.ASSESSMENT_SUMMARY),
    checkins: checkins,
    evaluations: evaluations,
    evaluationTemplates: readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES),
    evaluationQuestions: readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS),
    evaluationAnswers: evaluationAnswers,
    peerGroupOptions: readOptionalSheet(CONFIG.SHEETS.PEER_GROUP_LIST),
    peerGroupMembers: peerGroups,
    groupCheckins: groupCheckins,
    coachingRequests: coachingRequests,
    coachingSlots: coachingSlots,
    finalQuizResults: readOptionalSheet(CONFIG.SHEETS.FINAL_QUIZ_RESULTS).filter(function (row) {
      return studentIds.indexOf(valueByKeys(row, ["UserID", "user_id", "participant_id"])) >= 0;
    }),
  };
}

function getEvaluationTemplatesForClient() {
  return readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES).map(function (row) {
    if (normalizeKey(valueByKeys(row, ["TemplateID", "template_id"])) !== "finalquiz") return row;
    const open = isTruthyValue(valueByKeys(row, ["Open", "IsOpen", "ExamOpen"]));
    return Object.assign({}, row, { Status: open ? "active" : "locked" });
  });
}

function sanitizeEvaluationQuestion(row) {
  return {
    QuestionID: valueByKeys(row, ["QuestionID", "question_id"]),
    TemplateID: valueByKeys(row, ["TemplateID", "template_id"]),
    Order: valueByKeys(row, ["Order", "order"]),
    QuestionText: valueByKeys(row, ["QuestionText", "Question", "question_text"]),
    QuestionType: valueByKeys(row, ["QuestionType", "question_type"]),
    Options: valueByKeys(row, ["Options", "options"]),
    Required: valueByKeys(row, ["Required", "required"]),
    Dimension: valueByKeys(row, ["Dimension", "dimension"]),
  };
}

function registerCoaching(payload) {
  const user = findUserByToken(payload.token);
  if (!user) return { ok: false, error: "Invalid token" };
  const explorationGoal = String(payload.explorationGoal || "").trim();
  if (!isCoachingRegistrationOpen()) {
    return { ok: false, error: "Đăng ký Coaching 1:1 online đã đóng" };
  }
  if (!explorationGoal) return { ok: false, error: "Vui lòng chia sẻ điều bạn mong muốn khám phá hoặc chuyển hóa" };
  const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const requests = readOptionalSheet(CONFIG.SHEETS.COACHING_REQUESTS);
    const existing = requests.find(function (row) {
      return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId &&
        normalizeText(valueByKeys(row, ["Status", "status"]) || "registered") !== "withdrawn";
    });
    if (existing) return { ok: true, mode: "existing", request: existing };
    const stats = readOptionalSheet(CONFIG.SHEETS.STUDENT_STATS).find(function (row) {
      return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
    });
    const now = new Date().toISOString();
    const row = {
      RequestID: "COACH-" + userId + "-" + Date.now(),
      UserID: userId,
      FullName: valueByKeys(user, ["FullName", "full_name", "Name"]),
      CohortID: getUserCohortId(user),
      XP: Number(valueByKeys(stats || {}, ["XP", "xp", "Points", "TotalXP", "Score"]) || 0),
      ExplorationGoal: explorationGoal,
      RequestedAt: now,
      Selected: false,
      SelectedBy: "",
      SelectedAt: "",
      AssignedSlotID: "",
      Status: "registered",
      UpdatedAt: now,
    };
    ensureSheetHeader(CONFIG.SHEETS.COACHING_REQUESTS, "ExplorationGoal");
    appendObject(CONFIG.SHEETS.COACHING_REQUESTS, row);
    return { ok: true, mode: "inserted", request: row };
  } finally {
    lock.releaseLock();
  }
}

function isCoachingRegistrationOpen() {
  const workshops = readSheet(CONFIG.SHEETS.WORKSHOPS);
  return workshops.some(function (workshop) {
    const workshopId = normalizeText(valueByKeys(workshop, ["WorkshopID", "workshop_id", "ID", "id"]));
    const order = Number(valueByKeys(workshop, ["Order", "order", "Sequence", "sequence"]) || 0);
    const status = normalizeText(valueByKeys(workshop, ["Status", "status"]));
    return (workshopId === "ws7" || order === 7) && (status === "now" || status === "open");
  });
}

function ensureSheetHeader(sheetName, headerName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet: " + sheetName);
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  if (headers.indexOf(headerName) >= 0) return;
  sheet.getRange(1, lastColumn + 1).setValue(headerName);
}

function selectCoachingCandidates(payload) {
  const cohortId = String(payload.cohortId || "").trim();
  let selectedUserIds = payload.userIds || [];
  if (typeof selectedUserIds === "string") {
    try { selectedUserIds = JSON.parse(selectedUserIds); } catch (error) { selectedUserIds = selectedUserIds.split(","); }
  }
  selectedUserIds = selectedUserIds.map(String).filter(Boolean);
  if (selectedUserIds.length > 5) return { ok: false, error: "Chỉ được chọn tối đa 5 học viên" };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const now = new Date().toISOString();
    const requests = readOptionalSheet(CONFIG.SHEETS.COACHING_REQUESTS);
    requests.forEach(function (row) {
      if (cohortId && String(valueByKeys(row, ["CohortID", "cohort_id"]) || "") !== cohortId) return;
      if (normalizeText(valueByKeys(row, ["Status", "status"])) === "booked") return;
      const userId = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
      const isSelected = selectedUserIds.indexOf(userId) >= 0;
      const next = Object.assign({}, row, {
        Selected: isSelected,
        SelectedBy: isSelected ? String(payload.selectedBy || "Giảng viên") : "",
        SelectedAt: isSelected ? now : "",
        Status: isSelected ? "selected" : "not_selected",
        UpdatedAt: now,
      });
      upsertObject(CONFIG.SHEETS.COACHING_REQUESTS, next, function (current) {
        return valueByKeys(current, ["RequestID", "request_id"]) === valueByKeys(row, ["RequestID", "request_id"]);
      });
    });
    return { ok: true, selectedCount: selectedUserIds.length };
  } finally {
    lock.releaseLock();
  }
}

function bookCoachingSlot(payload) {
  const user = findUserByToken(payload.token);
  if (!user) return { ok: false, error: "Invalid token" };
  const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
  const slotId = String(payload.slotId || "").trim();
  if (!slotId) return { ok: false, error: "Missing slotId" };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const requests = readOptionalSheet(CONFIG.SHEETS.COACHING_REQUESTS);
    const request = requests.find(function (row) {
      return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
    });
    if (!request || ["selected", "booked"].indexOf(normalizeText(valueByKeys(request, ["Status", "status"]))) < 0) {
      return { ok: false, error: "Bạn chưa được chọn coaching" };
    }
    const assignedSlotId = valueByKeys(request, ["AssignedSlotID", "assigned_slot_id"]);
    if (assignedSlotId) return { ok: true, mode: "existing", slotId: assignedSlotId };
    const slots = readOptionalSheet(CONFIG.SHEETS.COACHING_SLOTS);
    const slot = slots.find(function (row) { return valueByKeys(row, ["SlotID", "slot_id"]) === slotId; });
    if (!slot) return { ok: false, error: "Không tìm thấy lịch coaching" };
    if (normalizeText(valueByKeys(slot, ["Status", "status"]) || "open") !== "open" || valueByKeys(slot, ["BookedUserID", "UserID"])) {
      return { ok: false, error: "Khung giờ này vừa được đăng ký" };
    }
    const now = new Date().toISOString();
    const nextSlot = Object.assign({}, slot, {
      Status: "booked",
      BookedUserID: userId,
      BookedFullName: valueByKeys(user, ["FullName", "full_name", "Name"]),
      BookedAt: now,
      UpdatedAt: now,
    });
    upsertObject(CONFIG.SHEETS.COACHING_SLOTS, nextSlot, function (current) {
      return valueByKeys(current, ["SlotID", "slot_id"]) === slotId;
    });
    const nextRequest = Object.assign({}, request, { AssignedSlotID: slotId, Status: "booked", UpdatedAt: now });
    upsertObject(CONFIG.SHEETS.COACHING_REQUESTS, nextRequest, function (current) {
      return valueByKeys(current, ["RequestID", "request_id"]) === valueByKeys(request, ["RequestID", "request_id"]);
    });
    return { ok: true, mode: "booked", slotId: slotId };
  } finally {
    lock.releaseLock();
  }
}

function getUserCohortId(user) {
  return String(valueByKeys(user, ["CohortID", "cohort_id", "Batch", "batch"]) || "").trim();
}

function getCohortIds(users) {
  const seen = {};
  users.forEach(function (user) {
    const cohortId = getUserCohortId(user);
    if (cohortId) seen[cohortId] = true;
  });
  return Object.keys(seen).sort();
}

function filterRowsByCohort(rows, cohortId) {
  if (!cohortId) return rows;
  return rows.filter(function (row) {
    return String(valueByKeys(row, ["CohortID", "cohort_id", "Cohort", "Batch"]) || "").trim() === cohortId;
  });
}

function saveCheckin(payload) {
  const now = new Date().toISOString();
  const user = findUserByToken(payload.token) || findFirstUser();
  const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
  const row = {
    CheckinID: payload.checkinId || makeId("CHK"),
    UserID: userId,
    WorkshopID: payload.workshopId || "WS3",
    ChallengeID: payload.challengeId || "MC3-D1",
    Day: payload.day || 1,
    Completed: payload.completed === false ? "FALSE" : "TRUE",
    PracticeStatus: payload.practiceStatus || "",
    Mood: payload.mood || "",
    Insight: payload.insight || "",
    NextAction: payload.nextAction || "",
    CreatedAt: now,
    UpdatedAt: now,
  };

  const result = upsertObject(CONFIG.SHEETS.CHECKINS, row, function (existing) {
    return existing.UserID === row.UserID && existing.ChallengeID === row.ChallengeID;
  });

  updateStudentStatsForUser(userId);

  return { ok: true, checkin: result.row, mode: result.mode };
}

function setUserXp(userId, amount) {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheet) return;

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  const headers = normalizeHeaders(values[0]);
  const userIdColumn = findHeaderIndex(headers, ["UserID", "user_id", "participant_id"]);
  const xpColumn = findHeaderIndex(headers, ["XP", "xp", "Points", "TotalXP", "Score"]);
  if (userIdColumn === -1 || xpColumn === -1) return;

  for (var index = 1; index < values.length; index++) {
    if (String(values[index][userIdColumn]) === String(userId)) {
      sheet.getRange(index + 1, xpColumn + 1).setValue(Number(amount) || 0);
      return;
    }
  }
}

function joinPeerGroup(payload) {
  const user = findUserByToken(payload.token) || findFirstUser();
  const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
  const groupId = String(payload.groupId || "").trim();
  if (!groupId) return { ok: false, error: "Missing groupId" };

  const existingMembership = getActivePeerGroupMembership(userId);
  if (existingMembership) {
    return { ok: false, error: "User already joined a peer group", membership: existingMembership };
  }

  const groups = getPeerGroupOptionRows();
  const group = groups.find(function (row) {
    return valueByKeys(row, ["GroupID", "group_id"]) === groupId;
  });
  if (!group) return { ok: false, error: "Group not found" };

  const status = normalizeText(valueByKeys(group, ["Status", "status"]) || "open");
  if (status && status !== "open" && status !== "active") {
    return { ok: false, error: "Group is not open" };
  }

  const members = readOptionalSheet(CONFIG.SHEETS.PEER_GROUPS).filter(function (row) {
    return (
      valueByKeys(row, ["GroupID", "group_id"]) === groupId &&
      normalizeText(valueByKeys(row, ["Status", "status"]) || "active") === "active"
    );
  });
  const maxMembers = Number(valueByKeys(group, ["MaxMembers", "max_members", "Limit", "Capacity"]) || 5) || 5;
  if (members.length >= maxMembers) return { ok: false, error: "Group is full" };

  const row = {
    GroupID: groupId,
    GroupName: valueByKeys(group, ["GroupName", "group_name", "Name"]),
    UserID: userId,
    Role: "member",
    Status: "active",
  };
  const result = upsertObject(CONFIG.SHEETS.PEER_GROUPS, row, function (existing) {
    return valueByKeys(existing, ["UserID", "user_id", "participant_id"]) === userId;
  });

  return { ok: true, membership: result.row, mode: result.mode };
}

function getPeerGroupOptionRows() {
  const rows = readOptionalSheet(CONFIG.SHEETS.PEER_GROUP_LIST).concat(readOptionalSheet(CONFIG.SHEETS.PEER_GROUPS));
  const byId = {};

  rows.forEach(function (row) {
    const groupId = valueByKeys(row, ["GroupID", "group_id"]);
    const groupName = valueByKeys(row, ["GroupName", "group_name", "Name"]);
    if (!groupId || !groupName || byId[groupId]) return;

    byId[groupId] = {
      GroupID: groupId,
      GroupName: groupName,
      Status: valueByKeys(row, ["Status", "status"]) || "open",
      MaxMembers: valueByKeys(row, ["MaxMembers", "max_members", "Limit", "Capacity"]) || 5,
    };
  });

  return Object.keys(byId).map(function (groupId) {
    return byId[groupId];
  });
}

function renamePeerGroup(payload) {
  const user = findUserByToken(payload.token) || findFirstUser();
  const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
  const groupId = String(payload.groupId || "").trim();
  const groupName = String(payload.groupName || "").trim().slice(0, 30);
  if (!groupId || !groupName) return { ok: false, error: "Missing groupId or groupName" };

  const membership = getActivePeerGroupMembership(userId);
  if (!membership || valueByKeys(membership, ["GroupID", "group_id"]) !== groupId) {
    return { ok: false, error: "User is not a member of this group" };
  }

  const now = new Date().toISOString();
  const result = upsertObject(CONFIG.SHEETS.PEER_GROUP_LIST, {
    GroupID: groupId,
    GroupName: groupName,
    UpdatedBy: userId,
    UpdatedAt: now,
  }, function (existing) {
    return valueByKeys(existing, ["GroupID", "group_id"]) === groupId;
  });
  updatePeerGroupMemberNames(groupId, groupName);

  return { ok: true, group: result.row, mode: result.mode };
}

function saveGroupCheckin(payload) {
  const user = findUserByToken(payload.token) || findFirstUser();
  const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
  const groupId = String(payload.groupId || "").trim();
  const week = Number(payload.week || 1) || 1;
  if (!groupId) return { ok: false, error: "Missing groupId" };

  const membership = getActivePeerGroupMembership(userId);
  if (!membership || valueByKeys(membership, ["GroupID", "group_id"]) !== groupId) {
    return { ok: false, error: "User is not a member of this group" };
  }

  const now = new Date().toISOString();
  const existingCheckin = readOptionalSheet(CONFIG.SHEETS.GROUP_CHECKINS).find(function (existing) {
    return (
      valueByKeys(existing, ["GroupID", "group_id"]) === groupId &&
      Number(valueByKeys(existing, ["Week", "week"]) || 0) === week &&
      valueByKeys(existing, ["UserID", "user_id", "participant_id"]) === userId
    );
  });
  if (existingCheckin) {
    return { ok: false, error: "Bạn đã check-in nhóm trong tuần này" };
  }

  const row = {
    CheckinID: payload.checkinId || makeId("GCHK"),
    GroupID: groupId,
    Week: week,
    UserID: userId,
    Met: payload.met === false ? "FALSE" : "TRUE",
    Insight: payload.insight || "",
    NextAction: payload.nextAction || "",
    CreatedAt: now,
  };
  appendObject(CONFIG.SHEETS.GROUP_CHECKINS, row);
  updateStudentStatsForUser(userId);

  return { ok: true, checkin: row, mode: "inserted" };
}

function getActivePeerGroupMembership(userId) {
  return readOptionalSheet(CONFIG.SHEETS.PEER_GROUPS).find(function (row) {
    return (
      valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId &&
      normalizeText(valueByKeys(row, ["Status", "status"]) || "active") === "active"
    );
  });
}

function updatePeerGroupMemberNames(groupId, groupName) {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEETS.PEER_GROUPS);
  if (!sheet) return;

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  const headers = normalizeHeaders(values[0]);
  const groupIdColumn = findHeaderIndex(headers, ["GroupID", "group_id"]);
  const groupNameColumn = findHeaderIndex(headers, ["GroupName", "group_name", "Name"]);
  if (groupIdColumn === -1 || groupNameColumn === -1) return;

  for (var index = 1; index < values.length; index++) {
    if (String(values[index][groupIdColumn]) === String(groupId)) {
      sheet.getRange(index + 1, groupNameColumn + 1).setValue(groupName);
    }
  }
}

function saveEvaluation(payload) {
  const now = new Date().toISOString();
  const user = findUserByToken(payload.token) || findFirstUser();
  const row = {
    EvaluationID: payload.evaluationId || makeId("EVL"),
    UserID: user.UserID,
    WorkshopID: payload.workshopId || "WS3",
    Rating: payload.rating || 5,
    Feedback: payload.feedback || "",
    CreatedAt: now,
    UpdatedAt: now,
  };

  const result = upsertObject(CONFIG.SHEETS.EVALUATIONS, row, function (existing) {
    return existing.UserID === row.UserID && existing.WorkshopID === row.WorkshopID;
  });

  updateStudentStatsForUser(row.UserID);

  return { ok: true, evaluation: result.row, mode: result.mode };
}

function saveEvaluationResponse(payload) {
  const answers = payload.answers || {};
  const validation = validateEvaluationRequiredAnswers(payload, answers, false);
  if (!validation.ok) return validation;

  const now = new Date().toISOString();
  const user = findUserByToken(payload.token) || findFirstUser();
  const responseId = payload.responseId || makeId("EVR");
  const response = {
    EvaluationID: responseId,
    ResponseID: responseId,
    UserID: user.UserID,
    TemplateID: payload.templateId || "",
    WorkshopID: payload.workshopId || "",
    SessionType: payload.sessionType || "",
    RespondentType: payload.respondentType || "self",
    Rating: getAverageRating(answers),
    Feedback: getFirstTextAnswer(answers),
    CreatedAt: now,
    UpdatedAt: now,
  };

  const result = upsertObject(CONFIG.SHEETS.EVALUATION_RESPONSES, response, function (existing) {
    return existing.UserID === response.UserID && existing.TemplateID === response.TemplateID;
  });

  const answerRows = Object.keys(answers).map(function (questionId) {
    const normalizedValue = normalizeScenarioAnswerValue(answers[questionId]);
    return {
      AnswerID: makeId("ANS"),
      ResponseID: result.row.ResponseID || result.row.EvaluationID || responseId,
      UserID: user.UserID,
      TemplateID: response.TemplateID,
      QuestionID: questionId,
      Value: normalizedValue,
      CreatedAt: now,
      UpdatedAt: now,
    };
  });

  if (result.mode === "inserted") {
    appendObjects(CONFIG.SHEETS.EVALUATION_ANSWERS, answerRows);
  } else {
    answerRows.forEach(function (answer) {
      upsertObject(CONFIG.SHEETS.EVALUATION_ANSWERS, answer, function (existing) {
        return existing.ResponseID === answer.ResponseID && existing.QuestionID === answer.QuestionID;
      });
    });
  }

  updateStudentStatsForUser(user.UserID);

  return { ok: true, evaluation: result.row, mode: result.mode };
}

function ensureFinalQuizResultsSheet() {
  ensureSheetWithHeaders(CONFIG.SHEETS.FINAL_QUIZ_RESULTS, [
    "AttemptID", "UserID", "FullName", "CohortID", "TemplateID", "Status", "StartedAt", "ExpiresAt",
    "SubmittedAt", "ObjectiveScore", "EssayScore", "FinalScore", "GradingStatus", "InstructorFeedback",
    "GradedBy", "GradedAt", "PublishedAt", "UpdatedAt"
  ]);
}

function getFinalQuizTemplate(templateId) {
  const key = normalizeKey(templateId || "FINALQUIZ");
  return readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES).find(function (row) {
    return normalizeKey(valueByKeys(row, ["TemplateID", "template_id"])) === key;
  });
}

function isFinalQuizOpen(template) {
  return Boolean(template) && isTruthyValue(valueByKeys(template, ["Open", "IsOpen", "ExamOpen"]));
}

function startFinalQuiz(payload) {
  const user = findUserByToken(payload.token);
  if (!user) return { ok: false, error: "Phiên đăng nhập không hợp lệ." };
  const templateId = String(payload.templateId || "FINALQUIZ").trim();
  const template = getFinalQuizTemplate(templateId);
  if (!isFinalQuizOpen(template)) return { ok: false, error: "Bài kiểm tra cuối khóa chưa mở." };

  ensureFinalQuizResultsSheet();
  const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
  const existing = readOptionalSheet(CONFIG.SHEETS.FINAL_QUIZ_RESULTS).find(function (row) {
    return valueByKeys(row, ["UserID", "user_id"]) === userId && normalizeKey(valueByKeys(row, ["TemplateID", "template_id"])) === normalizeKey(templateId);
  });
  if (existing && normalizeKey(valueByKeys(existing, ["Status", "status"])) !== "inprogress") {
    return { ok: false, error: "Bạn đã nộp bài kiểm tra cuối khóa.", attempt: existing };
  }

  const now = new Date();
  let attempt = existing;
  if (!attempt) {
    const duration = Number(valueByKeys(template, ["DurationMinutes", "Duration", "Minutes"]) || 30);
    attempt = {
      AttemptID: makeId("QUIZ"), UserID: userId,
      FullName: valueByKeys(user, ["FullName", "full_name", "Name"]), CohortID: getUserCohortId(user),
      TemplateID: templateId, Status: "in_progress", StartedAt: now.toISOString(),
      ExpiresAt: new Date(now.getTime() + duration * 60000).toISOString(), SubmittedAt: "",
      ObjectiveScore: "", EssayScore: "", FinalScore: "", GradingStatus: "in_progress",
      InstructorFeedback: "", GradedBy: "", GradedAt: "", PublishedAt: "", UpdatedAt: now.toISOString()
    };
    appendObject(CONFIG.SHEETS.FINAL_QUIZ_RESULTS, attempt);
  }

  return {
    ok: true,
    attempt: attempt,
    questions: readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS).filter(function (row) {
      return normalizeKey(valueByKeys(row, ["TemplateID", "template_id"])) === normalizeKey(templateId);
    }).map(sanitizeEvaluationQuestion)
  };
}

function submitFinalQuiz(payload) {
  const user = findUserByToken(payload.token);
  if (!user) return { ok: false, error: "Phiên đăng nhập không hợp lệ." };
  const templateId = String(payload.templateId || "FINALQUIZ").trim();
  const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
  const answers = payload.answers || {};
  ensureFinalQuizResultsSheet();
  const attempt = readOptionalSheet(CONFIG.SHEETS.FINAL_QUIZ_RESULTS).find(function (row) {
    return valueByKeys(row, ["UserID", "user_id"]) === userId && normalizeKey(valueByKeys(row, ["TemplateID", "template_id"])) === normalizeKey(templateId);
  });
  if (!attempt) return { ok: false, error: "Bạn chưa bắt đầu bài kiểm tra." };
  if (normalizeKey(valueByKeys(attempt, ["Status", "status"])) !== "inprogress") return { ok: false, error: "Bài kiểm tra đã được nộp." };

  const questions = readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS).filter(function (row) {
    return normalizeKey(valueByKeys(row, ["TemplateID", "template_id"])) === normalizeKey(templateId);
  });
  const missing = questions.filter(function (row) {
    return !String(answers[valueByKeys(row, ["QuestionID", "question_id"])] || "").trim();
  });
  if (missing.length) return { ok: false, error: "Còn " + missing.length + " câu chưa trả lời. Vui lòng hoàn thành đủ bài kiểm tra trước khi nộp." };

  const now = new Date();
  const responseId = valueByKeys(attempt, ["AttemptID", "attempt_id"]);
  const answerRows = Object.keys(answers).map(function (questionId) {
    return {
      AnswerID: makeId("ANS"), ResponseID: responseId, UserID: userId, TemplateID: templateId,
      QuestionID: questionId, Value: String(answers[questionId]), CreatedAt: now.toISOString(), UpdatedAt: now.toISOString()
    };
  });
  appendObjects(CONFIG.SHEETS.EVALUATION_ANSWERS, answerRows);

  let correctCount = 0;
  questions.slice(0, 10).forEach(function (question) {
    const questionId = valueByKeys(question, ["QuestionID", "question_id"]);
    const key = canonicalQuizAnswer(valueByKeys(question, ["AnswerKey", "version", "CorrectAnswer"]));
    if (key && canonicalQuizAnswer(answers[questionId]) === key) correctCount += 1;
  });
  const objectiveScore = correctCount * 7;
  const next = Object.assign({}, attempt, {
    Status: "submitted", SubmittedAt: now.toISOString(), ObjectiveScore: objectiveScore,
    EssayScore: "", FinalScore: "", GradingStatus: "pending", UpdatedAt: now.toISOString()
  });
  upsertObject(CONFIG.SHEETS.FINAL_QUIZ_RESULTS, next, function (row) {
    return valueByKeys(row, ["AttemptID", "attempt_id"]) === responseId;
  });
  return { ok: true, attempt: next };
}

function canonicalQuizAnswer(value) {
  const raw = String(value || "").trim();
  const parts = raw.indexOf("|") >= 0
    ? raw.split("|")
    : /^(?:[A-D]\s*,\s*)+[A-D]$/i.test(raw)
      ? raw.split(",")
      : [raw];
  return parts.map(function (part) {
    const match = String(part).trim().match(/^([A-D])(?:\s*:|$)/i);
    return match ? match[1].toUpperCase() : String(part).trim().toUpperCase();
  }).filter(Boolean).sort().join(",");
}

function gradeFinalQuiz(payload) {
  const attemptId = String(payload.attemptId || "").trim();
  if (!attemptId) return { ok: false, error: "Thiếu mã bài thi." };
  ensureFinalQuizResultsSheet();
  const attempt = readOptionalSheet(CONFIG.SHEETS.FINAL_QUIZ_RESULTS).find(function (row) {
    return valueByKeys(row, ["AttemptID", "attempt_id"]) === attemptId;
  });
  if (!attempt) return { ok: false, error: "Không tìm thấy bài thi." };
  const essayScore = Math.max(0, Math.min(30, Number(payload.essayScore || 0)));
  const objectiveScore = Number(valueByKeys(attempt, ["ObjectiveScore"]) || 0);
  const publish = payload.publish === true || String(payload.publish).toLowerCase() === "true";
  const now = new Date().toISOString();
  const next = Object.assign({}, attempt, {
    EssayScore: essayScore, FinalScore: objectiveScore + essayScore,
    InstructorFeedback: String(payload.feedback || ""), GradedBy: String(payload.gradedBy || "Giảng viên"),
    GradedAt: now, GradingStatus: publish ? "published" : "graded", PublishedAt: publish ? now : valueByKeys(attempt, ["PublishedAt"]), UpdatedAt: now
  });
  upsertObject(CONFIG.SHEETS.FINAL_QUIZ_RESULTS, next, function (row) {
    return valueByKeys(row, ["AttemptID", "attempt_id"]) === attemptId;
  });
  return { ok: true, attempt: next };
}

function getPublicWorkshopEvaluation(payload) {
  const requestedTemplateId = normalizeKey(valueByKeys(payload, ["templateId", "template", "form"]));
  const requestedWorkshopId = normalizeKey(valueByKeys(payload, ["workshopId", "workshop", "ws"]));
  const requestedSessionType = normalizeKey(valueByKeys(payload, ["sessionType", "session"]) || "main");
  const requestedCohortId = String(valueByKeys(payload, ["cohortId", "cohort", "CohortID"]) || "").trim();
  if (requestedCohortId && getCohortIds(readSheet(CONFIG.SHEETS.USERS).filter(isStudentUser)).indexOf(requestedCohortId) < 0) {
    return { ok: false, error: "Cohort trong link đánh giá không hợp lệ." };
  }
  const templates = readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES).filter(function (row) {
    return (
      normalizeKey(valueByKeys(row, ["Type", "type"])) === "workshop" &&
      normalizeKey(valueByKeys(row, ["Status", "status"])) === "active"
    );
  });

  if (!templates.length) {
    return { ok: false, error: "Chua co form danh gia workshop dang mo." };
  }

  var selected = null;
  if (requestedTemplateId) {
    selected = templates.find(function (row) {
      return normalizeKey(valueByKeys(row, ["TemplateID", "template_id", "id"])) === requestedTemplateId;
    });
  }

  if (!selected && requestedWorkshopId) {
    const workshopTemplates = templates.filter(function (row) {
      return normalizeKey(valueByKeys(row, ["WorkshopID", "workshop_id"])) === requestedWorkshopId;
    });
    selected =
      workshopTemplates.find(function (row) {
        return normalizeKey(valueByKeys(row, ["SessionType", "session_type"])) === requestedSessionType;
      }) ||
      workshopTemplates.find(function (row) {
        return normalizeKey(valueByKeys(row, ["SessionType", "session_type"])) === "main";
      }) ||
      workshopTemplates[0];
  }

  if (!selected) {
    selected =
      templates.find(function (row) {
        return normalizeKey(valueByKeys(row, ["SessionType", "session_type"])) === "main";
      }) || templates[0];
  }

  const questions = getPublicWorkshopQuestions(selected);

  return {
    ok: true,
    template: normalizePublicTemplate(selected),
    evaluationQuestions: questions.map(normalizePublicQuestion),
  };
}

function savePublicWorkshopEvaluation(payload) {
  const answers = payload.answers || {};
  const validation = validateEvaluationRequiredAnswers(payload, answers, true);
  if (!validation.ok) return validation;

  const now = new Date().toISOString();
  const responseId = payload.responseId || makeId("PWE");
  const cohortId = String(valueByKeys(payload, ["cohortId", "cohort", "CohortID"]) || "").trim();
  if (cohortId && getCohortIds(readSheet(CONFIG.SHEETS.USERS).filter(isStudentUser)).indexOf(cohortId) < 0) {
    return { ok: false, error: "Cohort trong link đánh giá không hợp lệ." };
  }
  const response = {
    EvaluationID: responseId,
    ResponseID: responseId,
    UserID: "PUBLIC",
    TemplateID: payload.templateId || "",
    WorkshopID: payload.workshopId || "",
    SessionType: payload.sessionType || "main",
    RespondentType: payload.respondentType || "public",
    CohortID: cohortId,
    Rating: getAverageRating(answers),
    Feedback: getFirstTextAnswer(answers),
    CreatedAt: now,
    UpdatedAt: now,
  };

  appendObject(CONFIG.SHEETS.EVALUATION_RESPONSES, response);

  const answerRows = Object.keys(answers).map(function (questionId) {
    return {
      AnswerID: makeId("ANS"),
      ResponseID: responseId,
      UserID: "PUBLIC",
      TemplateID: response.TemplateID,
      QuestionID: questionId,
      Value: normalizeScenarioAnswerValue(answers[questionId]),
      CreatedAt: now,
      UpdatedAt: now,
    };
  });

  appendObjects(CONFIG.SHEETS.EVALUATION_ANSWERS, answerRows);
  return { ok: true, responseId: responseId };
}

function getPublicFinalSurvey(payload) {
  const template = readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES).find(function (row) {
    return normalizeKey(valueByKeys(row, ["TemplateID", "template_id", "id"])) === "finalsurvey" &&
      normalizeKey(valueByKeys(row, ["Status", "status"])) === "active";
  });
  if (!template) return { ok: false, error: "Khảo sát cuối chương trình chưa được mở." };
  const questions = readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS).filter(function (row) {
    return normalizeKey(valueByKeys(row, ["TemplateID", "template_id"])) === "finalsurvey";
  }).sort(function (a, b) {
    return Number(valueByKeys(a, ["Order", "order"])) - Number(valueByKeys(b, ["Order", "order"]));
  });
  return { ok: true, template: normalizePublicTemplate(template), evaluationQuestions: questions.map(normalizePublicQuestion) };
}

function savePublicFinalSurvey(payload) {
  const answers = payload.answers || {};
  const templateId = "FINALSURVEY";
  const template = readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES).find(function (row) {
    return normalizeKey(valueByKeys(row, ["TemplateID", "template_id", "id"])) === "finalsurvey" &&
      normalizeKey(valueByKeys(row, ["Status", "status"])) === "active";
  });
  if (!template) return { ok: false, error: "Khảo sát cuối chương trình chưa được mở." };
  const questions = readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS).filter(function (row) {
    return normalizeKey(valueByKeys(row, ["TemplateID", "template_id"])) === "finalsurvey";
  });
  const missing = questions.filter(function (question) {
    return isRequiredEvaluationQuestion(valueByKeys(question, ["Required", "required"])) &&
      !hasEvaluationAnswerValue(answers, valueByKeys(question, ["QuestionID", "question_id", "id"]));
  });
  if (missing.length) return { ok: false, error: "Vui lòng trả lời đầy đủ các câu bắt buộc." };
  const consent = String(answers["FINALSURVEY-Q9"] || "");
  if (/^[ABC]:/.test(consent) && !String(answers["FINALSURVEY-Q10"] || "").trim()) {
    return { ok: false, error: "Vui lòng ghi Họ và tên theo hình thức hiển thị đã chọn." };
  }
  if (/^F:/.test(consent) && !String(answers["FINALSURVEY-Q11"] || "").trim()) {
    return { ok: false, error: "Vui lòng ghi rõ hình thức sử dụng chia sẻ mà bạn đồng ý." };
  }
  const now = new Date().toISOString();
  const responseId = makeId("FSR");
  const cohortId = String(payload.cohortId || "K002").trim() || "K002";
  const scaleValues = [1, 2, 3, 4, 5].map(function (n) { return Number(answers["FINALSURVEY-Q" + n]); }).filter(function (n) { return isFinite(n); });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const anonymousId = getNextFinalSurveyAnonymousId(templateId);
    appendObject(CONFIG.SHEETS.EVALUATION_RESPONSES, {
      EvaluationID: responseId, ResponseID: responseId, UserID: anonymousId, TemplateID: templateId,
      WorkshopID: "", SessionType: "final_survey", RespondentType: "public_anonymous", CohortID: cohortId,
      Rating: scaleValues.length ? scaleValues.reduce(function (sum, value) { return sum + value; }, 0) / scaleValues.length : "",
      Feedback: String(answers["FINALSURVEY-Q6"] || ""), CreatedAt: now, UpdatedAt: now
    });
    appendObjects(CONFIG.SHEETS.EVALUATION_ANSWERS, Object.keys(answers).filter(function (questionId) {
      return String(answers[questionId] || "").trim() !== "";
    }).map(function (questionId) {
      return { AnswerID: makeId("ANS"), ResponseID: responseId, UserID: anonymousId, TemplateID: templateId,
        QuestionID: questionId, Value: String(answers[questionId]), CreatedAt: now, UpdatedAt: now };
    }));
    return { ok: true, responseId: responseId, anonymousId: anonymousId };
  } finally {
    lock.releaseLock();
  }
}

function getNextFinalSurveyAnonymousId(templateId) {
  const responses = readOptionalSheet(CONFIG.SHEETS.EVALUATION_RESPONSES).filter(function (row) {
    return normalizeKey(valueByKeys(row, ["TemplateID", "template_id"])) === normalizeKey(templateId);
  });
  const maxAssignedNumber = responses.reduce(function (maxNumber, row) {
    const match = String(valueByKeys(row, ["UserID", "user_id"]) || "").trim().match(/^anonymous\s*(\d+)$/i);
    return match ? Math.max(maxNumber, Number(match[1])) : maxNumber;
  }, 0);
  return "Anonymous " + (Math.max(maxAssignedNumber, responses.length) + 1);
}

function normalizePublicTemplate(row) {
  return {
    id: valueByKeys(row, ["TemplateID", "template_id", "id"]),
    type: valueByKeys(row, ["Type", "type"]) || "workshop",
    workshopId: valueByKeys(row, ["WorkshopID", "workshop_id"]),
    sessionType: valueByKeys(row, ["SessionType", "session_type"]) || "main",
    title: valueByKeys(row, ["Title", "title"]),
    description: valueByKeys(row, ["Description", "description"]),
    status: valueByKeys(row, ["Status", "status"]) || "active",
    formUrl: valueByKeys(row, ["FormURL", "FormUrl", "form_url", "URL"]),
  };
}

function normalizePublicQuestion(row) {
  return {
    id: valueByKeys(row, ["QuestionID", "question_id", "id"]),
    templateId: valueByKeys(row, ["TemplateID", "template_id"]),
    order: Number(valueByKeys(row, ["Order", "order"])) || 0,
    text: valueByKeys(row, ["QuestionText", "Question", "Text", "question_text", "text"]),
    type: valueByKeys(row, ["QuestionType", "Type", "question_type", "type"]) || "text",
    options: valueByKeys(row, ["Options", "options"]),
    required: valueByKeys(row, ["Required", "required"]),
    dimension: valueByKeys(row, ["Dimension", "dimension"]),
  };
}

function validateEvaluationRequiredAnswers(payload, answers, isPublicWorkshop) {
  const templateId = valueByKeys(payload, ["templateId", "template", "TemplateID"]);
  const templateKey = normalizeKey(templateId);
  const template = readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES).find(function (row) {
    return normalizeKey(valueByKeys(row, ["TemplateID", "template_id", "id"])) === templateKey;
  });

  if (!templateKey || !template) {
    return {
      ok: false,
      code: "INVALID_EVALUATION_TEMPLATE",
      error: "Form đánh giá không hợp lệ hoặc đã thay đổi. Vui lòng tải lại form.",
    };
  }

  const questions = isPublicWorkshop
    ? getPublicWorkshopQuestions(template)
    : getAppEvaluationQuestions(template);
  const missingQuestionIds = questions
    .filter(function (question) {
      return isRequiredEvaluationQuestion(valueByKeys(question, ["Required", "required"]));
    })
    .filter(function (question) {
      const questionId = valueByKeys(question, ["QuestionID", "question_id", "id"]);
      return !hasEvaluationAnswerValue(answers, questionId);
    })
    .map(function (question) {
      return valueByKeys(question, ["QuestionID", "question_id", "id"]);
    });

  if (missingQuestionIds.length) {
    return {
      ok: false,
      code: "MISSING_REQUIRED_ANSWERS",
      error: "Còn " + missingQuestionIds.length + " câu bắt buộc chưa trả lời. Vui lòng tải lại form để hoàn thành.",
      missingRequiredCount: missingQuestionIds.length,
    };
  }

  return { ok: true };
}

function getPublicWorkshopQuestions(template) {
  const selectedTemplateId = valueByKeys(template, ["TemplateID", "template_id", "id"]);
  const selectedWorkshopId = valueByKeys(template, ["WorkshopID", "workshop_id"]);
  const selectedSessionType = valueByKeys(template, ["SessionType", "session_type"]) || "main";
  const selectedTemplateKey = normalizeKey(selectedTemplateId);
  const selectedWorkshopKey = normalizeKey(selectedWorkshopId);
  const selectedWorkshopSessionKey = normalizeKey(String(selectedWorkshopId || "") + "-" + String(selectedSessionType || ""));

  return sortEvaluationQuestions(
    readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS).filter(function (row) {
      const questionTemplateId = normalizeKey(valueByKeys(row, ["TemplateID", "template_id"]));
      const questionId = normalizeKey(valueByKeys(row, ["QuestionID", "question_id", "id"]));
      return (
        questionTemplateId === "common" ||
        questionTemplateId === "workshopcommon" ||
        questionTemplateId === "allworkshops" ||
        questionTemplateId === selectedTemplateKey ||
        (selectedWorkshopKey && questionTemplateId === selectedWorkshopKey) ||
        (selectedWorkshopSessionKey && questionTemplateId === selectedWorkshopSessionKey) ||
        (selectedTemplateKey && questionId.indexOf(selectedTemplateKey) === 0) ||
        (selectedWorkshopSessionKey && questionId.indexOf(selectedWorkshopSessionKey) === 0)
      );
    }),
  );
}

function getAppEvaluationQuestions(template) {
  const templateKey = normalizeKey(valueByKeys(template, ["TemplateID", "template_id", "id"]));
  const workshopKey = normalizeKey(valueByKeys(template, ["WorkshopID", "workshop_id"]));
  const sessionKey = normalizeKey(valueByKeys(template, ["SessionType", "session_type"]));
  const typeKey = normalizeKey(valueByKeys(template, ["Type", "type"]));
  const workshopSessionKey = normalizeKey(
    String(valueByKeys(template, ["WorkshopID", "workshop_id"]) || "") + "-" +
      String(valueByKeys(template, ["SessionType", "session_type"]) || ""),
  );
  const commonKeys = ["workshopcommon", typeKey + "common", sessionKey + "common"];

  if (typeKey === "workshop") {
    commonKeys.push("common", "commonworkshop", "all1", "all2", "all3", "all4", "all", "allworkshops");
  }
  if (typeKey === "selfbefore") {
    commonKeys.push("selfcommon", "selfassessmentcommon", "assessmentcommon", "allself");
  }

  return sortEvaluationQuestions(
    readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS).filter(function (row) {
      const questionTemplateKey = normalizeKey(valueByKeys(row, ["TemplateID", "template_id"]));
      const questionIdKey = normalizeKey(valueByKeys(row, ["QuestionID", "question_id", "id"]));
      return (
        questionTemplateKey === templateKey ||
        questionIdKey === templateKey ||
        (workshopKey && questionTemplateKey === workshopKey) ||
        (workshopSessionKey &&
          (questionTemplateKey === workshopSessionKey || questionIdKey.indexOf(workshopSessionKey) === 0)) ||
        commonKeys.indexOf(questionTemplateKey) >= 0 ||
        commonKeys.indexOf(questionIdKey) >= 0
      );
    }),
  );
}

function sortEvaluationQuestions(questions) {
  return questions.sort(function (a, b) {
    const orderA = Number(valueByKeys(a, ["Order", "order"])) || 0;
    const orderB = Number(valueByKeys(b, ["Order", "order"])) || 0;
    return orderA - orderB || String(valueByKeys(a, ["QuestionID", "question_id"])).localeCompare(String(valueByKeys(b, ["QuestionID", "question_id"])));
  });
}

function isRequiredEvaluationQuestion(value) {
  if (value === true || value === 1) return true;
  const key = normalizeKey(value);
  return ["true", "yes", "y", "1", "x", "checked", "required", "batbuoc"].indexOf(key) >= 0;
}

function hasEvaluationAnswerValue(answers, questionId) {
  if (!answers || !Object.prototype.hasOwnProperty.call(answers, questionId)) return false;
  const value = answers[questionId];
  if (Array.isArray(value)) {
    return value.some(function (item) {
      return String(item == null ? "" : item).trim() !== "";
    });
  }
  return String(value == null ? "" : value).trim() !== "";
}

function getPeerAssessment(payload) {
  const targetUserId = valueByKeys(payload, ["targetUserId", "target", "userId", "UserID"]);
  const targetUser = findUserById(targetUserId);
  if (!targetUser) {
    return { ok: false, error: "Không tìm thấy học viên cần đánh giá." };
  }

  const questions = getPeerAssessmentQuestions();
  return {
    ok: true,
    targetUser: {
      UserID: valueByKeys(targetUser, ["UserID", "user_id", "participant_id"]),
      FullName: valueByKeys(targetUser, ["FullName", "full_name", "Name"]),
      Email: valueByKeys(targetUser, ["Email", "email"]),
    },
    evaluationQuestions: questions,
  };
}

function checkPeerAssessmentEmail(payload) {
  const targetUserId = valueByKeys(payload, ["targetUserId", "target", "userId", "UserID"]);
  const targetUser = findUserById(targetUserId);
  if (!targetUser) {
    return { ok: false, error: "Không tìm thấy học viên cần đánh giá." };
  }

  const respondentEmail = normalizePeerRespondentEmail(
    valueByKeys(payload, ["respondentEmail", "RespondentEmail", "email", "Email"]),
  );
  if (!isValidPeerRespondentEmail(respondentEmail)) {
    return { ok: false, error: "Vui lòng nhập đúng email của bạn." };
  }

  const targetId = valueByKeys(targetUser, ["UserID", "user_id", "participant_id"]);
  const templateId = valueByKeys(payload, ["templateId", "template", "TemplateID"]) || "PEER-APP";
  return {
    ok: true,
    duplicate: hasPeerAssessmentResponse(targetId, templateId, respondentEmail),
  };
}

function savePeerAssessment(payload) {
  const now = new Date().toISOString();
  const targetUserId = valueByKeys(payload, ["targetUserId", "target", "userId", "UserID"]);
  const targetUser = findUserById(targetUserId);
  if (!targetUser) {
    return { ok: false, error: "Không tìm thấy học viên cần đánh giá." };
  }

  const targetId = valueByKeys(targetUser, ["UserID", "user_id", "participant_id"]);
  const respondentEmail = normalizePeerRespondentEmail(
    valueByKeys(payload, ["respondentEmail", "RespondentEmail", "email", "Email"]),
  );
  if (!isValidPeerRespondentEmail(respondentEmail)) {
    return { ok: false, error: "Vui lòng nhập đúng email của bạn." };
  }

  const responseId = payload.responseId || makeId("PVR");
  const answers = payload.answers || {};
  const templateId = payload.templateId || "PEER-APP";
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    if (hasPeerAssessmentResponse(targetId, templateId, respondentEmail)) {
      return {
        ok: false,
        code: "DUPLICATE_PEER_ASSESSMENT",
        error: "Email này đã gửi đánh giá cho học viên này rồi.",
      };
    }

    const response = {
      EvaluationID: responseId,
      ResponseID: responseId,
      UserID: targetId,
      TemplateID: templateId,
      WorkshopID: "",
      SessionType: "peer",
      RespondentType: "peer",
      Rating: getAverageRating(answers),
      Feedback: getFirstTextAnswer(answers) || valueByKeys(payload, ["respondentName", "RespondentName"]),
      RespondentEmail: respondentEmail,
      CreatedAt: now,
      UpdatedAt: now,
    };

    appendObject(CONFIG.SHEETS.EVALUATION_RESPONSES, response);

    const answerRows = Object.keys(answers).map(function (questionId) {
      const normalizedValue = normalizeScenarioAnswerValue(answers[questionId]);
      return {
        AnswerID: makeId("ANS"),
        ResponseID: responseId,
        UserID: targetId,
        TemplateID: response.TemplateID,
        QuestionID: questionId,
        Value: normalizedValue,
        CreatedAt: now,
        UpdatedAt: now,
      };
    });
    appendObjects(CONFIG.SHEETS.EVALUATION_ANSWERS, answerRows);
  } finally {
    lock.releaseLock();
  }

  updateStudentStatsForUser(targetId);

  return { ok: true, responseId: responseId };
}

function hasPeerAssessmentResponse(targetUserId, templateId, respondentEmail) {
  const targetKey = normalizeText(targetUserId);
  const templateKey = normalizeText(templateId);
  const emailKey = normalizePeerRespondentEmail(respondentEmail);

  return readOptionalSheet(CONFIG.SHEETS.EVALUATION_RESPONSES).some(function (row) {
    return (
      normalizeText(valueByKeys(row, ["UserID", "user_id", "participant_id"])) === targetKey &&
      normalizeText(valueByKeys(row, ["TemplateID", "template_id"])) === templateKey &&
      normalizePeerRespondentEmail(valueByKeys(row, ["RespondentEmail", "respondent_email"])) === emailKey
    );
  });
}

function normalizePeerRespondentEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidPeerRespondentEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function rebuildStudentStats() {
  const users = readSheet(CONFIG.SHEETS.USERS).filter(isStudentUser);
  users.forEach(function (user) {
    const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
    if (userId) updateStudentStatsForUser(userId, true);
  });
  updateStudentStatsRanks();
  return { ok: true, updated: users.length };
}

function setupStudentStatsUserTrigger() {
  const spreadsheet = getSpreadsheet();
  deleteStudentStatsUserTriggers();

  ScriptApp.newTrigger("handleUsersSheetEditForStudentStats")
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();

  ScriptApp.newTrigger("handleUsersSheetChangeForStudentStats")
    .forSpreadsheet(spreadsheet)
    .onChange()
    .create();

  const synced = syncMissingStudentStats();
  return {
    ok: true,
    triggers: ["handleUsersSheetEditForStudentStats", "handleUsersSheetChangeForStudentStats"],
    synced: synced.updated,
  };
}

function deleteStudentStatsUserTriggers() {
  const handlers = {
    handleUsersSheetEditForStudentStats: true,
    handleUsersSheetChangeForStudentStats: true,
  };

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (handlers[trigger.getHandlerFunction()]) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  return { ok: true };
}

function handleUsersSheetEditForStudentStats(event) {
  const range = event && event.range;
  if (!range) return { ok: true, skipped: true };

  const sheet = range.getSheet();
  if (!sheet || sheet.getName() !== CONFIG.SHEETS.USERS || range.getRow() === 1) {
    return { ok: true, skipped: true };
  }

  const headers = getHeaders(sheet);
  var updated = 0;
  const startRow = range.getRow();
  const endRow = startRow + range.getNumRows() - 1;

  for (var rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
    if (rowNumber === 1) continue;

    const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (!hasAnyValue(row)) continue;

    const user = rowToObject(headers, row);
    const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
    if (userId && isStudentUser(user)) {
      updateStudentStatsForUser(userId, true);
      updated += 1;
    }
  }

  if (updated) updateStudentStatsRanks();
  return { ok: true, updated: updated };
}

function handleUsersSheetChangeForStudentStats(event) {
  const changeType = event && event.changeType ? String(event.changeType) : "";
  if (changeType === "REMOVE_ROW" || changeType === "REMOVE_COLUMN" || changeType === "FORMAT") {
    return { ok: true, skipped: true, changeType: changeType };
  }

  return syncMissingStudentStats();
}

function syncMissingStudentStats() {
  const users = readSheet(CONFIG.SHEETS.USERS).filter(isStudentUser);
  const statsRows = readOptionalSheet(CONFIG.SHEETS.STUDENT_STATS);
  const existing = {};

  statsRows.forEach(function (row) {
    const userId = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
    if (userId) existing[userId] = true;
  });

  var updated = 0;
  users.forEach(function (user) {
    const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
    if (userId && !existing[userId]) {
      updateStudentStatsForUser(userId, true);
      existing[userId] = true;
      updated += 1;
    }
  });

  if (updated) updateStudentStatsRanks();
  return { ok: true, checked: users.length, updated: updated };
}

function setupInstructorSummaryTrigger() {
  deleteInstructorSummaryTriggers();

  ScriptApp.newTrigger("rebuildInstructorSummaries")
    .timeBased()
    .everyHours(1)
    .create();

  const summary = rebuildInstructorSummaries();
  return { ok: true, trigger: "rebuildInstructorSummaries", summary: summary };
}

function deleteInstructorSummaryTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "rebuildInstructorSummaries") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  return { ok: true };
}

function rebuildInstructorSummaries(payload) {
  const cohortId = String(valueByKeys(payload || {}, ["cohortId", "cohort", "CohortID"]) || "").trim();
  const workshopStats = rebuildWorkshopStats(cohortId);
  const challengeStats = rebuildChallengeStats(cohortId);
  const challengeDailyStats = rebuildChallengeDailyStats(cohortId);
  const challenge21dFunnel = rebuildChallenge21dFunnel(cohortId);
  const assessmentSummary = rebuildAssessmentSummary();
  return {
    ok: true,
    workshopStats: workshopStats.updated,
    challengeStats: challengeStats.updated,
    challengeDailyStats: challengeDailyStats.updated,
    challenge21dFunnel: challenge21dFunnel.updated,
    assessmentSummary: assessmentSummary.updated,
    updatedAt: new Date().toISOString(),
  };
}

function rebuildWorkshopStats(requestedCohortId) {
  const allUsers = readSheet(CONFIG.SHEETS.USERS).filter(isStudentUser);
  const workshops = readOptionalSheet(CONFIG.SHEETS.WORKSHOPS);
  const templates = readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES);
  const responses = readOptionalSheet(CONFIG.SHEETS.EVALUATION_RESPONSES);
  const answers = readOptionalSheet(CONFIG.SHEETS.EVALUATION_ANSWERS);
  const questions = readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS);
  const templateById = makeTemplateMap(templates);
  const dimensionByQuestionId = makeQuestionDimensionMap(questions);
  const rows = [];
  const cohortIds = requestedCohortId ? [requestedCohortId] : getCohortIds(allUsers);

  cohortIds.forEach(function (cohortId) {
  const users = allUsers.filter(function (user) { return getUserCohortId(user) === cohortId; });
  const activeStudentIds = makeUserIdSet(users);
  const totalStudents = Object.keys(activeStudentIds).length || 1;

  const responseById = {};
  const responsesByWorkshop = {};
  responses.forEach(function (response) {
    const userId = valueByKeys(response, ["UserID", "user_id", "participant_id"]);
    const isStudentResponse = Boolean(activeStudentIds[userId]);
    const isPublicResponse = normalizeKey(userId) === "public" &&
      String(valueByKeys(response, ["CohortID", "cohort_id", "Cohort", "Batch"]) || "").trim() === cohortId;
    if (!isStudentResponse && !isPublicResponse) return;

    const responseId = valueByKeys(response, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]);
    const workshopId = getResponseWorkshopId(response, templateById);
    if (responseId) responseById[responseId] = { response: response, workshopId: workshopId };
    if (!workshopId) return;

    if (!responsesByWorkshop[workshopId]) responsesByWorkshop[workshopId] = [];
    responsesByWorkshop[workshopId].push(response);
  });

  const dimensionScoresByWorkshop = {};
  answers.forEach(function (answer) {
    const userId = valueByKeys(answer, ["UserID", "user_id", "participant_id"]);
    const responseId = valueByKeys(answer, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]);
    const responseMeta = responseById[responseId];
    if (!activeStudentIds[userId] && !responseMeta) return;
    const workshopId = responseMeta ? responseMeta.workshopId : getResponseWorkshopId(answer, templateById);
    if (!workshopId) return;

    const questionId = valueByKeys(answer, ["QuestionID", "question_id"]);
    const dimension = getWorkshopDimensionLabel(dimensionByQuestionId[questionId] || questionId);
    if (!isWorkshopDimension(dimension)) return;

    const value = Number(valueByKeys(answer, ["Value", "value", "Rating", "rating"]));
    if (!value) return;

    if (!dimensionScoresByWorkshop[workshopId]) dimensionScoresByWorkshop[workshopId] = {};
    if (!dimensionScoresByWorkshop[workshopId][dimension]) dimensionScoresByWorkshop[workshopId][dimension] = [];
    dimensionScoresByWorkshop[workshopId][dimension].push(value);
  });

  const cohortRows = workshops.map(function (workshop) {
    const workshopId = valueByKeys(workshop, ["WorkshopID", "workshop_id"]);
    const participantCount = countWorkshopParticipantsFromUsers(users, workshopId);
    const workshopResponses = responsesByWorkshop[workshopId] || [];
    const respondentCount = countWorkshopResponseIdentities(workshopResponses);
    const dimensionScores = dimensionScoresByWorkshop[workshopId] || {};
    const dimensionAverages = Object.keys(dimensionScores).map(function (dimension) {
      return { dimension: dimension, score: roundNumber(averageNumbers(dimensionScores[dimension]), 1) };
    }).filter(function (item) {
      return item.score > 0;
    });
    const allScores = [];

    dimensionAverages.forEach(function (item) {
      dimensionScores[item.dimension].forEach(function (score) {
        allScores.push(score);
      });
    });

    const strongest = dimensionAverages.slice().sort(function (a, b) {
      return b.score - a.score || a.dimension.localeCompare(b.dimension);
    })[0];
    const weakest = dimensionAverages.slice().sort(function (a, b) {
      return a.score - b.score || a.dimension.localeCompare(b.dimension);
    })[0];

    return {
      CohortID: cohortId,
      WorkshopID: workshopId,
      ParticipantCount: participantCount,
      AttendanceRate: percent(participantCount, totalStudents),
      ResponseCount: respondentCount,
      EvaluationParticipationRate: Math.min(100, percent(respondentCount, participantCount || totalStudents)),
      AverageScore: allScores.length ? roundNumber(averageNumbers(allScores), 1) : "",
      ALL1Score: getWorkshopDimensionAverage(dimensionAverages, "Rõ ràng"),
      ALL2Score: getWorkshopDimensionAverage(dimensionAverages, "Liên quan"),
      ALL3Score: getWorkshopDimensionAverage(dimensionAverages, "Facilitator"),
      ALL4Score: getWorkshopDimensionAverage(dimensionAverages, "An toàn chia sẻ"),
      "Objective Achievement": getWorkshopDimensionAverage(dimensionAverages, "Objective Achievement"),
      StrongestDimension: strongest ? strongest.dimension + " · " + strongest.score + "/5" : "",
      WeakestDimension: weakest ? weakest.dimension + " · " + weakest.score + "/5" : "",
    };
  });
  Array.prototype.push.apply(rows, cohortRows);
  });

  writeCohortSummaryRows(CONFIG.SHEETS.WORKSHOP_STATS, rows, requestedCohortId);
  return { ok: true, updated: rows.length };
}

function rebuildChallengeStats(requestedCohortId) {
  const allUsers = readSheet(CONFIG.SHEETS.USERS).filter(isStudentUser);
  const miniChallenges = readOptionalSheet(CONFIG.SHEETS.MINI_CHALLENGES);
  const checkins = readOptionalSheet(CONFIG.SHEETS.CHECKINS);
  const challengeMap = {};

  miniChallenges.forEach(function (challenge) {
    const rawChallengeId = valueByKeys(challenge, ["ChallengeID", "challenge_id"]);
    const challengeId = getChallengeGroupId(rawChallengeId);
    if (!challengeId) return;

    if (!challengeMap[challengeId]) {
      challengeMap[challengeId] = {
        ChallengeID: challengeId,
        WorkshopID: valueByKeys(challenge, ["WorkshopID", "workshop_id"]),
        days: {},
      };
    }

    const day = Number(valueByKeys(challenge, ["Day", "day"])) || getChallengeDayFromId(rawChallengeId);
    if (day) challengeMap[challengeId].days[day] = true;
  });

  const rows = [];
  const cohortIds = requestedCohortId ? [requestedCohortId] : getCohortIds(allUsers);
  cohortIds.forEach(function (cohortId) {
  const users = allUsers.filter(function (user) { return getUserCohortId(user) === cohortId; });
  const activeStudentIds = makeUserIdSet(users);
  const totalStudents = Object.keys(activeStudentIds).length || 1;
  const completions = {};
  checkins.forEach(function (checkin) {
    const userId = valueByKeys(checkin, ["UserID", "user_id", "participant_id"]);
    if (!activeStudentIds[userId]) return;
    if (!isTruthyValue(valueByKeys(checkin, ["Completed", "completed"]))) return;

    const rawChallengeId = valueByKeys(checkin, ["ChallengeID", "challenge_id"]);
    const challengeId = getChallengeGroupId(rawChallengeId);
    if (!challengeId) return;

    const day = Number(valueByKeys(checkin, ["Day", "day"])) || getChallengeDayFromId(rawChallengeId);
    if (!day) return;

    if (!completions[challengeId]) completions[challengeId] = {};
    if (!completions[challengeId][userId]) completions[challengeId][userId] = {};
    completions[challengeId][userId][day] = true;
  });

  const cohortRows = Object.keys(challengeMap).sort().map(function (challengeId) {
    const challenge = challengeMap[challengeId];
    const totalDays = Object.keys(challenge.days).length;
    const threshold = Math.max(1, Math.ceil(totalDays * 0.8));
    const finalWeekStart = Math.max(1, totalDays - 6);
    const userCompletions = completions[challengeId] || {};
    var completedSlots = 0;
    var completion80Users = 0;
    var dropoutUsers = 0;

    users.forEach(function (user) {
      const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
      const days = userCompletions[userId] || {};
      const completedCount = Object.keys(days).length;
      var finalWeekCompleted = 0;

      Object.keys(days).forEach(function (dayKey) {
        completedSlots += 1;
        if (Number(dayKey) >= finalWeekStart) finalWeekCompleted += 1;
      });

      if (completedCount >= threshold) completion80Users += 1;
      if (totalDays >= 7 && finalWeekCompleted < 2) dropoutUsers += 1;
    });

    return {
      CohortID: cohortId,
      ChallengeID: challengeId,
      WorkshopID: challenge.WorkshopID,
      TotalDays: totalDays,
      RetentionRate: totalDays ? percent(completedSlots, totalStudents * totalDays) : 0,
      Completion80Rate: percent(completion80Users, totalStudents),
      DropoutRate: totalDays >= 7 ? percent(dropoutUsers, totalStudents) : 0,
    };
  });
  Array.prototype.push.apply(rows, cohortRows);
  });

  writeCohortSummaryRows(CONFIG.SHEETS.CHALLENGE_STATS, rows, requestedCohortId);
  return { ok: true, updated: rows.length };
}

function rebuildChallengeDailyStats(requestedCohortId) {
  const users = readSheet(CONFIG.SHEETS.USERS).filter(isStudentUser);
  const challenges = readOptionalSheet(CONFIG.SHEETS.MINI_CHALLENGES);
  const checkins = readOptionalSheet(CONFIG.SHEETS.CHECKINS);
  const cohortIds = requestedCohortId ? [requestedCohortId] : getCohortIds(users);
  const rows = [];

  cohortIds.forEach(function (cohortId) {
    const cohortUsers = users.filter(function (user) { return getUserCohortId(user) === cohortId; });
    const studentIds = makeUserIdSet(cohortUsers);
    const totalStudents = cohortUsers.length || 1;
    challenges.forEach(function (challenge) {
      const challengeId = getChallengeGroupId(valueByKeys(challenge, ["ChallengeID", "challenge_id"]));
      const day = Number(valueByKeys(challenge, ["Day", "day"])) || getChallengeDayFromId(valueByKeys(challenge, ["ChallengeID", "challenge_id"]));
      if (!challengeId || !day) return;
      const completedUsers = {};
      checkins.forEach(function (checkin) {
        const userId = valueByKeys(checkin, ["UserID", "user_id", "participant_id"]);
        if (!studentIds[userId] || !isTruthyValue(valueByKeys(checkin, ["Completed", "completed"]))) return;
        const checkinChallengeId = getChallengeGroupId(valueByKeys(checkin, ["ChallengeID", "challenge_id"]));
        const checkinDay = Number(valueByKeys(checkin, ["Day", "day"])) || getChallengeDayFromId(valueByKeys(checkin, ["ChallengeID", "challenge_id"]));
        if (checkinChallengeId === challengeId && checkinDay === day) completedUsers[userId] = true;
      });
      const rate = percent(Object.keys(completedUsers).length, totalStudents);
      rows.push({
        CohortID: cohortId,
        ChallengeID: challengeId,
        Day: day,
        CheckinRate: rate,
        Status: rate >= 70 ? "good" : rate >= 30 ? "medium" : "low",
      });
    });
  });

  writeCohortSummaryRows(CONFIG.SHEETS.CHALLENGE_DAILY_STATS, rows, requestedCohortId);
  return { ok: true, updated: rows.length };
}

function rebuildChallenge21dFunnel(requestedCohortId) {
  const users = readSheet(CONFIG.SHEETS.USERS).filter(isStudentUser);
  const challenges = readOptionalSheet(CONFIG.SHEETS.MINI_CHALLENGES);
  const checkins = readOptionalSheet(CONFIG.SHEETS.CHECKINS);
  const cohortIds = requestedCohortId ? [requestedCohortId] : getCohortIds(users);
  const challengeDays = {};
  const rows = [];
  challenges.forEach(function (challenge) {
    const challengeId = getChallengeGroupId(valueByKeys(challenge, ["ChallengeID", "challenge_id"]));
    const day = Number(valueByKeys(challenge, ["Day", "day"])) || getChallengeDayFromId(valueByKeys(challenge, ["ChallengeID", "challenge_id"]));
    if (!challengeId || !day) return;
    if (!challengeDays[challengeId]) challengeDays[challengeId] = {};
    challengeDays[challengeId][day] = true;
  });

  cohortIds.forEach(function (cohortId) {
    const cohortUsers = users.filter(function (user) { return getUserCohortId(user) === cohortId; });
    const studentIds = makeUserIdSet(cohortUsers);
    const participantCount = cohortUsers.length;
    Object.keys(challengeDays).forEach(function (challengeId) {
      const totalDays = Math.max.apply(null, Object.keys(challengeDays[challengeId]).map(Number));
      if (totalDays < 7) return;
      const milestones = [1, 7, 14, 21].filter(function (day) { return day <= totalDays; });
      if (milestones.indexOf(totalDays) < 0) milestones.push(totalDays);
      milestones.forEach(function (day) {
        const activeUsers = {};
        checkins.forEach(function (checkin) {
          const userId = valueByKeys(checkin, ["UserID", "user_id", "participant_id"]);
          if (!studentIds[userId] || !isTruthyValue(valueByKeys(checkin, ["Completed", "completed"]))) return;
          const checkinChallengeId = getChallengeGroupId(valueByKeys(checkin, ["ChallengeID", "challenge_id"]));
          const checkinDay = Number(valueByKeys(checkin, ["Day", "day"])) || getChallengeDayFromId(valueByKeys(checkin, ["ChallengeID", "challenge_id"]));
          if (checkinChallengeId === challengeId && checkinDay >= day) activeUsers[userId] = true;
        });
        const activeCount = Object.keys(activeUsers).length;
        rows.push({
          CohortID: cohortId,
          ChallengeID: challengeId,
          Milestone: "Ngày " + day,
          Day: day,
          ParticipantCount: participantCount,
          ActiveCount: activeCount,
          RetentionRate: percent(activeCount, participantCount || 1),
        });
      });
    });
  });

  writeCohortSummaryRows(CONFIG.SHEETS.CHALLENGE_21D_FUNNEL, rows, requestedCohortId);
  return { ok: true, updated: rows.length };
}

function writeCohortSummaryRows(sheetName, rows, requestedCohortId) {
  if (!requestedCohortId) {
    writeObjectsToSheet(sheetName, rows);
    return;
  }
  const retained = readOptionalSheet(sheetName).filter(function (row) {
    return getUserCohortId(row) !== requestedCohortId;
  });
  writeObjectsToSheet(sheetName, retained.concat(rows));
}

function rebuildAssessmentSummary() {
  const users = readSheet(CONFIG.SHEETS.USERS).filter(isStudentUser);
  const templates = readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES);
  const responses = readOptionalSheet(CONFIG.SHEETS.EVALUATION_RESPONSES);
  const answers = readOptionalSheet(CONFIG.SHEETS.EVALUATION_ANSWERS);
  const questions = readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS);
  const existingRows = readOptionalSheet(CONFIG.SHEETS.ASSESSMENT_SUMMARY);
  const activeStudentIds = makeUserIdSet(users);
  const templateById = makeTemplateMap(templates);
  const questionById = makeQuestionMap(questions);
  const responseById = {};
  const grouped = {};
  const publishedStatusByUser = {};
  const selfAnswerCountByUser = {};
  const peerResponseIdsByUser = {};

  existingRows.forEach(function (row) {
    const userId = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
    const status = normalizeKey(valueByKeys(row, ["ReportStatus", "Status", "status"]));
    if (userId && (status === "published" || status === "open" || status === "completed" || status === "done")) {
      publishedStatusByUser[userId] = valueByKeys(row, ["ReportStatus", "Status", "status"]) || "published";
    }
  });

  responses.forEach(function (response) {
    const responseId = valueByKeys(response, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]);
    if (responseId) responseById[responseId] = response;
  });

  answers.forEach(function (answer) {
    const userId = valueByKeys(answer, ["UserID", "user_id", "participant_id"]);
    if (!activeStudentIds[userId]) return;

    const questionId = valueByKeys(answer, ["QuestionID", "question_id"]);
    const question = questionById[questionId] || {};
    const dimension = getLeadershipDimensionLabel(valueByKeys(question, ["Dimension", "dimension"]));
    if (!dimension) return;

    const value = normalizeScenarioAnswerValue(valueByKeys(answer, ["Value", "value"]));
    if (value !== "creative" && value !== "reactive") return;

    const responseId = valueByKeys(answer, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]);
    const response = responseById[responseId] || answer;
    const kind = getTemplateKind(response, templateById);
    const bucket = kind.indexOf("peer") === 0 ? "peer" : kind.indexOf("self") === 0 ? "self" : "";
    if (!bucket) return;

    const key = userId + "||" + dimension;
    if (!grouped[key]) {
      grouped[key] = {
        UserID: userId,
        Dimension: dimension,
        selfValues: [],
        peerValues: [],
        latest: null,
      };
    }

    grouped[key][bucket + "Values"].push(value);
    if (bucket === "self") {
      selfAnswerCountByUser[userId] = (selfAnswerCountByUser[userId] || 0) + 1;
    } else if (bucket === "peer") {
      if (!peerResponseIdsByUser[userId]) peerResponseIdsByUser[userId] = {};
      peerResponseIdsByUser[userId][responseId || valueByKeys(answer, ["AnswerID", "answer_id"]) || makeId("peer-answer")] = true;
    }
    const updatedAt = getFirstDateValue(answer, ["UpdatedAt", "CreatedAt"]);
    if (updatedAt && (!grouped[key].latest || updatedAt.getTime() > grouped[key].latest.getTime())) {
      grouped[key].latest = updatedAt;
    }
  });

  const dataReadyByUserId = {};
  users.forEach(function (user) {
    const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
    const peerCount = Object.keys(peerResponseIdsByUser[userId] || {}).length;
    dataReadyByUserId[userId] = (selfAnswerCountByUser[userId] || 0) > 0 && peerCount >= 3;
  });

  const rows = Object.keys(grouped).sort().map(function (key) {
    const item = grouped[key];
    const selfScore = percent(countValues(item.selfValues, "creative"), item.selfValues.length);
    const peerScore = percent(countValues(item.peerValues, "creative"), item.peerValues.length);
    const status = publishedStatusByUser[item.UserID] || (dataReadyByUserId[item.UserID] ? "data_ready" : "pending");
    return {
      UserID: item.UserID,
      Dimension: item.Dimension,
      SelfScore: item.selfValues.length ? selfScore : "",
      PeerScore: item.peerValues.length ? peerScore : "",
      Insight: buildAssessmentInsight(selfScore, peerScore, item.selfValues.length, item.peerValues.length),
      ReportStatus: status,
      CompletedAt: item.latest ? item.latest.toISOString() : "",
    };
  });

  writeObjectsToSheet(CONFIG.SHEETS.ASSESSMENT_SUMMARY, rows);
  return { ok: true, updated: rows.length };
}

function publishAssessmentReport(payload) {
  const userId = valueByKeys(payload || {}, ["userId", "UserID", "targetUserId", "participant_id"]);
  if (!userId) throw new Error("Missing userId");

  rebuildAssessmentSummary();

  const rows = readOptionalSheet(CONFIG.SHEETS.ASSESSMENT_SUMMARY);
  const now = new Date().toISOString();
  let updated = 0;
  const nextRows = rows.map(function (row) {
    if (valueByKeys(row, ["UserID", "user_id", "participant_id"]) !== userId) return row;
    updated += 1;
    return Object.assign({}, row, {
      ReportStatus: "published",
      CompletedAt: valueByKeys(row, ["CompletedAt", "Completed At", "UpdatedAt"]) || now,
    });
  });

  if (!updated) throw new Error("No assessment summary rows for user: " + userId);

  writeObjectsToSheet(CONFIG.SHEETS.ASSESSMENT_SUMMARY, nextRows);
  const reportLink = updateUserLeadershipReportLink(userId, payload);
  const emailResult = sendLeadershipReportEmailIfNeeded(userId, reportLink);
  return {
    ok: true,
    userId: userId,
    updated: updated,
    reportStatus: "published",
    reportLink: reportLink,
    emailStatus: emailResult.status,
    email: emailResult.email || "",
    emailError: emailResult.error || "",
  };
}

function updateUserLeadershipReportLink(userId, payload) {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEETS.USERS);
  if (!sheet) return "";

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return "";

  const headers = normalizeHeaders(values[0]);
  const userIdColumn = findHeaderIndex(headers, ["UserID", "user_id", "participant_id"]);
  const reportLinkColumn = findHeaderIndex(headers, [
    "LeadershipReportLink",
    "LeadershipReportURL",
    "ReportURL",
    "ReportLink",
    "Leadership Report URL",
  ]);
  if (userIdColumn === -1 || reportLinkColumn === -1) return "";

  const reportLink = buildLeadershipReportLink(userId, payload);
  for (var index = 1; index < values.length; index++) {
    if (String(values[index][userIdColumn]) === String(userId)) {
      sheet.getRange(index + 1, reportLinkColumn + 1).setValue(reportLink);
      return reportLink;
    }
  }

  return "";
}

function buildLeadershipReportLink(userId, payload) {
  const baseUrl =
    String(valueByKeys(payload || {}, ["reportShareBaseUrl", "reportBaseUrl"]) || "").trim() ||
    "https://ldkt-hoc-vien-report.vercel.app";
  return baseUrl.replace(/\/$/, "") + "/r/" + encodeURIComponent(userId);
}

function sendLeadershipReportEmailIfNeeded(userId, reportLink) {
  if (!userId) return { status: "skipped", error: "Missing userId" };
  if (!reportLink) return { status: "skipped", error: "Missing report link" };

  const users = readOptionalSheet(CONFIG.SHEETS.USERS);
  const user = users.find(function (row) {
    return String(valueByKeys(row, ["UserID", "user_id", "participant_id"])) === String(userId);
  });
  if (!user) return { status: "skipped", error: "User not found" };

  const email = String(valueByKeys(user, ["Email", "email", "Gmail", "Mail"]) || "").trim();
  const fullName = String(valueByKeys(user, ["FullName", "full_name", "Name", "Họ tên", "HoTen"]) || userId).trim();
  if (!email) return { status: "skipped", error: "Missing email", fullName: fullName };

  const logs = readOptionalSheet(CONFIG.SHEETS.EMAIL_LOGS);
  if (hasLeadershipReportEmailLog(logs, userId, reportLink)) {
    return { status: "skipped", email: email, fullName: fullName, error: "Already sent" };
  }

  const subject = "LEADERSHIP EVALUATION - Báo cáo kết quả - " + fullName;
  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: buildLeadershipReportEmailText(fullName, reportLink),
      htmlBody: buildLeadershipReportEmailHtml(fullName, reportLink),
    });
    appendLeadershipReportEmailLog(userId, email, reportLink, "sent", "");
    return { status: "sent", email: email, fullName: fullName };
  } catch (error) {
    appendLeadershipReportEmailLog(userId, email, reportLink, "error", String(error));
    return { status: "error", email: email, fullName: fullName, error: String(error) };
  }
}

function hasLeadershipReportEmailLog(logs, userId, reportLink) {
  return logs.some(function (row) {
    return (
      String(valueByKeys(row, ["UserID", "user_id"])) === String(userId) &&
      normalizeKey(valueByKeys(row, ["Type", "EmailType", "Category", "Date"])) === "leadershipreport" &&
      String(valueByKeys(row, ["ReportLink", "Link", "Tasks"])) === String(reportLink) &&
      normalizeText(valueByKeys(row, ["Status", "status"])) === "sent"
    );
  });
}

function appendLeadershipReportEmailLog(userId, email, reportLink, status, error) {
  try {
    appendObject(CONFIG.SHEETS.EMAIL_LOGS, {
      LogID: makeId("MAIL"),
      Type: "leadership_report",
      UserID: userId,
      Email: email,
      Date: "leadership_report",
      Tasks: reportLink,
      ReportLink: reportLink,
      Status: status,
      SentAt: new Date().toISOString(),
      Error: error || "",
    });
  } catch (logError) {
    Logger.log("Leadership report email log failed: " + logError);
  }
}

function buildLeadershipReportEmailText(fullName, reportLink) {
  return [
    "Chào anh/chị/bạn " + fullName + ";",
    "",
    "SEN Pharma chúc mừng anh/chị/bạn đã hoàn thành phần thực hiện đánh giá “Từ LÃNH ĐẠO PHẢN ỨNG đến LÃNH ĐẠO SÁNG TẠO”. Báo cáo chi tiết của anh/chị/bạn đã sẵn sàng tại link dưới đây:",
    reportLink,
    "",
    "Bản báo cáo này không nhằm mục đích chấm điểm hay phân loại năng lực. Thay vào đó, nó đóng vai trò như một “tấm gương phản chiếu” những xu hướng hành vi của anh/chị/bạn trong các bối cảnh cụ thể. Chúng tôi khuyến khích anh/chị/bạn dành một khoảng không gian yên tĩnh để đọc kỹ và thực hiện theo hướng dẫn trong báo cáo, từ đó khám phá những insights giá trị cho hành trình phát triển của mình.",
    "",
    "Hãy nhớ rằng, nhận diện được \"phản ứng\" chính là bước đầu tiên để chuyển dịch lên \"sáng tạo\".",
    "",
    "Nếu anh/chị/bạn có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ qua:",
    "- Hotline: 0869.180.917",
    "- Email: support@senpharma.vn",
    "",
    "Trân trọng,",
    "SEN Pharma",
  ].join("\n");
}

function buildLeadershipReportEmailHtml(fullName, reportLink) {
  return [
    '<div style="font-family:Arial,sans-serif;line-height:1.65;color:#0d132b;font-size:15px">',
    "<p>Chào anh/chị/bạn <b>" + escapeHtml(fullName) + "</b>;</p>",
    '<p>SEN Pharma chúc mừng anh/chị/bạn đã hoàn thành phần thực hiện đánh giá <b>“Từ LÃNH ĐẠO PHẢN ỨNG đến LÃNH ĐẠO SÁNG TẠO”</b>. Báo cáo chi tiết của anh/chị/bạn đã sẵn sàng trong đường link dưới đây.</p>',
    '<p><a href="' + escapeHtml(reportLink) + '" style="display:inline-block;background:#16826d;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700">Mở báo cáo Leadership Assessment</a></p>',
    '<p style="word-break:break-all;color:#5d6680">' + escapeHtml(reportLink) + "</p>",
    '<p>Bản báo cáo này không nhằm mục đích chấm điểm hay phân loại năng lực. Thay vào đó, nó đóng vai trò như một <b>“tấm gương phản chiếu”</b> những xu hướng hành vi của anh/chị/bạn trong các bối cảnh cụ thể. Chúng tôi khuyến khích anh/chị/bạn dành một khoảng không gian yên tĩnh để đọc kỹ và thực hiện theo hướng dẫn trong báo cáo, từ đó khám phá những insights giá trị cho hành trình phát triển của mình.</p>',
    '<p>Hãy nhớ rằng, nhận diện được "phản ứng" chính là bước đầu tiên để chuyển dịch lên "sáng tạo".</p>',
    "<p>Nếu anh/chị/bạn có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ qua:</p>",
    "<ul>",
    "<li>Hotline: 0869.180.917</li>",
    "<li>Email: support@senpharma.vn</li>",
    "</ul>",
    "<p>Trân trọng,<br/>SEN Pharma</p>",
    "</div>",
  ].join("");
}

function updateStudentStatsForUser(userId, skipRankUpdate) {
  if (!userId) return null;

  const users = readSheet(CONFIG.SHEETS.USERS);
  const user = users.find(function (row) {
    return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
  });
  if (!user) return null;

  const checkins = readOptionalSheet(CONFIG.SHEETS.CHECKINS);
  const groupCheckins = readOptionalSheet(CONFIG.SHEETS.GROUP_CHECKINS);
  const responses = readOptionalSheet(CONFIG.SHEETS.EVALUATION_RESPONSES);
  const templates = readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES);
  const miniChallenges = readOptionalSheet(CONFIG.SHEETS.MINI_CHALLENGES);
  const workshops = readOptionalSheet(CONFIG.SHEETS.WORKSHOPS);
  const now = new Date().toISOString();

  const userCheckins = checkins.filter(function (row) {
    return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId && isTruthyValue(valueByKeys(row, ["Completed", "completed"]));
  });
  const uniqueCheckinKeys = {};
  userCheckins.forEach(function (row) {
    const key = valueByKeys(row, ["ChallengeID", "challenge_id"]) ||
      [valueByKeys(row, ["WorkshopID", "workshop_id"]), valueByKeys(row, ["Day", "day"])].join("-");
    uniqueCheckinKeys[key] = true;
  });

  const userResponses = responses.filter(function (row) {
    return valueByKeys(row, ["UserID", "user_id", "participant_id"]) === userId;
  });
  const templateById = {};
  templates.forEach(function (template) {
    const templateId = valueByKeys(template, ["TemplateID", "template_id"]);
    if (templateId) templateById[templateId] = template;
  });

  const selfBeforeDone = userResponses.some(function (row) {
    return isSelfBeforeTemplate(row, templateById);
  });
  const selfAfterDone = userResponses.some(function (row) {
    return isSelfAfterTemplate(row, templateById);
  });
  const peerBeforeCount = userResponses.filter(function (row) {
    return isPeerBeforeTemplate(row, templateById);
  }).length;
  const peerAfterCount = userResponses.filter(function (row) {
    return isPeerAfterTemplate(row, templateById);
  }).length;
  const peerFeedbackCount = peerBeforeCount + peerAfterCount;
  const checkinCount = Object.keys(uniqueCheckinKeys).length;
  const xp = calculateUserXp(user, userCheckins, groupCheckins, userResponses, templateById, workshops);
  setUserXp(userId, xp);
  const lastCheckinAt = getLatestDateValue(userCheckins, ["UpdatedAt", "CreatedAt", "Date", "Timestamp"]);
  const longestStreak = calculateLongestStreak(userCheckins);
  const progressPercent = calculateStudentProgress(user, checkinCount, selfBeforeDone, selfAfterDone, peerFeedbackCount, miniChallenges, workshops);
  const hasStarted = checkinCount > 0 || countCompletedWorkshopColumns(user) > 0 || selfBeforeDone || selfAfterDone || peerFeedbackCount > 0;
  const status = !hasStarted ? "Chưa bắt đầu" : progressPercent >= 70 ? "Tốt" : "Cần chú ý";

  const stats = {
    UserID: userId,
    FullName: valueByKeys(user, ["FullName", "full_name", "Name"]),
    XP: xp,
    LongestStreak: longestStreak,
    CheckinCount: checkinCount,
    PeerFeedbackCount: peerFeedbackCount,
    PeerBeforeCount: peerBeforeCount,
    PeerAfterCount: peerAfterCount,
    SelfBeforeDone: selfBeforeDone ? "TRUE" : "FALSE",
    SelfAfterDone: selfAfterDone ? "TRUE" : "FALSE",
    ProgressPercent: progressPercent,
    Status: status,
    LastCheckinAt: lastCheckinAt ? lastCheckinAt.toISOString() : "",
    LastUpdated: now,
  };

  upsertObject(CONFIG.SHEETS.STUDENT_STATS, stats, function (existing) {
    return valueByKeys(existing, ["UserID", "user_id", "participant_id"]) === userId;
  });

  if (!skipRankUpdate) updateStudentStatsRanks();
  return stats;
}

function updateStudentStatsRanks() {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEETS.STUDENT_STATS);
  if (!sheet || sheet.getLastRow() < 2) return;

  const values = sheet.getDataRange().getValues();
  const headers = normalizeHeaders(values[0]);
  const rankColumn = findHeaderIndex(headers, ["Rank", "rank"]);
  const userIdColumn = findHeaderIndex(headers, ["UserID", "user_id", "participant_id"]);
  const xpColumn = findHeaderIndex(headers, ["XP", "xp", "Points", "TotalXP", "Score"]);
  if (rankColumn === -1 || userIdColumn === -1 || xpColumn === -1) return;

  const rows = [];
  for (var index = 1; index < values.length; index++) {
    if (!hasAnyValue(values[index])) continue;
    rows.push({
      rowNumber: index + 1,
      userId: values[index][userIdColumn],
      xp: Number(values[index][xpColumn]) || 0,
    });
  }

  rows.sort(function (a, b) {
    return b.xp - a.xp || String(a.userId).localeCompare(String(b.userId));
  });
  rows.forEach(function (row, index) {
    sheet.getRange(row.rowNumber, rankColumn + 1).setValue(index + 1);
  });
}

function isStudentUser(user) {
  const role = normalizeText(valueByKeys(user, ["Role", "role"]));
  const status = normalizeText(valueByKeys(user, ["Status", "ParticipationStatus", "participation_status"]) || "active");
  return status === "active" && role.indexOf("giang vien") === -1 && role.indexOf("teacher") === -1 && role.indexOf("admin") === -1;
}

function isSelfBeforeTemplate(response, templateById) {
  return getTemplateKind(response, templateById) === "self_before";
}

function isSelfAfterTemplate(response, templateById) {
  return getTemplateKind(response, templateById) === "self_after";
}

function isPeerBeforeTemplate(response, templateById) {
  const kind = getTemplateKind(response, templateById);
  return kind === "peer_before" || kind === "peer_360" || kind === "peer_app";
}

function isPeerAfterTemplate(response, templateById) {
  return getTemplateKind(response, templateById) === "peer_after";
}

function getTemplateKind(response, templateById) {
  const templateId = String(valueByKeys(response, ["TemplateID", "template_id"]) || "");
  const template = templateById[templateId] || {};
  const type = normalizeKey(valueByKeys(template, ["Type", "type"]));
  const title = normalizeKey(valueByKeys(template, ["Title", "title"]));
  const idKey = normalizeKey(templateId);

  if (type === "selfbefore" || idKey === "selfbefore" || title.indexOf("dauchuongtrinh") >= 0) return "self_before";
  if (type === "selfafter" || idKey === "selfafter" || title.indexOf("sauchuongtrinh") >= 0) return "self_after";
  if (type === "peerafter" || type === "otherafter" || idKey === "peerafter" || idKey === "otherafter" || title.indexOf("sauchuongtrinh") >= 0 && (type === "peer" || type === "other")) return "peer_after";
  if (type === "peerbefore" || type === "otherbefore" || idKey === "peer360" || idKey === "peerapp" || idKey === "otherbefore" || title.indexOf("nhanguoikhacdanhgia") >= 0) return "peer_before";
  if (type === "peer" || type === "other" || type === "360") return "peer_before";
  return type || idKey;
}

function calculateStudentProgress(user, checkinCount, selfBeforeDone, selfAfterDone, peerFeedbackCount, miniChallenges, workshops) {
  const totalChallengeDays = countUniqueValues(miniChallenges, ["ChallengeID", "challenge_id"]);
  const checkinScore = totalChallengeDays ? Math.min(checkinCount / totalChallengeDays, 1) * 40 : 0;
  const workshopTotal = workshops.filter(function (workshop) {
    return normalizeKey(valueByKeys(workshop, ["WorkshopID", "workshop_id"])).indexOf("ws") === 0;
  }).length;
  const workshopDone = countCompletedWorkshopColumns(user);
  const workshopScore = workshopTotal ? Math.min(workshopDone / workshopTotal, 1) * 25 : 0;
  const selfScore = ((selfBeforeDone ? 1 : 0) + (selfAfterDone ? 1 : 0)) / 2 * 15;
  const peerScore = Math.min(peerFeedbackCount / 6, 1) * 20;
  return Math.round(checkinScore + workshopScore + selfScore + peerScore);
}

function calculateUserXp(user, userCheckins, groupCheckins, userResponses, templateById, workshops) {
  const completedCheckinKeys = {};
  (userCheckins || []).forEach(function (row) {
    const key = valueByKeys(row, ["ChallengeID", "challenge_id"]) ||
      [valueByKeys(row, ["WorkshopID", "workshop_id"]), valueByKeys(row, ["Day", "day"])].join("-");
    if (key) completedCheckinKeys[key] = true;
  });

  const groupCheckinKeys = {};
  (groupCheckins || []).forEach(function (row) {
    const rowUserId = valueByKeys(row, ["UserID", "user_id", "participant_id"]);
    const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
    if (String(rowUserId) !== String(userId)) return;

    const key = [
      valueByKeys(row, ["GroupID", "group_id"]),
      valueByKeys(row, ["Week", "week"]),
    ].join("-");
    if (key) groupCheckinKeys[key] = true;
  });

  const selfEvaluationKeys = {};
  (userResponses || []).forEach(function (row) {
    const kind = getTemplateKind(row, templateById || {});
    if (kind.indexOf("self") !== 0) return;
    if (valueByKeys(row, ["WorkshopID", "workshop_id"])) return;

    const key = valueByKeys(row, ["TemplateID", "template_id"]) ||
      valueByKeys(row, ["ResponseID", "EvaluationID", "response_id"]);
    if (key) selfEvaluationKeys[key] = true;
  });

  const attendedWorkshopIds = {};
  (workshops || []).forEach(function (workshop) {
    const workshopId = valueByKeys(workshop, ["WorkshopID", "workshop_id", "id"]);
    if (workshopId && isTruthyValue(valueByKeys(user, [workshopId]))) {
      attendedWorkshopIds[normalizeKey(workshopId)] = true;
    }
  });

  return (
    Object.keys(completedCheckinKeys).length * 20 +
    Object.keys(groupCheckinKeys).length * 30 +
    Object.keys(selfEvaluationKeys).length * 20 +
    Object.keys(attendedWorkshopIds).length * 20
  );
}

function countCompletedWorkshopColumns(user) {
  return Object.keys(user).filter(function (key) {
    return /^WS\d+$/i.test(String(key).trim()) && isTruthyValue(user[key]);
  }).length;
}

function countWorkshopParticipantsFromUsers(users, workshopId) {
  return users.filter(function (user) {
    return isTruthyValue(valueByKeys(user, [workshopId]));
  }).length;
}

function makeUserIdSet(users) {
  const map = {};
  users.forEach(function (user) {
    const userId = valueByKeys(user, ["UserID", "user_id", "participant_id"]);
    if (userId) map[userId] = true;
  });
  return map;
}

function makeTemplateMap(templates) {
  const map = {};
  templates.forEach(function (template) {
    const templateId = valueByKeys(template, ["TemplateID", "template_id"]);
    if (templateId) map[templateId] = template;
  });
  return map;
}

function makeQuestionMap(questions) {
  const map = {};
  questions.forEach(function (question) {
    const questionId = valueByKeys(question, ["QuestionID", "question_id"]);
    if (questionId) map[questionId] = question;
  });
  return map;
}

function makeQuestionDimensionMap(questions) {
  const map = {};
  questions.forEach(function (question) {
    const questionId = valueByKeys(question, ["QuestionID", "question_id"]);
    if (questionId) map[questionId] = valueByKeys(question, ["Dimension", "dimension"]);
  });
  return map;
}

function getResponseWorkshopId(row, templateById) {
  const directWorkshopId = valueByKeys(row, ["WorkshopID", "workshop_id"]);
  if (directWorkshopId) return directWorkshopId;

  const templateId = valueByKeys(row, ["TemplateID", "template_id"]);
  const template = templateById[templateId] || {};
  const templateWorkshopId = valueByKeys(template, ["WorkshopID", "workshop_id"]);
  if (templateWorkshopId) return templateWorkshopId;

  const match = String(templateId || "").match(/^(WS\d+)/i);
  return match ? match[1].toUpperCase() : "";
}

function getWorkshopDimensionLabel(value) {
  const key = normalizeKey(value);
  if (key.indexOf("clarity") >= 0 || key.indexOf("rorang") >= 0) return "Rõ ràng";
  if (key.indexOf("relevance") >= 0 || key.indexOf("lienquan") >= 0) return "Liên quan";
  if (key.indexOf("facilitation") >= 0 || key.indexOf("facilitator") >= 0) return "Facilitator";
  if (key.indexOf("psychologicalsafety") >= 0 || key.indexOf("antoan") >= 0) return "An toàn chia sẻ";
  if (key.indexOf("objectiveachievement") >= 0 || key.indexOf("muctieudatduoc") >= 0) return "Objective Achievement";
  return String(value || "").trim();
}

function isWorkshopDimension(dimension) {
  return ["Rõ ràng", "Liên quan", "Facilitator", "An toàn chia sẻ", "Objective Achievement"].indexOf(dimension) >= 0;
}

function getLeadershipDimensionLabel(value) {
  const key = normalizeKey(value);
  if (!key) return "";
  if (key.indexOf("hiendien") >= 0 || key.indexOf("presence") >= 0 || key.indexOf("banthan") >= 0) return "Tôi hiện diện thế nào";
  if (key.indexOf("ketnoi") >= 0 || key.indexOf("connect") >= 0 || key.indexOf("relationship") >= 0) return "Tôi kết nối ra sao";
  if (key.indexOf("muctieu") >= 0 || key.indexOf("goal") >= 0 || key.indexOf("decision") >= 0 || key.indexOf("result") >= 0) return "Tôi đạt mục tiêu bằng cách nào";
  return String(value || "").trim();
}

function averageNumbers(values) {
  const numbers = values.map(function (value) {
    return Number(value);
  }).filter(function (value) {
    return !isNaN(value);
  });
  if (!numbers.length) return 0;

  return numbers.reduce(function (sum, value) {
    return sum + value;
  }, 0) / numbers.length;
}

function roundNumber(value, decimals) {
  const factor = Math.pow(10, decimals || 0);
  return Math.round(Number(value || 0) * factor) / factor;
}

function percent(numerator, denominator) {
  const bottom = Number(denominator) || 0;
  if (!bottom) return 0;
  return Math.round((Number(numerator) || 0) / bottom * 100);
}

function countValues(values, target) {
  return values.filter(function (value) {
    return value === target;
  }).length;
}

function buildAssessmentInsight(selfScore, peerScore, selfCount, peerCount) {
  if (!selfCount && !peerCount) return "";
  if (!peerCount) return "Đã có tự đánh giá, chưa có nhận đánh giá từ người khác.";
  if (!selfCount) return "Đã có nhận đánh giá từ người khác, chưa có tự đánh giá.";

  const gap = Math.abs(Number(selfScore) - Number(peerScore));
  if (gap <= 15) return "Góc nhìn của bạn và người khác tương đối gần nhau.";
  if (selfScore > peerScore) return "Bạn tự nhìn nhận mình thiên về Sáng tạo hơn góc nhìn của người khác.";
  return "Người khác nhìn nhận bạn thiên về Sáng tạo hơn bạn tự đánh giá.";
}

function getChallengeGroupId(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.replace(/[-_]?D\d+$/i, "");
}

function getChallengeDayFromId(value) {
  const match = String(value || "").match(/[-_]?D(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

function countUniqueValues(rows, keys) {
  const map = {};
  rows.forEach(function (row) {
    const value = valueByKeys(row, keys);
    if (value) map[value] = true;
  });
  return Object.keys(map).length;
}

function countWorkshopResponseIdentities(responses) {
  const identities = {};
  (responses || []).forEach(function (response) {
    const userId = valueByKeys(response, ["UserID", "user_id", "participant_id"]);
    const responseId = valueByKeys(response, ["ResponseID", "EvaluationID", "response_id", "evaluation_id"]);
    const identity = normalizeKey(userId) === "public" ? responseId : userId;
    if (identity) identities[identity] = true;
  });
  return Object.keys(identities).length;
}

function getWorkshopDimensionAverage(dimensionAverages, label) {
  const match = (dimensionAverages || []).filter(function (item) {
    return item.dimension === label;
  })[0];
  return match ? match.score : "";
}

function calculateLongestStreak(checkins) {
  const dayMap = {};
  checkins.forEach(function (row) {
    const dateValue = getFirstDateValue(row, ["UpdatedAt", "CreatedAt", "Date", "Timestamp"]);
    if (dateValue) dayMap[formatDateKey(dateValue)] = true;
  });

  const days = Object.keys(dayMap).sort();
  var longest = 0;
  var current = 0;
  var previous = null;
  days.forEach(function (dayKey) {
    const day = parseDateValue(dayKey);
    if (previous && day.getTime() - previous.getTime() === 24 * 60 * 60 * 1000) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    previous = day;
  });
  return longest;
}

function getLatestDateValue(rows, keys) {
  var latest = null;
  rows.forEach(function (row) {
    const dateValue = getFirstDateValue(row, keys);
    if (dateValue && (!latest || dateValue.getTime() > latest.getTime())) latest = dateValue;
  });
  return latest;
}

function getFirstDateValue(row, keys) {
  for (var index = 0; index < keys.length; index++) {
    const value = row[keys[index]];
    const parsed = parseDateValue(value);
    if (parsed) return parsed;
  }
  return null;
}

function getNumberByKeys(row, keys) {
  for (var index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return Number(row[key]) || 0;
    }
  }

  const value = valueByKeys(row, keys);
  return Number(value) || 0;
}

function isTruthyValue(value) {
  const key = normalizeKey(value);
  return value === true || key === "true" || key === "yes" || key === "y" || key === "1" || key === "done" || key === "x";
}

function getPeerAssessmentQuestions() {
  const questions = readOptionalSheet(CONFIG.SHEETS.EVALUATION_QUESTIONS);
  const peerQuestions = questions.filter(function (question) {
    const templateId = normalizeText(valueByKeys(question, ["TemplateID", "template_id"]));
    return templateId === "peer-common" || templateId === "peer-app" || templateId === "peer-360" || templateId === "other-before" || templateId === "other_before" || templateId === "otherbefore";
  });

  if (peerQuestions.length) return peerQuestions;

  return questions.filter(function (question) {
    return normalizeText(valueByKeys(question, ["TemplateID", "template_id"])) === "self-common";
  });
}

function sendDailyReminders() {
  const today = new Date();
  const dateKey = formatDateKey(today);
  const users = readSheet(CONFIG.SHEETS.USERS);
  const checkins = readOptionalSheet(CONFIG.SHEETS.CHECKINS);
  const evaluations = readOptionalSheet(CONFIG.SHEETS.EVALUATIONS).concat(readOptionalSheet(CONFIG.SHEETS.EVALUATION_RESPONSES));
  const templates = readOptionalSheet(CONFIG.SHEETS.EVALUATION_TEMPLATES);
  const logs = readOptionalSheet(CONFIG.SHEETS.EMAIL_LOGS);
  const summary = {
    checked: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  users.forEach(function (user) {
    summary.checked += 1;

    const userId = valueByKeys(user, ["UserID", "user_id"]);
    const fullName = valueByKeys(user, ["FullName", "full_name", "Name"]) || userId || "bạn";
    const email = valueByKeys(user, ["Email", "email"]);
    const status = normalizeText(valueByKeys(user, ["Status", "ParticipationStatus", "participation_status"]) || "Active");

    if (!userId || !email || status !== "active") {
      summary.skipped += 1;
      return;
    }

    if (hasRecentReminderLog(logs, userId, today, 2)) {
      summary.skipped += 1;
      return;
    }

    const tasks = buildReminderTasks(user, checkins, evaluations, templates, today);
    if (!tasks.length) {
      summary.skipped += 1;
      return;
    }

    try {
      const subject = "Nhắc nhẹ hôm nay từ Lãnh Đạo Khai Tâm";
      const body = buildReminderText(fullName, userId, tasks);
      const htmlBody = buildReminderHtml(fullName, userId, tasks);

      MailApp.sendEmail({
        to: email,
        subject: subject,
        body: body,
        htmlBody: htmlBody,
      });

      appendEmailLog(userId, email, dateKey, tasks, "sent", "");
      summary.sent += 1;
    } catch (error) {
      appendEmailLog(userId, email, dateKey, tasks, "error", String(error));
      summary.errors += 1;
    }
  });

  return summary;
}

function buildReminderTasks(user, checkins, evaluations, templates, today) {
  const userId = valueByKeys(user, ["UserID", "user_id"]);
  const tasks = [];

  if (!hasCheckinToday(userId, checkins, today)) {
    tasks.push("Check-in Mini Challenge");
  }

  getPendingEvaluationTasks(user, evaluations, templates).forEach(function (title) {
    tasks.push(title);
  });

  return tasks;
}

function savePushSubscription(payload) {
  const user = findUserByToken(payload.token);
  if (!user) return { ok: false, error: "Invalid token" };
  const subscription = payload.subscription || {};
  const keys = subscription.keys || {};
  if (!subscription.endpoint || !keys.p256dh || !keys.auth) return { ok: false, error: "Invalid push subscription" };
  ensureSheetWithHeaders(CONFIG.SHEETS.PUSH_SUBSCRIPTIONS, ["SubscriptionID", "UserID", "Endpoint", "P256dh", "Auth", "UserAgent", "Status", "CreatedAt", "UpdatedAt"]);
  const existing = readOptionalSheet(CONFIG.SHEETS.PUSH_SUBSCRIPTIONS).filter(function (row) { return valueByKeys(row, ["Endpoint"]) === subscription.endpoint; })[0];
  const now = new Date().toISOString();
  upsertObject(CONFIG.SHEETS.PUSH_SUBSCRIPTIONS, {
    SubscriptionID: existing ? valueByKeys(existing, ["SubscriptionID"]) : makeId("PUSH"),
    UserID: valueByKeys(user, ["UserID", "user_id"]), Endpoint: subscription.endpoint,
    P256dh: keys.p256dh, Auth: keys.auth, UserAgent: payload.userAgent || "", Status: "active",
    CreatedAt: existing ? valueByKeys(existing, ["CreatedAt"]) : now, UpdatedAt: now,
  }, function (row) { return valueByKeys(row, ["Endpoint"]) === subscription.endpoint; });
  return { ok: true };
}

function removePushSubscription(payload) {
  const user = findUserByToken(payload.token);
  if (!user || !payload.endpoint) return { ok: false, error: "Invalid subscription request" };
  ensureSheetWithHeaders(CONFIG.SHEETS.PUSH_SUBSCRIPTIONS, ["SubscriptionID", "UserID", "Endpoint", "P256dh", "Auth", "UserAgent", "Status", "CreatedAt", "UpdatedAt"]);
  const userId = valueByKeys(user, ["UserID", "user_id"]);
  const existing = readOptionalSheet(CONFIG.SHEETS.PUSH_SUBSCRIPTIONS).filter(function (row) { return valueByKeys(row, ["Endpoint"]) === payload.endpoint && valueByKeys(row, ["UserID"]) === userId; })[0];
  if (!existing) return { ok: true };
  existing.Status = "inactive"; existing.UpdatedAt = new Date().toISOString();
  upsertObject(CONFIG.SHEETS.PUSH_SUBSCRIPTIONS, existing, function (row) { return valueByKeys(row, ["Endpoint"]) === payload.endpoint; });
  return { ok: true };
}

function getPushDispatch(payload) {
  validatePushSecret(payload.secret);
  const dateKey = String(payload.date || "");
  const type = normalizeText(payload.type);
  if (!dateKey || ["challenge", "workshop", "test"].indexOf(type) < 0) return { ok: false, error: "Invalid push dispatch" };
  ensureSheetWithHeaders(CONFIG.SHEETS.PUSH_SUBSCRIPTIONS, ["SubscriptionID", "UserID", "Endpoint", "P256dh", "Auth", "UserAgent", "Status", "CreatedAt", "UpdatedAt"]);
  ensureSheetWithHeaders(CONFIG.SHEETS.NOTIFICATION_LOG, ["LogID", "LogKey", "UserID", "SubscriptionID", "Type", "ActivityID", "Date", "Status", "SentAt"]);
  const usersById = {};
  readSheet(CONFIG.SHEETS.USERS).forEach(function (user) {
    const userId = valueByKeys(user, ["UserID", "user_id"]);
    if (userId && normalizeText(valueByKeys(user, ["Status", "ParticipationStatus"]) || "active") === "active") usersById[userId] = true;
  });
  const logs = readOptionalSheet(CONFIG.SHEETS.NOTIFICATION_LOG);
  const checkins = readOptionalSheet(CONFIG.SHEETS.CHECKINS);
  const activityRows = type === "challenge"
    ? readOptionalSheet(CONFIG.SHEETS.MINI_CHALLENGES)
    : type === "workshop"
      ? readOptionalSheet(CONFIG.SHEETS.WORKSHOPS)
      : [{ TestID: "PUSH-TEST-" + dateKey, Title: "Kiểm tra thông báo" }];
  const activities = activityRows.filter(function (row) {
    if (type === "test") return true;
    const date = type === "challenge" ? valueByKeys(row, ["Date", "ChallengeDate", "ScheduleDate"]) : valueByKeys(row, ["ScheduleDate", "Date", "WorkshopDate"]);
    if (formatPushDate(date) !== dateKey) return false;
    return type !== "challenge" || normalizeText(valueByKeys(row, ["Status"]) || "active") !== "archived";
  });
  const items = [];
  readOptionalSheet(CONFIG.SHEETS.PUSH_SUBSCRIPTIONS).forEach(function (row) {
    if (normalizeText(valueByKeys(row, ["Status"]) || "active") !== "active") return;
    const userId = valueByKeys(row, ["UserID"]); if (!usersById[userId]) return;
    const subscriptionId = valueByKeys(row, ["SubscriptionID"]);
    activities.forEach(function (activity) {
      const activityId = type === "challenge"
        ? valueByKeys(activity, ["ChallengeID", "challenge_id"])
        : type === "workshop"
          ? valueByKeys(activity, ["WorkshopID", "workshop_id"])
          : valueByKeys(activity, ["TestID"]);
      if (!activityId || (type === "challenge" && hasChallengeCheckin(userId, activityId, checkins))) return;
      const logKey = [dateKey, type, userId, activityId, subscriptionId].join("|");
      if (logs.some(function (log) { return valueByKeys(log, ["LogKey"]) === logKey && normalizeText(valueByKeys(log, ["Status"])) === "sent"; })) return;
      const activityTitle = valueByKeys(activity, ["Title", "title"]);
      items.push({
        logKey: logKey, userId: userId, subscriptionId: subscriptionId, type: type, date: dateKey, activityId: activityId,
        subscription: { endpoint: valueByKeys(row, ["Endpoint"]), keys: { p256dh: valueByKeys(row, ["P256dh"]), auth: valueByKeys(row, ["Auth"]) } },
        title: type === "challenge" ? "Mini Challenge hôm nay" : type === "workshop" ? "Workshop hôm nay" : "Kiểm tra thông báo Lãnh Đạo Khai Tâm",
        body: type === "challenge" ? "Dành vài phút thực hiện " + (activityTitle || "mini challenge") + " và check-in nhé." : type === "workshop" ? "Hẹn bạn tại " + (activityTitle || "workshop") + " hôm nay." : "Thông báo thử lúc 11:10 đã hoạt động.",
        url: CONFIG.APP_URL + (type === "challenge" ? "?open=challenge" : type === "workshop" ? "?open=workshop" : ""), tag: "ldkt-" + type + "-" + activityId + "-" + dateKey,
      });
    });
  });
  return { ok: true, items: items };
}

function markPushDeliveries(payload) {
  validatePushSecret(payload.secret);
  ensureSheetWithHeaders(CONFIG.SHEETS.NOTIFICATION_LOG, ["LogID", "LogKey", "UserID", "SubscriptionID", "Type", "ActivityID", "Date", "Status", "SentAt"]);
  (payload.results || []).forEach(function (result) {
    appendObject(CONFIG.SHEETS.NOTIFICATION_LOG, { LogID: makeId("NOTIFY"), LogKey: result.logKey, UserID: result.userId, SubscriptionID: result.subscriptionId, Type: result.type, ActivityID: result.activityId, Date: result.date, Status: result.status, SentAt: new Date().toISOString() });
    if (result.status === "expired") deactivatePushSubscription(result.subscriptionId);
  });
  return { ok: true, updated: (payload.results || []).length };
}

function hasChallengeCheckin(userId, challengeId, checkins) {
  return checkins.some(function (row) { return valueByKeys(row, ["UserID", "user_id"]) === userId && valueByKeys(row, ["ChallengeID", "challenge_id"]) === challengeId && isTruthyValue(valueByKeys(row, ["Completed", "completed"])); });
}

function deactivatePushSubscription(subscriptionId) {
  const existing = readOptionalSheet(CONFIG.SHEETS.PUSH_SUBSCRIPTIONS).filter(function (row) { return valueByKeys(row, ["SubscriptionID"]) === subscriptionId; })[0];
  if (!existing) return;
  existing.Status = "expired"; existing.UpdatedAt = new Date().toISOString();
  upsertObject(CONFIG.SHEETS.PUSH_SUBSCRIPTIONS, existing, function (row) { return valueByKeys(row, ["SubscriptionID"]) === subscriptionId; });
}

function validatePushSecret(secret) {
  const expected = PropertiesService.getScriptProperties().getProperty("CRON_SECRET");
  if (!expected || String(secret || "") !== expected) throw new Error("Unauthorized push request");
}

function formatPushDate(value) {
  const parsed = parseDateValue(value);
  return parsed ? Utilities.formatDate(parsed, "Asia/Ho_Chi_Minh", "yyyy-MM-dd") : "";
}

function setupPushReminderTriggers(payload) {
  // Apps Script editor invokes selected functions without arguments.
  // API calls still pass a payload and must provide the shared secret.
  if (arguments.length > 0) validatePushSecret((payload || {}).secret);
  deletePushReminderTriggers();
  ScriptApp.newTrigger("sendWorkshopPushReminders").timeBased().everyDays(1).atHour(18).nearMinute(0).create();
  ScriptApp.newTrigger("sendChallengePushReminders").timeBased().everyDays(1).atHour(19).nearMinute(0).create();
  return { ok: true, workshopHour: 18, challengeHour: 19 };
}

function sendWorkshopPushReminders() {
  return callPushDispatchEndpoint("workshop");
}

function sendChallengePushReminders() {
  return callPushDispatchEndpoint("challenge");
}

function callPushDispatchEndpoint(type) {
  const secret = PropertiesService.getScriptProperties().getProperty("CRON_SECRET");
  if (!secret) throw new Error("Missing CRON_SECRET script property");
  const dateKey = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "yyyy-MM-dd");
  const url = CONFIG.APP_URL + "/api/push/dispatch?type=" + encodeURIComponent(type) + "&date=" + dateKey;
  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: { Authorization: "Bearer " + secret },
    muteHttpExceptions: true,
  });
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) throw new Error("Push dispatch failed: " + status + " " + response.getContentText());
  return JSON.parse(response.getContentText());
}

function deletePushReminderTriggers() {
  const handlers = { sendWorkshopPushReminders: true, sendChallengePushReminders: true };
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (handlers[trigger.getHandlerFunction()]) ScriptApp.deleteTrigger(trigger);
  });
}

function setupPushTestTrigger(payload) {
  validatePushSecret(payload.secret);
  const runAt = parseDateValue(payload.runAt);
  if (!runAt || runAt.getTime() <= Date.now()) return { ok: false, error: "Invalid future runAt" };
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "sendPushTestNotification") ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger("sendPushTestNotification").timeBased().at(runAt).create();
  return { ok: true, runAt: runAt.toISOString() };
}

function sendPushTestNotification() {
  return callPushDispatchEndpoint("test");
}

function hasCheckinToday(userId, checkins, today) {
  return checkins.some(function (row) {
    const rowUserId = valueByKeys(row, ["UserID", "user_id"]);
    if (rowUserId !== userId) return false;

    const dateValue = valueByKeys(row, ["UpdatedAt", "CreatedAt", "Date", "Timestamp"]);
    return isSameDay(dateValue, today);
  });
}

function getPendingEvaluationTasks(user, evaluations, templates) {
  const userId = valueByKeys(user, ["UserID", "user_id"]);
  const currentWorkshop = Number(valueByKeys(user, ["CurrentWorkshop", "current_workshop"]) || 1);
  const currentWorkshopId = "WS" + currentWorkshop;

  return templates
    .filter(function (template) {
      const status = normalizeText(valueByKeys(template, ["Status", "status"]) || "active");
      const type = normalizeKey(valueByKeys(template, ["Type", "type"]));
      const title = valueByKeys(template, ["Title", "title"]);
      const templateWorkshopId = valueByKeys(template, ["WorkshopID", "workshop_id"]);

      if (!title || status !== "active") return false;
      if (type === "peer" || type === "360" || normalizeKey(title).indexOf("360") >= 0) return false;
      if (type === "workshop" && templateWorkshopId && templateWorkshopId !== currentWorkshopId) return false;

      return !hasEvaluationResponse(userId, template, evaluations);
    })
    .map(function (template) {
      return valueByKeys(template, ["Title", "title"]) || "Tự đánh giá";
    });
}

function hasEvaluationResponse(userId, template, evaluations) {
  const templateId = valueByKeys(template, ["TemplateID", "template_id"]);
  const workshopId = valueByKeys(template, ["WorkshopID", "workshop_id"]);
  const sessionType = normalizeKey(valueByKeys(template, ["SessionType", "session_type"]));

  return evaluations.some(function (row) {
    const rowUserId = valueByKeys(row, ["UserID", "user_id"]);
    if (rowUserId !== userId) return false;

    const rowTemplateId = valueByKeys(row, ["TemplateID", "template_id"]);
    const rowWorkshopId = valueByKeys(row, ["WorkshopID", "workshop_id"]);
    const rowSessionType = normalizeKey(valueByKeys(row, ["SessionType", "session_type"]));

    return (
      (templateId && rowTemplateId === templateId) ||
      (workshopId && rowWorkshopId === workshopId && sessionType === rowSessionType)
    );
  });
}

function buildReminderText(fullName, userId, tasks) {
  return [
    "Chào " + fullName + ",",
    "",
    "Hôm nay bạn còn một vài việc nhỏ trong hành trình:",
    "",
  ]
    .concat(tasks.map(function (task, index) {
      return index + 1 + ". " + task;
    }))
    .concat([
      "",
      "Mở app tại: " + CONFIG.APP_URL,
      "Mã học viên của bạn: " + userId,
      "",
      "Hẹn bạn 2 phút quay về với điều mình nhận ra hôm nay.",
    ])
    .join("\n");
}

function buildReminderHtml(fullName, userId, tasks) {
  const taskItems = tasks.map(function (task) {
    return "<li>" + escapeHtml(task) + "</li>";
  }).join("");

  return [
    '<div style="font-family:Arial,sans-serif;line-height:1.55;color:#0d132b">',
    "<p>Chào <b>" + escapeHtml(fullName) + "</b>,</p>",
    "<p>Hôm nay bạn còn một vài việc nhỏ trong hành trình:</p>",
    "<ol>" + taskItems + "</ol>",
    '<p><a href="' + CONFIG.APP_URL + '" style="background:#16826d;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:700">Mở app Lãnh Đạo Khai Tâm</a></p>',
    "<p>Mã học viên của bạn: <b>" + escapeHtml(userId) + "</b></p>",
    "<p>Hẹn bạn 2 phút quay về với điều mình nhận ra hôm nay.</p>",
    "</div>",
  ].join("");
}

function appendEmailLog(userId, email, dateKey, tasks, status, error) {
  appendObject(CONFIG.SHEETS.EMAIL_LOGS, {
    LogID: makeId("MAIL"),
    UserID: userId,
    Email: email,
    Date: dateKey,
    Tasks: tasks.join(" | "),
    Status: status,
    SentAt: new Date().toISOString(),
    Error: error || "",
  });
}

function hasReminderLog(logs, userId, dateKey) {
  return logs.some(function (row) {
    return (
      valueByKeys(row, ["UserID", "user_id"]) === userId &&
      String(valueByKeys(row, ["Date", "date"])) === dateKey &&
      normalizeText(valueByKeys(row, ["Status", "status"])) === "sent"
    );
  });
}

function hasRecentReminderLog(logs, userId, today, intervalDays) {
  const intervalMs = Math.max(1, intervalDays || 1) * 24 * 60 * 60 * 1000;
  const todayStart = startOfDay(today).getTime();

  return logs.some(function (row) {
    if (valueByKeys(row, ["UserID", "user_id"]) !== userId) return false;
    if (normalizeText(valueByKeys(row, ["Status", "status"])) !== "sent") return false;

    const sentDate = parseDateValue(valueByKeys(row, ["Date", "date", "SentAt", "sent_at"]));
    if (!sentDate) return false;

    const delta = todayStart - startOfDay(sentDate).getTime();
    return delta >= 0 && delta < intervalMs;
  });
}

function setupReminderAt22() {
  return setupDailyReminderTrigger(22);
}

function setupReminderAt11() {
  return setupDailyReminderTrigger(11);
}

function setupReminderAt20() {
  return setupDailyReminderTrigger(20);
}

function setupDailyReminderTrigger(hour) {
  deleteDailyReminderTriggers();
  ScriptApp.newTrigger("sendDailyReminders")
    .timeBased()
    .everyDays(1)
    .atHour(hour)
    .create();

  return { ok: true, hour: hour };
}

function deleteDailyReminderTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "sendDailyReminders") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function findUserByToken(token) {
  if (!token) return null;

  const users = readSheet(CONFIG.SHEETS.USERS);
  return users.find(function (row) {
    return valueByKeys(row, ["Token", "token"]) === token || valueByKeys(row, ["UserID", "user_id", "participant_id"]) === token;
  });
}

function findUserById(userId) {
  if (!userId) return null;

  const target = normalizeText(userId);
  const users = readSheet(CONFIG.SHEETS.USERS);
  return users.find(function (row) {
    return normalizeText(valueByKeys(row, ["UserID", "user_id", "participant_id"])) === target;
  });
}

function isPeerResponseForUser(row, user, token, userCount) {
  const studentEmail = valueByKeys(row, [
    "EmailHocVien",
    "Email nguoi duoc danh gia",
    "Email học viên",
    "Email người học",
    "Email học viên bạn đang đánh giá",
    "StudentEmail",
    "UserEmail",
    "Email",
    "Gmail",
  ]);
  const studentName = valueByKeys(row, [
    "TenHocVien",
    "Ten nguoi duoc danh gia",
    "Tên học viên",
    "Tên người học",
    "Tên học viên bạn đang đánh giá",
    "StudentName",
    "FullName",
    "Name",
  ]);
  const studentId = valueByKeys(row, ["UserID", "StudentID", "Mã học viên", "Ma hoc vien", "Mã người học"]);
  const responseToken = valueByKeys(row, ["Token", "InviteToken", "Mã link", "Ma link"]);
  const userEmail = firstValue(user.Email, user.Gmail, user.Mail);

  if (studentId) return studentId === user.UserID;
  if (responseToken) return responseToken === token;
  if (studentEmail && userEmail) return normalizeText(studentEmail) === normalizeText(userEmail);
  if (studentName && user.FullName) return normalizeText(studentName) === normalizeText(user.FullName);

  return userCount === 1;
}

function readPeerResponseSheets() {
  const spreadsheet = getSpreadsheet();
  const responseRows = [];

  spreadsheet.getSheets().forEach(function (sheet) {
    if (isPeerResponseSheetName(sheet.getName())) {
      Array.prototype.push.apply(responseRows, readSheetBySheet(sheet));
    }
  });

  return responseRows;
}

function isPeerResponseSheetName(sheetName) {
  const key = normalizeKey(sheetName);
  return (
    key === normalizeKey(CONFIG.SHEETS.PEER_RESPONSES) ||
    key.indexOf("peerresponses") >= 0 ||
    key.indexOf("formresponses") >= 0 ||
    key.indexOf("formresponses1") >= 0 ||
    key.indexOf("cautraloibieumau") >= 0 ||
    key.indexOf("360responses") >= 0
  );
}

function valueByKeys(row, keys) {
  for (var index = 0; index < keys.length; index++) {
    const directValue = row[keys[index]];
    if (directValue) return directValue;
  }

  const normalizedKeys = keys.map(function (key) {
    return normalizeKey(key);
  });
  const rowKeys = Object.keys(row);

  for (var rowIndex = 0; rowIndex < rowKeys.length; rowIndex++) {
    const rowKey = rowKeys[rowIndex];
    const normalizedRowKey = normalizeKey(rowKey);

    for (var keyIndex = 0; keyIndex < normalizedKeys.length; keyIndex++) {
      const normalizedKey = normalizedKeys[keyIndex];
      if (normalizedRowKey === normalizedKey || normalizedRowKey.indexOf(normalizedKey) >= 0) {
        return row[rowKey];
      }
    }
  }

  return "";
}

function firstValue() {
  for (var index = 0; index < arguments.length; index++) {
    if (arguments[index]) return arguments[index];
  }

  return "";
}

function formatDateKey(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function isSameDay(value, date) {
  if (!value) return false;

  const parsed = value instanceof Date ? value : new Date(value);
  if (isNaN(parsed.getTime())) return false;

  return formatDateKey(parsed) === formatDateKey(date);
}

function startOfDay(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  const text = String(value).trim();
  const ymd = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));

  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));

  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function findFirstUser() {
  const users = readSheet(CONFIG.SHEETS.USERS);
  if (!users.length) {
    throw new Error("Users sheet is empty");
  }

  return users[0];
}

function readSheet(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Missing sheet: " + sheetName);
  }

  return readSheetBySheet(sheet);
}

function readOptionalSheet(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  return readSheetBySheet(sheet);
}

function ensureSheetWithHeaders(sheetName, headers) {
  const spreadsheet = getSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function readSheetBySheet(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = normalizeHeaders(values[0]);
  return values.slice(1).filter(hasAnyValue).map(function (row) {
    return headers.reduce(function (object, header, index) {
      object[header] = row[index];
      return object;
    }, {});
  });
}

function appendObject(sheetName, object) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Missing sheet: " + sheetName);
  }

  const headers = getHeaders(sheet);
  const row = headers.map(function (header) {
    return object[header] == null ? "" : object[header];
  });

  sheet.appendRow(row);
}

function appendObjects(sheetName, objects) {
  if (!objects || !objects.length) return;

  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Missing sheet: " + sheetName);
  }

  const headers = getHeaders(sheet);
  const rows = objects.map(function (object) {
    return headers.map(function (header) {
      return object[header] == null ? "" : object[header];
    });
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}

function writeObjectsToSheet(sheetName, objects) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Missing sheet: " + sheetName);
  }

  const headers = getHeaders(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  if (!objects || !objects.length) return;

  const rows = objects.map(function (object) {
    return headers.map(function (header) {
      return object[header] == null ? "" : object[header];
    });
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function upsertObject(sheetName, object, matcher) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Missing sheet: " + sheetName);
  }

  const values = sheet.getDataRange().getValues();
  const headers = normalizeHeaders(values[0]);
  const rowIndex = findRowIndex(values, headers, matcher);

  if (rowIndex === -1) {
    appendObject(sheetName, object);
    return { mode: "inserted", row: object };
  }

  const existing = rowToObject(headers, values[rowIndex]);
  const merged = Object.assign({}, existing, object, {
    CheckinID: existing.CheckinID || object.CheckinID,
    EvaluationID: existing.EvaluationID || object.EvaluationID,
    ResponseID: existing.ResponseID || object.ResponseID,
    AnswerID: existing.AnswerID || object.AnswerID,
    CreatedAt: existing.CreatedAt || object.CreatedAt,
  });
  const row = headers.map(function (header) {
    return merged[header] == null ? "" : merged[header];
  });

  sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);
  return { mode: "updated", row: merged };
}

function findRowIndex(values, headers, matcher) {
  for (var index = 1; index < values.length; index++) {
    const row = values[index];
    if (!hasAnyValue(row)) continue;

    if (matcher(rowToObject(headers, row))) {
      return index;
    }
  }

  return -1;
}

function rowToObject(headers, row) {
  return headers.reduce(function (object, header, index) {
    object[header] = row[index];
    return object;
  }, {});
}

function rowsToObjects(headers, rows) {
  return rows.filter(hasAnyValue).map(function (row) {
    return rowToObject(headers, row);
  });
}

function findHeaderIndex(headers, keys) {
  const normalizedKeys = keys.map(function (key) {
    return normalizeKey(key);
  });

  for (var index = 0; index < headers.length; index++) {
    const headerKey = normalizeKey(headers[index]);
    if (normalizedKeys.some(function (key) { return headerKey === key || headerKey.indexOf(key) >= 0; })) {
      return index;
    }
  }

  return -1;
}

function getHeaders(sheet) {
  return normalizeHeaders(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]);
}

function normalizeHeaders(headers) {
  return headers.map(function (header) {
    return String(header).trim();
  });
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function hasAnyValue(row) {
  return row.some(function (value) {
    return value !== "";
  });
}

function makeId(prefix) {
  return prefix + "-" + Utilities.getUuid();
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

function normalizeScenarioAnswerValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const key = normalizeKey(raw);
  if (
    key === "reactive" ||
    key === "phanung" ||
    key.indexOf("phanung") === 0 ||
    key.indexOf("reaction") === 0
  ) {
    return "reactive";
  }

  if (
    key === "creative" ||
    key === "sangtao" ||
    key.indexOf("sangtao") === 0 ||
    key.indexOf("creativity") === 0
  ) {
    return "creative";
  }

  return raw;
}

function getAverageRating(answers) {
  const values = Object.keys(answers)
    .map(function (key) {
      return Number(answers[key]);
    })
    .filter(function (value) {
      return Number.isFinite(value);
    });

  if (!values.length) return "";
  return Math.round((values.reduce(function (sum, value) { return sum + value; }, 0) / values.length) * 10) / 10;
}

function getFirstTextAnswer(answers) {
  const keys = Object.keys(answers);
  for (var index = 0; index < keys.length; index++) {
    const value = answers[keys[index]];
    if (value && isNaN(Number(value))) return value;
  }

  return "";
}

function jsonResponse(payload, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
