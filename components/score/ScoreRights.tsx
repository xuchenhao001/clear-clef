type ScoreRightsProps = {
  license: string;
  sourceUrl?: string | null;
};

export function ScoreRights({ license, sourceUrl }: ScoreRightsProps) {
  return (
    <>
      <div className="stat-row">
        <span className="type-label">License</span>
        <span className="type-value">{license}</span>
      </div>
      {sourceUrl ? (
        <div className="stat-row">
          <span className="type-label">Source</span>
          <a
            href={sourceUrl}
            className="type-value break-all underline-offset-2 outline-none hover:text-edition-gilt hover:underline focus-visible:ring-3 focus-visible:ring-edition-focus-ring"
            rel="noopener noreferrer"
            target="_blank"
          >
            {sourceUrl}
          </a>
        </div>
      ) : null}
    </>
  );
}
