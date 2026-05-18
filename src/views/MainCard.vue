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
        <div class="card">
          <span class="cardHeader">我的一些鸽子计划📃</span>
          <div class="cardMain">
            <TodoList :todo-list="todo.todoList" />
          </div>
        </div>

        <div class="card">
          <TimeProgress />
        </div>
      </div>

      <div class="rightBox">
        <div class="card">
          <ProfileCard :config="config" :tech-stack="techStack.techStack" />
        </div>

        <div class="typew card">
          <Icon icon="carbon:quotes" width="16" height="16" />
          <Typewriter :text="typewriter" />
          <Icon icon="ph:quotes-fill" width="16" height="16" />
        </div>

        <div class="linkBox card">
          <LinkBtn
            v-for="(i, index) in linkBtns.linkBtn"
            :key="index"
            :icon="i.icon"
            :text="i.text"
            :color="i.color"
            :url="i.url"
          />
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
import { config, linkBtns, techStack, todo, typewriter } from '../config';
import { Icon } from '@iconify/vue';
import { ref } from 'vue';
import LinkBtn from '../components/LinkBtn.vue';
import Typewriter from '../components/Typewriter.vue';
import TodoList from '../components/TodoList.vue';
import TimeProgress from '../components/TimeProgress.vue';
import ProfileCard from '../components/ProfileCard.vue';

const visitCount = ref(parseInt(localStorage.getItem('visitCount')) || 0);
</script>

<style>
@import url(../assets/css/MainCard.css);
</style>
