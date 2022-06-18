import { API_HOST } from "../config";

const deleteEntity = (id, reFetch, onExit, SetLoader) => {
  fetch(API_HOST + "/api", {
    method: "DELETE",
    body: JSON.stringify({ id }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then((res) => res.text())
    .then((message) => {
      console.log(message);
    })
    .then(() => onExit())
    .then(() => reFetch())
    .then(() => {
      SetLoader(false);
    });
};

export default deleteEntity;
