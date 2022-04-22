import '../styles/List.css';

const List = ({data}) => {
  return (
    <table className="table">
        <thead>
            <tr>
                <th>#</th>
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
                    <td>{i + 1}</td>
                    <td>{e.name}</td>
                    <td>{e.title}</td>
                    <td><a href={e.link}>{url.hostname}</a></td>
                    <td>{e.tag}</td>
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