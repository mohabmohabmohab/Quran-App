/**
 * محمل بيانات المصحف - المصدر الوحيد للبيانات
 * يعتمد حصرياً على ملف quran_complete_data.json المحلي
 */

const QURAN_DATA_URL = "https://media.base44.com/files/public/6a301d10f7dc0b0a6d409285/183d17383_quran_complete_data.json";
const CACHE_KEY = "quran_processed_data_v2";

let _data = null; // البيانات المعالجة في الذاكرة

/**
 * معالجة بيانات المصحف الخام إلى هياكل مفيدة
 */
function processRawData(raw) {
  const entries = Array.isArray(raw) ? raw : [];
  if (!entries.length) throw new Error("بيانات المصحف فارغة");

  // هيكل الصفحات: page → { verseCount, startChapter, startVerse, endChapter, endVerse, juzu, hizb, quarter }
  const pages = {};
  for (let i = 1; i <= 604; i++) pages[i] = { page: i, verseCount: 0, startChapter: null, startVerse: null, endChapter: null, endVerse: null, juzu: null, hizb: null, quarter: null };

  // أسماء الأرباع: global_quarter_number → أول نص آية
  const quarterNames = {};

  // تجميع البيانات
  for (const e of entries) {
    const p = e.page;
    if (!pages[p]) continue;

    pages[p].verseCount++;
    if (pages[p].startChapter === null) {
      pages[p].startChapter = e.surah_number;
      pages[p].startVerse = e.ayah_number;
      pages[p].juzu = e.juzu;
      pages[p].hizb = e.hizb;
      pages[p].quarter = e.global_quarter_number;
    }
    pages[p].endChapter = e.surah_number;
    pages[p].endVerse = e.ayah_number;
  }

  // تحويل pages من object إلى array مرتب
  const pagesArray = [];
  for (let i = 1; i <= 604; i++) {
    pagesArray.push(pages[i]);
  }

  // استخراج أسماء الأرباع من أول آية في كل ربع
  const quarterSeen = {};
  for (const e of entries) {
    const q = e.global_quarter_number;
    if (!quarterSeen[q]) {
      quarterSeen[q] = true;
      quarterNames[q] = e.text || "";
    }
  }

  // حساب إجمالي الآيات
  const totalVerses = pagesArray.reduce((s, p) => s + p.verseCount, 0);

  // بناء فهرس الآيات التراكمي لكل صفحة
  let cumulativeVerses = 0;
  const pageCumulative = {};
  for (let i = 1; i <= 604; i++) {
    pageCumulative[i] = cumulativeVerses;
    cumulativeVerses += pages[i].verseCount;
  }
  pageCumulative[605] = cumulativeVerses; // بعد آخر صفحة

  // بناء حدود الأجزاء (أي صفحة يبدأ كل جزء)
  const juzBoundaries = {};
  for (const e of entries) {
    if (!juzBoundaries[e.juzu]) {
      juzBoundaries[e.juzu] = { page: e.page, surah: e.surah_number };
    }
  }

  // بناء حدود الأحزاب
  const hizbBoundaries = {};
  for (const e of entries) {
    if (!hizbBoundaries[e.hizb]) {
      hizbBoundaries[e.hizb] = { page: e.page, surah: e.surah_number };
    }
  }

  // آيات كل جزء تقريباً
  const versesPerJuz = totalVerses / 30;
  const versesPerHizb = totalVerses / 60;
  const versesPerRub = totalVerses / 240;
  const avgVersesPerPage = totalVerses / 604;

  return {
    pages: pagesArray,
    pageMap: pages,
    pageCumulative,
    quarterNames,
    juzBoundaries,
    hizbBoundaries,
    totalVerses,
    totalPages: 604,
    totalJuz: 30,
    totalHizb: 60,
    totalRub: 240,
    versesPerJuz,
    versesPerHizb,
    versesPerRub,
    avgVersesPerPage,
  };
}

/**
 * تحميل ومعالجة بيانات المصحف
 */
export async function initQuranData() {
  if (_data) return _data;

  // المحاولة من الذاكرة المخبأة
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      _data = JSON.parse(cached);
      return _data;
    } catch (e) { /* تالف */ }
  }

  // التحميل من الملف المحلي
  try {
    const resp = await fetch(QURAN_DATA_URL);
    if (!resp.ok) throw new Error(`فشل التحميل: ${resp.status}`);
    const raw = await resp.json();
    _data = processRawData(raw);
    localStorage.setItem(CACHE_KEY, JSON.stringify(_data));
    return _data;
  } catch (e) {
    console.error("تعذر تحميل بيانات المصحف:", e);
    _data = null;
    return null;
  }
}

/**
 * الحصول على البيانات المعالجة (يجب استدعاء initQuranData أولاً)
 */
export function getQuranData() {
  return _data;
}

// ==================== دوال الاستعلام ====================

/** عدد آيات صفحة محددة */
export function getPageVerseCount(pageNum) {
  const d = _data;
  if (!d || !d.pageMap[pageNum]) return 10;
  return d.pageMap[pageNum].verseCount;
}

/** نطاق الصفحة (سورة:آية) */
export function getPageRange(pageNum) {
  const d = _data;
  if (!d || !d.pageMap[pageNum]) return null;
  const p = d.pageMap[pageNum];
  return { startChapter: p.startChapter, startVerse: p.startVerse, endChapter: p.endChapter, endVerse: p.endVerse, juzu: p.juzu, hizb: p.hizb, quarter: p.quarter };
}

/** عدد الآيات بين صفحتين (شاملة) */
export function getVersesBetween(startPage, endPage) {
  const d = _data;
  if (!d) return (endPage - startPage + 1) * 10;
  let total = 0;
  for (let p = startPage; p <= endPage; p++) {
    total += (d.pageMap[p]?.verseCount || 10);
  }
  return total;
}

/** عدد الآيات التراكمي حتى بداية صفحة معينة */
export function getCumulativeVerses(pageNum) {
  const d = _data;
  if (!d) return (pageNum - 1) * 10;
  return d.pageCumulative[pageNum] || 0;
}

/** اسم الربع من رقمه */
export function getQuarterName(quarterNumber) {
  const d = _data;
  if (!d) return "";
  return d.quarterNames[quarterNumber] || "";
}

/** رقم الربع لصفحة معينة */
export function getQuarterNumber(pageNum) {
  const d = _data;
  if (!d || !d.pageMap[pageNum]) return null;
  return d.pageMap[pageNum].quarter;
}

// ==================== دوال التحويل (بالاستعلام المباشر) ====================

/** إيجاد الصفحة الدقيقة بعد استهلاك عدد آيات بدءاً من startPage */
export function versesToExactPosition(verses, startPage = 1) {
  const d = _data;
  if (!d) return { page: startPage, juz: null, hizb: null, quarter: null, versesConsumed: 0 };

  let remaining = verses;
  let currentPage = startPage;

  while (remaining > 0 && currentPage <= 604) {
    const vc = d.pageMap[currentPage]?.verseCount || 10;
    if (remaining < vc) break;
    remaining -= vc;
    currentPage++;
  }

  const pageData = d.pageMap[Math.min(currentPage, 604)];
  return {
    page: Math.min(currentPage, 604),
    juz: pageData?.juzu || null,
    hizb: pageData?.hizb || null,
    quarter: pageData?.quarter || null,
    remainingInPage: remaining,
  };
}

/** تحويل آيات → صفحات (عدد صحيح، بدون كسور) */
export function versesToPages(verses, startPage = 1) {
  const d = _data;
  if (!d) return Math.ceil(verses / 10);

  let remaining = verses;
  let pages = 0;
  let currentPage = startPage;

  while (remaining > 0 && currentPage <= 604) {
    const vc = d.pageMap[currentPage]?.verseCount || 10;
    remaining -= vc;
    pages++;
    currentPage++;
  }

  return Math.max(1, pages);
}

/** تحويل آيات → أجزاء (باستخدام إحداثيات حقيقية) */
export function versesToJuz(verses, startPage = 1) {
  const d = _data;
  if (!d) return Math.round((verses / 6236) * 30 * 100) / 100;

  const position = versesToExactPosition(verses, startPage);
  const startJuz = d.pageMap[startPage]?.juzu || 1;
  const endJuz = position.juz || startJuz;
  return endJuz - startJuz;
}

/** تحويل آيات → أحزاب */
export function versesToHizb(verses, startPage = 1) {
  return Math.round(versesToJuz(verses, startPage) * 2);
}

/** تحويل آيات → أرباع */
export function versesToRub(verses, startPage = 1) {
  return Math.round(versesToHizb(verses, startPage) * 4);
}

/**
 * تحويل إدخال الوحدات المرن إلى عدد آيات حقيقي
 * @param {Object} input - { juz:0, hizb:0, rub:0, pages:0, verses:0 }
 * @param {number} startPage - صفحة البداية لهذا اليوم
 * @returns {number} عدد الآيات المحسوب
 */
export function flexibleInputToVerses(input, startPage) {
  const d = _data;
  const { juz = 0, hizb = 0, rub = 0, pages = 0, verses = 0 } = input;

  let total = 0;

  // الأجزاء (تقريبي نسبي)
  if (juz) total += juz * (d?.versesPerJuz || (6236 / 30));

  // الأحزاب (تقريبي نسبي)
  if (hizb) total += hizb * (d?.versesPerHizb || (6236 / 60));

  // الأرباع (تقريبي نسبي)
  if (rub) total += rub * (d?.versesPerRub || (6236 / 240));

  // الصفحات (حقيقي من البيانات)
  if (pages && d) {
    for (let i = 0; i < pages; i++) {
      const pg = startPage + i;
      total += d.pageMap[pg]?.verseCount || 10;
    }
  } else if (pages) {
    total += pages * 10;
  }

  // الآيات (مباشر)
  if (verses) total += verses;

  return Math.round(total * 10) / 10;
}

/** تنسيق العرض العربي - عرض ذكي بدون تكرار */
export function formatQuranUnits(verses, startPage = 1) {
  if (!verses || verses === 0) return "—";
  const pages = versesToPages(verses, startPage);
  const juz = Math.floor(pages / 20);
  const remainingPages = pages % 20;

  if (juz >= 1) {
    if (remainingPages > 0) return `${juz} أجزاء و ${remainingPages} صفحات`;
    return `${juz} أجزاء`;
  }
  return `${pages} صفحة`;
}

/** إزالة زخارف المصحف من بداية النص */
export function stripOrnament(text) {
  if (!text) return "";
  // إزالة رموز الزخرفة القرآنية من البداية
  return text.replace(/^[\u06DD-\u06DF\uFD3E\uFD3F\ufdfd\ufdfa\ufdfb\ufdfc\ufdfd\ufe80-\ufefc\s]+/u, '').trim();
}

/** عرض ذكي: أجزاء + صفحات (مثلاً: "3 أجزاء و 4 صفحات") */
export function smartQuranDisplay(verses, startPage = 1) {
  if (!verses || verses <= 0) return "—";

  const pagesCovered = versesToPages(verses, startPage);
  const juzCount = Math.floor(pagesCovered / 20);
  const remainingPages = pagesCovered % 20;

  if (juzCount >= 1) {
    return remainingPages > 0
      ? `${juzCount} أجزاء و ${remainingPages} صفحات`
      : `${juzCount} أجزاء`;
  }

  return `${pagesCovered} صفحة`;
}