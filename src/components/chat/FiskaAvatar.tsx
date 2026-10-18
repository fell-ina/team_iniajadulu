"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const botImages = {
  Netral: {
    diam: "/images/EkspresiBot/netral.png",
    buka: "/images/EkspresiBot/netralBuka.png",
  },
  Happy: {
    diam: "/images/EkspresiBot/happyDiam.png",
    buka: "/images/EkspresiBot/HappyBuka.png",
  },
  Sad: {
    diam: "/images/EkspresiBot/SadDiam.png",
    buka: "/images/EkspresiBot/SadBuka.png",
  },
  Angry: {
    diam: "/images/EkspresiBot/AngryTutup.png",
    buka: "/images/EkspresiBot/AngryBuka.png",
  },
  Bingung: {
    diam: "/images/EkspresiBot/BingungDiam.png",
    buka: "/images/EkspresiBot/BingungBuka.png",
  },
};

type FiskaAvatarProps = {
  isFullscreen: boolean;
  botEmotion: keyof typeof botImages;
  isSpeaking: boolean;
};

export default function FiskaAvatar({
  isFullscreen,
  botEmotion,
  isSpeaking,
}: FiskaAvatarProps) {
  const [mouthOpen, setMouthOpen] = useState(false);

  // Efek animasi mulut ngomong (looping 150ms)
  useEffect(() => {
    let interval: number;
    if (isSpeaking) {
      interval = window.setInterval(() => {
        setMouthOpen((prev) => !prev);
      }, 150);
    } else {
      setMouthOpen(false); // kalau diam, mulut tertutup
    }
    return () => window.clearInterval(interval);
  }, [isSpeaking]);

  if (!isFullscreen) return null;

  const currentEmotionData = botImages[botEmotion] || botImages.Netral;
  const FiskaImage = currentEmotionData[mouthOpen ? "buka" : "diam"];

  return (
    <motion.div
      key="avatar-fiska"
      initial={{ opacity: 0, x: -50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="hidden md:flex flex-1 h-full w-full max-w-lg relative flex-col items-center justify-end"
    >
      <div className="relative w-full h-[85%] pointer-events-none select-none">
        <Image
          src={FiskaImage}
          alt="Fiska Avatar Streamer Mode"
          fill
          className="object-contain object-bottom drop-shadow-[0_0_35px_rgba(125,160,202,0.25)] transition-opacity duration-200"
          priority
        />
      </div>
    </motion.div>
  );
}
