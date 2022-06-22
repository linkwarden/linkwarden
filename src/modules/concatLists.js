const concatLists = (data) => {
  let lists = [];

  for (let i = 0; i < data.length; i++) {
    lists = lists.concat(data[i].list);
  }

  lists = lists.filter((v, i, a) => a.indexOf(v) === i);

  return lists;
};

export default concatLists;
