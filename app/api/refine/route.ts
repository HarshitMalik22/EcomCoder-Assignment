import { NextRequest, NextResponse } from 'next/server';
import { refineComponent } from '@/lib/ai/iteration-handler';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.code || !body.instruction) {
            return NextResponse.json({ error: "Missing code or instruction" }, { status: 400 });
        }

        const newCode = await refineComponent({
            currentCode: body.code,
            instruction: body.instruction
        });

        return NextResponse.json({
            success: true,
            data: { code: newCode }
        });

    } catch (error) {
        console.error("Refinement Error:", error);
        return NextResponse.json(
            { error: "Failed to refine component." },
            { status: 500 }
        );
    }
}
