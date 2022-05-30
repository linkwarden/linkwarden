import { useEffect, useState } from 'react';
import './styles/App.css';
import List from './componets/List';
import AddItem from './componets/AddItem';
import config from './config.json';
import Filters from './componets/Filters';

function App() {
  const [data, setData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [numberOfResults, setNumberOfResults] = useState(0);
  const [nameChecked, setNameChecked] = useState(true);
  const [descriptionChecked, setDescriptionChecked] = useState(true);
  const [tagsChecked, setTagsChecked] = useState(true);

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
    setIsAdding(!isAdding);
  }

  function exitFilter() {
    setIsFiltering(!isFiltering);
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
    const Data = resJSON.sort((a, b) => { return b-a });
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
        <button className="add-btn" onClick={() => setIsAdding(true)}>&#xf067;</button>
      </div>

      <p className="results">{numberOfResults > 0 ? numberOfResults + ' Bookmarks found' : 'No bookmarks found.'}</p>

      <button className='filter-button' onClick={() => setIsFiltering(true)}>&#xf0b0;</button>
      {isFiltering ? <Filters 
        nameChecked={nameChecked}
        handleNameCheckbox={handleNameCheckbox}
        descriptionChecked={descriptionChecked}
        handleDescriptionCheckbox={handleDescriptionCheckbox}
        tagsChecked={tagsChecked} 
        handleTagsCheckbox={handleTagsCheckbox}
        onExit={exitFilter}
       /> : null}

      <List data={filteredData} reFetch={fetchData} />

      {isAdding ? <AddItem onExit={exitAdding} reFetch={fetchData} tags={concatTags} /> : null}
    </div>
  );
}

export default App;
