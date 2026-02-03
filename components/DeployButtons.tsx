import React, { useState } from 'react';
import { GeneratedComponent } from '@/types/generated-component';
import { deployToCodeSandbox, deployToStackBlitz } from '@/lib/export/deploy-utils';
import { useToast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';

interface DeployButtonsProps {
    component: GeneratedComponent;
}

export function DeployButtons({ component }: DeployButtonsProps) {
    const { addToast } = useToast();
    const [isDeployingCS, setIsDeployingCS] = useState(false);
    const [isDeployingSB, setIsDeployingSB] = useState(false);

    const handleCodeSandbox = async () => {
        setIsDeployingCS(true);
        await deployToCodeSandbox(component, addToast);
        setIsDeployingCS(false);
    };

    const handleStackBlitz = async () => {
        setIsDeployingSB(true);
        await deployToStackBlitz(component, addToast);
        setIsDeployingSB(false);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="h-4 w-[1px] bg-zinc-700 mx-1"></div>

            <button
                onClick={handleCodeSandbox}
                disabled={isDeployingCS}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all relative group"
                title="Deploy to CodeSandbox"
            >
                {isDeployingCS ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <svg viewBox="0 0 1024 1024" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M755 140.3l11.2 214.5 134.9-42.9-286.2-182.6-285.8 182.2 133.3 43.3 12.5-214.5 140.1-45zM227 383.6L124 538l122.3 214.2 118-47L227 383.6zm571.2 0L660 705.2l118 47L900 538 798.2 383.6zM286.5 776.3l225.5 81.6 225.1-81.2-127.3-64.4-97.8 77.1-98.2-76.7-127.3 63.6z" />
                    </svg>
                )}
            </button>

            <button
                onClick={handleStackBlitz}
                disabled={isDeployingSB}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all relative group"
                title="Deploy to StackBlitz"
            >
                {isDeployingSB ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.797 14.182H3.635L16.728 0l-3.525 9.818h7.162L7.272 24l3.524-9.818Z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
