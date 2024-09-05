import React, { forwardRef } from "react";
import * as Icons from "@phosphor-icons/react";

type Props = {
  icon: string;
} & Icons.IconProps;

const Icon = forwardRef<SVGSVGElement, Props>(({ icon, ...rest }, ref) => {
  const IconComponent: any = Icons[icon as keyof typeof Icons];

  if (!IconComponent) {
    return null;
  } else return <IconComponent ref={ref} {...rest} />;
});

Icon.displayName = "Icon";

export default Icon;
