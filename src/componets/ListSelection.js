import CreatableSelect from "react-select/creatable";

export default function ListSelection({ setList, lists, list = 'Unsorted', lightMode }) {
  const customStyles = {
    container: (provided) => ({
      ...provided,
      textShadow: "none",
    }),

    placeholder: (provided) => ({
      ...provided,
      color: "#a9a9a9",
    }),

    menu: (provided) => ({
      ...provided,
      border: "solid",
      borderWidth: "1px",
      borderRadius: "0px",
      borderColor: "rgb(141, 141, 141)",
      opacity: "90%",
      color: "gray",
      background: lightMode ? "lightyellow" : "#273949",
      boxShadow:
        "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px",
    }),

    input: (provided) => ({
      ...provided,
      color: lightMode ? "rgb(64, 64, 64)" : "white",
    }),

    singleValue: (provided) => ({
      ...provided,
      color: lightMode ? "rgb(64, 64, 64)" : "white",
    }),

    control: (provided, state) => ({
      ...provided,
      background: lightMode ? "lightyellow" : "#273949",
      border: "none",
      borderRadius: "0px",
      boxShadow: state.isFocused
        ? "rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px"
        : "rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset",
    }),
  };

  const data = lists().map((e) => {
    return { value: e, label: e };
  });

  const defaultList = { value: list, label: list };

  return (
    <CreatableSelect
      defaultValue={defaultList}
      styles={customStyles}
      onChange={setList}
      options={data}
    />
  );
}
