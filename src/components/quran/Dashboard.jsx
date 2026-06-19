import React, { useState } from "react";
import { Calendar, Target, TrendingUp, Trash2, BookOpen, Layers, Plus, ChevronDown, Settings } from "lucide-react";
import { getStats, getProgress, getTodayData, recordDayProgressFlexible, undoDayProgress, formatQuranUnits, smartQuranDisplay, versesToPages } from "@/lib/quranPlanEngine";
import { savePlan, deletePlan, loadAllPlans, setActivePlanId } from "@/lib/planStorage";
import ProgressRing from "./ProgressRing";
import StatCard from "./StatCard";
import ScheduleView from "./ScheduleView";
import FlexibleEntryPanel from "./FlexibleEntryPanel";
import QuranDetailsPopover from "./QuranDetailsPopover";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard({ plan, allPlans, onPlanUpdate, onDeletePlan, onSwitchPlan, onNewPlan }) {
  const [recordDay, setRecordDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const stats = getStats(plan);
  const progress = getProgress(plan);
  const todayData = getTodayData(plan);
  const alreadyRecorded = todayData && todayData.status !== "pending";

  const handleRecordDay = (day) => {
    setRecordDay(day);
    setDialogOpen(true);
  };

  const handleSaveProgress = (dateStr, calculatedVerses, flexibleInput) => {
    const updatedPlan = recordDayProgressFlexible(plan, dateStr, flexibleInput);
    savePlan(updatedPlan);
    onPlanUpdate(updatedPlan);
  };

  const handleUndoProgress = (dateStr) => {
    const updatedPlan = undoDayProgress(plan, dateStr);
    savePlan(updatedPlan);
    onPlanUpdate(updatedPlan);
  };

  const startQuarter = plan.verseRange?.startChapter
    ? `الجزء ${Math.ceil(plan.startPage / 20)}`
    : "";

  return (
    <div className="space-y-8">
      {/* الرأس - تعدد الخطط */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {/* قائمة الخطط */}
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 bg-card border border-border/60 rounded-xl px-4 py-2.5 hover:border-primary/30 transition-colors">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground text-sm max-w-[180px] truncate">{plan.name}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {allPlans.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => p.id !== plan.id && onSwitchPlan(p.id)}
                    className={`flex items-center justify-between ${p.id === plan.id ? 'bg-primary/10' : ''}`}
                  >
                    <span className="truncate flex-1 text-right ml-2">{p.name}</span>
                    {p.id === plan.id && (
                      <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">نشط</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <div className="border-t border-border/40 mt-1 pt-1">
                  <DropdownMenuItem onClick={onNewPlan} className="text-primary font-medium">
                    <Plus className="w-4 h-4 ml-2" />
                    خطة جديدة
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* زر الحذف */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/5 h-10">
                  <Trash2 className="w-4 h-4 ml-1" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف "{plan.name}"</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من حذف هذه الخطة؟ سيتم فقدان جميع بيانات التقدم.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-2 sm:gap-2">
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeletePlan(plan.id)} className="bg-destructive hover:bg-destructive/90">
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="text-muted-foreground mt-2 text-sm flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              {smartQuranDisplay(plan.totalVerses, plan.startPage)}
              <QuranDetailsPopover verses={plan.totalVerses} startPage={plan.startPage} />
            </span>
          </p>
        </div>

        {/* ملخص سريع */}
        <div className="flex items-center gap-4 bg-card border border-border/60 rounded-2xl px-5 py-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">مُنجَز</p>
            <p className="text-lg font-bold text-emerald-600">{versesToPages(plan.completedVerses, plan.startPage)}</p>
          </div>
          <div className="w-px h-8 bg-border/60" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">متبقي</p>
            <p className="text-lg font-bold text-accent">{plan.totalPages - versesToPages(plan.completedVerses, plan.startPage)}</p>
          </div>
          <div className="w-px h-8 bg-border/60" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">يوميًا</p>
            <p className="text-lg font-bold text-primary">{plan.dailyPages}</p>
          </div>
        </div>
      </div>

      {/* بطاقة اليوم + حلقة التقدم + إحصائيات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* حلقة التقدم */}
        <div className="bg-card rounded-2xl border border-border/60 p-6 flex flex-col items-center justify-center">
          <ProgressRing progress={progress} />
          <div className="mt-4 text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{versesToPages(plan.completedVerses, plan.startPage)}</span> من {plan.totalPages} صفحة
            </p>
            <p className="text-xs text-muted-foreground">
              متبقي: <span className="font-semibold text-accent">{plan.totalPages - versesToPages(plan.completedVerses, plan.startPage)} صفحة</span>
            </p>
            <p className="text-xs text-muted-foreground">{formatQuranUnits(plan.completedVerses, plan.startPage)}</p>
          </div>
        </div>

        {/* بطاقة اليوم */}
        {todayData && (
          <div className={`rounded-2xl border p-6 ${todayData.isOff ? 'bg-secondary/50 border-border/40' : 'bg-primary/5 border-primary/20'}`}>
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              مهمة اليوم
            </h3>
            {todayData.isOff ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-lg font-semibold text-muted-foreground">يوم إجازة</p>
                <p className="text-sm text-muted-foreground">استمتع بيومك!</p>
                <Button
                  onClick={() => handleRecordDay(todayData)}
                  variant="outline"
                  className="rounded-xl"
                  size="sm"
                >
                  تسجيل مراجعة استثنائية
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center py-3 space-y-2">
                  <p className="text-4xl font-bold text-primary">{formatQuranUnits(todayData.targetVerses, todayData.targetStartPage || plan.startPage)}</p>
                  <p className="text-sm text-muted-foreground">الورد المطلوب</p>
                  {todayData.targetStartPage && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg py-1.5 px-3 inline-block">
                      من ص{todayData.targetStartPage} إلى ص{todayData.targetEndPage}
                    </p>
                  )}
                  {todayData.targetQuarterName && (
                    <p className="text-xs text-primary font-medium bg-primary/5 rounded-lg py-1.5 px-3 inline-block mt-1">
                      {todayData.targetQuarterName}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleRecordDay(todayData)}
                  className="w-full mt-4 rounded-xl h-11 font-semibold"
                  variant={alreadyRecorded ? "outline" : "default"}
                >
                  {alreadyRecorded ? `تعديل (${formatQuranUnits(todayData.completedVerses, todayData.targetStartPage || plan.startPage)})` : "تسجيل الإنجاز"}
                </Button>
              </>
            )}
          </div>
        )}

        {/* الإحصائيات */}
        <div className="space-y-3">
          <StatCard
            icon={TrendingUp}
            label="المعدل اليومي"
            value={`${stats?.avgDailyPages || 0} صفحات`}
          />
          <StatCard
            icon={BookOpen}
            label="المقدار اليومي الحالي"
            value={`${plan.dailyPages} صفحات`}
          />
          <StatCard
            icon={Layers}
            label="الأيام المتبقية"
            value={`${stats?.pendingDays || 0} يوم`}
            subValue={`${stats?.completedDays || 0} منجز · ${stats?.partialDays || 0} جزئي · ${stats?.skippedDays || 0} متخطى`}
          />
        </div>
      </div>

      {/* الجدول */}
      <ScheduleView schedule={plan.schedule} onRecordDay={handleRecordDay} />

      {/* لوحة الإدخال المرن */}
      <FlexibleEntryPanel
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        day={recordDay}
        onSave={handleSaveProgress}
        onUndo={handleUndoProgress}
        alreadyRecorded={recordDay && recordDay.status !== "pending"}
      />
    </div>
  );
}