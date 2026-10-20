import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface TimelineContentProps extends React.HTMLAttributes<HTMLElement> {
  as?: any;
  animationNum?: number;
  timelineRef?: React.RefObject<any>;
  customVariants?: any;
  className?: string;
  children?: React.ReactNode;
}

export function TimelineContent({
  as: Component = "div",
  animationNum = 0,
  customVariants,
  className,
  children,
  timelineRef: _timelineRef, // só para quem chama; não pode chegar ao DOM
  ...props
}: TimelineContentProps) {
  const defaultVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.15,
        duration: 0.45,
        ease: "easeOut",
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -15,
      opacity: 0,
    },
  };

  const variants = customVariants || defaultVariants;
  const MotionComponent = (motion as any)[Component] || motion.div;

  return (
    <MotionComponent
      custom={animationNum}
      initial="hidden"
      animate="visible"
      variants={variants}
      className={cn(className)}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
