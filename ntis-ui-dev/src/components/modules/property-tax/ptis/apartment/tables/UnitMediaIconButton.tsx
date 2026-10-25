'use client';

import React, { useCallback, useState } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ImageIcon, Loader2, Map as PlanIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DocumentViewerModal } from '@/components/common';
import { getDocumentBlobUrl } from '@/lib/utils/document-client-utils';

interface UnitMediaIconButtonProps {
  /** Document guid of the photo / plan; nothing but a dash is shown when there is none. */
  documentGuid: string | null;
  kind: 'photo' | 'plan';
  /** Title shown in the viewer, e.g. "Unit 132 - S1 - Property Photo". */
  title: string;
  /** Tooltip of the icon. */
  tooltip: string;
}

/**
 * A small icon in the table cell. Clicking it opens the unit's photo or plan in the common DocumentViewerModal
 * (zoom, pan, fullscreen, print), the same viewer the Building Permission tab uses.
 */
export function UnitMediaIconButton({ documentGuid, kind, title, tooltip }: UnitMediaIconButtonProps): React.ReactElement {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [viewer, setViewer] = useState<{ url: string; name: string; contentType: string } | null>(null);

  const openViewer = useCallback(async () => {
    if (!documentGuid || loading) return;
    setLoading(true);
    try {
      const res = await getDocumentBlobUrl(documentGuid, locale);
      const extension = res.contentType?.toLowerCase().includes('png') ? 'png' : res.contentType?.toLowerCase().startsWith('image/') ? 'jpg' : 'pdf';
      setViewer({ url: res.url, name: `${title}.${extension}`, contentType: res.contentType });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : tooltip);
    } finally {
      setLoading(false);
    }
  }, [documentGuid, loading, locale, title, tooltip]);

  const closeViewer = useCallback(() => {
    if (viewer?.url) URL.revokeObjectURL(viewer.url);
    setViewer(null);
  }, [viewer]);

  if (!documentGuid) return <span className="text-zinc-300">-</span>;

  const Icon = kind === 'photo' ? ImageIcon : PlanIcon;

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); void openViewer(); }}
        title={tooltip}
        aria-label={tooltip}
        disabled={loading}
        className={cn(
          'w-7 h-7 mx-auto rounded-md border flex items-center justify-center cursor-pointer shadow-2xs transition-all hover:scale-105 disabled:cursor-wait',
          kind === 'photo'
            ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
            : 'bg-violet-50 text-violet-700 border-violet-300 hover:bg-violet-100',
        )}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      </button>

      {viewer && (
        <DocumentViewerModal
          isOpen
          onClose={closeViewer}
          fileUrl={viewer.url}
          fileName={viewer.name}
          label={title}
          contentType={viewer.contentType}
        />
      )}
    </>
  );
}
