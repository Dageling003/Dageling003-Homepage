import { ref, onMounted, onUnmounted } from 'vue';

export function useLoading() {
  const showLoading = ref(true);
  const wasOverflowHidden = ref(false);

  const hideLoading = () => {
    showLoading.value = false;
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 300);
  };

  const preventScroll = () => {
    wasOverflowHidden.value = document.body.style.overflow === 'hidden';
    if (!wasOverflowHidden.value) {
      document.body.style.overflow = 'hidden';
    }
  };

  const restoreScroll = () => {
    if (!wasOverflowHidden.value) {
      document.body.style.overflow = '';
    }
  };

  onMounted(() => {
    preventScroll();
    hideLoading();
  });

  onUnmounted(() => {
    restoreScroll();
  });

  return {
    showLoading,
    hideLoading,
    preventScroll,
    restoreScroll,
  };
}
