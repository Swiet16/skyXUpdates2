export const CATEGORIES = [
  'Interview', 'Job Offer', 'Welcome', 'Product Update', 'Newsletter', 
  'Promotion', 'Event Invite', 'Webinar', 'Order Confirm', 'Invoice', 
  'Password Reset', 'Verify Account', 'Survey', 'Thank You', 'Re-engagement', 
  'Meeting Reminder', 'Birthday', 'Abandoned Cart', 'Shipping', 'Renewal'
] as const;

export type Category = typeof CATEGORIES[number];

export const LAYOUTS = [
  'Banner Hero', 'Split Header', 'Minimal Letter', 'Dark Card', 
  'Icon Steps', 'Sidebar Stat', 'Outline Frame', 'Gradient Mesh', 
  'Long-Form Story', 'Magazine Grid', 'Digest List'
] as const;

export type Layout = typeof LAYOUTS[number];

export interface Template {
  id: string;
  filename: string;
  category: Category;
  layout: Layout;
  companyName: string;
  subjectLine: string;
  description: string;
  colorAccent: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'tpl-001',
    filename: 'interview-01.html',
    category: 'Interview',
    layout: 'Minimal Letter',
    companyName: 'Vercel',
    subjectLine: 'Invitation to Interview — Frontend Engineer',
    description: 'Clean, professional interview invitation with calendar links.',
    colorAccent: '#ffffff'
  },
  {
    id: 'tpl-002',
    filename: 'welcome-onboard.html',
    category: 'Welcome',
    layout: 'Banner Hero',
    companyName: 'Linear',
    subjectLine: 'Welcome to Linear',
    description: 'High-impact welcome email with quick start steps.',
    colorAccent: '#5e6ad2'
  },
  {
    id: 'tpl-003',
    filename: 'newsletter-digest.html',
    category: 'Newsletter',
    layout: 'Digest List',
    companyName: 'Figma',
    subjectLine: 'Your Weekly Design Digest',
    description: 'Scannable list of articles and community highlights.',
    colorAccent: '#f24e1e'
  },
  {
    id: 'tpl-004',
    filename: 'reset-pwd.html',
    category: 'Password Reset',
    layout: 'Outline Frame',
    companyName: 'Stripe',
    subjectLine: 'Reset your Stripe password',
    description: 'Simple, secure-looking password reset form.',
    colorAccent: '#635bff'
  },
  {
    id: 'tpl-005',
    filename: 'invoice-01.html',
    category: 'Invoice',
    layout: 'Split Header',
    companyName: 'AWS',
    subjectLine: 'Your AWS Invoice for March 2024',
    description: 'Detailed billing summary with tabular data breakdown.',
    colorAccent: '#ff9900'
  },
  {
    id: 'tpl-006',
    filename: 'product-update-24.html',
    category: 'Product Update',
    layout: 'Magazine Grid',
    companyName: 'Raycast',
    subjectLine: 'Raycast 1.66: Pro Features and more',
    description: 'Multi-column grid showcasing new features with screenshots.',
    colorAccent: '#ff6363'
  },
  {
    id: 'tpl-007',
    filename: 'job-offer.html',
    category: 'Job Offer',
    layout: 'Long-Form Story',
    companyName: 'OpenAI',
    subjectLine: 'Offer of Employment from OpenAI',
    description: 'Text-heavy but highly legible formal offer letter.',
    colorAccent: '#10a37f'
  },
  {
    id: 'tpl-008',
    filename: 'event-invite.html',
    category: 'Event Invite',
    layout: 'Gradient Mesh',
    companyName: 'Apple',
    subjectLine: 'Join us at WWDC24',
    description: 'Visual-heavy invitation with dark gradient background.',
    colorAccent: '#0071e3'
  },
  {
    id: 'tpl-009',
    filename: 'order-confirm.html',
    category: 'Order Confirm',
    layout: 'Icon Steps',
    companyName: 'Nike',
    subjectLine: 'Your Nike Order is Confirmed',
    description: 'Visual timeline of order processing and items list.',
    colorAccent: '#111111'
  },
  {
    id: 'tpl-010',
    filename: 'shipping-update.html',
    category: 'Shipping',
    layout: 'Sidebar Stat',
    companyName: 'Amazon',
    subjectLine: 'Your package is out for delivery',
    description: 'Tracking map layout with delivery timeframe highlighted.',
    colorAccent: '#ff9900'
  },
  {
    id: 'tpl-011',
    filename: 'abandoned-cart.html',
    category: 'Abandoned Cart',
    layout: 'Banner Hero',
    companyName: 'Shopify',
    subjectLine: 'Did you forget something?',
    description: 'Gentle reminder with product image and direct checkout CTA.',
    colorAccent: '#95bf47'
  },
  {
    id: 'tpl-012',
    filename: 'birthday-gift.html',
    category: 'Birthday',
    layout: 'Dark Card',
    companyName: 'Starbucks',
    subjectLine: 'Happy Birthday! A free drink on us',
    description: 'Dark-themed celebratory card with a prominent reward code.',
    colorAccent: '#00704a'
  },
  {
    id: 'tpl-013',
    filename: 'survey-feedback.html',
    category: 'Survey',
    layout: 'Minimal Letter',
    companyName: 'Notion',
    subjectLine: 'How is your Notion workspace?',
    description: 'Short personal note requesting feedback with a single primary button.',
    colorAccent: '#000000'
  },
  {
    id: 'tpl-014',
    filename: 'webinar-invite.html',
    category: 'Webinar',
    layout: 'Split Header',
    companyName: 'Zoom',
    subjectLine: 'Upcoming Webinar: Future of Work',
    description: 'Speaker bios and schedule structured side-by-side.',
    colorAccent: '#2D8CFF'
  },
  {
    id: 'tpl-015',
    filename: 'reengagement.html',
    category: 'Re-engagement',
    layout: 'Outline Frame',
    companyName: 'Duolingo',
    subjectLine: 'We miss you!',
    description: 'Playful message with an avatar to bring the user back.',
    colorAccent: '#58cc02'
  },
  {
    id: 'tpl-016',
    filename: 'verify-account.html',
    category: 'Verify Account',
    layout: 'Icon Steps',
    companyName: 'GitHub',
    subjectLine: 'Please verify your email address',
    description: 'Clear, high-contrast action button centered on the page.',
    colorAccent: '#2b3137'
  },
  {
    id: 'tpl-017',
    filename: 'thank-you.html',
    category: 'Thank You',
    layout: 'Minimal Letter',
    companyName: 'Patagonia',
    subjectLine: 'Thank you for your purchase',
    description: 'Brand-focused message appreciating the customer.',
    colorAccent: '#4c2e8a'
  },
  {
    id: 'tpl-018',
    filename: 'meeting-reminder.html',
    category: 'Meeting Reminder',
    layout: 'Sidebar Stat',
    companyName: 'Calendly',
    subjectLine: 'Reminder: Upcoming meeting with Alex',
    description: 'Date, time, and join link separated into a clear sidebar.',
    colorAccent: '#006bff'
  },
  {
    id: 'tpl-019',
    filename: 'renewal-notice.html',
    category: 'Renewal',
    layout: 'Dark Card',
    companyName: 'Spotify',
    subjectLine: 'Your Premium subscription is renewing soon',
    description: 'Sleek dark design summarizing the upcoming charge.',
    colorAccent: '#1db954'
  },
  {
    id: 'tpl-020',
    filename: 'promo-sale.html',
    category: 'Promotion',
    layout: 'Banner Hero',
    companyName: 'Tesla',
    subjectLine: 'New Inventory Available',
    description: 'Hero image of product with limited-time offer messaging.',
    colorAccent: '#e82127'
  },
  {
    id: 'tpl-021',
    filename: 'product-launch.html',
    category: 'Product Update',
    layout: 'Magazine Grid',
    companyName: 'Supabase',
    subjectLine: 'Supabase Launch Week 8',
    description: 'Daily announcements presented in a structured grid.',
    colorAccent: '#3ecf8e'
  },
  {
    id: 'tpl-022',
    filename: 'investor-update.html',
    category: 'Newsletter',
    layout: 'Long-Form Story',
    companyName: 'Acme Corp',
    subjectLine: 'Q3 Investor Update',
    description: 'Detailed plain text format focusing on metrics and narrative.',
    colorAccent: '#3b82f6'
  },
  {
    id: 'tpl-023',
    filename: 'welcome-series-2.html',
    category: 'Welcome',
    layout: 'Icon Steps',
    companyName: 'Arc',
    subjectLine: 'Getting the most out of Arc',
    description: 'Features highlighted with small icons and brief text.',
    colorAccent: '#ff6c8b'
  },
  {
    id: 'tpl-024',
    filename: 'invoice-paid.html',
    category: 'Invoice',
    layout: 'Minimal Letter',
    companyName: 'Vercel',
    subjectLine: 'Payment Receipt - Vercel',
    description: 'Simple confirmation of successful payment.',
    colorAccent: '#000000'
  },
  {
    id: 'tpl-025',
    filename: 'interview-prep.html',
    category: 'Interview',
    layout: 'Split Header',
    companyName: 'Google',
    subjectLine: 'Preparation guide for your upcoming interview',
    description: 'Links to resources and what to expect on the day.',
    colorAccent: '#4285f4'
  },
  {
    id: 'tpl-026',
    filename: 'abandoned-cart-2.html',
    category: 'Abandoned Cart',
    layout: 'Outline Frame',
    companyName: 'IKEA',
    subjectLine: 'Your cart is waiting',
    description: 'Minimalist product showcase with a framed border.',
    colorAccent: '#0058a3'
  },
  {
    id: 'tpl-027',
    filename: 'birthday-internal.html',
    category: 'Birthday',
    layout: 'Gradient Mesh',
    companyName: 'Slack',
    subjectLine: 'Happy Birthday from the team!',
    description: 'Fun, vibrant layout for internal team birthdays.',
    colorAccent: '#e01e5a'
  },
  {
    id: 'tpl-028',
    filename: 'shipping-delivered.html',
    category: 'Shipping',
    layout: 'Icon Steps',
    companyName: 'FedEx',
    subjectLine: 'Package Delivered',
    description: 'Confirmation of delivery with final location details.',
    colorAccent: '#4d148c'
  },
  {
    id: 'tpl-029',
    filename: 'survey-nps.html',
    category: 'Survey',
    layout: 'Banner Hero',
    companyName: 'Typeform',
    subjectLine: 'How likely are you to recommend us?',
    description: 'Interactive 1-10 scoring embedded directly in email.',
    colorAccent: '#191919'
  },
  {
    id: 'tpl-030',
    filename: 'event-reminder.html',
    category: 'Event Invite',
    layout: 'Dark Card',
    companyName: 'Secret Cinema',
    subjectLine: 'Your mission begins tomorrow',
    description: 'Thematic dark email to build excitement before an event.',
    colorAccent: '#c72b2b'
  },
  {
    id: 'tpl-031',
    filename: 'renewal-success.html',
    category: 'Renewal',
    layout: 'Minimal Letter',
    companyName: '1Password',
    subjectLine: 'Your subscription has been renewed',
    description: 'Reassurance of continued service with zero friction.',
    colorAccent: '#2b5ee5'
  },
  {
    id: 'tpl-032',
    filename: 'promo-flash.html',
    category: 'Promotion',
    layout: 'Banner Hero',
    companyName: 'Glossier',
    subjectLine: 'Flash Sale: 20% off everything',
    description: 'High urgency imagery with direct link to shop.',
    colorAccent: '#f0e6e6'
  },
  {
    id: 'tpl-033',
    filename: 'meeting-cancel.html',
    category: 'Meeting Reminder',
    layout: 'Split Header',
    companyName: 'Cron',
    subjectLine: 'Canceled: Sync with Design Team',
    description: 'Clear notice of cancellation with option to reschedule.',
    colorAccent: '#e34e32'
  },
  {
    id: 'tpl-034',
    filename: 'webinar-recording.html',
    category: 'Webinar',
    layout: 'Banner Hero',
    companyName: 'Loom',
    subjectLine: 'Recording: How to communicate async',
    description: 'Video thumbnail overlay with play button.',
    colorAccent: '#625df5'
  },
  {
    id: 'tpl-035',
    filename: 'thank-you-donation.html',
    category: 'Thank You',
    layout: 'Long-Form Story',
    companyName: 'Charity: Water',
    subjectLine: 'Your impact in 2024',
    description: 'Emotional storytelling regarding the donor\'s contribution.',
    colorAccent: '#ffc843'
  },
  {
    id: 'tpl-036',
    filename: 'verify-device.html',
    category: 'Verify Account',
    layout: 'Outline Frame',
    companyName: 'Auth0',
    subjectLine: 'New device sign-in detected',
    description: 'Security alert prompting user to verify unrecognized device.',
    colorAccent: '#eb5424'
  },
  {
    id: 'tpl-037',
    filename: 'reengagement-offer.html',
    category: 'Re-engagement',
    layout: 'Dark Card',
    companyName: 'UberEats',
    subjectLine: 'Here is $15 on us',
    description: 'Financial incentive to win back inactive user.',
    colorAccent: '#06c167'
  },
  {
    id: 'tpl-038',
    filename: 'order-shipped.html',
    category: 'Order Confirm',
    layout: 'Icon Steps',
    companyName: 'Apple',
    subjectLine: 'Your item has shipped',
    description: 'Sleek progress bar showing it left the warehouse.',
    colorAccent: '#000000'
  },
  {
    id: 'tpl-039',
    filename: 'newsletter-tech.html',
    category: 'Newsletter',
    layout: 'Digest List',
    companyName: 'HackerNews',
    subjectLine: 'Top stories this week',
    description: 'Dense list of links for quick scanning.',
    colorAccent: '#ff6600'
  },
  {
    id: 'tpl-040',
    filename: 'job-offer-reject.html',
    category: 'Job Offer',
    layout: 'Minimal Letter',
    companyName: 'Meta',
    subjectLine: 'Update regarding your application',
    description: 'Polite, concise rejection notice.',
    colorAccent: '#0668E1'
  }
];
