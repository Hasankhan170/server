export const successHandler = (message, statusCode, res, data = null) => {
    return res.status(statusCode).json({ success: true, message, data });
};

export const errorHandler = (message, statusCode, res) => {
    return res.status(statusCode).json({ success: false, message });
};