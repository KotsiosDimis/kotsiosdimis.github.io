function renderBarbell(mountSelector) {
  const mount = document.querySelector(mountSelector);
  if (!mount) return;

  mount.innerHTML = `
    <svg viewBox="0 0 1100 420" role="img" aria-label="2D IPF barbell" class="barbell-svg">
      <defs>
        <linearGradient id="steelGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e4e7ee"/>
          <stop offset="1" stop-color="#8b92a0"/>
        </linearGradient>
        <linearGradient id="steelGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d7dbe3"/>
          <stop offset="1" stop-color="#757c8b"/>
        </linearGradient>
      </defs>

      <!-- floor stays fixed -->
      <line class="floor" x1="80" y1="330" x2="1020" y2="330"></line>

      <!-- only this moves on hover -->
      <g id="move" tabindex="0">
        <g id="barLayer"></g>
        <g id="plateLayer"></g>
        <g id="detailLayer"></g>
        <text class="label" x="550" y="385" text-anchor="middle"></text>
      </g>
    </svg>
  `;

  // Inject component-specific CSS once
  if (!document.getElementById("barbell-component-styles")) {
    const style = document.createElement("style");
    style.id = "barbell-component-styles";
    style.textContent = `
      .barbell-svg{ width:100%; height:100%; display:block; }
      .floor{ stroke: rgba(255,255,255,.12); stroke-width:2; }
      #move{
        cursor:pointer;
        transition: transform 220ms ease, filter 220ms ease;
        will-change: transform;
        outline:none;
      }
      #move:hover, #move:focus-visible{
        transform: translateY(-6px) rotate(-0.6deg);
        filter: drop-shadow(0 14px 26px rgba(0,0,0,.45));
      }
      #move:focus-visible{
        outline: 2px solid rgba(255,255,255,.18);
        outline-offset: 10px;
        border-radius: 16px;
      }

      .bar{ fill: url(#steelGrad); }
      .sleeve{ fill: url(#steelGrad2); }

      .plate{ rx:10; ry:10; }
      .red{ fill:#d3252a; }
      .yellow{ fill:#f0c419; }
      .black{ fill:#101114; }
      .grey{ fill:#7b808a; }

      .collar{ fill: rgba(255,255,255,.18); stroke: rgba(255,255,255,.22); stroke-width:2; rx:8; ry:8; }
      .rim{ fill: rgba(255,255,255,.10); }
      .hubOuter{ fill: rgba(255,255,255,.12); }
      .hubInner{ fill: rgba(0,0,0,.20); }

      .label{
        font: 600 14px system-ui, -apple-system, Segoe UI, Roboto, Arial;
        fill: rgba(255,255,255,.70);
        letter-spacing:.2px;
      }
    `;
    document.head.appendChild(style);
  }

  // ----- Drawing logic (exact specs) -----
  const BAR_TOTAL_MM = 2200;
  const SLEEVE_MM = 433;

  const svgW = 1100;
  const usableW = 900;
  const mmToPx = usableW / BAR_TOTAL_MM;

  const floorY = 330;
  const barCenterY = 230; // gym-bar alignment (all plates centered on bar)

  const barStartX = (svgW - usableW) / 2;
  const barEndX = barStartX + usableW;

  const leftSleeveEndX = barStartX + (SLEEVE_MM * mmToPx);
  const rightSleeveStartX = barEndX - (SLEEVE_MM * mmToPx);

  const shaftStartX = leftSleeveEndX;
  const shaftEndX = rightSleeveStartX;

  const barThicknessPx = 12;
  const sleeveThicknessPx = 20;

  // EXACT ELEIKO IPF SPECS you provided
  const THICKNESS_MM = {
    25: 27,
    15: 19,     // 15kg: height 19mm
    2.5: 15,    // 2.5kg: height 15mm
    1.25: 12,   // 1.25kg: height 12mm
    collar: 140 // collar length 140mm (acts like thickness on sleeve in side view)
  };

  const DIAMETER_MM = {
    25: 450,
    15: 400,
    2.5: 190,
    1.25: 160,
    collar: 60  // collar height 60mm
  };

  // Per-side INSIDE -> OUTSIDE
  const perSide = [
    { kg: 25, cls: "red" },
    { kg: 25, cls: "red" },
    { kg: 25, cls: "red" },
    { kg: 25, cls: "red" },
    { kg: 15, cls: "yellow" },
    { kg: 2.5, cls: "black" },
    { kg: 1.25, cls: "grey" },
    { kg: "collar", cls: "collar" }
  ];

  const NS = "http://www.w3.org/2000/svg";
  const barLayer = mount.querySelector("#barLayer");
  const plateLayer = mount.querySelector("#plateLayer");
  const detailLayer = mount.querySelector("#detailLayer");

  function rect(parent, x, y, w, h, cls){
    const r = document.createElementNS(NS, "rect");
    r.setAttribute("x", x);
    r.setAttribute("y", y);
    r.setAttribute("width", w);
    r.setAttribute("height", h);
    r.setAttribute("class", cls);
    parent.appendChild(r);
    return r;
  }

  function circle(parent, cx, cy, r, cls){
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", cx);
    c.setAttribute("cy", cy);
    c.setAttribute("r", r);
    c.setAttribute("class", cls);
    parent.appendChild(c);
    return c;
  }

  function clear(el){ el.innerHTML = ""; }

  function drawBar(){
    // shaft behind
    rect(barLayer, shaftStartX, barCenterY - barThicknessPx/2, shaftEndX - shaftStartX, barThicknessPx, "bar");

    // sleeves behind
    rect(barLayer, barStartX, barCenterY - sleeveThicknessPx/2, leftSleeveEndX - barStartX, sleeveThicknessPx, "sleeve");
    rect(barLayer, rightSleeveStartX, barCenterY - sleeveThicknessPx/2, barEndX - rightSleeveStartX, sleeveThicknessPx, "sleeve");

    // shoulder rings
    const ringW = 8;
    rect(barLayer, leftSleeveEndX - ringW, barCenterY - sleeveThicknessPx/2, ringW, sleeveThicknessPx, "bar");
    rect(barLayer, rightSleeveStartX,       barCenterY - sleeveThicknessPx/2, ringW, sleeveThicknessPx, "bar");
  }

  function drawStack(side){
    let xCursor = (side === "left") ? leftSleeveEndX : rightSleeveStartX;
    const dir = (side === "left") ? -1 : 1;

    for (const item of perSide){
      const w = THICKNESS_MM[item.kg] * mmToPx;
      const h = DIAMETER_MM[item.kg] * mmToPx;

      const x = xCursor + (dir === 1 ? 0 : -w);
      const y = barCenterY - (h / 2);

      // body
      if (item.kg === "collar") {
        rect(plateLayer, x, y, w, h, `collar ${item.cls}`);
      } else {
        rect(plateLayer, x, y, w, h, `plate ${item.cls}`);
      }

      // details centered
      const cx = x + w/2;
      const cy = y + h/2;

      if (item.kg !== "collar"){
        rect(detailLayer, x + w*0.12, y + h*0.04, w*0.76, h*0.12, "rim");
        const hubR = Math.min(w, h) * 0.13;
        circle(detailLayer, cx, cy, hubR, "hubOuter");
        circle(detailLayer, cx, cy, hubR*0.55, "hubInner");
      } else {
        circle(detailLayer, cx, cy, Math.min(w, h) * 0.22, "hubOuter");
        circle(detailLayer, cx, cy, Math.min(w, h) * 0.10, "hubInner");
      }

      xCursor += dir * w;
    }
  }

  // Render
  clear(barLayer); clear(plateLayer); clear(detailLayer);
  drawBar();
  drawStack("left");
  drawStack("right");
}