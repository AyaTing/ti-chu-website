import type { NavItem } from "@/config/navigation";

/**
 * 判斷導航項目是否為 active 狀態
 */
export const isNavItemActive = (
  item: NavItem,
  currentPath: string,
): boolean => {
  return item.exact
    ? currentPath === item.href
    : currentPath.startsWith(item.href);
};

/**
 * 產生導航連結的 class 名稱
 */
export const getNavLinkClasses = (
  item: NavItem,
  currentPath: string,
): string[] => {
  const baseClasses = ["transition-all", "hover:text-gray-600"];
  const activeClass = isNavItemActive(item, currentPath) ? "font-semibold" : "";

  return activeClass ? [...baseClasses, activeClass] : baseClasses;
};
