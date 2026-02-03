"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Globe, Search, Camera, Code2, Sparkles, Cpu, Layers } from "lucide-react";

interface InteractiveLoaderProps {
    type: "scanning" | "generating";
}

const scanningSteps = [
    { icon: Globe, text: "Connecting to website...", color: "text-blue-400" },
    { icon: Search, text: "Identifying layout structures...", color: "text-amber-400" },
    { icon: Layers, text: "Detecting semantic sections...", color: "text-emerald-400" },
    { icon: Camera, text: "Capturing high-res screenshots...", color: "text-purple-400" },
    { icon: Cpu, text: "Analyzing Design DNA...", color: "text-rose-400" },
];

const generatingSteps = [
    { icon: Sparkles, text: "Interpreting visual elements...", color: "text-blue-400" },
    { icon: Code2, text: "Writing semantic React components...", color: "text-amber-400" },
    { icon: Layers, text: "Drafting Tailwind CSS styles...", color: "text-emerald-400" },
    { icon: Search, text: "Optimizing accessibility/ARIA...", color: "text-purple-400" },
    { icon: Cpu, text: "Finalizing code output...", color: "text-rose-400" },
];

export default function InteractiveLoader({ type }: InteractiveLoaderProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = type === "scanning" ? scanningSteps : generatingSteps;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % steps.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [steps.length]);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto p-6">
            {/* Visual Animation Circle */}
            <div className="relative w-32 h-32 mb-12">
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-amber-500/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute inset-[-10px] rounded-full border border-amber-500/10"
                    animate={{ scale: [1, 1.1, 1], rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />

                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        key={currentStep}
                        initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 1.5, opacity: 0, rotate: 20 }}
                        className={`p-4 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl ${steps[currentStep].color}`}
                    >
                        {React.createElement(steps[currentStep].icon, { className: "w-10 h-10" })}
                    </motion.div>
                </div>

                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                </div>
            </div>

            <div className="text-center space-y-4 w-full">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                    {type === "scanning" ? "Deconstructing Page" : "Crafting Code"}
                </h2>

                <div className="h-6 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={currentStep}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="text-zinc-400 text-sm font-medium"
                        >
                            {steps[currentStep].text}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 pt-4">
                    {steps.map((_, i) => (
                        <motion.div
                            key={i}
                            className="h-1 rounded-full bg-amber-500"
                            initial={false}
                            animate={{
                                width: i === currentStep ? 24 : 8,
                                opacity: i <= currentStep ? 1 : 0.2
                            }}
                            transition={{ duration: 0.4 }}
                        />
                    ))}
                </div>
            </div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -z-10" />
        </div>
    );
}
