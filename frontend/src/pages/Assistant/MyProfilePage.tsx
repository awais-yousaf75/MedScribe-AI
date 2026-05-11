// src/pages/assistant/MyProfilePage.tsx
import { AssistantProfileCard } from "@/pages/assistant/AssistantProfileCard";
import type { AssistantMeResponse } from "@/types";

interface Props {
  assistantInfo: AssistantMeResponse | null;
}

export function MyProfilePage({ assistantInfo }: Props) {
  return <AssistantProfileCard assistantInfo={assistantInfo} />;
}