import { useState, useCallback } from "react";
import { Link, data } from "react-router";
import { MarkdownContent } from "~/components/MarkdownContent";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, type NodeProps,
  Handle, Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Route } from "./+types/bills.$id";
import { getBill, getBillJourney } from "~/lib/queries/bills.server";

const STAGE_COLORS: Record<string, string> = {
  "First Reading":             "#78716C",
  "Second Reading":            "#C8A45F",
  "Committee Stage":           "#2D6A4F",
  "Report Stage":              "#C8A45F",
  "Third Reading":             "#2D6A4F",
  "Mediation Approval":        "#9B6DF0",
  "Presidential Reservations": "#DC2626",
  "Publication Period Reduction": "#78716C",
};

export async function loader({ params }: Route.LoaderArgs) {
  const bill = await getBill(params.id!);
  if (!bill) throw data("Bill not found", { status: 404 });
  const journey = await getBillJourney(params.id!);
  return { bill, journey };
}

export function meta({ data }: Route.MetaArgs) {
  return [{ title: `${data?.bill?.name ?? "Bill"} | Bunge Hub` }];
}

function BillStageNode({ data: d, selected }: NodeProps) {
  const color = STAGE_COLORS[d.stage] ?? "var(--color-muted)";
  return (
    <div style={{
      padding: "12px 16px", borderRadius: "10px", minWidth: "180px", maxWidth: "200px",
      backgroundColor: "var(--color-bg)",
      border: `2px solid ${selected ? color : "var(--color-border)"}`,
      boxShadow: selected ? `0 0 0 3px ${color}22` : "0 1px 4px rgba(0,0,0,.08)",
      cursor: "pointer", transition: "all .15s",
    }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div style={{ fontSize: "11px", fontWeight: 600, color, marginBottom: "4px", textTransform: "uppercase", letterSpacing: ".04em" }}>
        {d.stage ?? "Debate"}
      </div>
      <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text)", marginBottom: "2px" }}>
        {new Date(d.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
      </div>
      <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>{d.house}</div>
      <div style={{ fontSize: "11px", color: "var(--color-muted)", marginTop: "4px" }}>
        {d.speechCount} speech{d.speechCount !== 1 ? "es" : ""}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const NODE_TYPES = { billNode: BillStageNode };

function buildFlow(journey: any[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = journey.map((j, i) => ({
    id: j.id,
    type: "billNode",
    position: { x: i * 240, y: 0 },
    data: j,
  }));
  const edges: Edge[] = journey.slice(0, -1).map((j, i) => ({
    id: `e-${i}`,
    source: j.id,
    target: journey[i + 1].id,
    type: "smoothstep",
    style: { stroke: "var(--color-border)", strokeWidth: 2 },
    animated: false,
  }));
  return { nodes, edges };
}

export default function BillDetail({ loaderData }: Route.ComponentProps) {
  const { bill, journey } = loaderData;
  const [selected, setSelected] = useState<any>(null);
  const { nodes, edges } = buildFlow(journey);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelected(s => s?.id === node.id ? null : node.data);
  }, []);

  const sittingHref = selected?.sittingUrl
    ? (selected.sittingUrl.startsWith("http") ? selected.sittingUrl : `https://mzalendo.com${selected.sittingUrl}`)
    : null;

  const transcriptSlug = selected?.sittingUrl
    ? selected.sittingUrl.split("/").filter(Boolean).pop() ?? ""
    : "";
  const transcriptAnchor = selected?.sectionTitle
    ? selected.sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : "";
  const transcriptUrl = transcriptSlug && transcriptAnchor
    ? `/sittings/${transcriptSlug}#${transcriptAnchor}`
    : transcriptSlug ? `/sittings/${transcriptSlug}` : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Bill header */}
      <div className="mb-8">
        <div className="text-sm mb-1" style={{ color: "var(--color-muted)" }}>
          <Link to="/bills" className="hover:underline">Bills</Link> /
        </div>
        <h1 className="font-serif text-3xl mb-2">{bill.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--color-muted)" }}>
          {bill.billNumber && <span>{bill.billNumber}</span>}
          {bill.year && <span>{bill.year}</span>}
          {bill.sponsor && (
            <span>
              Moved by:{" "}
              {bill.sponsorSlug
                ? <Link to={`/members/${bill.sponsorSlug}`}
                        className="hover:underline"
                        style={{ color: "var(--color-accent)" }}>
                    {bill.sponsor}
                  </Link>
                : <span style={{ color: "var(--color-text)" }}>{bill.sponsor}</span>
              }
            </span>
          )}
        </div>
      </div>

      {/* Bill journey AI summary — populated by enrichment pipeline */}
      <div className="mb-8 p-5 rounded-xl"
           style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium uppercase tracking-widest"
               style={{ color: "var(--color-muted)" }}>
            Bill Summary
          </div>
          {!bill.summary && (
            <span className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: "var(--color-gold)22", color: "var(--color-gold)", border: "1px solid var(--color-gold)44" }}>
              AI enrichment pending
            </span>
          )}
        </div>
        {bill.summary
          ? <MarkdownContent content={bill.summary} />
          : <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              A plain-language summary of this bill's full legislative journey will appear here once the
              enrichment pipeline runs — covering stages reached, key debates, and the outcome.
            </p>
        }
      </div>

      {journey.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>No journey data yet.</p>
      ) : (
        <>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
            Click a node to see speakers and discussion.
          </p>

          {/* React Flow graph */}
          <div style={{ height: 220, borderRadius: 12, border: "1px solid var(--color-border)", overflow: "hidden", backgroundColor: "var(--color-surface)" }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              panOnDrag={true}
              zoomOnScroll={false}
              preventScrolling={false}
            >
              <Background color="var(--color-border)" gap={20} size={1} />
              <Controls showInteractive={false} style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }} />
            </ReactFlow>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="mt-6 rounded-xl p-6" style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-1"
                       style={{ color: STAGE_COLORS[selected.stage] ?? "var(--color-muted)" }}>
                    {selected.stage ?? "Debate"}
                  </div>
                  <div className="font-serif text-xl">{new Date(selected.date).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                  <div className="text-sm mt-0.5" style={{ color: "var(--color-muted)" }}>
                    {selected.house} · {selected.sessionType} · {selected.speechCount} speeches
                  </div>
                </div>
                <div className="flex gap-2">
                  {transcriptUrl && (
                    <Link to={transcriptUrl}
                          className="text-xs px-3 py-1.5 rounded"
                          style={{ backgroundColor: "var(--color-accent)", color: "white" }}>
                      Jump to debate
                    </Link>
                  )}
                  {sittingHref && (
                    <a href={sittingHref} target="_blank" rel="noopener noreferrer"
                       className="text-xs px-3 py-1.5 rounded transition-colors"
                       style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)", backgroundColor: "var(--color-bg)" }}>
                      mzalendo.com ↗
                    </a>
                  )}
                  <button onClick={() => setSelected(null)} className="text-xs px-2 py-1.5 rounded"
                          style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>✕</button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Speakers */}
                <div>
                  <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "var(--color-muted)" }}>
                    Contributors
                  </div>
                  <div className="space-y-3">
                    {(selected.speakers ?? []).slice(0, 8).map((s: any, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        {s.photo
                          ? <img src={s.photo} alt={s.name} className="w-8 h-8 rounded-full object-cover shrink-0"
                                 style={{ border: "1px solid var(--color-border)" }} />
                          : <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-serif"
                                 style={{ backgroundColor: "var(--color-bg)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }}>
                              {s.name?.[0]}
                            </div>
                        }
                        <div className="flex-1 min-w-0">
                          {s.slug
                            ? <Link to={`/members/${s.slug}`} className="text-sm font-medium hover:underline" style={{ color: "var(--color-accent)" }}>
                                {s.name}
                              </Link>
                            : <span className="text-sm font-medium">{s.name}</span>
                          }
                          {s.party && <div className="text-xs" style={{ color: "var(--color-muted)" }}>{s.party}</div>}
                        </div>
                        <span className="text-xs shrink-0" style={{ color: "var(--color-muted)" }}>{s.speeches} sp.</span>
                      </div>
                    ))}
                    {(selected.speakers ?? []).length > 8 && (
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                        +{selected.speakers.length - 8} more contributors
                      </p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "var(--color-muted)" }}>
                    Summary
                  </div>
                  {selected.speakers?.[0]?.summary
                    ? <MarkdownContent content={selected.speakers[0].summary} />
                    : (
                      <div>
                        <p className="text-sm mb-3" style={{ color: "var(--color-muted)" }}>
                          No AI summary yet for this debate segment.
                        </p>
                        {transcriptUrl && (
                          <Link to={transcriptUrl}
                                className="text-xs hover:underline"
                                style={{ color: "var(--color-accent)" }}>
                            Read the full debate in the transcript →
                          </Link>
                        )}
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          )}

          {/* Journey list fallback */}
          <div className="mt-8">
            <div className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--color-muted)" }}>
              Full journey: {journey.length} session{journey.length !== 1 ? "s" : ""}
            </div>
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {journey.map((j: any) => (
                <div key={j.id} className="py-3 flex items-center gap-4">
                  <span className="text-xs font-medium w-32 shrink-0"
                        style={{ color: STAGE_COLORS[j.stage] ?? "var(--color-muted)" }}>
                    {j.stage ?? "Debate"}
                  </span>
                  <span className="text-sm">{new Date(j.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="text-sm" style={{ color: "var(--color-muted)" }}>{j.house}</span>
                  <span className="text-xs ml-auto" style={{ color: "var(--color-muted)" }}>{j.speechCount} speeches</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
