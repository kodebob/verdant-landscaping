export const CITIES = [
  "Pittsburgh, PA", "Philadelphia, PA", "Columbus, OH", "Cleveland, OH",
  "Cincinnati, OH", "Indianapolis, IN", "Detroit, MI", "Milwaukee, WI",
  "Minneapolis, MN", "St. Louis, MO", "Kansas City, MO", "Nashville, TN",
  "Louisville, KY", "Memphis, TN", "Atlanta, GA", "Charlotte, NC",
  "Raleigh, NC", "Richmond, VA", "Baltimore, MD", "Buffalo, NY",
  "Rochester, NY", "Hartford, CT", "Providence, RI", "Albany, NY",
  "Allentown, PA", "Scranton, PA", "Akron, OH", "Dayton, OH",
  "Toledo, OH", "Grand Rapids, MI", "Lansing, MI", "Madison, WI",
  "Green Bay, WI", "Des Moines, IA", "Omaha, NE", "Wichita, KS",
  "Tulsa, OK", "Oklahoma City, OK", "Little Rock, AR", "Birmingham, AL",
  "Huntsville, AL", "Jackson, MS", "Columbia, SC", "Greenville, SC",
  "Winston-Salem, NC", "Durham, NC", "Greensboro, NC", "Knoxville, TN",
  "Chattanooga, TN", "Lexington, KY", "Baton Rouge, LA", "Shreveport, LA",
  "Mobile, AL", "Augusta, GA", "Savannah, GA", "Springfield, MO",
  "Fort Wayne, IN", "Evansville, IN", "South Bend, IN", "Peoria, IL",
  "Rockford, IL", "Springfield, IL", "Syracuse, NY", "Utica, NY",
];

export const NICHES = [
  "hardscape", "landscaping", "pressure washing", "painting",
  "plumbing", "electrician", "lawn care", "fence installation",
  "concrete contractor", "personal trainer", "roofing", "tree service",
];

export function getTodaysRotation(): { niche: string; city: string } {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return {
    niche: NICHES[dayOfYear % NICHES.length],
    city:  CITIES[dayOfYear % CITIES.length],
  };
}

// Pick a niche/city pair that hasn't been used recently (last 7 days)
export function getRotationForDay(offsetDays = 0): { niche: string; city: string } {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const day = Math.floor((Date.now() - start) / 86_400_000) + offsetDays;
  return {
    niche: NICHES[day % NICHES.length],
    city:  CITIES[day % CITIES.length],
  };
}
