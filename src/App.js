import { useEffect, useState } from 'react';
import './styles/App.css';
import List from './componets/List';
import AddModal from './componets/AddModal';
import config from './config.json';

function App() {
  const [data, setData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [numberOfResults, setNumberOfResults] = useState(0);
  const [nameChecked, setNameChecked] = useState(true);
  const [descriptionChecked, setDescriptionChecked] = useState(true);
  const [tagsChecked, setTagsChecked] = useState(true);

  function toggleFilterBtn(e) {    
    if(e.target.nextSibling.style.display === 'none') {
      e.target.nextSibling.style.display = '';
    } else if(e.target.nextSibling.style.display === '') {
      e.target.nextSibling.style.display = 'none';
    }
  }

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
      <p className="results">{numberOfResults > 0 ? numberOfResults + ' Bookmarks' : 'No bookmarks.'}</p>
      <div className='filter'>
        <button onClick={(e) => toggleFilterBtn(e)}>&#xf0b0;</button>
        <div>
          <label><input type="checkbox" checked={nameChecked} onChange={handleNameCheckbox} />Name</label>
          <label><input type="checkbox" checked={descriptionChecked} onChange={handleDescriptionCheckbox} />Title/Description</label>
          <label><input type="checkbox" checked={tagsChecked} onChange={handleTagsCheckbox} />Tags</label>
        </div>
      </div>
      <List data={filteredData} reFetch={fetchData} />
      {isAdding ? <AddModal onExit={exitAdding} reFetch={fetchData} /> : null}
    </div>
  );
}

export default App;
