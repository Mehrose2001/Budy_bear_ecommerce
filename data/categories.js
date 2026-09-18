export const categories = [
  {
    id: "boys",
    name: "Boys",
    slug: "boys",
    description: "Stylish and comfortable clothing for boys.",
    image: "/images/categories/boys.svg",
    subcategories: [
      "t-shirts",
      "shirts",
      "pants",
      "shorts",
      "tracksuits",
      "jackets",
    ],
  },
  {
    id: "girls",
    name: "Girls",
    slug: "girls",
    description: "Trendy outfits and essentials for girls.",
    image: "/images/categories/girls.svg",
    subcategories: [
      "tops",
      "dresses",
      "frocks",
      "pants",
      "skirts",
      "jackets",
    ],
  },
  {
    id: "baby",
    name: "Baby",
    slug: "baby",
    description: "Soft and safe products for your little ones.",
    image: "/images/categories/baby.svg",
    subcategories: [
      "newborn",
      "baby-boys",
      "baby-girls",
      "rompers",
      "baby-sets",
    ],
  },
  {
    id: "accessories",
    name: "Accessories",
    slug: "accessories",
    description: "Caps, bags, socks and more.",
    image: "/images/categories/accessories.svg",
    subcategories: ["caps", "bags", "socks", "hair-accessories", "watches"],
  },
  {
    id: "gifts",
    name: "Gifts",
    slug: "gifts",
    description: "Perfect gift ideas for every occasion.",
    image: "/images/categories/gifts.svg",
    subcategories: ["gift-sets", "personalized", "occasion-gifts"],
  },
];

export function getCategoryBySlug(slug) {
  return categories.find((category) => category.slug === slug);
}
