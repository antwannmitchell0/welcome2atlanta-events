export const neighborhoods = [
  "Midtown",
  "Old Fourth Ward",
  "East Atlanta",
  "The BeltLine",
  "Buckhead",
  "Castleberry Hill",
  "SWATS",
  "Little Five",
  "West End",
  "Peachtree",
] as const;

/** Existing site neighborhoods for organizer booking. Downtown already appears on demo events. */
export const bookingNeighborhoods = [...neighborhoods, "Downtown"] as const;

export type BookingNeighborhood = (typeof bookingNeighborhoods)[number];

export function isBookingNeighborhood(value: string): value is BookingNeighborhood {
  return (bookingNeighborhoods as readonly string[]).includes(value);
}

export const reelFrames = [
  { src: "/reel/skyline.jpg", place: "Downtown", caption: "The A after dark" },
  { src: "/reel/concert.jpg", place: "The venue", caption: "Hands up, lights down" },
  { src: "/reel/beltline.jpg", place: "The BeltLine", caption: "Golden hour on the Eastside" },
  { src: "/reel/lounge.jpg", place: "Midtown", caption: "After-hours, no recap needed" },
  { src: "/reel/cookout.jpg", place: "SWATS", caption: "The yard. The smoke. The people." },
  { src: "/reel/peachtree.jpg", place: "Peachtree", caption: "The walk is the show" },
  { src: "/reel/stadium.jpg", place: "Downtown", caption: "Game night in the city" },
  { src: "/reel/jazz.jpg", place: "Old Fourth Ward", caption: "Soul in the Fourth" },
] as const;
