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

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((item) => (
            <figure
              key={item.name}
              className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-border"
            >
              <StarRating rating={item.rating} size="md" />
              <blockquote className="mt-4 flex-1 text-sm leading-6 text-neutral-700">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-5">
                <p className="text-sm font-bold text-brand-primary">{item.name}</p>
                <p className="text-xs text-neutral-500">{item.city}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
