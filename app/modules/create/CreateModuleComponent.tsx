"use client";

import ModuleForm from "../ModuleForm";

interface Props {
  availableTags: string[];
}

export default function CreateModuleComponent({ availableTags }: Props) {
  const onSubmit = async (formData: FormData) => {
    const response = await fetch("/api/modules", {
      method: "PUT",
      body: formData,
    });

    if (response.ok) return;

    const body = (await response.body?.getReader().read())?.value;
    if (body) return new TextDecoder().decode(body);

    return "Unknown error occurred";
  };

  return <ModuleForm availableTags={availableTags} onSubmit={onSubmit} />;
}
