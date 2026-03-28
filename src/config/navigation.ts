export const navItems = [
  { href: "/", label: "首頁", exact: true },
  { href: "/about", label: "關於帝筑", exact: true },
  { href: "/process", label: "委託流程", exact: true },
  { href: "/projects", label: "作品集", exact: false },
  { href: "/contact", label: "聯絡我們", exact: true },
] as const;

export type NavItem = (typeof navItems)[number];
