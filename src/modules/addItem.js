import config from '../config';
import { nanoid } from 'nanoid';

const addItem = async (name, link, tag, reFetch, onExit, SetLoader) => {
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
        method: "POST",
        body: JSON.stringify({
            _id: nanoid(),
            name: name,
            title: '',
            link: link,
            tag: tag
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
      })
      .then(res => res.text())
      .then(message => {SetLoader(false)})
      .then(() => reFetch());

      onExit();
    } else if(name !== '' && link !== '' && tag !== '') {
      alert('Please make sure the link is valid.\n\n(i.e. starts with "http"/"https")');
    }

    else {
      alert('Please fill all fields and make sure the link is valid.\n\n(i.e. starts with "http"/"https")');
    }
  }

export default addItem;