import { Slider, IconButton } from "@mui/material";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";


export default function ZoomControl({ zoom, setZoom, min = 0.2, max = 2, step = 0.01 }) {
  const zoomMV = useMotionValue(zoom);
  
  // Sync motion value back to React state smoothly
  useEffect(() => {
    const controls = animate(zoomMV, zoom, { type: "spring", stiffness: 200 });
    return () => controls.stop();
  }, [zoom, zoomMV]);

  // Optional: Create a transformed value if derived UI markings are needed
  const displayZoom = useTransform(zoomMV, (v) => Math.round(v * 100));

  return (
    <motion.div
      style={{
        position: "absolute",
        bottom: 20,
        right: -200,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        background: "rgba(255,255,255,0.9)",
        borderRadius: 4,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <div
        // size="small"
        onClick={() => setZoom((z) => Math.max(min, z - step))}
        className="cursor-pointer text-2xl"
      >
       -
      </div>

      <Slider
        size="small"
        value={zoom * 100}
        onChange={(e, val) => setZoom(val / 100)}
        valueLabelDisplay="auto"
        min={min * 100}
        max={max * 100}
        step={step * 100}
        style={{ width: 120, margin: "0 8px" }}
      />

      <div
        // size="small"
        onClick={() => setZoom((z) => Math.min(max, z + step))}
        className="cursor-pointer text-2xl"
      >
       +
      </div>
    </motion.div>
  );
}
