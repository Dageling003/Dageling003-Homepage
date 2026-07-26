<script setup lang="ts">
defineProps<{
  tip?: string
}>()
</script>

<template>
  <div class="gl-root">
    <div class="gl-card">
      <div class="gl-spinner">
        <svg class="gl-ring" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="var(--admin-hairline)" stroke-width="3" />
          <circle
            cx="24" cy="24" r="20" stroke="currentColor" stroke-width="3" stroke-linecap="round"
            stroke-dasharray="126" stroke-dashoffset="84"
            class="gl-ring-segment"
          />
        </svg>
      </div>
      <p v-if="tip" class="gl-tip">{{ tip }}</p>
      <div v-else class="gl-dots">
        <span class="gl-dot" />
        <span class="gl-dot" />
        <span class="gl-dot" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.gl-root {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.gl-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
}

.gl-spinner {
  position: relative;
  width: 48px;
  height: 48px;
  color: var(--admin-primary);
}

.gl-ring {
  width: 100%;
  height: 100%;
  animation: gl-rotate 1.4s linear infinite;
}

.gl-ring-segment {
  animation: gl-dash 1.4s ease-in-out infinite;
}

@keyframes gl-rotate {
  to { transform: rotate(360deg); }
}

@keyframes gl-dash {
  0% { stroke-dashoffset: 126; }
  50% { stroke-dashoffset: 32; transform: rotate(90deg); }
  100% { stroke-dashoffset: 126; transform: rotate(360deg); }
}

.gl-dots {
  display: flex;
  gap: 6px;
}

.gl-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--admin-primary);
  animation: gl-bounce 1.2s ease-in-out infinite;
}

.gl-dot:nth-child(2) { animation-delay: 0.16s; }
.gl-dot:nth-child(3) { animation-delay: 0.32s; }

@keyframes gl-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.gl-tip {
  font-size: 0.9rem;
  color: var(--admin-text-secondary);
  margin: 0;
}
</style>
