export type EventStatus = "live" | "upcoming" | "past";

export type EventRecord = {
  slug: string;
  title: string;
  venue: string;
  neighborhood: string;
  date: string;
  status: EventStatus;
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
    status: "live",
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
    status: "live",
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
    status: "live",
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
    status: "live",
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
    status: "live",
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
    description:
      "A cultural market for Atlanta art, food, and energy. Gallery opens when the first frames land.",
    photoCount: 0,
    image: "/events/welcome-atl.jpg",
    code: "ATL-WELCOME",
  },
];

export function getEvent(slug: string) {
  return events.find((event) => event.slug === slug);
}

export function getEventByCode(raw: string) {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return undefined;
  return events.find((event) => event.code === code);
}
