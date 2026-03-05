"use client";

import { motion } from "framer-motion";

interface MenuHeroProps {
  userName?: string | null;
}

export function MenuHero({ userName }: MenuHeroProps) {
  const firstName = userName?.split(" ")[0] ?? "Kamu";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="relative flex h-full items-center justify-between overflow-visible rounded-[32px] border-2 border-white bg-white/60 p-6 shadow-sm backdrop-blur-xl"
    >
      {/* Text */}
      <div className="relative z-10 w-2/3">
        <h2 className="mb-2 text-2xl font-extrabold leading-tight text-gray-800">
          Lapar, {firstName}?
        </h2>
        <p className="text-sm font-bold text-gray-500">
          Ayo pesan makanan favoritmu sekarang! ✨
        </p>
      </div>

      {/* Animated Mascot */}
      <motion.div
        className="absolute -right-2 -top-4 z-20 h-28 w-28 sm:-top-6 sm:h-32 sm:w-32 lg:-top-2 lg:right-4"
        animate={{
          y: [0, -12, 0],
          rotate: [-5, 8, -5],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f354.svg"
          alt="Burger Mascot"
          className="h-full w-full drop-shadow-2xl"
        />

        {/* Floating sparkle */}
        <motion.img
          src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2728.svg"
          className="absolute -left-2 top-2 h-6 w-6 opacity-80"
          alt=""
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating dot accent */}
        <motion.div
          className="absolute -right-2 bottom-4 h-4 w-4 rounded-full border-2 border-white bg-accent shadow-sm"
          animate={{ y: [0, 10, 0], scale: [1, 0.8, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating dot primary */}
        <motion.div
          className="absolute right-0 top-10 h-3 w-3 rounded-full border-2 border-white bg-primary shadow-sm"
          animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
