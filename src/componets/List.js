import '../styles/List.css';
import config from '../config.json';

const List = ({data}) => {
  function deleteEntity(id) {
    const address = config.client.api_address + ":" + config.server.port;
    fetch(address + "/delete", {
    
        // Adding method type
        method: "DELETE",
        
        // Adding body or contents to send
        body: JSON.stringify({id}),
        
        // Adding headers to the request
        headers: {
            "Content-type": "application/json; charset=UTF-8",
        }
    })
    .then(res => res.text())
    .then(message => {console.log(message)})
  }

  return (
    <table className="table">
        <thead>
            <tr>
                <th className='number'>#</th>
                <th>Name</th>
                <th>Title</th>
                <th>Link</th>
                <th>Tag</th>
            </tr>
        </thead>
        <tbody>
        {data.map((e, i) => {
            try {
                const url = new URL(e.link)
                return <tr key={i}>
                    <td className='number'>{i + 1}</td>
                    <td>{e.name}</td>
                    <td>{e.title}</td>
                    <td><a href={e.link}>{url.hostname}</a></td>
                    <td>{e.tag}</td>
                    <td className="delete" onClick={() => deleteEntity(e._id)}>&#xf2ed;</td>
                </tr>
            } catch (e) {
                console.log(e)
            }
        })}
        </tbody>
    </table>
  )
}

export default List