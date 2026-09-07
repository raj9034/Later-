import {
  ContentType,
  DetectedAnalysis,
  IntentType,
  SavedItem,
  SchedulePreset,
  TemporalType,
} from '../types';
import { parseNaturalDateTime } from './naturalLanguageTime';

/**
 * Intelligent entity and topic extraction dictionaries & heuristics
 */
const KNOWN_PEOPLE_NAMES = [
  'Rahul',
  'Arjun',
  'Jason',
  'Sarah',
  'Alex',
  'David',
  'Priya',
  'Elena',
  'Sam',
  'John',
  'Emma',
  'Michael',
  'Chris',
  'Maya',
  'Mom',
  'Dad',
  'Sister',
  'Brother',
  'Boss',
  'Doctor',
  'Dentist',
  'Professor',
];

const KNOWN_PLACES = [
  'Kyoto',
  'Tokyo',
  'Japan',
  'San Francisco',
  'New York',
  'London',
  'Paris',
  'Berlin',
  'Bangalore',
  'Mumbai',
  'Seattle',
  'Austin',
  'Blue Bottle',
  'Cafe',
  'Crafts Gallery',
  'Library',
  'Museum',
  'Airport',
  'Gym',
  'Studio',
  'Restaurant',
  'Bakery',
  'Park',
];

const TOPIC_KEYWORDS: Record<string, string[]> = {
  woodworking: ['woodworking', 'kigumi', 'joinery', 'timber', 'carpentry', 'craft', 'furniture'],
  hardware: ['keyboard', 'split', 'oled', 'corne', 'pcb', 'solder', 'electronics', 'gadget', 'mcu', 'display'],
  audio: ['audio', 'spatial', 'sound', 'synthesizer', 'latency', 'headphones', 'music', 'dsp', 'acoustic'],
  startup: ['startup', 'founder', 'mvp', 'pitch', 'product', 'saas', 'business', 'venture', 'growth', 'idea'],
  tax_finance: ['tax', 'taxes', 'receipt', 'receipts', 'invoice', 'expense', 'accounting', 'budget', 'salary'],
  design: ['design', 'typography', 'interface', 'ui', 'ux', 'linear', 'figma', 'layout', 'minimalist', 'aesthetic'],
  travel: ['visit', 'flight', 'hotel', 'japan', 'kyoto', 'trip', 'explore', 'vacation', 'itinerary', 'destination'],
  education: ['exams', 'exam', 'study', 'class', 'lecture', 'course', 'school', 'university', 'research', 'paper'],
  development: ['code', 'github', 'api', 'deploy', 'react', 'typescript', 'server', 'database', 'frontend', 'backend'],
  health: ['doctor', 'dentist', 'workout', 'run', 'gym', 'health', 'medicine', 'checkup'],
  food: ['coffee', 'ramen', 'dinner', 'lunch', 'cafe', 'restaurant', 'recipe', 'cooking', 'bakery', 'table'],
};

/**
 * Universal content understanding parser
 */
export function analyzeContent(
  input: string,
  imageAttachment?: string
): DetectedAnalysis {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  // 1. Image / Screenshot Attached
  if (imageAttachment) {
    const isScreenshot =
      lower.includes('screenshot') ||
      raw.length === 0 ||
      lower.includes('screen') ||
      lower.includes('ui') ||
      lower.includes('app');

    const contentType: ContentType = isScreenshot ? 'screenshot' : 'image';
    const intent: IntentType = 'remember';
    const title = raw || (isScreenshot ? 'Captured screenshot' : 'Saved image');
    const { reminderTime, temporalType, schedulePreset } = inferTimeAndSchedule(raw, intent);
    const { people, places, topics } = extractEntities(raw);

    return {
      contentType,
      type: contentType,
      intent,
      title,
      summary: raw ? `Image attachment with note: "${raw}"` : 'Visual memory captured for later review',
      rawInput: raw || 'Attached image/screenshot',
      temporalType,
      reminderTime,
      schedulePreset,
      people,
      places,
      topics: topics.length > 0 ? topics : ['visual', 'screenshot'],
      imageAttachment,
    };
  }

  // 2. URL and Link Analysis
  const isUrl =
    /^https?:\/\//i.test(raw) ||
    /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(raw);

  if (isUrl) {
    const fullUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let domain = '';
    try {
      const parsed = new URL(fullUrl);
      domain = parsed.hostname.replace(/^www\./, '');
    } catch {
      domain = 'web';
    }

    // Video Detection
    if (
      domain.includes('youtube.com') ||
      domain.includes('youtu.be') ||
      domain.includes('vimeo.com') ||
      domain.includes('twitch.tv') ||
      domain.includes('tiktok.com') ||
      domain.includes('loom.com') ||
      lower.includes('.mp4')
    ) {
      const videoTitle = deriveTitleFromUrl(fullUrl, domain, 'Video');
      const formattedTitle = videoTitle.startsWith('Watch:') ? videoTitle : `Watch: ${videoTitle}`;
      const intent: IntentType = 'watch';
      const { reminderTime, temporalType, schedulePreset } = inferTimeAndSchedule(raw, intent, 'tonight');
      const { people, places, topics } = extractEntities(`${formattedTitle} ${fullUrl}`);

      return {
        contentType: 'video',
        type: 'video',
        intent,
        title: formattedTitle,
        summary: `Video stream on ${domain.includes('youtube') ? 'YouTube' : domain}`,
        rawInput: raw,
        temporalType,
        reminderTime,
        schedulePreset,
        people,
        places,
        topics: topics.length > 0 ? topics : ['video', 'media'],
        url: fullUrl,
        sourceDomain: domain.includes('youtube') ? 'YouTube' : domain,
        extractedMeta: {
          platform: domain.includes('youtube') ? 'YouTube' : 'Video',
        },
      };
    }

    // Place / Maps Detection
    if (
      domain.includes('maps.google.') ||
      domain.includes('goo.gl/maps') ||
      domain.includes('apple.com/maps') ||
      domain.includes('yelp.com') ||
      domain.includes('foursquare.com')
    ) {
      const placeName = deriveTitleFromUrl(fullUrl, domain, 'Location');
      const intent: IntentType = 'visit';
      const { reminderTime, temporalType, schedulePreset } = inferTimeAndSchedule(raw, intent, 'this_weekend');
      const { people, places, topics } = extractEntities(`${placeName} ${fullUrl}`);

      return {
        contentType: 'place',
        type: 'place',
        intent,
        title: `Visit ${placeName}`,
        summary: `Location pin on ${domain.includes('google') ? 'Google Maps' : 'Maps'}`,
        rawInput: raw,
        temporalType,
        reminderTime,
        schedulePreset,
        people,
        places: places.length > 0 ? places : [placeName],
        topics: topics.length > 0 ? topics : ['travel', 'place'],
        url: fullUrl,
        sourceDomain: 'Maps',
        extractedMeta: {
          address: placeName,
        },
      };
    }

    // Product / Shopping Detection
    if (
      domain.includes('amazon.') ||
      domain.includes('etsy.com') ||
      domain.includes('ebay.com') ||
      domain.includes('shopify.com') ||
      domain.includes('aliexpress.com') ||
      fullUrl.includes('/product') ||
      fullUrl.includes('/dp/') ||
      fullUrl.includes('/item/')
    ) {
      const productName = deriveTitleFromUrl(fullUrl, domain, 'Product');
      const intent: IntentType = 'buy';
      const { reminderTime, temporalType, schedulePreset } = inferTimeAndSchedule(raw, intent, 'tomorrow');
      const { people, places, topics } = extractEntities(`${productName} ${fullUrl}`);

      return {
        contentType: 'product',
        type: 'product',
        intent,
        title: productName,
        summary: `Product listing on ${domain.split('.')[0]}`,
        rawInput: raw,
        temporalType,
        reminderTime,
        schedulePreset,
        people,
        places,
        topics: topics.length > 0 ? topics : ['shopping', 'product'],
        url: fullUrl,
        sourceDomain: domain.split('.')[0],
      };
    }

    // Article / Reading Detection
    if (
      domain.includes('medium.com') ||
      domain.includes('substack.com') ||
      domain.includes('nytimes.com') ||
      domain.includes('theverge.com') ||
      domain.includes('techcrunch.com') ||
      domain.includes('wired.com') ||
      domain.includes('bloomberg.com') ||
      domain.includes('arxiv.org') ||
      domain.includes('wikipedia.org') ||
      fullUrl.includes('/blog/') ||
      fullUrl.includes('/article/') ||
      fullUrl.includes('/post/')
    ) {
      const articleTitle = deriveTitleFromUrl(fullUrl, domain, 'Article');
      const intent: IntentType = 'read';
      const { reminderTime, temporalType, schedulePreset } = inferTimeAndSchedule(raw, intent, 'this_weekend');
      const { people, places, topics } = extractEntities(`${articleTitle} ${fullUrl}`);

      return {
        contentType: 'article',
        type: 'article',
        intent,
        title: articleTitle,
        summary: `Article published on ${domain}`,
        rawInput: raw,
        temporalType,
        reminderTime,
        schedulePreset,
        people,
        places,
        topics: topics.length > 0 ? topics : ['reading', 'article'],
        url: fullUrl,
        sourceDomain: domain,
      };
    }

    // General Web Link
    const linkTitle = deriveTitleFromUrl(fullUrl, domain, 'Saved Link');
    const intent: IntentType = 'research';
    const { reminderTime, temporalType, schedulePreset } = inferTimeAndSchedule(raw, intent, 'tomorrow');
    const { people, places, topics } = extractEntities(`${linkTitle} ${fullUrl}`);

    return {
      contentType: 'link',
      type: 'link',
      intent,
      title: linkTitle,
      summary: `Reference link from ${domain}`,
      rawInput: raw,
      temporalType,
      reminderTime,
      schedulePreset,
      people,
      places,
      topics: topics.length > 0 ? topics : ['web', 'reference'],
      url: fullUrl,
      sourceDomain: domain,
    };
  }

  // 3. Phone Number Detection
  const phonePattern = /^(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
  const inlinePhonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

  if (phonePattern.test(raw) || (raw.length < 25 && /^\+?[\d\s\-()]{7,18}$/.test(raw))) {
    const cleanNum = raw;
    const intent: IntentType = 'call';
    const { reminderTime, temporalType, schedulePreset } = inferTimeAndSchedule(raw, intent, 'tomorrow');
    return {
      contentType: 'phone_number',
      type: 'person',
      intent,
      title: `Call ${cleanNum}`,
      summary: `Phone number contact saved for follow up`,
      rawInput: raw,
      temporalType,
      reminderTime,
      schedulePreset,
      people: [],
      places: [],
      topics: ['contacts', 'calls'],
      extractedMeta: {
        phoneNumber: cleanNum,
      },
    };
  }

  // 4. Person & Communication Detection ("Call Rahul tomorrow at 6", "Text Sarah", "Meet Sam", "Wake up Jason at 6:59 AM")
  const personActionPattern = /^(call|text|email|reach out to|contact|meet with|talk to|message|sync with|ping|wake up|wake|remind|ask)\s+([a-zA-Z\s]+?)(?:\s+(tomorrow|tonight|today|this weekend|next week|at|on|after|in).*)?$/i;
  const personMatch = raw.match(personActionPattern);

  if (personMatch) {
    const actionVerb = personMatch[1].toLowerCase();
    let personName = personMatch[2].trim();
    // Clean trailing words from person name if any
    personName = personName.replace(/\b(at|on|in|tomorrow|tonight|today|this|next|after)\b.*$/i, '').trim();

    const intent: IntentType = actionVerb.includes('meet') || actionVerb.includes('sync') ? 'meet' : 'call';
    const { reminderTime, temporalType, schedulePreset, timeHint } = inferTimeAndSchedule(raw, intent, 'no_time');
    const { people, places, topics } = extractEntities(raw);

    const detectedPeople = people.length > 0 ? people : (personName ? [capitalize(personName)] : []);

    const verbDisplay = capitalize(actionVerb);
    const parsedTime = parseNaturalDateTime(raw, new Date());
    const title = parsedTime.cleanTitle || `${verbDisplay} ${personName ? capitalize(personName) : 'contact'}`;

    return {
      contentType: 'person',
      type: 'person',
      intent,
      title,
      summary: `${verbDisplay} ${personName || 'contact'}${timeHint ? ` · ${timeHint}` : ''}`,
      rawInput: raw,
      temporalType,
      reminderTime,
      schedulePreset,
      people: detectedPeople,
      places,
      topics: topics.length > 0 ? topics : ['communication', 'contacts'],
      extractedMeta: {
        personName: personName ? capitalize(personName) : undefined,
        timeHint,
      },
    };
  }

  // 5. Place & Visit Detection ("Visit this place after exams", "Check out Kyoto cafe", "Go to Blue Bottle")
  const placePrefixPattern = /^(visit|go to|check out|explore|reservations? at|table at|dinner at|lunch at|coffee at)\s+(.+)/i;
  const placeMatch = raw.match(placePrefixPattern);

  if (placeMatch) {
    const actionVerb = placeMatch[1].toLowerCase();
    let placeTarget = placeMatch[2].trim();
    
    // Clean temporal phrases from place title
    const cleanPlace = placeTarget.replace(/\b(after exams|after exam|tomorrow|tonight|this weekend|next week|at \d|on [a-z]+)\b.*$/i, '').trim();

    const intent: IntentType = 'visit';
    const { reminderTime, temporalType, schedulePreset, timeHint } = inferTimeAndSchedule(raw, intent, 'this_weekend');
    const { people, places, topics } = extractEntities(raw);

    const detectedPlaces = places.length > 0 ? places : [capitalize(cleanPlace || placeTarget)];

    return {
      contentType: 'place',
      type: 'place',
      intent,
      title: `Visit ${capitalize(cleanPlace || placeTarget)}`,
      summary: `Place to visit${timeHint ? ` (${timeHint})` : ''}`,
      rawInput: raw,
      temporalType,
      reminderTime,
      schedulePreset,
      people,
      places: detectedPlaces,
      topics: topics.length > 0 ? topics : ['travel', 'places'],
      extractedMeta: {
        address: cleanPlace || placeTarget,
        timeHint,
      },
    };
  }

  // 6. Buying / Product Tasks ("Buy mechanical keyboard", "Purchase noise cancelling headphones")
  const buyPrefixPattern = /^(buy|purchase|order|get|pick up)\s+(.+)/i;
  const buyMatch = raw.match(buyPrefixPattern);

  if (buyMatch) {
    const itemTarget = buyMatch[2].trim();
    const intent: IntentType = 'buy';
    const { reminderTime, temporalType, schedulePreset, timeHint } = inferTimeAndSchedule(raw, intent, 'tomorrow');
    const { people, places, topics } = extractEntities(raw);

    return {
      contentType: 'product',
      type: 'product',
      intent,
      title: `Buy ${capitalize(itemTarget)}`,
      summary: `Purchase item: ${itemTarget}`,
      rawInput: raw,
      temporalType,
      reminderTime,
      schedulePreset,
      people,
      places,
      topics: topics.length > 0 ? topics : ['shopping', 'items'],
      extractedMeta: {
        timeHint,
      },
    };
  }

  // 6b. Reading / Media Tasks ("Read this article tomorrow", "Watch this talk tonight")
  const mediaActionPattern = /^(read|watch|listen to)\s+(.+)/i;
  const mediaMatch = raw.match(mediaActionPattern);
  if (mediaMatch) {
    const actionVerb = mediaMatch[1].toLowerCase();
    const intent: IntentType = actionVerb.startsWith('watch') ? 'watch' : actionVerb.startsWith('read') ? 'read' : 'explore';
    const contentType: ContentType = intent === 'watch' ? 'video' : intent === 'read' ? 'article' : 'note';
    const parsedTime = parseNaturalDateTime(raw, new Date());
    const { reminderTime, temporalType, schedulePreset, timeHint } = inferTimeAndSchedule(raw, intent, 'no_time');
    const { people, places, topics } = extractEntities(raw);
    const title = parsedTime.cleanTitle || capitalize(raw);

    return {
      contentType,
      type: contentType,
      intent,
      title,
      summary: `${capitalize(actionVerb)} item${timeHint ? ` · ${timeHint}` : ''}`,
      rawInput: raw,
      temporalType,
      reminderTime,
      schedulePreset,
      people,
      places,
      topics: topics.length > 0 ? topics : [intent, 'media'],
      extractedMeta: {
        timeHint,
      },
    };
  }

  // 7. Event & Appointment Detection ("Interview with Google", "Doctor appointment Friday 3pm", "Flight to Tokyo")
  const eventPattern = /\b(interview|appointment|meeting|flight|conference|webinar|dentist|doctor|checkup|exam|exams)\b/i;
  if (eventPattern.test(raw)) {
    const intent: IntentType = 'complete';
    const parsedTime = parseNaturalDateTime(raw, new Date());
    const { reminderTime, temporalType, schedulePreset, timeHint } = inferTimeAndSchedule(raw, intent, 'no_time');
    const { people, places, topics } = extractEntities(raw);
    const title = parsedTime.cleanTitle || capitalize(raw);

    return {
      contentType: 'event',
      type: 'task',
      intent,
      title,
      summary: `Scheduled event / commitment${timeHint ? ` · ${timeHint}` : ''}`,
      rawInput: raw,
      temporalType,
      reminderTime,
      schedulePreset,
      people,
      places,
      topics: topics.length > 0 ? topics : ['schedule', 'event'],
      extractedMeta: {
        timeHint,
      },
    };
  }

  // 8. Ideas & Concepts ("Idea: split-flap display", "Startup idea: ...", "What if...")
  const ideaPattern = /^(idea|concept|what if|thought|project idea|startup idea)[:\s]+(.+)/i;
  const ideaMatch = raw.match(ideaPattern);

  if (ideaMatch || lower.startsWith('idea') || lower.startsWith('startup idea')) {
    const ideaBody = ideaMatch ? ideaMatch[2].trim() : raw;
    const intent: IntentType = 'remember';
    const { reminderTime, temporalType, schedulePreset } = inferTimeAndSchedule(raw, intent, 'no_time');
    const { people, places, topics } = extractEntities(raw);

    return {
      contentType: 'idea',
      type: 'note',
      intent,
      title: ideaBody.length > 60 ? `${ideaBody.slice(0, 57)}...` : capitalize(ideaBody),
      summary: `Creative thought & idea recorded for review`,
      rawInput: raw,
      temporalType,
      reminderTime,
      schedulePreset,
      people,
      places,
      topics: topics.length > 0 ? topics : ['ideas', 'concepts'],
    };
  }

  // 9. Tasks & Action Items ("Fix...", "Send...", "Submit...", "Prepare...", "Clean...", "Finish...", "Testing today at 5 pm")
  const taskPrefixPattern = /^(fix|send|submit|prepare|write|finish|clean|schedule|review|update|debug|deploy|ship|pay|email|test|testing)\s+(.+)/i;
  const taskMatch = raw.match(taskPrefixPattern);

  if (taskMatch) {
    const intent: IntentType = 'complete';
    const parsedTime = parseNaturalDateTime(raw, new Date());
    const { reminderTime, temporalType, schedulePreset, timeHint } = inferTimeAndSchedule(raw, intent, 'no_time');
    const { people, places, topics } = extractEntities(raw);
    const title = parsedTime.cleanTitle || capitalize(raw);

    return {
      contentType: 'task',
      type: 'task',
      intent,
      title,
      summary: `Action item to complete${timeHint ? ` · ${timeHint}` : ''}`,
      rawInput: raw,
      temporalType,
      reminderTime,
      schedulePreset,
      people,
      places,
      topics: topics.length > 0 ? topics : ['tasks', 'action'],
      extractedMeta: {
        timeHint,
      },
    };
  }

  // 10. General Note / Reflection / Any content with explicit natural language time
  const parsedTime = parseNaturalDateTime(raw, new Date());
  const intent: IntentType = 'remember';
  const { reminderTime, temporalType, schedulePreset, timeHint } = inferTimeAndSchedule(raw, intent, 'no_time');
  const { people, places, topics } = extractEntities(raw);
  const title = parsedTime.cleanTitle || (raw.length > 65 ? `${raw.slice(0, 62)}...` : capitalize(raw));

  // Check if raw contains an inline phone number
  const inlinePhone = raw.match(inlinePhonePattern);

  return {
    contentType: 'note',
    type: 'note',
    intent,
    title,
    summary: timeHint ? `Note scheduled · ${timeHint}` : (raw.length > 65 ? raw : 'Note saved to memory'),
    rawInput: raw,
    temporalType,
    reminderTime,
    schedulePreset,
    people,
    places,
    topics: topics.length > 0 ? topics : ['notes', 'memory'],
    extractedMeta: inlinePhone ? { phoneNumber: inlinePhone[0] } : (timeHint ? { timeHint } : undefined),
  };
}

/**
 * Intelligent temporal detection and smart schedule calculation
 */
export function inferTimeAndSchedule(
  text: string,
  intent: IntentType,
  defaultPreset: SchedulePreset = 'no_time'
): {
  reminderTime: string | null;
  temporalType: TemporalType;
  schedulePreset: SchedulePreset;
  timeHint?: string;
} {
  // 1. Check exact natural language parsing first!
  const parsed = parseNaturalDateTime(text, new Date());
  if (parsed.hasExplicitTime && parsed.scheduledAt) {
    return {
      reminderTime: parsed.scheduledAt,
      temporalType: parsed.temporalType,
      schedulePreset: parsed.schedulePreset,
      timeHint: parsed.timeHint,
    };
  }

  const lower = text.toLowerCase();
  const now = new Date();

  // 2. Special expressions like "after exams"
  if (lower.includes('after exam') || lower.includes('after exams')) {
    const target = new Date(now);
    target.setDate(target.getDate() + 21); // 3 weeks out
    target.setHours(10, 0, 0, 0);
    return {
      reminderTime: target.toISOString(),
      temporalType: 'someday',
      schedulePreset: 'next_week',
      timeHint: 'After exams (in 3 weeks)',
    };
  }

  if (lower.includes('someday') || lower.includes('no time') || lower.includes('eventually')) {
    return {
      reminderTime: null,
      temporalType: 'someday',
      schedulePreset: 'no_time',
      timeHint: 'Saved for someday',
    };
  }

  // 3. Smart Intent Defaults when no explicit time was stated:
  if (defaultPreset === 'tonight' || intent === 'watch') {
    const target = new Date(now);
    if (now.getHours() >= 20) {
      target.setTime(now.getTime() + 2 * 60 * 60 * 1000);
    } else {
      target.setHours(20, 30, 0, 0);
    }
    return {
      reminderTime: target.toISOString(),
      temporalType: 'tonight',
      schedulePreset: 'tonight',
    };
  }

  if (defaultPreset === 'this_weekend' || intent === 'visit' || intent === 'read') {
    const target = new Date(now);
    const day = now.getDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    target.setDate(target.getDate() + daysUntilSat);
    target.setHours(10, 30, 0, 0);
    return {
      reminderTime: target.toISOString(),
      temporalType: 'this_weekend',
      schedulePreset: 'this_weekend',
    };
  }

  // If no explicit time was provided and no media preset applied, leave reminderTime null!
  return {
    reminderTime: null,
    temporalType: 'someday',
    schedulePreset: 'no_time',
  };
}

/**
 * Entity & Topic extraction
 */
export function extractEntities(text: string): {
  people: string[];
  places: string[];
  topics: string[];
} {
  const foundPeople = new Set<string>();
  const foundPlaces = new Set<string>();
  const foundTopics = new Set<string>();

  const lower = text.toLowerCase();

  // People
  KNOWN_PEOPLE_NAMES.forEach((name) => {
    const regex = new RegExp(`\\b${name}\\b`, 'i');
    if (regex.test(text)) {
      foundPeople.add(name);
    }
  });

  // Places
  KNOWN_PLACES.forEach((place) => {
    const regex = new RegExp(`\\b${place}\\b`, 'i');
    if (regex.test(text)) {
      foundPlaces.add(place);
    }
  });

  // Topics
  Object.entries(TOPIC_KEYWORDS).forEach(([topicName, keywords]) => {
    const matched = keywords.some((kw) => lower.includes(kw));
    if (matched) {
      foundTopics.add(topicName);
    }
  });

  return {
    people: Array.from(foundPeople),
    places: Array.from(foundPlaces),
    topics: Array.from(foundTopics),
  };
}

/**
 * Related Memories Algorithm
 * Automatically identifies connected items in memory by finding overlap
 * in people, places, topics, source domains, and context without manual tags or folders.
 */
export function calculateRelatedMemories(
  targetItem: SavedItem,
  allItems: SavedItem[],
  maxResults = 3
): string[] {
  const candidates = allItems.filter(
    (item) => item.id !== targetItem.id && !item.isArchived
  );

  const scored = candidates.map((item) => {
    let score = 0;

    // Direct Person match (e.g. Rahul, Arjun, Sarah)
    if (targetItem.people && item.people) {
      targetItem.people.forEach((p) => {
        if (item.people.some((ip) => ip.toLowerCase() === p.toLowerCase())) {
          score += 10;
        }
      });
    }

    // Direct Place match (e.g. Kyoto, Blue Bottle)
    if (targetItem.places && item.places) {
      targetItem.places.forEach((pl) => {
        if (item.places.some((ipl) => ipl.toLowerCase() === pl.toLowerCase())) {
          score += 8;
        }
      });
    }

    // Direct Topic match (e.g. woodworking, hardware, startup, audio)
    if (targetItem.topics && item.topics) {
      targetItem.topics.forEach((t) => {
        if (item.topics.some((it) => it.toLowerCase() === t.toLowerCase())) {
          score += 6;
        }
      });
    }

    // Matching Domain / Source
    if (targetItem.sourceDomain && item.sourceDomain && targetItem.sourceDomain === item.sourceDomain) {
      score += 4;
    }

    // Matching Content Type or Intent
    if (targetItem.contentType === item.contentType) {
      score += 2;
    }
    if (targetItem.intent === item.intent) {
      score += 2;
    }

    // Title / text substring matches
    const targetWords = targetItem.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const itemWords = (item.title + ' ' + item.rawInput).toLowerCase();
    targetWords.forEach((w) => {
      if (itemWords.includes(w)) {
        score += 3;
      }
    });

    return { id: item.id, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.id);
}

/**
 * URL Title parsing helper
 */
function deriveTitleFromUrl(url: string, domain: string, fallback: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/$/, '');
    const segments = pathname.split('/').filter(Boolean);

    // Check search params for title / query
    const searchQ = parsed.searchParams.get('q') || parsed.searchParams.get('v');
    if (searchQ && searchQ.length > 2 && isNaN(Number(searchQ))) {
      return searchQ
        .replace(/[-_+]/g, ' ')
        .split(' ')
        .map(capitalize)
        .join(' ');
    }

    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      const cleaned = decodeURIComponent(last)
        .replace(/[-_]/g, ' ')
        .replace(/\.(html|php|aspx|jsp|mp4)$/i, '')
        .replace(/\b(watch|dp|item|product|p)\b/gi, '')
        .trim();

      if (cleaned.length > 2 && !/^\d+$/.test(cleaned)) {
        return cleaned
          .split(' ')
          .filter(Boolean)
          .map(capitalize)
          .join(' ');
      }
    }
  } catch {
    // fallback
  }

  return `${fallback} · ${domain}`;
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
