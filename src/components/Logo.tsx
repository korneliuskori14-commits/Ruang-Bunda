import { motion } from "motion/react";
// @ts-ignore
import logoUrl from "../assets/images/logo_ruang_bunda_1781638417616.jpg";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const heartSizes = {
    sm: "w-24 h-24",
    md: "w-36 h-36",
    lg: "w-44 h-44"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Decorative Warm Backglow */}
      <div className="relative flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1.1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          className="absolute w-28 h-28 bg-primary-soft rounded-full blur-2xl opacity-20"
        />
        
        {/* Heart / Logo container */}
        <div className={`relative ${heartSizes[size]} flex items-center justify-center bg-transparent rounded-full overflow-hidden`}>
          <img
            src={logoUrl}
            alt="Logo Ruang Bunda"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain rounded-full mix-blend-multiply"
          />
        </div>
      </div>

      {/* Styled font representing the brand heading "Ruang Bunda" */}
      <h1 className={`${textSizes[size]} mt-3 font-serif font-black tracking-tight text-primary-maternal text-center select-none`}>
        Ruang Bunda
      </h1>
      <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium select-none">
        Kasih Ibu Sepanjang Masa
      </p>
    </div>
  );
}
