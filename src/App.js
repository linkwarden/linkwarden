import { useEffect, useState } from 'react';
import './styles/App.css';
import List from './componets/List';
import AddItem from './componets/AddItem';
import config from './config';
import Filters from './componets/Filters';
import Sort from './componets/Sort';

function App() {
  const [data, setData] = useState([]),
    [newBox, setNewBox] = useState(false),
    [filterBox, setFilterBox] = useState(false),
    [sortBox, setSortBox] = useState(false),
    [searchQuery, setSearchQuery] = useState(''),
    [numberOfResults, setNumberOfResults] = useState(0),
    [nameChecked, setNameChecked] = useState(true),
    [descriptionChecked, setDescriptionChecked] = useState(true),
    [tagsChecked, setTagsChecked] = useState(true),
    [sortBy, setSortBy] = useState('Default');

  function handleNameCheckbox() {
    setNameChecked(!nameChecked);
  }

  function handleDescriptionCheckbox() {
    setDescriptionChecked(!descriptionChecked);
  }

  function handleTagsCheckbox() {
    setTagsChecked(!tagsChecked);
  }

  function exitAdding() {
    setNewBox(!newBox);
  }

  function exitFilter() {
    setFilterBox(!filterBox);
  }

  function exitSorting() {
    setSortBox(!sortBox);
  }

  function search(e) {
    setSearchQuery(e.target.value);
  }

  function sortByFunc(e) {
    setSortBy(e)
  }
  
  const filteredData = data.filter((e) => {
    const name = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const title = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const tags = e.tag.some((e) => e.includes(searchQuery.toLowerCase()));

    if((nameChecked && tagsChecked && descriptionChecked) || (!nameChecked && !tagsChecked && !descriptionChecked)) {
      return (name || title || tags);
    } else if(nameChecked && tagsChecked) {
      return (name || tags);
    } else if(nameChecked && descriptionChecked) {
      return (name || title);
    } else if(tagsChecked && descriptionChecked) {
      return (tags || title);
    } 
    else if(nameChecked) { return name } 
    else if(tagsChecked) { return tags }
    else if(descriptionChecked) { return title }
  });

  function sortList(data = data, sortBy = 'Default') {
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

  async function fetchData() {
    const ADDRESS = config.API.ADDRESS + ":" + config.API.PORT;
    const res = await fetch(ADDRESS + '/api');
    const resJSON = await res.json();
    const data = resJSON.reverse();
    const sortedData = sortList(data, sortBy);
    setData(sortedData);
  }

  const concatTags = () => {
    let tags = [];

    for (let i = 0; i < data.length; i++) {
      tags = tags.concat(data[i].tag)
    }

    tags = tags.filter((v, i, a) => a.indexOf(v) === i);

    return tags;
  }

  useEffect(() => {
    fetchData();
  }, [sortBy]);

  useEffect(() => {
    setNumberOfResults(filteredData.length);
  }, [filteredData]);
  
  return (
    <div className="App">
      <div className="head">
        <input className="search" type="search" placeholder="&#xf002; Search" onChange={search}/>
        <button className="btn" onClick={() => setNewBox(true)}>&#xf067;</button>
      </div>

      <p className="results">{numberOfResults > 0 ? numberOfResults + ' Bookmarks found' : 'No bookmarks found.'}</p>

      <button className='btn' onClick={() => setFilterBox(true)}>&#xf0b0;</button>
      <button className='btn' onClick={() => setSortBox(true)}>&#xf0dc;</button>
      <List data={filteredData} reFetch={fetchData} />

      {sortBox ? <Sort 
        sortBy={sortByFunc}
        onExit={exitSorting}
      /> : null}

      {filterBox ? <Filters 
        nameChecked={nameChecked}
        handleNameCheckbox={handleNameCheckbox}
        descriptionChecked={descriptionChecked}
        handleDescriptionCheckbox={handleDescriptionCheckbox}
        tagsChecked={tagsChecked} 
        handleTagsCheckbox={handleTagsCheckbox}
        onExit={exitFilter}
       /> : null}

      {newBox ? <AddItem 
        onExit={exitAdding} 
        reFetch={fetchData} 
        tags={concatTags} 
      /> : null}
    </div>
  );
}

export default App;
