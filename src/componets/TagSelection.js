import { useState } from "react";
import CreatableSelect from "react-select/creatable";

const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "vanilla", label: "Vanilla" }
];

const customStyles = {
  placeholder: (provided) => ({
    ...provided,
    color: '#a9a9a9',
  }),

  indicatorSeparator: (provided) => ({
    ...provided,
    display: 'none',
  }),

  menu: (provided) => ({
    ...provided,
    padding: '5px',
    opacity: '90%',
    color: 'gray',
    background: '#273949',
    boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
  }),

  input: (provided) => ({
    ...provided,
    color: 'white',
}),

  control: (provided, state) => ({
    ...provided,
    background: '#273949',
    border: 'none',
    boxShadow: state.isFocused ? 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' : 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
  }),
}

export default function TagSelection({setTags, tags}) {
  const data = tags().map((e) => {
      return { value: e, label: e }
  })

  return (
    <CreatableSelect
        styles={customStyles}
        isMulti
        onChange={setTags}
        options={data}
    />
  );
}
