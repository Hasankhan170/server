const validateData = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body)
            next()
        } catch (error) {
            return res.status(400).json({
                message: "Validation error",
                success: false,
                errors: error.errors[0].message || "Something went wrong!"
            })
        }
    }
}

export default validateData