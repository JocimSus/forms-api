import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { signToken } from "../utils/jwt.js";
import { registerSchema, loginSchema } from "../utils/validation.js";

export async function register(req, res, next) {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: passwordHash },
      select: { id: true, name: true, email: true },
    });

    return res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({ sub: user.id });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
}
