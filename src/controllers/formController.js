import { prisma } from "../prisma.js";
import {
  formCreateSchema,
  formUpdateSchema,
  submissionSchema,
} from "../utils/validation.js";

export async function getAllForms(req, res, next) {
  try {
    const { title, status, sortBy, creatorId } = req.query;

    const where = {};

    if (title) {
      where.title = { contains: title, mode: "insensitive" };
    }

    if (creatorId === "me" && req.user) {
      where.creatorId = req.user.id;
      if (status) {
        where.status = status;
      }
    } else {
      where.status = "PUBLISHED";
    }

    const orderBy = {};
    if (sortBy === "updatedAt") {
      orderBy.updatedAt = "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const forms = await prisma.form.findMany({
      where,
      orderBy,
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

    if (form.status === "DRAFT") {
      if (!req.user || form.creatorId !== req.user.id) {
        return res.status(404).json({ message: "Form not found" });
      }
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
        status: "DRAFT",
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
    const { questions, ...formData } = data;

    const existing = await prisma.form.findUnique({
      where: { id },
      include: { submissions: { select: { id: true } } },
    });

    if (!existing) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (existing.creatorId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Constraint: Cannot modify questions if submissions exist
    if (questions && existing.submissions.length > 0) {
      return res.status(400).json({
        message: "Cannot modify questions because the form has submissions",
      });
    }

    // Transaction to handle updates
    const form = await prisma.$transaction(async (tx) => {
      // 1. Update form details
      await tx.form.update({
        where: { id },
        data: formData,
      });

      // 2. Handle questions if provided
      if (questions) {
        // Delete existing questions (simple replacement strategy)
        // Note: This changes IDs. For a more robust solution, we would diff.
        // But for this assignment, replacing is acceptable unless we need to preserve question IDs for stats.
        // Given we check for submissions first, changing IDs is safe because there are no answers linked to old IDs.
        await tx.question.deleteMany({ where: { formId: id } });

        for (const q of questions) {
          await tx.question.create({
            data: {
              formId: id,
              text: q.text,
              type: q.type,
              required: q.required,
              options: {
                create: q.options?.map((text) => ({ text })),
              },
            },
          });
        }
      }

      return tx.form.findUnique({
        where: { id },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          questions: { include: { options: true } },
        },
      });
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

export async function submitResponse(req, res, next) {
  try {
    const { id } = req.params;
    const { answers } = submissionSchema.parse(req.body);

    const form = await prisma.form.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (form.status !== "PUBLISHED") {
      return res.status(400).json({ message: "Form is not accepting responses" });
    }

    // Validate that all required questions are answered
    const questionMap = new Map(form.questions.map((q) => [q.id, q]));
    for (const ans of answers) {
      if (!questionMap.has(ans.questionId)) {
        return res
          .status(400)
          .json({ message: `Invalid question ID: ${ans.questionId}` });
      }
    }

    for (const q of form.questions) {
      if (q.required) {
        const provided = answers.find((a) => a.questionId === q.id);
        if (!provided || !provided.value.trim()) {
          return res
            .status(400)
            .json({ message: `Question "${q.text}" is required` });
        }
      }
    }

    const submission = await prisma.submission.create({
      data: {
        formId: id,
        answers: {
          create: answers.map((a) => ({
            questionId: a.questionId,
            value: a.value,
          })),
        },
      },
      include: { answers: true },
    });

    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
}

export async function getFormResponses(req, res, next) {
  try {
    const { id } = req.params;
    const form = await prisma.form.findUnique({ where: { id } });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (form.creatorId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const submissions = await prisma.submission.findMany({
      where: { formId: id },
      include: {
        answers: {
          include: { question: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    res.json(submissions);
  } catch (error) {
    next(error);
  }
}
