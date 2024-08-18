import React from "react";

type Props = {
  text: string;
};

const CopyButton = ({ text }: Props) => {
  return (
    <div
      className="bi-copy text-xl text-neutral btn btn-sm btn-square btn-ghost"
      onClick={() => {
        try {
          navigator.clipboard.writeText(text).then(() => {
            const copyIcon = document.querySelector(".bi-copy");
            if (copyIcon) {
              copyIcon.classList.remove("bi-copy");
              copyIcon.classList.add("bi-check2");
              copyIcon.classList.add("text-success");
            }
            setTimeout(() => {
              if (copyIcon) {
                copyIcon.classList.remove("bi-check2");
                copyIcon.classList.remove("text-success");
                copyIcon.classList.add("bi-copy");
              }
            }, 1000);
          });
        } catch (err) {
          console.log(err);
        }
      }}
    ></div>
  );
};

export default CopyButton;
