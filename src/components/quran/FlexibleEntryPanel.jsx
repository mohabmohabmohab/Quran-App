import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, BookOpen, RotateCcw, Layers } from "lucide-react";
import { formatQuranUnits, smartQuranDisplay, flexibleInputToVerses, versesToPages } from "@/lib/quranPlanEngine";

export default function FlexibleEntryPanel({ open, onOpenChange, day, onSave, onUndo, alreadyRecorded }) {
  const [input, setInput] = useState({ juz: 0, hizb: 0, rub: 0, pages: 0, verses: 0 });
  const [mode, setMode] = useState(alreadyRecorded ? "view" : "enter");

  const calculatedVerses = flexibleInputToVerses(
    input,
    day?.targetStartPage || 1
  );

  const diff = day ? Math.round((calculatedVerses - day.targetVerses) * 10) / 10 : 0;
  const isExact = diff === 0;
  const isLess = diff < 0 && calculatedVerses > 0;
  const isMore = diff > 0;

  const resetInput = () => {
    setInput({ juz: 0, hizb: 0, rub: 0, pages: 0, verses: 0 });
  };

  const handleSave = () => {
    if (calculatedVerses === 0) return;
    onSave(day.date, calculatedVerses, input);
    onOpenChange(false);
    resetInput();
  };

  const handleUndo = () => {
    onUndo(day.date);
    onOpenChange(false);
    resetInput();
  };

  const handleQuickComplete = () => {
    setInput({ juz: 0, hizb: 0, rub: 0, pages: 0, verses: day?.targetVerses || 0 });
  };

  const handleQuickHalf = () => {
    const half = Math.ceil((day?.targetVerses || 0) / 2);
    setInput({ juz: 0, hizb: 0, rub: 0, pages: 0, verses: half });
  };

  if (!day) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center font-heading text-xl">
            {alreadyRecorded ? "تعديل إنجاز اليوم" : "تسجيل إنجاز اليوم"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-3 space-y-5">
          {/* بطاقة اليوم */}
          <div className="text-center bg-muted/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">
              {day.dayName} - {new Date(day.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })}
            </p>
            {day.isOff ? (
              <p className="text-lg font-bold text-foreground mt-1">
                يوم إجازة — <span className="text-muted-foreground">لا يوجد ورد محدد</span>
              </p>
            ) : (
              <p className="text-lg font-bold text-foreground mt-1">
                الورد المطلوب: <span className="text-primary">{formatQuranUnits(day.targetVerses, day.targetStartPage || 1)}</span>
              </p>
            )}
            {!day.isOff && day.targetStartPage && (
              <p className="text-xs text-muted-foreground mt-1">
                من ص{day.targetStartPage} إلى ص{day.targetEndPage}
              </p>
            )}
            {!day.isOff && day.targetQuarterName && (
              <p className="text-xs text-primary font-medium mt-1 bg-primary/5 rounded-lg py-1 px-3 inline-block">
                {day.targetQuarterName}
              </p>
            )}
          </div>

          {/* لوحة الإدخال المرن */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-3 block text-center">
              ماذا راجعت اليوم؟
            </Label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[
                { key: "juz", label: "أجزاء", icon: "J" },
                { key: "hizb", label: "أحزاب", icon: "H" },
                { key: "rub", label: "أرباع", icon: "R" },
                { key: "pages", label: "صفحات", icon: "ص" },
                { key: "verses", label: "آيات", icon: "آ" },
              ].map((unit) => (
                <div key={unit.key} className="text-center">
                  <Label className="text-[11px] text-muted-foreground mb-1 block">{unit.label}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={input[unit.key]}
                    onChange={(e) => setInput(prev => ({
                      ...prev,
                      [unit.key]: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    className="text-center text-sm font-semibold h-10 px-1"
                    dir="ltr"
                    autoFocus={false}
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              ))}
            </div>

            {/* النتيجة المحسوبة */}
            <div className="bg-card border border-border/60 rounded-xl p-4 text-center space-y-1">
              <p className="text-sm text-muted-foreground">الإجمالي المحسوب</p>
              <p className="text-3xl font-bold text-primary">{formatQuranUnits(calculatedVerses, day?.targetStartPage || 1)}</p>
            </div>

            {/* رسائل التأثير */}
            {isExact && calculatedVerses > 0 && (
              <div className="text-center text-sm text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 rounded-lg py-3 px-4 mt-3">
                <Check className="w-4 h-4 inline ml-1" />
                أحسنت! أكملت الورد كاملاً — لا تغيير على الأيام القادمة
              </div>
            )}
            {isLess && (
            <div className="text-center text-sm text-accent font-medium bg-accent/5 border border-accent/20 rounded-lg py-3 px-4 mt-3">
              <BookOpen className="w-4 h-4 inline ml-1" />
              تبقى {Math.abs(Math.round(diff))} آية — سيتم توزيعها على الأيام القادمة (مع ثبات تاريخ النهاية)
            </div>
            )}
            {isMore && (
            <div className="text-center text-sm text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 rounded-lg py-3 px-4 mt-3">
              ماشاء الله! أنجزت {Math.round(diff)} آية زيادة — سيتم تخفيف المقدار اليومي للأيام القادمة تلقائياً
            </div>
            )}
            {calculatedVerses === 0 && (
              <div className="text-center text-sm text-destructive font-medium bg-destructive/5 border border-destructive/20 rounded-lg py-3 px-4 mt-3">
                لم تُدخل أي مقدار بعد
              </div>
            )}
          </div>

          {/* أزرار سريعة */}
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={handleQuickComplete}
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Check className="w-3.5 h-3.5 inline ml-1" />
              أكملت الورد كاملاً
            </button>
            <button
              onClick={handleQuickHalf}
              className="px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
            >
              راجعت النصف
            </button>
            <button
              onClick={resetInput}
              className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 inline ml-1" />
              تصفير
            </button>
          </div>

          {/* زر التراجع */}
          {alreadyRecorded && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="text-destructive border-destructive/20 hover:bg-destructive/5"
              >
                <RotateCcw className="w-4 h-4 ml-1" />
                تراجع عن تسجيل اليوم
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl">
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
            disabled={calculatedVerses === 0}
          >
            <Check className="w-4 h-4 ml-2" />
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}