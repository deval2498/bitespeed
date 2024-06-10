import { Request, Response } from 'express';
import { PrismaClient, Customer, Contact } from '@prisma/client';

const prisma = new PrismaClient();

function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const identifyContact = async (req: Request, res: Response): Promise<Response> => {
  const { email, phoneNumber }: { email?: string; phoneNumber?: number } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).send("Email or phone number is required");
  }

  if (email && !isEmailValid(email)) {
    return res.status(400).send('Invalid email format');
  }

  try {
    const conditions: Array<{ emails?: { has: string }; phoneNumbers?: { has: number } }> = [];
    let customers: Customer[] = [];

    if (email) {
      conditions.push({
        emails: {
          has: email,
        },
      });
    }

    if (phoneNumber) {
      conditions.push({
        phoneNumbers: {
          has: phoneNumber,
        },
      });
    }

    if (conditions.length !== 0) {
      customers = await prisma.customer.findMany({
        where: {
          OR: conditions,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }

    if (customers.length === 0) {
      const newContact: Contact = await prisma.contact.create({
        data: {
          email: email || null,
          phoneNumber: phoneNumber || null,
          linkPrecedence: "primary",
        },
      });

      const emailsArray: string[] = newContact.email ? [newContact.email] : [];
      const phoneNumbersArray: number[] = newContact.phoneNumber ? [newContact.phoneNumber] : [];

      const newCustomer: Customer = await prisma.customer.create({
        data: {
          primaryContactId: newContact.id,
          emails: emailsArray,
          phoneNumbers: phoneNumbersArray,
          secondaryContactIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const { id, createdAt, updatedAt, ...customerWithoutId } = newCustomer;
      return res.status(200).json({
        contact: customerWithoutId,
      });
    }

    if (customers.length === 2) {
      const [olderCustomer, newerCustomer] = customers;

      await prisma.contact.update({
        where: { id: newerCustomer.primaryContactId },
        data: {
          linkedId: olderCustomer.primaryContactId,
          linkPrecedence: "secondary",
        },
      });

      for (const secondaryContactId of newerCustomer.secondaryContactIds) {
        await prisma.contact.update({
          where: { id: secondaryContactId },
          data: {
            linkedId: olderCustomer.primaryContactId,
            linkPrecedence: "secondary",
          },
        });
      }

      const updatedOlderCustomer: Customer = await prisma.customer.update({
        where: { id: olderCustomer.id },
        data: {
          emails: [...olderCustomer.emails, ...newerCustomer.emails],
          phoneNumbers: [...olderCustomer.phoneNumbers, ...newerCustomer.phoneNumbers],
          secondaryContactIds: [
            ...olderCustomer.secondaryContactIds,
            newerCustomer.primaryContactId,
            ...newerCustomer.secondaryContactIds,
          ],
        },
      });

      await prisma.customer.delete({
        where: { id: newerCustomer.id },
      });

      const { id, createdAt, updatedAt, ...customerWithoutId } = updatedOlderCustomer;
      return res.status(200).json({
        contacts: customerWithoutId,
      });
    }

    const emailExists = email ? customers[0].emails.includes(email) : true;
    const phoneNumberExists = phoneNumber ? customers[0].phoneNumbers.includes(phoneNumber) : true;

    if (emailExists && phoneNumberExists) {
      const { id, createdAt, updatedAt, ...customerWithoutId } = customers[0];
      return res.status(200).json({
        contacts: customerWithoutId,
      });
    }

    if (emailExists) {
      const newContact: Contact = await prisma.contact.create({
        data: {
          email: null,
          phoneNumber: phoneNumber || null,
          linkPrecedence: "secondary",
          linkedId: customers[0].primaryContactId,
        },
      });

      const updatedCustomer: Customer = await prisma.customer.update({
        where: { id: customers[0].id },
        data: {
          phoneNumbers: [...customers[0].phoneNumbers, phoneNumber as number],
          secondaryContactIds: [...customers[0].secondaryContactIds, newContact.id],
        },
      });

      const { id, createdAt, updatedAt, ...customerWithoutId } = updatedCustomer;
      return res.status(200).json({
        contacts: customerWithoutId,
      });
    }

    if (phoneNumberExists) {
      const newContact: Contact = await prisma.contact.create({
        data: {
          email: email || null,
          phoneNumber: null,
          linkPrecedence: "secondary",
          linkedId: customers[0].primaryContactId,
        },
      });

      const updatedCustomer: Customer = await prisma.customer.update({
        where: { id: customers[0].id },
        data: {
          emails: [...customers[0].emails, email as string],
          secondaryContactIds: [...customers[0].secondaryContactIds, newContact.id],
        },
      });

      const { id, createdAt, updatedAt, ...customerWithoutId } = updatedCustomer;
      return res.status(200).json({
        contacts: customerWithoutId,
      });
    }

    return res.status(400).send("No matching conditions found");
  } catch (error) {
    console.error('Error identifying contact:', error);
    return res.status(500).send("An error occurred while identifying the contact");
  }
};
