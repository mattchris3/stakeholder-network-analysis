// One colour per sector, shared by the graph, legends and charts.
export const SECTOR_COLORS: Record<string, string> = {
  healthcare: '#0EA5A4',
  technology: '#2563EB',
  nonprofit: '#D9467A',
  education: '#7C3AED',
  government: '#E8590C',
  business: '#CA8A04',
  banking: '#059669',
  energy: '#65A30D',
  legal: '#B45309',
  agriculture: '#16A34A',
};
export const UNKNOWN_COLOR = '#64748B';

export const FUNDING_COLORS: Record<string, string> = {
  implementer: '#0EA5A4',
  research: '#7C3AED',
  donor: '#E8590C',
};

export function sectorColor(sector: string): string {
  return SECTOR_COLORS[sector] ?? UNKNOWN_COLOR;
}

export function fundingColor(type: string): string {
  return FUNDING_COLORS[type] ?? UNKNOWN_COLOR;
}

const LABELS: Record<string, string> = {
  nonprofit: 'Non-profit',
  ngo: 'NGO',
  'un-agency': 'UN agency',
};

/** "healthcare" → "Healthcare", "un-agency" → "UN agency". */
export function label(value: string | undefined): string {
  if (!value) return 'Unknown';
  if (LABELS[value]) return LABELS[value];
  const words = value.replace(/[-_]/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
