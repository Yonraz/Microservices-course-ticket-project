import express, { Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import {
  NotFoundError,
  UnauthorizedAccessError,
  requireAuth,
  validateRequest,
} from "@yonraztickets/common";
import { Ticket } from "../models/Ticket";

const router = express.Router();

router.put(
  "/api/tickets/:id",
  requireAuth,
  [
    body("title").not().isEmpty().withMessage("Title is required"),
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than 0"),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      throw new NotFoundError();
    }
    if (ticket.userId !== req.currentUser!.id) {
      throw new UnauthorizedAccessError();
    }
    ticket.set({
      title: req.body.title,
      price: req.body.price,
    });
    await ticket.save();
    res.send(ticket);
  }
);

export { router as updateTicketRouter };