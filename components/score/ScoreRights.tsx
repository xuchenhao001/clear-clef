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
            className="text-edition-ink underline-offset-2 hover:underline"
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
