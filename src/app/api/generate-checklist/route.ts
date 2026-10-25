import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { resolveRegime } from '@/lib/regimes';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectBrief = formData.get('projectBrief') as string;
    const regimeId = formData.get('regime') as string | null;
    const regime = resolveRegime(regimeId);
    const files = formData.getAll('files') as File[];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server is missing ANTHROPIC_API_KEY. Set it on the Vercel project.' },
        { status: 500 }
      );
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
      text: `\n\nBased on the above documents, generate a site-specific ${regime.label} inspection checklist. Return ONLY valid JSON matching the required structure. No markdown, no code blocks, just raw JSON.`,
    });

    const response = await client.messages
      .stream({
        model: 'claude-sonnet-5-5',
        max_tokens: 32000,
        system: regime.systemPrompt,
        messages: [{ role: 'user', content }],
      })
      .finalMessage();

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
      regime: regime.id,
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
