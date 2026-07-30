import { supabase } from './supabase';

// ── Feature 7: WhatsApp Stage Sharing ────────────────────────────────────────

interface WhatsAppShareInput {
  eventType: string;
  items: { name: string; quantity: number }[];
  dimensions?: { length: number; width: number };
  designId?: string;
}

export function buildWhatsAppLink(input: WhatsAppShareInput): string {
  const itemList = input.items
    .map(i => `• ${i.name} ×${i.quantity}`)
    .join('\n');

  const dimensionText = input.dimensions
    ? `\n📐 Stage: ${input.dimensions.length}m × ${input.dimensions.width}m`
    : '';

  const deepLink = input.designId
    ? `\n🔗 View Design: https://planify.app/design/${input.designId}`
    : '';

  const message = [
    `🎉 *Planify Event Design*`,
    `Event: ${input.eventType}`,
    ``,
    `*Items:*`,
    itemList,
    dimensionText,
    deepLink,
    ``,
    `_Designed with Planify_`,
  ].join('\n');

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// Save design to Supabase and return ID for deep link
export async function saveDesignToSupabase(
  eventType: string,
  canvasState: object,
  items: object[],
  dimensions?: { length: number; width: number }
): Promise<string | null> {
  const { data, error } = await supabase
    .from('designs')
    .insert({
      event_type: eventType,
      canvas_state: canvasState,
      item_list: items,
      dimensions: dimensions ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save design:', error.message);
    return null;
  }
  return data.id;
}

// Load design from Supabase by ID (for deep link resolution)
export async function loadDesignById(id: string) {
  const { data, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}
