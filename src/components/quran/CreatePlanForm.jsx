import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Calendar, Hash, Coffee, Sparkles, Layers, Type } from "lucide-react";
// استيراد دالة getLocalToday من ملف المحرك لضبط التوقيت المحلي
import { createPlan, formatQuranUnits, smartQuranDisplay, DAY_NAMES_AR, getLocalToday } from "@/lib/quranPlanEngine";
import { getVersesBetween } from "@/lib/quranData";
import QuranDetailsPopover from "@/components/quran/QuranDetailsPopover";

const DAYS_OF_WEEK = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الإثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

export default function CreatePlanForm({ onPlanCreated, onCancel, existingPlans }) {
  const [formData, setFormData] = useState({
    name: "",
    startDate: getLocalToday(), // تم استبدال الكود القديم بالدالة المحلية الصحيحة
    endDate: "",
    startPage: 441,
    endPage: 604,
    offDays: [5],
  });

  // نمط الإجازة المتقدم
  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [weeksOn, setWeeksOn] = useState(1);
  const [weeksOff, setWeeksOff] = useState(1);

  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const handleOffDayToggle = (dayValue) => {
    setFormData(prev => ({
      ...prev,
      offDays: prev.offDays.includes(dayValue)
        ? prev.offDays.filter(d => d !== dayValue)
        : [...prev.offDays, dayValue]
    }));
  };

  const handlePreview = () => {
    setError("");
    if (!formData.name.trim()) {
      setError("يرجى إدخال اسم للخطة");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setError("يرجى تحديد تاريخ البداية والنهاية");
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
      return;
    }
    if (formData.startPage >= formData.endPage) {
      setError("صفحة البداية يجب أن تكون قبل صفحة النهاية");
      return;
    }

    const vacationPattern = vacationEnabled
      ? { enabled: true, weeksOn, weeksOff, customDays: [] }
      : null;

    const plan = createPlan({
      name: formData.name.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      startPage: formData.startPage,
      endPage: formData.endPage,
      offDays: formData.offDays,
      vacationPattern,
    });

    if (plan.error) {
      setError(plan.error);
      return;
    }

    setPreview(plan);
  };

  const handleSubmit = () => {
    if (preview) {
      onPlanCreated(preview);
    }
  };

  const pageCount = formData.endPage - formData.startPage + 1;
  const versesEstimate = getVersesBetween(formData.startPage, formData.endPage);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold font-heading text-foreground">إنشاء خطة مراجعة جديدة</h2>
        <p className="text-muted-foreground mt-2">سمِّ خطتك وحدد النطاق والفترة الزمنية</p>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 p-6 md:p-8 space-y-6">
        {/* اسم الخطة */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">اسم الخطة</h3>
          </div>
          <Input
            placeholder="مثال: مراجعة سورة البقرة..."
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="text-right"
          />
        </div>

        <div className="border-t border-border/40" />

        {/* نطاق الصفحات */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">نطاق المراجعة (بالصفحات)</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">من صفحة</Label>
              <Input
                type="number" min={1} max={604}
                value={formData.startPage}
                onChange={(e) => setFormData(prev => ({ ...prev, startPage: parseInt(e.target.value) || 1 }))}
                className="text-center text-lg font-semibold" dir="ltr"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">إلى صفحة</Label>
              <Input
                type="number" min={1} max={604}
                value={formData.endPage}
                onChange={(e) => setFormData(prev => ({ ...prev, endPage: parseInt(e.target.value) || 604 }))}
                className="text-center text-lg font-semibold" dir="ltr"
              />
            </div>
          </div>
          <div className="text-center mt-3">
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-sm font-bold text-foreground">
                {smartQuranDisplay(versesEstimate, formData.startPage)}
              </p>
              <QuranDetailsPopover verses={versesEstimate} startPage={formData.startPage} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pageCount} صفحة
            </p>
          </div>
        </div>

        <div className="border-t border-border/40" />

        {/* التواريخ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">الفترة الزمنية</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">تاريخ البداية</Label>
              <Input type="date" value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                dir="ltr" />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground mb-1.5 block">تاريخ النهاية</Label>
              <Input type="date" value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                dir="ltr" />
            </div>
          </div>
        </div>

        <div className="border-t border-border/40" />

        {/* أيام الإجازة الأسبوعية */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Coffee className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">أيام الإجازة الأسبوعية</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button key={day.value}
                onClick={() => handleOffDayToggle(day.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                  formData.offDays.includes(day.value)
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                }`}>
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* نمط الإجازة المتقدم */}
        <div className="border-t border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">نظام الإجازة المتقدم</h3>
            </div>
            <button
              onClick={() => setVacationEnabled(!vacationEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${
                vacationEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 ${
                vacationEnabled ? 'left-0.5' : 'right-0.5'
              }`} />
            </button>
          </div>

          {vacationEnabled && (
            <div className="bg-muted/40 rounded-xl p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                % نظام تناوب الأسابيع: حدد عدد أسابيع المراجعة ثم عدد أسابيع الإجازة بالتناوب %
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-1.5 block">أسابيع المراجعة</Label>
                  <Input type="number" min={1} max={12} value={weeksOn}
                    onChange={(e) => setWeeksOn(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center" dir="ltr" />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-1.5 block">أسابيع الإجازة</Label>
                  <Input type="number" min={1} max={12} value={weeksOff}
                    onChange={(e) => setWeeksOff(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center" dir="ltr" />
                </div>
              </div>
              <p className="text-xs text-primary font-medium">
                كل {weeksOn} أسبوع(أسابيع) مراجعة ← {weeksOff} أسبوع(أسابيع) إجازة
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* أزرار التحكم */}
        <div className="flex gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-xl">
              إلغاء
            </Button>
          )}
          <Button onClick={handlePreview} className="flex-1 h-12 rounded-xl text-base font-semibold" variant="outline">
            <Sparkles className="w-4 h-4 ml-2" />
            معاينة الخطة
          </Button>
        </div>

        {/* معاينة الخطة */}
        {preview && (
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6 space-y-4">
            <h4 className="font-bold text-foreground text-center">{preview.name}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{preview.totalPages}</p>
                <p className="text-xs text-muted-foreground">صفحة إجمالي</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{preview.workDays}</p>
                <p className="text-xs text-muted-foreground">يوم عمل</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{preview.dailyVerses}</p>
                <p className="text-xs text-muted-foreground">آية/يوم</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{preview.totalDays}</p>
                <p className="text-xs text-muted-foreground">يوم إجمالي</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">{preview.offDayCount}</p>
                <p className="text-xs text-muted-foreground">يوم إجازة</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{preview.totalPages}</p>
                <p className="text-xs text-muted-foreground">صفحة</p>
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full h-12 rounded-xl text-base font-semibold">
              بدء الخطة
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}