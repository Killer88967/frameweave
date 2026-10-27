(() => {
  const parameters = new URLSearchParams(window.location.search);

  if (!parameters.has("__frameweave") || window.parent === window) return;

  // Tags that show up in the component tree even though they are not
  // components, so the tree reads like the page structure (App > Main > Card).
  const LANDMARKS = new Set([
    "header",
    "nav",
    "main",
    "section",
    "article",
    "aside",
    "footer",
    "form",
    "dialog",
  ]);

  const hoverOverlay = createOverlay("1px dashed #7c3aed", "transparent");
  const selectionOverlay = createOverlay(
    "2px solid #7c3aed",
    "rgb(124 58 237 / 8%)",
  );

  // Stable ids for tree nodes so the host can ask for "select node 12".
  const elementIds = new WeakMap();
  const elementsById = new Map();
  let nextId = 1;

  let hoveredElement = null;
  let selectedElement = null;

  function createOverlay(border, background) {
    const overlay = document.createElement("div");

    Object.assign(overlay.style, {
      position: "fixed",
      zIndex: "2147483647",
      pointerEvents: "none",
      display: "none",
      border,
      background,
      boxShadow: "0 0 0 1px rgb(255 255 255 / 70%)",
    });

    document.documentElement.append(overlay);

    return overlay;
  }

  function placeOverlay(overlay, element) {
    if (!element || !element.isConnected) {
      overlay.style.display = "none";
      return;
    }

    const rectangle = element.getBoundingClientRect();

    Object.assign(overlay.style, {
      display: "block",
      top: `${rectangle.top}px`,
      left: `${rectangle.left}px`,
      width: `${rectangle.width}px`,
      height: `${rectangle.height}px`,
    });
  }

  function idFor(element) {
    let id = elementIds.get(element);

    if (id === undefined) {
      id = nextId++;
      elementIds.set(element, id);
    }

    elementsById.set(id, element);

    return id;
  }

  // Set by @frameweave/next in dev: "<absolute file>:<line>:<column>".
  // Elements rendered by node_modules have no stamp, so fall back to the
  // nearest ancestor that came from the app's own source.
  function readSourceLocation(element) {
    const value = element.closest("[data-fw-loc]")?.getAttribute("data-fw-loc");
    const match = value?.match(/^(.*):(\d+):(\d+)$/);

    if (!match) return null;

    return {
      filePath: match[1],
      line: Number(match[2]),
      column: Number(match[3]),
    };
  }

  // ---- Component tree -----------------------------------------------------

  function buildTree() {
    elementsById.clear();

    const roots = [];

    // Start above <body> so a root layout that renders <body> shows up too.
    walk(document.documentElement, roots, null);

    return roots;
  }

  function walk(element, siblings, parentOwner) {
    for (const child of element.children) {
      if (child === hoverOverlay || child === selectionOverlay) continue;
      if (["HEAD", "SCRIPT", "STYLE"].includes(child.tagName)) continue;

      const owner = child.getAttribute("data-fw-owner");
      const tag = child.tagName.toLowerCase();
      const startsComponent = owner !== null && owner !== parentOwner;
      const isLandmark = LANDMARKS.has(tag);

      let children = siblings;

      if (startsComponent) {
        const node = {
          id: idFor(child),
          label: owner,
          kind: "component",
          children: [],
        };

        siblings.push(node);
        children = node.children;
      }

      if (isLandmark) {
        const node = {
          id: idFor(child),
          label: tag,
          kind: "element",
          children: [],
        };

        children.push(node);
        children = node.children;
      }

      walk(child, children, owner ?? parentOwner);
    }
  }

  // The tree node an element belongs to: itself or its closest ancestor
  // that appears in the tree.
  function treeNodeIdFor(element) {
    for (let current = element; current; current = current.parentElement) {
      const id = elementIds.get(current);

      if (id !== undefined && elementsById.get(id) === current) return id;
    }

    return null;
  }

  let treeTimer = 0;

  function sendTree() {
    clearTimeout(treeTimer);

    treeTimer = setTimeout(() => {
      window.parent.postMessage(
        {
          source: "frameweave-preview",
          type: "tree-updated",
          payload: buildTree(),
        },
        "*",
      );

      placeOverlay(selectionOverlay, selectedElement);
    }, 150);
  }

  new MutationObserver(sendTree).observe(document.body, {
    childList: true,
    subtree: true,
  });

  // ---- Selection ------------------------------------------------------------

  function selectElement(element) {
    selectedElement = element;
    placeOverlay(selectionOverlay, element);

    const rectangle = element.getBoundingClientRect();
    const styles = getComputedStyle(element);

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
            [...element.attributes]
              .filter((attribute) => !attribute.name.startsWith("data-fw-"))
              .map((attribute) => [attribute.name, attribute.value]),
          ),
          sourceLocation: readSourceLocation(element),
          nodeId: treeNodeIdFor(element),
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
            margin: styles.margin,
            gap: styles.gap,
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            lineHeight: styles.lineHeight,
            textAlign: styles.textAlign,
          },
        },
      },
      "*",
    );
  }

  document.addEventListener(
    "pointerover",
    (event) => {
      if (!(event.target instanceof Element)) return;

      hoveredElement = event.target;
      placeOverlay(hoverOverlay, hoveredElement);
    },
    true,
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) return;

      event.preventDefault();
      event.stopPropagation();

      selectElement(event.target);
    },
    true,
  );

  // Messages from the Frameweave designer.
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;

    const message = event.data;

    if (message?.source !== "frameweave-host") return;

    if (message.type === "request-tree") sendTree();

    if (message.type === "select-node") {
      const element = elementsById.get(message.id);

      if (!element?.isConnected) return;

      element.scrollIntoView({ block: "nearest", inline: "nearest" });
      selectElement(element);
    }

    if (message.type === "hover-node") {
      placeOverlay(hoverOverlay, elementsById.get(message.id) ?? null);
    }
  });

  const reposition = () => {
    placeOverlay(hoverOverlay, hoveredElement);
    placeOverlay(selectionOverlay, selectedElement);
  };

  window.addEventListener("resize", reposition);
  window.addEventListener("scroll", reposition, true);

  sendTree();
})();
