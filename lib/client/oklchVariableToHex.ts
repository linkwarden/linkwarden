import Color from "colorjs.io";

const oklchVariableToHex = (variable: string): string => {
  const rootStyle = getComputedStyle(document.documentElement);
  const rawColor = rootStyle.getPropertyValue(variable).trim();
  const oklchColor = `oklch(${rawColor})`;
  const hexColor = new Color(oklchColor)
    .toGamut({ space: "srgb" })
    .to("srgb")
    .toString({ format: "hex" });
  console.log(hexColor);
  return hexColor;
};

export default oklchVariableToHex;
