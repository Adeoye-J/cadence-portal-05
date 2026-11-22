import { redirect } from "next/navigation";

/** /studio has no page of its own. It goes to the projects dashboard. */
export default function StudioIndexPage() {
  redirect("/studio/projects");
}
