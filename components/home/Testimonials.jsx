"use client";

import { useEffect, useRef } from "react";
import StarRating from "@/components/ui/StarRating";

const testimonials = [
  {
    name: "Ayesha Khan",
    city: "Karachi",
    rating: 5,
    quote:
      "The fabric is so soft and the sizes are true. My daughter asks to wear her Budy Bear dress every day.",
  },
  {
    name: "Hassan Malik",
    city: "Lahore",
    rating: 5,
    quote:
      "Fast delivery and quality that actually lasts through playtime. We have already placed a second order.",
  },
  {
    name: "Sara Rizvi",
    city: "Islamabad",
    rating: 5,
    quote:
      "Beautiful cuts, cheerful colours, and packaging that felt premium. Checkout on cash on delivery was easy.",
  },
  {
    name: "Bilal Ahmed",
    city: "Hyderabad",
    rating: 4,
    quote:
      "Comfortable tracksuits for my boys and customer care replied quickly on WhatsApp. Highly recommended.",
  },
];

export default function Testimonials() {
  const gridRef = useRef(null);

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll(".testimonial-card");
    if (!cards?.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-brand-cream py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">
            Happy families
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-brand-primary sm:text-4xl">
            What parents are saying
          </h2>
          <p className="mt-3 text-neutral-600">
            Real feedback from families shopping Budy Bear across Pakistan.
          </p>
        </div>

        <div ref={gridRef} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((item, index) => (
            <figure
              key={item.name}
              className="testimonial-card relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-border"
              style={{ "--enter-delay": `${index * 0.14}s` }}
            >
              <div className="testimonial-float relative flex h-full flex-col p-6">
                <span
                  className="testimonial-quote pointer-events-none absolute -right-1 -top-3 select-none font-serif text-7xl leading-none text-brand-accent"
                  aria-hidden="true"
                >
                  “
                </span>
                <StarRating rating={item.rating} size="md" animated />
                <blockquote className="relative mt-4 flex-1 text-sm leading-6 text-neutral-700">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-5">
                  <p className="text-sm font-bold text-brand-primary">{item.name}</p>
                  <p className="text-xs text-neutral-500">{item.city}</p>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
