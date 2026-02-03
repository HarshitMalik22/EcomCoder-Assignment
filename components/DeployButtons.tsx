import React, { useState } from 'react';
import { GeneratedComponent } from '@/types/generated-component';
import { deployToStackBlitz } from '@/lib/export/deploy-utils';
import { useToast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';

interface DeployButtonsProps {
    component: GeneratedComponent;
}

export function DeployButtons({ component }: DeployButtonsProps) {
    const { addToast } = useToast();
    const [isDeployingSB, setIsDeployingSB] = useState(false);

    const handleStackBlitz = async () => {
        setIsDeployingSB(true);
        await deployToStackBlitz(component, addToast);
        setIsDeployingSB(false);
    };

    return (
        <div className="flex items-center gap-2">
            <div className="h-4 w-[1px] bg-zinc-700 mx-1"></div>

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
