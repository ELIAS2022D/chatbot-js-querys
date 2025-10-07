export const getNestedValue = (obj, pathString) => {
    const keys = pathString.split(".");

    return keys.reduce((acc, key, index) => {
        if (!acc || acc[key] === undefined) return undefined;

        const next = acc[key];
        const isLast = index === keys.length - 1;
        return !isLast && next.type === "submenu" ? next.options : next;
    }, obj);
};

export const showOptions = (options) => {
    if (!options) return "⚠ Este cliente no tiene opciones configuradas.";

    const hints = Object.entries(options)
        .map(([key, opt]) => opt?.hint)
        .filter(Boolean);

    return hints.join("\n");
};