<template>
  <div class="mainCard">
    <div class="header">
      <div class="avatar" :emjoi="config.emjoi">
        <img :src="config.avatarUrl" :alt="config.name + '的头像'" loading="lazy" />
      </div>

      <div class="sayHi">
        <h1>
          Hi, I'm
          <span class="name" :data-text="config.name">
            {{ config.name }}
          </span>
        </h1>

        <div class="infoTags">
          <div v-if="config.infoTags.sex === '男'" class="tag hover">
            <span class="boy"> ♂ </span>
          </div>
          <div v-else-if="config.infoTags.sex === '女'" class="tag hover">
            <span class="girl"> ♀ </span>
          </div>
          <div v-else class="tag hover">
            {{ config.infoTags.sex }}
          </div>
          <div class="tag hover">{{ config.infoTags.province }}</div>
          <div class="tag hover">{{ config.infoTags.school }}</div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="leftBox">
        <!-- todo -->
        <div class="card">
          <span class="cardHeader">我的一些鸽子计划📃</span>
          <div class="cardMain">
            <div class="todoList">
              <div
                class="todoItem"
                v-for="(i, index) in todo.todoList"
                :key="index"
              >
                <Icon
                  :icon="i.checked ? 'lets-icons:check-ring' : 'gg:radio-check'"
                  width="24"
                  height="24"
                />
                <span v-if="i.checked">
                  <del>{{ i.text }}</del>
                </span>
                <span v-else>
                  {{ i.text }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 时间显示 -->
        <div class="card">
          <div class="time-progress">
            <h3>时光⌛</h3>
            <div class="progress-item">
              <p>☀️今天已经过去了 {{ hoursPassedDisplay }} / 24 小时</p>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: hoursProgress + '%' }"
                ></div>
              </div>
            </div>

            <div class="progress-item">
              <p>📆本周已经过去了 {{ daysInWeekPassed }} / 7 天</p>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: weekProgress + '%' }"
                ></div>
              </div>
            </div>

            <div class="progress-item">
              <p>
                🌙本月已经过去了 {{ daysInMonthPassed }} /
                {{ daysInCurrentMonth }} 天
              </p>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: monthProgress + '%' }"
                ></div>
              </div>
            </div>

            <div class="progress-item">
              <p>
                ⭐今年已经过去了 {{ daysInYearPassed }} /
                {{ daysInCurrentYear }} 天
              </p>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: yearProgress + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rightBox">
        <div class="card">
          <p>你好鸭，很高兴认识你👋</p>
          <p>
            我叫
            <b>{{ config.name }}</b>
            （ {{ config.age }}年的 <b class="zodiac">{{ config.zodiac }}</b> ）
          </p>
          <p>
            是一名
            <span v-for="(i, index) in config.professions" :key="index">
              <b>{{ i }}</b>
              <span v-if="index < config.professions.length - 1">、</span>
            </span>
          </p>

          <!-- 技术栈 -->
          <h3>我的一些技术栈🫡</h3>
          <div class="techStack">
            <div
              v-for="(i, index) in techStack.techStack"
              :key="index"
              class="techItem"
              :data-name="i.name"
            >
              <Icon :icon="i.icon" width="40" height="40" />
            </div>
          </div>
        </div>

        <div class="typew card">
          <Icon icon="carbon:quotes" width="16" height="16" />
          <Typewriter :text="typewriter" />
          <Icon icon="ph:quotes-fill" width="16" height="16" />
        </div>

        <!-- 外链按钮 -->
        <div class="linkBox card">
          <link-btn
            v-for="(i, index) in linkBtns.linkBtn"
            :key="index"
            :icon="i.icon"
            :text="i.text"
            :color="i.color"
            :url="i.url"
          ></link-btn>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>
        ©2026 Dageling003 |
        <span>👀 访问次数：{{ visitCount }}</span> |
        <a href="https://github.com/Dageling003/Dageling003-Homepage">仓库</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import config from "../config/config.json";
import linkBtns from "../config/linkBtn.json";
import techStack from "../config/techStack.json";
import todo from "../config/todo.json";
import typewriter from "../config/typewriter.json";
import { Icon } from "@iconify/vue";
import LinkBtn from "../components/LinkBtn.vue";
import { onMounted, ref, computed, onUnmounted } from "vue";
import Typewriter from "../components/Typewriter.vue";

const now = ref(new Date());
const visitCount = ref(parseInt(localStorage.getItem("visitCount")) || 0);
let updateInterval = null;

const hoursPassedDisplay = computed(() => now.value.getHours());
const hoursPassed = computed(() => now.value.getHours() + now.value.getMinutes() / 60);
const hoursProgress = computed(() =>
  ((hoursPassed.value / 24) * 100).toFixed(2)
);

const daysInWeekPassed = computed(() => {
  const day = now.value.getDay();
  return day === 0 ? 7 : day;
});
const weekProgress = computed(() =>
  ((daysInWeekPassed.value / 7) * 100).toFixed(2)
);

const daysInMonthPassed = computed(() => now.value.getDate());
const daysInCurrentMonth = computed(() =>
  new Date(now.value.getFullYear(), now.value.getMonth() + 1, 0).getDate()
);
const monthProgress = computed(
  () => ((daysInMonthPassed.value - 1 + hoursPassed.value / 24) / daysInCurrentMonth.value * 100).toFixed(2)
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

const yearProgress = computed(
  () => ((daysInYearPassed.value - 1 + hoursPassed.value / 24) / daysInCurrentYear.value * 100).toFixed(2)
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
</script>

<style>
@import url(../assets/css/MainCard.css);
</style>
