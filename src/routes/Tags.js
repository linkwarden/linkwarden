import { useParams } from 'react-router-dom';
import List from '../componets/List';

const Tags = ({ data }) => {
  const { tagId } = useParams();
  const dataWithMatchingTag = data.filter((e) => {
    return e.tag.includes(tagId)
  });

  console.log(dataWithMatchingTag)

  return (
    <div className="content">
      <List
        data={dataWithMatchingTag} 
      />
    </div>
  )
}

export default Tags