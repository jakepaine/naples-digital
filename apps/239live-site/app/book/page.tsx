import { redirect } from "next/navigation";
import { APP_URLS } from "@naples/mock-data";

// /book on the public site is a thin redirect to the booking-portal app.
// Each app is its own Railway service, so the redirect is a server-side 308.
export default function BookPage() {
  redirect(APP_URLS.booking);
}
