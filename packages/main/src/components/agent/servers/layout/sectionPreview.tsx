/** Mount a compact native-drag ghost into Pragmatic's preview container. */
export function mountSectionPreview(container: HTMLElement, label: string): void {
  const card = document.createElement("div");
  card.style.cssText = [
    "display:flex",
    "align-items:center",
    "gap:10px",
    "width:220px",
    "padding:10px 12px",
    "border-radius:8px",
    "border:1px solid color-mix(in oklab, CanvasText 18%, transparent)",
    "background:Canvas",
    "color:CanvasText",
    "box-shadow:0 10px 30px color-mix(in oklab, CanvasText 28%, transparent)",
    "font:600 13px/1.2 ui-sans-serif, system-ui, sans-serif",
    "pointer-events:none",
  ].join(";");

  const icon = document.createElement("span");
  icon.style.cssText = [
    "display:inline-flex",
    "width:28px",
    "height:28px",
    "align-items:center",
    "justify-content:center",
    "border-radius:6px",
    "background:color-mix(in oklab, CanvasText 8%, transparent)",
    "flex:0 0 auto",
    "letter-spacing:-1px",
    "opacity:0.7",
  ].join(";");
  icon.textContent = "⋮⋮";

  const textCol = document.createElement("div");
  textCol.style.cssText = "min-width:0;display:flex;flex-direction:column;gap:2px";

  const title = document.createElement("div");
  title.style.cssText = "overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
  title.textContent = label;

  const hint = document.createElement("div");
  hint.style.cssText = "font-size:11px;font-weight:500;opacity:0.55";
  hint.textContent = "Move section";

  textCol.appendChild(title);
  textCol.appendChild(hint);
  card.appendChild(icon);
  card.appendChild(textCol);
  container.appendChild(card);
}
