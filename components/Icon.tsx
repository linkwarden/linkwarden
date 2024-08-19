import React, { forwardRef } from "react";
import * as Icons from "@phosphor-icons/react";

type Props = {
  icon: string;
} & Icons.IconProps;

const Icon = forwardRef<SVGSVGElement, Props>(({ icon, ...rest }) => {
  const IconComponent: any = Icons[icon as keyof typeof Icons];

  if (!IconComponent) {
    return <></>;
  } else return <IconComponent {...rest} />;
});

export default Icon;
