/**
 * Stand-in thumbnail for a sitting that has no video yet: the Bunge Hub wax seal
 * (the official logo, from mwananchi-tech/bunge-bits) on a deep red ground.
 *
 * The colours are fixed rather than theme tokens on purpose: like a real video
 * thumbnail, it looks the same in light and dark mode.
 */
export function NoVideoThumbnail({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Video coming soon"
      className={`relative aspect-video w-full overflow-hidden ${className}`}
      style={{
        containerType: "inline-size",
        background: "radial-gradient(circle at 35% 30%, #8c2a26, #5e1a18 55%, #2e0b0b)",
      }}
    >
      <img
        src="/brand/bunge-hub-seal-512.png"
        alt=""
        width={512}
        height={512}
        loading="lazy"
        className="absolute left-1/2 top-[45%] w-[44%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[10px_16px_18px_rgba(0,0,0,0.5)]"
      />
      {/* Text scales with the thumbnail's own width (cqw), so it stays in
          proportion on the small list thumbnail and the big detail one */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-[8%] text-center font-semibold uppercase text-[#f3d9d2]/90"
        style={{ fontSize: "clamp(8px, 2.2cqw, 14px)", letterSpacing: "0.3em" }}
      >
        Video coming soon
      </span>
    </div>
  );
}
