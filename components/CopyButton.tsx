import React, { useState } from "react";

type Props = {
  text: string;
};

const CopyButton: React.FC<Props> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      className={`text-xl text-neutral btn btn-sm btn-square btn-ghost ${
        copied ? "bi-check2 text-success" : "bi-copy"
      }`}
      onClick={handleCopy}
    ></div>
  );
};

export default CopyButton;
