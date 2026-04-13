"use client";

import { RefObject, useState } from "react";
import { Button } from "../ui/button";
import { DownloadIcon, LoaderCircleIcon } from "lucide-react";

interface DownloadChartProps {
  containerRef: RefObject<HTMLDivElement | null>;
  fileName?: string;
  className?: string;
}

function buildResolveSvg(svgEl: SVGSVGElement): SVGSVGElement {
  const { width, height } = svgEl.getBoundingClientRect();
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  const originals = Array.from(svgEl.querySelectorAll("*"));
  const clones = Array.from(clone.querySelectorAll("*"));

  const PROPS = [
    "fill",
    "stroke",
    "fill-opacity",
    "stroke-opacity",
    "stroke-width",
    "font-size",
    "font-family",
    "text-anchor",
    "dominant-baseline",
  ];

  originals.forEach((orig, i) => {
    const computed = window.getComputedStyle(orig);
    PROPS.forEach((prop) => {
      const val = computed.getPropertyValue(prop);
      if (val) clones[i].setAttribute(prop, val);
    });
  });

  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return clone;
}

export default function DownloadChart({
  containerRef,
  fileName = "chart",
  className,
}: DownloadChartProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    const container = containerRef.current;
    if (!container) return;

    const svg = container.querySelector("svg");
    if (!svg) return;

    setLoading(true);

    const resolvedSvg = buildResolveSvg(svg as SVGSVGElement);
    const { width, height } = svg.getBoundingClientRect();

    const svgBlob = new Blob(
      [new XMLSerializer().serializeToString(resolvedSvg)],
      { type: "image/svg+xml;charset=utf-8" },
    );
    const svgUrl = URL.createObjectURL(svgBlob);

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);

      const a = document.createElement("a");
      a.download = `${fileName}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      setLoading(false);
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      setLoading(false);
    };

    img.src = svgUrl;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <LoaderCircleIcon className="h-4 w-4 animate-spin" />
      ) : (
        <DownloadIcon className="h-4 w-4" />
      )}
      {loading ? "Downloading..." : "Download"}
    </Button>
  );
}
