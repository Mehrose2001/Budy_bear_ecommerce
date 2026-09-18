"use client";

import { announcementMessages } from "@/data/navigation";

export default function AnnouncementBar() {
  const track = [...announcementMessages, ...announcementMessages];

  return (
    <div className="overflow-hidden bg-brand-primary text-brand-cream">
      <div className="flex h-9 items-center">
        <div className="flex w-max animate-announcement-marquee items-center hover:[animation-play-state:paused]">
          {track.map((message, index) => (
            <p
              key={`${message}-${index}`}
              className="flex shrink-0 items-center px-6 text-xs font-medium tracking-wide sm:text-sm"
            >
              <span className="mr-6 inline-block h-1.5 w-1.5 rounded-full bg-brand-accent" aria-hidden="true" />
              {message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
