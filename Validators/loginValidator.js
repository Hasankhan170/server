import { z } from "zod"

const loginValidator = z.object({
    email: z
        .string()
        .nonempty("Email is required.")
        .email("Invalid email format.")
        .min(3, "email must be at least 3 characters.")
        .max(255, "email must be less than 255 characters."),
    password: z
        .string()
        .nonempty("Password is required.")
        .min(6, "Password must be at least 6 characters.")
        .max(50, "Password must be less than 50 characters.")
})

export default loginValidator