export interface Prompt {
  left: string;
  right: string;
}

export type PackId = 'personality' | 'friends' | 'work' | 'deep' | 'wildcard';

export interface Pack {
  id: PackId;
  name: string;
  emoji: string;
  description: string;
  ranges: [number, number][]; // inclusive index ranges into PROMPTS
}

export const PACKS: Pack[] = [
  {
    id: 'personality',
    name: 'Personality',
    emoji: '🌈',
    description: 'Vibes, lifestyle, taste & worldview',
    ranges: [[0, 19], [35, 49], [80, 94], [130, 139]],
  },
  {
    id: 'friends',
    name: 'Friends',
    emoji: '🫂',
    description: 'Social dynamics, humor & group energy',
    ranges: [[20, 34], [110, 119], [165, 194]],
  },
  {
    id: 'work',
    name: 'Work',
    emoji: '💼',
    description: 'Ambition, work style & big ideas',
    ranges: [[50, 64], [95, 129], [140, 154], [205, 214]],
  },
  {
    id: 'deep',
    name: 'Deep Cut',
    emoji: '❤️',
    description: 'Love, inner life & the existential stuff',
    ranges: [[65, 79], [155, 164], [195, 234]],
  },
  {
    id: 'wildcard',
    name: 'Wildcard',
    emoji: '🎲',
    description: 'Unpredictable, chaotic & unhinged',
    ranges: [[175, 184], [235, 244]],
  },
];

export const ALL_PACK_IDS: PackId[] = ['personality', 'friends', 'work', 'deep', 'wildcard'];

export function getIndicesForPacks(packs: PackId[]): number[] {
  const selected = PACKS.filter(p => packs.includes(p.id));
  const indices: number[] = [];
  for (const pack of selected) {
    for (const [start, end] of pack.ranges) {
      for (let i = start; i <= end && i < PROMPTS.length; i++) {
        indices.push(i);
      }
    }
  }
  return [...new Set(indices)];
}

export function pickRandomIndicesFromPacks(count: number, packs: PackId[], exclude: number[] = []): number[] {
  const available = getIndicesForPacks(packs).filter(i => !exclude.includes(i));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const PROMPTS: Prompt[] = [
  // PERSONALITY & VIBE
  { left: "More introvert", right: "More extrovert" },
  { left: "More overthinker", right: "More acts on impulse" },
  { left: "More people-pleaser", right: "More brutally honest" },
  { left: "More serious", right: "More goofy" },
  { left: "More calm", right: "More chaotic" },
  { left: "More rebel", right: "More rule-follower" },
  { left: "More emotionally guarded", right: "More wears heart on sleeve" },
  { left: "More pessimist", right: "More optimist" },
  { left: "More logical", right: "More emotional" },
  { left: "More patient", right: "More impatient" },
  { left: "More humble", right: "More confident" },
  { left: "More mysterious", right: "More open book" },
  { left: "More spontaneous", right: "More planner" },
  { left: "More sarcastic", right: "More sincere" },
  { left: "More cynical", right: "More idealistic" },
  { left: "More old soul", right: "More new age" },
  { left: "More minimalist", right: "More maximalist" },
  { left: "More risk-taker", right: "More plays it safe" },
  { left: "More takes things literally", right: "More reads between the lines" },
  { left: "More talks a lot", right: "More says little but means everything" },
  // SOCIAL DYNAMICS
  { left: "First person to arrive at a party", right: "Last person to leave" },
  { left: "Always the listener", right: "Always the talker" },
  { left: "Texts back immediately", right: "Never texts back" },
  { left: "Brings people together", right: "Quietly divides" },
  { left: "Knows everyone's name", right: "Can't remember anyone's name" },
  { left: "Makes friends everywhere", right: "Has the same 3 friends for life" },
  { left: "Always gives advice", right: "Always asks for advice" },
  { left: "Would tell you a hard truth", right: "Would protect your feelings" },
  { left: "Life of the party", right: "Watches the party from the corner" },
  { left: "Hypes everyone up", right: "Keeps it real no matter what" },
  { left: "Always shows up for you", right: "Has to be asked multiple times" },
  { left: "More likely to cancel plans", right: "More likely to show up early" },
  { left: "Keeps secrets forever", right: "Spills everything by accident" },
  { left: "Apologizes too much", right: "Never apologizes" },
  { left: "More likely to mediate a conflict", right: "More likely to start one" },
  // ENERGY & LIFESTYLE
  { left: "Morning person", right: "Night owl" },
  { left: "Eats to live", right: "Lives to eat" },
  { left: "Gym every day", right: "Hasn't exercised in months" },
  { left: "Always on time", right: "Always late" },
  { left: "Super organized", right: "Organized chaos" },
  { left: "Workaholic", right: "Never takes work home" },
  { left: "Minimalist wardrobe", right: "Fashion obsessed" },
  { left: "Saves everything", right: "Impulse spender" },
  { left: "More likely to read a book", right: "More likely to watch a documentary" },
  { left: "Would go off-grid for a month", right: "Couldn't last a day without WiFi" },
  { left: "Needs 8 hours of sleep", right: "Functions on 4" },
  { left: "Healthy eater", right: "Eats whatever, whenever" },
  { left: "Meditates daily", right: "Can't sit still for 5 minutes" },
  { left: "Would move cities for a job", right: "Would never leave their hometown" },
  { left: "Travels light", right: "Brings 3 suitcases for a weekend" },
  // INTELLECT & IDEAS
  { left: "More book-smart", right: "More street-smart" },
  { left: "More creative", right: "More analytical" },
  { left: "Thinks in details", right: "Thinks in big picture" },
  { left: "More likely to start a startup", right: "More likely to climb the corporate ladder" },
  { left: "Invents something", right: "Improves something already invented" },
  { left: "Debates ideas for fun", right: "Avoids debates at all cost" },
  { left: "More left-brained", right: "More right-brained" },
  { left: "Reads fiction", right: "Reads non-fiction" },
  { left: "Believes in systems", right: "Believes in instinct" },
  { left: "More likely to change their mind", right: "More likely to die on a hill" },
  { left: "Ahead of trends", right: "Classic and timeless" },
  { left: "Values depth", right: "Values breadth" },
  { left: "More theoretical", right: "More practical" },
  { left: "Would study history", right: "Would study the future" },
  { left: "Explains things simply", right: "Explains things in full complexity" },
  // LOVE & RELATIONSHIPS
  { left: "Falls fast", right: "Takes forever to open up" },
  { left: "Grand romantic gestures", right: "Small consistent acts of love" },
  { left: "More likely to confess feelings first", right: "More likely to wait forever" },
  { left: "Loves deeply, gets hurt easily", right: "Protects themselves at all costs" },
  { left: "Always in a relationship", right: "Serial single" },
  { left: "Would do long-distance", right: "Long-distance is a dealbreaker" },
  { left: "Says 'I love you' first", right: "Never says it unless sure" },
  { left: "Forgives easily", right: "Holds a grudge" },
  { left: "More jealous", right: "More trusting" },
  { left: "Prioritizes romance", right: "Prioritizes friendship" },
  { left: "More likely to ghost", right: "More likely to give a closing speech" },
  { left: "Believes in soulmates", right: "Believes love is a choice" },
  { left: "Would move countries for love", right: "Wouldn't move neighborhoods" },
  { left: "Overly communicative in relationships", right: "Undercommunicates" },
  { left: "More likely to plan a surprise", right: "More likely to ruin a surprise" },
  // TASTE & AESTHETICS
  { left: "Loves chaos in art", right: "Loves clean, minimal art" },
  { left: "Loud colors", right: "Neutral palette" },
  { left: "Vintage taste", right: "Ultra-modern taste" },
  { left: "Would decorate with plants", right: "Would decorate with tech gadgets" },
  { left: "Classical music", right: "Experimental music" },
  { left: "Loves blockbusters", right: "Only watches indie films" },
  { left: "Comfort food", right: "Adventurous eater" },
  { left: "Prefers old architecture", right: "Prefers modern design" },
  { left: "Would live in a cabin in the woods", right: "Would live in a penthouse in the city" },
  { left: "Collects things", right: "Throws everything away" },
  { left: "Writes in pen", right: "Types everything" },
  { left: "Handmade gifts", right: "Bought gifts" },
  { left: "Loves silence", right: "Always has something playing" },
  { left: "Would design their own home", right: "Would rather hire someone" },
  { left: "More Beatles personality", right: "More Rolling Stones personality" },
  // AMBITION & SUCCESS
  { left: "Driven by money", right: "Driven by meaning" },
  { left: "Wants to be famous", right: "Wants to be impactful behind the scenes" },
  { left: "Would take a safe job", right: "Would bet everything on a passion" },
  { left: "Sets goals every year", right: "Goes where life takes them" },
  { left: "Highly competitive", right: "Genuinely collaborative" },
  { left: "Needs external validation", right: "Self-validated" },
  { left: "Wants to build an empire", right: "Wants a small, beautiful life" },
  { left: "Works to retire early", right: "Would never fully retire" },
  { left: "More likely to win an award", right: "More likely to be the one giving it" },
  { left: "Motivates others", right: "Gets motivated by others" },
  { left: "Would start a movement", right: "Would join a movement" },
  { left: "Driven by fear of failure", right: "Driven by love of the craft" },
  { left: "More likely to quit and pivot", right: "More likely to grind it out" },
  { left: "Builds teams", right: "Works alone" },
  { left: "Would take credit", right: "Would share credit" },
  // HUMOR & QUIRKS
  { left: "Dry, deadpan humor", right: "Loud, physical comedy" },
  { left: "Tells long stories", right: "Gets to the point" },
  { left: "Laughs at themselves easily", right: "Takes things personally" },
  { left: "Makes puns constantly", right: "Groans at every pun" },
  { left: "Uses humor to deflect", right: "Uses humor to connect" },
  { left: "Would roast you lovingly", right: "Would never say anything mean" },
  { left: "Funny without trying", right: "Tries too hard to be funny" },
  { left: "Would do a bit for hours", right: "Knows when the bit is over" },
  { left: "More likely to be the class clown", right: "More likely to be the quiet observer" },
  { left: "Laughs loudly", right: "Silent but shaking" },
  // BOLD OPINIONS
  { left: "Would call someone out publicly", right: "Would take it to the group chat" },
  { left: "Would rather be right", right: "Would rather be liked" },
  { left: "Speaks their mind immediately", right: "Processes and responds later" },
  { left: "Would walk out of a bad movie", right: "Would stay out of guilt" },
  { left: "Would complain to the manager", right: "Would suffer in silence" },
  { left: "Sends voice notes", right: "Would never send a voice note" },
  { left: "Would argue with a stranger online", right: "Has never left a comment in their life" },
  { left: "Would confront a friend directly", right: "Would drop hints until they get it" },
  { left: "Would say 'no' without explaining", right: "Over-explains every 'no'" },
  { left: "Would cut someone off cleanly", right: "Keeps people around too long" },
  // WORLDVIEW
  { left: "Believes people are fundamentally good", right: "Believes people are self-interested" },
  { left: "More faith-driven", right: "More evidence-driven" },
  { left: "Thinks tradition matters", right: "Thinks progress matters" },
  { left: "Local, community-focused", right: "Global, big-picture thinker" },
  { left: "Believes in fate", right: "Believes in free will" },
  { left: "Trusts institutions", right: "Questions everything" },
  { left: "Thinks humans will solve climate change", right: "Thinks we're doomed" },
  { left: "Believes in karma", right: "Believes things are random" },
  { left: "More about roots", right: "More about routes" },
  { left: "Would choose security", right: "Would choose freedom" },
  // WORK STYLE
  { left: "Does everything last minute", right: "Finishes everything early" },
  { left: "Needs silence to work", right: "Works best with background noise" },
  { left: "Multitasker", right: "One thing at a time, always" },
  { left: "Needs structure", right: "Thrives in ambiguity" },
  { left: "Overdelivers on everything", right: "Does exactly what's asked" },
  { left: "Would rather lead", right: "Would rather execute" },
  { left: "Takes on too much", right: "Sets strict limits" },
  { left: "Works better alone", right: "Works better in teams" },
  { left: "Would give harsh feedback", right: "Would sandwich everything in positives" },
  { left: "More likely to be micromanaged", right: "More likely to micromanage" },
  { left: "Always has a backup plan", right: "Figures it out as they go" },
  { left: "Would speak up in a meeting", right: "Would type it in the chat later" },
  { left: "More about vision", right: "More about execution" },
  { left: "Loves process", right: "Hates process" },
  { left: "Would rather present", right: "Would rather prepare the deck" },
  // DEEP & EXISTENTIAL
  { left: "Thinks about death often", right: "Actively avoids thinking about it" },
  { left: "Believes their life has a purpose", right: "Makes meaning as they go" },
  { left: "Would rather have lived in another era", right: "Loves being alive right now" },
  { left: "Afraid of being forgotten", right: "Doesn't care about legacy" },
  { left: "Spends time on what matters", right: "Gets lost in the noise" },
  { left: "Has a philosophy they live by", right: "Just does what feels right" },
  { left: "Would sacrifice happiness for meaning", right: "Would choose happiness every time" },
  { left: "Thinks about the future constantly", right: "Lives entirely in the present" },
  { left: "Worries about the big things", right: "Worries about the small things" },
  { left: "Would rather know the truth", right: "Would rather be at peace" },
  // FUN & LEISURE
  { left: "Competitive gamer", right: "Casual 'just for fun' gamer" },
  { left: "Would binge 10 episodes", right: "Watches one episode a day" },
  { left: "Reads book series in one go", right: "Takes months between books" },
  { left: "Would go to a concert alone", right: "Would never go to a concert alone" },
  { left: "Loves theme parks", right: "Would rather stay home" },
  { left: "Watches sports live", right: "Only watches highlights" },
  { left: "Plays board games competitively", right: "Just wants everyone to have fun" },
  { left: "Would go skydiving", right: "Wouldn't even ride a roller coaster" },
  { left: "Adventure travel", right: "Luxury resort vacation" },
  { left: "Would do karaoke", right: "Would watch others do karaoke" },
  // MISC & WILDCARD
  { left: "Would cry at a movie", right: "Hasn't cried in years" },
  { left: "More dog person energy", right: "More cat person energy" },
  { left: "Would rescue a stranger", right: "Would call for help instead" },
  { left: "Morning shower", right: "Night shower" },
  { left: "Keeps their room spotless", right: "Controlled chaos" },
  { left: "Would ghost a situationship", right: "Would have a 3-hour closing conversation" },
  { left: "More likely to start a trend", right: "More likely to be the last to know about one" },
  { left: "Would delete all social media", right: "Would add more platforms" },
  { left: "Would write a book someday", right: "Not in a million years" },
  { left: "More of a 'yes' person", right: "More of a 'let me think about it' person" },
  // GROUP DYNAMICS
  { left: "The one everyone calls in a crisis", right: "Doesn't hear about the crisis until after" },
  { left: "Makes every group trip happen", right: "Would skip the group trip" },
  { left: "Sends the meme", right: "Is the meme" },
  { left: "The glue of the friend group", right: "The wildcard" },
  { left: "Would plan the birthday", right: "Would forget the birthday" },
  { left: "Always in the group photo", right: "Always taking the group photo" },
  { left: "Would share the bill equally", right: "Would calculate their exact share" },
  { left: "First to suggest the plan", right: "Last to confirm they're coming" },
  { left: "Brings new people into the group", right: "Protective of the existing group" },
  { left: "Would suggest karaoke", right: "Would suggest going home" },
  // INNER LIFE
  { left: "Very self-aware", right: "Obliviously themselves" },
  { left: "Journals regularly", right: "Would never journal" },
  { left: "Knows their love language", right: "Has never thought about it" },
  { left: "Has a therapist", right: "Thinks therapy is for 'other people'" },
  { left: "Regularly reflects on growth", right: "Just lives" },
  { left: "Would meditate", right: "Would rather just sleep" },
  { left: "Has clear values they can name", right: "Lives by values they can't articulate" },
  { left: "Knows their MBTI, enneagram, everything", right: "Thinks it's all nonsense" },
  { left: "Processes emotions quickly", right: "Processes emotions months later" },
  { left: "More about healing", right: "More about moving forward" },
  // TECHNOLOGY & DIGITAL
  { left: "Early adopter", right: "Still figuring out the last update" },
  { left: "Has a finsta", right: "Doesn't understand the concept" },
  { left: "Curates their feed obsessively", right: "Follows everything" },
  { left: "Would go viral", right: "Would be mortified to go viral" },
  { left: "Digital nomad energy", right: "Needs a permanent desk" },
  { left: "Uses every productivity app", right: "Pen and paper only" },
  { left: "Would build an app", right: "Would have an idea and never build it" },
  { left: "Lives in their inbox", right: "Has 10,000 unread emails" },
  { left: "Would turn off notifications forever", right: "Checks phone every 5 minutes" },
  { left: "Privacy-first mindset", right: "Shares everything online" },
  // EXPRESSION & CREATIVITY
  { left: "Expresses themselves through art", right: "Expresses themselves through conversation" },
  { left: "Would write a song about feelings", right: "Would never bring that up again" },
  { left: "Keeps a private creative practice", right: "Shares everything they make" },
  { left: "Would perform on stage", right: "Would rather be in the audience" },
  { left: "Tells stories in circles", right: "Tells them in a straight line" },
  { left: "Uses metaphors constantly", right: "Speaks very literally" },
  { left: "Would start a podcast", right: "Would never want a platform like that" },
  { left: "Expresses love through words", right: "Expresses love through actions" },
  { left: "Has strong aesthetic opinions", right: "Thinks 'anything goes'" },
  { left: "Would be a director", right: "Would be an actor" },
  // CARE & EMPATHY
  { left: "Notices small changes in people", right: "Takes a while to pick up on things" },
  { left: "Remembers birthdays", right: "Forgets birthdays but makes it up later" },
  { left: "Checks in on people randomly", right: "Waits to be reached out to" },
  { left: "Would drop everything to help", right: "Would help after they've sorted themselves" },
  { left: "Gives unsolicited advice", right: "Waits to be asked" },
  { left: "More likely to cry at someone else's news", right: "More likely to stay composed" },
  { left: "Takes on other people's energy", right: "Has good emotional boundaries" },
  { left: "Would stay up listening to a friend", right: "Would suggest professional help first" },
  { left: "More of a giver", right: "More of a taker (and knows it)" },
  { left: "Would comfort a stranger", right: "Would give space instead" },
  // WILDCARD BONUS
  { left: "Would win Survivor", right: "Would be first voted off" },
  { left: "Would win a debate competition", right: "Would win a staring contest" },
  { left: "Would be a cult leader", right: "Would be a cult member for a week before leaving" },
  { left: "Would survive a zombie apocalypse", right: "Would be eaten in the first episode" },
  { left: "Would be a spy", right: "Would be an absolutely terrible spy" },
  { left: "Would win the Nobel Prize", right: "Would win a local bake-off" },
  { left: "Would run for office", right: "Would refuse to run for any office ever" },
  { left: "Would be invited to a TED talk", right: "Would turn down the TED talk" },
  { left: "Would become a monk", right: "Would last three days as a monk" },
  { left: "Would start a revolution", right: "Would document the revolution" },
];

export function getPrompt(index: number): Prompt {
  return PROMPTS[index % PROMPTS.length];
}

export function pickRandomIndices(count: number, exclude: number[] = []): number[] {
  return pickRandomIndicesFromPacks(count, ALL_PACK_IDS, exclude);
}
