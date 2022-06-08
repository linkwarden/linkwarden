import '../styles/List.css';
import LazyLoad from 'react-lazyload';
import ViewArchived from './ViewArchived';
import EditItem from './EditItem';
import { useState } from 'react'

const List = ({data, tags, reFetch, SetLoader, lightMode}) => {
    const [editBox, setEditBox] = useState(false)
    const [editIndex, setEditIndex] = useState(0)

    function edit(index) {
        setEditBox(true);
        setEditIndex(index);
    }

    function exitEditing() {
        setEditBox(false);
    }

    return (
        <div className="list">
            {/* eslint-disable-next-line */}
            {data.map((e, i, array) => {
                try {
                    const url = new URL(e.link);
                    const favicon = 'http://www.google.com/s2/favicons?domain=' + url.hostname;
                    return (<LazyLoad key={i} height={200} offset={200}>
                        <div className="list-row">
                            <div className="img-content-grp">
                                <img alt='' src={favicon} />
                                <div className="list-entity-content">
                                    <div className='row-name'>
                                        <span className="num">{i + 1}.</span> {e.name} <a target="_blank" rel="noreferrer" href={e.link}>({url.hostname})</a>
                                    </div>
                                    <div>{e.title}</div>
                                    <div className="tags">
                                        {e.tag.map((e, i) => {
                                            return (<div key={i}>{e}</div>)
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className='etc'>
                                <ViewArchived className='view-archived' id={e._id} />
                                <button className="btn edit-btn" onClick={() => edit(i)}>&#xf303;</button>
                            </div>
                        </div>
                    </LazyLoad>)
                } catch (e) {
                    console.log(e);
                }
            })}
            {editBox ? <EditItem lightMode={lightMode} tags={() => tags} onExit={exitEditing} SetLoader={SetLoader} reFetch={reFetch} item={data[editIndex]} /> : null}
        </div>
    )
}

export default List