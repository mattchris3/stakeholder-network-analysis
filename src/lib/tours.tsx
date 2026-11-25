import type { TourStep } from '../components/Tour';

export const MEMBER_TOUR: TourStep[] = [
  {
    title: 'Welcome to Unity',
    body: (
      <>
        You're signed in as <strong className="text-ink">WHO</strong> in a sample network of 15 global-health
        organisations. Here's a 30-second look around.
      </>
    ),
  },
  {
    target: 'graph',
    title: 'The network',
    body: 'Each circle is an organisation, coloured by sector and sized by meetings. Each line is a meeting every participant verified; thicker means more. Hover or select one to see its partners, drag to rearrange, scroll to zoom.',
  },
  {
    target: 'layout',
    title: 'Three ways to see it',
    body: 'Core puts the best-connected organisations in the middle. By sector and By funding group them, so you can spot who works across groups.',
  },
  {
    target: 'filters',
    title: 'Ask the network a question',
    body: 'Type two organisations to see only the links between them, or narrow by sector, link strength and time period.',
  },
  {
    target: 'stats',
    title: 'Numbers that follow your filters',
    body: 'Organisations, connections and verified meetings recalculate for whatever is on screen.',
  },
  {
    target: 'panel',
    title: 'Who does the most',
    body: 'The most active organisations, ranked. Select one for its details and partners.',
  },
  {
    target: 'nav-meetings',
    title: 'Meetings',
    body: 'Verify or dispute meetings others logged with you (the badge counts them), and log your own. A meeting only counts once everyone involved verifies it.',
  },
  {
    target: 'nav-analytics',
    title: 'Analytics',
    body: 'Influence scores, activity over time, and insights: who bridges sectors and which partnerships are missing.',
  },
  {
    target: 'tour-button',
    title: "You're set",
    body: 'This is a demo, so nothing you change is saved. Replay this tour any time from here.',
  },
];

export const ADMIN_TOUR: TourStep[] = [
  {
    title: "You're the network admin",
    body: 'Admins decide who joins the network and which focus areas members describe their work with. Here is where that happens.',
  },
  {
    target: 'admin-stats',
    title: 'The network at a glance',
    body: 'Members, applications waiting, and how many meetings are verified or still waiting on someone.',
  },
  {
    target: 'admin-applications',
    title: 'Applications',
    body: 'Organisations apply with the network ID and access code. Open one to read it, then approve or reject. Try approving PATH.',
  },
  {
    target: 'admin-tabs',
    title: 'Members and settings',
    body: "Members lets you remove or restore organisations. Network settings holds the access code and the focus areas the insights compare.",
  },
  {
    target: 'nav-network',
    title: 'See the result',
    body: 'Approved members appear in the network graph and analytics once they have verified meetings.',
  },
  {
    target: 'tour-button',
    title: "You're set",
    body: 'This is a demo, so nothing you change is saved. Replay this tour any time from here.',
  },
];
