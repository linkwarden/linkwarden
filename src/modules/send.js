import { API_HOST } from "../config";
import { nanoid } from "nanoid";

const addItem = async (
  name,
  link,
  tag,
  collection,
  reFetch,
  onExit,
  SetLoader,
  method,
  id = nanoid(),
  title = "",
  date = new Date().toString()
) => {
  function isValidHttpUrl(string) {
    let url;

    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
  }

  if (isValidHttpUrl(link)) {
    fetch(API_HOST + "/api", {
      method: method,
      body: JSON.stringify({
        _id: id,
        name: name,
        title: title,
        link: link,
        tag: tag,
        collection: collection,
        date: date,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((res) => res.text())
      .then(() => reFetch())
      .then(() => {
        SetLoader(false);
      });

    onExit();
  } else if (!isValidHttpUrl(link) && link !== "") {
    SetLoader(false);
    alert(
      'Please make sure the link is valid.\n\n(i.e. starts with "http"/"https")'
    );
  } else {
    SetLoader(false);
  }
};

export default addItem;
