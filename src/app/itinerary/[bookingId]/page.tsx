import { redirect } from "next/navigation";

// This route is deprecated — itinerary is now managed per TripPackage, not per Booking.
// Redirect all visitors to the main Agenda page.
export default async function DeprecatedItineraryPage() {
  redirect("/agenda");
}
