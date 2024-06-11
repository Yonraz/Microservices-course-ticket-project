import mongoose from "mongoose";
import { kafkaWrapper } from "../../../kafka-wrapper";
import { Order } from "../../../models/Order";
import { Ticket } from "../../../models/Ticket";
import { ExpirationCompleteConsumer } from "../ExpirationCompleteConsumer";
import {
  ExpirationCompleteEvent,
  OrderStatus,
  Topics,
} from "@yonraztickets/common";
import { EachMessagePayload } from "kafkajs";

const setup = async () => {
  const consumer = new ExpirationCompleteConsumer(kafkaWrapper.client);

  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: "pat metheny",
    price: 20,
  });
  await ticket.save();
  const order = Order.build({
    userId: "asdad",
    status: OrderStatus.Created,
    expiresAt: new Date(),
    ticket,
  });
  await order.save();

  const data: ExpirationCompleteEvent["data"] = {
    orderId: order.id,
  };

  const message: EachMessagePayload = {
    //@ts-ignore
    message: {
      offset: "1",
    },
    topic: Topics.ExpirationComplete,
    partition: 0,
  };

  return { consumer, data, message, order, ticket };
};

it("updates the order status to cancelled", async () => {
  const { consumer, data, message, order } = await setup();

  await consumer.onMessage(data, message);

  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it("emits an OrderCancelled event", async () => {
  const { consumer, data, message, order } = await setup();

  await consumer.onMessage(data, message);

  expect(kafkaWrapper.client.producer().send).toHaveBeenCalled();
});
