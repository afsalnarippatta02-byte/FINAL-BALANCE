import { BudgetCategory } from '../types/finance';

/**
 * Keyword mapping dictionary matching common merchant names, purchase types,
 * and description keywords to standard budget category domains.
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Groceries & Supermarkets
  groceries: [
    'grocer', 'supermarket', 'mart', 'market', 'carrefour', 'lulu', 'spinneys', 
    'choithrams', 'viva', 'al maya', 'union coop', 'waitrose', 'reliance', 'dmart', 
    'bigbasket', 'blinkit', 'zepto', 'instamart', 'trader joe', 'whole foods', 
    'safeway', 'aldi', 'lidl', 'kroger', 'costco', 'fruits', 'veggies', 'vegetables', 
    'meat', 'fish', 'milk', 'bakery', 'bread', 'provisions', 'kirana', 'hypermarket',
    'fresh', 'organic', 'foodstuff', 'convenience store', 'bodega'
  ],

  // Dining, Restaurants, Cafes & Food Delivery
  dining: [
    'restaurant', 'cafe', 'coffee', 'starbucks', 'costa', 'tim hortons', 'cafeteria', 
    'mcdonald', 'kfc', 'burger', 'pizza', 'domino', 'subway', 'zomato', 'swiggy', 
    'deliveroo', 'talabat', 'uber eats', 'doordash', 'bistro', 'diner', 'lunch', 
    'dinner', 'breakfast', 'brunch', 'shawarma', 'biryani', 'sushi', 'taco', 
    'bar', 'pub', 'grill', 'nando', 'hardee', 'popeye', 'chai', 'tea', 'dunkin',
    'baskin', 'gelato', 'steakhouse', 'ramen', 'noodles', 'eatery'
  ],

  // Transit, Fuel, Ride-hailing & Travel
  transit: [
    'fuel', 'petrol', 'gas station', 'enoc', 'adnoc', 'emarat', 'shell', 'chevron', 
    'bp', 'exxon', 'uber', 'careem', 'ola', 'lyft', 'taxi', 'cab', 'metro', 'nol', 
    'rta', 'salik', 'fastag', 'toll', 'parking', 'bus', 'train', 'irctc', 'rail', 
    'flight', 'airline', 'airways', 'emirates', 'flydubai', 'air india', 'indigo', 
    'spicejet', 'etihad', 'cleartrip', 'makemytrip', 'booking.com', 'agoda',
    'gas', 'diesel', 'car wash', 'auto service', 'mechanic', 'commute', 'valet'
  ],

  // Utilities, Bills & Telecom
  utilities: [
    'dewa', 'sewa', 'fewa', 'addc', 'aadc', 'electricity', 'electric', 'water bill', 
    'gas bill', 'internet', 'broadband', 'wifi', 'du telecom', 'etisalat', 'e&', 
    'airtel', 'jio', 'vodafone', 'vi bill', 'recharge', 'utility', 'utilities', 
    'mobile postpaid', 'mobile prepaid', 'sewer', 'trash', 'waste', 'cylinder'
  ],

  // Entertainment, Media & Subscriptions
  entertainment: [
    'netflix', 'spotify', 'apple tv', 'apple music', 'youtube', 'prime video', 
    'disney', 'hotstar', 'hulu', 'hbo', 'paramount', 'cinema', 'vox', 'reel', 
    'novocinemas', 'movie', 'ticket', 'bookmyshow', 'gaming', 'playstation', 'psn', 
    'xbox', 'steam', 'nintendo', 'twitch', 'audible', 'patreon', 'amusement', 
    'theme park', 'concert', 'billiards', 'bowling'
  ],

  // Housing, Rent & Home Maintenance
  housing: [
    'rent', 'landlord', 'apartment', 'flat', 'villa', 'housing', 'lease', 'mortgage', 
    'ejari', 'society maintenance', 'building maintenance', 'hoa', 'property',
    'home repair', 'plumber', 'electrician', 'cleaning', 'maid', 'pest control'
  ],

  // Healthcare, Pharmacy & Wellness
  health: [
    'pharmacy', 'pharma', 'chemist', 'drugstore', 'medicine', 'doctor', 'clinic', 
    'hospital', 'dental', 'dentist', 'aster', 'boots', 'life pharmacy', 'apollo', 
    'medplus', '1mg', 'gym', 'fitness', 'optician', 'lenskart', 'eye clinic', 
    'lab test', 'pathology', 'wellness', 'vitamins', 'prescription', 'diagnostic'
  ],

  // Shopping, Retail & Electronics
  shopping: [
    'amazon', 'noon', 'flipkart', 'apple store', 'sharaf dg', 'jumbo', 'virgin', 
    'zara', 'h&m', 'mango', 'shein', 'asos', 'myntra', 'ajio', 'ikea', 'home centre', 
    'pan emirates', 'mall', 'fashion', 'clothing', 'apparel', 'shoes', 'electronics', 
    'laptop', 'gadget', 'retail', 'outlet', 'perfume', 'cosmetics', 'sephora', 'gift'
  ]
};

export interface CategorySuggestion {
  category: BudgetCategory;
  matchedKeyword: string;
  confidence: 'high' | 'medium';
}

/**
 * Finds a matching Category from user's categories for a given key group.
 */
function findCategoryForGroup(group: string, categories: BudgetCategory[]): BudgetCategory | undefined {
  return categories.find(cat => {
    const lower = (cat.id + ' ' + cat.name).toLowerCase();
    switch (group) {
      case 'groceries':
        return lower.includes('grocer') || lower.includes('mart') || lower.includes('food');
      case 'dining':
        return lower.includes('din') || lower.includes('cafe') || lower.includes('restaurant') || lower.includes('food');
      case 'transit':
        return lower.includes('transit') || lower.includes('fuel') || lower.includes('car') || lower.includes('transport') || lower.includes('travel');
      case 'utilities':
        return lower.includes('util') || lower.includes('bill') || lower.includes('power');
      case 'entertainment':
        return lower.includes('entertain') || lower.includes('sub') || lower.includes('tv') || lower.includes('media');
      case 'housing':
        return lower.includes('hous') || lower.includes('rent') || lower.includes('home');
      case 'health':
        return lower.includes('health') || lower.includes('pharm') || lower.includes('med');
      case 'shopping':
        return lower.includes('shop') || lower.includes('retail') || lower.includes('electron');
      default:
        return lower.includes(group);
    }
  });
}

/**
 * Suggests a budget category based on transaction description / merchant name.
 * Performs direct category name matching and dictionary keyword matching.
 */
export function suggestCategoryFromDescription(
  description: string,
  categories: BudgetCategory[]
): CategorySuggestion | null {
  if (!description || !description.trim() || !categories || categories.length === 0) {
    return null;
  }

  const clean = description.toLowerCase().trim();
  const words = clean.split(/[\s,._\-\/\\#()]+/).filter(Boolean);

  // 1. Direct matching against user's category names
  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase();
    
    // Substring match with full category name (e.g. "groceries" in "groceries bill")
    if (clean.includes(catNameLower)) {
      return { category: cat, matchedKeyword: cat.name, confidence: 'high' };
    }

    // Match individual significant words in the category name
    const catWords = catNameLower.split(/[\s&/\\-]+/).filter(w => w.length > 2);
    for (const cw of catWords) {
      if (words.includes(cw)) {
        return { category: cat, matchedKeyword: cw, confidence: 'high' };
      }
    }
  }

  // 2. Keyword rules matching
  for (const [group, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const targetCategory = findCategoryForGroup(group, categories);
    if (!targetCategory) continue;

    for (const kw of keywords) {
      // Exact token match (e.g., "starbucks" or "uber")
      if (words.includes(kw)) {
        return { category: targetCategory, matchedKeyword: kw, confidence: 'high' };
      }

      // Multi-word phrase or substring match for longer keywords
      if (kw.includes(' ') && clean.includes(kw)) {
        return { category: targetCategory, matchedKeyword: kw, confidence: 'high' };
      }

      if (kw.length >= 4 && clean.includes(kw)) {
        return { category: targetCategory, matchedKeyword: kw, confidence: 'medium' };
      }
    }
  }

  return null;
}
