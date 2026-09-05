type ScoreRightsProps = {
  license: string;
  sourceUrl?: string | null;
};

export function ScoreRights({ license, sourceUrl }: ScoreRightsProps) {
  return (
    <footer className="type-caption-mono space-y-1 border-t border-edition-hairline pt-6 text-edition-muted">
      <p>License: {license}</p>
      {sourceUrl ? (
        <p>
          Source:{" "}
          <a
            href={sourceUrl}
            className="break-all text-edition-ink underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-edition-hairline-strong/50"
            rel="noopener noreferrer"
            target="_blank"
          >
            {sourceUrl}
          </a>
        </p>
      ) : null}
    </footer>
  );
}
