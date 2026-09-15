"use client";

import "./swagger-ui-dark.scss";

import SwaggerUI from "swagger-ui-react";

interface Props {
  spec: string;
}

export default ({ spec }: Props) => {
  return <SwaggerUI spec={spec} />;
};
