"use client";

import { useOrientationRequirement } from "@/hooks/useOrientationRequirement";
import VideoView from "@/features/video/components/VideoView";

export default function VideoPage() {
  useOrientationRequirement("portrait");
  
  return <VideoView />
}
