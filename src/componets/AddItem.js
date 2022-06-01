import { useState } from 'react';
import { nanoid } from 'nanoid'
import '../styles/AddItem.css';
import config from '../config';
import TagSelection from './TagSelection';

const AddItem = ({onExit, reFetch, tags}) => {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [tag, setTag] = useState([]);

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

  async function submitBookmark() {
    function isValidHttpUrl(string) {
      let url;
      
      try {
        url = new URL(string);
      } catch (_) {
        return false;  
      }
    
      return url.protocol === "http:" || url.protocol === "https:";
    }

    if(name !== '' && isValidHttpUrl(link) && tag !== '') {
      const ADDRESS = config.API.ADDRESS + ":" + config.API.PORT;
      fetch(ADDRESS + "/api", {
        
        // Adding method type
        method: "POST",
        
        // Adding body or contents to send
        body: JSON.stringify({
            _id: nanoid(),
            name: name,
            title: '',
            link: link,
            tag: tag
        }),
        
        // Adding headers to the request
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
      })
      .then(res => res.text())
      .then(message => {console.log(message)})
      .then(() => reFetch());
  
      onExit();
    } else if(name !== '' && link !== '' && tag !== '') {
      alert('Please make sure the link is valid.\n\n(i.e. starts with "http"/"https")');
    }

    else {
      alert('Please fill all fields and make sure the link is valid.\n\n(i.e. starts with "http"/"https")');
    }
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
          <button onClick={submitBookmark} className="upload-btn">Upload &#xf093;</button>
        </div>
      </fieldset>
    </>
  )
}

export default AddItem
