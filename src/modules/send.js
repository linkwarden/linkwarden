import config from '../config';
import { nanoid } from 'nanoid';

const addItem = async (name, link, tag, reFetch, onExit, SetLoader, method, id=nanoid()) => {
    function isValidHttpUrl(string) {
      let url;
      
      try {
        url = new URL(string);
      } catch (_) {
        return false;  
      }
    
      return url.protocol === "http:" || url.protocol === "https:";
    }

    if(isValidHttpUrl(link)) {
      const ADDRESS = config.API.ADDRESS + ":" + config.API.PORT;
      fetch(ADDRESS + "/api", {
        method: method,
        body: JSON.stringify({
            _id: id,
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
      .then(() => reFetch())
      .then(() => {SetLoader(false)});

      onExit();
    } else {
      SetLoader(false)
      alert('Please make sure the link is valid.\n\n(i.e. starts with "http"/"https")');
    }
  }

export default addItem;