import URLInput from "@/components/URLInput";
import { Highlighter } from "@/components/ui/highlighter";
import { Code2, Copy, Layers } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-amber-600/20 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-amber-900/10 rounded-full blur-[100px] -z-10" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-20"></div>

      <div className="z-10 flex flex-col items-center w-full max-w-5xl mx-auto space-y-8 text-center pt-20 pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-400 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          AI-Powered Component Generator
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Highlighter action="underline" color="#fbbf24" strokeWidth={2} animationDuration={800}>
            Turn Any Website
          </Highlighter>{" "}
          <br />
          into{" "}
          <Highlighter action="highlight" color="#fcd34d" strokeWidth={1.5} animationDuration={800}>
            React Code
          </Highlighter>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          Enter a URL, select a section, and get clean, accessible code.
          Powered by advanced computer vision and LLMs.
        </p>

        <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          <URLInput />
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
        <FeatureCard
          icon={<Layers className="w-6 h-6 text-amber-400" />}
          title="Section Detection"
          description="Automatically identifies headers, features, pricing, and hero sections from any page."
        />
        <FeatureCard
          icon={<Code2 className="w-6 h-6 text-amber-400" />}
          title="Clean Code"
          description="Generates production-ready React + Tailwind code that matches your style system."
        />
        <FeatureCard
          icon={<Copy className="w-6 h-6 text-amber-400" />}
          title="One-Click Export"
          description="Copy code to clipboard or download as a .tsx file ready for your project."
        />
      </div>

      <footer className="mt-20 py-8 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} LevelUp. Built with Next.js & Tailwind.</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group relative p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all hover:bg-zinc-900/80 backdrop-blur-sm">
      <div className="mb-4 p-3 rounded-lg bg-white/5 w-fit group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}
