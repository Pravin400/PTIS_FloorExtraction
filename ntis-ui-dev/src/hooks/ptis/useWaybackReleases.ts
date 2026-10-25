/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { fetchWaybackReleases, type WaybackRelease } from '@/lib/api/wayback.service';

let waybackCache: WaybackRelease[] | null = null;
let waybackPromise: Promise<WaybackRelease[]> | null = null;

export function useWaybackReleases(enabled: boolean): { waybackReleases: WaybackRelease[]; loadingWayback: boolean } {
  const [waybackReleases, setWaybackReleases] = useState<WaybackRelease[]>(() => waybackCache || []);
  const [loadingWayback, setLoadingWayback] = useState<boolean>(!waybackCache && enabled);

  useEffect(() => {
    if (!enabled) {
      setLoadingWayback(false);
      return;
    }

    if (waybackCache) {
      setWaybackReleases(waybackCache);
      setLoadingWayback(false);
      return;
    }

    let active = true;
    setLoadingWayback(true);

    if (!waybackPromise) {
      waybackPromise = fetchWaybackReleases()
        .then((res) => {
          waybackCache = res;
          return res;
        })
        .catch((err) => {
          waybackPromise = null;
          throw err;
        });
    }

    waybackPromise
      .then((releases) => {
        if (active) {
          setWaybackReleases(releases);
          setLoadingWayback(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoadingWayback(false);
        }
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { waybackReleases, loadingWayback };
}
