import { Logo } from "@/app/components/logo/Logo";
import Link from "next/link";
import { IoLogoGithub } from "react-icons/io5";

const HomePage = () => {
  return (
    <main className="relative flex flex-col justify-between px-4 md:px-10 lg:px-20 my-4">
      {/* TopBar */}
      <div className="flex justify-between items-center mb-20">
        <Logo className="text-[0.45vw] sm:text-[0.525vw] lg:text-[5px] text-orange" />

        <Link
          href="https://github.com/verma-gourav/manimator"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center 
          w-10 h-10 border border-white/20 rounded-full
         hover:bg-white/5 active:scale-95 transition"
          aria-label="GitHub repository"
        >
          <IoLogoGithub size={24} color="white" />
        </Link>
      </div>

      {/* Center Content */}
      <div className="flex flex-col items-center text-center text-white space-y-4 grow">
        <h1 className="text-4xl sm:text-6xl lg:text-9xl font-extrabold">
          Visualize <span className="text-orange">Math</span>
        </h1>
        <p className="text-xl sm:text-3xl lg:text-5xl text-white/80 font-bold">
          with cool animations.
        </p>
        <p className="mt-4 text-lg sm:text-3xl lg:text-5xl">
          Describe it. We animate it.
        </p>

        {/* Link Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-10">
          <Link
            href="https://github.com/verma-gourav/manimator"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 
            border border-white/20 
            rounded-md font-mono text-sm 
          hover:bg-white/5 hover:text-black active:scale-95 transition 
            flex justify-center items-center"
          >
            <IoLogoGithub size={24} color="white" />
            <span className="ml-2 text-white/80">Github</span>
          </Link>
          <Link
            href="/generate"
            className="px-6 py-2 
            rounded-md bg-orange text-dark
            font-mono text-sm font-bold
          hover:bg-orange/80 hover:text-black cursor-pointer transition
            flex justify-center items-center active:scale-95"
          >
            GENERATE
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs sm:text-sm text-white/60 font-mono mt-20">
        Built on Manim. Powered by AI.
      </footer>
    </main>
  );
};

export default HomePage;
