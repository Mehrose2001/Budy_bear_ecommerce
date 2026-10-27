"use client";

import { useEffect, useState } from "react";
import { announcementMessages } from "@/data/navigation";
import useInfiniteMarquee from "@/hooks/useInfiniteMarquee";

function buildMessages(announcement) {
  const custom = String(announcement || "").trim();
  const extras = announcementMessages
    .slice(1)
    .filter((message) => message.toLowerCase() !== custom.toLowerCase());
  return custom ? [custom, ...extras] : announcementMessages;
}

function repeatMessages(messages, copies) {
  const items = [];
  for (let copy = 0; copy < copies; copy += 1) {
    messages.forEach((message, index) => {
      items.push({
        message,
        key: `${copy}-${index}`,
        hidden: copy > 0,
      });
    });
  }
  return items;
}

export default function AnnouncementBar({ announcement = "" }) {
  const messages = buildMessages(announcement);
  const [speed, setSpeed] = useState(0.55);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setSpeed(media.matches ? 0.7 : 0.55);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const { viewportRef, trackRef } = useInfiniteMarquee({
    speed,
    pauseOnHover: false,
    draggable: false,
  });

  const half = repeatMessages(messages, 3);
  const loop = half.map((item) => ({
    ...item,
    key: `loop-${item.key}`,
    hidden: true,
  }));

  const renderItems = (items) =>
    items.map((item) => (
      <p
        key={item.key}
        aria-hidden={item.hidden ? true : undefined}
        className="flex shrink-0 items-center px-6 text-xs font-medium tracking-wide sm:text-sm"
      >
        <span
          className="mr-6 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
          aria-hidden="true"
        />
        {item.message}
      </p>
    ));

  return (
    <div className="overflow-hidden bg-brand-primary text-brand-cream">
      <div
        ref={viewportRef}
        className="relative h-9 select-none overflow-hidden"
        style={{ touchAction: "pan-y" }}
      >
        <div ref={trackRef} className="flex h-full w-max items-center will-change-transform">
          <div data-marquee-copy className="flex h-full items-center">
            {renderItems(half)}
          </div>
          <div data-marquee-copy className="flex h-full items-center" aria-hidden="true">
            {renderItems(loop)}
          </div>
        </div>
      </div>
    </div>
  );
}
