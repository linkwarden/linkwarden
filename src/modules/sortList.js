const sortList = (data, sortBy) => {
  let sortedData = data;
  if (sortBy.toString() === '1') {
    sortedData.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  } else if (sortBy.toString() === '2') {
    sortedData.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
  } else if (sortBy.toString() === '3') {
    sortedData.sort((a, b) => {
      const A = a.name.toLowerCase(),
        B = b.name.toLowerCase();
      if (A < B) return -1;
      if (A > B) return 1;
      return 0;
    });
  } else if (sortBy.toString() === '4') {
    sortedData.sort((a, b) => {
      const A = a.name.toLowerCase(),
        B = b.name.toLowerCase();
      if (A > B) return -1;
      if (A < B) return 1;
      return 0;
    });
  } else if (sortBy.toString() === '5') {
    sortedData.sort((a, b) => {
      const A = a.title.toLowerCase(),
        B = b.title.toLowerCase();
      if (A < B) return -1;
      if (A > B) return 1;
      return 0;
    });
  } else if (sortBy.toString() === '6') {
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
