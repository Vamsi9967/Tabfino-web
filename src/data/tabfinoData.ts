export interface SimulatedTab {
  id: string;
  title: string;
  domain: string;
  path: string;
  isLastActive?: boolean;
  summaryTitle: string;
  summarySubtitle: string;
  summaryBlocks: string[];
}

export interface SimulatedWorkflow {
  id: string;
  name: string;
  updatedLabel: string;
  tabCount: number;
  tabs: SimulatedTab[];
}

export const SIMULATED_WORKFLOWS: SimulatedWorkflow[] = [
  {
    id: 'vendor-research',
    name: 'Vendor research',
    updatedLabel: '14m ago',
    tabCount: 5,
    tabs: [
      {
        id: 'pricing-comparison',
        title: 'Pricing comparison',
        domain: 'docs.internal.example',
        path: '/q4/vendor-matrix',
        isLastActive: true,
        summaryTitle: 'Q4 Vendor Pricing Comparison',
        summarySubtitle: 'Updated 14 minutes ago · 3 shortlisted providers',
        summaryBlocks: [
          'Seat tiers and annual billing thresholds compared across three finalists.',
          'Notes on SOC 2 attestation and local data residency clauses.',
        ],
      },
      {
        id: 'contract-draft',
        title: 'Contract draft',
        domain: 'legal.workspace.example',
        path: '/drafts/msa-redlines',
        summaryTitle: 'Master Service Agreement redlines',
        summarySubtitle: 'Section 4.2 renewal and termination notice',
        summaryBlocks: [
          'Proposed 30 day written notice window instead of automatic annual lock in.',
          'Pending procurement approval before Friday review.',
        ],
      },
      {
        id: 'security-notes',
        title: 'Security notes',
        domain: 'trust.vendor.example',
        path: '/security-architecture',
        summaryTitle: 'Vendor Security and Encryption Overview',
        summarySubtitle: 'Device local storage and key rotation policy',
        summaryBlocks: [
          'Audit report summary covering encryption at rest and incident response SLA.',
          'Verified browser extension permissions scope.',
        ],
      },
      {
        id: 'reference-list',
        title: 'Reference list',
        domain: 'notes.internal.example',
        path: '/vendor-references',
        summaryTitle: 'Customer Reference Call Notes',
        summarySubtitle: '2 engineering teams interviewed this week',
        summaryBlocks: [
          'Onboarding took under two days with zero migration downtime.',
          'Support response times averaged under three hours.',
        ],
      },
      {
        id: 'budget-signoff',
        title: 'Budget approval',
        domain: 'finance.internal.example',
        path: '/approvals/2026-tools',
        summaryTitle: 'Tooling Budget Allocation',
        summarySubtitle: 'Departmental software cap check',
        summaryBlocks: [
          'Approved line item ready once final quote PDF is attached.',
          'Cost center code: ENG OPS 410.',
        ],
      },
    ],
  },
  {
    id: 'quarter-planning',
    name: 'Quarter planning',
    updatedLabel: '2h ago',
    tabCount: 3,
    tabs: [
      {
        id: 'q1-roadmap',
        title: 'Roadmap priorities',
        domain: 'planning.internal.example',
        path: '/2026/roadmap',
        isLastActive: true,
        summaryTitle: 'Next Quarter Delivery Priorities',
        summarySubtitle: 'Drafted 2 hours ago · Product and Engineering',
        summaryBlocks: [
          'Three core milestones ranked by customer impact and engineering capacity.',
          'Dependency check with design systems refresh.',
        ],
      },
      {
        id: 'capacity-sheet',
        title: 'Team capacity',
        domain: 'sheets.internal.example',
        path: '/sprint-allocation',
        summaryTitle: 'Engineering Sprint Capacity Model',
        summarySubtitle: '6 week cycle · Holiday adjustments applied',
        summaryBlocks: [
          'Reserved 20% bandwidth for bug triage and reliability work.',
          'Balanced frontend and infrastructure pairing.',
        ],
      },
      {
        id: 'customer-feedback',
        title: 'Customer interviews',
        domain: 'research.internal.example',
        path: '/synthesis/october',
        summaryTitle: 'October User Research Synthesis',
        summarySubtitle: '14 sessions tagged by workflow friction',
        summaryBlocks: [
          'Top request: faster recovery after morning meeting interruptions.',
          'Zero tolerance for intrusive browser popups.',
        ],
      },
    ],
  },
  {
    id: 'trip-to-pune',
    name: 'Trip to Pune',
    updatedLabel: 'Yesterday 16:40',
    tabCount: 4,
    tabs: [
      {
        id: 'train-timings',
        title: 'Deccan Queen timings',
        domain: 'rail.travel.example',
        path: '/routes/mumbai-pune',
        isLastActive: true,
        summaryTitle: 'Morning Express Train Schedule',
        summarySubtitle: 'Saved yesterday · Departure 07:15',
        summaryBlocks: [
          'Platform 4 departure from CSMT, arriving Pune Junction at 10:25.',
          'Vistadome coach availability checked for Thursday morning.',
        ],
      },
      {
        id: 'hotel-bookings',
        title: 'Koregaon Park stay',
        domain: 'stays.travel.example',
        path: '/pune/koregaon-park',
        summaryTitle: 'Quiet Boutique Hotel Options',
        summarySubtitle: 'Free cancellation until Wednesday 18:00',
        summaryBlocks: [
          'Walking distance to the studio venue with reliable desk workspace.',
          'Breakfast included from 07:00.',
        ],
      },
      {
        id: 'studio-directions',
        title: 'Studio directions',
        domain: 'maps.travel.example',
        path: '/pune/baner-route',
        summaryTitle: 'Transit Route to Workshop Venue',
        summarySubtitle: 'Estimated 22 minutes by cab',
        summaryBlocks: [
          'Saved entry gate pin and visitor reception instructions.',
          'Morning traffic buffer recommended after 09:00.',
        ],
      },
      {
        id: 'packing-notes',
        title: 'Packing checklist',
        domain: 'notes.personal.example',
        path: '/trips/pune-2026',
        summaryTitle: 'Two day work trip checklist',
        summarySubtitle: 'Adapters, badge, and presentation backup',
        summaryBlocks: [
          'Power hub, HDMI adapter, and offline PDF copy of workshop slides.',
          'Light rain jacket.',
        ],
      },
    ],
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Does Tabfino read the content of my pages?',
    answer:
      'No. It uses tab metadata such as titles and URLs. It does not read page text, messages or keystrokes.',
  },
  {
    question: 'Where is my saved work stored?',
    answer:
      "In Chrome's local extension storage on your device. The current prototype does not upload or sync it to a Tabfino server.",
  },
  {
    question: 'Will Tabfino slow Chrome down?',
    answer:
      'We have not published performance measurements yet, so we make no speed claim here. Tabfino works with tab titles, URLs and timestamps rather than page content, and you can pause memory or remove the extension at any time.',
  },
  {
    question: 'Why not use bookmarks or tab groups?',
    answer:
      'Bookmarks and tab groups hold what you organize yourself. Tabfino groups related tabs into workflows, names each work session and remembers which tab was active. You can use them together.',
  },
  {
    question: 'Can I open only one saved tab?',
    answer:
      'Yes. Select a saved tab to open just that page. Choose Continue work when you want to reopen every saved tab in the workflow.',
  },
  {
    question: 'What does the inactivity reminder detect?',
    answer:
      'Chrome reports inactivity for the whole device. That signal is not limited to activity inside Chrome, so other device use can affect when a reminder appears.',
  },
  {
    question: 'Can I stop Tabfino from remembering?',
    answer:
      'Yes. Pause memory in Settings. You can also exclude specific websites or delete saved activity.',
  },
  {
    question: 'Does Tabfino work outside Chrome?',
    answer:
      'It is built as a Chrome extension and remembers browser tabs. It does not capture work in desktop apps.',
  },
];

export interface LegalSection {
  id: string;
  number: string;
  tocLabel: string;
  title: string;
  blocks: LegalBlock[];
}

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'note'; lead: string; text: string }
  | { type: 'ul'; items: { bold?: string; text: string }[] }
  | { type: 'table'; headers: string[]; rows: string[][] };

export const PRIVACY_FACTS = [
  { label: 'Stored', value: 'On your device' },
  { label: 'Page content', value: 'Never read' },
  { label: 'Your controls', value: 'Pause, exclude, delete' },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'privacy-section-1',
    number: '01',
    tocLabel: '1. Overview',
    title: 'Overview',
    blocks: [
      {
        type: 'p',
        text: 'This Privacy Policy explains how [COMPANY / DEVELOPER NAME] (“Tabfino”, “we”, “us”) handles information when you use the Tabfino Chrome extension and this website. Tabfino is built to be local first: the work context it remembers is saved on your device, and the current prototype does not upload or sync it to a Tabfino server.',
      },
      {
        type: 'p',
        text: 'Please read this policy together with our Terms and Conditions.',
      },
      {
        type: 'note',
        lead: 'In short:',
        text: 'Tabfino saves tab titles, URLs and activity details on your device, with your permission. It does not read page content, and you can pause, exclude or delete what it saves at any time.',
      },
    ],
  },
  {
    id: 'privacy-section-2',
    number: '02',
    tocLabel: '2. Definitions',
    title: 'Definitions',
    blocks: [
      {
        type: 'ul',
        items: [
          { bold: 'Extension', text: ': the Tabfino Chrome extension.' },
          {
            bold: 'Browser metadata',
            text: ': tab titles, URLs, activity timestamps and which tab was active.',
          },
          {
            bold: 'Workflow',
            text: ': a group of related tabs that Tabfino saves as one work session.',
          },
          {
            bold: 'Local storage',
            text: ': Chrome’s extension storage on your device.',
          },
          { bold: 'Website', text: ': the Tabfino marketing website.' },
        ],
      },
    ],
  },
  {
    id: 'privacy-section-3',
    number: '03',
    tocLabel: '3. Information Tabfino handles',
    title: 'Information Tabfino handles',
    blocks: [
      {
        type: 'h3',
        text: 'Information the extension saves, with your permission',
      },
      {
        type: 'table',
        headers: ['Data', 'What it is', 'Why it is used'],
        rows: [
          [
            'Tab titles',
            'The title shown on a tab',
            'Name tabs in a workflow so you can recognise them',
          ],
          [
            'Tab URLs',
            'The address of a tab',
            'Reopen the exact page you choose',
          ],
          [
            'Activity timestamps',
            'When a tab was opened or last active',
            'Order workflows and find your last active tab',
          ],
          [
            'Active tab marker',
            'Which tab was active in a workflow',
            'Return you to where you stopped',
          ],
          [
            'Workflow names',
            'A name Tabfino gives to a group of tabs',
            'Give each work session a recognisable return point',
          ],
          [
            'Settings',
            'Your pause, exclusion and notification choices',
            'Apply the boundaries you set',
          ],
        ],
      },
      { type: 'h3', text: 'Information Tabfino does not read or save' },
      {
        type: 'ul',
        items: [
          { text: 'Page text or documents' },
          { text: 'Messages or passwords' },
          { text: 'Screenshots or keystrokes' },
        ],
      },
      { type: 'h3', text: 'Information you give us directly' },
      {
        type: 'p',
        text: 'If you contact us, join early access, or request support, we receive what you send, such as your email address and message. See “This website” below.',
      },
    ],
  },
  {
    id: 'privacy-section-4',
    number: '04',
    tocLabel: '4. How we use information',
    title: 'How we use information',
    blocks: [
      {
        type: 'p',
        text: 'Saved browser metadata is used only to provide Tabfino’s features:',
      },
      {
        type: 'ul',
        items: [
          { text: 'Group related tabs into workflows' },
          { text: 'Show your recent work and the page that was active last' },
          { text: 'Let you open one saved tab or reopen a whole workflow' },
          { text: 'Show an optional return reminder if you turn it on' },
          {
            text: 'Apply the pause, exclusion and notification settings you choose',
          },
        ],
      },
      {
        type: 'p',
        text: 'We do not use your saved browser metadata for advertising, and we do not sell it.',
      },
    ],
  },
  {
    id: 'privacy-section-5',
    number: '05',
    tocLabel: '5. Where your data is stored',
    title: 'Where your data is stored',
    blocks: [
      {
        type: 'p',
        text: 'Saved workflow data stays in Chrome’s local extension storage on your device. The current prototype does not upload or sync it to a Tabfino server, so we do not receive it and cannot access or recover it for you.',
      },
      {
        type: 'p',
        text: 'Local storage is tied to your Chrome profile and this device. Removing the extension, clearing its data, or resetting Chrome can permanently remove what it saved.',
      },
    ],
  },
  {
    id: 'privacy-section-6',
    number: '06',
    tocLabel: '6. Permissions Tabfino requests',
    title: 'Permissions Tabfino requests',
    blocks: [
      {
        type: 'table',
        headers: ['Chrome permission', 'Needed for', 'Required?'],
        rows: [
          [
            'Tabs',
            'Read tab titles and URLs, and detect which tab is active',
            'Yes',
          ],
          [
            'Storage',
            'Keep saved workflows and settings on your device',
            'Yes',
          ],
          [
            'Notifications',
            'Show the optional return reminder',
            'Only for reminders',
          ],
          [
            'Idle',
            'Detect a period of device inactivity to time the reminder',
            'Only for reminders',
          ],
        ],
      },
      {
        type: 'p',
        text: 'Chrome’s idle signal is system wide, so it may reflect activity outside the browser. Tabfino uses it only to time a reminder and does not receive details of what you did.',
      },
    ],
  },
  {
    id: 'privacy-section-7',
    number: '07',
    tocLabel: '7. How long we keep data',
    title: 'How long we keep data',
    blocks: [
      {
        type: 'p',
        text: 'Saved browser metadata stays on your device until you delete it in Settings, remove the extension, or clear the extension’s data. [IF YOU ADD AUTOMATIC EXPIRY, DESCRIBE IT HERE.]',
      },
      {
        type: 'p',
        text: 'For information you send us directly, we keep it as long as needed to respond and for [RETENTION PERIOD], unless the law requires longer.',
      },
    ],
  },
  {
    id: 'privacy-section-8',
    number: '08',
    tocLabel: '8. Your choices and controls',
    title: 'Your choices and controls',
    blocks: [
      {
        type: 'ul',
        items: [
          {
            bold: 'Pause memory',
            text: ': stop Tabfino from saving new activity.',
          },
          {
            bold: 'Exclude websites',
            text: ': keep private sites out of what is saved.',
          },
          {
            bold: 'Notification details',
            text: ': control what a reminder shows.',
          },
          {
            bold: 'Delete saved activity',
            text: ': remove saved workflows from Settings.',
          },
          {
            bold: 'Uninstall',
            text: ': remove the extension and its local data from Chrome.',
          },
        ],
      },
    ],
  },
  {
    id: 'privacy-section-9',
    number: '09',
    tocLabel: '9. Your rights',
    title: 'Your rights',
    blocks: [
      {
        type: 'p',
        text: 'Depending on where you live, you may have rights over personal data we hold, such as the right to access, correct, delete, restrict or object to its use, to withdraw consent, and to complain to a regulator. This can include rights under India’s Digital Personal Data Protection Act, 2023, the EU/UK GDPR, or the California CCPA/CPRA. [CONFIRM WHICH LAWS APPLY TO YOU.]',
      },
      {
        type: 'p',
        text: 'Because saved workflow data stays on your device, you can exercise most of these rights yourself in Settings. For anything we hold, such as messages you sent us, email us at [CONTACT EMAIL].',
      },
    ],
  },
  {
    id: 'privacy-section-10',
    number: '10',
    tocLabel: '10. Security',
    title: 'Security',
    blocks: [
      {
        type: 'p',
        text: 'Saved data is kept in Chrome’s extension storage on your device and is protected by the browser’s own isolation and your device’s security. No system is perfectly secure, and we cannot promise absolute security. Use a device lock and keep Chrome up to date.',
      },
      {
        type: 'p',
        text: 'If a future release adds sync or a server, this policy will be updated before that happens and, where required, we will ask for your consent.',
      },
    ],
  },
  {
    id: 'privacy-section-11',
    number: '11',
    tocLabel: '11. Sharing and third parties',
    title: 'Sharing and third parties',
    blocks: [
      {
        type: 'p',
        text: 'We do not sell your personal data. We share information only in these cases:',
      },
      {
        type: 'ul',
        items: [
          {
            bold: 'Service providers',
            text: ' that help us run the website or support, under appropriate confidentiality terms. [LIST, IF ANY.]',
          },
          {
            bold: 'Legal reasons',
            text: ', if required by law or to protect rights and safety.',
          },
          {
            bold: 'Business changes',
            text: ', such as a merger or sale, with notice if your data is affected.',
          },
        ],
      },
      {
        type: 'p',
        text: 'The extension is distributed through the Chrome Web Store, operated by Google, which has its own privacy practices.',
      },
    ],
  },
  {
    id: 'privacy-section-12',
    number: '12',
    tocLabel: '12. This website',
    title: 'This website',
    blocks: [
      {
        type: 'p',
        text: '[DESCRIBE WEBSITE DATA HERE. For example: whether the site uses analytics or cookies, which provider processes them, what is collected (such as page views or device type), and how to opt out. If the site collects nothing, state that clearly.]',
      },
      { type: 'h3', text: 'Cookies' },
      {
        type: 'p',
        text: '[STATE WHETHER COOKIES ARE USED. If only essential cookies are used, say so. If analytics or marketing cookies are used, say how consent is requested.]',
      },
      { type: 'h3', text: 'Early access and contact forms' },
      {
        type: 'p',
        text: 'If you join early access or contact us, we use your email and message to reply and share updates you asked for. You can ask us to stop at any time.',
      },
    ],
  },
  {
    id: 'privacy-section-13',
    number: '13',
    tocLabel: '13. International transfers',
    title: 'International transfers',
    blocks: [
      {
        type: 'p',
        text: 'Tabfino’s saved data stays on your device. If we process information you send us in another country, we will use appropriate safeguards where the law requires them. [CONFIRM WHERE YOUR PROVIDERS ARE LOCATED.]',
      },
    ],
  },
  {
    id: 'privacy-section-14',
    number: '14',
    tocLabel: '14. Children’s privacy',
    title: 'Children’s privacy',
    blocks: [
      {
        type: 'p',
        text: 'Tabfino is not directed to children under [AGE: 13 / 16, as applicable to your regions]. We do not knowingly collect personal data from them. If you think a child has sent us information, contact us and we will delete it.',
      },
    ],
  },
  {
    id: 'privacy-section-15',
    number: '15',
    tocLabel: '15. Changes to this policy',
    title: 'Changes to this policy',
    blocks: [
      {
        type: 'p',
        text: 'We may update this policy as Tabfino changes. We will post the new version here with a new “last updated” date and, for material changes, give clearer notice. Continued use after a change means you accept the updated policy, where the law allows.',
      },
    ],
  },
  {
    id: 'privacy-section-16',
    number: '16',
    tocLabel: '16. Contact us',
    title: 'Contact us',
    blocks: [
      {
        type: 'p',
        text: 'Questions, requests or complaints: [CONTACT EMAIL].',
      },
      { type: 'p', text: '[POSTAL ADDRESS, if required.]' },
      {
        type: 'p',
        text: '[IF REQUIRED IN INDIA OR YOUR REGIONS: name and contact of your grievance officer or data protection contact.]',
      },
    ],
  },
];

export const TERMS_FACTS = [
  { label: 'Product', value: 'Chrome extension' },
  { label: 'Your data', value: 'Stays on your device' },
  { label: 'Status', value: 'Early release' },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'terms-section-1',
    number: '01',
    tocLabel: '1. Agreement to these terms',
    title: 'Agreement to these terms',
    blocks: [
      {
        type: 'p',
        text: 'These Terms and Conditions (“Terms”) are a legal agreement between you and [COMPANY / DEVELOPER NAME] (“Tabfino”, “we”, “us”). They apply to your use of the Tabfino Chrome extension and this website. By installing or using Tabfino you agree to them. If you do not agree, do not use Tabfino.',
      },
      {
        type: 'note',
        lead: 'In short:',
        text: 'Tabfino helps you return to browser work. It saves browser metadata on your device. You are responsible for how you use it, and it is provided as is, as an early release.',
      },
    ],
  },
  {
    id: 'terms-section-2',
    number: '02',
    tocLabel: '2. Definitions',
    title: 'Definitions',
    blocks: [
      {
        type: 'ul',
        items: [
          {
            bold: 'Extension',
            text: ': the Tabfino Chrome extension, including updates.',
          },
          { bold: 'Website', text: ': the Tabfino marketing website.' },
          {
            bold: 'Service',
            text: ': the extension and the website together.',
          },
          {
            bold: 'Browser metadata',
            text: ': tab titles, URLs, activity timestamps and which tab was active.',
          },
          {
            bold: 'Workflow',
            text: ': a group of related tabs saved as one work session.',
          },
        ],
      },
    ],
  },
  {
    id: 'terms-section-3',
    number: '03',
    tocLabel: '3. The service',
    title: 'The service',
    blocks: [
      {
        type: 'p',
        text: 'Tabfino remembers the tabs and workflow context you choose to save, groups related tabs into workflows, and lets you open the last active tab, any saved tab, or a whole workflow. It can show an optional return reminder.',
      },
      {
        type: 'p',
        text: 'Tabfino works with Chrome browser tabs only. It does not capture work in desktop apps, and it does not read page content. Availability and features may vary by release.',
      },
    ],
  },
  {
    id: 'terms-section-4',
    number: '04',
    tocLabel: '4. Eligibility and requirements',
    title: 'Eligibility and requirements',
    blocks: [
      {
        type: 'p',
        text: 'You must be old enough to form a binding agreement where you live, or use Tabfino with a parent or guardian’s consent. [MINIMUM AGE: 13 / 16 / 18.]',
      },
      {
        type: 'p',
        text: 'Tabfino requires Chrome and your permission to access tabs. Optional reminders require notification and idle permissions. You are responsible for your device, browser and internet connection.',
      },
    ],
  },
  {
    id: 'terms-section-5',
    number: '05',
    tocLabel: '5. Permissions and your data',
    title: 'Permissions and your data',
    blocks: [
      {
        type: 'p',
        text: 'When you enable Tabfino and grant tab access, you allow it to save browser metadata locally on your device, as described in our Privacy Policy. You can pause memory, exclude websites, control notification details and delete saved activity at any time in Settings.',
      },
      {
        type: 'p',
        text: 'You are responsible for deciding what to save. Exclude any sites you do not want remembered, particularly on shared or work devices.',
      },
    ],
  },
  {
    id: 'terms-section-6',
    number: '06',
    tocLabel: '6. Licence to use Tabfino',
    title: 'Licence to use Tabfino',
    blocks: [
      {
        type: 'p',
        text: 'We grant you a personal, non exclusive, non transferable, revocable licence to install and use the extension for your own purposes, subject to these Terms. [IF OPEN SOURCE: state the licence and how it interacts with these Terms.]',
      },
      { type: 'p', text: 'All rights not granted are reserved.' },
    ],
  },
  {
    id: 'terms-section-7',
    number: '07',
    tocLabel: '7. Acceptable use',
    title: 'Acceptable use',
    blocks: [
      { type: 'p', text: 'You agree not to:' },
      {
        type: 'ul',
        items: [
          {
            text: 'Break the law or infringe anyone’s rights while using Tabfino',
          },
          {
            text: 'Copy, modify, resell or redistribute Tabfino except as the licence allows',
          },
          {
            text: 'Reverse engineer or tamper with the extension, except where the law allows',
          },
          {
            text: 'Interfere with the extension, its distribution, or other people’s use of it',
          },
          {
            text: 'Use Tabfino to monitor another person without their knowledge and consent',
          },
          {
            text: 'Attempt to gain unauthorised access to our systems or accounts',
          },
        ],
      },
    ],
  },
  {
    id: 'terms-section-8',
    number: '08',
    tocLabel: '8. Early access and prototype features',
    title: 'Early access and prototype features',
    blocks: [
      {
        type: 'p',
        text: 'Some features are previews or prototypes. They may change, break, be limited or be removed without notice, and may contain errors. Do not rely on Tabfino as your only record of important work, and keep your own copy of anything critical.',
      },
    ],
  },
  {
    id: 'terms-section-9',
    number: '09',
    tocLabel: '9. Reminders and restored tabs',
    title: 'Reminders and restored tabs',
    blocks: [
      {
        type: 'p',
        text: 'Reminders are based on Chrome’s system wide idle signal and may appear or not appear when you expect. Reopening a workflow opens saved pages in your browser. Pages may have changed, moved, expired or require a sign in, and unsaved changes on a page are not preserved by Tabfino.',
      },
    ],
  },
  {
    id: 'terms-section-10',
    number: '10',
    tocLabel: '10. Your content and feedback',
    title: 'Your content and feedback',
    blocks: [
      {
        type: 'p',
        text: 'The data Tabfino saves about your tabs remains yours. If you send us feedback or ideas, you grant us a free, perpetual licence to use them to improve Tabfino without obligation to you.',
      },
    ],
  },
  {
    id: 'terms-section-11',
    number: '11',
    tocLabel: '11. Intellectual property',
    title: 'Intellectual property',
    blocks: [
      {
        type: 'p',
        text: 'Tabfino, its name, logo, design and code (except any open source parts under their own licences) belong to [COMPANY / DEVELOPER NAME] or its licensors and are protected by law. These Terms do not give you any ownership of them.',
      },
    ],
  },
  {
    id: 'terms-section-12',
    number: '12',
    tocLabel: '12. Third party services',
    title: 'Third party services',
    blocks: [
      {
        type: 'p',
        text: 'Tabfino runs in Google Chrome and is distributed through the Chrome Web Store. Google’s terms and policies apply to those services, and we are not responsible for them or for changes Google makes to Chrome that affect Tabfino.',
      },
    ],
  },
  {
    id: 'terms-section-13',
    number: '13',
    tocLabel: '13. Support and updates',
    title: 'Support and updates',
    blocks: [
      {
        type: 'p',
        text: 'We may provide support through [CONTACT EMAIL] on a reasonable efforts basis. We may update, change or discontinue Tabfino or any feature at any time. Chrome may update the extension automatically.',
      },
    ],
  },
  {
    id: 'terms-section-14',
    number: '14',
    tocLabel: '14. Disclaimer of warranties',
    title: 'Disclaimer of warranties',
    blocks: [
      {
        type: 'p',
        text: 'To the fullest extent permitted by law, Tabfino is provided “as is” and “as available”, without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose and non infringement. We do not promise that it will be uninterrupted or error free, or that it will save or restore every tab in every situation.',
      },
    ],
  },
  {
    id: 'terms-section-15',
    number: '15',
    tocLabel: '15. Limitation of liability',
    title: 'Limitation of liability',
    blocks: [
      {
        type: 'p',
        text: 'To the fullest extent permitted by law, [COMPANY / DEVELOPER NAME] will not be liable for indirect, incidental, special, consequential or punitive damages, or for lost data, lost profits or lost business, arising from your use of Tabfino. Our total liability for any claim is limited to [AMOUNT PAID BY YOU IN THE LAST 12 MONTHS, OR A FIXED AMOUNT]. Nothing in these Terms limits liability that cannot be limited by law.',
      },
    ],
  },
  {
    id: 'terms-section-16',
    number: '16',
    tocLabel: '16. Indemnity',
    title: 'Indemnity',
    blocks: [
      {
        type: 'p',
        text: 'You agree to cover reasonable losses we suffer because you broke these Terms or misused Tabfino, to the extent the law allows. [CONFIRM WHETHER TO INCLUDE, THIS CLAUSE IS OFTEN OMITTED FOR CONSUMER PRODUCTS.]',
      },
    ],
  },
  {
    id: 'terms-section-17',
    number: '17',
    tocLabel: '17. Termination',
    title: 'Termination',
    blocks: [
      {
        type: 'p',
        text: 'You may stop using Tabfino at any time by removing the extension. We may suspend or end your access if you breach these Terms, if required by law, or if we discontinue Tabfino. Sections that by nature should continue (such as intellectual property, disclaimers and liability) survive termination.',
      },
    ],
  },
  {
    id: 'terms-section-18',
    number: '18',
    tocLabel: '18. Changes to these terms',
    title: 'Changes to these terms',
    blocks: [
      {
        type: 'p',
        text: 'We may update these Terms. We will post the new version here with a new “last updated” date and, for material changes, give clearer notice. Continued use after a change means you accept the updated Terms.',
      },
    ],
  },
  {
    id: 'terms-section-19',
    number: '19',
    tocLabel: '19. Governing law and disputes',
    title: 'Governing law and disputes',
    blocks: [
      {
        type: 'p',
        text: 'These Terms are governed by the laws of [JURISDICTION, e.g. India], without regard to conflict of law rules. Disputes will be resolved by [COURTS / VENUE / ARBITRATION SEAT], unless your local consumer law gives you the right to bring a claim elsewhere. We encourage you to contact us first to try to resolve any issue informally.',
      },
    ],
  },
  {
    id: 'terms-section-20',
    number: '20',
    tocLabel: '20. General',
    title: 'General',
    blocks: [
      {
        type: 'ul',
        items: [
          {
            bold: 'Entire agreement',
            text: ': these Terms and the Privacy Policy are the whole agreement between us about Tabfino.',
          },
          {
            bold: 'Severability',
            text: ': if a part is unenforceable, the rest still applies.',
          },
          {
            bold: 'No waiver',
            text: ': not enforcing a term is not a waiver of it.',
          },
          {
            bold: 'Assignment',
            text: ': you may not transfer your rights; we may transfer ours in a business change.',
          },
          {
            bold: 'Force majeure',
            text: ': we are not liable for failures caused by events beyond our reasonable control.',
          },
        ],
      },
    ],
  },
  {
    id: 'terms-section-21',
    number: '21',
    tocLabel: '21. Contact us',
    title: 'Contact us',
    blocks: [
      {
        type: 'p',
        text: 'Questions about these Terms: [CONTACT EMAIL]. [POSTAL ADDRESS, if required.]',
      },
    ],
  },
];
