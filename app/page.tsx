import { redirect } from "next/navigation";

// Demo-first: the homepage IS the working app. No login wall in v1.
export default function Home() {
  redirect("/records");
}
