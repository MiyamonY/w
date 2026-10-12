import htmx from "htmx.org";

htmx.defineExtension("json-enc-typed", {
  onEvent: (name, event) => {
    if (name === "htmx:configRequest") event.detail.headers["Content-Type"] = "application/json";
    return true;
  },
  encodeParameters: (xhr, parameters, elt) => {
    xhr.overrideMimeType("text/json");
    const body: Record<string, unknown> = {};
    const inputOf = (name: string) =>
      elt instanceof Element
        ? elt.querySelector<HTMLInputElement>(`[name="${CSS.escape(name)}"]`)
        : null;
    for (const [name, value] of parameters) {
      body[name] = inputOf(name)?.type === "number" && value !== "" ? Number(value) : value;
    }
    if (elt instanceof Element) {
      for (const checkbox of elt.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"][name]',
      )) {
        body[checkbox.name] = checkbox.checked;
      }
    }
    return JSON.stringify(body);
  },
});
