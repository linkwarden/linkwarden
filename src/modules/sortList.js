const sortList = (data, sortBy) => {
  let sortedData = data;
  if (sortBy === "Default") {
    sortedData.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  } else if (sortBy === "Date (Oldest first)") {
    sortedData.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
  } else if (sortBy === "Name (A-Z)") {
    sortedData.sort((a, b) => {
      const A = a.name.toLowerCase(),
        B = b.name.toLowerCase();
      if (A < B) return -1;
      if (A > B) return 1;
      return 0;
    });
  } else if (sortBy === "Name (Z-A)") {
    sortedData.sort((a, b) => {
      const A = a.name.toLowerCase(),
        B = b.name.toLowerCase();
      if (A > B) return -1;
      if (A < B) return 1;
      return 0;
    });
  } else if (sortBy === "Title (A-Z)") {
    sortedData.sort((a, b) => {
      const A = a.title.toLowerCase(),
        B = b.title.toLowerCase();
      if (A < B) return -1;
      if (A > B) return 1;
      return 0;
    });
  } else if (sortBy === "Title (Z-A)") {
    sortedData.sort((a, b) => {
      const A = a.title.toLowerCase(),
        B = b.title.toLowerCase();
      if (A > B) return -1;
      if (A < B) return 1;
      return 0;
    });
  }

  return sortedData;
};

export default sortList;
