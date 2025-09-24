// renderStarRating.js (drop into your utils / services folder)
export function renderStarRating(el = {}) {
    const {
      maxRating = 5,
      rating = 0,
      spacing = 2,
      colors = {},
      x = 0,
      y = 0,
      width = 200,
      height = 40,
      rotation = 0,
      id,
    } = el;
  
    const fillColor = colors.fill ?? "#FFD700";
    const emptyColor = colors.empty ?? "rgba(220, 166, 166, 1)";
    const borderColor = colors.border ?? "#000000";
  
    // clamp & sanitize
    const maxR = Math.max(1, Math.floor(maxRating));
    const rat = Math.min(Math.max(0, Math.floor(rating)), maxR);
  
    // compute star size (same logic as frontend)
    const totalSpacing = spacing * (maxR - 1);
    const availableWidth = Math.max(0, width - totalSpacing);
    const starSize = Math.max(1, Math.min(availableWidth / maxR, height));
  
    // original star path is 24x24, so scale by starSize/24
    const base = 24;
    const scale = starSize / base;
    const offsetY = (height - starSize) / 2;
  
    // star path provided by you
    const starPath = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
  
    // build stars groups
    let stars = "";
    for (let i = 0; i < maxR; i++) {
      const isFilled = i < rat;
      const fill = isFilled ? fillColor : emptyColor;
  
      // x position for this star (in unscaled px inside svg coordinates)
      const tx = i * (starSize + spacing);
  
  
      stars += `
        <g transform="translate(${tx.toFixed(3)}, ${offsetY.toFixed(3)}) scale(${scale.toFixed(6)})">
          <path d="${starPath}" fill="${fill}" stroke="${borderColor}" />
        </g>
      `;
    }
  
    // SVG container sized to the element bounding box
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${width}"
           height="${height}"
           viewBox="0 0 ${width} ${height}"
           preserveAspectRatio="xMinYMin meet">
        ${stars}
      </svg>
    `;
  
    // wrapper div positions and rotates the whole block exactly like your editor
    const html = `
      <div  style="
        position:absolute;
        left:${x}px;
        top:${y}px;
        width:${width}px;
        height:${height}px;
        transform: rotate(${rotation}deg);
        transform-origin: center;
        background-color: transparent;
        box-sizing: border-box;
        overflow: visible;
      ">
        ${svg}
      </div>
    `;
  
    return html;
  }
  