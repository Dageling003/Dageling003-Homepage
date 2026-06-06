<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  option: EChartsOption
  height?: string
}>()

const chartRef = ref<HTMLDivElement | null>(null)
const chart = shallowRef<echarts.ECharts | null>(null)

let resizeObserver: ResizeObserver | null = null

function initChart() {
  if (!chartRef.value) return
  chart.value?.dispose()
  const instance = echarts.init(chartRef.value)
  instance.setOption(props.option)
  chart.value = instance

  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(() => {
    instance.resize()
  })
  resizeObserver.observe(chartRef.value)
}

watch(() => props.option, (opt) => {
  chart.value?.setOption(opt, true)
}, { deep: true })

onMounted(initChart)
onUnmounted(() => {
  chart.value?.dispose()
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="chartRef" class="dc-chart" :style="{ height: height || '280px' }" />
</template>

<style scoped>
.dc-chart {
  width: 100%;
  min-height: 200px;
}
</style>
