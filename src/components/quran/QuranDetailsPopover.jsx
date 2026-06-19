import React, { useState } from "react";
import { Info, BookOpen } from "lucide-react";
import { getVersesBetween, getPageRange, getQuranData } from "@/lib/quranData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SURAH_NAMES = {
  1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة",
  6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
  11: "هود", 12: "يوسف", 13: "الرعد", 14: "إبراهيم", 15: "الحجر",
  16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
  21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان",
  26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
  31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر",
  36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
  41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية",
  46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
  51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن",
  56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
  61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق",
  66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
  71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة",
  76: "الإنسان", 77: "المرسلات", 78: "النبأ", 79: "النازعات", 80: "عبس",
  81: "التكوير", 82: "الإنفطار", 83: "المطففين", 84: "الإنشقاق", 85: "البروج",
  86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
  91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين",
  96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
  101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل",
  106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
  111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
};

export default function QuranDetailsPopover({ verses, startPage = 1, className = "" }) {
  const [open, setOpen] = useState(false);
  if (!verses || verses <= 0) return null;

  const endPageExact = findEndPage(verses, startPage);
  const pagesCovered = Math.max(0, endPageExact - startPage);
  const exactVerses = getVersesBetween(startPage, endPageExact);

  const startRange = getPageRange(startPage);
  const endRange = getPageRange(endPageExact);

  const juzCount = Math.floor(pagesCovered / 20);
  const remainingPages = pagesCovered % 20;

  // جمع السور التي تمر بها الخطة
  const surahsInRange = getSurahsInRange(startPage, endPageExact);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-5 h-5 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors inline-flex"
          title="تفاصيل إضافية"
        >
          <Info className="w-3 h-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start" side="bottom" dir="rtl">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/40">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">تفاصيل النطاق</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">الآيات</span>
            <span className="font-semibold text-foreground">{exactVerses}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">الصفحات</span>
            <span className="font-semibold text-foreground">{pagesCovered}</span>
          </div>

          {juzCount >= 1 && (
            <>
              <div className="border-t border-border/40 pt-2 mt-2" />
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">الأجزاء</span>
                <span className="font-semibold text-foreground">
                  {juzCount >= 1
                    ? remainingPages > 0
                      ? `${juzCount} أجزاء و ${remainingPages} صفحات`
                      : `${juzCount} أجزاء`
                    : "أقل من جزء"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">الأحزاب</span>
                <span className="font-semibold text-foreground">{juzCount * 2}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">الأرباع</span>
                <span className="font-semibold text-foreground">{juzCount * 8}</span>
              </div>
            </>
          )}

          {surahsInRange.length > 0 && (
            <>
              <div className="border-t border-border/40 pt-2 mt-2" />
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">عدد السور</span>
                <span className="font-semibold text-foreground">{surahsInRange.length}</span>
              </div>
              <div className="text-xs text-muted-foreground pt-1">
                {surahsInRange.slice(0, 8).map((s, i) => (
                  <span key={i} className="inline-block bg-muted/40 rounded-md px-2 py-0.5 ml-1 mb-1">
                    {s}
                  </span>
                ))}
                {surahsInRange.length > 8 && (
                  <span className="text-muted-foreground">...وغيرها</span>
                )}
              </div>
            </>
          )}

          <div className="border-t border-border/40 pt-2 mt-2" />
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">من (جزء/صفحة)</span>
            <span className="font-semibold text-foreground">
              {startRange ? `ج${startRange.juzu} · ص${startPage}` : `ص${startPage}`}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">إلى (جزء/صفحة)</span>
            <span className="font-semibold text-foreground">
              {endRange ? `ج${endRange.juzu} · ص${endPageExact}` : `ص${endPageExact}`}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** إيجاد رقم الصفحة النهائية بعد استهلاك عدد من الآيات ابتداء من startPage */
function findEndPage(verses, startPage) {
  const d = getQuranData();
  if (!d) return Math.min(604, startPage + Math.ceil(verses / 10));

  let remaining = verses;
  let currentPage = startPage;

  while (remaining > 0 && currentPage <= 604) {
    const vc = d.pageMap[currentPage]?.verseCount || 10;
    remaining -= vc;
    currentPage++;
  }

  return Math.min(604, currentPage);
}

/** جمع أسماء السور التي تمر بها الخطة بين صفحتين */
function getSurahsInRange(startPage, endPage) {
  const d = getQuranData();
  if (!d) return [];

  const surahs = new Set();
  for (let p = startPage; p <= endPage; p++) {
    const range = getPageRange(p);
    if (range) {
      const name = SURAH_NAMES[range.startChapter];
      if (name) surahs.add(name);
    }
  }
  return Array.from(surahs);
}