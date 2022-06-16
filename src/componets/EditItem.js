import { useState } from 'react';
import deleteEntity from '../modules/deleteEntity';
import '../styles/SendItem.css';
import TagSelection from './TagSelection';
import editItem from '../modules/send';

const EditItem = ({tags, item, onExit, SetLoader, reFetch, lightMode }) => {
  const [name, setName] = useState(item.name);
  const [tag, setTag] = useState(item.tag);

  function EditItem() {
    SetLoader(true);
    editItem(name, item.link, tag, reFetch, onExit, SetLoader, "PUT", item._id, item.title);
  }

  function deleteItem() {
    SetLoader(true);
    deleteEntity(item._id, reFetch, onExit, SetLoader);
  }

  function SetName(e) {
    setName(e.target.value);
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

  const url = new URL(item.link);

  return (
    <>
      <div className='add-overlay' onClick={abort}></div>
      <div className='send-box'>
        <fieldset className='box'>
          <legend >Edit bookmark</legend>
          <button className="delete" onClick={deleteItem}>&#xf2ed;</button>
          <div className='AddItem-content'>
          <h3>Link: <a className='link' target="_blank" rel="noreferrer" href={item.link}>{url.hostname}</a></h3>
          <h3 className='title'><b>{item.title}</b></h3>
          
            <h3>Name: <span className='optional'>(Optional)</span></h3>
            <input onChange={SetName} className="AddItem-input" type="search" value={name} placeholder={"e.g. Example Tutorial"} />
            <h3>Tags: <span className='optional'>(Optional)</span></h3>
            <TagSelection setTags={SetTags} tags={tags} tag={tag} lightMode={lightMode} />
            <button onClick={EditItem} className="send-btn">Update &#xf303;</button>
          </div>
        </fieldset>
      </div>
    </>
  )
}

export default EditItem