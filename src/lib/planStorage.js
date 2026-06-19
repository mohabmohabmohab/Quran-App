/**
 * تخزين متعدد الخطط محلياً في localStorage
 */

const PLANS_KEY = "quran_review_plans_v2";
const ACTIVE_KEY = "quran_active_plan_id";

/** تحميل جميع الخطط */
export function loadAllPlans() {
  const raw = localStorage.getItem(PLANS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/** حفظ جميع الخطط */
export function saveAllPlans(plans) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

/** تحميل خطة واحدة */
export function loadPlan(id) {
  const plans = loadAllPlans();
  return plans.find(p => p.id === id) || null;
}

/** حفظ/تحديث خطة واحدة */
export function savePlan(plan) {
  const plans = loadAllPlans();
  const idx = plans.findIndex(p => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  saveAllPlans(plans);
  setActivePlanId(plan.id);
}

/** حذف خطة */
export function deletePlan(id) {
  let plans = loadAllPlans();
  plans = plans.filter(p => p.id !== id);
  saveAllPlans(plans);
  if (getActivePlanId() === id) {
    setActivePlanId(plans.length > 0 ? plans[0].id : null);
  }
}

/** معرف الخطة النشطة */
export function getActivePlanId() {
  return localStorage.getItem(ACTIVE_KEY) || null;
}

export function setActivePlanId(id) {
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

/** الخطة النشطة */
export function loadActivePlan() {
  const id = getActivePlanId();
  if (!id) {
    const plans = loadAllPlans();
    if (plans.length > 0) {
      setActivePlanId(plans[0].id);
      return plans[0];
    }
    return null;
  }
  return loadPlan(id);
}