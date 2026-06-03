import { redirect } from "next/navigation";

// Server-side redirect to the auth entry point. Authenticated users are then
// bounced to /dashboard by the login page's GuestGuard.
export default function Home() {
  redirect("/login");
}
