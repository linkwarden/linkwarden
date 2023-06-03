const getPublicCollectionData = async (
  collectionId: string,
  setData?: Function
) => {
  const res = await fetch(
    "/api/public/routes/collections/?collectionId=" + collectionId
  );

  const data = await res.json();

  if (setData) setData(data.response);

  return data;
};

export default getPublicCollectionData;
