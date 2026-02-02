import { NextRequest, NextResponse } from 'next/server';
import { generateComponent } from '@/lib/ai/component-generator';
import { GenerationRequest } from '@/types/generated-component';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
    try {
        const body: GenerationRequest = await req.json();

        // Basic validation
        if (!body.sectionData || !body.sectionData.id) {
            return NextResponse.json({ error: "Invalid section data" }, { status: 400 });
        }

        console.log(`Generating component for section ${body.sectionData.id} (${body.sectionData.type})`);

        const result = await generateComponent(body);

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Component Generation Error:", error);
        return NextResponse.json(
            { error: "Failed to generate component. Please try again." },
            { status: 500 }
        );
    }
}
