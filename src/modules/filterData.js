const filteredData = (
  data,
  searchQuery,
  filterCheckbox
) => {
  return data.filter((e) => {
    const name = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const title = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const tags = e.tag.some((e) => e.includes(searchQuery.toLowerCase()));

    if (filterCheckbox === [true, true, true]) {
      return name || title || tags;
    } else if (filterCheckbox[0] && filterCheckbox[2]) {
      return name || tags;
    } else if (filterCheckbox[0] && filterCheckbox[1]) {
      return name || title;
    } else if (filterCheckbox[2] && filterCheckbox[1]) {
      return tags || title;
    } else if (filterCheckbox[0]) {
      return name;
    } else if (filterCheckbox[1]) {
      return tags;
    } else if (filterCheckbox[2]) {
      return title;
    }
  });
};

export default filteredData;
