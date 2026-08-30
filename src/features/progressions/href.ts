export const buildProgressionHref = (
  slug: string,
  currentKey: string,
  currentScale: string,
): string => {
  const searchParams = new URLSearchParams({
    key: currentKey,
    scale: currentScale,
  });

  return `/progressions/${slug}?${searchParams.toString()}`;
};
