"use client";

import IndigoLaboratoryApp from "../../../../3/src/App";

type Props = {
  config: Record<string, string | number | boolean>;
};

export default function IndigoLaboratoryDemo({ config: _config }: Props) {
  return (
    <div className="indigo-laboratory-stage">
      <IndigoLaboratoryApp />
    </div>
  );
}
