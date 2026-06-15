import { Metadata } from "next";
import SaveMeClient from "./SaveMeClient";

export const metadata: Metadata = {
  title: "SAVE ME — Emergency Help | Rescue Rider",
  description: "Request immediate emergency help from nearby verified riders.",
};

export default function SaveMePage() {
  return <SaveMeClient />;
}
