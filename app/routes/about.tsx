import { type ReactNode } from "react";
import { Link } from "react-router";

export function meta() {
  return [{ title: "About | Bunge Hub" }];
}

export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">

      <h1 className="font-serif text-4xl font-light mb-2">About Bunge Hub</h1>
      <p className="text-base mb-12" style={{ color: "var(--color-muted)" }}>
        Kenya's parliamentary record, open and queryable.
      </p>

      <div className="space-y-10 text-sm leading-relaxed">

        <Section title="What is Bunge Hub?">
          <p>
            Bunge Hub is an open-source platform that exposes Kenya's parliamentary record
            as structured, queryable data. Every bill debated, every contribution made, every
            question raised, presented as it actually happened, directly from the Hansard,
            with no editorial layer in between.
          </p>
          <p className="mt-3">
            You can look up any Member of Parliament and read exactly what they said on any
            bill or topic. You can follow a bill's journey through Parliament stage by stage
            and see who spoke at each point. You can search across thousands of sittings,
            questions, and debates in one place.
          </p>
          <p className="mt-3">
            The platform currently covers the <strong>13th Parliament of Kenya</strong>{" "}
            (September 2022 to present). The codebase and data pipeline are openly available
            for anyone to run, extend, or build on.
          </p>
        </Section>

        <Section title="Where does the data come from?">
          <p>
            All data is sourced from{" "}
            <a href="https://mzalendo.com" target="_blank" rel="noopener noreferrer"
               className="underline" style={{ color: "var(--color-accent)" }}>
              mzalendo.com
            </a>
            , a civic technology platform maintained by the{" "}
            <strong>Mzalendo Trust</strong>, a Kenyan non-profit organisation that tracks
            parliamentary activity. Mzalendo itself draws from the official Kenya Hansard,
            the verbatim record of everything said in Parliament, published by the National
            Assembly and the Senate.
          </p>
          <p className="mt-3">
            Member profiles, photos, party affiliations, and committee memberships are also
            sourced from Mzalendo's member performance tracker.
          </p>
          <p className="mt-3">
            Full credit and gratitude to the{" "}
            <a href="https://mzalendo.com" target="_blank" rel="noopener noreferrer"
               className="underline" style={{ color: "var(--color-accent)" }}>
              Mzalendo Trust
            </a>{" "}
            for making this data publicly available.
          </p>
        </Section>

        <Section title="How does it work?">
          <p>
            Bunge Hub uses an automated program to regularly read and process the transcripts
            published on Mzalendo. For each parliamentary sitting, it reads the full record
            of what was discussed, identifies bills being debated, picks out the names of
            members who spoke, and organises everything so it can be searched and browsed.
          </p>
          <p className="mt-3">
            Think of it as a thorough research assistant who reads every Hansard document,
            highlights the key parts, and organises them into a library you can explore.
            The search works even if you spell a name slightly differently or only remember
            part of a bill's title.
          </p>
        </Section>

        <Section title="Known limitations">
          <p>
            Because the platform reads transcripts automatically rather than having a human
            review every page, there are a few things to be aware of:
          </p>
          <ul className="mt-3 space-y-3 list-disc list-inside">
            <li>
              <strong>Speaker names may vary.</strong>{" "}
              The Hansard records names exactly as they appear in the transcript, which
              sometimes differs between sittings due to typos or different formatting. The
              same member may appear under slightly different names across records.
            </li>
            <li>
              <strong>Bill identification is not perfect.</strong>{" "}
              Bills are detected from section headings in the transcript. Occasionally a
              heading that resembles a bill title may not actually be one, or a genuine bill
              debate may be listed under a heading that does not match its formal name.
            </li>
            <li>
              <strong>Legislative stages may be missing.</strong>{" "}
              When a bill is debated without a clear stage label in the heading, the stage
              is left blank. This is common for committee debates and some procedural items.
            </li>
            <li>
              <strong>Coverage is not exhaustive.</strong>{" "}
              Only sittings indexed by Mzalendo are included. If a transcript has not been
              published or is incomplete there, it will not appear here.
            </li>
          </ul>
          <p className="mt-4">
            If you spot something wrong, please{" "}
            <a href="https://github.com/mwananchi-tech/bunge-hub/issues/new"
               target="_blank" rel="noopener noreferrer"
               className="underline" style={{ color: "var(--color-accent)" }}>
              let us know on GitHub
            </a>
            . We will do our best to address it.
          </p>
        </Section>

        <Section title="AI summaries">
          <p>
            Some debate and topic pages show an <em>"AI enrichment pending"</em> notice.
            This is a placeholder for a plain-language summary of the debate that will be
            generated and added progressively. The full contribution text is always
            available to read in the meantime.
          </p>
        </Section>

        <Section title="Open source">
          <p>
            Bunge Hub is open source and freely available. The code is on GitHub under the
            MIT licence. Contributions, bug reports, and suggestions are welcome.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="https://github.com/mwananchi-tech/bunge-hub"
               target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm"
               style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
              <GithubIcon />
              mwananchi-tech/bunge-hub
            </a>
            <a href="https://github.com/mwananchi-tech/bunge-hub/issues/new"
               target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm"
               style={{ backgroundColor: "var(--color-accent)", color: "white" }}>
              Report an issue
            </a>
          </div>
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl mb-3">{title}</h2>
      <div style={{ color: "var(--color-muted)" }}>{children}</div>
    </section>
  );
}

function GithubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}
