import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plate, PlateHead } from "@/components/ui/plate";
import { cn } from "cn";

const ACCEPTED_EXTENSIONS = [".mxl", ".musicxml", ".xml"];
const ACCEPT =
  ".mxl,.musicxml,.xml,application/vnd.recordare.musicxml,application/vnd.recordare.musicxml+xml,application/xml,text/xml";

export type PickedFile = {
  file: File;
  path: string;
};

type Entry = {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (
    success: (file: File) => void,
    error?: (error: DOMException) => void,
  ) => void;
  createReader?: () => {
    readEntries: (
      success: (entries: Entry[]) => void,
      error?: (error: DOMException) => void,
    ) => void;
  };
};

type EntryItem = DataTransferItem & {
  webkitGetAsEntry?: () => Entry | null;
};

function isAccepted(file: File): boolean {
  return ACCEPTED_EXTENSIONS.some((extension) =>
    file.name.toLowerCase().endsWith(extension),
  );
}

function readFile(entry: Entry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file?.(
      (file) => resolve(file),
      () => resolve(null),
    );
  });
}

function readEntries(reader: ReturnType<NonNullable<Entry["createReader"]>>) {
  return new Promise<Entry[]>((resolve) => {
    const collected: Entry[] = [];
    const read = () => {
      reader.readEntries(
        (entries) => {
          if (entries.length === 0) {
            resolve(collected);
            return;
          }
          collected.push(...entries);
          read();
        },
        () => resolve(collected),
      );
    };
    read();
  });
}

async function collectEntry(
  entry: Entry,
  prefix: string,
  output: PickedFile[],
): Promise<void> {
  if (entry.isFile) {
    const file = await readFile(entry);
    if (file && isAccepted(file)) {
      output.push({
        file,
        path: prefix ? `${prefix}/${entry.name}` : entry.name,
      });
    }
    return;
  }

  if (entry.isDirectory && entry.createReader) {
    const entries = await readEntries(entry.createReader());
    const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
    for (const child of entries) {
      await collectEntry(child, nextPrefix, output);
    }
  }
}

async function filesFromDrop(dataTransfer: DataTransfer): Promise<PickedFile[]> {
  const items = Array.from(dataTransfer.items) as EntryItem[];
  const entries = items
    .map((item) =>
      item.webkitGetAsEntry
        ? (item.webkitGetAsEntry() as unknown as Entry | null)
        : null,
    )
    .filter((entry): entry is Entry => entry !== null);

  if (entries.length > 0) {
    const output: PickedFile[] = [];
    for (const entry of entries) {
      await collectEntry(entry, "", output);
    }
    return output;
  }

  return Array.from(dataTransfer.files)
    .filter(isAccepted)
    .map((file) => ({ file, path: file.name }));
}

type BatchPickerProps = {
  onFiles: (files: PickedFile[]) => void;
  compact?: boolean;
};

export function BatchPicker({ onFiles, compact = false }: BatchPickerProps) {
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleInput(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
      .filter(isAccepted)
      .map((file) => ({
        file,
        path: file.webkitRelativePath || file.name,
      }));
    event.currentTarget.value = "";
    if (files.length > 0) {
      onFiles(files);
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    const files = await filesFromDrop(event.dataTransfer);
    if (files.length > 0) {
      onFiles(files);
    }
  }

  const inputs = (
    <>
      <input
        ref={filesInputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        aria-hidden="true"
        onChange={handleInput}
        tabIndex={-1}
      />
      <input
        ref={(element) => {
          folderInputRef.current = element;
          if (element) {
            element.setAttribute("webkitdirectory", "");
            element.setAttribute("directory", "");
          }
        }}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        aria-hidden="true"
        onChange={handleInput}
        tabIndex={-1}
      />
    </>
  );

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        {inputs}
        <button
          type="button"
          className="type-hint text-edition-gilt hover:text-edition-ink"
          onClick={() => folderInputRef.current?.click()}
        >
          Add folder
        </button>
        <button
          type="button"
          className="type-hint text-edition-muted hover:text-edition-gilt"
          onClick={() => filesInputRef.current?.click()}
        >
          Add files
        </button>
      </div>
    );
  }

  return (
    <Plate>
      <PlateHead
        label="Files"
        labelAs="h2"
        description="Choose the folder of MusicXML files you want to add."
        meta="0 files"
      />
      <div className="p-4 sm:p-6">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center gap-3 border border-dashed border-edition-field-border px-5 py-10 text-center edition-interactive-transition sm:py-14",
            dragging && "border-edition-gilt bg-edition-hover",
          )}
        >
          <p className="type-row-title">Drop a folder of MusicXML files</p>
          <p className="max-w-md type-body-sm text-edition-muted text-pretty">
            The catalog reads every file before anything is uploaded. You can
            review titles, credits, and rights first.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => folderInputRef.current?.click()}
            >
              Choose folder
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => filesInputRef.current?.click()}
            >
              Choose files
            </Button>
          </div>
        </div>
        {inputs}
        <p className="mt-4 type-caption-mono text-edition-muted">
          .mxl, .musicxml, .xml · up to 200 files · 8 MB each · nothing is
          uploaded until you start.
        </p>
      </div>
    </Plate>
  );
}
