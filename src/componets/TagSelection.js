import { useState } from "react";
import CreatableSelect from "react-select/creatable";

const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "vanilla", label: "Vanilla" }
];

const customStyles = {
  container: (provided) => ({
    ...provided,
    marginLeft: '20%',
    marginRight: '20%',
  }),

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
    borderRadius: '10px',
    opacity: '90%',
    color: 'gray',
    background: '#273949',
    boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
  }),

  input: (provided) => ({
    ...provided,
    color: 'white',
}),

  control: (provided) => ({
    ...provided,
    background: '#273949',
    border: 'none',
    borderRadius: '10px',
    boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
  }),
}

export default function TagSelection() {
  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <CreatableSelect
        styles={customStyles}
        isMulti
        defaultValue={selectedOption}
        onChange={setSelectedOption}
        options={options}
    />
  );
}
