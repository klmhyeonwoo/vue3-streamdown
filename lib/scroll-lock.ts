// Shared scroll lock utility with reference counting.
let activeCount = 0;

export const lockBodyScroll = () => {
  activeCount += 1;
  if (activeCount === 1) {
    document.body.style.overflow = "hidden";
  }
};

export const unlockBodyScroll = () => {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) {
    document.body.style.overflow = "";
  }
};
