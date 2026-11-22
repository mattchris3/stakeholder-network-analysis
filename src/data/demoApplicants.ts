// Two sample applications so the admin demo has something to review.
// Added in memory for demo admin sessions only; never written to Firebase.
import type { Entity, UnityData } from '../lib/types';

const APPLICANTS: Omit<Entity, 'unityId'>[] = [
  {
    id: 'AFRICACDC-DEMO',
    name: 'Africa CDC',
    fullName: 'Africa Centres for Disease Control and Prevention',
    sector: 'government',
    type: 'intergovernmental',
    size: 'large',
    region: 'regional',
    fundingType: 'implementer',
    location: 'Addis Ababa, Ethiopia',
    focusAreas: ['Disease Surveillance', 'Emergency Response', 'Health Systems Strengthening'],
    description:
      "The African Union's public health agency, supporting member states to detect, prevent and respond to disease threats.",
    status: 'inactive',
    approval: 'pending',
    appliedDate: '2026-03-20',
  },
  {
    id: 'PATH-DEMO',
    name: 'PATH',
    fullName: 'PATH',
    sector: 'nonprofit',
    type: 'ngo',
    size: 'medium',
    region: 'global',
    fundingType: 'research',
    location: 'Seattle, United States',
    focusAreas: ['Immunization & Vaccines', 'Research & Development', 'Maternal & Child Health'],
    description:
      'A global health non-profit that develops and scales vaccines, diagnostics and digital health tools for low-resource settings.',
    status: 'inactive',
    approval: 'pending',
    appliedDate: '2026-03-24',
  },
];

export function withDemoApplicants(data: UnityData, unityId: string): UnityData {
  if (data.entities.some((e) => e.approval === 'pending')) return data;
  return { ...data, entities: [...data.entities, ...APPLICANTS.map((a) => ({ ...a, unityId }))] };
}
