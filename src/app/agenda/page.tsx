import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard – Wifme",
  description: "Agenda perjalanan tidak lagi tersedia di dashboard Wifme.",
};

export default function AgendaPage() {
  redirect("/dashboard?tab=beranda");
}
