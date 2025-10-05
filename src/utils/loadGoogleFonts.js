// src/utils/loadGoogleFonts.js

export const loadGoogleFonts = (fonts) => {
  if (!Array.isArray(fonts) || fonts.length === 0) return;

  // ✅ Remove any non-Google fonts (e.g., "Georgia")
  const googleSafeFonts = fonts.filter(
    (f) => f.family.toLowerCase() !== "georgia"
  );

  const chunkSize = 8; // keep URL length safe (Google recommends ≤10)
  for (let i = 0; i < googleSafeFonts.length; i += chunkSize) {
    const families = googleSafeFonts
      .slice(i, i + chunkSize)
      .map(
        (f) =>
          `${f.family.replace(
            /\s+/g,
            "+"
          )}:ital,wght@0,100;0,400;0,700;1,100;1,400;1,700`
      )
      .join("&family=");

    const href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;

    // Prevent duplicates if called multiple times
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }
};
