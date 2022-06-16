const concatTags = (data) => {
  let tags = [];

  for (let i = 0; i < data.length; i++) {
    tags = tags.concat(data[i].tag);
  }

  tags = tags.filter((v, i, a) => a.indexOf(v) === i);

  return tags;
};

export default concatTags;
