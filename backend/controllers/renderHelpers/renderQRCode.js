import QRCode from "qrcode-generator";

export function renderQRCode(el) {
    const {
      value,
      x,
      y,
      width,
      height,
      borderWidth,
      borderColor,
      rotation,
    } = el;
  
    // Generate QR code
    const qr = QRCode(0, "L"); // typeNumber=0 (auto), error correction L
    qr.addData(value || "");
    qr.make();
  
    // Get raw SVG
    const svgTag = qr.createSvgTag({
      scalable: true,
      margin: 0,
    });
  
    // Scale it to fit el.width x el.height
    const qrSVG = svgTag.replace(
      "<svg ",
      `<svg width="${Math.min(width, height)}" height="${Math.min(width, height)}" `
    );
  
    return `
      <div style="
        position:absolute;
        left:${x}px; top:${y}px;
        width:${width}px; height:${height}px;
        border:${borderWidth || 0}px solid ${borderColor || "transparent"};
        transform: rotate(${rotation}deg);
        transform-origin: center;
        display:flex;
        align-items:center;
        justify-content:center;
        background-color: transparent;
        box-sizing: border-box;
      ">
        ${qrSVG}
      </div>
    `;
  }