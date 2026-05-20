import { redirect } from "next/navigation";

/** 首页 — 重定向到 /topics */
export default function HomePage() {
  redirect("/topics");
}
