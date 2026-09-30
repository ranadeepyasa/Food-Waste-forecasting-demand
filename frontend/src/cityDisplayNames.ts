/**
 * Frontend display-only mapping for fulfillment center cities.
 *
 * IMPORTANT:
 * - This mapping is used for USER INTERFACE DISPLAY ONLY.
 * - The original dataset, backend API, and ML pipeline strictly continue using
 *   the internal numeric city_code values.
 * - If a city code is not present in this dictionary, getCityDisplayName()
 *   falls back to "City [code]" (e.g. "City 590") rather than inventing an unverified name.
 */

export const cityDisplayNames: Record<number, string> = {
  // Region 56 - Western Logistics Hubs
  590: "Mumbai",
  679: "Pune",
  654: "Ahmedabad",
  517: "Surat",
  522: "Vadodara",
  604: "Nagpur",
  638: "Nashik",
  647: "Rajkot",
  577: "Thane",
  579: "Aurangabad",
  456: "Navi Mumbai",
  599: "Solapur",
  683: "Kolhapur",
  685: "Bhavnagar",
  700: "Jamnagar",
  703: "Gandhinagar",

  // Region 34 - Northern Logistics Hubs
  526: "Delhi NCR",
  576: "Jaipur",
  676: "Lucknow",
  648: "Chandigarh",
  615: "Gurugram",
  602: "Noida",
  632: "Kanpur",
  649: "Agra",
  658: "Varanasi",
  675: "Ghaziabad",
  693: "Faridabad",
  461: "Amritsar",

  // Region 85 - Southern Logistics Hubs
  614: "Bengaluru",
  699: "Hyderabad",
  713: "Chennai",

  // Region 77 - Eastern Logistics Hubs
  593: "Kolkata",
  515: "Bhubaneswar",
  473: "Patna",
  478: "Ranchi",
  485: "Guwahati",
  541: "Cuttack",
  553: "Jamshedpur",
  556: "Asansol",
  561: "Siliguri",
  562: "Dhanbad",
  620: "Raipur",
  628: "Durgapur",
  651: "Bhilai",
  659: "Rourkela",
  680: "Gaya",
  695: "Bokaro",

  // Additional Regional Logistics Hubs
  698: "Indore",        // Region 23
  596: "Bhopal",        // Region 71
  609: "Kochi",         // Region 93
  702: "Coimbatore"     // Region 35
};

/**
 * Returns human-readable display name for a city code.
 * Falls back to "City [code]" if not available in mapping.
 */
export function getCityDisplayName(cityCode: number): string {
  return cityDisplayNames[cityCode] || `City ${cityCode}`;
}
