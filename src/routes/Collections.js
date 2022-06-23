import { useParams } from "react-router-dom";
import List from "../componets/List";

const Collections = ({ data, tags, collections, SetLoader, lightMode, reFetch }) => {
  const { collectionId } = useParams();
  const dataWithMatchingTag = data.filter((e) => {
    return e.collection.includes(collectionId);
  });

  return (
    <div className="content">
      <List
        lightMode={lightMode}
        data={dataWithMatchingTag}
        tags={tags}
        collections={collections}
        SetLoader={SetLoader}
        reFetch={reFetch}
      />
    </div>
  );
};

export default Collections;
