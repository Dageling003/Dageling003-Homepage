<template>
  <div class="time-progress">
    <h3>时光⌛</h3>
    <div class="progress-item">
      <p>☀️今天已经过去了 {{ hoursPassedDisplay }} / 24 小时</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: hoursProgress + '%' }"></div>
      </div>
    </div>

    <div class="progress-item">
      <p>📆本周已经过去了 {{ daysInWeekPassed }} / 7 天</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: weekProgress + '%' }"></div>
      </div>
    </div>

    <div class="progress-item">
      <p>🌙本月已经过去了 {{ daysInMonthPassed }} / {{ daysInCurrentMonth }} 天</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: monthProgress + '%' }"></div>
      </div>
    </div>

    <div class="progress-item">
      <p>⭐今年已经过去了 {{ daysInYearPassed }} / {{ daysInCurrentYear }} 天</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: yearProgress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTimeProgress } from '../composables/useTimeProgress';

const {
  hoursPassedDisplay,
  daysInWeekPassed,
  daysInMonthPassed,
  daysInYearPassed,
  daysInCurrentMonth,
  daysInCurrentYear,
  hoursProgress,
  weekProgress,
  monthProgress,
  yearProgress,
} = useTimeProgress();
</script>

<style scoped>
.time-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-progress h3 {
  margin: 0 0 0.5rem 0;
  font-size: 16px;
  color: #333;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.progress-item p {
  margin: 0;
  font-size: 13px;
  color: #555;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9e9e, #ffb86c);
  border-radius: 4px;
  transition: width 0.3s ease;
}
</style>
