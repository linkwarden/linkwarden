const sortList = (data, sortBy) => {
    let sortedData = data;
    if(sortBy === 'Date (Oldest first)') {
      sortedData.reverse();
    } else if(sortBy === 'Name (A-Z)') {
      sortedData.sort(function(a, b){
        const A = a.name.toLowerCase(), B = b.name.toLowerCase();
        if (A < B)
         return -1;
        if (A > B)
         return 1;
        return 0;
       });
    } else if(sortBy === 'Name (Z-A)') {
      sortedData.sort(function(a, b){
        const A = a.name.toLowerCase(), B = b.name.toLowerCase();
        if (A > B)
         return -1;
        if (A < B)
         return 1;
        return 0;
       });
    } else if(sortBy === 'Title (A-Z)') {
      sortedData.sort(function(a, b){
        const A = a.title.toLowerCase(), B = b.title.toLowerCase();
        if (A < B)
         return -1;
        if (A > B)
         return 1;
        return 0;
       });
    } else if(sortBy === 'Title (Z-A)') {
      sortedData.sort(function(a, b){
        const A = a.title.toLowerCase(), B = b.title.toLowerCase();
        if (A > B)
         return -1;
        if (A < B)
         return 1;
        return 0;
       });
    } 

    return sortedData;
}

export default sortList;