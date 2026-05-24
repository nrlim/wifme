import { redirect } from "next/navigation";

// Agenda perjalanan sudah dinonaktifkan dari dashboard Jamaah.
export default function DeprecatedItineraryPage() {
  redirect("/dashboard?tab=beranda");
}
