export type EventStatus = "live" | "upcoming" | "past";

export type EventCategory =
  | "Nightlife"
  | "Music"
  | "Festivals"
  | "Food"
  | "Networking"
  | "Business"
  | "Community"
  | "Culture"
  | "Sports";

export type EventRecord = {
  slug: string;
  title: string;
  venue: string;
  neighborhood: string;
  date: string;
  time?: string;
  status: EventStatus;
  category: EventCategory;
  description: string;
  photoCount: number;
  image: string;
  code: string;
};

export const events: EventRecord[] = [
  {
    slug: "404-after-dark",
    title: "404 After Dark",
    venue: "Midtown Lounge Circuit",
    neighborhood: "Midtown",
    date: "Tonight",
    time: "10:00 PM",
    status: "live",
    category: "Nightlife",
    description:
      "The rooms that make Atlanta Atlanta. Champagne lighting, the DJ who knows the city, and the after-hours that never make the group chat until the photos drop.",
    photoCount: 968,
    image: "/events/404-after-dark.jpg",
    code: "ATL-404",
  },
  {
    slug: "o4w-jazz",
    title: "Soul in the Fourth",
    venue: "Old Fourth Ward",
    neighborhood: "Old Fourth Ward",
    date: "This weekend",
    time: "8:00 PM",
    status: "live",
    category: "Music",
    description:
      "Intimate jazz, date-night energy, and the kind of night the Fourth Ward still talks about on Sunday.",
    photoCount: 412,
    image: "/events/o4w-jazz.jpg",
    code: "ATL-O4W",
  },
  {
    slug: "beltline-sunset",
    title: "BeltLine Sunset Session",
    venue: "Eastside Trail",
    neighborhood: "The BeltLine",
    date: "Saturday",
    time: "6:30 PM",
    status: "live",
    category: "Culture",
    description:
      "Golden hour on the trail. Murals, music, and the walk that turns into the night.",
    photoCount: 734,
    image: "/events/beltline.jpg",
    code: "ATL-BELT",
  },
  {
    slug: "invest-fest",
    title: "Invest Fest Atlanta",
    venue: "Georgia World Congress Center",
    neighborhood: "Downtown",
    date: "August 22–24, 2026",
    time: "All day",
    status: "live",
    category: "Business",
    description:
      "Black wealth in the building. Keynotes, rooms that actually move, and the after-hours that people still talk about.",
    photoCount: 1847,
    image: "/events/invest-fest.jpg",
    code: "ATL-INVEST",
  },
  {
    slug: "wtae-launch",
    title: "WTAE Launch Rehearsal",
    venue: "Midtown Atlanta",
    neighborhood: "Midtown",
    date: "August 22, 2026",
    time: "7:00 PM",
    status: "live",
    category: "Community",
    description:
      "Behind the scenes as Welcome to Atlanta Events lights the next coverage night.",
    photoCount: 312,
    image: "/events/wtae-launch.jpg",
    code: "ATL-WTAE",
  },
  {
    slug: "welcome-atl",
    title: "Welcome to ATL Experience",
    venue: "Centennial Yards",
    neighborhood: "Downtown",
    date: "Coming soon",
    status: "upcoming",
    category: "Festivals",
    description:
      "A cultural market for Atlanta art, food, and energy. Gallery opens when the first frames land.",
    photoCount: 0,
    image: "/events/welcome-atl.jpg",
    code: "ATL-WELCOME",
  },
];

export const categoryArt: Record<EventCategory, string> = {
  Nightlife: "/reel/lounge.jpg",
  Music: "/reel/concert.jpg",
  Festivals: "/reel/stadium.jpg",
  Food: "/reel/cookout.jpg",
  Networking: "/events/invest-fest.jpg",
  Business: "/events/invest-fest.jpg",
  Community: "/reel/peachtree.jpg",
  Culture: "/reel/beltline.jpg",
  Sports: "/reel/stadium.jpg",
};

export function categoriesInUse() {
  const used = new Set(events.map((event) => event.category));
  return (Object.keys(categoryArt) as EventCategory[]).filter((category) => used.has(category));
}

export function getEvent(slug: string) {
  return events.find((event) => event.slug === slug);
}

export function getEventByCode(raw: string) {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return undefined;
  return events.find((event) => event.code === code);
}

export function liveEvents() {
  return events.filter((event) => event.status === "live");
}

export function weekendEvents() {
  return events.filter((event) => /tonight|weekend|saturday|sunday/i.test(event.date));
}

export function relatedEvents(slug: string) {
  const current = getEvent(slug);
  if (!current) return [];
  return events
    .filter(
      (event) =>
        event.slug !== slug &&
        (event.neighborhood === current.neighborhood || event.category === current.category),
    )
    .slice(0, 3);
}
