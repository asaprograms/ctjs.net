"use client";

import type { PublicModule } from "app/api";

import ModuleForm from "../../ModuleForm";

interface Props {
  targetModule: PublicModule;
  availableTags: string[];
}

export default function EditModuleComponent({ targetModule, availableTags }: Props) {
  const onSubmit = async (formData: FormData) => {
    const response = await fetch(`/api/modules/${targetModule.name}`, {
      method: "PATCH",
      body: formData,
    });

    if (response.ok) return;

    const body = (await response.body?.getReader().read())?.value;
    if (body) return new TextDecoder().decode(body);

    return "Unknown error occurred";
  };

  return (
    <ModuleForm editingModule={targetModule} availableTags={availableTags} onSubmit={onSubmit} />
  );
}
