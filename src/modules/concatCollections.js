const concatCollections = (data) => {
  let collections = [];

  for (let i = 0; i < data.length; i++) {
    collections = collections.concat(data[i].collection);
  }

  collections = collections.filter((v, i, a) => a.indexOf(v) === i);

  return collections;
};

export default concatCollections;
