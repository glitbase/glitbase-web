/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';

export interface ServiceSuggestion {
  name: string;
  variations: string[];
  category: string;
  popularity?: number;
  trending?: boolean;
}

// Comprehensive service taxonomy based on beauty and wellness industry
const serviceTaxonomy: ServiceSuggestion[] = [
  // Hair Services
  {
    name: 'haircut',
    variations: [
      'hair cut',
      'hair cutting',
      'cut hair',
      'trim hair',
      'hairstyle',
    ],
    category: 'hair',
    popularity: 95,
    trending: true,
  },
  {
    name: 'hair coloring',
    variations: [
      'hair dye',
      'color hair',
      'hair tint',
      'highlights',
      'lowlights',
      'balayage',
      'ombre',
    ],
    category: 'hair',
    popularity: 88,
    trending: true,
  },
  {
    name: 'blowout',
    variations: ['blow dry', 'hair styling', 'blow out'],
    category: 'hair',
    popularity: 82,
    trending: false,
  },
  {
    name: 'hair treatment',
    variations: [
      'deep conditioning',
      'keratin treatment',
      'hair spa',
      'hair mask',
    ],
    category: 'hair',
    popularity: 75,
    trending: false,
  },
  {
    name: 'braids',
    variations: ['braiding', 'cornrows', 'box braids', 'french braids'],
    category: 'hair',
    popularity: 70,
    trending: false,
  },
  {
    name: 'hair extensions',
    variations: ['weave', 'hair weaving', 'extensions'],
    category: 'hair',
    popularity: 68,
    trending: false,
  },

  // Nails
  {
    name: 'manicure',
    variations: ['mani', 'nail polish', 'nail care', 'hand care'],
    category: 'nails',
    popularity: 90,
    trending: true,
  },
  {
    name: 'pedicure',
    variations: ['pedi', 'foot care', 'toe nails'],
    category: 'nails',
    popularity: 88,
    trending: false,
  },
  {
    name: 'gel nails',
    variations: ['gel polish', 'gel manicure', 'shellac'],
    category: 'nails',
    popularity: 85,
    trending: true,
  },
  {
    name: 'acrylic nails',
    variations: ['acrylics', 'fake nails', 'nail extensions'],
    category: 'nails',
    popularity: 80,
    trending: false,
  },
  {
    name: 'nail art',
    variations: ['nail design', 'nail decoration', 'custom nails'],
    category: 'nails',
    popularity: 75,
    trending: false,
  },

  // Skin Care
  {
    name: 'facial',
    variations: ['face treatment', 'facial treatment', 'skin treatment'],
    category: 'skincare',
    popularity: 92,
    trending: true,
  },
  {
    name: 'chemical peel',
    variations: ['peel', 'skin peel', 'acid peel'],
    category: 'skincare',
    popularity: 65,
    trending: false,
  },
  {
    name: 'microdermabrasion',
    variations: ['micro derm', 'dermabrasion'],
    category: 'skincare',
    popularity: 60,
    trending: false,
  },
  {
    name: 'acne treatment',
    variations: ['acne care', 'pimple treatment', 'blemish treatment'],
    category: 'skincare',
    popularity: 72,
    trending: false,
  },

  // Makeup
  {
    name: 'makeup',
    variations: ['make up', 'cosmetics', 'beauty makeup'],
    category: 'makeup',
    popularity: 85,
    trending: true,
  },
  {
    name: 'bridal makeup',
    variations: ['wedding makeup', 'bride makeup'],
    category: 'makeup',
    popularity: 78,
    trending: false,
  },
  {
    name: 'special occasion makeup',
    variations: ['party makeup', 'event makeup', 'prom makeup'],
    category: 'makeup',
    popularity: 70,
    trending: false,
  },

  // Body
  {
    name: 'massage',
    variations: ['body massage', 'relaxation massage', 'therapeutic massage'],
    category: 'body',
    popularity: 88,
    trending: true,
  },
  {
    name: 'waxing',
    variations: ['hair removal', 'body waxing', 'wax'],
    category: 'body',
    popularity: 82,
    trending: false,
  },
  {
    name: 'body scrub',
    variations: ['exfoliation', 'body polish'],
    category: 'body',
    popularity: 65,
    trending: false,
  },
  {
    name: 'spray tan',
    variations: ['tanning', 'airbrush tan', 'fake tan'],
    category: 'body',
    popularity: 60,
    trending: false,
  },

  // Brows & Lashes
  {
    name: 'eyebrow shaping',
    variations: [
      'brow shaping',
      'eyebrow threading',
      'brow wax',
      'eyebrow tint',
    ],
    category: 'brows',
    popularity: 80,
    trending: true,
  },
  {
    name: 'eyelash extensions',
    variations: ['lash extensions', 'false lashes', 'eyelashes'],
    category: 'lashes',
    popularity: 85,
    trending: true,
  },
  {
    name: 'lash lift',
    variations: ['lash perm', 'lash curl'],
    category: 'lashes',
    popularity: 75,
    trending: true,
  },
  {
    name: 'brow lamination',
    variations: ['brow lift', 'brow perm'],
    category: 'brows',
    popularity: 70,
    trending: true,
  },

  // Men's Services
  {
    name: 'beard trim',
    variations: ['beard grooming', 'beard shaping', 'beard cut'],
    category: 'mens',
    popularity: 75,
    trending: false,
  },
  {
    name: 'mens haircut',
    variations: ['barber', 'mens cut', 'gentleman cut'],
    category: 'mens',
    popularity: 90,
    trending: false,
  },

  // Specialized
  {
    name: 'botox',
    variations: ['botulinum', 'wrinkle treatment', 'anti-aging injection'],
    category: 'aesthetics',
    popularity: 70,
    trending: true,
  },
  {
    name: 'fillers',
    variations: ['dermal fillers', 'lip fillers', 'face fillers'],
    category: 'aesthetics',
    popularity: 68,
    trending: true,
  },
  {
    name: 'laser hair removal',
    variations: ['laser removal', 'permanent hair removal'],
    category: 'laser',
    popularity: 77,
    trending: false,
  },
];

// Trending searches that appear when no query is entered
const trendingSearches = [
  'Botox treatment',
  'Protective Styles',
  'Makeup',
  'Knotless braids',
  'Blab nails',
  'Wispy lashes',
];

interface UseServiceSearchReturn {
  suggestions: ServiceSuggestion[];
  isLoading: boolean;
  error: string | null;
  getTrendingSearches: () => string[];
}

export const useServiceSearch = (
  query: string,
  minMatchLength: number = 2
): UseServiceSearchReturn => {
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configure Fuse.js for fuzzy searching
  const fuse = useMemo(
    () =>
      new Fuse(serviceTaxonomy, {
        keys: [
          { name: 'name', weight: 2 },
          { name: 'variations', weight: 1.5 },
          { name: 'category', weight: 0.5 },
        ],
        threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
        includeScore: true,
        minMatchCharLength: minMatchLength,
        ignoreLocation: true,
      }),
    [minMatchLength]
  );

  const getTrendingSearches = (): string[] => {
    return trendingSearches;
  };

  useEffect(() => {
    const performSearch = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If query is empty, return trending services
        if (!query || query.trim().length < minMatchLength) {
          const trending = serviceTaxonomy
            .filter((service) => service.trending)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 8);

          setSuggestions(trending);
          setIsLoading(false);
          return;
        }

        // Perform fuzzy search
        const results = fuse.search(query);

        // Transform results and sort by score and popularity
        const sortedSuggestions = results
          .map((result) => ({
            ...result.item,
            score: result.score || 1,
          }))
          .sort((a, b) => {
            // First sort by match score (lower is better in Fuse.js)
            if (a.score !== b.score) {
              return a.score - b.score;
            }
            // Then by popularity
            return (b.popularity || 0) - (a.popularity || 0);
          })
          .slice(0, 8);

        setSuggestions(sortedSuggestions);
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed');

        // Fallback to simple string matching
        const fallbackResults = serviceTaxonomy
          .filter((service) => {
            const searchLower = query.toLowerCase();
            return (
              service.name.toLowerCase().includes(searchLower) ||
              service.variations.some((v) =>
                v.toLowerCase().includes(searchLower)
              )
            );
          })
          .slice(0, 8);

        setSuggestions(fallbackResults);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query, fuse, minMatchLength]);

  return {
    suggestions,
    isLoading,
    error,
    getTrendingSearches,
  };
};
