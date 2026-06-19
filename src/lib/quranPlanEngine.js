/**
 * محرك حساب خطة مراجعة القرآن - الإصدار الجديد
 * - تعدد الخطط مع تسمية
 * - إدخال مرن بالوحدات المختلطة
 * - تراجع عن تسجيل اليوم
 * - إجازات مرنة (أسابيع كاملة)
 */
import {
  getVersesBetween, getPageRange, getPageVerseCount, getCumulativeVerses,
  getQuarterName, getQuarterNumber, flexibleInputToVerses,
  versesToPages, versesToJuz, versesToHizb, versesToRub, formatQuranUnits, smartQuranDisplay, stripOrnament
} from "./quranData";

export const DAY_NAMES_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// ==================== دوال التاريخ ====================

/**
 * @param {Date | string} startDate
 * @param {Date | string} endDate
 * @returns {number}
 */
export function daysBetween(startDate, endDate) {
  const s = new Date(startDate); s.setHours(0, 0, 0, 0);
  const e = new Date(endDate); e.setHours(0, 0, 0, 0);
  return Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
}

/**
 * @param {Date | string} startDate
 * @param {Date | string} endDate
 * @param {number[]} offDays
 * @returns {number}
 */
export function countOffDays(startDate, endDate, offDays = []) {
  if (!offDays.length) return 0;
  let count = 0;
  const cur = new Date(startDate); cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate); end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    if (offDays.includes(cur.getDay())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ==================== توليد معرف فريد ====================

/**
 * @returns {string}
 */
function generateId() {
  return 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// ==================== إنشاء خطة ====================

/**
 * @param {Object} opts
 * @param {string} [opts.name] - اسم الخطة
 * @param {string} opts.startDate
 * @param {string} opts.endDate
 * @param {number} opts.startPage
 * @param {number} opts.endPage
 * @param {number[]} [opts.offDays] - أيام الإجازة الأسبوعية (0-6)
 * @param {Object | null} [opts.vacationPattern] - نمط الإجازة المتقدم (اختياري)
 */
export function createPlan({ name, startDate, endDate, startPage, endPage, offDays = [], vacationPattern = null }) {
  const totalVerses = getVersesBetween(startPage, endPage);
  const totalPages = endPage - startPage + 1;
  const totalDays = daysBetween(startDate, endDate);

  // حساب أيام الإجازة مع النمط المتقدم
  const allOffDays = calculateAllOffDays(startDate, endDate, offDays, vacationPattern);
  const offDayCount = allOffDays.length;
  const workDays = totalDays - offDayCount;

  if (workDays <= 0) {
    return { error: "لا توجد أيام عمل كافية. يرجى تقليل أيام الإجازة أو تمديد الفترة." };
  }

  const dailyVerses = Math.ceil(totalVerses / workDays);
  const dailyPages = versesToPages(dailyVerses);

  const schedule = generateSchedule({
    startDate, endDate, totalVerses, startPage, offDays, allOffDays, vacationPattern, dailyVerses
  });

  const startRange = getPageRange(startPage);
  const endRange = getPageRange(endPage);

  return {
    id: generateId(),
    name: name || "خطة المراجعة",
    startDate, endDate,
    startPage, endPage, totalPages,
    totalVerses,
    totalDays, offDays, offDayCount, workDays,
    dailyVerses, dailyPages,
    vacationPattern: vacationPattern || { enabled: false, weeksOn: 1, weeksOff: 1, customDays: [] },
    verseRange: {
      startChapter: startRange?.startChapter || 1,
      startVerse: startRange?.startVerse || 1,
      endChapter: endRange?.endChapter || 114,
      endVerse: endRange?.endVerse || 6
    },
    schedule,
    completedVerses: 0,
    remainingVerses: totalVerses,
    history: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * حساب كل أيام الإجازة (الأسبوعية + النمط المتقدم)
 * @param {Date | string} startDate
 * @param {Date | string} endDate
 * @param {number[]} offDays
 * @param {any} vacationPattern
 * @returns {string[]}
 */
function calculateAllOffDays(startDate, endDate, offDays, vacationPattern) {
  const allOff = new Set();
  const cur = new Date(startDate); cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate); end.setHours(0, 0, 0, 0);

  if (!vacationPattern || !vacationPattern.enabled) {
    // نمط بسيط: أيام الأسبوع المحددة فقط
    while (cur <= end) {
      const dateStr = toLocalDateStr(cur);
      if (offDays.includes(cur.getDay())) {
        allOff.add(dateStr);
      }
      cur.setDate(cur.getDate() + 1);
    }
    return Array.from(allOff).sort();
  }

  // نمط متقدم: أسابيع تشغيل/إجازة + أيام مخصصة
  const weeksOn = vacationPattern.weeksOn || 1;
  const weeksOff = vacationPattern.weeksOff || 1;
  const cycleLength = (weeksOn + weeksOff) * 7;

  const startRef = new Date(startDate);
  startRef.setHours(0, 0, 0, 0);

  while (cur <= end) {
    const dateStr = toLocalDateStr(cur);
    const dayDiff = Math.floor((cur.getTime() - startRef.getTime()) / 86400000);
    const cycleDay = dayDiff % cycleLength;
    const isVacationWeek = cycleDay >= weeksOn * 7;

    if (isVacationWeek) {
      allOff.add(dateStr);
    } else if (offDays.includes(cur.getDay())) {
      // أيام الإجازة الأسبوعية خلال أسابيع العمل
      allOff.add(dateStr);
    }

    cur.setDate(cur.getDate() + 1);
  }

  return Array.from(allOff).sort();
}

/**
 * التحقق مما إذا كان تاريخ معين يوم إجازة
 * @param {string} dateStr
 * @param {string[]} allOffDays
 * @returns {boolean}
 */
function isOffDate(dateStr, allOffDays) {
  return allOffDays.includes(dateStr);
}

/**
 * توليد الجدول اليومي
 * @param {Object} params
 * @param {string} params.startDate
 * @param {string} params.endDate
 * @param {number} params.totalVerses
 * @param {number} params.startPage
 * @param {number[]} params.offDays
 * @param {string[]} params.allOffDays
 * @param {any} params.vacationPattern
 * @param {number} params.dailyVerses
 * @returns {any[]}
 */
function generateSchedule({ startDate, endDate, totalVerses, startPage, offDays, allOffDays, vacationPattern, dailyVerses }) {
  const schedule = [];
  const cur = new Date(startDate); cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate); end.setHours(0, 0, 0, 0);

  let accumulatedVerses = 0;

  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    const dateStr = toLocalDateStr(cur);
    const isOff = isOffDate(dateStr, allOffDays);

    let targetVerses = 0;
    let targetStartPage = null;
    let targetEndPage = null;
    let targetStartChapter = null;
    let targetEndChapter = null;
    let targetQuarter = null;
    let targetQuarterName = null;

    if (!isOff) {
      targetVerses = Math.min(
        Math.ceil(dailyVerses),
        Math.max(0, totalVerses - accumulatedVerses)
      );

      targetStartPage = startPage + findPageOffsetFromStart(startPage, accumulatedVerses);
      targetEndPage = startPage + findPageOffsetFromStart(startPage, accumulatedVerses + targetVerses - 1);
      targetEndPage = Math.min(targetEndPage, 604);

      const sRange = getPageRange(targetStartPage);
      const eRange = getPageRange(targetEndPage);
      if (sRange) targetStartChapter = sRange.startChapter;
      if (eRange) targetEndChapter = eRange.endChapter;

      // رقم الربع واسمه
      const qNum = getQuarterNumber(targetStartPage);
      targetQuarter = qNum;
      targetQuarterName = qNum ? stripOrnament(getQuarterName(qNum)) : null;

      accumulatedVerses += targetVerses;
    }

    schedule.push({
      date: dateStr,
      dayName: DAY_NAMES_AR[dayOfWeek],
      dayOfWeek,
      isOff,
      targetVerses: isOff ? 0 : targetVerses,
      targetPages: isOff ? 0 : versesToPages(targetVerses),
      targetStartPage, targetEndPage,
      targetStartChapter, targetEndChapter,
      targetQuarter, targetQuarterName,
      completedVerses: 0,
      completedPages: 0,
      status: "pending",
    });

    cur.setDate(cur.getDate() + 1);
  }

  return schedule;
}

/**
 * إيجاد إزاحة الصفحة بناءً على الآيات المتراكمة من صفحة البداية
 * @param {number} startPage
 * @param {number} accumulatedVerses
 * @returns {number}
 */
function findPageOffsetFromStart(startPage, accumulatedVerses) {
  let acc = 0;
  for (let p = startPage; p <= 604; p++) {
    const vc = getPageVerseCount(p);
    if (acc + vc > accumulatedVerses) return p - startPage;
    acc += vc;
  }
  return 0;
}

// ==================== تسجيل الإنجاز (إدخال مرن) ====================

/**
 * تسجيل إنجاز يوم باستخدام الإدخال المرن
 * @param {Object} plan - الخطة
 * @param {string} dateStr - تاريخ اليوم
 * @param {Object} flexibleInput - { juz, hizb, rub, pages, verses }
 */
export function recordDayProgressFlexible(plan, dateStr, flexibleInput) {
  const updatedPlan = JSON.parse(JSON.stringify(plan));
  const dayIndex = updatedPlan.schedule.findIndex((/** @type {any} */ d) => d.date === dateStr);
  if (dayIndex === -1) return updatedPlan;

  const day = updatedPlan.schedule[dayIndex];

  // تحويل الإدخال المرن إلى آيات حقيقية
  const completedVerses = flexibleInputToVerses(
    flexibleInput,
    day.targetStartPage || updatedPlan.startPage
  );

  return applyProgress(updatedPlan, dayIndex, completedVerses, dateStr);
}

/**
 * تسجيل إنجاز يوم مباشر بالآيات
 * @param {Object} plan
 * @param {string} dateStr
 * @param {number} completedVerses
 */
export function recordDayProgress(plan, dateStr, completedVerses) {
  const updatedPlan = JSON.parse(JSON.stringify(plan));
  const dayIndex = updatedPlan.schedule.findIndex((/** @type {any} */ d) => d.date === dateStr);
  if (dayIndex === -1) return updatedPlan;

  return applyProgress(updatedPlan, dayIndex, completedVerses, dateStr);
}

/**
 * @param {any} plan
 * @param {number} dayIndex
 * @param {number} completedVerses
 * @param {string} dateStr
 */
function applyProgress(plan, dayIndex, completedVerses, dateStr) {
  const day = plan.schedule[dayIndex];

  // حذف السجل السابق
  plan.history = plan.history.filter((/** @type {any} */ h) => h.date !== dateStr);

  day.completedVerses = Math.round(completedVerses);
  day.completedPages = versesToPages(completedVerses);

  if (completedVerses >= day.targetVerses) {
    day.status = "completed";
  } else if (completedVerses > 0) {
    day.status = "partial";
  } else {
    day.status = "skipped";
  }

  // حساب الإنجاز الكلي
  const totalCompleted = plan.schedule.reduce((/** @type {number} */ sum, /** @type {any} */ d) => sum + d.completedVerses, 0);
  plan.completedVerses = Math.round(totalCompleted);
  plan.remainingVerses = Math.max(0, plan.totalVerses - Math.round(totalCompleted));

  // إضافة للسجل
  plan.history.push({
    date: dateStr,
    completedVerses: day.completedVerses,
    completedPages: day.completedPages,
    targetVerses: day.targetVerses,
    targetPages: day.targetPages,
    timestamp: new Date().toISOString(),
  });

  // المرونة الذكية
  smartRedistribute(plan, dayIndex);

  return plan;
}

// ==================== التراجع عن تسجيل اليوم ====================

/**
 * التراجع عن تسجيل اليوم وإعادة الخطة لحالة "pending"
 * @param {Object} plan
 * @param {string} dateStr
 */
export function undoDayProgress(plan, dateStr) {
  const updatedPlan = JSON.parse(JSON.stringify(plan));
  const dayIndex = updatedPlan.schedule.findIndex((/** @type {any} */ d) => d.date === dateStr);
  if (dayIndex === -1) return updatedPlan;

  const day = updatedPlan.schedule[dayIndex];

  // إزالة السجل
  updatedPlan.history = updatedPlan.history.filter((/** @type {any} */ h) => h.date !== dateStr);

  // إعادة اليوم للحالة الأصلية
  day.completedVerses = 0;
  day.completedPages = 0;
  day.status = "pending";

  // إعادة حساب الإنجاز الكلي
  const totalCompleted = updatedPlan.schedule.reduce((/** @type {number} */ sum, /** @type {any} */ d) => sum + d.completedVerses, 0);
  updatedPlan.completedVerses = Math.round(totalCompleted);
  updatedPlan.remainingVerses = Math.max(0, updatedPlan.totalVerses - Math.round(totalCompleted));

  // إعادة توزيع ذكية من أول يوم تم التراجع عنه
  const firstPending = updatedPlan.schedule.findIndex(
    (/** @type {any} */ d, /** @type {number} */ i) => i >= dayIndex && d.status === "pending" && !d.isOff
  );

  if (firstPending >= 0) {
    smartRedistribute(updatedPlan, firstPending - 1);
  }

  return updatedPlan;
}

// ==================== المرونة الذكية ====================

/**
 * @param {any} plan
 * @param {number} fromDayIndex
 */
function smartRedistribute(plan, fromDayIndex) {
  const remaining = plan.remainingVerses;
  const today = getLocalToday();

  const futureDays = plan.schedule.filter((/** @type {any} */ d, /** @type {number} */ i) =>
    i > fromDayIndex && !d.isOff && d.status === "pending" && d.date >= today
  );

  if (futureDays.length === 0 || remaining <= 0) return;

  const newDaily = Math.ceil(remaining / futureDays.length);
  plan.dailyVerses = newDaily;
  plan.dailyPages = versesToPages(newDaily);

  let accumulated = plan.completedVerses;

  futureDays.forEach((/** @type {any} */ day) => {
    const targetV = Math.min(
      Math.ceil(newDaily),
      Math.max(0, plan.totalVerses - accumulated)
    );
    day.targetVerses = Math.round(targetV);
    day.targetPages = versesToPages(targetV);
    day.targetStartPage = plan.startPage + findPageOffsetFromStart(plan.startPage, accumulated);
    day.targetEndPage = Math.min(
      plan.startPage + findPageOffsetFromStart(plan.startPage, accumulated + targetV - 1),
      plan.endPage
    );

    const sR = getPageRange(day.targetStartPage);
    const eR = getPageRange(day.targetEndPage);
    if (sR) day.targetStartChapter = sR.startChapter;
    if (eR) day.targetEndChapter = eR.endChapter;

    const qNum = getQuarterNumber(day.targetStartPage);
    day.targetQuarter = qNum;
    day.targetQuarterName = qNum ? stripOrnament(getQuarterName(qNum)) : null;

    accumulated += targetV;
  });
}

// ==================== استعلامات ====================

/**
 * @param {any} plan
 */
export function getTodayData(plan) {
  const today = getLocalToday();
  return plan.schedule.find((/** @type {any} */ d) => d.date === today) || null;
}

/**
 * @param {any} plan
 */
export function getProgress(plan) {
  if (!plan || plan.totalPages === 0) return 0;
  const donePages = versesToPages(plan.completedVerses, plan.startPage);
  return Math.round((donePages / plan.totalPages) * 100);
}

/**
 * @param {any} plan
 */
export function getStats(plan) {
  if (!plan) return null;

  const completedDays = plan.schedule.filter((/** @type {any} */ d) => d.status === "completed").length;
  const partialDays = plan.schedule.filter((/** @type {any} */ d) => d.status === "partial").length;
  const skippedDays = plan.schedule.filter((/** @type {any} */ d) => d.status === "skipped").length;
  const pendingDays = plan.schedule.filter((/** @type {any} */ d) => d.status === "pending" && !d.isOff).length;
  const offDaysTotal = plan.schedule.filter((/** @type {any} */ d) => d.isOff).length;

  const today = getLocalToday();
  const pastDays = plan.schedule.filter((/** @type {any} */ d) => d.date < today && !d.isOff && d.completedVerses > 0);
  const avgDaily = pastDays.length > 0
    ? pastDays.reduce((/** @type {number} */ sum, /** @type {any} */ d) => sum + d.completedVerses, 0) / pastDays.length
    : 0;

  let estimatedEndDate = plan.endDate;
  if (avgDaily > 0 && plan.remainingVerses > 0) {
    const daysNeeded = Math.ceil(plan.remainingVerses / avgDaily);
    const est = new Date();
    est.setHours(0, 0, 0, 0);
    let added = 0;
    while (added < daysNeeded) {
      est.setDate(est.getDate() + 1);
      if (!plan.offDays.includes(est.getDay())) added++;
    }
    estimatedEndDate = toLocalDateStr(est);
  }

  return {
    completedDays, partialDays, skippedDays, pendingDays, offDaysTotal,
    avgDaily: Math.round(avgDaily),
    avgDailyPages: versesToPages(avgDaily),
    estimatedEndDate,
    progress: getProgress(plan),
    totalCompletedVerses: plan.completedVerses,
    totalCompletedPages: versesToPages(plan.completedVerses),
  };
}

/** * تحويل تاريخ إلى نص محلي YYYY-MM-DD مع ضمان استخدام التوقيت المحلي الفعلي للجهاز
 * @param {Date | string} date
 * @returns {string}
 */
export function toLocalDateStr(date) {
  const d = new Date(date);
  // استخدام الأرقام المحلية تماماً لمنع تراجع التاريخ بسبب فارق التوقيت
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** * الحصول على تاريخ اليوم الحالي بالتوقيت المحلي الفعلي للجهاز بشكل دقيق
 * @returns {string}
 */
export function getLocalToday() {
  const now = new Date();
  // تصفير الساعات والدقائق محلياً لضمان الانتقال فور تخطي الساعة 12 ليلاً
  now.setHours(0, 0, 0, 0);
  return toLocalDateStr(now);
}

export { formatQuranUnits, smartQuranDisplay, versesToPages, flexibleInputToVerses };