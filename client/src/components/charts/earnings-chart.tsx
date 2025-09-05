import { useEffect, useRef } from "react";

interface EarningsChartProps {
  data: { label: string; value: number }[];
}

export function EarningsChart({ data }: EarningsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Simple line chart implementation
    const padding = 40;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue || 1;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= data.length - 1; i++) {
      const x = padding + (i * width) / (data.length - 1);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * height) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + width, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = "#FFD700";
    ctx.fillStyle = "rgba(255, 215, 0, 0.1)";
    ctx.lineWidth = 3;

    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding + (index * width) / (data.length - 1);
      const y = padding + height - ((point.value - minValue) / valueRange) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill area under line
    ctx.lineTo(padding + width, padding + height);
    ctx.lineTo(padding, padding + height);
    ctx.closePath();
    ctx.fill();

    // Draw points
    ctx.fillStyle = "#FFD700";
    data.forEach((point, index) => {
      const x = padding + (index * width) / (data.length - 1);
      const y = padding + height - ((point.value - minValue) / valueRange) * height;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = "#666";
    ctx.font = "12px Inter";
    ctx.textAlign = "center";
    
    data.forEach((point, index) => {
      const x = padding + (index * width) / (data.length - 1);
      ctx.fillText(point.label, x, canvas.height - 10);
    });

  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={250}
      className="w-full h-auto"
    />
  );
}
