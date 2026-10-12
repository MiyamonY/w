import htmx from "htmx.org";

htmx.defineExtension("json-enc-typed", {
  onEvent: (name, event) => {
    if (name === "htmx:configRequest") event.detail.headers["Content-Type"] = "application/json";
    return true;
  },
  encodeParameters: (xhr, parameters, elt) => {
    xhr.overrideMimeType("text/json");
    const body: Record<string, unknown> = {};
    for (const [name, value] of parameters) {
      const input =
        elt instanceof Element
          ? elt.querySelector<HTMLInputElement>(`[name="${CSS.escape(name)}"]`)
          : null;
      body[name] = input?.type === "number" && value !== "" ? Number(value) : value;
    }
    return JSON.stringify(body);
  },
});
