"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

export default function PriceRangeFilter({
  minBound,
  maxBound,
  minValue,
  maxValue,
  onChange,
}) {
  const [localMin, setLocalMin] = useState(minValue ?? minBound);
  const [localMax, setLocalMax] = useState(maxValue ?? maxBound);

  useEffect(() => {
    setLocalMin(minValue ?? minBound);
    setLocalMax(maxValue ?? maxBound);
  }, [minBound, maxBound, minValue, maxValue]);

  const commit = (nextMin, nextMax) => {
    const clampedMin = Math.min(Math.max(nextMin, minBound), nextMax);
    const clampedMax = Math.max(Math.min(nextMax, maxBound), clampedMin);

    setLocalMin(clampedMin);
    setLocalMax(clampedMax);

    const isDefault = clampedMin === minBound && clampedMax === maxBound;
    onChange({
      priceMin: isDefault ? null : clampedMin,
      priceMax: isDefault ? null : clampedMax,
    });
  };

  const span = Math.max(maxBound - minBound, 1);
  const minPercent = ((localMin - minBound) / span) * 100;
  const maxPercent = ((localMax - minBound) / span) * 100;

  return (
    <div className="space-y-4">
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-neutral-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-primary"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          value={localMin}
          aria-label="Minimum price"
          onChange={(event) => {
            const nextMin = Math.min(Number(event.target.value), localMax);
            setLocalMin(nextMin);
          }}
          onMouseUp={() => commit(localMin, localMax)}
          onTouchEnd={() => commit(localMin, localMax)}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-primary [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-primary"
        />
        <input
          type="range"
          min={minBound}
          max={maxBound}
          value={localMax}
          aria-label="Maximum price"
          onChange={(event) => {
            const nextMax = Math.max(Number(event.target.value), localMin);
            setLocalMax(nextMax);
          }}
          onMouseUp={() => commit(localMin, localMax)}
          onTouchEnd={() => commit(localMin, localMax)}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-accent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-neutral-500">
          Min
          <input
            type="number"
            min={minBound}
            max={localMax}
            value={localMin}
            onChange={(event) => setLocalMin(Number(event.target.value) || minBound)}
            onBlur={() => commit(localMin, localMax)}
            className="mt-1 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
        </label>
        <label className="text-xs font-medium text-neutral-500">
          Max
          <input
            type="number"
            min={localMin}
            max={maxBound}
            value={localMax}
            onChange={(event) => setLocalMax(Number(event.target.value) || maxBound)}
            onBlur={() => commit(localMin, localMax)}
            className="mt-1 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
        </label>
      </div>

      <p className="text-xs text-neutral-500">
        {formatPrice(localMin)} — {formatPrice(localMax)}
      </p>
    </div>
  );
}
