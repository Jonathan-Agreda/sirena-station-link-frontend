"use client";
import { LogoAnimated } from "@/components/LogoAnimated";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  return (
    <section className="min-h-[100svh] grid place-items-center transition-colors">
      <motion.div
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        className="cursor-pointer"
        onClick={() => router.push("/login")}
      >
        <LogoAnimated />
      </motion.div>
    </section>
  );
}
