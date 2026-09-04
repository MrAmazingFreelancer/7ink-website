// Content index used by the ChatGPT Codex Connector (see api/codex-connector.ts).
// Not deployed as its own route: files under api/_lib are excluded from Vercel's
// automatic Serverless Function routing, but are bundled as regular imports.
import listings from '../../listings.json';

export interface CodexDocument {
  id: string;
  title: string;
  url: string;
  text: string;
}

interface Listing {
  name: string;
  logo?: string;
  url: string;
  category: string;
  featured?: boolean;
}

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://7ink.com.au';

const STATIC_PAGES: CodexDocument[] = [
  {
    id: 'page-home',
    title: '7ink - Home',
    url: `${SITE_ORIGIN}/`,
    text: '7ink.com.au is the marketing website for 7ink, showcasing services, portfolio work, blog articles and a business directory of featured partners.'
  },
  {
    id: 'page-services',
    title: '7ink - Services',
    url: `${SITE_ORIGIN}/service-details.html`,
    text: 'Details about the services offered by 7ink, including design, consulting and creative production work.'
  },
  {
    id: 'page-portfolio',
    title: '7ink - Portfolio',
    url: `${SITE_ORIGIN}/portfolio-details.html`,
    text: 'Portfolio case studies and project details showcasing past 7ink work.'
  },
  {
    id: 'page-blog',
    title: '7ink - Blog',
    url: `${SITE_ORIGIN}/blog.html`,
    text: 'The 7ink blog, featuring articles and updates related to the business and its industry.'
  }
];

function listingToDocument(listing: Listing, index: number): CodexDocument {
  const featuredNote = listing.featured ? ' It is marked as a featured listing.' : '';
  return {
    id: `listing-${index}`,
    title: listing.name,
    url: listing.url,
    text: `${listing.name} is listed in the 7ink directory under the "${listing.category}" category.${featuredNote}`
  };
}

export function getContentIndex(): CodexDocument[] {
  const listingDocuments = (listings as Listing[]).map(listingToDocument);
  return [...STATIC_PAGES, ...listingDocuments];
}

export function searchContent(query: string): Array<Pick<CodexDocument, 'id' | 'title' | 'url'>> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return getContentIndex()
    .filter((doc) => doc.title.toLowerCase().includes(normalized) || doc.text.toLowerCase().includes(normalized))
    .map(({ id, title, url }) => ({ id, title, url }));
}

export function fetchContent(id: string): CodexDocument | undefined {
  return getContentIndex().find((doc) => doc.id === id);
}
