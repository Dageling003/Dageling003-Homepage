<template>
  <div class="typewriter">
    <span>{{ displayedText }}</span>
    <span class="cursor" :class="{ blink: showCursor }">|</span>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  text: {
    type: [String, Array],
    default: () => [],
  },
  typingSpeed: {
    type: Number,
    default: 150, // 打字速度
  },
  deletingSpeed: {
    type: Number,
    default: 100, // 删除速度
  },
  delayAfterTyping: {
    type: Number,
    default: 1000, // 打字完成后的延迟
  },
  delayAfterDeleting: {
    type: Number,
    default: 500, // 删除完成后的延迟
  },
  loop: {
    type: Boolean,
    default: true,
  },
});

const displayedText = ref('');
const showCursor = ref(true);
const currentIndex = ref(0);
const currentTextIndex = ref(0);
const isDeleting = ref(false);
let timeoutId = null;
let intervalId = null;

const getCurrentText = () => {
  if (Array.isArray(props.text)) {
    return props.text[currentTextIndex.value] || '';
  }
  return props.text || '';
};

const getTextArrayLength = () => {
  if (Array.isArray(props.text)) {
    return props.text.length;
  }
  return 0;
};

const typeText = () => {
  const textToType = getCurrentText();

  if (!isDeleting.value) {
    if (currentIndex.value < textToType.length) {
      displayedText.value += textToType.charAt(currentIndex.value);
      currentIndex.value++;
      timeoutId = setTimeout(typeText, props.typingSpeed);
    } else {
      if (props.loop || currentTextIndex.value < getTextArrayLength() - 1) {
        timeoutId = setTimeout(() => {
          isDeleting.value = true;
          typeText();
        }, props.delayAfterTyping);
      }
    }
  } else {
    if (currentIndex.value > 0) {
      displayedText.value = textToType.substring(0, currentIndex.value - 1);
      currentIndex.value--;
      timeoutId = setTimeout(typeText, props.deletingSpeed);
    } else {
      isDeleting.value = false;
      if (props.loop || currentTextIndex.value < getTextArrayLength() - 1) {
        if (Array.isArray(props.text) && props.text.length > 0) {
          currentTextIndex.value = (currentTextIndex.value + 1) % props.text.length;
        }

        if (props.loop || currentTextIndex.value < getTextArrayLength()) {
          timeoutId = setTimeout(typeText, props.delayAfterDeleting);
        }
      }
    }
  }
};

onMounted(() => {
  typeText();

  intervalId = setInterval(() => {
    showCursor.value = !showCursor.value;
  }, 500);
});

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId);
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.typewriter {
  font-family: monospace;
  white-space: pre-wrap;
  overflow: hidden;
  text-align: center;
  font-size: 18px;
}

.cursor {
  font-weight: bolder;
  margin-left: 2px;
  opacity: 1;
  transition: opacity 0.1s;
}

.cursor.blink {
  opacity: 0;
}
</style>
