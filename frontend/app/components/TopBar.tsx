import { Logo } from "@/app/components/logo/Logo";
import Link from "next/link";

export const TopBar = () => {
  return (
    <div className="flex items-center justify-between">
      <Logo className="text-[0.45vw] sm:text-[0.525vw] lg:text-[5px] text-orange" />

      <Link
        href="/"
        className="
        bg-black/60 border border-white/30 text-white 
        rounded-md px-3 hover:bg-white/5 
        cursor-pointer active:scale-95 transition
        "
      >
        HOME
      </Link>
    </div>
  );
};
