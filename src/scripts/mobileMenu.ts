/**
 * 初始化手機版選單
 */
export function initMobileMenu() {
  const button = document.getElementById("mobile-menu-button");
  const menu = document.getElementById("mobile-menu");
  const hamburgerIcon = document.getElementById("hamburger-icon");
  const closeIcon = document.getElementById("close-icon");

  if (!button || !menu || !hamburgerIcon || !closeIcon) return;

  let isOpen = false;

  // 更新 UI 狀態
  const updateUI = () => {
    if (isOpen) {
      menu.classList.remove("hidden");
      hamburgerIcon.classList.add("hidden");
      closeIcon.classList.remove("hidden");
    } else {
      menu.classList.add("hidden");
      hamburgerIcon.classList.remove("hidden");
      closeIcon.classList.add("hidden");
    }
  };

  // 切換選單
  button.addEventListener("click", () => {
    isOpen = !isOpen;
    updateUI();
  });

  // 點擊連結關閉選單
  const links = menu.querySelectorAll("a");
  links.forEach((link) => {
    link.addEventListener("click", () => {
      isOpen = false;
      updateUI();
    });
  });
}
