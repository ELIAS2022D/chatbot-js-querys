const getKeywordHint = (normalizedText, client) => {
    for (const [optionKey, keywordList] of Object.entries(client.keywords || {})) {
        const match = keywordList.some((keyword) =>
            normalizedText.includes(keyword.toLowerCase())
        );

        if (match && client.menu.options[optionKey]) {
            return client.menu.options[optionKey].hint;
        }
    }

    return null;
};

export default getKeywordHint;