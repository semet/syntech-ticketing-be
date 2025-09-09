export const handleError = (error, c) => {
    // eslint-disable-next-line no-console
    console.error('Error occurred:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
};
//# sourceMappingURL=handle-error.js.map