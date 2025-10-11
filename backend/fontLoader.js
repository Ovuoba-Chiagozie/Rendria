// fontLoader.js
import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { registerFont } from "canvas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FONT_CACHE_DIR = path.join(__dirname, "fonts-cache");

/**
 * Loads a font from Google Fonts (or local cache) and registers it with node-canvas.
 * Works with any Google Font automatically.  
 *
 * @param {string} family - Font family (e.g., "Roboto", "Source Code Pro").
 * @param {string} [weight="400"] - Font weight (e.g., "400", "700").
 * @param {string} [style="normal"] - Font style (e.g., "normal", "italic").
 */
export async function loadGoogleFont(family, weight = "400", style = "normal") {
  await fs.ensureDir(FONT_CACHE_DIR);

  const fileSafeName = `${family}-${weight}-${style}.ttf`.replace(/\s+/g, "-");
  const fontPath = path.join(FONT_CACHE_DIR, fileSafeName);

  // 1️⃣ Try to load from cache first
  if (await fs.pathExists(fontPath)) {
    try {
      registerFont(fontPath, { family, weight, style });
      console.log(`✅ Loaded from cache: ${family} (${weight}, ${style})`);
      return;
    } catch (err) {
      console.log(`⚠️ Cached font corrupted for ${family}, re-downloading...`);
      await fs.remove(fontPath); // delete broken cache file
    }
  }

  // 2️⃣ Download fresh from Google Fonts
  try {
    let cssUrl;
    if (style === "italic") {
      cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
        family
      )}:ital,wght@1,${weight}&display=swap`;
    } else {
      cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
        family
      )}:wght@${weight}&display=swap`;
    }

    const cssRes = await axios.get(cssUrl, {
      responseType: "text",
      headers: { "User-Agent": "Mozilla/5.0" }, // required to avoid 403
    });

    // Extract @font-face blocks
    const regex = /@font-face\s*{[^}]+}/g;
    const matches = cssRes.data.match(regex) || [];

    let fontFileUrl = null;
    for (const block of matches) {
      if (
        block.includes(`font-style: ${style}`) &&
        block.includes(`font-weight: ${weight}`)
      ) {
        const urlMatch = block.match(/url\((https:[^)]+)\)/);
        if (urlMatch) {
          fontFileUrl = urlMatch[1];
          break;
        }
      }
    }

    console.log({ fontFileUrl });

    if (!fontFileUrl) {
      throw new Error(
        `No matching font URL found for ${family} (${weight}, ${style})`
      );
    }

    // Download font binary
    const fontRes = await axios.get(fontFileUrl, {
      responseType: "arraybuffer",
    });
    await fs.writeFile(fontPath, fontRes.data);

    // Register it
    registerFont(fontPath, { family, weight, style });
    console.log(`⬇️ Downloaded & cached: ${family} (${weight}, ${style})`);
  } catch (err) {
    console.warn(`⚠️ Could not load font ${family}: ${err.message}`);
  }
}
