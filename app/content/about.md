# About Bunge Hub

Kenya's parliamentary record, open and queryable.

## What is Bunge Hub?

Bunge Hub is an open-source platform that exposes Kenya's parliamentary record as structured, queryable data. Every bill debated, every contribution made, every question raised, presented as it actually happened, directly from the Hansard, with no editorial layer in between.

You can look up any Member of Parliament and read exactly what they said on any bill or topic. You can follow a bill's journey through Parliament stage by stage and see who spoke at each point. You can search across thousands of sittings, questions, and debates in one place.

The platform currently covers the **13th Parliament of Kenya** (September 2022 to present). The codebase and data pipeline are openly available for anyone to run, extend, or build on.

## Where does the data come from?

All data is sourced from [mzalendo.com](https://mzalendo.com), a civic technology platform maintained by the **Mzalendo Trust**, a Kenyan non-profit organisation that tracks parliamentary activity. Mzalendo itself draws from the official Kenya Hansard, the verbatim record of everything said in Parliament, published by the National Assembly and the Senate.

Member profiles, photos, party affiliations, and committee memberships are also sourced from Mzalendo's member performance tracker.

Full credit and gratitude to the [Mzalendo Trust](https://mzalendo.com) for making this data publicly available.

## How does it work?

Bunge Hub uses an automated program to regularly read and process the transcripts published on Mzalendo. For each parliamentary sitting, it reads the full record of what was discussed, identifies bills being debated, picks out the names of members who spoke, and organises everything so it can be searched and browsed.

Think of it as a thorough research assistant who reads every Hansard document, highlights the key parts, and organises them into a library you can explore. The search works even if you spell a name slightly differently or only remember part of a bill's title.

## Known limitations

Because the platform reads transcripts automatically rather than having a human review every page, there are a few things to be aware of:

- **Speaker names may vary.** The Hansard records names exactly as they appear in the transcript, which sometimes differs between sittings due to typos or different formatting. The same member may appear under slightly different names across records.
- **Bill identification is not perfect.** Bills are detected from section headings in the transcript. Occasionally a heading that resembles a bill title may not actually be one, or a genuine bill debate may be listed under a heading that does not match its formal name.
- **Legislative stages may be missing.** When a bill is debated without a clear stage label in the heading, the stage is left blank. This is common for committee debates and some procedural items.
- **Presiding officers show no activity.** The Speaker and Deputy Speakers are recorded in transcripts by role label rather than by name, so their contributions cannot be reliably linked to their member profiles.
- **Coverage is not exhaustive.** Only sittings indexed by Mzalendo are included. If a transcript has not been published or is incomplete there, it will not appear here.

If you spot something wrong, please [let us know on GitHub](https://github.com/mwananchi-tech/bunge-hub/issues/new). We will do our best to address it.

## AI summaries

Some debate and topic pages show an *"AI enrichment pending"* notice. This is a placeholder for a plain-language summary of the debate that will be generated and added progressively. The full contribution text is always available to read in the meantime.

## Open source

Bunge Hub is open source and freely available. The code is on GitHub under the MIT licence. Contributions, bug reports, and suggestions are welcome.

- [mwananchi-tech/bunge-hub](https://github.com/mwananchi-tech/bunge-hub)
