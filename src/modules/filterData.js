const filteredData = (
  data,
  searchQuery,
  nameChecked,
  tagsChecked,
  descriptionChecked
) => {
  return data.filter((e) => {
    const name = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const title = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const tags = e.tag.some((e) => e.includes(searchQuery.toLowerCase()));

    if (nameChecked && tagsChecked && descriptionChecked) {
      return name || title || tags;
    } else if (nameChecked && tagsChecked) {
      return name || tags;
    } else if (nameChecked && descriptionChecked) {
      return name || title;
    } else if (tagsChecked && descriptionChecked) {
      return tags || title;
    } else if (nameChecked) {
      return name;
    } else if (tagsChecked) {
      return tags;
    } else if (descriptionChecked) {
      return title;
    }
  });
};

export default filteredData;
