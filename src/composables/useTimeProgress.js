import { ref, computed, onMounted, onUnmounted } from 'vue';

export function useTimeProgress() {
  const now = ref(new Date());
  let updateInterval = null;

  const hoursPassedDisplay = computed(() => now.value.getHours());
  const hoursPassed = computed(() => now.value.getHours() + now.value.getMinutes() / 60);
  const hoursProgress = computed(() => ((hoursPassed.value / 24) * 100).toFixed(2));

  const daysInWeekPassed = computed(() => {
    const day = now.value.getDay();
    return day === 0 ? 7 : day;
  });
  const weekProgress = computed(() => ((daysInWeekPassed.value / 7) * 100).toFixed(2));

  const daysInMonthPassed = computed(() => now.value.getDate());
  const daysInCurrentMonth = computed(() =>
    new Date(now.value.getFullYear(), now.value.getMonth() + 1, 0).getDate()
  );
  const monthProgress = computed(() =>
    (
      ((daysInMonthPassed.value - 1 + hoursPassed.value / 24) / daysInCurrentMonth.value) *
      100
    ).toFixed(2)
  );

  const daysInYearPassed = computed(() => {
    const startOfYear = new Date(now.value.getFullYear(), 0, 1);
    const diff = now.value - startOfYear;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  const daysInCurrentYear = computed(() => {
    const isLeap = isLeapYear(now.value.getFullYear());
    return isLeap ? 366 : 365;
  });

  const yearProgress = computed(() =>
    (
      ((daysInYearPassed.value - 1 + hoursPassed.value / 24) / daysInCurrentYear.value) *
      100
    ).toFixed(2)
  );

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  onMounted(() => {
    updateInterval = setInterval(() => {
      now.value = new Date();
    }, 60000);
  });

  onUnmounted(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });

  return {
    now,
    hoursPassedDisplay,
    hoursProgress,
    daysInWeekPassed,
    weekProgress,
    daysInMonthPassed,
    daysInCurrentMonth,
    monthProgress,
    daysInYearPassed,
    daysInCurrentYear,
    yearProgress,
  };
}
