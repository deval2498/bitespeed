import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const identifyContact = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).send("Email or phone number is required");
  }

  let contacts;
  if (email && phoneNumber) {
    contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { email: email },
          { phoneNumber: phoneNumber }
        ]
      }
    });
  } else if (email) {
    contacts = await prisma.contact.findMany({
      where: { email: email }
    });
  } else {
    contacts = await prisma.contact.findMany({
      where: { phoneNumber: phoneNumber }
    });
  }

  let primaryContact;
  let secondaryContacts = [];
  let emails = [];
  let phoneNumbers = [];
  
  if (contacts.length > 0) {
    primaryContact = contacts[0];
    emails.push(primaryContact.email);
    phoneNumbers.push(primaryContact.phoneNumber);
    for (let i = 1; i < contacts.length; i++) {
      secondaryContacts.push(contacts[i].id);
      if (contacts[i].email && !emails.includes(contacts[i].email)) {
        emails.push(contacts[i].email);
      }
      if (contacts[i].phoneNumber && !phoneNumbers.includes(contacts[i].phoneNumber)) {
        phoneNumbers.push(contacts[i].phoneNumber);
      }
    }
  } else {
    primaryContact = await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: "primary",
      }
    });
    emails.push(email);
    phoneNumbers.push(phoneNumber);
  }

  return res.status(200).json({
    contact: {
      primaryContactId: primaryContact.id,
      emails: emails,
      phoneNumbers: phoneNumbers,
      secondaryContactIds: secondaryContacts
    }
  });
};
