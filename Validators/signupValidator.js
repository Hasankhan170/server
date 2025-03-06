import { z } from "zod"

const signupValidator = z.object({
    name: z
        .string()
        .nonempty("Name is required.")
        .min(3, "Name must be at least 3 characters.")
        .max(30, "Name must be less than 30 characters."),
    email: z
        .string()
        .nonempty("Email is required.")
        .email("Invalid email format."),
    password: z
        .string()
        .nonempty("Password is required .")
        .min(3, "Password must be at least 3 characters.")
})

export default signupValidator