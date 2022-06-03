import '../styles/List.css';
import LazyLoad from 'react-lazyload';
import ViewArchived from './ViewArchived';
import deleteEntity from '../modules/deleteEntity';

const List = ({data, reFetch}) => {
  return (
    <div className="list">
        {/* eslint-disable-next-line */}
        {data.map((e, i) => {
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
                        <div className='options'>
                            <ViewArchived className='view-archived' id={e._id} />
                            <div className="delete" onClick={() => deleteEntity(e._id, reFetch)}>&#xf2ed;</div>
                        </div>
                    </div>
                </LazyLoad>)
            } catch (e) {
                console.log(e);
            }
        })}
    </div>
  )
}

export default List