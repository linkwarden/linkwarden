const filteredData = (
  data,
  searchQuery,
  filterCheckbox
) => {
  return data.filter((e) => {
    const linkName = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const websiteTitle = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const tags = e.tag.some((e) => e.includes(searchQuery.toLowerCase()));

    if (filterCheckbox.every(e => e === true)) {
      return linkName || websiteTitle || tags;
    } else if (filterCheckbox[0] && filterCheckbox[2]) {
      return linkName || tags;
    } else if (filterCheckbox[0] && filterCheckbox[1]) {
      return linkName || websiteTitle;
    } else if (filterCheckbox[2] && filterCheckbox[1]) {
      return tags || websiteTitle;
    } else if (filterCheckbox[0]) {
      return linkName;
    } else if (filterCheckbox[1]) {
      return websiteTitle;
    } else if (filterCheckbox[2]) {
      return tags;
    }
  });
};

export default filteredData;
