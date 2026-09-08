const colour = process.stdout.isTTY && !process.env.NO_COLOR;
const cyan = (text) => (colour ? `\x1b[36m${text}\x1b[0m` : text);

console.log(
  "Now run `open safari/Linkwarden/Linkwarden.xcodeproj` and then Cmd+R in Xcode."
);
console.log(
  cyan(
    "For submission, run `yarn bump:build` first, then in Xcode: Product → Archive, then Organizer → Distribute App → App Store Connect → Upload."
  )
);
