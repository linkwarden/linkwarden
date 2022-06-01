import { useEffect, useState } from 'react';
import './styles/App.css';
import List from './componets/List';
import AddItem from './componets/AddItem';
import config from './config.json';
import Filters from './componets/Filters';
import Sort from './componets/Sort';

function App() {
  const [data, setData] = useState([]);
  const [newBox, setNewBox] = useState(false);
  const [filterBox, setFilterBox] = useState(false);
  const [sortBox, setSortBox] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [numberOfResults, setNumberOfResults] = useState(0);
  const [nameChecked, setNameChecked] = useState(true);
  const [descriptionChecked, setDescriptionChecked] = useState(true);
  const [tagsChecked, setTagsChecked] = useState(true);
  const [sort, setSort] = useState('Date');

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

  async function fetchData() {
    const address = config.api.address + ":" + config.api.port;
    const res = await fetch(address + '/api');
    const resJSON = await res.json();
    const Data = resJSON.sort((a, b) => { return b-a }); // <-- SORT IT!
    setData(Data);
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
  }, []);

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
        onExit={exitSorting} 
        reFetch={fetchData}
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
