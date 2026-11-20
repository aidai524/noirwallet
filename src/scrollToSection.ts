/** 滚到区块时让出固定顶栏的高度。 */
export function scrollToSection(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const offset = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-offset")) || 0;
  const top = node.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
