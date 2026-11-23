/* Numbers for the "Sitting at a glance" section, worked out from the transcript
   (sittings.raw_json) and the speaker-to-member map. No extra queries. */

export type TranscriptContribution = {
  content?: string | null;
  speakerName?: string | null;
  speakerUrl?: string | null;
  speakerRole?: string | null;
};

export type TranscriptNode = {
  title?: string | null;
  sectionType?: string | null;
  contributions?: TranscriptContribution[] | null;
  subsections?: TranscriptNode[] | null;
};

export type SpeakerMember = {
  id: string;
  name: string;
  photo: string | null;
  party: string | null;
};
export type SpeakerMap = Record<string, SpeakerMember | undefined>;

export type Contributor = { member: SpeakerMember; turns: number; words: number };
export type ChairPerson = { member: SpeakerMember; role: string; turns: number };
export type TopicTime = {
  label: string;
  /** Anchor of this part of the transcript, when it has one */
  anchor: string | null;
  words: number;
  mps: number;
};

/* A chairing turn is labelled with the role only, optionally followed by the
   name in brackets: "Hon. Speaker", "The Temporary Speaker (Hon. Omboko Milemba)".
   MPs addressing the chair ("Hon. Speaker, I beg to...") do not match. */
const CHAIR_TURN =
  /^(?:hon\.?\s+)?(?:the\s+)?((?:temporary\s+|deputy\s+)*(?:speaker|chair(?:man|person|lady|woman)?))\s*(?:\([^)]*\))?\s*$/i;

/** Opening rituals and closing, left out of the topic chart */
const PROCEDURAL = new Set(["OPENING", "PRAYERS", "QUORUM", "ADJOURNMENT"]);

export function chairRole(speakerName: string | null | undefined): string | null {
  const match = (speakerName ?? "").trim().match(CHAIR_TURN);
  return match ? titleCase(match[1]) : null;
}

export function wordCount(text: string | null | undefined): number {
  return (text ?? "").split(/\s+/).filter(Boolean).length;
}

/** "LACK OF HEADTEACHERS" -> "Lack Of Headteachers", "9 TH REPORT" -> "9th Report" */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(\d+)\s+(st|nd|rd|th)\b/g, "$1$2")
    .replace(
      /(^|[\s(-])([a-z])/g,
      (_, before: string, letter: string) => before + letter.toUpperCase()
    );
}

/** Same rule as the transcript's subsection ids */
export function anchorFor(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function memberFor(c: TranscriptContribution, speakerMap: SpeakerMap): SpeakerMember | undefined {
  return (
    (c.speakerUrl ? speakerMap[`url:${c.speakerUrl}`] : undefined) ??
    speakerMap[`name:${c.speakerName}`]
  );
}

function addTurn(map: Map<string, Contributor>, member: SpeakerMember, words: number) {
  const entry = map.get(member.id) ?? { member, turns: 0, words: 0 };
  entry.turns += 1;
  entry.words += words;
  map.set(member.id, entry);
}

const byWords = (a: { words: number }, b: { words: number }) => b.words - a.words;

export function analyseSitting(sections: TranscriptNode[], speakerMap: SpeakerMap) {
  const participants = new Map<string, Contributor>();
  const chairs = new Map<string, ChairPerson>();
  const topics: TopicTime[] = [];
  let contributions = 0;
  let words = 0;

  // Counts one block of contributions; returns its debate words and MPs (chair left out)
  const count = (list: TranscriptContribution[]) => {
    let blockWords = 0;
    const blockMps = new Set<string>();
    for (const c of list) {
      const n = wordCount(c.content);
      if (n === 0) continue;
      const member = memberFor(c, speakerMap);
      const role = chairRole(c.speakerName);
      if (role) {
        if (member) {
          const chair = chairs.get(member.id) ?? { member, role, turns: 0 };
          chair.turns += 1;
          chairs.set(member.id, chair);
        }
        continue;
      }
      contributions += 1;
      words += n;
      blockWords += n;
      if (member) {
        addTurn(participants, member, n);
        blockMps.add(member.id);
      }
    }
    return { blockWords, mps: blockMps.size };
  };

  for (const section of sections) {
    const type = (section.sectionType ?? "").trim();
    const own = count(section.contributions ?? []);
    if (own.blockWords > 0 && !PROCEDURAL.has(type.toUpperCase())) {
      topics.push({
        label: titleCase(type || "Other business"),
        anchor: null,
        words: own.blockWords,
        mps: own.mps,
      });
    }
    for (const sub of section.subsections ?? []) {
      const title = (sub.title ?? "").trim();
      const { blockWords, mps } = count(sub.contributions ?? []);
      if (blockWords === 0 || !title) continue;
      // Generic sub-headings ("IN THE COMMITTEE") read better with their section name
      const label =
        /^in the /i.test(title) && type
          ? `${titleCase(type)}: ${titleCase(title)}`
          : titleCase(title);
      topics.push({ label, anchor: anchorFor(title), words: blockWords, mps });
    }
  }

  return {
    /** MPs debating, chairing turns left out */
    participants: [...participants.values()].sort(byWords),
    chairs: [...chairs.values()].sort((a, b) => b.turns - a.turns),
    topics: topics.sort(byWords),
    totals: { mps: participants.size, contributions, words },
  };
}
