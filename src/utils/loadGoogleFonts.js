// src/utils/loadGoogleFonts.js

export const loadGoogleFonts = (fonts) => {
  const weights = ["100", "400", "700"];
  const styles = ["", "italic"];

  const families = fonts
    .map((f) => {
      const variants = weights
        .map((w) =>
          styles
            .map((s) => `${w}${s}`)
            .join(",")
        )
        .join(",");
      return `${f.family.replace(/\s+/g, "+")}:ital,wght@0,100;0,400;0,700;1,100;1,400;1,700`;
    })
    .join("&family=");

  const href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;

  if (!document.getElementById("google-font-loader")) {
    const link = document.createElement("link");
    link.id = "google-font-loader";
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
};
