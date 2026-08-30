"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { setKey, setScale } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { parseProgressionUrlContext } from "./validators";

export const useProgressionUrlContext = (): boolean => {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentKey, currentScale } = useAppSelector(
    (state) => state.fretboard,
  );
  const hasAppliedInitialUrl = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (hasAppliedInitialUrl.current) {
      return;
    }

    hasAppliedInitialUrl.current = true;
    const urlContext = parseProgressionUrlContext(searchParams);

    if (urlContext.currentKey && urlContext.currentKey !== currentKey) {
      dispatch(setKey(urlContext.currentKey));
    }

    if (urlContext.currentScale && urlContext.currentScale !== currentScale) {
      dispatch(setScale(urlContext.currentScale));
    }

    setIsReady(true);
  }, [currentKey, currentScale, dispatch, searchParams]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("key", currentKey);
    nextSearchParams.set("scale", currentScale);
    const nextQuery = nextSearchParams.toString();

    if (nextQuery !== searchParams.toString()) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }
  }, [currentKey, currentScale, isReady, pathname, router, searchParams]);

  return isReady;
};
