"use client";

// ==========================================
// 📦 IMPORTS
// ==========================================
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Users, UserCheck, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import type { Friend } from "@/types/friend";

// ==========================================
// 🧩 TYPES
// ==========================================
interface FriendCardProps {
  friend: Friend;
  onRemove: (friendId: string) => void;
}

// ==========================================
// 🎨 PROFILE HOVER CARD (Premium Design)
// ==========================================
export function FriendCard({ friend, onRemove }: FriendCardProps) {
  const [hovered, setHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !shouldReduceMotion;
  
  const displayName = friend.friend_display_name || friend.friend_username;
  const avatarUrl = friend.friend_avatar_url;
  const description = "Fairshare user";
  
  // Stats placeholders (could be enhanced with real data)
  const followers = 0;
  const following = 0;

  const containerVariants = {
    rest: { scale: 1, y: 0, filter: "blur(0px)" },
    hover: shouldAnimate
      ? {
          scale: 1.02,
          y: -4,
          filter: "blur(0px)",
          transition: { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.6 },
        }
      : { scale: 1, y: 0, filter: "blur(0px)" },
  };

  const imageVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.6,
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95, filter: "blur(2px)" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 400, damping: 25, mass: 0.5 },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", damping: 8, stiffness: 200, mass: 0.8 },
    },
  };

  return (
    <motion.div
      data-slot="friend-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial="rest"
      whileHover="hover"
      variants={containerVariants}
      className="relative w-full max-w-[320px] h-[380px] rounded-3xl border border-border/20 text-card-foreground overflow-hidden shadow-xl shadow-black/5 cursor-pointer group backdrop-blur-sm dark:shadow-black/20"
    >
      {/* Full Cover Image (Avatar) */}
      <motion.img
        src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.friend_id}`}
        alt={displayName}
        className="absolute inset-0 w-full h-full object-cover"
        variants={imageVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />

      {/* Smooth Blur Overlay - Multiple layers for seamless fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 via-background/20 via-background/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background/90 via-background/60 via-background/30 via-background/15 via-background/8 to-transparent backdrop-blur-[1px]" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/85 via-background/40 to-transparent backdrop-blur-sm" />

      {/* Content */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        className="absolute bottom-0 left-0 right-0 p-6 space-y-4"
      >
        {/* Name */}
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          <motion.h2
            className="text-2xl font-bold text-foreground"
            variants={{
              visible: { transition: { staggerChildren: 0.02 } },
            }}
          >
            {displayName.split("").map((letter, index) => (
              <motion.span key={index} variants={letterVariants} className="inline-block">
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </motion.h2>
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground"
            whileHover={{
              scale: 1.1,
              rotate: 5,
              transition: { type: "spring", stiffness: 400, damping: 20 },
            }}
          >
            <Check className="w-2.5 h-2.5" />
          </motion.div>
        </motion.div>

        {/* Description */}
        <motion.p variants={itemVariants} className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
          {description}
        </motion.p>

        {/* Stats */}
        <motion.div variants={itemVariants} className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="font-semibold text-foreground">{followers}</span>
            <span className="text-sm">followers</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserCheck className="w-4 h-4" />
            <span className="font-semibold text-foreground">{following}</span>
            <span className="text-sm">following</span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-2">
          <Link
            href={`/dashboard/profile/${friend.friend_id}`}
            className="flex-1"
          >
            <motion.button
              whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } }}
              whileTap={{ scale: 0.98 }}
              className="w-full cursor-pointer py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 border border-border/20 shadow-sm bg-foreground text-background hover:bg-foreground/90 transform-gpu flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              View Profile
            </motion.button>
          </Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.preventDefault();
              onRemove(friend.friend_id);
            }}
            className="cursor-pointer py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 border border-border/20 shadow-sm bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transform-gpu"
          >
            Remove
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
