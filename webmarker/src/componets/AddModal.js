import { useState } from 'react';
import '../styles/Modal.css';

const AddModal = ({onExit}) => {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [tag, setTag] = useState('');

  function SetName(e) {
    setName(e.target.value);
  }

  function SetLink(e) {
    setLink(e.target.value);
  }

  function SetTag(e) {
    setTag(e.target.value);
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

    if(name != '' && isValidHttpUrl(link) && tag != '') {
      fetch("/post", {
        
        // Adding method type
        method: "POST",
        
        // Adding body or contents to send
        body: JSON.stringify({
            name: name,
            title: "foo",
            link: link,
            tag: tag
        }),
        
        // Adding headers to the request
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
      });
  
      onExit();
    } else if(name != '' && link != '' && tag != '') {
      alert('Please make sure the link is valid.\n\n(i.e. starts with "http"/"https")');
    }

    else {
      alert('Please fill all fields and make sure the link is valid.\n\n(i.e. starts with "http"/"https")');
    }
  }

  function abort(e) {
    if (e.target.className == "overlay" || e.target.className == "cancel-btn") {
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
          <input onChange={SetTag} className="modal-input" type="search" placeholder="e.g. Tutorials"/>
          <button onClick={submitBookmark} className="upload-btn">Upload &#xf093;</button>
          <button className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default AddModal
