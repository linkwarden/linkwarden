import { useState } from 'react';
import '../styles/AddItem.css';
import TagSelection from './TagSelection';
import addItem from '../modules/send';

const AddItem = ({onExit, reFetch, tags, SetLoader}) => {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [tag, setTag] = useState([]);
  
  function newItem() {
    SetLoader(true)
    addItem(name, link, tag, reFetch, onExit, SetLoader, "POST");
  }

  function SetName(e) {
    setName(e.target.value);
  }

  function SetLink(e) {
    setLink(e.target.value);
  }

  function SetTags(value) {
    setTag(value);
    setTag(value.map(e => e.value.toLowerCase()));
  }

  function abort(e) {
    if (e.target.className === "add-overlay") {
      onExit();
    }
  }

  return (
    <>
      <div className='add-overlay' onClick={abort}></div>
      <fieldset className='box'>
        <legend >New bookmark</legend>
        <div className='AddItem-content'>
          <h3>Name:</h3>
          <input onChange={SetName} className="AddItem-input" type="search" placeholder="e.g. Example Tutorial"/>
          <h3>Link:</h3>
          <input onChange={SetLink} className="AddItem-input" type="search" placeholder="e.g. https://example.com/"/>
          <h3>Tags:</h3>
          <TagSelection setTags={SetTags} tags={tags} />
          <button onClick={newItem} className="upload-btn">Upload &#xf093;</button>
        </div>
      </fieldset>
    </>
  )
}

export default AddItem;
