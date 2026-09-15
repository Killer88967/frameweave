(() => {
  const parameters = new URLSearchParams(window.location.search);

  if (!parameters.has("__frameweave") || window.parent === window) return;

  const overlay = document.createElement("div");

  Object.assign(overlay.style, {
    position: "fixed",
    zIndex: "2147483647",
    pointerEvents: "none",
    border: "2px solid #7c3aed",
    background: "rgb(124 58 237 / 8%)",
    boxShadow: "0 0 0 1px rgb(255 255 255 / 70%)",
    transition: "top 60ms, left 60ms, width 60ms, height 60ms",
  });

  document.documentElement.append(overlay);

  let activeElement;

  function updateOverlay(element) {
    activeElement = element;

    const rectangle = element.getBoundingClientRect();

    Object.assign(overlay.style, {
      top: `${rectangle.top}px`,
      left: `${rectangle.left}px`,
      width: `${rectangle.width}px`,
      height: `${rectangle.height}px`,
    });
  }

  document.addEventListener(
    "pointerover",
    (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (event.target === overlay) return;

      updateOverlay(event.target);
    },
    true,
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof HTMLElement)) return;

      event.preventDefault();
      event.stopPropagation();

      const element = event.target;
      const rectangle = element.getBoundingClientRect();
      const styles = getComputedStyle(element);

      updateOverlay(element);

      window.parent.postMessage(
        {
          source: "frameweave-preview",
          type: "element-selected",
          payload: {
            tagName: element.tagName.toLowerCase(),
            id: element.id,
            classNames: [...element.classList],
            text:
              element.textContent?.trim().replace(/\s+/g, " ").slice(0, 120) ??
              null,
            attributes: Object.fromEntries(
              [...element.attributes].map((attribute) => [
                attribute.name,
                attribute.value,
              ]),
            ),
            rectangle: {
              x: rectangle.x,
              y: rectangle.y,
              width: rectangle.width,
              height: rectangle.height,
            },
            styles: {
              display: styles.display,
              position: styles.position,
              padding: styles.padding,
              gap: styles.gap,
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              fontSize: styles.fontSize,
            },
          },
        },
        "*",
      );
    },
    true,
  );

  window.addEventListener("resize", () => {
    if (activeElement) updateOverlay(activeElement);
  });

  window.addEventListener(
    "scroll",
    () => {
      if (activeElement) updateOverlay(activeElement);
    },
    true,
  );
})();
