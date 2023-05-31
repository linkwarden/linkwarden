const getPublicCollectionData = async (collectionId: string) => {
  const res = await fetch(
    "/api/public/routes/collections/?collectionId=" + collectionId
  );

  const data = await res.json();

  console.log(data);

  return data;
};

export default getPublicCollectionData;
