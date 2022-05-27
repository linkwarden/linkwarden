import { useState } from 'react';
import { nanoid } from 'nanoid'
import '../styles/Modal.css';
import config from '../config.json';

const AddModal = ({onExit, reFetch}) => {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [tag, setTag] = useState([]);

  function SetName(e) {
    setName(e.target.value);
  }

  function SetLink(e) {
    setLink(e.target.value);
  }

  function SetTag(e) {
    setTag([e.target.value]);
    setTag(e.target.value.split(/(\s+)/).filter( e => e.trim().length > 0).map(e => e.toLowerCase()))
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
      const address = config.api.address + ":" + config.api.port;
      fetch(address + "/api", {
        
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
    if (e.target.className === "overlay" || e.target.className === "cancel-btn") {
      onExit();
    }
  }

  return (
    <div className='overlay' onClick={abort}>
      <div className='box'>
        <div className='modal-content'>
          <h2>Add Bookmark</h2>
          <h3>Name:</h3>
          <input onChange={SetName} className="modal-input" type="search" placeholder="e.g. Example Tutorial"/>
          <h3>Link:</h3>
          <input onChange={SetLink} className="modal-input" type="search" placeholder="e.g. https://example.com/"/>
          <h3>Tag:</h3>
          <input onChange={SetTag} className="modal-input" type="search" placeholder="e.g. Tutorials (Seperate with spaces)"/>
          <button onClick={submitBookmark} className="upload-btn">Upload &#xf093;</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default AddModal
