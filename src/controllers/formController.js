import { prisma } from "../prisma.js";
import { formCreateSchema, formUpdateSchema } from "../utils/validation.js";

export async function getAllForms(req, res, next) {
  try {
    const forms = await prisma.form.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        questions: { select: { id: true, text: true, type: true } },
      },
    });
    res.json(forms);
  } catch (error) {
    next(error);
    console.log(error);
  }
}

export async function getFormById(req, res, next) {
  try {
    const { id } = req.params;
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        questions: { include: { options: true } },
      },
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    next(error);
  }
}

export async function createForm(req, res, next) {
  try {
    const data = formCreateSchema.parse(req.body);
    const { questions, ...formData } = data;

    const form = await prisma.form.create({
      data: {
        ...formData,
        creatorId: req.user.id,
        questions: {
          create: questions?.map((q) => ({
            text: q.text,
            type: q.type,
            required: q.required,
            options: {
              create: q.options?.map((text) => ({ text })),
            },
          })),
        },
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        questions: { include: { options: true } },
      },
    });

    res.status(201).json(form);
  } catch (error) {
    next(error);
  }
}

export async function updateForm(req, res, next) {
  try {
    const { id } = req.params;
    const data = formUpdateSchema.parse(req.body);

    const existing = await prisma.form.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (existing.creatorId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const form = await prisma.form.update({
      where: { id },
      data,
      include: { creator: { select: { id: true, name: true, email: true } } },
    });

    res.json(form);
  } catch (error) {
    next(error);
  }
}

export async function deleteForm(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.form.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (existing.creatorId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.form.delete({ where: { id } });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
