// The search that finds a tag by its name, in double quotes so a name like
// `!important` or `Rock AND Roll` is searched as written. Quotes, apostrophes
// and backslashes in the name are escaped, so they can't end the quotes early.
export default function tagSearch(tag: string) {
  return `"${tag.replace(/["'\\]/g, "\\$&")}"`;
}
