export const handleInputStart = async (clientName, message, option, nextNode) => {
    const inputKeys = Object.keys(option.inputs || {});
    if (inputKeys.length === 0) {
        await changeUserData(clientName, message.from, "currentNode", null);
        return "⚠ No hay campos definidos para esta consulta.";
    }

    await changeUserData(clientName, message.from, "inputFlow", JSON.stringify({
        keys: inputKeys,
        index: 0,
        values: {}
    }));

    return option.inputs[inputKeys[0]].prompt;
};

export const handleInputProgress = async (client, clientName, message, session, option) => {
    const { keys, index, values } = session.inputFlow;
    const currentKey = keys[index];
    const currentField = option.inputs?.[currentKey];

    if (!currentField) {
        await changeUserData(clientName, message.from, "inputFlow", null);
        return "⚠ Campo no definido. Se canceló la carga.";
    }

    const inputValue = message.body.trim();
    const updatedValues = { ...values, [currentKey]: inputValue };

    if (currentField.required && !inputValue) {
        return `⚠ Este campo es obligatorio: ${currentField.prompt}`;
    }

    if (index + 1 < keys.length) {
        await changeUserData(clientName, message.from, "inputFlow", JSON.stringify({
            keys,
            index: index + 1,
            values: updatedValues
        }));

        const nextKey = keys[index + 1];
        const nextPrompt = option.inputs?.[nextKey]?.prompt;
        return nextPrompt || "⚠ Siguiente campo no definido.";
    }

    await changeUserData(clientName, message.from, "inputFlow", null);
    await changeUserData(clientName, message.from, "currentNode", null);

    const resumen = Object.entries(updatedValues)
        .map(([k, v]) => `*${k}*: ${v}`)
        .join("\n");

    return `✅ Datos recibidos:\n\n${resumen}\n\nGracias por tu consulta.`;
};