import CreatableSelect from "react-select/creatable";

export default function CollectionSelection({
  setCollection,
  collections,
  collection = "Unsorted",
  lightMode,
}) {
  const customStyles = {
    container: (provided) => ({
      ...provided,
      textShadow: "none",
    }),

    placeholder: (provided) => ({
      ...provided,
      color: "#a9a9a9",
    }),

    option: (provided) => ({
      ...provided,
      ':before': {
        content: '""',
        marginRight: 8,
      },
    }),

    menu: (provided) => ({
      ...provided,
      border: "solid",
      borderWidth: "1px",
      borderRadius: "0px",
      borderColor: "rgb(141, 141, 141)",
      opacity: "90%",
      color: "gray",
      background: lightMode ? "#e0e0e0" : "#273949",
      boxShadow:
        "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px",
    }),

    input: (provided) => ({
      ...provided,
      color: lightMode ? "rgb(64, 64, 64)" : "white",
      
    }),

    singleValue: (provided) => ({
      ...provided,
      ':before': {
        content: '""',
        marginRight: 8,
      },
      color: lightMode ? "rgb(64, 64, 64)" : "white",
    }),

    control: (provided) => ({
      ...provided,
      background: lightMode ? "#e0e0e0" : "#273949",
      borderWidth: "2px",
      borderColor: lightMode ? "#1e88e5": "#e7f4ff",
      borderRadius: "50px",
      boxShadow: lightMode ? "0px 2px 0px #354c7d, 0px 3px 1px #363636" : "0px 2px 0px #c6e4ff, 0px 3px 1px #363636",
    }),
  };

  const data = collections().map((e) => {
    return { value: e, label: e };
  });

  const defaultCollection = { value: collection, label: collection };

  return (
    <CreatableSelect
      className="select"
      defaultValue={defaultCollection}
      styles={customStyles}
      onChange={setCollection}
      options={data}
    />
  );
}
