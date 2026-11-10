// The dates the database can store: years 0 to 9999
const EARLIEST = Date.parse("0000-01-01T00:00:00.000Z");
const LATEST = Date.parse("9999-12-31T23:59:59.999Z");

// Whether a date is valid and in the years above
export function isStorableDate(date: Date) {
  const time = date.getTime();

  return time >= EARLIEST && time <= LATEST;
}

// An import's links, oldest first, so that adding them in this order gives them
// ids that follow their dates. Exports often list the newest bookmark first, and
// adding links in file order left them reversed in date sorts.
//
// `dateOf` gives the date the import stores for a link. A link without one shows
// the moment it's imported, so it goes after every link dated before then. A date
// that can't be stored (not a valid date, or outside the years above) stops the
// import at that link, so those go last, after every link that can be added.
// Links with the same date keep the order the file lists them in.
export default function oldestFirst<T>(
  links: T[],
  dateOf: (link: T) => Date | null | undefined
) {
  const importedAt = Date.now();

  return links
    .map((link, index) => {
      const date = dateOf(link);

      return {
        link,
        index,
        time: !date
          ? importedAt
          : isStorableDate(date)
            ? date.getTime()
            : Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.time - b.time || a.index - b.index)
    .map(({ link }) => link);
}
