import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are an expert Building Regulations Principal Designer (BRPD) in England and Wales. You help create site-specific inspection checklists for building projects based on uploaded project documents.

Your task: Analyze the provided documents (drawings descriptions, scope of works, existing trackers, project briefs) and generate a tailored site-specific inspection checklist.

The checklist must follow the Building Regulations 2010 structure:
- Regulation 7 (Materials and Workmanship)
- Part A (Structure)
- Part B (Fire Safety) — split into B1 (Means of Warning/Escape), B2 (Internal Fire Spread - Linings), B3 (Internal Fire Spread - Structure), B4 (External Fire Spread), B5 (Access for Fire Services)
- Regulation 38 (Fire Safety Information)
- Part C (Site Preparation / Resistance to Contaminants and Moisture)
- Part D (Toxic Substances)
- Part E (Resistance to Sound)
- Part F (Ventilation)
- Part G (Sanitation, Hot Water Safety and Water Efficiency)
- Part H (Drainage and Waste Disposal)
- Part J (Heat Producing Appliances)
- Part K (Protection from Falling, Collision and Impact)
- Part L (Conservation of Fuel and Power)
- Part M (Access and Use)
- Part N (Glazing Safety — now within Part K)
- Part O (Overheating)
- Part P (Electrical Safety)
- Part Q (Security)
- Part R (Electronic Communications)
- Part S (EV Charging)
- Part T (Telecommunications)

RULES:
1. Only include sections RELEVANT to this specific project. E.g., skip Part S (EV Charging) for an internal office refurb with no parking.
2. Make checklist items SPECIFIC to what you see in the documents. Reference specific materials, systems, room names, floor levels, or details mentioned.
3. Keep the standard regulatory reference format but tailor the check text.
4. Include commissioning items relevant to the project's M&E systems.
5. Include statutory declarations and general observations.
6. Each item must have a unique ref code (e.g., A.1, B1.3, COM.1).
7. Aim for 50-200 items depending on project complexity. Don't pad with generic items — every item should be meaningful for THIS project.

You MUST respond with valid JSON matching this exact structure:
{
  "sections": [
    {
      "title": "Part B — B1 Means of Warning and Escape",
      "key": "partB1",
      "items": [
        { "ref": "B1.1", "text": "Fire alarm system installed to L1 category per BS 5839-1 as shown on drawing FP-001", "section": "partB1" }
      ]
    }
  ],
  "commissioningItems": [
    { "ref": "COM.1", "text": "Fire alarm completion certificate per BS 5839-1", "section": "commissioning" }
  ],
  "statutoryDeclarations": [
    { "ref": "DEC.1", "text": "Building Regulations completion certificate applied for", "section": "declarations" }
  ],
  "generalObservations": [
    { "ref": "GEN.1", "text": "Site tidiness and welfare facilities adequate", "section": "general" }
  ],
  "projectSummary": "Brief description of what the project involves based on the documents"
}

Use the standard key format: reg7, partA, partB1-B5, reg38, partC, partD, partE, partF, partG, partH, partJ, partK, partL, partM, partO, partP, partQ, partR, partS, partT`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const apiKey = formData.get('apiKey') as string;
    const projectBrief = formData.get('projectBrief') as string;
    const files = formData.getAll('files') as File[];

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    // Build content array with text and documents
    const content: Anthropic.Messages.ContentBlockParam[] = [];

    // Add project brief if provided
    if (projectBrief) {
      content.push({
        type: 'text',
        text: `PROJECT BRIEF / ADDITIONAL CONTEXT:\n${projectBrief}`,
      });
    }

    // Process uploaded files
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');

      if (file.type === 'application/pdf') {
        content.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        } as unknown as Anthropic.Messages.ContentBlockParam);
      } else if (file.type.startsWith('image/')) {
        const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64,
          },
        });
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'text/csv' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        // For Excel/CSV/Word, read as text where possible
        const text = await file.text();
        content.push({
          type: 'text',
          text: `FILE: ${file.name}\n\n${text}`,
        });
      } else {
        // Try as text for other file types
        try {
          const text = await file.text();
          content.push({
            type: 'text',
            text: `FILE: ${file.name}\n\n${text}`,
          });
        } catch {
          // Skip files we can't read
        }
      }
    }

    if (content.length === 0) {
      content.push({
        type: 'text',
        text: 'No documents provided. Generate a standard comprehensive checklist for a typical commercial refurbishment project.',
      });
    }

    content.push({
      type: 'text',
      text: '\n\nBased on the above documents, generate a site-specific BRPD inspection checklist. Return ONLY valid JSON matching the required structure. No markdown, no code blocks, just raw JSON.',
    });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    // Extract text from response
    const responseText = response.content
      .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const checklist = JSON.parse(jsonStr);

    return NextResponse.json({
      success: true,
      checklist,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error: unknown) {
    console.error('Generate checklist error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate checklist';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
